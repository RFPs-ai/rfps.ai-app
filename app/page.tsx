import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db, rfps } from "@/lib/db";
import { desc, eq, isNotNull } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Building2, Search } from "lucide-react";

// Server component to fetch real DB data on load
export default async function LandingPage() {
  // Fetch latest RFPs that have real data (AI or manual)
  const recentRfps = await db
    .select()
    .from(rfps)
    .where(isNotNull(rfps.title))
    .orderBy(desc(rfps.createdAt))
    .limit(6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              R
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              RFPs.ai
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors">
            🚀 Live AI Scraper Active
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto">
            Find the Government Contracts You're{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Actually Meant to Win
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Our autonomous AI scours the internet daily, reads hundreds of RFPs, and qualifies them against your exact capabilities. Stop searching. Start bidding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                Create Free Account
              </Button>
            </Link>
            <Link href="#recent-bids">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full">
                View Today's Bids
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live RFP Feed Section */}
      <section id="recent-bids" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                Live Opportunity Feed
              </h2>
              <p className="text-muted-foreground">
                Fresh RFPs discovered by our AI across the web in the last 24 hours.
              </p>
            </div>
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-primary hover:bg-primary/10">
                View all matches &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRfps.length > 0 ? (
              recentRfps.map((rfp) => (
                <Card key={rfp.id} className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-md bg-card flex flex-col h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {rfp.source || "Web"}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(rfp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {rfp.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-4 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {rfp.description || "No description provided. Click to view full details."}
                    </p>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {rfp.buyerName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-primary/70" />
                          <span className="truncate">{rfp.buyerName}</span>
                        </div>
                      )}
                      {rfp.region && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                          <span className="truncate">{rfp.region}</span>
                        </div>
                      )}
                      {rfp.deadlineSubmission && (
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 text-primary/70" />
                          <span className="truncate">
                            Closes {new Date(rfp.deadlineSubmission).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4 border-t mt-auto">
                    <Link href={"/rfp/" + rfp.id} className="w-full">
                      <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Full Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No RFPs scraped today</h3>
                <p>The AI scraper is running in the background. Check back soon for fresh opportunities.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 sm:hidden">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                View all matches
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} RFPs.ai. All rights reserved.</p>
          <p className="text-sm mt-2">Autonomous AI Procurement Scraper</p>
        </div>
      </footer>
    </div>
  );
}
