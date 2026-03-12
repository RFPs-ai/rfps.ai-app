import { chromium, BrowserContext, Page } from "playwright";
import { JSDOM } from "jsdom";
import {
  dedupAndStore,
  closeStore,
  Tender,
} from "../dedupe_and_testing/dedupe-pipeline";

/**
 * IMPORTANT NOTE:
 *   This crawler requires Playwright and cannot run on Vercel serverless.
 *   Use admin trigger or local run only.
 *
 * Run:
 *   npx tsx lib/crawlers/merx-crawl.ts
 */

const LIST_URL =
  "https://www.merx.com/public/solicitations/open?";

const MAX_LISTING_PAGES = 1;
const MAX_TENDERS = 5;

function clean(s?: string | null) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

async function tryAcceptCookies(page: Page) {
  const selectors = [
    "#onetrust-accept-btn-handler",
    "button:has-text('Accept')",
    "button:has-text('Accept All')",
    "button:has-text('I Accept')",
    "button:has-text('Allow All')",
  ];

  for (const selector of selectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1200 })) {
        await btn.click();
        await page.waitForTimeout(500);
        return;
      }
    } catch {
        // ignore
      }
  }
}

function extractFields(doc: Document): Record<string, string> {
  const out: Record<string, string> = {};

  const fields = Array.from(doc.querySelectorAll(".mets-field"));

  for (const field of fields) {
    const label = clean(field.querySelector(".mets-field-label")?.textContent);
    const value = clean(field.querySelector(".mets-field-body")?.textContent);

    if (!label || !value) continue;
    out[label] = value;
  }

  return out;
}

function parseRegion(location?: string): string | undefined {
  if (!location) return undefined;

  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 2) return parts[1];
  return parts[0];
}

