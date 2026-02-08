import { AdminSidebarDesktop } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import type { AdminUser } from "@/lib/rbac";

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={user} />
      <div className="flex">
        {/* Desktop Sidebar */}
        <AdminSidebarDesktop />
        <main className="flex-1 p-4 md:p-6 w-0 min-w-0 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
