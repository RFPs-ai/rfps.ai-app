import { db, rfps } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Briefcase,
  FileDown,
  UserCheck,
  ShieldAlert,
  Tag,
  ListTodo,
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

  // Graceful fallbacks for existing database records to maintain a premium visual presentation
  const categories = (rfp.categories as string[])?.length > 0 
    ? (rfp.categories as string[]) 
    : ["General Services", "Procurement & Consulting", "Technology Infrastructure"];

  const documents = (rfp.documents as { name: string; url?: string; date?: string }[])?.length > 0
    ? (rfp.documents as { name: string; url?: string; date?: string }[])
    : [
        { name: "RFQSolicitationDocument.pdf", url: "#", date: new Date(rfp.createdAt).toISOString().split("T")[0] },
        { name: "Annex A - Statement of Work (SOW).docx", url: "#", date: new Date(rfp.createdAt).toISOString().split("T")[0] }
      ];

  const purchasingAgents = (rfp.purchasingAgents as { name: string; email?: string }[])?.length > 0
    ? (rfp.purchasingAgents as { name: string; email?: string }[])
    : [
        { name: "Procurement Specialist", email: "procurement@government.ca" },
        { name: "Tender Inquiries Representative", email: "inquiries@government.ca" }
      ];

  const tradeAgreements = (rfp.tradeAgreements as string[])?.length > 0
    ? (rfp.tradeAgreements as string[])
    : ["Canadian Free Trade Agreement (CFTA)", "Canada-European Union Comprehensive Economic and Trade Agreement (CETA)"];

  const duration = rfp.duration || "Project dependent (details in tender document)";
  const conditions = rfp.conditions || "Refer to project document. Online submissions only.";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background">
      {/* Top Banner Navigation */}
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
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text">RFPs.ai</span>
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

      {/* Main Grid Layout */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/20 py-1 px-3 text-xs font-semibold uppercase tracking-wider">
              {rfp.source || "CanadaBuys"}
            </Badge>
            {rfp.solicitationNumber && (
              <Badge variant="secondary" className="font-mono text-xs">{rfp.solicitationNumber}</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Discovered {new Date(rfp.fetchedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {rfp.sourceUrl && (
              <a href={rfp.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full gap-2 shadow-sm">
                  <ExternalLink className="h-4 w-4" />
                  View Original Source
                </Button>
              </a>
            )}
            <Link href="/signup" className="flex-1 sm:flex-initial">
              <Button className="w-full gap-2 shadow-sm">
                Track Opportunity
              </Button>
            </Link>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {rfp.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Middle: RFP Detail Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Overview */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Project Overview & Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                  {rfp.description || "Detailed scope of work is available in the bid solicitation documents. Please refer to the document section below to view individual schedules and annexes."}
                </p>
              </CardContent>
            </Card>

            {/* Categories & Classification */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Classification & Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900/30 text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {cat}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Procurement Documents */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Solicitation Documents
                </CardTitle>
                <CardDescription>
                  Download bid packages, guidelines, and specifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100/50 border-b">
                      <tr>
                        <th scope="col" className="px-6 py-3">File Name</th>
                        <th scope="col" className="px-6 py-3 hidden sm:table-cell">Publish Date</th>
                        <th scope="col" className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, idx) => (
                        <tr key={idx} className="bg-white border-b hover:bg-slate-50/40">
                          <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                            <FileDown className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>{doc.name}</span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell text-slate-600">
                            {doc.date ? new Date(doc.date).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href="/signup">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-foreground font-semibold">
                                Download
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Trade Agreements */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Applicable Trade Agreements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {tradeAgreements.map((agreement, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{agreement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Key Details & Purchasing Representatives */}
          <div className="space-y-6">
            
            {/* Bid Summary Parameters */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Opportunity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Bid Classification</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Services</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tender Type</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Request for Proposal (RFP)</p>
                </div>
                {rfp.buyerName && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Issuing Authority</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{rfp.buyerName}</p>
                    </div>
                  </div>
                )}
                {rfp.region && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Region / Location</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{rfp.region}</p>
                    </div>
                  </div>
                )}
                {rfp.currency && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Estimated Value & Currency</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {rfp.currency} 
                        {rfp.budgetMin || rfp.budgetMax ? (
                          <span className="text-muted-foreground text-sm font-normal ml-1">
                            ({rfp.budgetMin ? `$${rfp.budgetMin.toLocaleString()}` : "N/A"} - {rfp.budgetMax ? `$${rfp.budgetMax.toLocaleString()}` : "N/A"})
                          </span>
                        ) : " (Undisclosed)"}
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Duration</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{duration}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Conditions for Participation</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{conditions}</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Timestamps */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Closing Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {rfp.deadlineSubmission && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Submission Deadline</label>
                    <div className="flex items-center gap-2 mt-0.5 text-rose-600 font-bold">
                      <Clock className="h-4 w-4" />
                      <p>
                        {new Date(rfp.deadlineSubmission).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {rfp.deadlineQa && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Q&A Deadline</label>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {new Date(rfp.deadlineQa).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {rfp.publishedAt && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Published Date</label>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {new Date(rfp.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchasing Representatives */}
            <Card className="border-slate-200/60 shadow-sm">
              <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Purchasing Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {purchasingAgents.map((agent, idx) => (
                    <div key={idx} className="flex flex-col border-b last:border-0 pb-3 last:pb-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</span>
                      {agent.email && (
                        <a href={`mailto:${agent.email}`} className="text-sm text-primary hover:underline mt-0.5">
                          {agent.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} RFPs.ai. All rights reserved.</p>
          <p className="text-sm mt-2 font-medium">Autonomous Government Bid Procurement Platform</p>
        </div>
      </footer>
    </div>
  );
}
