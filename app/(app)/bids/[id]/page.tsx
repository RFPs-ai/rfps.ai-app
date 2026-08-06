import { db } from "@/lib/db";
import { rfps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BidDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [bid] = await db.select().from(rfps).where(eq(rfps.id, id)).limit(1);

  if (!bid) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">View Details</h1>
        <div className="flex gap-2">
          <Link href="/bids">
            <Button variant="outline">Return to Bids Homepage</Button>
          </Link>
          <Button>Register for this Bid</Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">📋</span> Bid Details
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Open
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b">
            {/* Left Column - Keys */}
            <div className="col-span-1 bg-muted/10 p-6 space-y-4 text-sm font-medium text-muted-foreground flex flex-col justify-between">
              <div>Bid Classification:</div>
              <div>Bid Type:</div>
              <div>Bid Number:</div>
              <div>Bid Name:</div>
              <div>Bid Status:</div>
              <div>Published Date:</div>
              <div>Bid Closing Date:</div>
              <div>Submission Type:</div>
              <div>Description:</div>
              <div>Region / Location:</div>
              <div>NAICS Code:</div>
            </div>
            
            {/* Right Column - Values */}
            <div className="col-span-2 p-6 space-y-4 text-sm flex flex-col justify-between">
              <div>Services</div>
              <div>RFP</div>
              <div>{bid.solicitationNumber || "N/A"}</div>
              <div className="font-medium">{bid.title}</div>
              <div className="font-bold">Open</div>
              <div>{formatDate(bid.publishedAt)}</div>
              <div className="font-medium">{formatDate(bid.deadlineSubmission)}</div>
              <div>Online Submissions Only</div>
              <div className="text-muted-foreground">{bid.description || "No description provided."}</div>
              <div>{bid.region || "N/A"}</div>
              <div>{bid.naicsCode || "N/A"}</div>
            </div>
          </div>
          
          <div className="p-6 bg-muted/5">
            <h3 className="font-semibold text-lg mb-3">Bid Document Access:</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bid Opportunity notices and awards and a free preview of the bid documents is available on this site free of charge without registration. Please note, some documents may be secured and you will be required to register for the bid to download and view the documents.
            </p>
            {bid.sourceUrl && (
              <a href={bid.sourceUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="gap-2">
                  <span>📄</span> Download Original Bid Documents
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
