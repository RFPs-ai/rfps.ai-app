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
import { dataSources } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Database, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";

function formatDate(date: Date | null): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case "paused":
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <PauseCircle className="w-3 h-3 mr-1" />
          Paused
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status || "Unknown"}
        </Badge>
      );
  }
}

async function getDataSources() {
  const sources = await db
    .select()
    .from(dataSources)
    .orderBy(desc(dataSources.updatedAt))
    .limit(50);

  return sources;
}

export default async function DataSourcesPage() {
  const sources = await getDataSources();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Sources</h1>
        <p className="text-muted-foreground">
          Monitor RFP crawler status and data ingestion
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            All Data Sources
          </CardTitle>
          <CardDescription>
            {sources.length} data source{sources.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Sources</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                No data sources have been configured yet. Data sources are used
                to crawl RFP listings from government procurement sites.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Crawl</TableHead>
                  <TableHead>Last Success</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {source.url}
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(source.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(source.lastCrawl)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(source.lastSuccess)}
                    </TableCell>
                    <TableCell>
                      {(source.errorCount ?? 0) > 0 ? (
                        <span className="text-red-600 font-medium">
                          {source.errorCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(source.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Error Details Card - Show if any sources have errors */}
      {sources.some((s) => s.errorMessage) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Details
            </CardTitle>
            <CardDescription>
              Recent error messages from data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources
                .filter((s) => s.errorMessage)
                .map((source) => (
                  <div
                    key={source.id}
                    className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <div className="font-medium text-sm mb-1">{source.name}</div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {source.errorMessage}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
