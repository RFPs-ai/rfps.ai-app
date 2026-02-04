/**
 * AI Tools Registry
 * Export all tools for use in the AI SDK
 */

import { rfpSearchTool } from "./rfp-search";
import { webCrawlTool } from "./web-crawl";
import { memoryTool } from "./memory";
import { matchingTool } from "./matching";
import { webSearchTool } from "./web-search";
import { contentExtractTool } from "./content-extract";
import { qnaSearchTool } from "./qna-search";

// Re-export for convenience
export { rfpSearchTool } from "./rfp-search";
export { webCrawlTool } from "./web-crawl";
export { memoryTool } from "./memory";
export { matchingTool } from "./matching";
export { webSearchTool } from "./web-search";
export { contentExtractTool } from "./content-extract";
export { qnaSearchTool } from "./qna-search";

// Tool registry for easy access
export const tools = {
  rfpSearch: rfpSearchTool,
  webCrawl: webCrawlTool,
  memory: memoryTool,
  matching: matchingTool,
  webSearch: webSearchTool,
  contentExtract: contentExtractTool,
  qnaSearch: qnaSearchTool,
};

// Create a proxy to handle tool names with whitespace (some models add trailing spaces)
const toolsProxy = new Proxy(tools, {
  get(target, prop) {
    // If prop is a string, trim it before lookup
    if (typeof prop === 'string') {
      const trimmedProp = prop.trim();
      return target[trimmedProp as keyof typeof tools];
    }
    return target[prop as unknown as keyof typeof tools];
  },
  // Also handle has() to make 'in' operator work correctly
  has(target, prop) {
    if (typeof prop === 'string') {
      const trimmedProp = prop.trim();
      return trimmedProp in target;
    }
    return prop in target;
  }
});

export default toolsProxy;
