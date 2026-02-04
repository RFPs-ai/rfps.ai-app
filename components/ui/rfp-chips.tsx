/**
 * Explainability Chip Components for RFP Results
 * 
 * Displays category, region, language, and deadline information
 * with prominent styling, urgency indicators, and click handlers.
 */

import { Tag, MapPin, Languages, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatNaicsCode,
  formatRegion,
  formatLanguage,
  formatDeadline,
  getDeadlineUrgency,
  getDaysUntilDeadline,
  generateSemanticQuery,
  type ChipClickHandler,
  type DeadlineUrgency,
} from "@/types/rfp";

interface BaseChipProps {
  onClick?: ChipClickHandler;
  className?: string;
}

interface CategoryChipProps extends BaseChipProps {
  naicsCode?: string;
  title?: string; // For generating semantic query
}

export function CategoryChip({ naicsCode, title, onClick, className }: CategoryChipProps) {
  const hasValue = !!naicsCode;
  const displayText = formatNaicsCode(naicsCode);
  
  // Don't render if no value
  if (!hasValue) return null;
  
  return (
    <Badge
      variant="default"
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-blue-500 text-white shadow-sm",
        className
      )}
    >
      <Tag className="w-3 h-3" />
      <span className="text-xs font-medium">{displayText}</span>
    </Badge>
  );
}

interface RegionChipProps extends BaseChipProps {
  region?: string;
}

export function RegionChip({ region, onClick, className }: RegionChipProps) {
  const hasValue = !!region;
  const displayText = formatRegion(region);
  
  // Don't render if no value
  if (!hasValue) return null;
  
  return (
    <Badge
      variant="default"
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-purple-500 text-white shadow-sm",
        className
      )}
    >
      <MapPin className="w-3 h-3" />
      <span className="text-xs font-medium">{displayText}</span>
    </Badge>
  );
}

interface LanguageChipProps extends BaseChipProps {
  language?: string;
}

export function LanguageChip({ language, onClick, className }: LanguageChipProps) {
  const hasValue = !!language;
  const displayText = formatLanguage(language);
  
  // Don't render if no value
  if (!hasValue) return null;
  
  return (
    <Badge
      variant="default"
      className={cn(
        "inline-flex items-center gap-1.5",
        "bg-green-500 text-white shadow-sm",
        className
      )}
    >
      <Languages className="w-3 h-3" />
      <span className="text-xs font-medium">{displayText}</span>
    </Badge>
  );
}

interface DeadlineChipProps extends BaseChipProps {
  deadline?: string | Date;
}

export function DeadlineChip({ deadline, onClick, className }: DeadlineChipProps) {
  const urgency = getDeadlineUrgency(deadline);
  const hasValue = urgency !== "unknown";
  const displayText = formatDeadline(deadline);
  
  // Don't render if no value
  if (!hasValue) return null;
  
  // Color coding based on urgency
  const getUrgencyStyles = (urgency: DeadlineUrgency) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-500 text-white shadow-sm";
      case "soon":
        return "bg-yellow-500 text-white shadow-sm";
      case "normal":
        return "bg-emerald-500 text-white shadow-sm";
      default:
        return "";
    }
  };
  
  return (
    <Badge
      variant="default"
      className={cn(
        "inline-flex items-center gap-1.5",
        getUrgencyStyles(urgency),
        className
      )}
    >
      <Clock className="w-3 h-3" />
      <span className="text-xs font-medium">{displayText}</span>
    </Badge>
  );
}

interface ChipRowProps {
  naicsCode?: string;
  region?: string;
  language?: string;
  deadline?: string | Date;
  title?: string; // For category semantic queries
  onChipClick?: ChipClickHandler;
  className?: string;
}

/**
 * Complete chip row with horizontal scroll and fade gradients
 */
export function ChipRow({
  naicsCode,
  region,
  language,
  deadline,
  title,
  onChipClick,
  className,
}: ChipRowProps) {
  // Check if any chips have values
  const hasAnyChips = !!naicsCode || !!region || !!language || (deadline && getDeadlineUrgency(deadline) !== "unknown");
  
  // Don't render if no chips
  if (!hasAnyChips) return null;
  
  return (
    <div className={cn("relative", className)}>
      {/* Scrollable chip container */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1 py-1">
        <CategoryChip naicsCode={naicsCode} title={title} onClick={onChipClick} />
        <RegionChip region={region} onClick={onChipClick} />
        <LanguageChip language={language} onClick={onChipClick} />
        <DeadlineChip deadline={deadline} onClick={onChipClick} />
      </div>
    </div>
  );
}

// Add scrollbar-hide utility to globals.css if needed
// .scrollbar-hide::-webkit-scrollbar {
//   display: none;
// }
// .scrollbar-hide {
//   -ms-overflow-style: none;
//   scrollbar-width: none;
// }
