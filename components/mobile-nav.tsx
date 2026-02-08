"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isAdmin: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "AI Search" },
  { href: "/profile", label: "Profile" },
];

export function MobileNav({ isAdmin, userName, userEmail, userImage }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
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
            <span className="text-xl font-bold">RFPs.ai</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 flex flex-col h-[calc(100vh-120px)]">
          {/* User Info */}
          {(userName || userEmail) && (
            <div className="flex items-center gap-3 pb-6 border-b mb-6">
              {userImage && (
                <img
                  src={userImage}
                  alt={userName || "User"}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                {userName && (
                  <p className="font-medium text-sm truncate">{userName}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-destructive text-destructive-foreground"
                    : "text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Sign Out */}
          <div className="pt-6 border-t">
            <SignOutButton className="w-full justify-start" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
