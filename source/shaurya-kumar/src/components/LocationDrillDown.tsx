import { useMemo, useEffect, useRef } from "react";
import { useLocations } from "@/hooks/useLocations";
import { useSales } from "@/hooks/useSales";
import { useReviews } from "@/hooks/useReviews";
import { useInventory } from "@/hooks/useInventory";
import { formatLongDate, formatShortDate } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    X,
    MapPin,
    User,
    Calendar,
    Users,
    Star,
    DollarSign,
    ShoppingBag,
    Trash2,
} from "lucide-react";

interface LocationDrillDownProps {
    locationId: number;
    onClose: () => void;
}

const PIE_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-3)",
    "var(--color-chart-5)",
];

export default function LocationDrillDown({ locationId, onClose }: LocationDrillDownProps) {
    const { data: locations } = useLocations();
    const { data: salesData, loading: salesLoading } = useSales([locationId]);
    const { data: reviews, loading: reviewsLoading } = useReviews(locationId);
    const { wasteSummary, loading: wasteLoading } = useInventory([locationId]);
    const panelRef = useRef<HTMLDivElement>(null);

    const location = useMemo(
        () => locations.find((l) => l.LOCATION_ID === locationId),
        [locations, locationId]
    );

    // Revenue by date
    const revenueByDate = useMemo(() => {
        const grouped: Record<string, number> = {};
        for (const s of salesData) {
            grouped[s.saleDate] = (grouped[s.saleDate] || 0) + s.revenue;
        }
        return Object.entries(grouped)
            .map(([date, revenue]) => ({
                date: formatShortDate(date),
                rawDate: date,
                revenue: Math.round(revenue),
            }))
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    }, [salesData]);

    // Order type split
    const orderTypeSplit = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const s of salesData) {
            totals[s.orderType] = (totals[s.orderType] || 0) + s.revenue;
        }
        return Object.entries(totals).map(([type, revenue]) => ({
            name: type,
            value: Math.round(revenue),
        }));
    }, [salesData]);

    // KPI totals
    const kpis = useMemo(() => {
        const totalRevenue = salesData.reduce((sum, s) => sum + s.revenue, 0);
        const totalOrders = salesData.reduce((sum, s) => sum + s.numOrders, 0);
        const avgRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
        const totalWaste = wasteSummary.reduce((sum, w) => sum + w.totalWasteCost, 0);
        return {
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            avgRating: Math.round(avgRating * 10) / 10,
            totalWaste: Math.round(totalWaste * 100) / 100,
        };
    }, [salesData, reviews, wasteSummary]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    // Scroll to top when location changes
    useEffect(() => {
        panelRef.current?.scrollTo(0, 0);
    }, [locationId]);

    const isLoading = salesLoading || reviewsLoading || wasteLoading;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="relative w-full max-w-2xl bg-background border-l border-border shadow-2xl
          overflow-y-auto animate-in slide-in-from-right duration-300"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {location?.NAME || "Loading..."}
                            </h2>
                            {location && (
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin size={12} />
                                        {location.CITY}, {location.STATE}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <User size={12} />
                                        {location.MANAGER_NAME}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="px-6 py-12 text-center text-muted-foreground">
                        Loading location details...
                    </div>
                ) : (
                    <div className="px-6 py-4 space-y-6">
                        {/* Store info */}
                        {location && (
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <MapPin size={12} />
                                    {location.ADDRESS}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar size={12} />
                                    Opened {formatLongDate(location.OPEN_DATE)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Users size={12} />
                                    {location.SEATING_CAPACITY} seats
                                </span>
                            </div>
                        )}

                        {/* KPI cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <KPICard
                                icon={DollarSign}
                                label="Revenue"
                                value={`$${kpis.totalRevenue.toLocaleString()}`}
                            />
                            <KPICard
                                icon={Star}
                                label="Avg Rating"
                                value={kpis.avgRating.toFixed(1)}
                                alert={kpis.avgRating < 3.0}
                            />
                            <KPICard
                                icon={ShoppingBag}
                                label="Orders"
                                value={kpis.totalOrders.toLocaleString()}
                            />
                            <KPICard
                                icon={Trash2}
                                label="Waste Cost"
                                value={`$${kpis.totalWaste.toLocaleString()}`}
                                alert={kpis.totalWaste > 5000}
                            />
                        </div>

                        {/* Revenue trend */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Daily Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={revenueByDate} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="drilldownGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "var(--color-popover)",
                                                border: "1px solid var(--color-border)",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                            }}
                                            formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, "Revenue"]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--color-primary)"
                                            fill="url(#drilldownGrad)"
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Order type pie */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Revenue by Order Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={orderTypeSplit}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                dataKey="value"
                                                label={({ name, percent }: { name?: string; percent?: number }) =>
                                                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                                                }
                                            >
                                                {orderTypeSplit.map((_entry, idx) => (
                                                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "var(--color-popover)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                }}
                                                formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, undefined]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent reviews */}
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Recent Reviews</CardTitle>
                                    <Badge variant="outline" className="text-[10px]">
                                        {reviews.length} reviews
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-72 overflow-y-auto">
                                {reviews.slice(0, 10).map((r) => (
                                    <div
                                        key={r.reviewId}
                                        className="flex gap-3 text-sm border-b border-border/30 pb-3 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{r.customerName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatShortDate(r.reviewDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={11}
                                                        className={
                                                            i < Math.round(r.rating)
                                                                ? "text-amber-400 fill-amber-400"
                                                                : "text-muted-foreground/20"
                                                        }
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                {r.reviewText}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Inventory waste summary */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Inventory Waste Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                                            <th className="text-left px-4 py-2 font-medium">Category</th>
                                            <th className="text-right px-4 py-2 font-medium">Received</th>
                                            <th className="text-right px-4 py-2 font-medium">Wasted</th>
                                            <th className="text-right px-4 py-2 font-medium">Waste %</th>
                                            <th className="text-right px-4 py-2 font-medium">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteSummary.map((w) => (
                                            <tr key={w.category} className="border-b border-border/30">
                                                <td className="px-4 py-2 font-medium capitalize">
                                                    {w.category.replace("_", " & ")}
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                                                    {w.totalReceived.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">
                                                    {w.totalWasted.toLocaleString()}
                                                </td>
                                                <td
                                                    className={`px-4 py-2 text-right tabular-nums font-medium ${w.wastePct > 10 ? "text-red-500" : ""
                                                        }`}
                                                >
                                                    {w.wastePct}%
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">
                                                    ${w.totalWasteCost.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

function KPICard({
    icon: Icon,
    label,
    value,
    alert,
}: {
    icon: typeof DollarSign;
    label: string;
    value: string;
    alert?: boolean;
}) {
    return (
        <div
            className={`rounded-lg border p-3 ${alert ? "border-red-500/30 bg-red-500/5" : "border-border"
                }`}
        >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Icon size={12} />
                {label}
            </div>
            <p className={`text-lg font-semibold tabular-nums ${alert ? "text-red-500" : ""}`}>
                {value}
            </p>
        </div>
    );
}
