import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { querySnowflake } from "@/lib/snowflake";
import { useTheme } from "@/hooks/useTheme";
import { MoonIcon, SunIcon, SendIcon, Bot, User } from "lucide-react";

// --- Types & Helpers ---

type AskLlmResponse = {
  response: string;
  cost?: number;
  model?: string;
};

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string };

function escapeSqlStringLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function tryParseAskLlm(payload: unknown): AskLlmResponse | null {
  if (!payload) return null;
  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.response === "string") {
      return obj as unknown as AskLlmResponse;
    }
  }
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as unknown;
      return tryParseAskLlm(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

function extractFirstCell(rows: Record<string, unknown>[]): unknown {
  if (!rows.length) return null;
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  if (!keys.length) return first;
  return first[keys[0] as keyof typeof first];
}

export default function AiPage() {
  const { theme, toggle } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Hidden state configuration
  const [email] = useState(() => localStorage.getItem("dm_email") ?? "deepanshu.sharma@datamavericks.com");
  const model = "llama3.1-70b"; 

  const [prompt, setPrompt] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hello! I'm your Data Assistant. Ask me anything about your sales, inventory, or operations.",
    },
  ]);

  // Restore Quick Prompts
  const quickPrompts = useMemo(
    () => [
      {
        title: "Top-selling locations",
        prompt:
          "Summarize our top-selling locations",
      },
      {
        title: "Ops risk scan",
        prompt:
          "Based on common ops signals, what should a regional manager look for daily in an ice cream chain? Keep it short and actionable.",
      },
      {
        title: "Waste playbook",
        prompt:
          "Give 5 practical ways to reduce inventory waste in a multi-location ice cream business.",
      },
      {
        title: "Review themes",
        prompt:
          "Suggest a quick way to categorize customer reviews for store operations (themes + recommended actions).",
      },
    ],
    []
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Updated send function to accept custom text (from clicks)
  async function send(customPrompt?: string) {
    const effectivePrompt = (customPrompt ?? prompt).trim();
    if (!effectivePrompt || sending) return;

    setSending(true);
    const nowId = String(Date.now());
    
    // Optimistically add user message
    setMessages((prev) => [
      ...prev,
      { id: `u_${nowId}`, role: "user", text: effectivePrompt },
    ]);
    setPrompt("");

    try {
      const safeEmail = escapeSqlStringLiteral(email.trim());
      const safePrompt = escapeSqlStringLiteral(effectivePrompt);
      const safeModel = escapeSqlStringLiteral(model);

      const sql = `CALL ASK_LLM('${safeEmail}', '${safePrompt}', '${safeModel}');`;
      
      const rows = await querySnowflake<Record<string, unknown>>(sql);
      const cell = extractFirstCell(rows);
      const parsed = tryParseAskLlm(cell);

      const assistantText = parsed?.response ?? "I couldn't process that response.";

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${nowId}`,
          role: "assistant",
          text: assistantText,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_err_${nowId}`,
          role: "assistant",
          text: "Sorry, I encountered an error connecting to the database.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* --- Header --- */}
      <header className="border-b px-6 py-3 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost">
            <Link to="/">← Back</Link>
          </Button>
          <span className="font-semibold text-sm">Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={toggle}
          >
            {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* --- Chat Area --- */}
      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar Replacement (Simple Div) */}
              <div 
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full mt-1 ${
                  m.role === "assistant" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>

              {/* Message Bubble */}
              <div
                className={`group relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 border border-border/50 rounded-tl-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Quick Prompts (Only show if there is only 1 message - the intro) */}
          {messages.length === 1 && !sending && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {quickPrompts.map((q) => (
                <button
                  key={q.title}
                  onClick={() => void send(q.prompt)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border/50 bg-background p-3 text-left text-sm transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <span className="font-medium text-xs">{q.title}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2">
                    {q.prompt}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          {sending && (
            <div className="flex gap-3">
               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                 <Bot size={16} />
               </div>
               <div className="bg-muted/50 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-[46px]">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Input Area --- */}
      <footer className="p-4 border-t bg-background">
        <div className="max-w-3xl mx-auto relative flex items-end gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="min-h-[50px] max-h-[200px] resize-none py-3 pr-12 rounded-xl bg-muted/30 focus-visible:ring-1"
          />
          <Button 
            size="icon" 
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg" 
            onClick={() => void send()}
            disabled={!prompt.trim() || sending}
          >
            <SendIcon className="size-4" />
          </Button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground opacity-50">
                AI can make mistakes. Check important info.
            </span>
        </div>
      </footer>
    </div>
  );
}