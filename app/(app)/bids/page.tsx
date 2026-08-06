import { db } from "@/lib/db";
import { rfps } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default async function BidsDirectoryPage() {
  // Fetch all RFPs from the database, ordered by latest published date
  const allBids = await db.select().from(rfps).orderBy(desc(rfps.publishedAt), desc(rfps.createdAt));
  
  // Format date helper
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
            Latest Bid Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            Search open government and corporate RFPs
          </p>
        </div>
      </div>

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Keyword Search</label>
              <Input placeholder="Search by name or organization..." className="max-w-md bg-background" />
            </div>
            <div className="space-y-1.5 flex-1 max-w-[250px]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Filter</label>
              <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option>Open (Selected)</option>
                <option>Closed</option>
                <option>Awarded</option>
              </select>
            </div>
            <Button className="h-10">Search Bids</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 hover:bg-muted/10">
                <TableHead className="w-[300px]">Bid Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead>Closing Date</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bids found. The AI scraper will populate this soon.
                  </TableCell>
                </TableRow>
              ) : (
                allBids.map((bid) => (
                  <TableRow key={bid.id} className="group">
                    <TableCell className="font-medium">
                      <div className="line-clamp-2" title={bid.title}>
                        {bid.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {bid.solicitationNumber || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Open
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(bid.publishedAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatDate(bid.deadlineSubmission)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {bid.buyerName || bid.source}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">
                        Public
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/bids/${bid.id}`}>
                        <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {allBids.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
              <div>Showing 1 to {allBids.length} of {allBids.length} results</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
