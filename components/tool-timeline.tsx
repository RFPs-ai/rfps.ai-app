import { useState } from "react";
import { Search, Globe, FileText, CheckCircle2, Loader2, Brain, HelpCircle, Download, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Check if debug mode is enabled
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === "1";

interface ToolStep {
  toolName: string;
  state: "pending" | "running" | "complete" | "error";
  args?: Record<string, any>;
  result?: any;
}

interface ToolTimelineProps {
  steps: ToolStep[];
}

const TOOL_CONFIG = {
  rfpSearch: {
    icon: Search,
    labelActive: "Searching RFPs",
    labelComplete: "Searched RFPs",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  webCrawl: {
    icon: Globe,
    labelActive: "Crawling webpage",
    labelComplete: "Crawled webpage",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  webSearch: {
    icon: Search,
    labelActive: "Searching web",
    labelComplete: "Searched web",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  contentExtract: {
    icon: Download,
    labelActive: "Extracting content",
    labelComplete: "Extracted content",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  qnaSearch: {
    icon: HelpCircle,
    labelActive: "Answering question",
    labelComplete: "Answered question",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  matching: {
    icon: Brain,
    labelActive: "Analyzing match",
    labelComplete: "Analyzed match",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  memory: {
    icon: FileText,
    labelActive: "Storing preference",
    labelComplete: "Stored preference",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
} as const;

function getToolConfig(toolName: string) {
  return TOOL_CONFIG[toolName as keyof typeof TOOL_CONFIG] || {
    icon: FileText,
    labelActive: toolName,
    labelComplete: toolName,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    borderColor: "border-muted/20",
  };
}

function formatArgs(args: Record<string, any> | undefined): string | null {
  if (!args) return null;
  
  const { query, urls, maxResults } = args;
  
  if (query) return query;
  if (urls) return Array.isArray(urls) ? `${urls.length} URL${urls.length > 1 ? 's' : ''}` : urls;
  if (maxResults) return `up to ${maxResults} results`;
  
  return null;
}

function formatResultSummary(toolName: string, result: any): string | null {
  if (!result || result.error) return null;
  
  // RFP Search - Don't show summary label
  if (toolName === "rfpSearch" && result.results) {
    return null;
  }
  
  // Web Search
  if (toolName === "webSearch" && result.results) {
    const count = result.resultCount || result.results.length;
    return `Found ${count} result${count !== 1 ? 's' : ''}`;
  }
  
  // Content Extract
  if (toolName === "contentExtract" && result.results) {
    const extracted = result.extractedCount || result.results.filter((r: any) => !r.failed).length;
    return `Extracted ${extracted} page${extracted !== 1 ? 's' : ''}`;
  }
  
  // QNA Search
  if (toolName === "qnaSearch" && result.answer) {
    const sources = result.sourceCount || result.sources?.length || 0;
    return `Answer from ${sources} source${sources !== 1 ? 's' : ''}`;
  }
  
  // Web Crawl
  if (toolName === "webCrawl" && (result.success || result.markdown)) {
    return null;
  }
  
  // Matching
  if (toolName === "matching" && result.score !== undefined) {
    return `Score: ${result.score}/100`;
  }
  
  // Memory
  if (toolName === "memory" && result.success) {
    return "Preference saved";
  }
  
  return null;
}

function ResultDetails({ toolName, result }: { toolName: string; result: any }) {
  const [showAllRfp, setShowAllRfp] = useState(false);
  const [showAllWeb, setShowAllWeb] = useState(false);

  if (!result || result.error) {
    return (
      <div className="text-xs text-destructive mt-2 p-2 bg-destructive/5 rounded border border-destructive/10">
        {result?.error || "Error occurred"}
      </div>
    );
  }
  
  // RFP Search Results
  if (toolName === "rfpSearch" && result.results) {
    const resultsToShow = showAllRfp ? result.results : result.results.slice(0, 5);
    return (
      <div className="mt-2 space-y-1.5">
        {result.source && isDebugMode && (
          <div className="text-xs text-muted-foreground/70 mb-2 font-mono">
            Provider: {result.source}
          </div>
        )}
        {resultsToShow.map((item: any, i: number) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded bg-background/50 hover:bg-background/80 border border-border/30 hover:border-border/60 transition-all group text-xs"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                {item.title}
              </div>
              {item.snippet && (
                <div className="text-muted-foreground line-clamp-2 mt-0.5">
                  {item.snippet}
                </div>
              )}
            </div>
          </a>
        ))}
        {result.results.length > 5 && !showAllRfp && (
          <button
            onClick={() => setShowAllRfp(true)}
            className="text-xs text-muted-foreground hover:text-foreground text-center py-1 w-full hover:underline transition-colors"
          >
            + more results
          </button>
        )}
        {showAllRfp && result.results.length > 5 && (
          <button
            onClick={() => setShowAllRfp(false)}
            className="text-xs text-muted-foreground hover:text-foreground text-center py-1 w-full hover:underline transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    );
  }
  
  // Web Search Results
  if (toolName === "webSearch" && result.results) {
    const resultsToShow = showAllWeb ? result.results : result.results.slice(0, 5);
    return (
      <div className="mt-2 space-y-2">
        {result.source && isDebugMode && (
          <div className="text-xs text-muted-foreground/70 mb-2 font-mono">
            Provider: {result.source}
          </div>
        )}
        {result.answer && (
          <div className="p-2 bg-background/50 rounded border border-border/30 text-xs">
            <div className="font-medium text-foreground mb-1">AI Summary:</div>
            <div className="text-muted-foreground">{result.answer}</div>
          </div>
        )}
        <div className="space-y-1.5">
          {resultsToShow.map((item: any, i: number) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 p-2 rounded bg-background/50 hover:bg-background/80 border border-border/30 hover:border-border/60 transition-all group text-xs"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                  {item.title}
                </div>
                {item.content && (
                  <div className="text-muted-foreground line-clamp-2 mt-0.5">
                    {item.content}
                  </div>
                )}
              </div>
            </a>
          ))}
          {result.results.length > 5 && !showAllWeb && (
            <button
              onClick={() => setShowAllWeb(true)}
              className="text-xs text-muted-foreground hover:text-foreground text-center py-1 w-full hover:underline transition-colors"
            >
              + {result.results.length - 5} more results
            </button>
          )}
          {showAllWeb && result.results.length > 5 && (
            <button
              onClick={() => setShowAllWeb(false)}
              className="text-xs text-muted-foreground hover:text-foreground text-center py-1 w-full hover:underline transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Content Extract Results
  if (toolName === "contentExtract" && result.results) {
    return (
      <div className="mt-2 space-y-1.5">
        {result.source && isDebugMode && (
          <div className="text-xs text-muted-foreground/70 mb-2 font-mono">
            Provider: {result.source}
          </div>
        )}
        {result.results.map((item: any, i: number) => (
          <div
            key={i}
            className="p-2 rounded bg-background/50 border border-border/30 text-xs"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-medium text-foreground hover:text-primary mb-1 group"
            >
              <ExternalLink className="w-3 h-3 group-hover:text-primary" />
              <span className="line-clamp-1">{item.url}</span>
            </a>
            {item.content && (
              <div className="text-muted-foreground line-clamp-3 mt-1">
                {item.content.slice(0, 200)}...
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // QNA Search Results
  if (toolName === "qnaSearch") {
    return (
      <div className="mt-2 space-y-2">
        {result.source && isDebugMode && (
          <div className="text-xs text-muted-foreground/70 mb-2 font-mono">
            Provider: {result.source}
          </div>
        )}
        {result.answer && (
          <div className="p-2 bg-background/50 rounded border border-border/30 text-xs">
            <div className="font-medium text-foreground mb-1">Answer:</div>
            <div className="text-muted-foreground">{result.answer}</div>
          </div>
        )}
        {result.sources && result.sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Sources:</div>
            {result.sources.map((item: any, i: number) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded bg-background/50 hover:bg-background/80 border border-border/30 hover:border-border/60 transition-all group text-xs"
              >
                <ExternalLink className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground line-clamp-1 group-hover:text-primary">
                    {item.title}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Web Crawl Result
  if (toolName === "webCrawl" && (result.success || result.markdown)) {
    return (
      <div className="mt-2">
        <div className="p-2 rounded bg-background/50 border border-border/30 text-xs">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-foreground hover:text-primary mb-1 group"
          >
            <ExternalLink className="w-3 h-3 group-hover:text-primary" />
            <span className="line-clamp-1">{result.url}</span>
          </a>
          {result.markdown && (
            <div className="text-muted-foreground mt-1 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {result.markdown}
            </div>
          )}
          {result.source && isDebugMode && (
            <div className="text-xs text-muted-foreground/70 mt-1">
              Source: {result.source}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Matching Result
  if (toolName === "matching") {
    return (
      <div className="mt-2 p-2 rounded bg-background/50 border border-border/30 text-xs space-y-2">
        {result.score !== undefined && (
          <div>
            <span className="font-medium">Score: </span>
            <span className="text-foreground">{result.score}/100</span>
          </div>
        )}
        {result.recommendation && (
          <div>
            <span className="font-medium">Recommendation: </span>
            <Badge variant={result.recommendation === "pursue" ? "default" : "secondary"} className="text-xs">
              {result.recommendation}
            </Badge>
          </div>
        )}
        {result.matchReasons && result.matchReasons.length > 0 && (
          <div>
            <div className="font-medium mb-1">Reasons:</div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              {result.matchReasons.map((reason: string, i: number) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  return null;
}

export function ToolTimeline({ steps }: ToolTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  
  if (steps.length === 0) return null;

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2 mb-4">
      {steps.map((step, index) => {
        const config = getToolConfig(step.toolName);
        const Icon = config.icon;
        const argsText = formatArgs(step.args);
        const resultSummary = formatResultSummary(step.toolName, step.result);
        const isLast = index === steps.length - 1;
        const isExpanded = expandedSteps.has(index);
        const hasResult = step.state === "complete" && step.result && !step.result.error;
        const isClickable = step.state === "complete" || step.state === "error";
        
        return (
          <div key={index} className="flex gap-3 items-center">
            {/* Timeline column */}
            <div className="flex flex-col items-center self-stretch">
              {/* Icon circle */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 flex-shrink-0 ${
                  step.state === "complete"
                    ? "bg-green-500/10 border-green-500/30"
                    : step.state === "error"
                    ? "bg-red-500/10 border-red-500/30"
                    : step.state === "running"
                    ? `${config.bgColor} ${config.borderColor} animate-pulse`
                    : "bg-muted/10 border-muted/20"
                }`}
              >
                {step.state === "complete" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : step.state === "running" ? (
                  <Loader2 className={`w-4 h-4 ${config.color} animate-spin`} />
                ) : (
                  <Icon className={`w-4 h-4 ${step.state === "error" ? "text-red-500" : config.color}`} />
                )}
              </div>
              
              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-6 transition-colors duration-300 ${
                    step.state === "complete"
                      ? "bg-green-500/30"
                      : step.state === "running"
                      ? "bg-gradient-to-b from-green-500/30 to-muted/20"
                      : "bg-muted/20"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <button
                onClick={() => isClickable && toggleStep(index)}
                disabled={!isClickable}
                className={`w-full text-left ${isClickable ? 'cursor-pointer hover:bg-muted/30 rounded-lg p-1 -m-1 transition-colors' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {isClickable && (
                    <div className="text-muted-foreground flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground flex-shrink-0">
                    {step.state === "complete" ? config.labelComplete : config.labelActive}
                  </span>
                  {step.state === "complete" && resultSummary && (
                    <Badge variant="outline" className="text-xs px-2 py-0 border-green-500/30 text-green-600 dark:text-green-400 flex-shrink-0">
                      {resultSummary}
                    </Badge>
                  )}
                  {step.state === "error" && (
                    <Badge variant="destructive" className="text-xs px-2 py-0 flex-shrink-0">
                      Failed
                    </Badge>
                  )}
                </div>
                {argsText && !isExpanded && isDebugMode && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {argsText}
                  </p>
                )}
              </button>
              
              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-2 animate-in slide-in-from-top-1 duration-200">
                  {argsText && isDebugMode && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Query: {argsText}
                    </p>
                  )}
                  <ResultDetails toolName={step.toolName} result={step.result} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
