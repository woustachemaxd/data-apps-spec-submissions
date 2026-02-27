import { useMemo, useState, useRef, useCallback } from "react";
import { useInventory } from "@/hooks/useInventory";
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
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";

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
    const wasteChartRef = useRef<HTMLDivElement>(null);

    const exportChartPNG = useCallback((filename: string) => {
        const svg = wasteChartRef.current?.querySelector("svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const rect = svg.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(2, 2);
        const img = new Image();
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            URL.revokeObjectURL(url);
            const a = document.createElement("a");
            a.download = `${filename}_${new Date().toISOString().split("T")[0]}.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
        };
        img.src = url;
    }, []);

    const exportCSV = useCallback((filename: string, headers: string[], rows: (string | number)[][]) => {
        const csv = [headers.map(h => `"${h}"`).join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    }, []);

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
            <div className="bp-card p-12 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px] uppercase tracking-[0.15em]">
                    <span className="w-2 h-2 bg-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                    Loading waste data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bp-card border-destructive p-8 text-center">
                <p className="text-destructive font-medium text-sm">Failed to load waste data</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Section label */}
            <div className="bp-section-label">
                <span>Waste Analysis</span>
            </div>

            {/* Flags summary */}
            {flaggedCount > 0 && (
                <div className="flex items-center gap-2 text-xs bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-2.5">
                    <AlertTriangle size={14} />
                    <span>
                        <strong>{flaggedCount} location{flaggedCount > 1 ? "s" : ""}</strong> above the{" "}
                        {WASTE_THRESHOLD}% waste threshold
                    </span>
                </div>
            )}

            {/* Category filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mr-1">Filter:</span>
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors border ${selectedCategory === null
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                        }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                        className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors border ${selectedCategory === cat
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                            }`}
                    >
                        {CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
            </div>

            {/* Waste rate by location */}
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">No. 01</span>
                        <span className="text-sm font-semibold">
                            Waste Rate by Location
                        </span>
                        {selectedCategory && (
                            <span className="bp-badge text-muted-foreground text-[9px]">
                                {CATEGORY_LABELS[selectedCategory] || selectedCategory}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => exportChartPNG("waste_rate")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> PNG
                        </button>
                        <button
                            onClick={() => {
                                const headers = ["Location", "Waste %", "Waste Cost", "Above Threshold"];
                                const rows = wasteByLocation.map(w => [
                                    w.name, w.wastePct, `$${w.wasteCost.toLocaleString()}`, w.aboveThreshold ? "Yes" : "No"
                                ]);
                                exportCSV("waste_rate_data", headers, rows);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> CSV
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <div ref={wasteChartRef}>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart
                                data={wasteByLocation}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                                    tickFormatter={(v) => `${v}%`}
                                    domain={[0, "auto"]}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                                    width={120}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "0",
                                        fontSize: "11px",
                                        fontFamily: "'JetBrains Mono', monospace",
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
                                        fontSize: 9,
                                        fill: "var(--color-destructive)",
                                    }}
                                />
                                <Bar dataKey="wastePct" radius={[0, 0, 0, 0]}>
                                    {wasteByLocation.map((entry) => (
                                        <Cell
                                            key={entry.locationId}
                                            fill={entry.aboveThreshold ? "var(--color-destructive)" : "var(--color-chart-3)"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Waste trend table */}
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">No. 02</span>
                        <span className="text-sm font-semibold">Waste Trend (Improving / Worsening)</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
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
                                    <tr key={t.locationId} className="border-b border-border/40">
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
                                                <span className="inline-flex items-center gap-1 text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">
                                                    <ArrowDownRight size={12} /> Improving
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-500 text-[10px] font-semibold uppercase tracking-wider">
                                                    <ArrowUpRight size={12} /> Worsening
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
