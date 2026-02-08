import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

/**
 * Web Crawl Tool
 * Uses Firecrawl for JS-rendered procurement portals
 */

export const webCrawlTool = tool({
  description:
    "Crawl a web page to extract RFP details. Handles JavaScript-rendered content.",
  parameters: z.object({
    url: z.string().url().describe("The URL to crawl"),
    formats: z
      .array(z.enum(["markdown", "html", "structured"]))
      .default(["markdown"])
      .describe("Output formats to extract"),
  }),
  execute: async ({ url, formats }) => {
    let firecrawlError: string | null = null;
    let tavilyError: string | null = null;

    // Try Firecrawl first
    if (env.FIRECRAWL_API_KEY) {
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.FIRECRAWL_API_KEY}`,
          },
          body: JSON.stringify({
            url,
            formats,
            onlyMainContent: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            url: data.url,
            markdown: data.markdown,
            html: data.html,
            metadata: data.metadata,
            source: "firecrawl",
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          firecrawlError = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        firecrawlError = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Firecrawl failed:", error);
      }
    }

    // Fallback to Tavily content extraction
    if (env.TAVILY_API_KEY) {
      try {
        const response = await fetch("https://api.tavily.com/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            urls: [url],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.results?.[0];
          
          if (result && !result.failed) {
            return {
              success: true,
              url: result.url,
              markdown: result.raw_content || result.content,
              html: null,
              metadata: {
                title: result.url,
              },
              source: "tavily",
            };
          } else {
            tavilyError = result?.error || "Failed to extract content";
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          tavilyError = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        tavilyError = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Tavily extraction failed:", error);
      }
    }

    // Build informative error message
    if (!env.FIRECRAWL_API_KEY && !env.TAVILY_API_KEY) {
      return {
        error: "No crawling API keys configured. Please add FIRECRAWL_API_KEY or TAVILY_API_KEY.",
      };
    }

    const errors = [];
    if (firecrawlError) errors.push(`Firecrawl: ${firecrawlError}`);
    if (tavilyError) errors.push(`Tavily: ${tavilyError}`);
    
    return {
      error: errors.length > 0 
        ? `Failed to crawl page. ${errors.join("; ")}`
        : "Failed to crawl page. Both services returned no data.",
    };
  },
});
