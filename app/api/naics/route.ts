import { NextResponse } from "next/server";

export interface NAICSCode {
  code: string;
  description: string;
}

// In-memory cache for NAICS codes
let cachedNAICSCodes: NAICSCode[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface USASpendingNAICSItem {
  naics: string;
  naics_description: string;
  year_retired: number | null;
  count: number;
  children?: USASpendingNAICSItem[];
}

interface USASpendingResponse {
  results: USASpendingNAICSItem[];
}

/**
 * Recursively flatten the hierarchical NAICS response into a flat array
 * Filters out retired codes (year_retired !== null)
 */
function flattenNAICSCodes(items: USASpendingNAICSItem[]): NAICSCode[] {
  const result: NAICSCode[] = [];

  function traverse(item: USASpendingNAICSItem) {
    // Only include non-retired codes
    if (item.year_retired === null) {
      result.push({
        code: item.naics,
        description: item.naics_description,
      });
    }

    // Recursively process children
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        traverse(child);
      }
    }
  }

  for (const item of items) {
    traverse(item);
  }

  return result;
}

/**
 * Fetch all NAICS codes from USAspending API
 * The API returns 2-digit sector codes by default, and with filter param returns full hierarchy
 */
async function fetchAllNAICSCodes(): Promise<NAICSCode[]> {
  const allCodes: NAICSCode[] = [];

  // First, get the top-level 2-digit sector codes
  const baseUrl = "https://api.usaspending.gov/api/v2/references/naics/";
  const sectorsResponse = await fetch(baseUrl);

  if (!sectorsResponse.ok) {
    throw new Error(`Failed to fetch NAICS sectors: ${sectorsResponse.status}`);
  }

  const sectorsData: USASpendingResponse = await sectorsResponse.json();

  // For each 2-digit sector, fetch the full hierarchy
  const sectorCodes = sectorsData.results
    .filter((item) => item.year_retired === null)
    .map((item) => item.naics);

  // Fetch all sectors in parallel (with a reasonable concurrency limit)
  const fetchPromises = sectorCodes.map(async (sectorCode) => {
    try {
      const response = await fetch(`${baseUrl}?filter=${sectorCode}`);
      if (response.ok) {
        const data: USASpendingResponse = await response.json();
        return flattenNAICSCodes(data.results);
      }
    } catch (error) {
      console.error(`Error fetching NAICS codes for sector ${sectorCode}:`, error);
    }
    return [];
  });

  const results = await Promise.all(fetchPromises);

  // Combine all results and remove duplicates
  const codeMap = new Map<string, NAICSCode>();
  for (const codes of results) {
    for (const code of codes) {
      codeMap.set(code.code, code);
    }
  }

  allCodes.push(...codeMap.values());

  // Sort by code
  allCodes.sort((a, b) => a.code.localeCompare(b.code));

  return allCodes;
}

export async function GET() {
  try {
    // Check if cache is valid
    const now = Date.now();
    if (
      cachedNAICSCodes &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_DURATION_MS
    ) {
      return NextResponse.json({
        codes: cachedNAICSCodes,
        cached: true,
        count: cachedNAICSCodes.length,
      });
    }

    // Fetch fresh data
    const codes = await fetchAllNAICSCodes();

    // Update cache
    cachedNAICSCodes = codes;
    cacheTimestamp = now;

    return NextResponse.json({
      codes,
      cached: false,
      count: codes.length,
    });
  } catch (error) {
    console.error("Error fetching NAICS codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch NAICS codes" },
      { status: 500 }
    );
  }
}
