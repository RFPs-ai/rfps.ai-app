import { streamText, createDataStreamResponse, APICallError } from "ai";
import { getPrimaryModel, getPrimaryModelName, claude, getPrimaryModelBillingInfo } from "@/ai/providers";
import { tools } from "@/ai/tools";
import { SYSTEM_PROMPT } from "@/ai/prompts/system";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPreviewDeployment } from "@/lib/preview";
import { env } from "@/env";
import { logAiUsage } from "./log_ai_usage";

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

export async function POST(req: Request) {
  // Skip auth check on PR preview deployments
  const isPreview = isPreviewDeployment();
  if (!isPreview) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const { messages } = await req.json();

  const primaryModel = getPrimaryModel();
  const modelName = getPrimaryModelName();
  const billing = getPrimaryModelBillingInfo();


  const result = streamText({
    model: primaryModel,
    system: SYSTEM_PROMPT,
    messages,
    tools: toolsProxy,
    maxSteps: 5,
    onFinish: async ({ usage }) => {
      if (!usage || !session?.user?.id) return;

      await logAiUsage({
        userId: session.user.id,
        feature: "chat",

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
        dataStream.writeMessageAnnotation({ modelName });
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
