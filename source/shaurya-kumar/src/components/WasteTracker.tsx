import { useMemo, useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from "recharts";
import { AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

const WASTE_THRESHOLD = 10; // 10% waste rate is the threshold




const CATEGORY_LABELS: Record<string, string> = {
    dairy: "Dairy",
    produce: "Produce",
    cones_cups: "Cones & Cups",
    toppings: "Toppings",
    syrups: "Syrups",
};

export default function WasteTracker() {
    const { wasteSummary, data: rawData, loading, error } = useInventory();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Waste by location (aggregated across categories)
    const wasteByLocation = useMemo(() => {
        const grouped: Record<number, { name: string; totalWaste: number; totalReceived: number; wasteCost: number }> = {};

        const filtered = selectedCategory
            ? wasteSummary.filter((w) => w.category === selectedCategory)
            : wasteSummary;

        for (const w of filtered) {
            if (!grouped[w.locationId]) {
                grouped[w.locationId] = {
                    name: w.locationName,
                    totalWaste: 0,
                    totalReceived: 0,
                    wasteCost: 0,
                };
            }
            grouped[w.locationId].totalWaste += w.totalWasted;
            grouped[w.locationId].totalReceived += w.totalReceived;
            grouped[w.locationId].wasteCost += w.totalWasteCost;
        }

        return Object.entries(grouped)
            .map(([id, v]) => ({
                locationId: Number(id),
                name: v.name,
                wastePct: v.totalReceived > 0 ? Math.round((v.totalWaste / v.totalReceived) * 1000) / 10 : 0,
                wasteCost: Math.round(v.wasteCost * 100) / 100,
                aboveThreshold: v.totalReceived > 0 && (v.totalWaste / v.totalReceived) * 100 > WASTE_THRESHOLD,
            }))
            .sort((a, b) => b.wastePct - a.wastePct);
    }, [wasteSummary, selectedCategory]);

    // Waste trend: compare first half vs second half of raw data
    const wasteTrend = useMemo(() => {
        if (rawData.length === 0) return [];

        const dates = [...new Set(rawData.map((r) => r.recordDate))].sort();
        const midIdx = Math.floor(dates.length / 2);
        const midDate = dates[midIdx];

        const locationTrends: Record<number, { name: string; earlyWaste: number; lateWaste: number; earlyReceived: number; lateReceived: number }> = {};

        for (const r of rawData) {
            if (!locationTrends[r.locationId]) {
                locationTrends[r.locationId] = {
                    name: r.locationName,
                    earlyWaste: 0,
                    lateWaste: 0,
                    earlyReceived: 0,
                    lateReceived: 0,
                };
            }
            if (r.recordDate < midDate) {
                locationTrends[r.locationId].earlyWaste += r.unitsWasted;
                locationTrends[r.locationId].earlyReceived += r.unitsReceived;
            } else {
                locationTrends[r.locationId].lateWaste += r.unitsWasted;
                locationTrends[r.locationId].lateReceived += r.unitsReceived;
            }
        }

        return Object.entries(locationTrends).map(([id, t]) => {
            const earlyPct = t.earlyReceived > 0 ? (t.earlyWaste / t.earlyReceived) * 100 : 0;
            const latePct = t.lateReceived > 0 ? (t.lateWaste / t.lateReceived) * 100 : 0;
            return {
                locationId: Number(id),
                name: t.name,
                earlyPct: Math.round(earlyPct * 10) / 10,
                latePct: Math.round(latePct * 10) / 10,
                improving: latePct < earlyPct,
            };
        });
    }, [rawData]);

    const categories = useMemo(
        () => [...new Set(wasteSummary.map((w) => w.category))].sort(),
        [wasteSummary]
    );

    const flaggedCount = wasteByLocation.filter((w) => w.aboveThreshold).length;

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading waste data...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="py-8 text-center">
                    <p className="text-destructive font-medium">Failed to load waste data</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Flags summary */}
            {flaggedCount > 0 && (
                <div className="flex items-center gap-2 text-sm bg-red-500/5 border border-red-500/20 text-red-600 px-4 py-2.5 rounded-lg">
                    <AlertTriangle size={16} />
                    <span>
                        <strong>{flaggedCount} location{flaggedCount > 1 ? "s" : ""}</strong> above the{" "}
                        {WASTE_THRESHOLD}% waste threshold
                    </span>
                </div>
            )}

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Filter by category:</span>
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedCategory === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedCategory === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                            }`}
                    >
                        {CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Waste rate by location */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            Waste Rate by Location
                            {selectedCategory && (
                                <Badge variant="outline" className="ml-2 text-xs font-normal">
                                    {CATEGORY_LABELS[selectedCategory] || selectedCategory}
                                </Badge>
                            )}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart
                            data={wasteByLocation}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                            <XAxis
                                type="number"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => `${v}%`}
                                domain={[0, "auto"]}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={120}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--color-popover)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                formatter={(v?: number) => [`${v ?? 0}%`, "Waste Rate"]}
                            />
                            <ReferenceLine
                                x={WASTE_THRESHOLD}
                                stroke="var(--color-destructive)"
                                strokeDasharray="3 3"
                                label={{
                                    value: `${WASTE_THRESHOLD}% threshold`,
                                    position: "top",
                                    fontSize: 10,
                                    fill: "var(--color-destructive)",
                                }}
                            />
                            <Bar dataKey="wastePct" radius={[0, 4, 4, 0]}>
                                {wasteByLocation.map((entry) => (
                                    <Cell
                                        key={entry.locationId}
                                        fill={entry.aboveThreshold ? "var(--color-destructive)" : "var(--color-chart-3)"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Waste trend table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Waste Trend (Improving / Worsening)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                                    <th className="text-left px-4 py-3 font-medium">Location</th>
                                    <th className="text-right px-4 py-3 font-medium">Earlier Period</th>
                                    <th className="text-right px-4 py-3 font-medium">Recent Period</th>
                                    <th className="text-center px-4 py-3 font-medium">Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wasteTrend
                                    .sort((a, b) => b.latePct - a.latePct)
                                    .map((t) => (
                                        <tr key={t.locationId} className="border-b border-border/50">
                                            <td className="px-4 py-2.5 font-medium">{t.name}</td>
                                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                                                {t.earlyPct}%
                                            </td>
                                            <td
                                                className={`px-4 py-2.5 text-right tabular-nums font-medium ${t.latePct > WASTE_THRESHOLD ? "text-red-500" : ""
                                                    }`}
                                            >
                                                {t.latePct}%
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {t.improving ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                                                        <ArrowDownRight size={14} /> Improving
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                                                        <ArrowUpRight size={14} /> Worsening
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
