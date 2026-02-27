import { useMemo } from "react";
import { useScorecard } from "@/hooks/useScorecard";
import { useSales } from "@/hooks/useSales";
import { useLocations } from "@/hooks/useLocations";
import { useInventory } from "@/hooks/useInventory";
import { formatShortDate } from "@/lib/dateUtils";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
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
    DollarSign,
    Star,
    ShoppingBag,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

interface OverviewDashboardProps {
    onNavigateToLocations: () => void;
}

const PIE_COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-3)",
    "var(--color-chart-5)",
];

export default function OverviewDashboard({ onNavigateToLocations }: OverviewDashboardProps) {
    const { data: scorecard, loading: scorecardLoading } = useScorecard();
    const { data: salesData, loading: salesLoading } = useSales();
    const { data: locations } = useLocations();
    const { wasteSummary, loading: wasteLoading } = useInventory();

    const isLoading = scorecardLoading || salesLoading || wasteLoading;

    // KPI aggregates
    const kpis = useMemo(() => {
        const totalRevenue = scorecard.reduce((s, r) => s + r.totalRevenue, 0);
        const avgRating =
            scorecard.length > 0
                ? scorecard.reduce((s, r) => s + r.avgRating, 0) / scorecard.length
                : 0;
        const totalOrders = salesData.reduce((s, r) => s + r.numOrders, 0);

        // Average waste rate
        const totalWaste = wasteSummary.reduce((s, w) => s + w.totalWasted, 0);
        const totalReceived = wasteSummary.reduce((s, w) => s + w.totalReceived, 0);
        const avgWastePct = totalReceived > 0 ? (totalWaste / totalReceived) * 100 : 0;

        // Trend: use average of score trends
        const avgTrend =
            scorecard.length > 0
                ? scorecard.reduce((s, r) => s + r.trendPct, 0) / scorecard.length
                : 0;

        return {
            totalRevenue,
            avgRating: Math.round(avgRating * 10) / 10,
            totalOrders,
            avgWastePct: Math.round(avgWastePct * 10) / 10,
            avgTrend: Math.round(avgTrend),
        };
    }, [scorecard, salesData, wasteSummary]);

    // Revenue trend (aggregate all locations by date)
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

    // Top 5 locations by revenue
    const topLocations = useMemo(() => {
        return [...scorecard]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
    }, [scorecard]);

    // Revenue by order type (donut)
    const orderTypeSplit = useMemo(() => {
        const totals: Record<string, number> = {};
        for (const s of salesData) {
            totals[s.orderType] = (totals[s.orderType] || 0) + s.revenue;
        }
        const total = Object.values(totals).reduce((s, v) => s + v, 0);
        return Object.entries(totals).map(([type, revenue]) => ({
            name: type,
            value: Math.round(revenue),
            pct: total > 0 ? Math.round((revenue / total) * 100) : 0,
        }));
    }, [salesData]);

    if (isLoading) {
        return (
            <div className="bp-card p-12 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px] uppercase tracking-[0.15em]">
                    <span className="w-2 h-2 bg-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header spec */}
            <div className="flex items-center gap-3">
                <span className="bp-spec">SYS_REF_01</span>
                <span className="text-xs text-muted-foreground">Scale: 1:1000 USD</span>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPICard
                    icon={DollarSign}
                    label="Total Revenue"
                    value={`$${(kpis.totalRevenue / 1000).toFixed(0)}k`}
                    trend={kpis.avgTrend}
                />
                <KPICard
                    icon={Star}
                    label="Avg Rating"
                    value={kpis.avgRating.toFixed(1)}
                    isStar
                />
                <KPICard
                    icon={ShoppingBag}
                    label="Total Orders"
                    value={kpis.totalOrders.toLocaleString()}
                />
                <KPICard
                    icon={Trash2}
                    label="Avg Waste Rate"
                    value={`${kpis.avgWastePct}%`}
                    alert={kpis.avgWastePct > 10}
                />
            </div>

            {/* Revenue Trend */}
            <div className="bp-section-label">
                <span>Revenue Trend Analysis</span>
            </div>
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">Chart 01</span>
                        <span className="text-sm font-semibold">Revenue Trend — All Locations</span>
                    </div>
                </div>
                <div className="p-4">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueByDate} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }}
                                interval={Math.max(0, Math.ceil(revenueByDate.length / 12) - 1)}
                            />
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
                                formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, "Revenue"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-chart-3)"
                                fill="url(#revenueGrad)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two-column: Top Locations + Order Type Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Performing Locations */}
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">Chart 02</span>
                            <span className="text-sm font-semibold">Top Performing Locations</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={topLocations}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fill: "var(--color-muted-foreground)" }}
                                    width={100}
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
                                    formatter={(v?: number) => [`$${(v ?? 0).toLocaleString()}`, "Revenue"]}
                                />
                                <Bar dataKey="totalRevenue" fill="var(--color-chart-3)" radius={[0, 0, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Order Type */}
                <div className="bp-card">
                    <div className="bp-corner-bl" />
                    <div className="bp-corner-br" />
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <span className="bp-spec">Chart 03</span>
                            <span className="text-sm font-semibold">Revenue by Order Type</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={orderTypeSplit}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, pct, x, y }: { name?: string; pct?: number; x?: number; y?: number }) => (
                                            <text x={x} y={y} fill="var(--color-foreground)" textAnchor="middle" dominantBaseline="central" fontSize={12} fontFamily="'JetBrains Mono', monospace">
                                                {`${name ?? ""} ${pct ?? 0}%`}
                                            </text>
                                        )}
                                    >
                                        {orderTypeSplit.map((_entry, idx) => (
                                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
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
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Status Grid */}
            <div className="bp-section-label">
                <span>Location Status Grid</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bp-spec">{locations.length}/{locations.length} Active</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {scorecard.map((loc) => {
                    const statusColor = {
                        healthy: "bg-emerald-500",
                        warning: "bg-amber-500",
                        critical: "bg-red-500",
                    }[loc.status];

                    return (
                        <button
                            key={loc.locationId}
                            onClick={onNavigateToLocations}
                            className="bp-card p-3 text-left hover:bg-accent/30 transition-colors group cursor-pointer"
                        >
                            <div className="bp-corner-bl" />
                            <div className="bp-corner-br" />
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-2 h-2 ${statusColor} flex-shrink-0`} />
                                <span className="text-[10px] font-semibold truncate uppercase tracking-wider">
                                    {loc.name}
                                </span>
                            </div>
                            <div className="text-xs font-medium tabular-nums">
                                ${(loc.totalRevenue / 1000).toFixed(0)}k
                            </div>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                {loc.city}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function KPICard({
    icon: Icon,
    label,
    value,
    trend,
    alert,
    isStar,
}: {
    icon: typeof DollarSign;
    label: string;
    value: string;
    trend?: number;
    alert?: boolean;
    isStar?: boolean;
}) {
    return (
        <div className={`bp-card p-4 ${alert ? "border-red-500/30 bg-red-500/[0.03]" : ""}`}>
            <div className="bp-corner-bl" />
            <div className="bp-corner-br" />
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-[0.15em] mb-2">
                <Icon size={12} className={isStar ? "text-amber-400" : ""} />
                {label}
            </div>
            <p className={`text-2xl font-bold tabular-nums ${alert ? "text-red-500" : ""}`}>
                {value}
            </p>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${trend >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}>
                    {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span className="tabular-nums">{Math.abs(trend)}% vs prev period</span>
                </div>
            )}
        </div>
    );
}
