import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if we're on a PR preview deployment
  const hostname = request.headers.get("host") || "";
  const isPreview = hostname.includes("-git-");
  
  // If on preview and trying to access login/signup, redirect to dashboard
  if (isPreview && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup"],
};

