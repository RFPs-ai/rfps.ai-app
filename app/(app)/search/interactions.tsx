"use server";

import { mem0Store } from "@/lib/mem0";

export async function recordThumbFeedback({
  companyId,
  rfpTitle,
  buyer,
  thumb,
  reasonChips,
}: {
  companyId: string;
  rfpTitle: string;
  buyer: string;
  thumb: "up" | "down";
  reasonChips: string[];
}) {
  const summary =
    thumb === "up"
      ? `Liked RFP "${rfpTitle}" from ${buyer}. Reasons: ${reasonChips.join(", ")}`
      : `Rejected RFP "${rfpTitle}" from ${buyer}. Reasons: ${reasonChips.join(", ")}`;

  await mem0Store({
    userId: companyId,
    memory: summary,
    metadata: {
      kind: "feedback",
      thumb,
      buyer,
      source: "triage_inbox",
      updatedAt: new Date().toISOString(),
    },
  });
}
