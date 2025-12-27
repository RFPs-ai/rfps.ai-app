import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

/**
 * Memory Tool
 * Uses Mem0 for persistent user preferences and feedback
 */

export const memoryTool = tool({
  description:
    "Store or retrieve user preferences and feedback to improve recommendations",
  parameters: z.object({
    action: z.enum(["store", "retrieve"]).describe("Action to perform"),
    userId: z.string().describe("User ID"),
    memory: z.string().optional().describe("Memory to store (for 'store' action)"),
  }),
  execute: async ({ action, userId, memory }) => {
    if (!env.MEM0_API_KEY) {
      return {
        error: "MEM0_API_KEY not configured",
      };
    }

    try {
      if (action === "store" && memory) {
        const response = await fetch("https://api.mem0.ai/v1/memories/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.MEM0_API_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: memory,
              },
            ],
            user_id: userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Mem0 API error: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          action: "store",
          memory: data,
        };
      }

      if (action === "retrieve") {
        const response = await fetch(
          `https://api.mem0.ai/v1/memories/?user_id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${env.MEM0_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Mem0 API error: ${response.status}`);
        }

        const data = await response.json();
        return {
          success: true,
          action: "retrieve",
          memories: data.results || [],
        };
      }

      return {
        error: "Invalid action or missing memory parameter",
      };
    } catch (error) {
      return {
        error: `Memory operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
