/**
 * Floating chatbot component for natural language queries.
 * Uses Snowflake Cortex to convert questions to SQL and execute them.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Database, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateSQL } from "@/lib/cortex";
import { querySnowflake } from "@/lib/snowflake";

interface Message {
  id: string;
  type: "user" | "assistant" | "error" | "sql" | "table";
  content: string;
  data?: Record<string, unknown>[];
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingSQL, setIsExecutingSQL] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Step 1: Generate SQL query
      const { sql, error } = await generateSQL(userMessage.content);

      if (!sql) {
        const errorMessage: Message = {
          id: generateId(),
          type: "error",
          content: error || "Failed to generate SQL query",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Show the SQL immediately
      const sqlMessage: Message = {
        id: generateId(),
        type: "sql",
        content: sql,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, sqlMessage]);
      setIsLoading(false);
      setIsExecutingSQL(true);

      // Step 2: Execute the SQL query
      const data = await querySnowflake<Record<string, unknown>>(sql);
      setIsExecutingSQL(false);

      // Step 3: Show results as table
      const tableMessage: Message = {
        id: generateId(),
        type: "table",
        content: data.length === 0 ? "No results found" : `Found ${data.length} results`,
        data: data,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, tableMessage]);
    } catch (error) {
      setIsLoading(false);
      setIsExecutingSQL(false);
      const errorMessage: Message = {
        id: generateId(),
        type: "error",
        content: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [input, isLoading]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Suggested questions
  const suggestions = [
    "What are the top 5 locations by revenue?",
    "Show me recent low ratings",
    "Which location has the most waste?",
    "What's the average order value?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      // Check if it looks like revenue (large number)
      if (value > 1000) {
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg 
          bg-gradient-to-br from-blue-500 to-purple-600 text-white
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 hover:shadow-xl
          ${isOpen ? "rotate-180" : "rotate-0"}`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]
          bg-card border rounded-2xl shadow-2xl
          transition-all duration-300 ease-in-out
          ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Data Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask anything about your data</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(70vh - 180px)" }}>
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me anything about your snow cone shop data!
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 
                        text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[95%] rounded-2xl px-4 py-2.5 text-sm
                    ${message.type === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md" 
                      : message.type === "error"
                      ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
                      : message.type === "sql"
                      ? "bg-muted/50 rounded-bl-md w-full"
                      : message.type === "table"
                      ? "bg-muted/30 rounded-bl-md w-full overflow-hidden"
                      : "bg-muted rounded-bl-md"
                    }`}
                >
                  {message.type === "sql" ? (
                    <details className="cursor-pointer" open>
                      <summary className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Code2 className="h-3 w-3" />
                        Generated SQL
                      </summary>
                      <pre className="mt-2 text-xs font-mono whitespace-pre-wrap break-all bg-background/50 p-2 rounded">
                        {message.content}
                      </pre>
                    </details>
                  ) : message.type === "table" ? (
                    message.data && message.data.length > 0 ? (
                      <div className="overflow-x-auto -mx-4 -mb-2.5 -mt-1">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(message.data[0]).map((col) => (
                                <TableHead key={col} className="text-xs font-semibold whitespace-nowrap">
                                  {col}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {message.data.slice(0, 10).map((row, i) => (
                              <TableRow key={i}>
                                {Object.values(row).map((value, j) => (
                                  <TableCell key={j} className="text-xs whitespace-nowrap">
                                    {formatCellValue(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {message.data.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            ... and {message.data.length - 10} more rows
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No results found</p>
                    )
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans break-words">
                      {message.content}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator for SQL generation */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating SQL...</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator for SQL execution */}
          {isExecutingSQL && (
            <div className="flex justify-start">
              <div className="bg-muted/30 rounded-2xl rounded-bl-md p-3 w-full max-w-[95%]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Executing query...</span>
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your data..."
              disabled={isLoading || isExecutingSQL}
              className="flex-1 bg-background border rounded-full px-4 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50
                disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isExecutingSQL}
              size="icon"
              className="rounded-full w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 
                hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Powered by Snowflake Cortex (snowflake-arctic)
          </p>
        </div>
      </div>
    </>
  );
}