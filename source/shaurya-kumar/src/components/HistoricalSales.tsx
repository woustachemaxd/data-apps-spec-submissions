import { useMemo, useState, useRef, useCallback } from "react";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useFilters } from "@/contexts/FilterContext";
import { formatShortDate } from "@/lib/dateUtils";
import { Download } from "lucide-react";
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

export default function HistoricalSales() {
    const { comparisonLocationIds } = useFilters();
    const { data: locations } = useLocations();
    const { data: salesData, loading, error } = useSales(
        comparisonLocationIds.length > 0 ? comparisonLocationIds : undefined
    );
    const [chartType, setChartType] = useState<"revenue" | "orders">("revenue");
    const revenueChartRef = useRef<HTMLDivElement>(null);
    const orderChartRef = useRef<HTMLDivElement>(null);

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
        <div className="space-y-6">
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
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} interval="preserveStartEnd" />
                                <YAxis
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "0",
                                        fontSize: "11px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                    formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, undefined]}
                                />
                                {locationNames.length > 1 && <Legend />}
                                {locationNames.map((name, i) => (
                                    <Area
                                        key={name}
                                        type="monotone"
                                        dataKey={name}
                                        stroke={chartColors[i % chartColors.length]}
                                        fill={`url(#grad-${i})`}
                                        strokeWidth={2}
                                    />
                                ))}
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
                    <div ref={orderChartRef}>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={orderTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} interval="preserveStartEnd" />
                                <YAxis
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                                    tickFormatter={(v) =>
                                        chartType === "revenue"
                                            ? `$${(v / 1000).toFixed(0)}k`
                                            : v.toLocaleString()
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-popover)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "0",
                                        fontSize: "11px",
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
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
                                {!isComparing && <Legend />}
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
                    </div>
                    {isComparing && (
                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-3 text-[10px] text-muted-foreground uppercase tracking-wider">
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
    );
}
