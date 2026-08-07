import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id FROM "user" LIMIT 1');
    if (res.rows.length === 0) {
      await client.query(
        'INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)',
        ['demo-user-123', 'Demo User', 'demo@example.com']
      );
      console.log("Created demo user.");
    } else {
      console.log("User already exists.");
    }
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
