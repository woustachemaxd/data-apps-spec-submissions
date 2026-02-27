import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/contexts/FilterContext";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useInventory } from "@/hooks/useInventory";
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

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { startDate, endDate, comparisonLocationIds, datePreset } = useFilters();
    const { data: salesData } = useSales(
        comparisonLocationIds.length > 0 ? comparisonLocationIds : undefined
    );
    const { data: inventoryData } = useInventory(
        comparisonLocationIds.length > 0 ? comparisonLocationIds : undefined
    );
    const { data: locations } = useLocations();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Construct the context header based on UI state and actual data aggregates
    const getContextHeader = () => {
        // Calculate basic aggregates
        const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.revenue || 0), 0);
        const totalOrders = salesData.reduce((sum, s) => sum + Number(s.numOrders || 0), 0);
        const totalWasteCost = inventoryData.reduce((sum, i) => sum + Number(i.wasteCost || 0), 0);
        const totalUnitsWasted = inventoryData.reduce((sum, i) => sum + Number(i.unitsWasted || 0), 0);

        // Find top locations if we have the data
        const locationNames = comparisonLocationIds.length > 0
            ? comparisonLocationIds.map(id => locations.find(l => l.LOCATION_ID === id)?.NAME).filter(Boolean).join(", ")
            : "All Locations";

        // Pre-aggregate data by location and order type to save tokens
        const aggregatedSales = salesData.reduce((acc, s) => {
            const key = `${s.locationName}|${s.orderType}`;
            if (!acc[key]) {
                acc[key] = { revenue: 0, orders: 0 };
            }
            acc[key].revenue += Number(s.revenue || 0);
            acc[key].orders += Number(s.numOrders || 0);
            return acc;
        }, {} as Record<string, { revenue: number, orders: number }>);

        const serializedAggregates = Object.entries(aggregatedSales).map(([key, data]) => {
            const [loc, type] = key.split('|');
            return `${loc} (${type}): Rev $${Math.round(data.revenue).toLocaleString()} | Ord ${data.orders.toLocaleString()}`;
        }).join('\n');

        // Pre-aggregate inventory/waste data by location and category
        const aggregatedWaste = inventoryData.reduce((acc, i) => {
            const key = `${i.locationName}|${i.category}`;
            if (!acc[key]) {
                acc[key] = { unitsWasted: 0, wasteCost: 0 };
            }
            acc[key].unitsWasted += Number(i.unitsWasted || 0);
            acc[key].wasteCost += Number(i.wasteCost || 0);
            return acc;
        }, {} as Record<string, { unitsWasted: number, wasteCost: number }>);

        const serializedWaste = Object.entries(aggregatedWaste).map(([key, data]) => {
            const [loc, cat] = key.split('|');
            if (data.unitsWasted > 0) {
                return `${loc} (${cat}): Wasted ${data.unitsWasted.toLocaleString()} units | Cost $${Math.round(data.wasteCost).toLocaleString()}`;
            }
            return null;
        }).filter(Boolean).join('\n');

        const serializedLocations = locations.map(l =>
            `${l.NAME} - ${l.CITY}, ${l.STATE} (Cap: ${l.SEATING_CAPACITY})`
        ).join('; ');

        return `System Context: User viewing dashboard. Date range: ${startDate} to ${endDate} (${datePreset}). 
Locations filtered: ${locationNames}.
Current Data Outline: 
- Total Revenue = $${totalRevenue.toLocaleString()}
- Total Orders = ${totalOrders.toLocaleString()}
- Total Waste Cost = $${totalWasteCost.toLocaleString()}
- Total Units Wasted = ${totalUnitsWasted.toLocaleString()}
Please factor these actual numbers into your analysis.

---LOCATIONS DETAILS---
${serializedLocations}

---AGGREGATED SALES DATA---
${serializedAggregates}

---AGGREGATED WASTE DATA---
${serializedWaste || "No waste recorded for this combination."}
`;
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
            // Call the Snowflake Backend
            const apiResponse = await askCortex(fullPrompt, "llama3.1-70b");

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
        <div
            className={`fixed top-0 right-0 h-screen w-80 lg:w-96 bg-background border-l border-border flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
                }`}
        >
            {/* Blueprint grid background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="smallGrid-chat" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
                    </pattern>
                    <pattern id="grid-chat" width="100" height="100" patternUnits="userSpaceOnUse">
                        <rect width="100" height="100" fill="url(#smallGrid-chat)" />
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-chat)" />
            </svg>

            {/* Header */}
            <div className="relative z-10 h-14 bg-primary/10 border-b border-border px-4 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Snowcone AI</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Powered by Cortex 70b</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Message Area */}
            <div className="relative z-10 flex-1 p-4 overflow-y-auto flex flex-col gap-4">
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

            {/* Input Area */}
            <div className="relative z-10 p-3 bg-background border-t border-border flex flex-col gap-2 shrink-0">
                {/* Predefined Prompts Area */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {PREDEFINED_PROMPTS.map((p, idx) => (
                        <div key={idx} className="group relative flex-shrink-0">
                            <button
                                onClick={() => handleSendMessage(p.prompt)}
                                className="text-[10px] uppercase tracking-wider px-3 py-1.5 bg-muted/50 border border-border rounded-full hover:bg-muted hover:border-primary/50 transition-colors whitespace-nowrap"
                            >
                                {p.label}
                            </button>
                            {/* CSS-based Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border border-border shadow-lg z-50 whitespace-normal">
                                {p.tooltip}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover/50"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Ask something..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendMessage(inputValue);
                        }}
                        className="flex-1 rounded-full text-xs"
                    />
                    <Button size="icon" className="rounded-full shrink-0" onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim() || isTyping}>
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
