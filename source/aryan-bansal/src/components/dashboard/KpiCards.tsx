import {
    DollarSign,
    Star,
    Trash2,
    ShoppingCart,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ScorecardRow } from "@/types/schema";

interface KpiCardsProps {
    data: ScorecardRow[];
    loading: boolean;
    companyData?: ScorecardRow[];
}

function DeltaChip({ delta, inverse = false }: { delta: number; inverse?: boolean }) {
    const isGood = inverse ? delta <= 0 : delta >= 0;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                isGood
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300"
            )}
        >
            {delta >= 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            vs avg
        </span>
    );
}

export default function KpiCards({ data, loading, companyData }: KpiCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="pt-6">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const totalRevenue = data.reduce((sum, r) => sum + Number(r.TOTAL_REVENUE), 0);
    const avgRating = data.length > 0
        ? data.reduce((sum, r) => sum + Number(r.AVG_RATING), 0) / data.length
        : 0;
    const totalWaste = data.reduce((sum, r) => sum + Number(r.TOTAL_WASTE), 0);
    const totalOrders = data.reduce((sum, r) => sum + Number(r.TOTAL_ORDERS), 0);

    // Company averages
    const hasComparison = companyData && companyData.length > 0;
    const compAvgRevenue = hasComparison
        ? companyData.reduce((s, r) => s + Number(r.TOTAL_REVENUE), 0) / companyData.length
        : 0;
    const compAvgRating = hasComparison
        ? companyData.reduce((s, r) => s + Number(r.AVG_RATING), 0) / companyData.length
        : 0;
    const compAvgWaste = hasComparison
        ? companyData.reduce((s, r) => s + Number(r.TOTAL_WASTE), 0) / companyData.length
        : 0;
    const compAvgOrders = hasComparison
        ? companyData.reduce((s, r) => s + Number(r.TOTAL_ORDERS), 0) / companyData.length
        : 0;

    const cards = [
        {
            label: "Revenue",
            value: `$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            subtext: hasComparison ? `Avg: $${Math.round(compAvgRevenue).toLocaleString()}` : undefined,
            delta: hasComparison ? totalRevenue - compAvgRevenue : undefined,
            deltaPrefix: "$",
            inverse: false,
            icon: DollarSign,
            iconBg: "bg-emerald-100 dark:bg-emerald-950",
            iconColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: "Avg Rating",
            value: avgRating.toFixed(1),
            subtext: hasComparison ? `Avg: ${compAvgRating.toFixed(1)}` : undefined,
            delta: hasComparison ? avgRating - compAvgRating : undefined,
            deltaPrefix: "",
            inverse: false,
            icon: Star,
            iconBg:
                avgRating >= 4.0
                    ? "bg-emerald-100 dark:bg-emerald-950"
                    : avgRating >= 3.5
                        ? "bg-amber-100 dark:bg-amber-950"
                        : "bg-red-100 dark:bg-red-950",
            iconColor:
                avgRating >= 4.0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : avgRating >= 3.5
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-red-500 dark:text-red-400",
        },
        {
            label: "Waste",
            value: `$${totalWaste.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            subtext: hasComparison ? `Avg: $${Math.round(compAvgWaste).toLocaleString()}` : undefined,
            delta: hasComparison ? totalWaste - compAvgWaste : undefined,
            deltaPrefix: "$",
            inverse: true,
            icon: Trash2,
            iconBg: "bg-red-100 dark:bg-red-950",
            iconColor: "text-red-500 dark:text-red-400",
        },
        {
            label: "Orders",
            value: totalOrders.toLocaleString(),
            subtext: hasComparison ? `Avg: ${Math.round(compAvgOrders).toLocaleString()}` : undefined,
            delta: hasComparison ? totalOrders - compAvgOrders : undefined,
            deltaPrefix: "",
            inverse: false,
            icon: ShoppingCart,
            iconBg: "bg-blue-100 dark:bg-blue-950",
            iconColor: "text-blue-500 dark:text-blue-400",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(
                ({ label, value, subtext, delta, inverse, icon: Icon, iconBg, iconColor }) => (
                    <Card
                        key={label}
                        className="relative overflow-hidden group hover:shadow-md transition-shadow duration-200"
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-0">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {label}
                                    </p>
                                    <p className="text-2xl font-bold tracking-tight mt-1">
                                        {value}
                                    </p>
                                    {subtext && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {subtext}
                                        </p>
                                    )}
                                    {delta !== undefined && (
                                        <DeltaChip delta={delta} inverse={inverse} />
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110 shrink-0",
                                        iconBg,
                                        iconColor
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
}
