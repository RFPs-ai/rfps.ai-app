import { chromium } from "playwright";
import { dedupAndStore, closeStore, Tender } from "../dedupe_and_testing/dedupe-pipeline";

const LIST_URL = "https://www.bidsandtenders.com/bid-opportunities/";

// listing pages to search through.

const MAX_LISTING_PAGES = 1;


function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function extractAfter(text: string, label: string): string | undefined {
  const idx = text.toLowerCase().indexOf(label.toLowerCase());
  if (idx === -1) return undefined;

  // everything after the label
  const rest = text.slice(idx + label.length);

  // headings that mark the start of the next section.
  // stop as soon as we find the next heading.
  const stops = [
    "bid classification:",
    "bid type:",
    "bid number:",
    "bid name:",
    "bid status:",
    "bid closing date:",
    "electronic auctions:",
    "language for bid submissions:",
    "submission type:",
    "submission address:",
    "public opening:",
    "description:",
    "bid document access:",
    "categories:",
    "documents",
    "purchasing representatives",
  ];

  let end = rest.length;
  for (const stop of stops) {
    const i = rest.toLowerCase().indexOf(stop);
    if (i !== -1 && i < end) end = i;
  }

  return clean(rest.slice(0, end));
}

function inferRegionFromUrl(url: string): string | undefined {
  const match = url.match(
    /^https?:\/\/([a-z0-9-]+)\.bidsandtenders\.(ca|net)\//i
  );

  if (!match) return undefined;

  // return the subdomain directly as the region
  return match[1].toLowerCase();
}

