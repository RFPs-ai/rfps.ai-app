/**
 * RFP Result Type Definitions
 * 
 * Defines the structure for RFP results with optional metadata fields
 * used across the application for displaying search results with explainability.
 */

export interface RFPResult {
  // Core fields
  title: string;
  url: string;
  snippet?: string;
  
  // Source information
  source?: string;
  publishedDate?: string;
  
  // Metadata for explainability chips
  naicsCode?: string;
  region?: string;
  language?: string;
  deadline?: string | Date;
  
  // Match scoring (from matching tool)
  score?: number; // 0-100
  matchReasons?: string[];
  ineligibilityReasons?: string[];
  recommendation?: "pursue" | "skip" | "review";
  
  // Additional optional fields
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  certifications?: string[];
}

/**
 * Handler for chip click events
 * Appends a semantic query to the conversation
 */
export type ChipClickHandler = (query: string) => void;

/**
 * Deadline urgency levels based on days remaining
 */
export type DeadlineUrgency = "urgent" | "soon" | "normal" | "unknown";

/**
 * Calculate deadline urgency based on days remaining
 */
export function getDeadlineUrgency(deadline?: string | Date): DeadlineUrgency {
  if (!deadline) return "unknown";
  
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) return "unknown"; // Past deadline
  if (daysLeft < 7) return "urgent";
  if (daysLeft < 14) return "soon";
  return "normal";
}

/**
 * Calculate days remaining until deadline
 */
export function getDaysUntilDeadline(deadline?: string | Date): number | null {
  if (!deadline) return null;
  
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysLeft > 0 ? daysLeft : null;
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline?: string | Date): string {
  if (!deadline) return "N/A";
  
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const daysLeft = getDaysUntilDeadline(deadlineDate);
  
  if (daysLeft === null) return "Closed";
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  
  return `${daysLeft} days`;
}

/**
 * Generate semantic query for chip refinement
 * Creates contextual queries based on chip type and value
 */
export function generateSemanticQuery(
  chipType: "category" | "region" | "language" | "deadline",
  value: string | undefined,
  currentTitle?: string
): string {
  if (!value || value === "N/A") return "";
  
  switch (chipType) {
    case "category":
      // Extract industry from title if available, otherwise use generic
      const industryMatch = currentTitle?.match(/(software|consulting|IT|cybersecurity|development|infrastructure|cloud)/i);
      const industry = industryMatch ? industryMatch[0].toLowerCase() : "";
      
      if (industry) {
        return `Show more ${industry} opportunities`;
      }
      return `Find more RFPs in category ${value}`;
    
    case "region":
      return `Show RFPs in ${value}`;
    
    case "language":
      return `Find ${value} language opportunities`;
    
    case "deadline":
      const days = parseInt(value);
      if (!isNaN(days)) {
        if (days < 7) return "Show RFPs with more time to prepare";
        return "Find opportunities closing soon";
      }
      return "";
    
    default:
      return "";
  }
}

/**
 * Calculate dynamic top N threshold for metadata extraction
 * Based on total result count
 */
export function calculateTopNThreshold(totalResults: number): number {
  if (totalResults < 10) return Math.min(3, totalResults);
  if (totalResults <= 20) return 5;
  return 8;
}

/**
 * Format NAICS code for display
 */
export function formatNaicsCode(naicsCode?: string): string {
  if (!naicsCode) return "N/A";
  return `NAICS ${naicsCode}`;
}

/**
 * Format region for display
 */
export function formatRegion(region?: string): string {
  if (!region) return "N/A";
  return region;
}

/**
 * Format language for display
 */
export function formatLanguage(language?: string): string {
  if (!language) return "N/A";
  
  const languageMap: Record<string, string> = {
    "EN": "English",
    "FR": "French",
    "ES": "Spanish",
    "DE": "German",
    "ZH": "Chinese",
    "JA": "Japanese",
  };
  
  return languageMap[language.toUpperCase()] || language;
}
