import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

/**
 * RFP Search Tool
 * Uses Exa.AI for semantic search with Tavily as fallback
 */

export const rfpSearchTool = tool({
  description:
    "Search for ACTUAL procurement opportunity listings (RFPs, tenders, bids). Returns pages listing specific opportunities that companies can bid on, NOT informational pages, NOT wiki pages, NOT general articles about services. Focus on finding real procurement postings.",
  parameters: z.object({
    query: z.string().describe("Comprehensive search query for finding RFPs. Be detailed and specific - include the service/product type, industry context, keywords like 'RFP', 'tender', 'bid', or 'procurement'. Write 10-20 words minimum for better results. Example: 'IT consulting cybersecurity services RFP tender government procurement active open'"),
    region: z.string().optional().describe("Geographic region to filter by (e.g., 'Ontario', 'British Columbia', 'Canada', 'Toronto'). Include this in the search when specified."),
    naicsCode: z.string().optional().describe("NAICS code to filter by industry sector. Only include if user specifically requests it."),
    startDate: z.string().optional().describe("Start date for RFPs in ISO format (YYYY-MM-DD). Use for custom date ranges."),
    endDate: z.string().optional().describe("End date for RFPs in ISO format (YYYY-MM-DD). Use for custom date ranges."),
    maxResults: z.number().default(10).describe("Maximum number of results to return"),
  }),
  execute: async ({ query, region, naicsCode, startDate, endDate, maxResults }) => {
    try {
      // Build enhanced query with region and NAICS if provided
      let enhancedQuery = query;
      if (region) {
        enhancedQuery = `${enhancedQuery} ${region}`;
      }
      if (naicsCode) {
        enhancedQuery = `${enhancedQuery} NAICS ${naicsCode}`;
      }

      // Use custom date range if provided, otherwise default to last 90 days
      const startDateISO = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const endDateISO = endDate || new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
      
      // Try Exa.AI first
      if (env.EXA_API_KEY) {
        const response = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.EXA_API_KEY,
          },
          body: JSON.stringify({
            query: enhancedQuery,
            numResults: maxResults,
            type: "neural",
            contents: {
              text: { maxCharacters: 500 },
            },
            startPublishedDate: startDateISO,
            endPublishedDate: endDateISO,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            source: "exa",
            query: enhancedQuery,
            region,
            naicsCode,
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

      // Fallback to Tavily with enhanced query for recency
      if (env.TAVILY_API_KEY) {
        // Enhance query with temporal context for Tavily (doesn't have date params)
        const tavilyQuery = `${enhancedQuery} ${currentYear} ${currentMonth} active open current accepting`;
        
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query: tavilyQuery,
            max_results: maxResults * 2, // Get extra to filter old ones
            search_depth: "advanced",
            topic: "general",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Filter out results with old dates or closed status in content
          const filteredResults = data.results
            .filter((result: any) => {
              const text = `${result.title || ''} ${result.content || ''}`.toLowerCase();
              
              // Exclude clearly old years
              if (text.match(/\b(2020|2021|2022|2023)\b/) && !text.includes(currentYear.toString())) {
                return false;
              }
              
              // Exclude closed/expired/cancelled
              if (text.match(/\b(closed|expired|cancelled|awarded|completed)\b/)) {
                return false;
              }
              
              return true;
            })
            .slice(0, maxResults);
          
          return {
            source: "tavily",
            query: tavilyQuery,
            region,
            naicsCode,
            results: filteredResults.map((result: any) => ({
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
