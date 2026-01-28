import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// Check if we're on a preview deployment
function isPreview(): boolean {
  return !!process.env.VERCEL_URL?.includes("-git-");
}

// Check if we're on production (not a preview)
function isProduction(): boolean {
  return !!process.env.VERCEL_URL && !process.env.VERCEL_URL.includes("-git-");
}

// Get base URL - supports Vercel preview deployments
function getBaseURL(): string {
  const isPreviewDeploy = isPreview();
  
  // For production, use BETTER_AUTH_URL if set, otherwise VERCEL_URL
  if (isProduction() && process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  
  // For previews, always use VERCEL_URL (dynamic preview URL)
  if (isPreviewDeploy && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For production without BETTER_AUTH_URL, use VERCEL_URL
  if (isProduction() && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Local development
  return "http://localhost:3000";
}

const baseURL = getBaseURL();
const isPreviewDeploy = isPreview();
const isProd = isProduction();

// Build trusted origins list - Better Auth validates the Origin header
// Better Auth does exact string matching, so we need to include all possible origins
const trustedOrigins: string[] = ["http://localhost:3000"];

// Always add baseURL (this is what Better Auth uses as the primary origin)
if (baseURL && !trustedOrigins.includes(baseURL)) {
  trustedOrigins.push(baseURL);
}

// Add production URL explicitly if different from baseURL
// This ensures production works even if BETTER_AUTH_URL is set differently
if (isProd && process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL !== baseURL) {
  if (!trustedOrigins.includes(process.env.BETTER_AUTH_URL)) {
    trustedOrigins.push(process.env.BETTER_AUTH_URL);
  }
}

// CRITICAL: For preview deployments, VERCEL_URL must be in trustedOrigins
// The Origin header from browser requests will be the exact preview URL
// Better Auth doesn't support wildcards, so we add the specific preview URL
if (process.env.VERCEL_URL) {
  const vercelUrl = `https://${process.env.VERCEL_URL}`;
  if (!trustedOrigins.includes(vercelUrl)) {
    trustedOrigins.push(vercelUrl);
  }
}

// Debug logging (only in development/preview, not production)
if (process.env.NODE_ENV !== "production" || isPreviewDeploy) {
  console.log("[Better Auth] Base URL:", baseURL);
  console.log("[Better Auth] VERCEL_URL:", process.env.VERCEL_URL);
  console.log("[Better Auth] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
  console.log("[Better Auth] Is Preview:", isPreviewDeploy);
  console.log("[Better Auth] Is Production:", isProd);
  console.log("[Better Auth] Trusted Origins:", trustedOrigins);
}

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
      // Preview URLs are dynamic and can't be added to Google Cloud Console
      enabled: !!process.env.GOOGLE_CLIENT_ID && isProd && !isPreviewDeploy,
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
