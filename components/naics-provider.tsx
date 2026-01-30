"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface NAICSCode {
  code: string;
  description: string;
}

interface NAICSContextValue {
  codes: NAICSCode[];
  isLoading: boolean;
  error: string | null;
  searchCodes: (query: string) => NAICSCode[];
  getCodeDescription: (code: string) => string | undefined;
}

const NAICSContext = createContext<NAICSContextValue | undefined>(undefined);

export function NAICSProvider({ children }: { children: React.ReactNode }) {
  const [codes, setCodes] = useState<NAICSCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNAICSCodes() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/naics");

        if (!response.ok) {
          throw new Error("Failed to fetch NAICS codes");
        }

        const data = await response.json();
        setCodes(data.codes || []);
      } catch (err) {
        console.error("Error fetching NAICS codes:", err);
        setError(err instanceof Error ? err.message : "Failed to load NAICS codes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNAICSCodes();
  }, []);

  /**
   * Search NAICS codes by code number or description
   * Returns top matching results for autocomplete
   */
  const searchCodes = useCallback(
    (query: string): NAICSCode[] => {
      if (!query.trim()) {
        // Return popular/common codes when no query
        return codes.slice(0, 50);
      }

      const lowerQuery = query.toLowerCase().trim();

      // Score and filter codes
      const scored = codes
        .map((code) => {
          let score = 0;

          // Exact code match gets highest priority
          if (code.code === query) {
            score = 1000;
          }
          // Code starts with query
          else if (code.code.startsWith(query)) {
            score = 100 + (10 - code.code.length); // Prefer shorter matches
          }
          // Code contains query
          else if (code.code.includes(query)) {
            score = 50;
          }
          // Description contains query word
          else if (code.description.toLowerCase().includes(lowerQuery)) {
            score = 25;
            // Boost if word starts with query
            const words = code.description.toLowerCase().split(/\s+/);
            if (words.some((word) => word.startsWith(lowerQuery))) {
              score = 40;
            }
          }

          return { code, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      return scored.map((item) => item.code);
    },
    [codes]
  );

  /**
   * Get the description for a given NAICS code
   */
  const getCodeDescription = useCallback(
    (code: string): string | undefined => {
      const found = codes.find((c) => c.code === code);
      return found?.description;
    },
    [codes]
  );

  return (
    <NAICSContext.Provider
      value={{
        codes,
        isLoading,
        error,
        searchCodes,
        getCodeDescription,
      }}
    >
      {children}
    </NAICSContext.Provider>
  );
}

export function useNAICS() {
  const context = useContext(NAICSContext);
  if (context === undefined) {
    throw new Error("useNAICS must be used within a NAICSProvider");
  }
  return context;
}
