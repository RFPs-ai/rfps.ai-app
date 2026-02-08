import { streamText, createDataStreamResponse, APICallError } from "ai";
import { getPrimaryModel, getPrimaryModelName, claude, getPrimaryModelBillingInfo } from "@/ai/providers";
import { getChatExperiment } from "@/ai/experiment";
import { tools } from "@/ai/tools";
import { SYSTEM_PROMPT } from "@/ai/prompts/system";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPreviewDeployment } from "@/lib/preview";
import { env } from "@/env";
import { logAiUsage } from "./log_ai_usage";

import { db } from "@/lib/db";
import { searchHistory } from "@/lib/db/schema";

export const maxDuration = 60;

const isDebug = env.DEBUG === "1";

/**
 * Parse error into user-friendly message
 */
function getErrorMessage(error: unknown): { message: string; status: number } {
  if (error instanceof APICallError) {
    const status = error.statusCode ?? 500;
    
    if (status === 429) {
      return { message: "Rate limit exceeded. Please wait a moment and try again.", status: 429 };
    }
    if (status === 401 || status === 403) {
      return { message: "AI provider authentication failed. Please check API keys.", status };
    }
    if (status === 503 || status === 502) {
      return { message: "AI service temporarily unavailable. Please try again.", status };
    }
    
    return { message: error.message || "AI request failed", status };
  }
  
  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }
  
  return { message: "An unexpected error occurred", status: 500 };
}

let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

// TODO: rfpSearch must return DB-backed rfps with `id` for exposure logging + P@10 to work.
// currently won't do anything until then
function wrapToolsForExposureLogging(opts: {
  tools: Record<string, any>;
  getUserId: () => string | null;
}) {
  const { tools, getUserId } = opts;
  const wrapped: Record<string, any> = {};

  for (const [toolName, tool] of Object.entries(tools)) {
    wrapped[toolName] = {
      ...tool,
      execute: async (...args: any[]) => {
        const res = await tool.execute(...args);

        if (toolName === "rfpSearch") {
          const userId = getUserId();
          const rfps = res?.rfps; // future: DB-backed results array with `id`

          // only log when DB ids exist
          if (!userId || !Array.isArray(rfps) || rfps.length === 0) {
            return res;
          }

          const topIds = rfps
            .slice(0, 10)
            .map((r: any) => String(r?.id))
            .filter(Boolean);

          // if no ids, it isn't DB-backed yet
          if (topIds.length === 0) {
            return res;
          }

          await db.insert(searchHistory).values({
            userId,
            query: args?.[0]?.query ?? "",
            // add when filters are implemented
            resultCount: rfps.length,
            resultRfpIds: topIds,
          });
        }

        return res;
      },
    };
  }

  return wrapped;
}


export async function POST(req: Request) {
  // Skip auth check on PR preview deployments
  const isPreview = isPreviewDeployment();
  let abKey = "preview";
  if (!isPreview) {
    session = await auth.api.getSession({
    headers: await headers(),
  });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    abKey = (session.user as any).companyId ?? session.user.id ?? session.user.email ?? "anon";
  
  }

  const { messages } = await req.json();

  const billing = getPrimaryModelBillingInfo();

  const wrappedTools = wrapToolsForExposureLogging({
    tools,
    getUserId: () => session?.user?.id ?? null,
  });

  const exp = getChatExperiment(abKey);
  
  const result = streamText({
    model: exp.model,
    system: SYSTEM_PROMPT,
    messages,
    tools: wrappedTools,
    maxSteps: 5,
    onFinish: async ({ usage }) => {
      if (!usage || !session?.user?.id) return;

      await logAiUsage({
        userId: session.user.id,
        feature: `chat:${exp.experiment}:${exp.variant}`,

        provider: billing.provider,
        model: billing.model,

        promptTokens: usage.promptTokens ?? 0,
        completionTokens: usage.completionTokens ?? 0,
      });
    },
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Send model name as debug info
      if (isDebug) {
        dataStream.writeMessageAnnotation({ 
          experiment: exp.experiment,
          variant: exp.variant,
          modelName: exp.modelName, });
      }
      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      // Log the full error server-side
      console.error("[Chat API] Stream error:", error);
      
      // Return user-friendly message to client
      const { message } = getErrorMessage(error);
      return message;
    },
  });
}
