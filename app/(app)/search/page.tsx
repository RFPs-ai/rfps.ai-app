"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat, type Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, AlertCircle, RefreshCw, ArrowDown } from "lucide-react";

export default function SearchPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error, reload } =
    useChat({
      api: "/api/chat",
    });

  // Derive loading state from status
  const isLoading = status === "submitted" || status === "streaming";

  // Get model name from the first assistant message's annotations (sent when DEBUG=1 on server)
  const modelName = (messages.find((m: Message) => m.role === "assistant")?.annotations as { modelName?: string }[] | undefined)?.[0]?.modelName;

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
    if (isAtBottom) {
      // Use smooth scroll for small updates, instant for larger jumps
      scrollToBottom(true);
    }
  }, [messages, isAtBottom, scrollToBottom]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Search</h1>
        <p className="text-muted-foreground">
          Search for RFPs using natural language. The AI will find relevant
          opportunities and explain why they match.
        </p>
        {modelName && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs font-mono">
              Model: {modelName}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Search Query</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-[500px] overflow-y-auto pr-4"
            >
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg font-medium mb-2">
                      Start searching for RFPs
                    </p>
                    <p className="text-sm">
                      Try: "Find software development RFPs in Ontario with
                      budgets over $100k"
                    </p>
                  </div>
                )}

                {messages.map((message: Message, msgIndex: number) => {
                  // Skip rendering empty assistant messages (no parts yet)
                  const hasContent = message.role === "user" || 
                    (message.parts && message.parts.length > 0);
                  
                  if (!hasContent) return null;

                  // Check if this is the last message and we're still loading
                  const isLastMessage = msgIndex === messages.length - 1;
                  const showInlineLoader = isLastMessage && message.role === "assistant" && isLoading;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {/* Message parts (text & tool invocations) */}
                        {message.parts?.map((part, index) => {
                          if (part.type === "tool-invocation") {
                            const { toolInvocation } = part;
                            return (
                              <div
                                key={toolInvocation.toolCallId}
                                className="mb-2 text-sm opacity-80"
                              >
                                {toolInvocation.toolName === "rfpSearch" && (
                                  <Badge variant="secondary">
                                    🔍 Searching for RFPs...
                                  </Badge>
                                )}
                                {toolInvocation.toolName === "webCrawl" && (
                                  <Badge variant="secondary">
                                    🌐 Crawling page...
                                  </Badge>
                                )}
                                {toolInvocation.toolName === "matching" && (
                                  <Badge variant="secondary">
                                    🎯 Analyzing match...
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                          if (part.type === "text") {
                            return (
                              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    // Style links
                                    a: ({ children, ...props }) => (
                                      <a {...props} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                                        {children}
                                      </a>
                                    ),
                                    // Style code blocks
                                    code: ({ children, ...props }) => (
                                      <code {...props} className="bg-muted-foreground/20 px-1 py-0.5 rounded text-sm">
                                        {children}
                                      </code>
                                    ),
                                    // Style lists
                                    ul: ({ children }) => <ul className="list-disc pl-4 my-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 my-2">{children}</ol>,
                                    // Style paragraphs
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  }}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              </div>
                            );
                          }
                          return null;
                        })}
                        
                        {/* Inline loading indicator for streaming message */}
                        {/* {showInlineLoader && (
                          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        )} */}
                      </div>
                    </div>
                  );
                })}

                {status === "submitted" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex justify-start">
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 max-w-[80%]">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Error</p>
                          <p className="text-sm opacity-90">{error.message}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => reload()}
                            className="mt-2"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
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
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-20 right-8 rounded-full shadow-lg"
                onClick={() => scrollToBottom(true)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Describe the type of RFP you're looking for..."
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Example Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Example Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button
                onClick={() =>
                  handleInputChange({
                    target: {
                      value:
                        "Find IT consulting RFPs in Ontario with budgets over $100,000",
                    },
                  } as any)
                }
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">IT Consulting - Ontario</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Budget &gt; $100k
                </p>
              </button>

              <button
                onClick={() =>
                  handleInputChange({
                    target: {
                      value:
                        "Search for software development opportunities in British Columbia",
                    },
                  } as any)
                }
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">Software Development - BC</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Any budget
                </p>
              </button>

              <button
                onClick={() =>
                  handleInputChange({
                    target: {
                      value:
                        "Find cybersecurity RFPs requiring ISO 27001 certification",
                    },
                  } as any)
                }
                className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">Cybersecurity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ISO 27001 required
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
