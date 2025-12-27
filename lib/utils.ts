import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import CryptoJS from "crypto-js";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate SHA-256 fingerprint for RFP deduplication
 * Based on: buyer_id + solicitation_number + normalized_title + due_date
 */
export function generateFingerprint(data: {
  buyerId?: string;
  solicitationNumber?: string;
  title: string;
  dueDate?: Date | string;
}): string {
  const normalized = [
    data.buyerId?.toLowerCase().trim() || "",
    data.solicitationNumber?.toLowerCase().trim() || "",
    normalizeTitle(data.title),
    data.dueDate instanceof Date
      ? data.dueDate.toISOString().split("T")[0]
      : data.dueDate || "",
  ].join("|");

  return CryptoJS.SHA256(normalized).toString();
}

/**
 * Normalize title for deduplication
 * - Remove special characters
 * - Convert to lowercase
 * - Collapse whitespace
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Retry function with exponential backoff
 * Used for network operations (git, API calls)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelay = 2000,
    maxDelay = 16000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      onRetry?.(lastError, attempt);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = "CAD"
): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format relative time (e.g., "2 days left", "Due yesterday")
 */
export function formatDeadline(date: Date | string): string {
  const deadline = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return diffDays === -1 ? "Due yesterday" : `Due ${Math.abs(diffDays)} days ago`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays === 1) {
    return "Due tomorrow";
  }
  return `${diffDays} days left`;
}

/**
 * Calculate match score color
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
