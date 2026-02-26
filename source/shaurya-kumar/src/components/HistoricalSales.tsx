import { useMemo, useState } from "react";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useFilters } from "@/contexts/FilterContext";
import { formatShortDate } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function HistoricalSales() {
    const { comparisonLocationIds } = useFilters();
    const { data: locations } = useLocations();
    const { data: salesData, loading, error } = useSales(
        comparisonLocationIds.length > 0 ? comparisonLocationIds : undefined
    );
    const [chartType, setChartType] = useState<"revenue" | "orders">("revenue");

    // Aggregate daily revenue across all locations (or per-location if comparing)
    const revenueByDate = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        if (comparisonLocationIds.length > 0) {
            // Per-location lines
            for (const s of salesData) {
                if (!grouped[s.saleDate]) grouped[s.saleDate] = { date: 0 };
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

    // Order type breakdown
    const orderTypeData = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        for (const s of salesData) {
            if (!grouped[s.saleDate]) grouped[s.saleDate] = {};
            grouped[s.saleDate][s.orderType] =
                (grouped[s.saleDate][s.orderType] || 0) +
                (chartType === "revenue" ? s.revenue : s.numOrders);
        }

        return Object.entries(grouped)
            .map(([date, values]) => ({
                date: formatShortDate(date),
                rawDate: date,
                ...values,
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    }, [salesData, chartType]);

    const locationNames = useMemo(() => {
        if (comparisonLocationIds.length > 0) {
            return comparisonLocationIds
                .map((id) => locations.find((l) => l.LOCATION_ID === id)?.NAME || `Location ${id}`)
                .filter(Boolean);
        }
        return ["Revenue"];
    }, [comparisonLocationIds, locations]);

    const chartColors = [
        "var(--color-chart-1)",
        "var(--color-chart-3)",
        "var(--color-chart-5)",
    ];

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading sales data...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="py-8 text-center">
                    <p className="text-destructive font-medium">Failed to load sales data</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Revenue trend */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                            {comparisonLocationIds.length > 0
                                ? "Revenue Comparison"
                                : "Revenue Trend (All Locations)"}
                        </CardTitle>
                    </div>
                    {comparisonLocationIds.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            Select locations from the Overview tab to compare individual stores
                        </p>
                    )}
                </CardHeader>
                <CardContent>
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
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--color-popover)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
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
                </CardContent>
            </Card>

            {/* Order type breakdown */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base">Order Type Breakdown</CardTitle>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setChartType("revenue")}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartType === "revenue"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                            >
                                Revenue
                            </button>
                            <button
                                onClick={() => setChartType("orders")}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartType === "orders"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-accent"
                                    }`}
                            >
                                Orders
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={orderTypeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis
                                tick={{ fontSize: 11 }}
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
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                formatter={(v?: number, name?: string) => [
                                    chartType === "revenue"
                                        ? `$${(v ?? 0).toLocaleString()}`
                                        : (v ?? 0).toLocaleString(),
                                    name ?? "",
                                ]}
                            />
                            <Legend />
                            <Bar dataKey="dine-in" stackId="a" fill={ORDER_TYPE_COLORS["dine-in"]} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="takeout" stackId="a" fill={ORDER_TYPE_COLORS.takeout} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="delivery" stackId="a" fill={ORDER_TYPE_COLORS.delivery} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

