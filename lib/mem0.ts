import { env } from "@/env";

const BASE = "https://api.mem0.ai";

export async function mem0Store(params: {
  userId: string;
  memory: string;
  metadata?: Record<string, any>;
}) {
  if (!env.MEM0_API_KEY) throw new Error("MEM0_API_KEY not configured");

  const res = await fetch(`${BASE}/v1/memories/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${env.MEM0_API_KEY}`,
    },
    body: JSON.stringify({
      user_id: params.userId,
      messages: [{ role: "user", content: params.memory }],
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mem0 store failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function mem0Recall(params: {
  userId: string;
  query?: string;
  limit?: number;
}) {
  if (!env.MEM0_API_KEY) throw new Error("MEM0_API_KEY not configured");

  const res = await fetch(`${BASE}/v1/memories/search/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${env.MEM0_API_KEY}`,
    },
    body: JSON.stringify({
      user_id: params.userId,
      query: params.query ?? "Preferences from thumbs feedback",
      limit: params.limit ?? 10,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mem0 recall failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