async function scrapeTender(context: any, url: string): Promise<Tender> {
  const page = await context.newPage();
  console.log("Scraping tender:", url);

  await page.goto(url, { waitUntil: "networkidle" });

  await page.waitForTimeout(1500);

  const downloadBtn = page.locator("text=Download Bid");
  if ((await downloadBtn.count()) > 0) {
    console.log("Opening documents panel...");
    await downloadBtn.first().click();
  }

  let documents: { name: string }[] = [];
  try {
    console.log("Waiting for documents...");
    await page.waitForSelector("#dgDocuments", { timeout: 10000 });

    await page.waitForFunction(
      () =>
        document.querySelectorAll("#dgDocuments .x-grid3-cell-inner strong")
          .length > 0,
      { timeout: 10000 }
    );

    // extract document names
    documents = await page.$$eval(
      "#dgDocuments .x-grid3-cell-inner strong",
      (nodes: Element[]) =>
        nodes.map((n) => ({
          name: (n.textContent || "").replace(/\s+/g, " ").trim(),
        }))
    );
  } catch {
    // many postings have no documents grid or it may not load—this is fine.
    documents = [];
  }

  const pageText = await page.$eval("body", (el: Element) => el.textContent || "");
  const cleanText = clean(pageText);

  const title =
    extractAfter(cleanText, "Bid Name:") ||
    clean(await page.title()) ||
    "Unknown Title";

  const classification = extractAfter(cleanText, "Bid Classification:");
  const bidType = extractAfter(cleanText, "Bid Type:");
  const bidNumber = extractAfter(cleanText, "Bid Number:");
  const status = extractAfter(cleanText, "Bid Status:");
  const dueDate = extractAfter(cleanText, "Bid Closing Date:");
  const description = extractAfter(cleanText, "Description:");

  const buyerOrg =
    extractAfter(cleanText, "Organization:") || extractAfter(cleanText, "Buyer:");

  const languageRaw = extractAfter(cleanText, "Language for bid submissions:");
  let language: "EN" | "FR" | undefined;

  if (languageRaw) {
    const l = languageRaw.toLowerCase();
    if (l.includes("english")) language = "EN";
    else if (
      l.includes("french") ||
      l.includes("français") ||
      l.includes("francais")
    )
      language = "FR";
  }

  // uses bidsandtenders subdomain directly (e.g. "metrovancouver")
  const region = inferRegionFromUrl(url);


  let contacts: { name: string; email?: string }[] = [];

  try {
    contacts = await page.$$eval("a[href^='mailto:']", (links: Element[]) =>
      links.map((a) => {
        const el = a as HTMLAnchorElement;

        const email = el.href.replace(/^mailto:/i, "").split("?")[0].trim();

        let name = (el.textContent || "").replace(/\s+/g, " ").trim();

        const row = el.closest("tr");
        if (row) {
          const cells = Array.from(row.querySelectorAll("td"))
            .map((td) => (td.textContent || "").replace(/\s+/g, " ").trim())
            .filter(Boolean);

          const candidate =
            cells.find((c) => !c.toLowerCase().includes(email.toLowerCase())) ||
            cells[0] ||
            "";

          if (!name || name.includes("@") || name.toLowerCase().includes("mailto")) {
            name = candidate;
          }
        }

        // remove any lingering email text from the name just in case
        name = name
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
          .trim();

        return {
          name: name || "Unknown",
          email,
        };
      })
    );
  } catch {
    contacts = [];
  }

  // if no mailto links were found, parse "Purchasing Representatives" section text
  if (!contacts.length) {
    const rawReps =
      extractAfter(cleanText, "Purchasing Representatives") ||
      extractAfter(cleanText, "Purchasing representatives");

    if (rawReps) {
      const emails = [
        ...new Set(
          rawReps.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
        ),
      ];

      // split section into lines to infer name and email from the same line
      const lines = rawReps
        .split(/\n|•|·|\t/)
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean);

      for (const email of emails) {
        const line = lines.find((l) =>
          l.toLowerCase().includes(email.toLowerCase())
        );

        let name = "Unknown";
        if (line) {
          const candidate = line
            .replace(new RegExp(email, "i"), "")
            .replace(/[|(),;-]+/g, " ")
            .trim();

          if (candidate && candidate.length >= 2) name = candidate;
        }

        contacts.push({ name, email });
      }
    }
  }

  if (!contacts.length) {
    const emails = [
      ...new Set(
        cleanText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
      ),
    ];
    contacts = emails.map((email) => ({ name: "Unknown", email }));
  }

  // remove duplicate contact entries
  const seen = new Set<string>();
  contacts = contacts.filter((c) => {
    const key = `${(c.name || "").toLowerCase()}|${(c.email || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // write the representative names into buyer_name (rfps.buyer_name),
  // build buyerFromReps from the contact names extracted above.
  // if can't find any usable rep names, fall back to the organization name.

  const repNames = contacts
    .map((c) => c.name?.trim())
    .filter((n) => n && n !== "Unknown" && !n.includes("@") && n.length > 2);

  // join multiple reps as "Name1; Name2"
  const buyerFromReps = repNames.length
    ? [...new Set(repNames)].join("; ")
    : undefined;

  const tender: Tender = {
    source: "bids_tenders",

    // prefer bidNumber as a stable source ID; fall back to URL if missing
    sourceId: bidNumber || url,

    sourceUrl: url,
    title,

    classification,
    bidType,
    bidNumber,
    status,
    dueDate,
    description,

    // write representative names into buyer_name
    buyerName: buyerFromReps || buyerOrg || undefined,

    region,
    documents,
    contacts,
    category: [],
    language,
  };

  // categories
  const rawCats = extractAfter(cleanText, "Categories:");
  if (rawCats) {
    const parts = rawCats.split(
      /(?=Supplies \(|Traffic|Signs|Roadside|Services \(|Snow|Light Equipment|Construction-)/gi
    );

    tender.category = [
      ...new Set(parts.map(clean).filter((p) => p.length > 3)),
    ];
  }

  await page.close();
  return tender;
}

async function getTenderLinks(page: any): Promise<string[]> {
  console.log("Loading listing page...");
  await page.goto(LIST_URL, { waitUntil: "networkidle" });

  console.log("Waiting for iframe...");
  await page.waitForSelector("iframe", { timeout: 20000 });

  const frames = page.frames();
  let listingFrame: any = null;

  // locate iframe with the tender listing table
  for (const frame of frames) {
    if (
      frame.url().includes("bidsandtenders") &&
      frame.url().includes("index.aspx")
    ) {
      listingFrame = frame;
      break;
    }
  }

  if (!listingFrame) throw new Error("Could not find bids listing iframe");

  console.log("Switched to iframe:", listingFrame.url());

  const allLinks = new Set<string>();
  let pageNum = 1;

  while (pageNum <= MAX_LISTING_PAGES) {
    console.log(`\nScraping listing page ${pageNum}...`);

    await listingFrame.waitForSelector("#bidsTable", { timeout: 30000 });

    // grab all detail-page links on the current listing page
    const links: string[] = await listingFrame.$$eval(
      "#bidsTable a[href*='/Tender/Detail']",
      (as: Element[]) => as.map((a) => (a as HTMLAnchorElement).href)
    );

    console.log(`Found ${links.length} links`);
    links.forEach((l: string) => allLinks.add(l));

    // find the pagination "Next" button
    const nextBtn = await listingFrame.$("a[aria-label='Next']");
    if (!nextBtn) break;

    // stop if Next is disabled
    const isDisabled = await nextBtn.evaluate((el: Element) => {
      return (
        el.classList.contains("disabled") ||
        el.closest("li")?.classList.contains("disabled")
      );
    });
    if (isDisabled) break;

    console.log("Clicking Next...");

    // click Next and wait for the listing iframe to finish loading
    await Promise.all([
      listingFrame.waitForLoadState("networkidle"),
      nextBtn.click(),
    ]);

    pageNum++;
    await listingFrame.waitForTimeout(1200);
  }

  const finalLinks = [...allLinks];
  console.log(`\nTOTAL TENDERS COLLECTED: ${finalLinks.length}`);
  return finalLinks;
}

// exported function to be called  from elsewhere.

export async function crawlBidsTendersAndStore() {
  await run();
}

async function run() {
  // keep headless:false while debugging; flip to true once stable
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    // mimic a standard desktop browser
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  const links = await getTenderLinks(page);
  console.log(`\nCollected ${links.length} tender URLs\n`);

  for (let i = 0; i < links.length; i++) {
    const url = links[i];
    console.log(`\n[${i + 1}/${links.length}] Scraping: ${url}`);

    try {
      // scrape tender details into a Tender object
      const tender = await scrapeTender(context, url);

      console.log("SCRAPED TENDER:");
      console.dir(tender, { depth: null });

      // dedupe + store (returns "NEW" or "UPDATED")
      const status = await dedupAndStore(tender);
      console.log("DEDUP STATUS:", status);
    } catch (err) {
      // if one tender fails, log it and continue with the rest
      console.log("Failed:", url);
      console.error("DEDUP ERROR:", err);
    }
  }

  await browser.close();
  await closeStore();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