function parseContacts(doc: Document): { name: string; email?: string; phone?: string }[] {
  const contacts: { name: string; email?: string; phone?: string }[] = [];

  const headings = Array.from(doc.querySelectorAll("h3"));
  const contactHeading = headings.find(
    (h) => clean(h.textContent).toLowerCase() === "contact information"
  );

  if (!contactHeading) return contacts;

  const container = contactHeading.nextElementSibling;
  if (!container || !container.classList.contains("twoColFields")) {
    return contacts;
  }

  const blocks = Array.from(container.querySelectorAll(".mets-field-body"))
    .map((el) => clean(el.textContent))
    .filter(Boolean);

  let pendingName: string | undefined;

  for (const block of blocks) {
    const emailMatch = block.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phoneMatch = block.match(
  /(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?/i
);

    const lines = block
      .split(/\n/)
      .map((s) => clean(s))
      .filter(Boolean);

    // case 1: phone-only block, attach to previous contact if possible
    if (phoneMatch && !emailMatch && lines.length === 1 && !/[A-Za-z]/.test(lines[0].replace(phoneMatch[0], ""))) {
      if (contacts.length) {
        contacts[contacts.length - 1].phone = phoneMatch[0];
      }
      continue;
    }

    // case 2: name + email in same block
    if (emailMatch) {
      const email = emailMatch[0];
      const name = clean(block.replace(email, "")) || pendingName || "Unknown";
      contacts.push({ name, email });
      pendingName = undefined;
      continue;
    }

    // case 3: just a name, hold it temporarily
    if (!phoneMatch) {
      pendingName = block;
      continue;
    }

    // case 4: name + phone in same block
    if (phoneMatch) {
      const phone = phoneMatch[0];
      const name = clean(block.replace(phone, "")) || pendingName || "Unknown";
      contacts.push({ name, phone });
      pendingName = undefined;
    }
  }

  // remove duplicates
  const seen = new Set<string>();
  return contacts.filter((c) => {
    const key = `${(c.name || "").toLowerCase()}|${(c.email || "").toLowerCase()}|${(c.phone || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function parseCategoriesFromPage(page: Page): Promise<string[]> {
  const tabCandidates = [
    "text=Categories",
    "button:has-text('Categories')",
    "a:has-text('Categories')",
  ];

  for (const selector of tabCandidates) {
    try {
      const tab = page.locator(selector).first();
      if (await tab.isVisible({ timeout: 1000 })) {
        await tab.click();
        await page.waitForTimeout(1200);
        break;
      }
    } catch {
      // ignore
    }
  }

  await page.locator("td.categoryName").first().waitFor({
    state: "attached",
    timeout: 10000,
  });

  await page.waitForFunction(() => {
    const cells = Array.from(document.querySelectorAll("td.categoryName"));
    const values = cells
      .map((c) => (c.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);

    return values.some((v) => v.toLowerCase() !== "loading...");
  }, { timeout: 10000 });

  const raw = await page.$$eval("td.categoryName", (nodes) =>
    nodes
      .map((n) => (n.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
  );

  const cleaned = raw
    .map((s) => s.replace(/\bLoading\.\.\.\b/gi, "").trim())
    .filter((s) => s && s.toLowerCase() !== "loading...")
    .map((s) => {
      const parts = s.split(/\s+/);
      const half = Math.floor(parts.length / 2);
      if (
        parts.length % 2 === 0 &&
        parts.slice(0, half).join(" ").toLowerCase() ===
          parts.slice(half).join(" ").toLowerCase()
      ) {
        return parts.slice(0, half).join(" ");
      }
      return s;
    });

  return [...new Set(cleaned)];
}

export function parseMerxDetail(html: string, url: string): Tender {
  const doc = new JSDOM(html).window.document;
  const fields = extractFields(doc);

  const referenceNumber = fields["Reference Number"];
  const issuingOrganization = fields["Issuing Organization"];
  const ownerOrganization = fields["Owner Organization"];
  const solicitationType = fields["Solicitation Type"];
  const solicitationNumber = fields["Solicitation Number"];
  const sourceIdField = fields["Source ID"];
  const title = fields["Title"] || clean(doc.querySelector("h1")?.textContent) || "Unknown Title";
  const location = fields["Location"];
  const description = fields["Description"];

  const region = parseRegion(location);
  const buyerName = issuingOrganization || ownerOrganization || undefined;

  const sourceId =
    sourceIdField ||
    solicitationNumber ||
    referenceNumber ||
    new URL(url).pathname.split("/").pop() ||
    url;

  const contacts = parseContacts(doc);
  const dueDate = fields["Closing Date"];

  return {
    source: "merx",
    sourceId,
    sourceUrl: url,
    title,

    bidNumber: solicitationNumber || referenceNumber || undefined,
    bidType: solicitationType || undefined,
    dueDate,
    description,
    status: undefined,

    classification: undefined,
    buyerName,
    region,
    documents: [],
    contacts,
    category: [],
    language: undefined,
  };
}

async function scrapeTender(
  context: BrowserContext,
  url: string
): Promise<Tender> {
  const page = await context.newPage();
  console.log("Scraping tender:", url);

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForTimeout(1500);
    await tryAcceptCookies(page);

    await page.locator(".mets-field").first().waitFor({
      state: "attached",
      timeout: 15000,
    });

    const noticeHtml = await page.content();
    const tender = parseMerxDetail(noticeHtml, url);

    try {
      tender.category = await parseCategoriesFromPage(page);
    } catch (err) {
      console.log("CATEGORY PARSE FAILED");
      console.error(err);
      tender.category = [];
    }

    return tender;
  } finally {
    await page.close();
  }
}

async function getTenderLinks(page: Page): Promise<string[]> {
  console.log("Loading listing page...");
  await page.goto(LIST_URL, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });

  await page.waitForTimeout(1500);
  await tryAcceptCookies(page);

  if (/\/solicitations\/.+\/\d+(\?|$)/i.test(page.url())) {
    return [page.url()];
  }

  const allLinks = new Set<string>();
  let pageNum = 1;

  while (pageNum <= MAX_LISTING_PAGES) {
    console.log(`\nScraping listing page ${pageNum}...`);

    await page.locator("a[href*='/solicitations/open-bids/']").first().waitFor({
  state: "attached",
  timeout: 15000,
});

const links = await page.$$eval(
  "a[href*='/solicitations/open-bids/']",
  (anchors: Element[]) => {
    return anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) =>
        /\/solicitations\/open-bids\/.+\/\d+(\?|$)/i.test(href)
      );
  }
);

    console.log(`Found ${links.length} links`);
    links.forEach((l) => allLinks.add(l));

    const nextSelectors = [
      "a[aria-label='Next']",
      "button[aria-label='Next']",
      "text=Next",
    ];

    let advanced = false;

    for (const selector of nextSelectors) {
      try {
        const nextBtn = page.locator(selector).first();

        if (!(await nextBtn.isVisible({ timeout: 1000 }))) continue;

        const disabled =
          (await nextBtn.getAttribute("disabled")) !== null ||
          (await nextBtn.getAttribute("aria-disabled")) === "true";

        if (disabled) break;

        console.log("Clicking Next...");
        await Promise.all([
          page.waitForLoadState("domcontentloaded").catch(() => {}),
          nextBtn.click(),
        ]);

        await page.waitForTimeout(1500);
        advanced = true;
        break;
      } catch {
      }
    }

    if (!advanced) break;
    pageNum++;
  }

  const finalLinks = [...allLinks];
  console.log(`\nTOTAL TENDERS COLLECTED: ${finalLinks.length}`);
  return finalLinks;
}

export async function crawlMerxAndStore() {
  await run();
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    viewport: { width: 1440, height: 1000 },
  });

  const page = await context.newPage();

  try {
    const links = await getTenderLinks(page);
    console.log(`\nCollected ${links.length} tender URLs\n`);

    const limitedLinks = links.slice(0, MAX_TENDERS);

    for (let i = 0; i < limitedLinks.length; i++) {
      const url = limitedLinks[i];
      console.log(`\n[${i + 1}/${limitedLinks.length}] Scraping: ${url}`);

      try {
        const tender = await scrapeTender(context, url);

        console.log("SCRAPED TENDER:");
        console.dir(tender, { depth: null });

        const status = await dedupAndStore(tender);
        console.log("DEDUP STATUS:", status);
      } catch (err) {
        console.log("Failed:", url);
        console.error("DEDUP ERROR:", err);
      }
    }
  } finally {
    await browser.close();
    await closeStore();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});