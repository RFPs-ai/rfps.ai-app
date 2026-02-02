import { requireAdmin } from "@/lib/rbac";
import { AdminShell } from "./admin/_components/AdminShell";
import { ForbiddenPage } from "./admin/_components/ForbiddenPage";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();

  // Show 403 page if user is not admin
  if ("forbidden" in result) {
    return <ForbiddenPage />;
  }

  const { user } = result;

  return <AdminShell user={user}>{children}</AdminShell>;
}
