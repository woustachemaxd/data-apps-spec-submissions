import { useState, useMemo } from "react";
import {
    AlertTriangle,
    Star,
    ArrowUpDown,
    Armchair,
    TrendingUp,
    TrendingDown,
    Minus,
    Info,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import EmptyState from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";
import type { ScorecardRow, SortDirection } from "@/types/schema";

interface LocationScorecardProps {
    data: ScorecardRow[];
    loading: boolean;
    onSelectLocation: (locationId: number) => void;
}

type SortKey =
    | "NAME"
    | "TOTAL_REVENUE"
    | "AVG_RATING"
    | "TOTAL_WASTE"
    | "REV_PER_SEAT";

function fmt$(val: number): string {
    return "$" + val.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface StatusInfo {
    status: "top" | "ok" | "attention";
    reasons: string[];
}

function computeStatuses(data: ScorecardRow[]) {
    const result = new Map<string, StatusInfo>();
    if (data.length === 0) return result;

    const revenues = data.map((r) => Number(r.TOTAL_REVENUE)).sort((a, b) => a - b);
    const wastes = data.map((r) => Number(r.TOTAL_WASTE)).sort((a, b) => a - b);
    const ratings = data.map((r) => Number(r.AVG_RATING)).sort((a, b) => a - b);

    const p25Rev = revenues[Math.floor(revenues.length * 0.25)];
    const p75Rev = revenues[Math.floor(revenues.length * 0.75)];
    const p75Waste = wastes[Math.floor(wastes.length * 0.75)];
    const medianRating = ratings[Math.floor(ratings.length * 0.5)];

    for (const row of data) {
        const rev = Number(row.TOTAL_REVENUE);
        const rating = Number(row.AVG_RATING);
        const waste = Number(row.TOTAL_WASTE);
        const reasons: string[] = [];

        // Check for Top Performer
        if (rev >= p75Rev && rating >= 4.0) {
            reasons.push(`Top 25% revenue (≥ ${fmt$(p75Rev)})`);
            reasons.push(`Strong rating (${rating.toFixed(1)} ★)`);
            result.set(row.LOCATION_ID, { status: "top", reasons });
            continue;
        }

        // Check for Attention flags
        if (rev <= p25Rev) {
            reasons.push(`Bottom 25% revenue (≤ ${fmt$(p25Rev)})`);
        }
        if (rating < 3.5) {
            reasons.push(`Low rating (${rating.toFixed(1)} ★ < 3.5)`);
        }
        if (waste >= p75Waste) {
            reasons.push(`High waste — top 25% (≥ ${fmt$(p75Waste)})`);
        }

        if (reasons.length > 0) {
            result.set(row.LOCATION_ID, { status: "attention", reasons });
        } else {
            // On Track reasons
            const trackReasons = [];
            if (rev > p25Rev && rev < p75Rev) trackReasons.push("Revenue in middle 50%");
            if (rating >= medianRating) trackReasons.push(`Rating above median (${medianRating.toFixed(1)} ★)`);
            if (waste < p75Waste) trackReasons.push("Waste below threshold");
            result.set(row.LOCATION_ID, {
                status: "ok",
                reasons: trackReasons.length > 0 ? trackReasons : ["All metrics within normal range"],
            });
        }
    }

    return result;
}

/** Determine trend from order count / revenue ratio heuristic */
function getTrend(revenue: number, avgRevenue: number): "up" | "down" | "flat" {
    if (avgRevenue === 0) return "flat";
    const ratio = revenue / avgRevenue;
    if (ratio > 1.15) return "up";
    if (ratio < 0.85) return "down";
    return "flat";
}

export default function LocationScorecard({
    data,
    loading,
    onSelectLocation,
}: LocationScorecardProps) {
    const [sortKey, setSortKey] = useState<SortKey>("TOTAL_REVENUE");
    const [sortDir, setSortDir] = useState<SortDirection>("desc");

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
    };

    const statusInfos = useMemo(() => computeStatuses(data), [data]);
    const avgRevenue = useMemo(() => {
        if (data.length === 0) return 0;
        return data.reduce((s, r) => s + Number(r.TOTAL_REVENUE), 0) / data.length;
    }, [data]);

    const sorted = useMemo(() => {
        const copy = [...data];
        copy.sort((a, b) => {
            if (sortKey === "NAME") {
                return sortDir === "asc"
                    ? a.NAME.localeCompare(b.NAME)
                    : b.NAME.localeCompare(a.NAME);
            }
            let av: number;
            let bv: number;
            if (sortKey === "REV_PER_SEAT") {
                av = Number(a.TOTAL_REVENUE) / (Number(a.SEATING_CAPACITY) || 1);
                bv = Number(b.TOTAL_REVENUE) / (Number(b.SEATING_CAPACITY) || 1);
            } else {
                av = Number(a[sortKey]);
                bv = Number(b[sortKey]);
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return copy;
    }, [data, sortKey, sortDir]);

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return <EmptyState message="No location data found for this period" />;
    }

    const SortableHeader = ({
        label,
        field,
    }: {
        label: string;
        field: SortKey;
    }) => (
        <TableHead
            className="cursor-pointer select-none hover:text-foreground transition-colors"
            onClick={() => toggleSort(field)}
        >
            <span className="flex items-center gap-1">
                {label}
                <ArrowUpDown
                    className={cn(
                        "h-3 w-3 transition-opacity",
                        sortKey === field ? "opacity-100" : "opacity-30"
                    )}
                />
            </span>
        </TableHead>
    );

    return (
        <TooltipProvider delayDuration={200}>
            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <SortableHeader label="Location" field="NAME" />
                            <TableHead className="hidden sm:table-cell">Manager</TableHead>
                            <SortableHeader label="Revenue" field="TOTAL_REVENUE" />
                            <SortableHeader label="Rev/Seat" field="REV_PER_SEAT" />
                            <SortableHeader label="Rating" field="AVG_RATING" />
                            <SortableHeader label="Waste" field="TOTAL_WASTE" />
                            <TableHead className="hidden lg:table-cell">
                                <span className="flex items-center gap-1">
                                    Trend
                                </span>
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((row) => {
                            const rating = Number(row.AVG_RATING);
                            const waste = Number(row.TOTAL_WASTE);
                            const revenue = Number(row.TOTAL_REVENUE);
                            const capacity = Number(row.SEATING_CAPACITY) || 1;
                            const revPerSeat = revenue / capacity;
                            const info = statusInfos.get(row.LOCATION_ID) ?? {
                                status: "ok" as const,
                                reasons: [],
                            };
                            const trend = getTrend(revenue, avgRevenue);

                            return (
                                <TableRow
                                    key={row.LOCATION_ID}
                                    className="cursor-pointer hover:bg-muted/40 transition-colors group"
                                    onClick={() => onSelectLocation(Number(row.LOCATION_ID))}
                                >
                                    {/* Location name */}
                                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                                        {row.NAME}
                                    </TableCell>

                                    {/* Manager */}
                                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                        {row.MANAGER_NAME}
                                    </TableCell>

                                    {/* Revenue */}
                                    <TableCell className="font-mono text-sm tabular-nums">
                                        {fmt$(revenue)}
                                    </TableCell>

                                    {/* Revenue per Seat */}
                                    <TableCell>
                                        <span className="flex items-center gap-1 text-sm tabular-nums font-mono">
                                            <Armchair className="h-3 w-3 text-muted-foreground/50" />
                                            {fmt$(Math.round(revPerSeat))}
                                        </span>
                                    </TableCell>

                                    {/* Rating */}
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 font-medium cursor-help",
                                                        rating < 3.5
                                                            ? "text-red-500 dark:text-red-400"
                                                            : rating > 4.2
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-muted-foreground"
                                                    )}
                                                >
                                                    {rating < 3.5 && <AlertTriangle className="h-3.5 w-3.5" />}
                                                    {rating > 4.2 && <Star className="h-3.5 w-3.5 fill-current" />}
                                                    {rating.toFixed(1)}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">
                                                    {rating < 3.5
                                                        ? "Below target — review customer complaints"
                                                        : rating > 4.2
                                                            ? "Excellent — customer favorite"
                                                            : "Average — room for improvement"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Waste */}
                                    <TableCell>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span
                                                    className={cn(
                                                        "text-sm tabular-nums font-mono cursor-help",
                                                        info.status === "attention"
                                                            ? "text-red-500 dark:text-red-400 font-medium"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {fmt$(waste)}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">
                                                    {waste > 3000
                                                        ? "Critical — investigate supply chain"
                                                        : waste > 2000
                                                            ? "Above average — review inventory"
                                                            : "Within acceptable range"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Trend */}
                                    <TableCell className="hidden lg:table-cell">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 text-xs font-medium cursor-help",
                                                        trend === "up" && "text-emerald-600 dark:text-emerald-400",
                                                        trend === "down" && "text-red-500 dark:text-red-400",
                                                        trend === "flat" && "text-muted-foreground"
                                                    )}
                                                >
                                                    {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
                                                    {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
                                                    {trend === "flat" && <Minus className="h-3.5 w-3.5" />}
                                                    {trend === "up" ? "Up" : trend === "down" ? "Down" : "Flat"}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">
                                                    {trend === "up"
                                                        ? "Revenue 15%+ above average"
                                                        : trend === "down"
                                                            ? "Revenue 15%+ below average"
                                                            : "Revenue within ±15% of average"}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>

                                    {/* Status with hover tooltip */}
                                    <TableCell className="hidden lg:table-cell">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="inline-flex items-center gap-1 cursor-help">
                                                    {info.status === "attention" ? (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Needs Attention
                                                        </Badge>
                                                    ) : info.status === "top" ? (
                                                        <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800 border-0">
                                                            Top Performer
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            On Track
                                                        </Badge>
                                                    )}
                                                    <Info className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="left"
                                                className="max-w-[220px]"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold">
                                                        {info.status === "attention"
                                                            ? "Why this store needs attention:"
                                                            : info.status === "top"
                                                                ? "Why this store is a top performer:"
                                                                : "Why this store is on track:"}
                                                    </p>
                                                    <ul className="text-xs space-y-0.5">
                                                        {info.reasons.map((r, i) => (
                                                            <li key={i} className="flex items-start gap-1">
                                                                <span className="text-muted-foreground">•</span>
                                                                {r}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
    );
}
