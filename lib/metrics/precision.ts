import { db } from "@/lib/db";
import { userRfps, searchHistory } from "@/lib/db/schema";
import { inArray, eq, and } from "drizzle-orm";

export async function computePrecisionAtK(userId: string, searchId: string) {
  const [search] = await db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.id, searchId));

  if (!search || !search.resultRfpIds || search.resultRfpIds.length === 0) {
    return null;
  }

  const k = 10;
  const topIds = search.resultRfpIds.slice(0, k).map(String);
  const denominator = Math.min(k, topIds.length);

  if (denominator === 0) return null;

  const feedback = await db
    .select({
      rfpId: userRfps.rfpId,
      thumbs: userRfps.thumbs,
      status: userRfps.status,
    })
    .from(userRfps)
    .where(
      and(
        eq(userRfps.userId, userId),
        inArray(userRfps.rfpId, topIds)
      )
    );

  let relevantCount = 0;
  for (const row of feedback) {
    if (
      row.thumbs === "up" ||
      ["pursuing", "assigned", "submitted"].includes(row.status ?? "")
    ) {
      relevantCount++;
    }
  }

  return relevantCount / denominator;
}
