import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/dashboard/EmptyState";
import type { WasteByLocationRow } from "@/types/schema";

interface WasteTrackerProps {
    data: WasteByLocationRow[];
    loading: boolean;
    selectedCategory: string;
    onCategoryChange: (cat: string) => void;
}

const CATEGORIES = [
    { value: "all", label: "All Categories" },
    { value: "dairy", label: "Dairy" },
    { value: "produce", label: "Produce" },
    { value: "cones_cups", label: "Cones & Cups" },
    { value: "toppings", label: "Toppings" },
    { value: "syrups", label: "Syrups" },
] as const;

function getBarColor(index: number, total: number, isDark: boolean): string {
    if (total <= 1) return isDark ? "#fb7185" : "#f43f5e";
    const t = index / (total - 1);

    const palette = isDark
        ? ["#fb7185", "#fb923c", "#facc15", "#34d399", "#94a3b8"]
        : ["#f43f5e", "#f97316", "#eab308", "#10b981", "#94a3b8"];

    const idx = Math.min(Math.floor(t * palette.length), palette.length - 1);
    return palette[idx];
}

function CustomTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: any[];
}) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-card/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 text-sm min-w-[170px]">
            <p className="font-semibold text-foreground mb-1.5">{d.name}</p>
            <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Waste Cost</span>
                    <span className="font-mono font-medium text-red-500 dark:text-red-400">
                        ${d.waste.toLocaleString()}
                    </span>
                </div>
                <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">Units Wasted</span>
                    <span className="font-mono font-medium">{d.units.toLocaleString()}</span>
                </div>
                {d.waste > 3000 && (
                    <p className="text-[10px] text-red-500 dark:text-red-400 pt-1 border-t mt-1">
                        ⚠ Above critical threshold
                    </p>
                )}
            </div>
        </div>
    );
}

export default function WasteTracker({
    data,
    loading,
    selectedCategory,
    onCategoryChange,
}: WasteTrackerProps) {
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

    const chartData = useMemo(() => {
        return [...data]
            .sort(
                (a, b) =>
                    Number(b.TOTAL_WASTE_COST) - Number(a.TOTAL_WASTE_COST)
            )
            .map((row) => ({
                name: row.NAME,
                waste: Math.round(Number(row.TOTAL_WASTE_COST)),
                units: Number(row.TOTAL_UNITS_WASTED),
            }));
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                    Sorted by highest waste
                </p>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <Skeleton className="h-[400px] w-full rounded-lg" />
            ) : chartData.length === 0 ? (
                <EmptyState message="No waste data found for this period" />
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={Math.max(300, chartData.length * 36)}
                >
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }}
                            tickLine={false}
                            axisLine={false}
                            width={130}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            }}
                        />
                        <Bar dataKey="waste" radius={[0, 6, 6, 0]} barSize={20}>
                            {chartData.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={getBarColor(index, chartData.length, isDark)}
                                    className="transition-opacity hover:opacity-90"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
