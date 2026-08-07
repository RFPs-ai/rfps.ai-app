import { db, rfps } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  MapPin,
  Building2,
  ArrowLeft,
  ExternalLink,
  Globe,
  FileText,
  DollarSign,
  Clock,
} from "lucide-react";

export default async function RfpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const results = await db.select().from(rfps).where(eq(rfps.id, id)).limit(1);

  if (results.length === 0) {
    notFound();
  }

  const rfp = results[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Feed
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                R
              </div>
              <span className="text-xl font-bold">RFPs.ai</span>
            </div>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {rfp.source || "Web"}
            </Badge>
            {rfp.solicitationNumber && (
              <Badge variant="secondary">{rfp.solicitationNumber}</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Scraped {new Date(rfp.fetchedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            {rfp.title}
          </h1>

          {rfp.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {rfp.description}
            </p>
          )}
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {rfp.buyerName && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issuing Organization</p>
                  <p className="font-semibold">{rfp.buyerName}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {rfp.region && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  <p className="font-semibold">{rfp.region}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {rfp.deadlineSubmission && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submission Deadline</p>
                  <p className="font-semibold">
                    {new Date(rfp.deadlineSubmission).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {rfp.currency && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Currency</p>
                  <p className="font-semibold">{rfp.currency}</p>
                  {(rfp.budgetMin || rfp.budgetMax) && (
                    <p className="text-sm text-muted-foreground">
                      {rfp.budgetMin && rfp.budgetMax
                        ? rfp.budgetMin.toLocaleString() + " – " + rfp.budgetMax.toLocaleString()
                        : rfp.budgetMin
                        ? "Min: " + rfp.budgetMin.toLocaleString()
                        : "Max: " + (rfp.budgetMax?.toLocaleString() ?? "")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {rfp.language && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Language</p>
                  <p className="font-semibold">{rfp.language === "EN" ? "English" : rfp.language === "FR" ? "French" : rfp.language}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {rfp.naicsCode && (
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">NAICS Code</p>
                  <p className="font-semibold">{rfp.naicsCode}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metadata */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium">{rfp.source}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source ID</dt>
                <dd className="font-medium">{rfp.sourceId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">First Scraped</dt>
                <dd className="font-medium">{new Date(rfp.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd className="font-medium">{new Date(rfp.updatedAt).toLocaleString()}</dd>
              </div>
              {rfp.publishedAt && (
                <div>
                  <dt className="text-muted-foreground">Published</dt>
                  <dd className="font-medium">{new Date(rfp.publishedAt).toLocaleString()}</dd>
                </div>
              )}
              {rfp.setAside && (
                <div>
                  <dt className="text-muted-foreground">Set-Aside</dt>
                  <dd className="font-medium">{rfp.setAside}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {rfp.sourceUrl && (
            <a href={rfp.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="lg" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                View Original Source
              </Button>
            </a>
          )}
          <Link href="/signup" className="flex-1">
            <Button size="lg" variant="outline" className="w-full">
              Sign Up to Track This RFP
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RFPs.ai. All rights reserved.</p>
          <p className="text-sm mt-2">Autonomous AI Procurement Scraper</p>
        </div>
      </footer>
    </div>
  );
}
