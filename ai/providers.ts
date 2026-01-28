import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import Groq from "groq-sdk";
import { env } from "@/env";

/**
 * AI Provider Configuration
 * Supports multiple LLM providers with fallback logic
 */

// Anthropic (Primary)
export const claude = env.ANTHROPIC_API_KEY
  ? {
  sonnet: anthropic("claude-sonnet-4-20250514"),
  opus: anthropic("claude-opus-4-20241229"),
  haiku: anthropic("claude-3-5-haiku-20241022"),
    }
  : null;

// OpenAI (Fallback & Embeddings)
export const gpt = {
  "4o": openai("gpt-4o"),
  "4o-mini": openai("gpt-4o-mini"),
  "o1": openai("o1"),
};

// OpenRouter (Primary - Access to DeepSeek & other models)
const openrouterClient = env.OPENROUTER_API_KEY
  ? createOpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
  : null;

export const deepseek = openrouterClient
  ? {
      chat: openrouterClient("deepseek/deepseek-chat"),  // V3 - General
      reasoner: openrouterClient("deepseek/deepseek-r1"), // R1 - Reasoning
    }
  : null;

// xAI (Real-time Search)
export const xai = env.XAI_API_KEY
  ? createOpenAI({
      apiKey: env.XAI_API_KEY,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

export const grok = xai
  ? {
      "3": xai("grok-3"),
      "2": xai("grok-2-1212"),
    }
  : null;

// Google (Fast Classification)
export const gemini = env.GOOGLE_GENERATIVE_AI_API_KEY
  ? {
      flash: google("gemini-2.0-flash-exp"),
      pro: google("gemini-2.0-pro-exp"),
    }
  : null;

// Groq (High-throughput Batch Jobs)
export const groqClient = env.GROQ_API_KEY
  ? new Groq({
      apiKey: env.GROQ_API_KEY,
    })
  : null;

/**
 * Get primary model for reasoning & analysis
 * Uses DeepSeek V3 (via OpenRouter) by default, Claude Sonnet as fallback
 */
export function getPrimaryModel() {
  if (deepseek?.chat) return deepseek?.chat;
  if (claude?.sonnet) return claude?.sonnet;
  throw new Error("No AI provider configured. Please add OPENROUTER_API_KEY or ANTHROPIC_API_KEYto environment variables.");
}

/**
 * Get reasoning model for complex analysis
 * Uses DeepSeek R1 (via OpenRouter) by default, Claude Opus as fallback
 */
export function getReasoningModel() {
    if (deepseek?.reasoner) return deepseek?.reasoner;
    if (claude?.opus) return claude?.opus;
    throw new Error("No AI provider configured. Please add OPENROUTER_API_KEY or ANTHROPIC_API_KEYto environment variables.");
}

/**
 * Get fast model for quick tasks
 */
export function getFastModel() {
  return gemini?.flash || claude?.haiku || gpt["4o-mini"];
}

/**
 * Get model for real-time search grounding
 */
export function getSearchModel() {
  return grok?.["3"] || gpt["4o"];
}

/**
 * Get model for embeddings
 */
export function getEmbeddingModel() {
  return openai.embedding("text-embedding-3-large");
}
