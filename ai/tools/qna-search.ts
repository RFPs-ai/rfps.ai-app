import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

export const qnaSearchTool = tool({
  description:
    "Search for information and get direct answers to factual questions with cited sources. Best for questions that need specific answers like 'What is...', 'How does...', 'When did...', etc. Returns an AI-generated answer based on authoritative sources along with the source URLs and content for verification.",

  parameters: z.object({
    query: z
      .string()
      .describe(
        "Detailed question or query. Be comprehensive and specific - include full context, background, and specific details you're looking for. Don't use brief keywords - write out complete questions with proper context for better answers."
      ),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe(
        "Maximum number of source documents to use for answering (1-10)"
      ),
    includeRawContent: z
      .boolean()
      .default(false)
      .describe(
        "Whether to include full page content from sources. Useful for detailed citations but increases response size."
      ),
  }),

  execute: async ({ query, maxResults, includeRawContent }) => {
    if (!env.TAVILY_API_KEY) {
      return {
        error:
          "Question answering is not available: TAVILY_API_KEY not configured.",
      };
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          query,
          max_results: maxResults,
          search_depth: "basic",
          include_answer: true,
          include_raw_content: includeRawContent,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Question answering failed: ${response.status} ${response.statusText}. ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        source: "tavily",
        query: data.query || query,
        answer: data.answer || "No answer could be generated from the sources.",
        sources: data.results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          rawContent: result.raw_content || null,
          score: result.score,
        })) || [],
        sourceCount: data.results?.length || 0,
      };
    } catch (error) {
      return {
        error: `Question answering failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      };
    }
  },
});
