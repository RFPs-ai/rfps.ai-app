import { streamText } from "ai";
import { getPrimaryModel } from "@/ai/providers";
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

  const result = streamText({
    model: getPrimaryModel(),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
