import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userRfps, rfps } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { TriageInboxClient } from "./_components/TriageInboxClient";

export default async function TriagePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch RFPs that need triage (new status, no thumbs yet)
  const triageRfps = await db.query.userRfps.findMany({
    where: and(
      eq(userRfps.userId, session.user.id),
      eq(userRfps.status, "new"),
      isNull(userRfps.thumbs)
    ),
    with: {
      rfp: true,
    },
    orderBy: [desc(userRfps.createdAt)],
    limit: 50,
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Triage Inbox</h1>
        <p className="text-muted-foreground">
          Review new RFP matches and provide feedback to improve future recommendations
        </p>
      </div>

      {triageRfps.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-muted-foreground">
            No new RFPs to triage at the moment.
          </p>
        </div>
      ) : (
        <TriageInboxClient rfps={triageRfps} />
      )}
    </div>
  );
}
