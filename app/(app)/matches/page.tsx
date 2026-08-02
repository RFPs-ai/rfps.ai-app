import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rfps, userRfps } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export default async function MatchesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // For the sake of the demo, if no session, we might want to still show it,
  // but let's assume auth is required. We'll fallback if user is not logged in.
  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Shortlisted RFPs</h1>
        <p>Please <Link href="/login" className="text-blue-500">log in</Link> to view your matched RFPs.</p>
      </div>
    );
  }

  // Fetch matched RFPs for the user
  const matches = await db
    .select({
      id: rfps.id,
      title: rfps.title,
      buyerName: rfps.buyerName,
      description: rfps.description,
      deadline: rfps.deadlineSubmission,
      budgetMin: rfps.budgetMin,
      budgetMax: rfps.budgetMax,
      currency: rfps.currency,
      sourceUrl: rfps.sourceUrl,
      relevanceScore: userRfps.relevanceScore,
      status: userRfps.status,
    })
    .from(userRfps)
    .innerJoin(rfps, eq(userRfps.rfpId, rfps.id))
    .where(eq(userRfps.userId, session.user.id))
    .orderBy(desc(userRfps.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Shortlisted RFPs</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          AI-curated opportunities matching your Nimblox profile
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No matches found yet. The AI agent will notify you when new RFPs are discovered.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      <a href={match.sourceUrl || "#"} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {match.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="mt-1 font-medium text-primary">
                      {match.buyerName || "Unknown Buyer"}
                    </CardDescription>
                  </div>
                  {match.relevanceScore && (
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold shrink-0">
                      {match.relevanceScore}% Match
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm line-clamp-3">{match.description || "No description provided."}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {match.deadline && (
                    <div>
                      <strong>Deadline:</strong> {format(new Date(match.deadline), "MMM d, yyyy")}
                    </div>
                  )}
                  {match.budgetMin || match.budgetMax ? (
                    <div>
                      <strong>Budget:</strong> {match.budgetMin || 0} - {match.budgetMax || "Uncapped"} {match.currency}
                    </div>
                  ) : null}
                  <div>
                    <strong>Status:</strong> <span className="capitalize">{match.status}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 py-3 border-t">
                <div className="flex gap-2 w-full justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <a href={match.sourceUrl || "#"} target="_blank" rel="noopener noreferrer">View Original</a>
                  </Button>
                  <Button size="sm">Pursue</Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
