"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, count, and, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/rbac";

export type UpdateRoleResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Update a user's role (admin-only action)
 * Includes guardrails:
 * - Cannot remove your own admin role if you're the last admin
 * - Only admins can call this
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: "user" | "admin"
): Promise<UpdateRoleResult> {
  // Verify caller is admin
  const result = await requireAdmin();
  if ("forbidden" in result) {
    return { success: false, error: "You do not have permission to perform this action" };
  }

  const { user: currentAdmin } = result;

  // Prevent removing your own admin role if you're the last admin
  if (targetUserId === currentAdmin.id && newRole === "user") {
    // Check how many admins exist
    const adminCount = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, "admin"));

    if ((adminCount[0]?.count ?? 0) <= 1) {
      return {
        success: false,
        error: "Cannot remove admin role: You are the only administrator",
      };
    }
  }

  // Check target user exists
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, targetUserId),
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  // Update the role
  await db
    .update(user)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(user.id, targetUserId));

  revalidatePath("/admin/users");

  const action = newRole === "admin" ? "promoted to admin" : "demoted to user";
  return { success: true, message: `${targetUser.email} has been ${action}` };
}
