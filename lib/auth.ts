import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// Get base URL - supports Vercel preview deployments
function getBaseURL() {
  // Check if this is a preview deployment (contains "-git-")
  const isPreview = process.env.VERCEL_URL?.includes("-git-");
  
  // For production, use BETTER_AUTH_URL if set
  if (!isPreview && process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  
  // For previews or if BETTER_AUTH_URL not set, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Local development
  return "http://localhost:3000";
}

// Check if we're on production (not a preview)
function isProduction() {
  // If VERCEL_URL contains "git-" it's a preview deployment
  return process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("-git-");
}

const baseURL = getBaseURL();

// Build trusted origins list
const trustedOrigins: string[] = ["http://localhost:3000"];
if (baseURL) {
  trustedOrigins.push(baseURL);
}
// Also add BETTER_AUTH_URL if different from baseURL (for production)
if (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL !== baseURL) {
  trustedOrigins.push(process.env.BETTER_AUTH_URL);
}
// Add VERCEL_URL if different (for previews)
if (process.env.VERCEL_URL) {
  const vercelUrl = `https://${process.env.VERCEL_URL}`;
  if (!trustedOrigins.includes(vercelUrl)) {
    trustedOrigins.push(vercelUrl);
  }
}

// Debug logging
console.log("[Better Auth] Base URL:", baseURL);
console.log("[Better Auth] VERCEL_URL:", process.env.VERCEL_URL);
console.log("[Better Auth] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("[Better Auth] Trusted Origins:", trustedOrigins);

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
      enabled: !!process.env.GOOGLE_CLIENT_ID && (isProduction() || !process.env.VERCEL),
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins,
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
