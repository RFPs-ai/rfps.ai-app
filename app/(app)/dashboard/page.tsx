import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
          Dashboard 📊
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to RFPs.ai - Your AI-powered RFP qualification engine
        </p>
        <p className="text-sm text-muted-foreground/80">
          Discover government opportunities that match your capabilities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              New Opportunities
            </CardTitle>
            <CardDescription>Matched to your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              0
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Active Pursuits
            </CardTitle>
            <CardDescription>Currently tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">
              0
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
              0
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
