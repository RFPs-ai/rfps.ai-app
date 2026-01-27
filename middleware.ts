import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if we're on a PR preview deployment
  const hostname = request.headers.get("host") || "";
  const isPreview = hostname.includes("-git-");
  
  // Debug logging
  console.log("[Middleware] Hostname:", hostname);
  console.log("[Middleware] Is Preview:", isPreview);
  console.log("[Middleware] Pathname:", request.nextUrl.pathname);
  
  // If on preview deployment, handle redirects
  if (isPreview) {
    const pathname = request.nextUrl.pathname;
    
    // Redirect login/signup to dashboard
    if (pathname === "/login" || pathname === "/signup") {
      console.log("[Middleware] Redirecting", pathname, "to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Redirect root to dashboard
    if (pathname === "/") {
      console.log("[Middleware] Redirecting root to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Redirect welcome to dashboard (welcome is protected)
    if (pathname === "/welcome") {
      console.log("[Middleware] Redirecting /welcome to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/welcome",
    "/dashboard",
    "/profile",
    "/search",
  ],
};

