/**
 * Script to promote a user to admin role
 *
 * Usage:
 *   npx tsx scripts/promote-admin.ts <email>
 *
 * Example:
 *   npx tsx scripts/promote-admin.ts admin@example.com
 *
 * This script is for initial setup only. Once you have an admin,
 * use the admin panel at /admin/users to manage roles.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// Minimal schema definition (to avoid importing full schema with env validation)
const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role").default("user"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    console.error("Example: npx tsx scripts/promote-admin.ts admin@example.com");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is not set");
    console.error("Set it in your .env file or export it:");
    console.error("  export DATABASE_URL='postgresql://...'");
    process.exit(1);
  }

  console.log(`Connecting to database...`);

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  console.log(`Looking up user: ${email}`);

  // Find user by email
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser.length === 0) {
    console.error(`Error: No user found with email "${email}"`);
    console.error("Make sure the user has registered first.");
    await client.end();
    process.exit(1);
  }

  const targetUser = existingUser[0];

  if (targetUser.role === "admin") {
    console.log(`User "${email}" is already an admin.`);
    await client.end();
    process.exit(0);
  }

  console.log(`Promoting user to admin...`);

  // Update role to admin
  await db
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(user.id, targetUser.id));

  console.log(`✅ Success! User "${email}" is now an admin.`);
  console.log(`They can access the admin panel at /admin`);

  await client.end();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
