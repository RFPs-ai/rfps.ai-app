import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isPreviewDeployment } from "@/lib/preview";

// GET - Load the user's company profile
export async function GET() {
  try {
    // Skip auth check on preview deployments
    const isPreview = isPreviewDeployment();
    let userId: string;

    if (isPreview) {
      // Use a mock user ID for preview
      userId = "preview-user";
    } else {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    // Get the user's company profile
    const company = await db.query.companies.findFirst({
      where: eq(companies.userId, userId),
    });

    if (!company) {
      return NextResponse.json({ company: null });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error loading profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

// POST - Create or update the user's company profile
export async function POST(req: Request) {
  try {
    // Skip auth check on preview deployments
    const isPreview = isPreviewDeployment();
    let userId: string;

    if (isPreview) {
      // Use a mock user ID for preview
      userId = "preview-user";
    } else {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const body = await req.json();
    const {
      name,
      website,
      description,
      naicsCodes,
      unspscCodes,
      certifications,
      regions,
      languages,
      budgetMin,
      budgetMax,
      negativeKeywords,
      buyerBlacklist,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Check if user already has a company profile
    const existingCompany = await db.query.companies.findFirst({
      where: eq(companies.userId, userId),
    });

    const companyData = {
      name: name.trim(),
      website: website?.trim() || null,
      description: description?.trim() || null,
      naicsCodes: Array.isArray(naicsCodes) ? naicsCodes : [],
      unspscCodes: Array.isArray(unspscCodes) ? unspscCodes : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      regions: Array.isArray(regions) ? regions : [],
      languages: Array.isArray(languages) ? languages : [],
      budgetMin: typeof budgetMin === "number" ? budgetMin : null,
      budgetMax: typeof budgetMax === "number" ? budgetMax : null,
      negativeKeywords: Array.isArray(negativeKeywords) ? negativeKeywords : [],
      buyerBlacklist: Array.isArray(buyerBlacklist) ? buyerBlacklist : [],
      updatedAt: new Date(),
    };

    let company;

    if (existingCompany) {
      // Update existing company
      const result = await db
        .update(companies)
        .set(companyData)
        .where(eq(companies.id, existingCompany.id))
        .returning();
      company = result[0];
    } else {
      // Create new company
      const result = await db
        .insert(companies)
        .values({
          userId,
          ...companyData,
        })
        .returning();
      company = result[0];
    }

    return NextResponse.json({ company, updated: !!existingCompany });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
