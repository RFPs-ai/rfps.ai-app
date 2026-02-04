import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

export const webSearchTool = tool({
  description:
    "Search the web for general information, news, articles, or research. Use this for non-RFP queries like company research, industry trends, news, or general questions. Returns search results with titles, URLs, snippets, and optionally an AI-generated answer summary.",

  parameters: z.object({
    query: z.string().describe("Detailed search query or question. Be specific and comprehensive - include context, key details, and multiple relevant terms to get better results. Don't just use 2-3 keywords - write out what you're looking for in detail."),
    searchDepth: z
      .enum(["basic", "advanced"])
      .default("basic")
      .describe(
        "Search depth: 'basic' for quick results, 'advanced' for comprehensive crawling"
      ),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Maximum number of results to return (1-20)"),
    includeAnswer: z
      .boolean()
      .default(true)
      .describe(
        "Whether to include an AI-generated answer summary based on search results"
      ),
    topic: z
      .enum(["general", "news"])
      .default("general")
      .describe(
        "Search topic type: 'general' for all content, 'news' for recent news articles"
      ),
  }),

  execute: async ({
    query,
    searchDepth,
    maxResults,
    includeAnswer,
    topic,
  }) => {
    if (!env.TAVILY_API_KEY) {
      return {
        error:
          "Web search is not available: TAVILY_API_KEY not configured. Please add your Tavily API key to enable web search functionality.",
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
          search_depth: searchDepth,
          include_answer: includeAnswer,
          topic,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Web search failed: ${response.status} ${response.statusText}. ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        source: "tavily",
        query: data.query || query,
        answer: data.answer || null,
        results: data.results?.map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
        })) || [],
        resultCount: data.results?.length || 0,
      };
    } catch (error) {
      return {
        error: `Web search failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      };
    }
  },
});
