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
    LineChart,
    Line,
    PieChart,
    Pie,
} from "recharts";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { formatShortDate } from "@/lib/dateUtils";

const WASTE_THRESHOLD = 10; // 10% waste rate threshold

const CATEGORY_LABELS: Record<string, string> = {
    dairy: "Dairy",
    produce: "Produce",
    cones_cups: "Cones & Cups",
    toppings: "Toppings",
    syrups: "Syrups",
};

const CATEGORY_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
];

export default function WasteTracker() {
    const { wasteSummary, data: rawData, loading, error } = useInventory();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const wasteChartRef = useRef<HTMLDivElement>(null);
    const costChartRef = useRef<HTMLDivElement>(null);

    const exportChartPNG = useCallback((ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
        const svg = ref.current?.querySelector("svg");
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

    // ── Waste by location (existing) ──
    const wasteByLocation = useMemo(() => {
        const grouped: Record<number, { name: string; totalWaste: number; totalReceived: number; wasteCost: number }> = {};
        const filtered = selectedCategory ? wasteSummary.filter((w) => w.category === selectedCategory) : wasteSummary;
        for (const w of filtered) {
            if (!grouped[w.locationId]) {
                grouped[w.locationId] = { name: w.locationName, totalWaste: 0, totalReceived: 0, wasteCost: 0 };
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

    // ── Waste trend (existing) ──
    const wasteTrend = useMemo(() => {
        if (rawData.length === 0) return [];
        const dates = [...new Set(rawData.map((r) => r.recordDate))].sort();
        const midIdx = Math.floor(dates.length / 2);
        const midDate = dates[midIdx];
        const locationTrends: Record<number, { name: string; earlyWaste: number; lateWaste: number; earlyReceived: number; lateReceived: number }> = {};
        for (const r of rawData) {
            if (!locationTrends[r.locationId]) {
                locationTrends[r.locationId] = { name: r.locationName, earlyWaste: 0, lateWaste: 0, earlyReceived: 0, lateReceived: 0 };
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

    // ── NEW: Daily waste cost over time ──
    const dailyWasteCost = useMemo(() => {
        const grouped: Record<string, number> = {};
        for (const r of rawData) {
            grouped[r.recordDate] = (grouped[r.recordDate] || 0) + r.wasteCost;
        }
        return Object.entries(grouped)
            .map(([date, cost]) => ({
                date: formatShortDate(date),
                rawDate: date,
                cost: Math.round(cost * 100) / 100,
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    }, [rawData]);

    const totalWasteCost = useMemo(
        () => dailyWasteCost.reduce((s, d) => s + d.cost, 0),
        [dailyWasteCost]
    );

    // ── NEW: Category waste distribution (donut) ──
    const categoryDistribution = useMemo(() => {
        const grouped: Record<string, { wasted: number; received: number; cost: number }> = {};
        for (const w of wasteSummary) {
            if (!grouped[w.category]) grouped[w.category] = { wasted: 0, received: 0, cost: 0 };
            grouped[w.category].wasted += w.totalWasted;
            grouped[w.category].received += w.totalReceived;
            grouped[w.category].cost += w.totalWasteCost;
        }
        const totalWasted = Object.values(grouped).reduce((s, g) => s + g.wasted, 0);
        return Object.entries(grouped).map(([cat, g]) => ({
            name: CATEGORY_LABELS[cat] || cat,
            value: g.wasted,
            pct: totalWasted > 0 ? Math.round((g.wasted / totalWasted) * 100) : 0,
            cost: Math.round(g.cost * 100) / 100,
        }));
    }, [wasteSummary]);

    const totalUnitsWasted = useMemo(
        () => categoryDistribution.reduce((s, c) => s + c.value, 0),
        [categoryDistribution]
    );

    // ── NEW: Utilization efficiency per category ──
    const utilizationEfficiency = useMemo(() => {
        const grouped: Record<string, { used: number; wasted: number; received: number }> = {};
        for (const r of rawData) {
            if (!grouped[r.category]) grouped[r.category] = { used: 0, wasted: 0, received: 0 };
            grouped[r.category].used += r.unitsUsed;
            grouped[r.category].wasted += r.unitsWasted;
            grouped[r.category].received += r.unitsReceived;
        }
        return Object.entries(grouped).map(([cat, g]) => ({
            category: CATEGORY_LABELS[cat] || cat,
            usedPct: g.received > 0 ? Math.round((g.used / g.received) * 1000) / 10 : 0,
            wastedPct: g.received > 0 ? Math.round((g.wasted / g.received) * 1000) / 10 : 0,
        }));
    }, [rawData]);

    // ── NEW: Worst offenders table ──
    const worstOffenders = useMemo(() => {
        return [...wasteSummary]
            .sort((a, b) => b.totalWasteCost - a.totalWasteCost)
            .slice(0, 10)
            .map((w, i) => ({
                rank: i + 1,
                locationName: w.locationName,
                category: CATEGORY_LABELS[w.category] || w.category,
                unitsWasted: w.totalWasted,
                wastePct: w.wastePct,
                cost: Math.round(w.totalWasteCost * 100) / 100,
            }));
    }, [wasteSummary]);

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
            {/* ═══ Alert banner ═══ */}
            {flaggedCount > 0 && (
                <div className="flex items-center gap-2 text-xs bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-2.5">
                    <AlertTriangle size={14} />
                    <span>
                        <strong>{flaggedCount} location{flaggedCount > 1 ? "s" : ""}</strong> exceeding waste threshold ({WASTE_THRESHOLD}%)
                    </span>
                </div>
            )}

            {/* ═══ Category filter ═══ */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-[0.2em] mr-1">Filter:</span>
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors border ${selectedCategory === null
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                        }`}
                >
                    All Categories
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

            {/* ═══ No. 01 — Waste Rate by Location ═══ */}
            <div className="bp-section-label">
                <span>Waste Analysis</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 01</span>
                            <span className="text-sm font-semibold">Waste Rate by Node</span>
                            {selectedCategory && (
                                <span className="bp-badge text-muted-foreground text-[9px]">
                                    {CATEGORY_LABELS[selectedCategory] || selectedCategory}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => exportChartPNG(wasteChartRef, "waste_rate")}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Download size={10} /> PNG
                            </button>
                            <button
                                onClick={() => {
                                    const headers = ["Location", "Waste %", "Waste Cost", "Above Threshold"];
                                    const rows = wasteByLocation.map(w => [w.name, w.wastePct, `$${w.wasteCost.toLocaleString()}`, w.aboveThreshold ? "Yes" : "No"]);
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
                            <ResponsiveContainer width="100%" height={Math.max(200, wasteByLocation.length * 30)}>
                                <BarChart data={wasteByLocation} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} width={120} />
                                    <Tooltip contentStyle={{ backgroundColor: "var(--color-popover)", color: "var(--color-popover-foreground)", border: "1px solid var(--color-border)", borderRadius: "0", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }} labelStyle={{ color: "var(--color-popover-foreground)" }} itemStyle={{ color: "var(--color-popover-foreground)" }} formatter={(v?: number) => [`${v ?? 0}%`, "Waste Rate"]} />
                                    <ReferenceLine x={WASTE_THRESHOLD} stroke="var(--color-destructive)" strokeDasharray="3 3" label={{ value: `${WASTE_THRESHOLD}%`, position: "top", fontSize: 9, fill: "var(--color-destructive)" }} />
                                    <Bar dataKey="wastePct" radius={[0, 0, 0, 0]}>
                                        {wasteByLocation.map((entry) => (
                                            <Cell key={entry.locationId} fill={entry.aboveThreshold ? "var(--color-destructive)" : "var(--color-chart-3)"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ═══ No. 02 — Waste Trend Table ═══ */}
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 02</span>
                            <span className="text-sm font-semibold">Temporal Waste Velocity</span>
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
                                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{t.earlyPct}%</td>
                                            <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${t.latePct > WASTE_THRESHOLD ? "text-red-500" : ""}`}>{t.latePct}%</td>
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

            {/* ═══ No. 03 — Financial Attrition Monitoring (Daily Waste Cost) ═══ */}
            <div className="bp-section-label">
                <span>Cost Impact Analysis</span>
            </div>
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">No. 03</span>
                        <span className="text-sm font-semibold">Financial Attrition Monitoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold tabular-nums text-red-500">
                            ${totalWasteCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Loss</span>
                        <div className="flex gap-1 ml-2">
                            <button
                                onClick={() => exportChartPNG(costChartRef, "waste_cost")}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Download size={10} /> PNG
                            </button>
                            <button
                                onClick={() => {
                                    const headers = ["Date", "Waste Cost ($)"];
                                    const rows = dailyWasteCost.map(d => [d.date, d.cost]);
                                    exportCSV("daily_waste_cost", headers, rows);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Download size={10} /> CSV
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <div ref={costChartRef}>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={dailyWasteCost} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-destructive)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--color-destructive)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} interval={Math.max(0, Math.ceil(dailyWasteCost.length / 12) - 1)} />
                                <YAxis tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-popover)", color: "var(--color-popover-foreground)", border: "1px solid var(--color-border)", borderRadius: "0", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}
                                    labelStyle={{ color: "var(--color-popover-foreground)" }}
                                    itemStyle={{ color: "var(--color-popover-foreground)" }}
                                    formatter={(v?: number) => [`$${(v ?? 0).toFixed(2)}`, "Waste Cost"]}
                                />
                                <Line type="monotone" dataKey="cost" stroke="var(--color-destructive)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ═══ No. 04 + No. 05 — Two-column: Category Distribution + Utilization Efficiency ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* No. 04 — Category Waste Volume Distribution */}
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 04</span>
                            <span className="text-sm font-semibold">Category Waste Volume Distribution</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={categoryDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, pct, x, y }: { name?: string; pct?: number; x?: number; y?: number }) => (
                                            <text x={x} y={y} fill="var(--color-foreground)" textAnchor="middle" dominantBaseline="central" fontSize={12} fontFamily="'JetBrains Mono', monospace">
                                                {`${name ?? ""} ${pct ?? 0}%`}
                                            </text>
                                        )}
                                    >
                                        {categoryDistribution.map((_entry, idx) => (
                                            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "var(--color-popover)", color: "var(--color-popover-foreground)", border: "1px solid var(--color-border)", borderRadius: "0", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}
                                        labelStyle={{ color: "var(--color-popover-foreground)" }}
                                        itemStyle={{ color: "var(--color-popover-foreground)" }}
                                        formatter={(v?: number, name?: string) => [`${(v ?? 0).toLocaleString()} units`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Units Wasted: </span>
                            <span className="text-sm font-bold tabular-nums">{totalUnitsWasted.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* No. 05 — Inventory Utilization Efficiency */}
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 05</span>
                            <span className="text-sm font-semibold">Inventory Utilization Efficiency</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={utilizationEfficiency} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "var(--color-popover)", color: "var(--color-popover-foreground)", border: "1px solid var(--color-border)", borderRadius: "0", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }}
                                    labelStyle={{ color: "var(--color-popover-foreground)" }}
                                    itemStyle={{ color: "var(--color-popover-foreground)" }}
                                    formatter={(v?: number, name?: string) => [`${v ?? 0}%`, name === "usedPct" ? "Utilized" : "Wasted"]}
                                />
                                <Bar dataKey="usedPct" stackId="a" fill="var(--color-chart-3)" name="usedPct" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="wastedPct" stackId="a" fill="var(--color-destructive)" name="wastedPct" radius={[0, 0, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 h-2 inline-block" style={{ backgroundColor: "var(--color-chart-3)" }} />
                                Utilized
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-3 h-2 inline-block" style={{ backgroundColor: "var(--color-destructive)" }} />
                                Wasted
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ No. 06 — Highest Waste Cost – Active Targets ═══ */}
            <div className="bp-section-label">
                <span>Action Items</span>
            </div>
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">No. 06</span>
                        <span className="text-sm font-semibold">Highest Waste Cost — Active Targets</span>
                    </div>
                    <button
                        onClick={() => {
                            const headers = ["Rank", "Location", "Category", "Units Wasted", "Waste %", "Cost ($)"];
                            const rows = worstOffenders.map(w => [w.rank, w.locationName, w.category, w.unitsWasted, w.wastePct, `$${w.cost}`]);
                            exportCSV("waste_action_items", headers, rows);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                    >
                        <Download size={10} /> Export
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                                <th className="text-center px-3 py-3 font-medium w-12">#</th>
                                <th className="text-left px-4 py-3 font-medium">Location</th>
                                <th className="text-left px-4 py-3 font-medium">Category</th>
                                <th className="text-right px-4 py-3 font-medium">Units Wasted</th>
                                <th className="text-right px-4 py-3 font-medium">Waste %</th>
                                <th className="text-right px-4 py-3 font-medium">Cost ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {worstOffenders.map((w) => (
                                <tr
                                    key={`${w.locationName}-${w.category}`}
                                    className={`border-b border-border/40 ${w.wastePct > 15 ? "bg-red-500/[0.04]" : ""}`}
                                >
                                    <td className="px-3 py-2.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold ${w.rank <= 3 ? "bg-red-500/10 text-red-500" : "text-muted-foreground"}`}>
                                            {String(w.rank).padStart(2, '0')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-medium">{w.locationName}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground uppercase text-[10px] tracking-wider">{w.category}</td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">{w.unitsWasted.toLocaleString()}</td>
                                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${w.wastePct > 15 ? "text-red-500" : w.wastePct > 10 ? "text-amber-500" : ""}`}>
                                        {w.wastePct}%
                                    </td>
                                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                                        ${w.cost.toLocaleString()}
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
