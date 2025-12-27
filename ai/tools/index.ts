/**
 * AI Tools Registry
 * Export all tools for use in the AI SDK
 */

import { rfpSearchTool } from "./rfp-search";
import { webCrawlTool } from "./web-crawl";
import { memoryTool } from "./memory";
import { matchingTool } from "./matching";

// Re-export for convenience
export { rfpSearchTool } from "./rfp-search";
export { webCrawlTool } from "./web-crawl";
export { memoryTool } from "./memory";
export { matchingTool } from "./matching";

// Tool registry for easy access
export const tools = {
  rfpSearch: rfpSearchTool,
  webCrawl: webCrawlTool,
  memory: memoryTool,
  matching: matchingTool,
};
