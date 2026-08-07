import crypto from "crypto";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// in ESM (import/export) projects, __dirname / __filename don't exist by default.
// recreates them so we can reliably locate the project's .env file.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
//dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export type Tender = {
  source: "bids_tenders" | "ontario_tenders" | "canadabuys" | "merx" | "AI Web Scraper";

  // maps to rfps.source_id (an ID from the source site, if available)
  sourceId: string;

  sourceUrl: string;
  title: string;

  // maps to rfps.buyer_id (optional if the source provides a buyer identifier)
  buyerId?: string;

  buyerName?: string;

  // raw string from the site
  dueDate?: string;

  // raw string from the site
  publishedAt?: string;

  category?: string[];

  // maps to rfps.solicitation_number 
  bidNumber?: string;

  bidType?: string;
  classification?: string;
  status?: string;

  description?: string;

  documents?: { name: string }[];
  contacts?: { name: string; email?: string }[];

  naicsCode?: string;
  unspscCode?: string;
  region?: string;
  language?: "EN" | "FR";
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  setAside?: string;
  requiredCertifications?: string[];
};


function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

//Normalize text to reduce dedupe sensitivity to casing and whitespace.

function normText(s?: string): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}


// parse date strings that may include timezone abbreviations in parentheses.

function parseBidDate(raw?: string): Date | null {
  if (!raw) return null;

  // remove "(...)" timezone chunks and normalize whitespace
  const cleaned = raw.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

  const d = new Date(cleaned);
  return Number.isNaN(d.getTime()) ? null : d;
}

// SHA-256(buyer_id + solicitation_number + normalized_title + due_date)
 
// if buyer_id isn't available, use to buyer_name
// if dates are not parseable, still include the raw dueDate string
// so fingerprint is generated even if parsing fails.

// if fingerprint does not exist -> INSERT (returns "NEW")
// if fingerprint exists -> UPDATE that row (returns "UPDATED")

export async function dedupAndStore(tender: Tender) {
  // build hash

  // prefer a stable buyer id if provided, else fall back to buyer name
  const buyerIdentity = normText(tender.buyerId) || normText(tender.buyerName);

  // solicitation_number (sometimes called bid number)
  const solicitationNumber = normText(tender.bidNumber);

  // normalize title and due date text to reduce false "new records"
  const normalizedTitle = normText(tender.title);
  const normalizedDueDate = normText(tender.dueDate);

  // combine components into a single string and hash it
  const fingerprintSource = [
    buyerIdentity,
    solicitationNumber,
    normalizedTitle,
    normalizedDueDate,
  ].join("|");

  const fingerprint = sha256(fingerprintSource);

  // normalize dates for db
  const fetchedAt = new Date(); // when we scraped / fetched this record

  // deadline_submission is a timestamp column; parse if possible
  const deadlineSubmission = parseBidDate(tender.dueDate);

  // published_at is optional; parse if possible, otherwise attempt Date() fallback
  const publishedAt =
    parseBidDate(tender.publishedAt) ??
    (tender.publishedAt ? new Date(tender.publishedAt) : null);

  // use a dedicated DB client for this operation
  const client = await pool.connect();

  try {
    // check if fingerprint exists
    const existing = await client.query(
      `select fingerprint from rfps where fingerprint = $1`,
      [fingerprint]
    );

    // insert new row
    if (existing.rowCount === 0) {
      const insertRes = await client.query(
        `
        INSERT INTO rfps (
          source_id,
          source,
          source_url,
          title,
          description,
          buyer_id,
          buyer_name,
          solicitation_number,
          naics_code,
          unspsc_code,
          region,
          language,
          budget_min,
          budget_max,
          currency,
          set_aside,
          required_certifications,
          deadline_submission,
          published_at,
          fingerprint,
          fetched_at
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,
          $9,$10,$11,$12,
          $13,$14,$15,$16,
          $17,$18,$19,
          $20,$21
        ) RETURNING id
        `,
        [
          tender.sourceId, // $1 source_id
          tender.source, // $2 source
          tender.sourceUrl || null, // $3 source_url
          tender.title, // $4 title
          tender.description || null, // $5 description
          tender.buyerId || null, // $6 buyer_id
          tender.buyerName || null, // $7 buyer_name
          tender.bidNumber || null, // $8 solicitation_number
          tender.naicsCode || null, // $9 naics_code
          tender.unspscCode || null, // $10 unspsc_code
          tender.region || null, // $11 region
          tender.language || null, // $12 language
          tender.budgetMin ?? null, // $13 budget_min
          tender.budgetMax ?? null, // $14 budget_max
          tender.currency || "CAD", // $15 currency
          tender.setAside || null, // $16 set_aside
          JSON.stringify(tender.requiredCertifications || []), // $17 required_certifications (JSON)
          deadlineSubmission, // $18 deadline_submission (Date|null)
          publishedAt, // $19 published_at (Date|null)
          fingerprint, // $20 fingerprint
          fetchedAt, // $21 fetched_at
        ]
      );

      return { status: "NEW", id: insertRes.rows[0].id };
    }

    // when scraping again, overwrite record with the latest fields
    // and bump fetched_at/updated_at so we know it was refreshed.
    await client.query(
      `
      UPDATE rfps
      SET
        source_id = $1,
        source_url = $2,
        title = $3,
        description = $4,
        buyer_id = $5,
        buyer_name = $6,
        solicitation_number = $7,
        naics_code = $8,
        unspsc_code = $9,
        region = $10,
        language = $11,
        budget_min = $12,
        budget_max = $13,
        currency = $14,
        set_aside = $15,
        required_certifications = $16,
        deadline_submission = $17,
        published_at = $18,
        fetched_at = $19,
        updated_at = $19
      WHERE fingerprint = $20
      `,
      [
        tender.sourceId,
        tender.sourceUrl || null,
        tender.title,
        tender.description || null,
        tender.buyerId || null,
        tender.buyerName || null,
        tender.bidNumber || null,
        tender.naicsCode || null,
        tender.unspscCode || null,
        tender.region || null,
        tender.language || null,
        tender.budgetMin ?? null,
        tender.budgetMax ?? null,
        tender.currency || "CAD",
        tender.setAside || null,
        JSON.stringify(tender.requiredCertifications || []),
        deadlineSubmission,
        publishedAt,
        fetchedAt, // used for both fetched_at and updated_at
        fingerprint,
      ]
    );

    return { status: "UPDATED", id: existing.rows[0].id };
  } finally {
    // release the DB client back to the pool
    client.release();
  }
}

// call this when crawler/process is shutting down so node process exits cleanly.
export async function closeStore() {
  await pool.end();
}
