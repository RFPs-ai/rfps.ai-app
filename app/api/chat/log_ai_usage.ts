// lib/ai/logUsage.ts

import { db } from "@/lib/db";
import { aiUsageEvents } from "@/lib/db/schema";
import { estimateCostUsd } from "./pricing";

type LogUsageArgs = {
  userId: string;
  orgId?: string | null;

  feature: string;     
  provider: string;    
  model: string;       //must match pricing.ts key

  promptTokens: number;
  completionTokens: number;
};

export async function logAiUsage({
  userId,
  orgId = null,
  feature,
  provider,
  model,
  promptTokens,
  completionTokens,
}: LogUsageArgs) {
  const totalTokens = promptTokens + completionTokens;

  const costUsd = estimateCostUsd(
    model,
    promptTokens,
    completionTokens
  );

  await db.insert(aiUsageEvents).values({
    userId,
    orgId,
    feature,
    provider,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    costUsd: costUsd.toFixed(6),
  });

  return {
    totalTokens,
    costUsd,
  };
}
