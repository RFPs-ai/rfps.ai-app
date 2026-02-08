import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userRfps, rfps } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { env } from "@/env";

const feedbackSchema = z.object({
  rfpId: z.string().uuid(),
  feedback: z.enum(["up", "down"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!env.MEM0_API_KEY) {
      return NextResponse.json(
        { error: "MEM0_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const validatedData = feedbackSchema.parse(body);

    // Get the RFP details for context
    const rfp = await db.query.rfps.findFirst({
      where: eq(rfps.id, validatedData.rfpId),
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Update thumbs in userRfps table
    const userRfp = await db.query.userRfps.findFirst({
      where: and(
        eq(userRfps.userId, session.user.id),
        eq(userRfps.rfpId, validatedData.rfpId)
      ),
    });

    if (userRfp) {
      await db
        .update(userRfps)
        .set({
          thumbs: validatedData.feedback,
          updatedAt: new Date(),
        })
        .where(eq(userRfps.id, userRfp.id));
    }

    // Create memory content
    const sentiment = validatedData.feedback === "up" ? "relevant and interesting" : "not relevant";
    let memoryContent = `User found RFP "${rfp.title}" ${sentiment}.`;
    
    if (rfp.description) {
      const truncatedDesc = rfp.description.length > 200 
        ? rfp.description.substring(0, 200) + "..." 
        : rfp.description;
      memoryContent += ` Description: ${truncatedDesc}`;
    }

    if (rfp.naicsCode) {
      memoryContent += ` NAICS: ${rfp.naicsCode}.`;
    }

    if (rfp.region) {
      memoryContent += ` Region: ${rfp.region}.`;
    }

    if (validatedData.note) {
      memoryContent += ` Note: ${validatedData.note}`;
    }

    // Send directly to mem0
    const response = await fetch("https://api.mem0.ai/v1/memories/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.MEM0_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: memoryContent,
          },
        ],
        user_id: session.user.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mem0 API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      memory: data,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
