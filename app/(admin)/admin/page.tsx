import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { user, dataSources, rfps, companies } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { Users, Database, FileText, Building2 } from "lucide-react";

async function getStats() {
  const [
    totalUsers,
    adminUsers,
    totalDataSources,
    activeDataSources,
    totalRfps,
    totalCompanies,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "admin")),
    db.select({ count: count() }).from(dataSources),
    db.select({ count: count() }).from(dataSources).where(eq(dataSources.status, "active")),
    db.select({ count: count() }).from(rfps),
    db.select({ count: count() }).from(companies),
  ]);

  return {
    totalUsers: totalUsers[0]?.count ?? 0,
    adminUsers: adminUsers[0]?.count ?? 0,
    totalDataSources: totalDataSources[0]?.count ?? 0,
    activeDataSources: activeDataSources[0]?.count ?? 0,
    totalRfps: totalRfps[0]?.count ?? 0,
    totalCompanies: totalCompanies[0]?.count ?? 0,
  };
}

export default async function AdminHomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.adminUsers} admin{stats.adminUsers !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDataSources}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDataSources} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRfps}</div>
            <p className="text-xs text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Registered profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/users"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Users</div>
              <p className="text-sm text-muted-foreground">
                View users and manage roles
              </p>
            </a>
            <a
              href="/admin/data-sources"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Data Sources</div>
              <p className="text-sm text-muted-foreground">
                Monitor crawler status and errors
              </p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Crawlers</span>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">
                  {stats.activeDataSources > 0 ? "Running" : "Not configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
