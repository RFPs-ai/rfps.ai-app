import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin" | null;
  createdAt: Date;
};

export type AdminSession = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  user: AdminUser;
};

/**
 * Check if a user has admin role
 */
export function isAdmin(userRecord: { role: string | null } | null): boolean {
  return userRecord?.role === "admin";
}

/**
 * Get the current session and user with role info
 * Returns null if no session exists
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const headerList = await headers();
  
  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session) {
    return null;
  }

  // Fetch the full user record with role from database
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userRecord) {
    return null;
  }

  return {
    session,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    },
  };
}

/**
 * Require admin access for a page/route
 * Returns { session, user } if admin, otherwise:
 * - Redirects to /login if no session
 * - Returns { forbidden: true } if user is not admin
 * 
 * Usage in page:
 * const result = await requireAdmin();
 * if ('forbidden' in result) {
 *   return <ForbiddenPage />;
 * }
 * const { session, user } = result;
 */
export async function requireAdmin(): Promise<AdminSession | { forbidden: true }> {
  const headerList = await headers();
  
  const session = await auth.api.getSession({
    headers: headerList,
  });

  // No session -> redirect to login
  if (!session) {
    redirect("/login");
  }

  // Fetch the full user record with role from database
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  // User not found (shouldn't happen) -> redirect to login
  if (!userRecord) {
    redirect("/login");
  }

  // Check admin role
  if (userRecord.role !== "admin") {
    return { forbidden: true };
  }

  return {
    session,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    },
  };
}

/**
 * Check if current user is admin (for conditional rendering)
 * Returns true if admin, false otherwise
 */
export async function checkIsAdmin(): Promise<boolean> {
  const result = await getAdminSession();
  return result !== null && isAdmin(result.user);
}
