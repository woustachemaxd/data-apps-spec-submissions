import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/contexts/FilterContext";
import { askCortex } from "@/lib/snowflake";

interface ChatMessage {
    id: string;
    role: "user" | "bot";
    content: string;
    metadata?: {
        cost?: number;
        model?: string;
    };
}

// A simple utility to render basic markdown like **bold** and line breaks
function renderFormattedText(text: string) {
    if (!text) return null;

    // Split by newlines to create paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');

    return paragraphs.map((paragraph, pIndex) => {
        // Handle bold text **...**
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);

        return (
            <p key={pIndex} className="mb-2 last:mb-0 leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Text is bold
                        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </p>
        );
    });
}

const PREDEFINED_PROMPTS = [
    {
        label: "Analyze Sales",
        prompt: "Generate a 3-sentence summary of the revenue trend for the current dataset.",
        tooltip: "Hover: Analyzes the revenue trend for the current dates in exactly 3 sentences."
    },
    {
        label: "Top Locations",
        prompt: "Summarize our top-selling locations and bottom-performing locations.",
        tooltip: "Hover: Highlights the best and worst performing stores based on current filters."
    },
    {
        label: "Waste Prediction",
        prompt: "Based on current waste data, what is the trend and what can be improved?",
        tooltip: "Hover: Evaluates waste trends and suggests 1-2 quick improvements."
    }
];

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { startDate, endDate, comparisonLocationIds, datePreset } = useFilters();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Construct the context header based on UI state
    const getContextHeader = () => {
        return `System Context: User viewing dashboard. Date range: ${startDate} to ${endDate} (${datePreset}). Comparison Locations: ${comparisonLocationIds.length ? comparisonLocationIds.join(", ") : "None"}.`;
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newUserMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text,
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue("");
        setIsTyping(true);

        const contextHeader = getContextHeader();
        const fullPrompt = `${contextHeader}\n\nUser Prompt: ${text}`;

        console.log("Sending to ASK_LLM:", fullPrompt); // For debugging to see the context

        try {
            // Call the real Snowflake Backend
            const apiResponse = await askCortex(fullPrompt, "llama3.1-8b");

            console.log("ASK_LLM Response Details:", {
                modelUsed: apiResponse.model,
                cost: apiResponse.cost.toFixed(6),
                inputTokens: apiResponse.input_tokens,
                outputTokens: apiResponse.output_tokens,
                remainingCredits: apiResponse.remaining_credits.toFixed(6)
            });

            const newBotMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                content: apiResponse.response,
                metadata: {
                    cost: apiResponse.cost,
                    model: apiResponse.model
                }
            };
            setMessages((prev) => [...prev, newBotMsg]);
        } catch (error) {
            console.error("LLM Error", error);
            setMessages((prev) => [...prev, { id: Date.now().toString(), role: "bot", content: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window Popup */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in-50 duration-200">

                    {/* Header */}
                    <div className="bg-primary/10 border-b border-border p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-primary" />
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Snowcone AI</h3>
                                <p className="text-[10px] text-muted-foreground">Powered by Cortex</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Message Area */}
                    <div className="flex-1 p-3 overflow-y-auto min-h-[250px] max-h-[400px] flex flex-col gap-3">
                        {messages.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground mt-10">
                                <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                                <p>How can I help you analyze your data today?</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted text-foreground rounded-tl-sm"
                                    }`}>
                                    {msg.role === "bot" ? renderFormattedText(msg.content) : msg.content}
                                </div>

                                {/* Metadata for bot messages */}
                                {msg.role === "bot" && msg.metadata && (
                                    <div className="text-[9px] text-muted-foreground mt-1 px-1 flex gap-2">
                                        <span>Model: {msg.metadata.model}</span>
                                        <span>Cost: ${msg.metadata.cost?.toFixed(6)}</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-1 text-muted-foreground text-xs bg-muted/50 self-start px-3 py-2 rounded-lg rounded-tl-sm">
                                <span className="animate-bounce">●</span>
                                <span className="animate-bounce delay-75">●</span>
                                <span className="animate-bounce delay-150">●</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Predefined Prompts Area */}
                    <div className="p-2 bg-muted/30 border-t border-border flex gap-2 overflow-x-auto scroolbar-hide">
                        {PREDEFINED_PROMPTS.map((p, idx) => (
                            <div key={idx} className="group relative flex-shrink-0">
                                <button
                                    onClick={() => handleSendMessage(p.prompt)}
                                    className="text-xs px-2 py-1 bg-background border border-border rounded-full hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap"
                                >
                                    {p.label}
                                </button>
                                {/* CSS-based Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border border-border shadow-lg z-50">
                                    {p.tooltip}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover/50"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-background border-t border-border flex items-center gap-2">
                        <Input
                            placeholder="Ask something..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendMessage(inputValue);
                            }}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isTyping}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${isOpen ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>
        </div>
    );
}
