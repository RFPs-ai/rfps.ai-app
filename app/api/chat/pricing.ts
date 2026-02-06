// lib/ai/pricing.ts

export type Pricing = {
  promptPer1K: number;
  completionPer1K: number;
};

export const PRICING_USD_PER_1K: Record<string, Pricing> = {
  //Anthropic (Claude)

  "claude-sonnet-4-20250514": {
    promptPer1K: 0.003,
    completionPer1K: 0.015,
  },
  "claude-opus-4-20241229": {
    promptPer1K: 0.015,
    completionPer1K: 0.075,
  },
  "claude-3-5-haiku-20241022": {
    promptPer1K: 0.00025,
    completionPer1K: 0.00125,
  },

  //OpenAI

  "gpt-4o": {
    promptPer1K: 0.005,
    completionPer1K: 0.015,
  },
  "gpt-4o-mini": {
    promptPer1K: 0.00015,
    completionPer1K: 0.0006,
  },
  "o1": {
    promptPer1K: 0.015,
    completionPer1K: 0.060,
  },

    // OpenRouter / DeepSeek

  "deepseek/deepseek-chat": {
    promptPer1K: 0.00014,
    completionPer1K: 0.00028,
  },
  "deepseek/deepseek-r1": {
    promptPer1K: 0.00055,
    completionPer1K: 0.00219,
  },

  //Google Gemini

  "gemini-2.0-flash-exp": {
    promptPer1K: 0.000075,
    completionPer1K: 0.0003,
  },
  "gemini-2.0-pro-exp": {
    promptPer1K: 0.0025,
    completionPer1K: 0.0075,
  },

  // xAI (Grok)

  "grok-3": {
    promptPer1K: 0.005,
    completionPer1K: 0.015,
  },
  "grok-2-1212": {
    promptPer1K: 0.002,
    completionPer1K: 0.006,
  },
};


export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = PRICING_USD_PER_1K[model];

  if (!pricing) {
    return 0;
  }

  return (
    (promptTokens / 1000) * pricing.promptPer1K +
    (completionTokens / 1000) * pricing.completionPer1K
  );
}
