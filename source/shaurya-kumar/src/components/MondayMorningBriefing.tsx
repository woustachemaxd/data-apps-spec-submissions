import { useState } from "react";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useInventory } from "@/hooks/useInventory";
import { askCortex } from "@/lib/snowflake";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function MondayMorningBriefing() {
    const { data: salesData, loading: salesLoading } = useSales();
    const { data: locations, loading: locLoading } = useLocations();
    const { data: inventoryData, loading: invLoading } = useInventory();

    const [briefing, setBriefing] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoading = salesLoading || locLoading || invLoading;

    const generateBriefing = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // 1. Condense the text significantly to save tokens
            // Calculate basic aggregates
            const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.revenue || 0), 0);
            const totalOrders = salesData.reduce((sum, s) => sum + Number(s.numOrders || 0), 0);

            // Pre-aggregate data by location to save tokens
            const locStats = locations.map(l => {
                const locSales = salesData.filter(s => s.locationId === l.LOCATION_ID);
                const locInv = inventoryData.filter(i => i.locationId === l.LOCATION_ID);

                const rev = locSales.reduce((sum, s) => sum + Number(s.revenue || 0), 0);
                const waste = locInv.reduce((sum, i) => sum + Number(i.wasteCost || 0), 0);

                return `${l.NAME}: Rev $${Math.round(rev).toLocaleString()}, Waste $${Math.round(waste).toLocaleString()}`;
            }).join('; ');

            const promptContext = `
You are the AI assistant for an operations manager of an ice cream chain.
Write a 3-bullet point "Monday Morning Briefing" summarizing the following data.
Focus only on actionable insights. Call out the top performer and the most concerning location (e.g. high waste or low relative revenue).
Keep it extremely brief and professional. 
Format as a Markdown list. Do not use asterisks for bolding, just write normal text.
Data:
Total Org Revenue: $${Math.round(totalRevenue).toLocaleString()}
Total Org Orders: ${totalOrders.toLocaleString()}
Location Breakdown: ${locStats}
`;

            const response = await askCortex(promptContext, 'llama3.1-8b');
            setBriefing(response.response);

        } catch (err: any) {
            console.error("Failed to generate briefing:", err);
            setError(err.message || "Failed to generate briefing.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="bp-card overflow-hidden relative mb-6">
            {/* Subtle animated background gradient for the 'AI' feel */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

            <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">

                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-primary/20 text-primary p-1.5 rounded-md">
                            <Sparkles size={16} />
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight">Weekly Briefing</h2>
                        <span className="bp-spec ml-2">PREVIEW</span>
                    </div>

                    {!briefing && !isGenerating && !error && (
                        <p className="text-sm text-muted-foreground w-full md:w-3/4">
                            Generate an AI executive summary of this week's performance across all locations. Identifies critical action items and top performers instantly.
                        </p>
                    )}

                    {isGenerating && (
                        <p className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing location performance, sales trends, and inventory waste...
                        </p>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </p>
                    )}

                    {briefing && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm space-y-2 text-muted-foreground">
                            <ReactMarkdown
                                components={{
                                    ul: ({ ...props }) => <ul className="space-y-1.5 list-none m-0 p-0" {...props} />,
                                    li: ({ ...props }) => (
                                        <li className="flex items-start gap-2" {...props}>
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <span>{props.children}</span>
                                        </li>
                                    )
                                }}
                            >
                                {briefing}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex items-center justify-end">
                    <Button
                        onClick={generateBriefing}
                        disabled={isGenerating}
                        variant={briefing ? "outline" : "default"}
                        className="gap-2 shadow-sm font-mono text-xs uppercase tracking-wider"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                GENERATING...
                            </>
                        ) : briefing ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                REGENERATE BRIEFING
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                GENERATE BRIEFING
                            </>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}
