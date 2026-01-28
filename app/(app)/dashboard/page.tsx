import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            ✨ Test Preview
          </span>
        </div>
        <p className="text-muted-foreground">
          Welcome to RFPs.ai - Your AI-powered RFP qualification engine
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Set up your company profile to start receiving matched RFPs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Complete Company Profile</p>
              <p className="text-sm text-muted-foreground">
                Add your NAICS codes, certifications, and preferences
              </p>
            </div>
            <Button>Set Up Profile</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Configure AI Search</p>
              <p className="text-sm text-muted-foreground">
                Try searching for relevant RFPs
              </p>
            </div>
            <Button variant="outline">Search RFPs</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
