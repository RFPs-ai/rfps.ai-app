import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// Get base URL - supports Vercel preview deployments
function getBaseURL() {
  // Explicit production URL (highest priority)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  // Vercel deployments (preview and production)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Local development
  return "http://localhost:3000";
}

const baseURL = getBaseURL();

// Debug logging (remove after fixing)
console.log("[Better Auth] Base URL:", baseURL);
console.log("[Better Auth] VERCEL_URL:", process.env.VERCEL_URL);
console.log("[Better Auth] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No email verification required
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Only enable Google OAuth on production (not on preview deployments)
      enabled: !!process.env.GOOGLE_CLIENT_ID && baseURL.includes("rfps-ai-appdeployment.vercel.app"),
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: [
    "http://localhost:3000",
    baseURL,
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
