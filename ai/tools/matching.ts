import { tool } from "ai";
import { z } from "zod";
import type { Company, Rfp } from "@/lib/db/schema";

/**
 * Matching Tool
 * Multi-factor RFP qualification scoring with explainability
 */

export const matchingTool = tool({
  description:
    "Score an RFP against company capabilities and return match/ineligibility reasons",
  parameters: z.object({
    rfp: z.object({
      title: z.string(),
      naicsCode: z.string().optional(),
      region: z.string().optional(),
      language: z.string().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      requiredCertifications: z.array(z.string()).optional(),
      deadlineSubmission: z.string().optional(),
    }),
    company: z.object({
      naicsCodes: z.array(z.string()),
      regions: z.array(z.string()),
      languages: z.array(z.string()),
      certifications: z.array(z.string()),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
    }),
  }),
  execute: async ({ rfp, company }) => {
    let score = 0;
    const matchReasons: string[] = [];
    const ineligibilityReasons: string[] = [];

    // NAICS Match (20 points)
    if (rfp.naicsCode && company.naicsCodes.includes(rfp.naicsCode)) {
      score += 20;
      matchReasons.push(`NAICS ${rfp.naicsCode} match`);
    } else if (rfp.naicsCode) {
      // Check for parent category match
      const rfpPrefix = rfp.naicsCode.substring(0, 3);
      const hasParentMatch = company.naicsCodes.some(
        (code) => code.startsWith(rfpPrefix)
      );
      if (hasParentMatch) {
        score += 10;
        matchReasons.push(`NAICS category ${rfpPrefix}xx match`);
      }
    }

    // Region Match (15 points)
    if (rfp.region && company.regions.includes(rfp.region)) {
      score += 15;
      matchReasons.push(`Region: ${rfp.region}`);
    } else if (rfp.region) {
      ineligibilityReasons.push(`Region ${rfp.region} not in preferences`);
    }

    // Certifications (15 points)
    if (rfp.requiredCertifications && rfp.requiredCertifications.length > 0) {
      const hasAllCerts = rfp.requiredCertifications.every((cert) =>
        company.certifications.includes(cert)
      );
      if (hasAllCerts) {
        score += 15;
        matchReasons.push(`Has required certifications`);
      } else {
        const missingCerts = rfp.requiredCertifications.filter(
          (cert) => !company.certifications.includes(cert)
        );
        ineligibilityReasons.push(
          `Missing certifications: ${missingCerts.join(", ")}`
        );
      }
    } else {
      score += 15; // No certs required
    }

    // Language Match (10 points)
    if (rfp.language && company.languages.includes(rfp.language)) {
      score += 10;
      matchReasons.push(`Language: ${rfp.language}`);
    } else if (rfp.language) {
      ineligibilityReasons.push(`Language ${rfp.language} not supported`);
    }

    // Budget Fit (10 points)
    if (rfp.budgetMin && rfp.budgetMax) {
      const rfpMidpoint = (rfp.budgetMin + rfp.budgetMax) / 2;
      if (
        company.budgetMin &&
        company.budgetMax &&
        rfpMidpoint >= company.budgetMin &&
        rfpMidpoint <= company.budgetMax
      ) {
        score += 10;
        matchReasons.push(`Budget within range`);
      } else {
        ineligibilityReasons.push(`Budget outside preferred range`);
      }
    }

    // Deadline Runway (10 points)
    if (rfp.deadlineSubmission) {
      const deadline = new Date(rfp.deadlineSubmission);
      const now = new Date();
      const daysLeft = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft >= 14) {
        score += 10;
        matchReasons.push(`${daysLeft} days to prepare`);
      } else if (daysLeft >= 7) {
        score += 5;
        matchReasons.push(`${daysLeft} days to prepare (tight)`);
      } else if (daysLeft < 0) {
        ineligibilityReasons.push(`Deadline passed`);
      } else {
        ineligibilityReasons.push(`Only ${daysLeft} days left (too tight)`);
      }
    }

    // Keyword Relevance (20 points) - simplified, would use embeddings in production
    const titleWords = rfp.title.toLowerCase().split(/\s+/);
    const relevantKeywords = ["software", "technology", "consulting", "development"];
    const hasRelevantKeywords = titleWords.some((word) =>
      relevantKeywords.some((keyword) => word.includes(keyword))
    );
    if (hasRelevantKeywords) {
      score += 20;
      matchReasons.push("Relevant keywords in title");
    }

    // Determine recommendation
    let recommendation: "pursue" | "skip" | "review";
    if (score >= 70 && ineligibilityReasons.length === 0) {
      recommendation = "pursue";
    } else if (score < 40 || ineligibilityReasons.length > 2) {
      recommendation = "skip";
    } else {
      recommendation = "review";
    }

    return {
      score,
      matchReasons,
      ineligibilityReasons,
      recommendation,
    };
  },
});
