import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  const res = await client.query("SELECT id, title, source_url, region, buyer_name FROM rfps ORDER BY fetched_at DESC LIMIT 10");
  console.log("\n=== LATEST SCRAPED RFPs IN DATABASE ===\n");
  for (const row of res.rows) {
    console.log("- " + row.title);
    console.log("  Buyer: " + (row.buyer_name || "N/A") + " | Region: " + (row.region || "N/A"));
    console.log("  Source: " + row.source_url);
    console.log("  DB ID: " + row.id);
    console.log();
  }
  console.log("Total: " + res.rowCount + " shown");
  client.release();
  await pool.end();
}

main();
