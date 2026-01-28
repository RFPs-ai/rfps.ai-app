"use client";

import { createAuthClient } from "better-auth/react";

// Get base URL - supports Vercel preview deployments
function getClientBaseURL(): string {
  // In browser, check if we're on a preview deployment
  if (typeof window !== "undefined") {
    const isPreview = window.location.hostname.includes("-git-");
    
    // On preview deployments, always use current origin (dynamic preview URL)
    // Ignore NEXT_PUBLIC_BETTER_AUTH_URL on previews to avoid forcing production URL
    if (isPreview) {
      return window.location.origin;
    }
    
    // On production, use NEXT_PUBLIC var if set, otherwise current origin
    if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
      return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    }
    
    return window.location.origin;
  }
  
  // Fallback for SSR (shouldn't happen in client component, but TypeScript needs it)
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
