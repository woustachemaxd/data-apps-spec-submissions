import { useMemo, useState, useRef } from "react";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useFilters } from "@/contexts/FilterContext";
import { formatShortDate } from "@/lib/dateUtils";
import { Download, Sparkles } from "lucide-react";
import { askCortex } from "@/lib/snowflake";
import { exportChartPNG, exportCSV } from "@/lib/exportUtils";
import AiInsightPanel from "@/components/AiInsightPanel";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

const ORDER_TYPE_COLORS: Record<string, string> = {
    "dine-in": "var(--color-chart-1)",
    takeout: "var(--color-chart-3)",
    delivery: "var(--color-chart-5)",
};

// 3 distinct palettes for comparing locations (each has dine-in, takeout, delivery shades)
const LOCATION_PALETTES: Record<string, string>[] = [
    // Blues
    { "dine-in": "#3b82f6", takeout: "#60a5fa", delivery: "#93c5fd" },
    // Ambers / Oranges
    { "dine-in": "#f59e0b", takeout: "#fbbf24", delivery: "#fcd34d" },
    // Violets
    { "dine-in": "#8b5cf6", takeout: "#a78bfa", delivery: "#c4b5fd" },
];

interface HistoricalSalesProps {
    compact?: boolean;
}

export default function HistoricalSales({ compact = false }: HistoricalSalesProps) {
    const { comparisonLocationIds } = useFilters();
    const { data: locations } = useLocations();
    const { data: salesData, loading, error } = useSales(
        comparisonLocationIds.length > 0 ? comparisonLocationIds : undefined
    );
    const [chartType, setChartType] = useState<"revenue" | "orders">("revenue");
    const [revenueInsight, setRevenueInsight] = useState<{ loading: boolean, error: string | null, content: string | null }>({ loading: false, error: null, content: null });
    const [ordersInsight, setOrdersInsight] = useState<{ loading: boolean, error: string | null, content: string | null }>({ loading: false, error: null, content: null });
    const revenueChartRef = useRef<HTMLDivElement>(null);
    const orderChartRef = useRef<HTMLDivElement>(null);



    // Aggregate daily revenue across all locations (or per-location if comparing)
    const revenueByDate = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        if (comparisonLocationIds.length > 0) {
            // Per-location lines
            for (const s of salesData) {
                if (!grouped[s.saleDate]) grouped[s.saleDate] = {};
                const key = s.locationName;
                grouped[s.saleDate][key] =
                    (grouped[s.saleDate][key] || 0) + s.revenue;
            }
        } else {
            // Single aggregate line
            for (const s of salesData) {
                if (!grouped[s.saleDate]) grouped[s.saleDate] = {};
                grouped[s.saleDate]["Revenue"] =
                    (grouped[s.saleDate]["Revenue"] || 0) + s.revenue;
            }
        }

        return Object.entries(grouped)
            .map(([date, values]) => ({
                date: formatShortDate(date),
                rawDate: date,
                ...values,
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    }, [salesData, comparisonLocationIds]);

    // Order type breakdown (aggregate mode) / Per-location breakdown (comparison mode)
    const orderTypes = ["dine-in", "takeout", "delivery"];

    const orderTypeData = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        if (comparisonLocationIds.length > 0) {
            // Comparison mode: composite keys "LocationName|orderType"
            for (const s of salesData) {
                if (!grouped[s.saleDate]) grouped[s.saleDate] = {};
                const key = `${s.locationName}|${s.orderType}`;
                grouped[s.saleDate][key] =
                    (grouped[s.saleDate][key] || 0) +
                    (chartType === "revenue" ? s.revenue : s.numOrders);
            }
        } else {
            // Default: group by order type
            for (const s of salesData) {
                if (!grouped[s.saleDate]) grouped[s.saleDate] = {};
                grouped[s.saleDate][s.orderType] =
                    (grouped[s.saleDate][s.orderType] || 0) +
                    (chartType === "revenue" ? s.revenue : s.numOrders);
            }
        }

        return Object.entries(grouped)
            .map(([date, values]) => ({
                date: formatShortDate(date),
                rawDate: date,
                ...values,
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    }, [salesData, chartType, comparisonLocationIds]);

    const locationNames = useMemo(() => {
        if (comparisonLocationIds.length > 0) {
            return comparisonLocationIds
                .map((id) => locations.find((l) => l.LOCATION_ID === id)?.NAME || `Location ${id}`)
                .filter(Boolean);
        }
        return ["Revenue"];
    }, [comparisonLocationIds, locations]);

    // In comparison mode: one Bar per (location × orderType), stacked by location
    // In default mode: one Bar per orderType, all stacked together
    const barConfigs = useMemo(() => {
        if (comparisonLocationIds.length > 0) {
            return locationNames.flatMap((locName, locIdx) => {
                const palette = LOCATION_PALETTES[locIdx % LOCATION_PALETTES.length];
                return orderTypes.map((ot, otIdx) => ({
                    dataKey: `${locName}|${ot}`,
                    stackId: locName,
                    fill: palette[ot] || palette["dine-in"],
                    label: `${locName} — ${ot}`,
                    isLast: otIdx === orderTypes.length - 1,
                }));
            });
        }
        return orderTypes.map((ot, i) => ({
            dataKey: ot,
            stackId: "a",
            fill: ORDER_TYPE_COLORS[ot],
            label: ot,
            isLast: i === orderTypes.length - 1,
        }));
    }, [comparisonLocationIds, locationNames]);

    const handleRevenueInsight = async () => {
        setRevenueInsight({ loading: true, error: null, content: null });
        try {
            const dataLength = revenueByDate.length;
            const sampleSize = 10;
            const step = Math.max(1, Math.floor(dataLength / sampleSize));
            const sampled = revenueByDate.filter((_, i) => i % step === 0 || i === dataLength - 1).map(d => {
                const row: Record<string, string | number> = { d: d.date as string };
                locationNames.forEach(name => {
                    const val = (d as any)[name];
                    if (val !== undefined) row[name.substring(0, 5)] = Math.round(val);
                });
                return row;
            });
            const contextStr = sampled.map(d => Object.entries(d).map(([k, v]) => `${k}:${v}`).join('|')).join(', ');
            const prompt = `Given this sample revenue trend data over time: [${contextStr}], provide a concise explanation (maximum 2 sentences) describing the overall pattern and any notable insights.`;
            const content = await askCortex(prompt);
            setRevenueInsight({ loading: false, error: null, content });
        } catch (err: any) {
            setRevenueInsight({ loading: false, error: err.message, content: null });
        }
    };

    const handleOrdersInsight = async () => {
        setOrdersInsight({ loading: true, error: null, content: null });
        try {
            const dataLength = orderTypeData.length;
            const sampleSize = 10;
            const step = Math.max(1, Math.floor(dataLength / sampleSize));
            const sampled = orderTypeData.filter((_, i) => i % step === 0 || i === dataLength - 1).map(d => {
                const row: Record<string, string | number> = { d: d.date as string };
                barConfigs.forEach(c => {
                    const val = (d as any)[c.dataKey];
                    if (val !== undefined) row[c.dataKey.substring(0, 5)] = Math.round(val);
                });
                return row;
            });
            const contextStr = sampled.map(d => Object.entries(d).map(([k, v]) => `${k}:${v}`).join('|')).join(', ');
            const prompt = `Given this sample ${chartType} breakdown data across different channels: [${contextStr}], provide a concise explanation (maximum 2 sentences) describing the pattern and notable insights.`;
            const content = await askCortex(prompt);
            setOrdersInsight({ loading: false, error: null, content });
        } catch (err: any) {
            setOrdersInsight({ loading: false, error: err.message, content: null });
        }
    };

    const chartColors = [
        "var(--color-chart-1)",
        "var(--color-chart-3)",
        "var(--color-chart-5)",
    ];

    const isComparing = comparisonLocationIds.length > 0;

    if (loading) {
        return (
            <div className="bp-card p-12 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px] uppercase tracking-[0.15em]">
                    <span className="w-2 h-2 bg-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                    Loading sales data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bp-card border-destructive p-8 text-center">
                <p className="text-destructive font-medium text-sm">Failed to load sales data</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    return (
        <div className={compact ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-6"}>
            {/* Revenue trend */}
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 01</span>
                            <span className="text-sm font-semibold">
                                {isComparing
                                    ? "Revenue Comparison"
                                    : "Revenue Trend (All Locations)"}
                            </span>
                        </div>
                        {!isComparing && (
                            <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-[0.1em]">
                                Select locations from the Overview tab to compare individual stores
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleRevenueInsight}
                            disabled={revenueInsight.loading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={10} className={revenueInsight.loading ? "animate-pulse" : ""} />
                            Explain Chart
                        </button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={() => exportChartPNG(revenueChartRef, "revenue_trend")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> PNG
                        </button>
                        <button
                            onClick={() => {
                                const headers = ["Date", ...locationNames];
                                const rows = revenueByDate.map((d: Record<string, unknown>) =>
                                    [d.date as string, ...locationNames.map(n => (d[n] as number) ?? 0)]
                                );
                                exportCSV("revenue_data", headers, rows);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> CSV
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <AiInsightPanel
                        isLoading={revenueInsight.loading}
                        error={revenueInsight.error}
                        content={revenueInsight.content}
                        className="mb-4"
                    />
                    <div ref={revenueChartRef}>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={revenueByDate} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                    {locationNames.map((name, i) => (
                                        <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} interval={Math.max(0, Math.ceil(revenueByDate.length / 12) - 1)} />
                                <YAxis
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        color: "var(--color-popover-foreground)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "0",
                                        fontSize: "11px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                    labelStyle={{ color: "var(--color-popover-foreground)" }}
                                    itemStyle={{ color: "var(--color-popover-foreground)" }}
                                    formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, undefined]}
                                />
                                {locationNames.length > 1 && <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />}
                                {locationNames.map((name, i) => {
                                    const dashPatterns = ["0", "8 4", "3 3"];
                                    return (
                                        <Area
                                            key={name}
                                            type="monotone"
                                            dataKey={name}
                                            stroke={chartColors[i % chartColors.length]}
                                            fill={`url(#grad-${i})`}
                                            strokeWidth={2}
                                            strokeDasharray={locationNames.length > 1 ? dashPatterns[i % dashPatterns.length] : undefined}
                                        />
                                    );
                                })}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Order type / Location breakdown */}
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">No. 02</span>
                            <span className="text-sm font-semibold">
                                {isComparing ? "Location Breakdown" : "Order Type Breakdown"}
                            </span>
                        </div>
                        <div className="flex gap-0.5">
                            <button
                                onClick={() => setChartType("revenue")}
                                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors border ${chartType === "revenue"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                                    }`}
                            >
                                Revenue
                            </button>
                            <button
                                onClick={() => setChartType("orders")}
                                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors border ${chartType === "orders"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                                    }`}
                            >
                                Orders
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleOrdersInsight}
                            disabled={ordersInsight.loading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={10} className={ordersInsight.loading ? "animate-pulse" : ""} />
                            Explain Chart
                        </button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={() => exportChartPNG(orderChartRef, "order_breakdown")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> PNG
                        </button>
                        <button
                            onClick={() => {
                                const keys = barConfigs.map(c => c.label);
                                const headers = ["Date", ...keys];
                                const rows = orderTypeData.map((d: Record<string, unknown>) =>
                                    [d.date as string, ...barConfigs.map(c => (d[c.dataKey] as number) ?? 0)]
                                );
                                exportCSV("order_breakdown_data", headers, rows);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-colors"
                        >
                            <Download size={10} /> CSV
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <AiInsightPanel
                        isLoading={ordersInsight.loading}
                        error={ordersInsight.error}
                        content={ordersInsight.content}
                        className="mb-4"
                    />
                    <div ref={orderChartRef}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={orderTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }} interval={Math.max(0, Math.ceil(orderTypeData.length / 12) - 1)} />
                                <YAxis
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }}
                                    tickFormatter={(v) =>
                                        chartType === "revenue"
                                            ? `$${(v / 1000).toFixed(0)}k`
                                            : v.toLocaleString()
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        color: "var(--color-popover-foreground)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "0",
                                        fontSize: "11px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                    labelStyle={{ color: "var(--color-popover-foreground)" }}
                                    itemStyle={{ color: "var(--color-popover-foreground)" }}
                                    formatter={(v?: number, name?: string) => {
                                        const displayName = isComparing && name?.includes("|")
                                            ? name.replace("|", " — ")
                                            : name ?? "";
                                        return [
                                            chartType === "revenue"
                                                ? `$${(v ?? 0).toLocaleString()}`
                                                : (v ?? 0).toLocaleString(),
                                            displayName,
                                        ];
                                    }}
                                />
                                {!isComparing && <Legend wrapperStyle={{ color: "var(--color-foreground)" }} />}
                                {barConfigs.map((cfg) => (
                                    <Bar
                                        key={cfg.dataKey}
                                        dataKey={cfg.dataKey}
                                        stackId={cfg.stackId}
                                        fill={cfg.fill}
                                        radius={[0, 0, 0, 0]}
                                        name={cfg.label}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                        {isComparing && (
                            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-3 pb-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                                {locationNames.map((name, locIdx) => {
                                    const palette = LOCATION_PALETTES[locIdx % LOCATION_PALETTES.length];
                                    return (
                                        <span key={name} className="inline-flex items-center gap-1.5">
                                            {orderTypes.map((ot) => (
                                                <span
                                                    key={ot}
                                                    className="w-2.5 h-2.5 inline-block"
                                                    style={{ backgroundColor: palette[ot] }}
                                                />
                                            ))}
                                            {name}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
