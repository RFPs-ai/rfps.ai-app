import { db } from "@/lib/db";
import { aiUsageEvents } from "@/lib/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";

export async function getAiUsageThisMonth(userId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [row] = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${aiUsageEvents.totalTokens}), 0)`,
      totalCostUsd: sql<string>`COALESCE(SUM(${aiUsageEvents.costUsd}), 0)`,
    })
    .from(aiUsageEvents)
    .where(
      and(
        sql`${aiUsageEvents.userId} = ${userId}`,
        gte(aiUsageEvents.createdAt, start),
        lt(aiUsageEvents.createdAt, end)
      )
    );

  return {
    totalTokens: Number(row?.totalTokens ?? 0),
    totalCostUsd: Number(row?.totalCostUsd ?? 0),
  };
}
