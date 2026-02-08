import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import type { AdminUser } from "@/lib/rbac";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  user: AdminUser;
  className?: string;
}

export function AdminHeader({ user, className }: AdminHeaderProps) {
  return (
    <header className={cn("border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50", className)}>
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-8 min-w-0">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <AdminSidebar />
            </div>
            
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
              <h1 className="text-lg md:text-xl font-bold truncate">RFPs.ai</h1>
            </Link>
            <span className="hidden sm:inline-flex text-xs font-medium px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/20">
              ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {user.name || user.email}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                admin
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
