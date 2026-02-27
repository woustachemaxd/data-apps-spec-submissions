import { useMemo, useState } from "react";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/dashboard/EmptyState";
import { formatDate } from "@/lib/date-utils";
import type { TrendRow } from "@/types/schema";

interface SalesChartProps {
    data: TrendRow[];
    loading: boolean;
    companyAvg?: { SALE_DATE: string; AVG_DAILY_REVENUE: string }[];
}

const ORDER_PALETTE = {
    "dine-in": { light: "#6366f1", dark: "#818cf8" },
    takeout: { light: "#06b6d4", dark: "#22d3ee" },
    delivery: { light: "#f59e0b", dark: "#fbbf24" },
} as const;

interface ChartPoint {
    date: string;
    label: string;
    "dine-in": number;
    takeout: number;
    delivery: number;
    total: number;
    companyAvg?: number;
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    const total = payload
        .filter((e) => e.value != null && e.dataKey !== "companyAvg")
        .reduce((sum: number, e: { value: number }) => sum + Number(e.value), 0);

    return (
        <div className="bg-card/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 text-sm min-w-[190px]">
            <p className="font-semibold text-foreground mb-2 border-b pb-1.5">
                {label}
            </p>
            {payload
                .filter((entry) => entry.value != null)
                .map((entry) => (
                    <div
                        key={entry.name}
                        className="flex items-center justify-between gap-4 text-xs py-0.5"
                    >
                        <span className="flex items-center gap-1.5">
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground capitalize">{entry.name}</span>
                        </span>
                        <span className="font-mono tabular-nums font-medium">
                            ${Number(entry.value).toLocaleString()}
                        </span>
                    </div>
                ))}
            <div className="flex items-center justify-between gap-4 text-xs pt-1.5 mt-1 border-t font-semibold">
                <span className="text-foreground">Total</span>
                <span className="font-mono tabular-nums">
                    ${total.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

export default function SalesChart({
    data,
    loading,
    companyAvg,
}: SalesChartProps) {
    const [showAvg, setShowAvg] = useState(false);

    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

    const colors = {
        "dine-in": isDark ? ORDER_PALETTE["dine-in"].dark : ORDER_PALETTE["dine-in"].light,
        takeout: isDark ? ORDER_PALETTE.takeout.dark : ORDER_PALETTE.takeout.light,
        delivery: isDark ? ORDER_PALETTE.delivery.dark : ORDER_PALETTE.delivery.light,
    };

    const chartData = useMemo(() => {
        const map = new Map<string, ChartPoint>();

        for (const row of data) {
            const date = row.SALE_DATE;
            if (!map.has(date)) {
                map.set(date, {
                    date,
                    label: formatDate(date, "MMM dd"),
                    "dine-in": 0,
                    takeout: 0,
                    delivery: 0,
                    total: 0,
                });
            }
            const point = map.get(date)!;
            const orderType = row.ORDER_TYPE as keyof Pick<
                ChartPoint,
                "dine-in" | "takeout" | "delivery"
            >;
            const val = Number(row.DAILY_TOTAL);
            point[orderType] = val;
            point.total += val;
        }

        if (showAvg && companyAvg) {
            for (const row of companyAvg) {
                const point = map.get(row.SALE_DATE);
                if (point) {
                    point.companyAvg = Math.round(Number(row.AVG_DAILY_REVENUE));
                }
            }
        }

        return Array.from(map.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    }, [data, companyAvg, showAvg]);

    if (loading) {
        return <Skeleton className="h-[350px] w-full rounded-lg" />;
    }

    if (data.length === 0) {
        return <EmptyState message="No sales data found for this period" />;
    }

    return (
        <div>
            {companyAvg && companyAvg.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={showAvg}
                            onChange={(e) => setShowAvg(e.target.checked)}
                            className="accent-primary rounded"
                        />
                        Compare vs. per-location daily average
                    </label>
                </div>
            )}

            <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="gradDineIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors["dine-in"]} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={colors["dine-in"]} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradTakeout" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.takeout} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={colors.takeout} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradDelivery" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.delivery} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={colors.delivery} stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                    />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                            strokeWidth: 1,
                            strokeDasharray: "4 2",
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="square"
                        iconSize={10}
                    />
                    <Area
                        type="monotone"
                        dataKey="dine-in"
                        stackId="1"
                        fill="url(#gradDineIn)"
                        stroke={colors["dine-in"]}
                        strokeWidth={1.5}
                    />
                    <Area
                        type="monotone"
                        dataKey="takeout"
                        stackId="1"
                        fill="url(#gradTakeout)"
                        stroke={colors.takeout}
                        strokeWidth={1.5}
                    />
                    <Area
                        type="monotone"
                        dataKey="delivery"
                        stackId="1"
                        fill="url(#gradDelivery)"
                        stroke={colors.delivery}
                        strokeWidth={1.5}
                    />
                    {showAvg && (
                        <Line
                            type="monotone"
                            dataKey="companyAvg"
                            name="Company Avg"
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            dot={false}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
