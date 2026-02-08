import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Users, Shield, User as UserIcon } from "lucide-react";
import { requireAdmin } from "@/lib/rbac";
import { UserRoleButton } from "./UserRoleButton";

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getRoleBadge(role: string | null) {
  if (role === "admin") {
    return (
      <Badge variant="default" className="bg-primary">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <UserIcon className="w-3 h-3 mr-1" />
      User
    </Badge>
  );
}

async function getUsers() {
  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(50);

  return users;
}

export default async function UsersPage() {
  // Get current admin for highlighting
  const adminResult = await requireAdmin();
  if ("forbidden" in adminResult) {
    return null; // Layout will handle this
  }
  const currentAdminId = adminResult.user.id;

  const users = await getUsers();

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage user accounts and roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Users</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                No users have registered yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {u.id === currentAdminId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{u.name || "—"}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.emailVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600/20">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <UserRoleButton
                        userId={u.id}
                        currentRole={u.role}
                        isCurrentUser={u.id === currentAdminId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">About User Roles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Admin:</strong> Can access the admin panel, manage users, and
            view system data.
          </p>
          <p>
            <strong>User:</strong> Standard user with access to RFP search and
            company profile features.
          </p>
          <p className="text-yellow-600">
            Note: You cannot remove your own admin role if you are the only
            administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
