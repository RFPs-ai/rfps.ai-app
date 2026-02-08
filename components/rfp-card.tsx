/**
 * RFP Card Component
 * 
 * Displays RFP search results with explainability chips, collapsible match
 * explanations, and action buttons. Used in both Tool Timeline and assistant messages.
 */

import { ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/rfp-chips";
import { cn } from "@/lib/utils";
import type { RFPResult, ChipClickHandler } from "@/types/rfp";

interface RFPCardProps {
  result: RFPResult;
  onChipClick?: ChipClickHandler;
  onAnalyze?: (rfp: RFPResult) => void;
  className?: string;
  compact?: boolean; // For tool timeline compact display
  isLoading?: boolean; // Disable buttons during streaming
  hideActions?: boolean; // Hide action buttons (for analysis responses)
}

export function RFPCard({ result, onChipClick, onAnalyze, className, compact = false, isLoading = false, hideActions = false }: RFPCardProps) {
  return (
    <article
      className={cn(
        "group relative rounded-lg border bg-background/50 transition-all",
        compact
          ? "border-border/30 hover:border-border/60 hover:bg-background/80"
          : "border-neutral-200/60 bg-white shadow-sm hover:-translate-y-[1px] hover:shadow-md",
        className
      )}
    >
      {/* Accent bar */}
      {!compact && (
        <div className="absolute left-0 top-4 h-12 w-[3px] rounded-full bg-blue-500/70" />
      )}
      
      <div className={cn("p-4", !compact && "pl-6")}>
        {/* Title */}
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 group/title"
        >
          <h3 className={cn(
            "flex-1 font-semibold leading-snug text-foreground transition group-hover/title:text-primary",
            compact ? "text-sm" : "text-[17px]"
          )}>
            {result.title}
          </h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity" />
        </a>
        
        {/* Snippet */}
        {result.snippet && (
          <p className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            compact ? "text-xs line-clamp-2" : "text-sm"
          )}>
            {result.snippet}
          </p>
        )}
        
        {/* Explainability Chips */}
        <div className="mt-3">
          <ChipRow
            naicsCode={result.naicsCode}
            region={result.region}
            language={result.language}
            deadline={result.deadline}
            title={result.title}
            onChipClick={onChipClick}
          />
        </div>
        
        {/* Source badge */}
        {result.source && (
          <div className="mt-3">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
              {formatSource(result.source)}
            </Badge>
          </div>
        )}
        
        {/* Action buttons - render last, only when card is fully loaded */}
        {!compact && !hideActions && result.url && result.title && result.snippet && (
          <div className="mt-5 flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onAnalyze?.(result)}
              disabled={isLoading}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Analyze this opportunity
            </Button>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              View original
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Format source name for display
 */
function formatSource(source: string): string {
  const sourceMap: Record<string, string> = {
    "bids_tenders": "Bids & Tenders",
    "ontario_tenders": "Ontario Tenders",
    "canada_buys": "CanadaBuys",
    "merx": "MERX",
    "exa": "Exa Search",
    "tavily": "Tavily Search",
  };
  
  return sourceMap[source] || source;
}
