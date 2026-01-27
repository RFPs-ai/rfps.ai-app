"use client";

import { createAuthClient } from "better-auth/react";

// Get base URL - supports Vercel preview deployments
function getClientBaseURL() {
  // Use NEXT_PUBLIC var if set
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  // In browser, use current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
