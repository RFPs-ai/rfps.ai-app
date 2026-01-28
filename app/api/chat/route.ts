import { streamText } from "ai";
import { getPrimaryModel, claude } from "@/ai/providers";
import { tools } from "@/ai/tools";
import { SYSTEM_PROMPT } from "@/ai/prompts/system";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isPreviewDeployment } from "@/lib/preview";

export const maxDuration = 60;

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
  
  try {
    const result = streamText({
      model: primaryModel,
      system: SYSTEM_PROMPT,
      messages,
      tools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Fallback to Claude on primary model failure (rate limits, API errors, etc.)
    // Only fallback if we were using OpenRouter/DeepSeek (primary !== Claude)
    if (primaryModel !== claude.sonnet) {
      console.warn("Primary model (OpenRouter/DeepSeek) failed, falling back to Claude:", error);
      
      const fallbackResult = streamText({
        model: claude.sonnet,
        system: SYSTEM_PROMPT,
        messages,
        tools,
        maxSteps: 5,
      });

      return fallbackResult.toDataStreamResponse();
    }
    
    // If already using Claude and it failed, re-throw
    throw error;
  }
}
