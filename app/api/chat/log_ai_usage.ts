import { db } from "@/lib/db";
import { aiUsageEvents } from "@/lib/db/schema";
import { estimateCostUsd } from "./pricing";

type LogUsageArgs = {
  userId: string;
  feature: string;   
  provider: string;
  model: string;     // must match pricing.ts keys

  promptTokens: number;
  completionTokens: number;
};

export async function logAiUsage({
  userId,
  feature,
  provider,
  model,
  promptTokens,
  completionTokens,
}: LogUsageArgs) {
  const totalTokens = (promptTokens ?? 0) + (completionTokens ?? 0);

  const costUsd = estimateCostUsd(
    model,
    promptTokens ?? 0,
    completionTokens ?? 0
  );

  await db.insert(aiUsageEvents).values({
    userId,
    feature,
    provider,
    model,
    promptTokens: promptTokens ?? 0,
    completionTokens: completionTokens ?? 0,
    totalTokens,
    costUsd: costUsd.toFixed(6), 
  });

  return { totalTokens, costUsd };
}
