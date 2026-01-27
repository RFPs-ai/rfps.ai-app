import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

// Add runtime logging for origin debugging
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  console.log("[Auth API] GET Request Origin:", origin);
  console.log("[Auth API] Request URL:", req.url);
  return handler.GET(req);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  console.log("[Auth API] POST Request Origin:", origin);
  console.log("[Auth API] Request URL:", req.url);
  return handler.POST(req);
}
