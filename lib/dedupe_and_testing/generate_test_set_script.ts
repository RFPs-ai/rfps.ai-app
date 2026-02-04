import fs from "fs";
import crypto from "crypto";

type Tender = {
  source: "bids_tenders" | "ontario_tenders" | "canadabuys" | "merx";
  sourceId: string;
  sourceUrl: string;
  title: string;

  buyerName?: string;
  buyerId?: string;
  bidNumber?: string;
  dueDate?: string;
  publishedAt?: string;

  description?: string;
  category?: string[];
  language?: "EN" | "FR";
  region?: string;

  contacts?: { name: string; email?: string }[];
  documents?: { name: string }[];
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}
function chance(p: number) {
  return Math.random() < p;
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function uuidish() {
  return crypto.randomBytes(8).toString("hex");
}
function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

const buyers = [
  "Metro Vancouver",
  "City of Vancouver",
  "District of North Vancouver",
  "City of Burnaby",
  "City of Surrey",
  "BC Hydro",
  "TransLink",
  "University of British Columbia",
  "Vancouver Coastal Health",
  "Fraser Health Authority",
  "Ministry of Transportation and Infrastructure",
];

const regions = ["BC", "ON", "AB", "QC", "NS", "MB", "SK"];
const categories = [
  "Construction",
  "Consulting Services",
  "IT Services",
  "Roads & Transportation",
  "Facilities Maintenance",
  "Snow Removal",
  "Electrical",
  "Water & Wastewater",
  "Professional Services",
];

const boilerplate = [
  "All bids must be submitted electronically through the portal.",
  "Late submissions will not be accepted under any circumstances.",
  "The owner reserves the right to accept or reject any or all bids.",
  "Questions must be submitted in writing prior to the closing date.",
];

const titles = [
  "RFP - Snow Removal and Ice Control Services",
  "RFT - Supply of Traffic Control Devices",
  "RFQ - IT Support Services",
  "RFP - Engineering Consulting Services",
  "RFT - Facility Maintenance Services",
  "RFP - CCTV Camera Installation",
  "RFQ - Supply of Electrical Components",
  "RFP - Water Treatment Chemicals",
  "RFT - Asphalt Paving and Road Works",
];

const synonyms: Record<string, string[]> = {
  "RFP": ["Request for Proposal", "R.F.P.", "RFP"],
  "RFT": ["Request for Tender", "R.F.T.", "RFT"],
  "RFQ": ["Request for Quotation", "R.F.Q.", "RFQ"],
  "and": ["and", "&"],
  "Services": ["Services", "Svc", "Service"],
  "Supply": ["Supply", "Provision", "Delivery"],
  "Installation": ["Installation", "Install", "Deployment"],
};

function varyTitle(t: string) {
  // small text variations for near duplicates
  let out = t;

  out = out.replace(/\b(RFP|RFT|RFQ)\b/g, (m) => pick(synonyms[m] ?? [m]));
  out = out.replace(/\band\b/g, () => pick(synonyms["and"]));
  out = out.replace(/\bServices\b/g, () => pick(synonyms["Services"]));
  out = out.replace(/\bSupply\b/g, () => pick(synonyms["Supply"]));
  out = out.replace(/\bInstallation\b/g, () => pick(synonyms["Installation"]));

  if (chance(0.35)) out = out.replace(" - ", ": ");
  if (chance(0.25)) out = out + ` (${pick(["Addendum", "Re-issue", "Phase 2"])})`;
  if (chance(0.25)) out = out.replace(/\bCCTV\b/g, "Closed-Circuit TV");

  return normalizeSpaces(out);
}

function varyDueDate(raw: string) {
  // change formatting but same date
  // expects raw like "Wed Oct 31, 2035 12:00 PM (NDT)" or similar
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  const opts = [
    d.toISOString(), // ISO
    d.toUTCString(), // UTC
    d.toLocaleString("en-CA", { timeZone: "America/Vancouver" }), // local-ish
    d.toLocaleString("en-US", { timeZone: "America/Vancouver" }),
  ];
  return pick(opts);
}

function makeBaseTender(i: number): Tender {
  const source = pick(["bids_tenders", "ontario_tenders", "canadabuys", "merx"] as const);
  const buyerName = pick(buyers);
  const region = pick(regions);
  const language = chance(0.85) ? "EN" : "FR";
  const title = pick(titles);

  const bidNumber = `${source.toUpperCase()}-${randInt(1000, 9999)}-${randInt(10, 99)}`;
  const sourceId = chance(0.7) ? bidNumber : `${source}-${uuidish()}`;

  const closing = new Date();
  closing.setDate(closing.getDate() + randInt(5, 60));
  closing.setHours(randInt(9, 16), pick([0, 15, 30, 45]), 0, 0);

  const dueDate = closing.toString();

  const descCore = [
    `Buyer: ${buyerName}.`,
    `Category: ${pick(categories)}.`,
    `This solicitation invites qualified proponents to submit proposals for ${title.replace(/^(RFP|RFT|RFQ)\s*[-:]\s*/i, "").toLowerCase()}.`,
    chance(0.8) ? pick(boilerplate) : "",
    chance(0.5) ? pick(boilerplate) : "",
  ].filter(Boolean).join(" ");

  return {
    source,
    sourceId,
    sourceUrl: `https://example.com/${source}/${slugify(sourceId)}`,
    title,
    buyerName,
    bidNumber,
    dueDate,
    publishedAt: new Date().toISOString(),
    description: normalizeSpaces(descCore),
    category: [pick(categories)],
    language,
    region,
    contacts: chance(0.6)
      ? [{ name: pick(["Purchasing Contact", "Procurement Officer", "Buyer Rep"]), email: `procurement+${i}@example.com` }]
      : [],
    documents: chance(0.5)
      ? [{ name: "Bid Document.pdf" }, { name: "Addendum 1.pdf" }].slice(0, chance(0.5) ? 1 : 2)
      : [],
  };
}

function makeExactDuplicate(t: Tender): Tender {
  // same fields -> should match SHA if your fingerprint fields are same
  return {
    ...t,
    sourceUrl: t.sourceUrl + `?dup=${uuidish()}`, // different URL but same content
  };
}

function makeNearDuplicate(t: Tender): Tender {
  // near-duplicate: slight variations that SHA often misses (title/due date/buyer)
  const newTitle = varyTitle(t.title);
  const newDue = chance(0.6) ? varyDueDate(t.dueDate ?? "") : (t.dueDate ?? "");
  const newBuyer = chance(0.15) ? t.buyerName?.replace("City of ", "The City of ") : t.buyerName;

  const extraBoiler = chance(0.5) ? ` ${pick(boilerplate)}` : "";
  const newDesc = normalizeSpaces((t.description ?? "") + extraBoiler);

  return {
    ...t,
    title: newTitle,
    dueDate: newDue,
    buyerName: newBuyer,
    description: newDesc,
    sourceUrl: t.sourceUrl + `?variant=${uuidish()}`,
    // also sometimes solicitation number missing (common in scraped data)
    bidNumber: chance(0.3) ? undefined : t.bidNumber,
    sourceId: chance(0.3) ? `${t.sourceId}-v2` : t.sourceId,
  };
}

function makeBoilerplateCollision(i: number): Tender {
  // different tenders that share lots of boilerplate -> can fool MinHash if too loose
  const buyerName = pick(buyers);
  const title = `RFP - ${pick(["Consulting Services", "IT Services", "Facility Services"])} (Standing Offer)`;
  const common = boilerplate.join(" ");

  return {
    source: pick(["bids_tenders", "merx"] as const),
    sourceId: `BOILER-${i}-${uuidish()}`,
    sourceUrl: `https://example.com/boiler/${i}/${uuidish()}`,
    title,
    buyerName,
    dueDate: new Date(Date.now() + randInt(5, 80) * 86400000).toString(),
    publishedAt: new Date().toISOString(),
    description: normalizeSpaces(
      `${common} This procurement relates to ${pick(["general services", "professional services", "standing offer arrangements"])}. ${common}`
    ),
    category: ["Professional Services"],
    language: "EN",
    region: pick(regions),
    contacts: [],
    documents: [],
  };
}

// generate
const TOTAL_BASE = 250;          // unique tenders
const EXACT_DUP_RATE = 0.20;     // 20% exact dupes
const NEAR_DUP_RATE = 0.25;      // 25% near dupes
const BOILER_COLLISIONS = 60;    // boilerplate heavy distinct tenders

const out: Tender[] = [];
const base: Tender[] = [];

for (let i = 0; i < TOTAL_BASE; i++) {
  const t = makeBaseTender(i);
  base.push(t);
  out.push(t);

  if (chance(EXACT_DUP_RATE)) out.push(makeExactDuplicate(t));
  if (chance(NEAR_DUP_RATE)) out.push(makeNearDuplicate(t));
}

for (let i = 0; i < BOILER_COLLISIONS; i++) {
  out.push(makeBoilerplateCollision(i));
}

// write JSONL
const pathOut = "tenders_test.jsonl";
fs.writeFileSync(pathOut, out.map((t) => JSON.stringify(t)).join("\n") + "\n", "utf8");

console.log(`Wrote ${out.length} tenders to ${pathOut}`);
console.log(`Base unique: ${base.length}`);
