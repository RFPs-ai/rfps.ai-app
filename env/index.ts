import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-side environment variables schema
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url().optional(),

    // AI Providers (all optional - can add later)
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    XAI_API_KEY: z.string().min(1).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1).optional(),

    // Search APIs
    EXA_API_KEY: z.string().min(1).optional(),
    TAVILY_API_KEY: z.string().min(1).optional(),
    BRAVE_API_KEY: z.string().min(1).optional(),

    // Crawling
    FIRECRAWL_API_KEY: z.string().min(1).optional(),

    // Memory
    MEM0_API_KEY: z.string().min(1).optional(),

    // Email
    RESEND_API_KEY: z.string().min(1).optional(),

    // Redis (Optional)
    REDIS_URL: z.string().url().optional(),

    // Node Environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  /**
   * Client-side environment variables schema
   * These must be prefixed with NEXT_PUBLIC_
   */
  client: {
    // Add client-side env vars here if needed
  },

  /**
   * Runtime environment variables
   */
  runtimeEnv: {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Better Auth
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

    // AI Providers
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    XAI_API_KEY: process.env.XAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,

    // Search APIs
    EXA_API_KEY: process.env.EXA_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    BRAVE_API_KEY: process.env.BRAVE_API_KEY,

    // Crawling
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,

    // Memory
    MEM0_API_KEY: process.env.MEM0_API_KEY,

    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // Node Environment
    NODE_ENV: process.env.NODE_ENV,
  },

  /**
   * Skip validation during build if desired
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Empty string is invalid for required vars
   */
  emptyStringAsUndefined: true,
});
