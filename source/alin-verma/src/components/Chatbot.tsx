/**
 * Floating chatbot component for natural language queries.
 * Uses Snowflake Cortex to convert questions to SQL and execute them.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askCortex } from "@/lib/cortex";

interface Message {
  id: string;
  type: "user" | "assistant" | "error" | "sql";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      const result = await askCortex(userMessage.content);

      if (result.success && result.response) {
        // Add the AI response
        const assistantMessage: Message = {
          id: generateId(),
          type: "assistant",
          content: result.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Error message
        const errorMessage: Message = {
          id: generateId(),
          type: "error",
          content: result.error || "Failed to process your question. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        type: "error",
        content: "An unexpected error occurred. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm
                    ${message.type === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md" 
                      : message.type === "error"
                      ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
                      : message.type === "sql"
                      ? "bg-muted/50 font-mono text-xs rounded-bl-md overflow-x-auto"
                      : "bg-muted rounded-bl-md"
                    }`}
                >
                  {message.type === "sql" ? (
                    <details className="cursor-pointer">
                      <summary className="text-xs text-muted-foreground hover:text-foreground">
                        View generated SQL
                      </summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                        {message.content}
                      </pre>
                    </details>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans break-words">
                      {message.content}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
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
              disabled={isLoading}
              className="flex-1 bg-background border rounded-full px-4 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50
                disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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