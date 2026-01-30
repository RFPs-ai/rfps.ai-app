"use client";

import { NAICSProvider } from "@/components/naics-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <NAICSProvider>{children}</NAICSProvider>;
}
