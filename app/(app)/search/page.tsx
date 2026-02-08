"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, type Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, AlertCircle, RefreshCw, ArrowDown, Sparkles } from "lucide-react";
import { ToolTimeline } from "@/components/tool-timeline";

// Template prompts for getting started
const templates = [
  {
    title: "IT Consulting",
    subtitle: "Ontario, Budget > $100k",
    query: "Find IT consulting RFPs in Ontario with budgets over $100,000",
  },
  {
    title: "Software Development",
    subtitle: "British Columbia",
    query: "Search for software development opportunities in British Columbia",
  },
  {
    title: "Cybersecurity",
    subtitle: "ISO 27001 required",
    query: "Find cybersecurity RFPs requiring ISO 27001 certification",
  },
];

export default function SearchPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error, reload, setInput } =
    useChat({
      api: "/api/chat",
    });

  // Derive states
  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  // Get model name from the first assistant message's annotations (sent when DEBUG=1 on server)
  const modelName = (messages.find((m: Message) => m.role === "assistant")?.annotations as { modelName?: string }[] | undefined)?.[0]?.modelName;

  // Textarea refs for auto-focus and auto-resize
  const initialInputRef = useRef<HTMLTextAreaElement>(null);
  const conversationInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom);
    }
  }, []);

  // Auto-scroll when new content arrives (if user is at bottom)
  useEffect(() => {
    if (isAtBottom && hasMessages) {
      scrollToBottom(true);
    }
  }, [messages, isAtBottom, scrollToBottom, hasMessages]);

  // Handle template click
  const handleTemplateClick = (query: string) => {
    setInput(query);
    // Auto-resize after setting input
    setTimeout(() => {
      const ref = hasMessages ? conversationInputRef : initialInputRef;
      if (ref.current) {
        ref.current.style.height = "auto";
        ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
      }
    }, 0);
  };

  // Auto-resize textarea as content changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = "auto";
    // Set height to scrollHeight, but cap at max height (200px ~ 8 lines)
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Handle Enter to submit, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        // Reset textarea height after submit
        setTimeout(() => {
          const ref = hasMessages ? conversationInputRef : initialInputRef;
          if (ref.current) {
            ref.current.style.height = "auto";
          }
        }, 0);
      }
    }
  };

  // Override handleSubmit to reset textarea height
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    // Reset textarea height after submit
    setTimeout(() => {
      const ref = hasMessages ? conversationInputRef : initialInputRef;
      if (ref.current) {
        ref.current.style.height = "auto";
      }
    }, 0);
  };

  // Auto-focus input when user types printable characters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already focused on an input/textarea or if modifier keys are pressed
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's a printable character (single character, not control keys)
      // This includes letters, numbers, and symbols
      if (e.key.length === 1 && e.key !== " ") {
        const inputRef = hasMessages ? conversationInputRef : initialInputRef;
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasMessages]);

  return (
    <div className="chat-container flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100vh-120px)] -mt-2 md:-mt-4">
      {/* Initial State - Centered */}
      {!hasMessages && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8 px-2">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
              What can I help you find?
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Search for RFPs using natural language. I'll find relevant opportunities and explain why they match.
            </p>
            {modelName && (
              <div className="mt-3">
                <Badge variant="outline" className="text-xs font-mono opacity-60">
                  Model: {modelName}
                </Badge>
              </div>
            )}
          </div>

          {/* Centered Input */}
          <div className="w-full max-w-3xl mb-6">
            <form onSubmit={handleFormSubmit} className="w-full">
              <div className="relative flex items-end w-full max-w-3xl mx-auto">
                <div className="chat-input-container relative flex items-end w-full bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-border/80 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <textarea
                    ref={initialInputRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for RFPs..."
                    rows={1}
                    className="flex-1 bg-transparent px-5 py-4 pr-12 text-base outline-none placeholder:text-muted-foreground/60 resize-none max-h-[200px] overflow-y-auto scrollbar-thin"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Template Prompts */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateClick(template.query)}
                className="group px-4 py-3 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/40 hover:bg-muted/60 hover:border-border/60 transition-all duration-200 text-left"
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {template.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {template.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation State */}
      {hasMessages && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          {/* Messages Container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-thin"
          >
            <div className="max-w-5xl mx-auto space-y-6">
              {messages.map((message: Message, msgIndex: number) => {
                // For assistant messages, check if there's actual text content to show
                const hasTextContent = message.role === "assistant" && message.parts && message.parts.some(p => p.type === "text" && p.text);
                const hasToolInvocations = message.role === "assistant" && message.parts && message.parts.some(p => p.type === "tool-invocation");
                const isThinking = message.role === "assistant" && !hasTextContent && !hasToolInvocations;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[95%] md:max-w-[85%] rounded-2xl px-4 py-3 md:px-5 md:py-3.5 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 backdrop-blur-sm border border-border/30"
                      }`}
                    >                      {/* Thinking state */}
                      {isThinking && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      )}
                                            {/* Tool Timeline */}
                      {message.role === "assistant" && message.parts && message.parts.some(p => p.type === "tool-invocation") && (
                        <ToolTimeline
                          steps={message.parts
                            .filter(p => p.type === "tool-invocation")
                            .map(p => {
                              const toolInvocation = (p as any).toolInvocation;
                              // Map AI SDK states to our expected states
                              let mappedState: "pending" | "running" | "complete" | "error" = "running";
                              if (toolInvocation.state === "result") {
                                mappedState = "complete";
                              } else if (toolInvocation.state === "error") {
                                mappedState = "error";
                              } else if (toolInvocation.state === "call") {
                                mappedState = "running";
                              } else if (toolInvocation.state === "partial-call") {
                                mappedState = "pending";
                              }
                              
                              return {
                                toolName: toolInvocation.toolName,
                                state: mappedState,
                                args: toolInvocation.args,
                                result: toolInvocation.result,
                              };
                            })}
                        />
                      )}
                      
                      {/* Message parts (text & tool invocations) */}
                      {message.parts?.map((part, index) => {
                        // Skip tool invocations in inline display - they're in the timeline now
                        if (part.type === "tool-invocation") {
                          return null;
                        }
                        if (part.type === "text") {
                          return (
                            <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ children, ...props }) => (
                                    <a {...props} className="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">
                                      {children}
                                    </a>
                                  ),
                                  code: ({ children, ...props }) => (
                                    <code {...props} className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ),
                                  ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
                                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4">
                                      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  thead: ({ children }) => (
                                    <thead className="bg-muted/50">
                                      {children}
                                    </thead>
                                  ),
                                  tbody: ({ children }) => (
                                    <tbody className="divide-y divide-gray-300 dark:divide-gray-600">
                                      {children}
                                    </tbody>
                                  ),
                                  tr: ({ children }) => (
                                    <tr className="border-b border-gray-300 dark:border-gray-600">
                                      {children}
                                    </tr>
                                  ),
                                  th: ({ children }) => (
                                    <th className="px-4 py-2 text-left font-semibold border border-gray-300 dark:border-gray-600">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-600">
                                      {children}
                                    </td>
                                  ),
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator */}
              {status === "submitted" && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-muted/50 backdrop-blur-sm border border-border/30 rounded-2xl px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl px-4 py-3 md:px-5 md:py-3.5 max-w-[95%] md:max-w-[85%]">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Something went wrong</p>
                        <p className="text-sm opacity-90 mt-1">{error.message}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reload()}
                          className="mt-3"
                        >
                          <RefreshCw className="h-3 w-3 mr-1.5" />
                          Try again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
                onClick={() => scrollToBottom(true)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Bottom Input Bar */}
          <div className="absolute bottom-0 left-0 right-0 px-3 md:px-4 py-3 md:py-4 bg-gradient-to-t from-background via-background to-transparent pt-6">
            <form onSubmit={handleFormSubmit} className="w-full">
              <div className="relative flex items-end w-full max-w-3xl mx-auto">
                <div className="chat-input-container relative flex items-end w-full bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-border/80 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <textarea
                    ref={conversationInputRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for RFPs..."
                    rows={1}
                    className="flex-1 bg-transparent px-4 py-3 pr-12 md:px-5 md:py-4 text-base outline-none placeholder:text-muted-foreground/60 resize-none max-h-[200px] overflow-y-auto scrollbar-thin"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
