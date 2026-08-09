import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("Connecting to database...");
  const client = await pool.connect();
  
  console.log("Updating existing sources 'AI Web Scraper' to 'Web Opportunity'...");
  const res = await client.query(
    "UPDATE rfps SET source = 'Web Opportunity' WHERE source = 'AI Web Scraper'"
  );
  
  console.log(`Updated ${res.rowCount} rows successfully.`);
  client.release();
  await pool.end();
}

main().catch(console.error);
