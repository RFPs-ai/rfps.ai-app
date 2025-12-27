import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard">
                <h1 className="text-2xl font-bold">RFPs.ai</h1>
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/search"
                  className="text-sm hover:text-primary transition-colors"
                >
                  AI Search
                </Link>
                <Link
                  href="/profile"
                  className="text-sm hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
