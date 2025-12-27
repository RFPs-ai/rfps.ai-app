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
    if (!env.FIRECRAWL_API_KEY) {
      return {
        error: "FIRECRAWL_API_KEY not configured",
      };
    }

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

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        url: data.url,
        markdown: data.markdown,
        html: data.html,
        metadata: data.metadata,
      };
    } catch (error) {
      return {
        error: `Crawl failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
