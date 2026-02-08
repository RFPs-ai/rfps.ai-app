import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAiUsageThisMonth } from "@/app/api/chat/ai_usage";


export default async function DashboardPage() {
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) return null; 

  // const usage = await getAiUsageThisMonth(session.user.id);
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Welcome to RFPs.ai - Your AI-powered RFP qualification engine
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>New Opportunities</CardTitle>
            <CardDescription>Matched to your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Pursuits</CardTitle>
            <CardDescription>Currently tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {/* current placeholders until real values can be calculated */}
              ${0.000000}
              {/* {usage.totalCostUsd.toFixed(2)} */}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {/* current placeholders until real values can be calculated */}
              {0} tokens
              {/* {usage.totalTokens.toLocaleString()} tokens */}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Set up your company profile to start receiving matched RFPs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">Complete Company Profile</p>
              <p className="text-sm text-muted-foreground">
                Add your NAICS codes, certifications, and preferences
              </p>
            </div>
            <Button className="w-full sm:w-auto">Set Up Profile</Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">Configure AI Search</p>
              <p className="text-sm text-muted-foreground">
                Try searching for relevant RFPs
              </p>
            </div>
            <Link href="/search" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">Search RFPs</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
