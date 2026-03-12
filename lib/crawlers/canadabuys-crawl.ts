/**
 * CanadaBuys HTTP crawler
 * Mostly serverless safe: performs a simple session bootstrap (cookies) then calls Drupal Views AJAX endpoint.
 */

import { JSDOM } from "jsdom";
import { dedupAndStore, closeStore, Tender } from "../dedupe_and_testing/dedupe-pipeline";

const LISTING_PAGE_URL = "https://canadabuys.canada.ca/en/tender-opportunities";

const BASE_AJAX_URL =
  "https://canadabuys.canada.ca/en/views/ajax?_wrapper_format=drupal_ajax&view_name=search_opportunities&view_display_id=block_1&view_args=&view_path=%2Fnode%2F10653&view_base_path=&view_dom_id=31f91d2f4934d62f7ed721c8a9b8e755a63652fccf7faf88725f14527e43896a&pager_element=1&_drupal_ajax=1";

type CrawlSummary = {
  new: number;
  updated: number;
  errors: number;
  newIds: string[];
};

function clean(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function makePageUrl(pageNum: number) {
  const url = new URL(BASE_AJAX_URL);
  url.searchParams.set("page", `,${pageNum},0,0`);
  return url.toString();
}

async function bootstrapSession(): Promise<{ cookie: string; userAgent: string }> {
  const userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  const res = await fetch(LISTING_PAGE_URL, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-CA,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Session bootstrap failed: ${res.status}\n${text.slice(0, 400)}`);
  }

  const setCookies: string[] =
    typeof res.headers.getSetCookie === "function"
      ? 
        res.headers.getSetCookie()
      : [];

  const single = res.headers.get("set-cookie");
  if (single && setCookies.length === 0) setCookies.push(single);

  const cookie = setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");

  return { cookie, userAgent };
}


async function fetchListingHtml(pageNum: number, session: { cookie: string; userAgent: string }): Promise<string> {
  const url = makePageUrl(pageNum);

  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": session.userAgent,
      accept: "application/json,text/plain,*/*",
      "accept-language": "en-CA,en;q=0.9",
      "x-requested-with": "XMLHttpRequest",
      referer: LISTING_PAGE_URL,
      origin: "https://canadabuys.canada.ca",
    },
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(`Listing fetch failed: ${res.status}\n${bodyText.slice(0, 400)}`);
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error(`Listing returned non-JSON\n${bodyText.slice(0, 400)}`);
  }

  const commands: any[] = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object"
      ? Object.keys(payload)
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => payload[k])
      : [];

  const html = commands
    .filter((c) => c?.command === "insert" && typeof c?.data === "string")
    .map((c) => c.data as string)
    .join("\n");

  return html;
}


function extractTenderLinks(listingHtml: string): string[] {
  const out = new Set<string>();

  const re =
    /href="([^"]*(?:\/tender-opportunities\/tender-notice\/|\/tender-notice\/)[^"]*)"/g;
  for (let m; (m = re.exec(listingHtml)) !== null; ) {
    const href = m[1];
    const abs = href.startsWith("http") ? href : `https://canadabuys.canada.ca${href}`;
    out.add(abs);
  }

  try {
    const dom = new JSDOM(listingHtml);
    const doc = dom.window.document;

    const anchors = Array.from(
      doc.querySelectorAll<HTMLAnchorElement>(
        "a[href*='/tender-opportunities/tender-notice/'], a[href*='/tender-notice/']"
      )
    );

    for (const a of anchors) {
      const href = a.getAttribute("href");
      if (!href) continue;
      const abs = href.startsWith("http") ? href : `https://canadabuys.canada.ca${href}`;
      out.add(abs);
    }
  } catch {
  }

  return [...out];
}

function viewField(doc: Document, fieldClass: string): string | undefined {
  const el = doc.querySelector(`.${fieldClass} .field-content`);
  const t = clean(el?.textContent || "");
  return t || undefined;
}

export function parseTenderDetail(html: string, url: string): Tender {
  const doc = new JSDOM(html).window.document;

  const title = clean(doc.querySelector("h1")?.textContent) || "Unknown Title";

  const solicitationNumber = clean(
    doc.querySelector(".field--name-field-tender-solicitation-number .field--item")?.textContent
  );

  const closingDate = clean(doc.querySelector(".closing-date-field .dateclass")?.textContent);
  const closingTime = clean(doc.querySelector(".closing-date-field .timeclass")?.textContent);

  const dueDate = clean([closingDate, closingTime].filter(Boolean).join(" ")) || undefined;

  const description =
    clean(doc.querySelector(".tender-detail-description.field--name-body")?.textContent) ||
    clean(doc.querySelector(".field--name-body")?.textContent) ||
    undefined;

  const status = clean(doc.querySelector("#tender-status-label")?.textContent) || undefined;

  const bidType = viewField(doc, "views-field-field-tender-notice-type") || undefined;
  const region = viewField(doc, "views-field-field-tender-delivery-regions") || undefined;
  const classification = viewField(doc, "views-field-field-tender-procurement-method") || undefined;
  const languageText = viewField(doc, "views-field-field-tender-notice-languages") || undefined;

  let language: "EN" | "FR" | undefined;
  if (languageText) {
    const l = languageText.toLowerCase();
    if (l.includes("english") || l.includes("anglais")) language = "EN";
    else if (l.includes("french") || l.includes("français") || l.includes("francais")) language = "FR";
  }

  const sourceId = solicitationNumber || new URL(url).pathname.split("/").pop() || url;

  return {
    source: "canadabuys",
    sourceId,
    sourceUrl: url,
    title,
    bidNumber: solicitationNumber || undefined,
    dueDate,
    description,
    status,
    bidType,
    region,
    classification,
    language,
    documents: [],
    contacts: [],
    category: [],
    buyerName: undefined,
  };
}

export async function crawlCanadaBuysAndStore(maxPages = 3): Promise<CrawlSummary> {
  const summary: CrawlSummary = { new: 0, updated: 0, errors: 0, newIds: [] };
  const seen = new Set<string>();

  const session = await bootstrapSession();

  try {
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      console.log(`\nFetching listing page ${pageNum}...`);
      const listingHtml = await fetchListingHtml(pageNum, session);

      console.log("listingHtml length:", listingHtml.length);
      const links = extractTenderLinks(listingHtml);
      console.log(`Found ${links.length} tender links on page ${pageNum}`);

      if (!links.length) break;

      for (const link of links) {
        const slug = new URL(link).pathname.split("/").pop() || link;
        if (seen.has(slug)) continue;
        seen.add(slug);

        try {
          const res = await fetch(link, {
            headers: {
              "user-agent": session.userAgent,
              accept: "text/html,application/xhtml+xml",
              "accept-language": "en-CA,en;q=0.9",
              referer: LISTING_PAGE_URL,
              ...(session.cookie ? { cookie: session.cookie } : {}),
            },
          });

          if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`);

          const html = await res.text();
          const tender = parseTenderDetail(html, link);

          const result = await dedupAndStore(tender);

          if (result === "NEW") {
            summary.new++;
            summary.newIds.push(tender.sourceId);
          } else if (result === "UPDATED") {
            summary.updated++;
          }

          console.log(`${result}: ${tender.sourceId} | ${tender.title}`);
        } catch (err) {
          summary.errors++;
          console.error("Tender failed:", link, err);
        }
      }
    }
  } finally {
    await closeStore();
  }

  console.log("\nCRAWL SUMMARY:", summary);
  return summary;
}