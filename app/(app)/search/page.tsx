"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";

export default function SearchPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Search</h1>
        <p className="text-muted-foreground">
          Search for RFPs using natural language. The AI will find relevant
          opportunities and explain why they match.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Search Query</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
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

                {messages.map((message) => (
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
                      {/* Tool invocations */}
                      {message.toolInvocations?.map((tool) => (
                        <div
                          key={tool.toolCallId}
                          className="mb-2 text-sm opacity-80"
                        >
                          {tool.toolName === "rfpSearch" && (
                            <Badge variant="secondary">
                              🔍 Searching for RFPs...
                            </Badge>
                          )}
                          {tool.toolName === "webCrawl" && (
                            <Badge variant="secondary">
                              🌐 Crawling page...
                            </Badge>
                          )}
                          {tool.toolName === "matching" && (
                            <Badge variant="secondary">
                              🎯 Analyzing match...
                            </Badge>
                          )}
                        </div>
                      ))}

                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

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
