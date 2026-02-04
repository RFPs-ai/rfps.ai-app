import { tool } from "ai";
import { z } from "zod";
import { env } from "@/env";

export const contentExtractTool = tool({
  description:
    "Extract clean, readable content from one or more web URLs. Removes ads, navigation, and clutter to return only the main content. Useful for reading articles, blog posts, documentation, or any web page content. Use this when you need to analyze specific URLs rather than searching.",

  parameters: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(10)
      .describe(
        "Array of URLs to extract content from (1-10 URLs). Must be valid HTTP/HTTPS URLs."
      ),
    includeImages: z
      .boolean()
      .default(false)
      .describe(
        "Whether to include image URLs found in the content. Useful for articles with relevant diagrams or photos."
      ),
  }),

  execute: async ({ urls, includeImages }) => {
    if (!env.TAVILY_API_KEY) {
      return {
        error:
          "Content extraction is not available: TAVILY_API_KEY not configured. Please add your Tavily API key to enable content extraction.",
      };
    }

    try {
      const response = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          urls,
          include_images: includeImages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Content extraction failed: ${response.status} ${response.statusText}. ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        source: "tavily",
        results: data.results?.map((result: any) => ({
          url: result.url,
          content: result.raw_content || result.content,
          images: result.images || [],
          failed: result.failed || false,
          error: result.error || null,
        })) || [],
        extractedCount: data.results?.filter((r: any) => !r.failed).length || 0,
        failedCount: data.results?.filter((r: any) => r.failed).length || 0,
      };
    } catch (error) {
      return {
        error: `Content extraction failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      };
    }
  },
});
