import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/sign-out-button";
import { isPreviewDeployment } from "@/lib/preview";
import { AppProviders } from "@/components/app-providers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const hostname = headerList.get("host") || "";
  const isPreview = isPreviewDeployment() || hostname.includes("-git-");
  
  // Debug logging
  console.log("[Layout] Hostname:", hostname);
  console.log("[Layout] VERCEL_URL:", process.env.VERCEL_URL);
  console.log("[Layout] Is Preview:", isPreview);
  
  // Skip auth check on PR preview deployments (Better Auth doesn't support dynamic preview URLs)
  const session = isPreview
    ? null
    : await auth.api.getSession({
        headers: headerList,
  });

  // Only require auth on production
  if (!isPreview && !session) {
    console.log("[Layout] No session, redirecting to /login");
    redirect("/login");
  }
  
  // Check if user is admin (only if we have a session)
  let isAdmin = false;
  if (session) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { role: true },
    });
    isAdmin = userRecord?.role === "admin";
  }
  
  console.log("[Layout] Rendering with preview:", isPreview, "session:", !!session, "isAdmin:", isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              {/* Mobile Menu Button */}
              {!isPreview && session && (
                <MobileNav
                  isAdmin={isAdmin}
                  userName={session.user.name}
                  userEmail={session.user.email}
                  userImage={session.user.image}
                />
              )}
              
              {/* Logo */}
              <Link href="/welcome" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold">RFPs.ai</h1>
              </Link>
              
              {/* Desktop Navigation Links */}
              <div className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  AI Search
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            
            {/* Right Side - User Info & Sign Out */}
            <div className="flex items-center gap-2 md:gap-4">
              {!isPreview && session && (
                <>
                  {/* Desktop User Info */}
                  <div className="hidden md:flex items-center gap-2">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  {/* Sign Out - hidden on mobile (available in mobile nav drawer) */}
                  <SignOutButton className="hidden md:inline-flex" />
                </>
              )}
              {isPreview && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded border">
                  🔍 Preview Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-4 md:py-8">
        <AppProviders>{children}</AppProviders>
      </main>
    </div>
  );
}
