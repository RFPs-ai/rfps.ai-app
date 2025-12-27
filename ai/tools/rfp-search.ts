import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

/**
 * RFP Search Tool
 * Uses Exa.AI for semantic search with Tavily as fallback
 */

export const rfpSearchTool = tool({
  description:
    "Search for RFPs using semantic search. Supports filtering by region, NAICS codes, and date ranges.",
  parameters: z.object({
    query: z.string().describe("The search query describing the type of RFP to find"),
    region: z.string().optional().describe("Geographic region (e.g., 'Ontario', 'British Columbia')"),
    naicsCode: z.string().optional().describe("NAICS code to filter by"),
    startDate: z.string().optional().describe("Start date for RFPs (ISO format)"),
    endDate: z.string().optional().describe("End date for RFPs (ISO format)"),
    maxResults: z.number().default(10).describe("Maximum number of results to return"),
  }),
  execute: async ({ query, region, naicsCode, startDate, endDate, maxResults }) => {
    try {
      // Try Exa.AI first
      if (env.EXA_API_KEY) {
        const response = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.EXA_API_KEY,
          },
          body: JSON.stringify({
            query: buildEnhancedQuery(query, region, naicsCode),
            numResults: maxResults,
            type: "neural",
            contents: {
              text: { maxCharacters: 500 },
            },
            startPublishedDate: startDate,
            endPublishedDate: endDate,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            source: "exa",
            results: data.results.map((result: any) => ({
              title: result.title,
              url: result.url,
              snippet: result.text,
              publishedDate: result.publishedDate,
              score: result.score,
            })),
          };
        }
      }

      // Fallback to Tavily
      if (env.TAVILY_API_KEY) {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query: buildEnhancedQuery(query, region, naicsCode),
            max_results: maxResults,
            search_depth: "advanced",
            include_domains: [
              "buyandsell.gc.ca",
              "merx.com",
              "bidsandtenders.ca",
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            source: "tavily",
            results: data.results.map((result: any) => ({
              title: result.title,
              url: result.url,
              snippet: result.content,
              score: result.score,
            })),
          };
        }
      }

      return {
        error: "No search API keys configured. Please add EXA_API_KEY or TAVILY_API_KEY.",
      };
    } catch (error) {
      return {
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Build enhanced search query with filters
 */
function buildEnhancedQuery(
  query: string,
  region?: string,
  naicsCode?: string
): string {
  let enhanced = query;

  if (region) {
    enhanced += ` in ${region}`;
  }

  if (naicsCode) {
    enhanced += ` NAICS ${naicsCode}`;
  }

  enhanced += " government RFP procurement tender";

  return enhanced;
}
