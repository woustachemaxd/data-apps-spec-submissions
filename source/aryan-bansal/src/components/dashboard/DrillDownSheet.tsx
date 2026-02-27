import { useMemo } from "react";
import { formatDate } from "@/lib/date-utils";
import {
    Star,
    User,
    DollarSign,
    Armchair,
    TrendingUp,
    ShoppingCart,
    X,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useSnowflake } from "@/hooks/useSnowflake";
import {
    buildTrendQuery,
    buildReviewsQuery,
    buildWasteByCategoryQuery,
} from "@/lib/queries";
import type {
    ScorecardRow,
    TrendRow,
    ReviewRow,
    DateRange,
} from "@/types/schema";

interface DrillDownSheetProps {
    open: boolean;
    onClose: () => void;
    location: ScorecardRow | null;
    dateRange: DateRange;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "h-3.5 w-3.5",
                        i < Math.round(rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/20"
                    )}
                />
            ))}
            <span className="ml-1 text-xs text-muted-foreground tabular-nums font-medium">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

function MiniTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: any[];
    label?: string;
}) {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="bg-card border rounded-lg shadow-lg p-2 text-xs">
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-muted-foreground mt-0.5">
                Revenue:{" "}
                <span className="font-mono font-semibold text-foreground">
                    ${Number(payload[0].value).toLocaleString()}
                </span>
            </p>
        </div>
    );
}

export default function DrillDownSheet({
    open,
    onClose,
    location,
    dateRange,
}: DrillDownSheetProps) {
    const locationId = location ? Number(location.LOCATION_ID) : null;

    // Data fetching
    const trendSql = useMemo(
        () =>
            locationId !== null
                ? buildTrendQuery(dateRange.from, dateRange.to, locationId)
                : null,
        [locationId, dateRange]
    );
    const { data: trendData, loading: trendLoading } =
        useSnowflake<TrendRow>(trendSql);

    const reviewSql = useMemo(
        () => (locationId !== null ? buildReviewsQuery(locationId, 5) : null),
        [locationId]
    );
    const { data: reviews, loading: reviewsLoading } =
        useSnowflake<ReviewRow>(reviewSql);

    const wasteSql = useMemo(
        () =>
            locationId !== null
                ? buildWasteByCategoryQuery(dateRange.from, dateRange.to, locationId)
                : null,
        [locationId, dateRange]
    );
    const { data: wasteData, loading: wasteLoading } = useSnowflake<{
        CATEGORY: string;
        WASTE_COST: string;
        UNITS_WASTED: string;
    }>(wasteSql);

    // Mini chart data
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

    const miniChartData = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of trendData) {
            const current = map.get(row.SALE_DATE) ?? 0;
            map.set(row.SALE_DATE, current + Number(row.DAILY_TOTAL));
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, total]) => ({
                label: formatDate(date, "MMM dd"),
                revenue: Math.round(total),
            }));
    }, [trendData]);

    if (!location) return null;

    const revenue = Number(location.TOTAL_REVENUE);
    const capacity = Number(location.SEATING_CAPACITY) || 1;
    const revenuePerSeat = revenue / capacity;
    const rating = Number(location.AVG_RATING);
    const waste = Number(location.TOTAL_WASTE);
    const orders = Number(location.TOTAL_ORDERS);

    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto border-l">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 px-6 pt-6 pb-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-background/80"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-bold tracking-tight pr-8">
                        {location.NAME}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {location.MANAGER_NAME}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <StarRating rating={rating} />
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-6">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            {
                                label: "Revenue",
                                value: `$${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                                icon: DollarSign,
                                color: "text-emerald-600 dark:text-emerald-400",
                                bg: "bg-emerald-50 dark:bg-emerald-950/50",
                            },
                            {
                                label: "Rev / Seat",
                                value: `$${Math.round(revenuePerSeat).toLocaleString()}`,
                                icon: Armchair,
                                color: "text-blue-600 dark:text-blue-400",
                                bg: "bg-blue-50 dark:bg-blue-950/50",
                            },
                            {
                                label: "Total Orders",
                                value: orders.toLocaleString(),
                                icon: ShoppingCart,
                                color: "text-violet-600 dark:text-violet-400",
                                bg: "bg-violet-50 dark:bg-violet-950/50",
                            },
                            {
                                label: "Waste Cost",
                                value: `$${waste.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                                icon: TrendingUp,
                                color: "text-red-500 dark:text-red-400",
                                bg: "bg-red-50 dark:bg-red-950/50",
                            },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div
                                key={label}
                                className={cn(
                                    "rounded-xl p-3.5 border transition-colors",
                                    bg
                                )}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Icon className={cn("h-3.5 w-3.5", color)} />
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                        {label}
                                    </span>
                                </div>
                                <p className="text-lg font-bold tabular-nums">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Revenue Trend Chart */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Revenue Trend
                        </h3>
                        {trendLoading ? (
                            <Skeleton className="h-[180px] w-full rounded-xl" />
                        ) : (
                            <div className="rounded-xl border p-3 bg-muted/30">
                                <ResponsiveContainer width="100%" height={160}>
                                    <AreaChart
                                        data={miniChartData}
                                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            content={<MiniTooltip />}
                                            cursor={{
                                                stroke: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            fill={isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)"}
                                            stroke={isDark ? "#818cf8" : "#6366f1"}
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Waste by Category */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Waste by Category</h3>
                        {wasteLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-full rounded" />
                                ))}
                            </div>
                        ) : wasteData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No waste data</p>
                        ) : (
                            <div className="rounded-xl border overflow-hidden">
                                {wasteData.map((w, i) => {
                                    const cost = Number(w.WASTE_COST);
                                    const maxCost = Math.max(
                                        ...wasteData.map((x) => Number(x.WASTE_COST))
                                    );
                                    const pct = maxCost > 0 ? (cost / maxCost) * 100 : 0;

                                    return (
                                        <div
                                            key={w.CATEGORY}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-2.5 text-sm relative",
                                                i !== wasteData.length - 1 && "border-b"
                                            )}
                                        >
                                            {/* Progress bar background */}
                                            <div
                                                className="absolute inset-y-0 left-0 bg-red-500/5 dark:bg-red-500/10 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                            <span className="relative capitalize text-foreground font-medium">
                                                {w.CATEGORY.replace(/_/g, " ")}
                                            </span>
                                            <div className="relative flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {Number(w.UNITS_WASTED)} units
                                                </span>
                                                <Badge
                                                    variant={cost > 150 ? "destructive" : "secondary"}
                                                    className="text-xs tabular-nums font-mono"
                                                >
                                                    ${cost.toLocaleString()}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Review Feed */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Recent Reviews</h3>
                        {reviewsLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                                ))}
                            </div>
                        ) : reviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No reviews found</p>
                        ) : (
                            <div className="space-y-3">
                                {reviews.map((review, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border p-4 space-y-2 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <StarRating rating={Number(review.RATING)} />
                                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                                {formatDate(review.REVIEW_DATE, "MMM dd, yyyy")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                            {review.REVIEW_TEXT}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {review.CUSTOMER_NAME
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .slice(0, 2)}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {review.CUSTOMER_NAME}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
