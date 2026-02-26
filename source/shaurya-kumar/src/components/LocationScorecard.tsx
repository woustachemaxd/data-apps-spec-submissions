import { useState, useMemo } from "react";
import { useScorecard, type ScorecardRow } from "@/hooks/useScorecard";
import { useFilters } from "@/contexts/FilterContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Star,
    ChevronUp,
    ChevronDown,
    GitCompareArrows,
} from "lucide-react";
import DateRangeFilter from "@/components/DateRangeFilter";

type SortKey = "name" | "city" | "totalRevenue" | "avgRating" | "trendPct" | "wastePct";
type SortDir = "asc" | "desc";

interface LocationScorecardProps {
    onLocationSelect: (locationId: number) => void;
}

function StatusBadge({ status }: { status: ScorecardRow["status"] }) {
    const config = {
        healthy: { label: "Healthy", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        warning: { label: "Attention", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
        critical: { label: "Critical", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    };
    const c = config[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.className}`}>
            {c.label}
        </span>
    );
}

function TrendIndicator({ pct }: { pct: number }) {
    if (Math.abs(pct) < 1) {
        return (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground text-sm">
                <Minus size={14} />
                <span>0%</span>
            </span>
        );
    }
    const isUp = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-sm font-medium ${isUp ? "text-emerald-600" : "text-red-500"
                }`}
        >
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(pct)}%</span>
        </span>
    );
}

function RatingDisplay({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-1">
            <Star
                size={13}
                className={rating >= 3.5 ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40 fill-muted-foreground/40"}
            />
            <span className={`text-sm font-medium ${rating < 3.0 ? "text-red-500" : ""}`}>
                {rating.toFixed(1)}
            </span>
        </span>
    );
}

function SortHeader({
    label,
    sortKey,
    currentSort,
    currentDir,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    currentSort: SortKey;
    currentDir: SortDir;
    onSort: (key: SortKey) => void;
}) {
    const isActive = currentSort === sortKey;
    return (
        <button
            onClick={() => onSort(sortKey)}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
        >
            <span>{label}</span>
            <span className={`${isActive ? "text-foreground" : "text-transparent group-hover:text-muted-foreground/50"}`}>
                {isActive && currentDir === "asc" ? (
                    <ChevronUp size={13} />
                ) : (
                    <ChevronDown size={13} />
                )}
            </span>
        </button>
    );
}

export default function LocationScorecard({ onLocationSelect }: LocationScorecardProps) {
    const { data, loading, error } = useScorecard();
    const { comparisonLocationIds, toggleComparisonLocation, searchQuery } = useFilters();
    const [sortKey, setSortKey] = useState<SortKey>("totalRevenue");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "name" || key === "city" ? "asc" : "desc");
        }
    };

    const sorted = useMemo(() => {
        let filtered = data;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = data.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.city.toLowerCase().includes(q)
            );
        }
        return [...filtered].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [data, sortKey, sortDir, searchQuery]);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading scorecard data...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-destructive">
                <CardContent className="py-8 text-center">
                    <p className="text-destructive font-medium">Failed to load scorecard</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </CardContent>
            </Card>
        );
    }

    const criticalCount = data.filter((r) => r.status === "critical").length;
    const warningCount = data.filter((r) => r.status === "warning").length;

    return (
        <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {data.length} locations
                    </Badge>
                    {criticalCount > 0 && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">
                            {criticalCount} critical
                        </Badge>
                    )}
                    {warningCount > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                            {warningCount} need attention
                        </Badge>
                    )}
                </div>
                {/* Mobile date filter */}
                <div className="md:hidden ml-auto">
                    <DateRangeFilter />
                </div>
            </div>

            {/* Comparison mode hint */}
            {comparisonLocationIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    <GitCompareArrows size={14} />
                    <span>
                        Comparing {comparisonLocationIds.length} location{comparisonLocationIds.length > 1 ? "s" : ""}.
                        Select up to 3.
                    </span>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Location Scorecard</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                                    <th className="text-left px-4 py-3 font-medium w-8"></th>
                                    <th className="text-left px-4 py-3 font-medium">
                                        <SortHeader label="Location" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                                        <SortHeader label="City" sortKey="city" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-right px-4 py-3 font-medium">
                                        <SortHeader label="Revenue" sortKey="totalRevenue" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-center px-4 py-3 font-medium">
                                        <SortHeader label="Rating" sortKey="avgRating" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-center px-4 py-3 font-medium hidden md:table-cell">
                                        <SortHeader label="Trend" sortKey="trendPct" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
                                        <SortHeader label="Waste %" sortKey="wastePct" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                                    </th>
                                    <th className="text-center px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((row) => {
                                    const isComparing = comparisonLocationIds.includes(row.locationId);
                                    return (
                                        <tr
                                            key={row.locationId}
                                            onClick={() => onLocationSelect(row.locationId)}
                                            className={`
                        border-b border-border/50 cursor-pointer
                        transition-colors duration-100
                        hover:bg-accent/50
                        ${row.status === "critical" ? "bg-red-500/[0.03]" : ""}
                        ${row.status === "warning" ? "bg-amber-500/[0.03]" : ""}
                        ${isComparing ? "ring-1 ring-inset ring-primary/30" : ""}
                      `}
                                        >
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleComparisonLocation(row.locationId);
                                                    }}
                                                    className={`w-4 h-4 rounded border transition-colors ${isComparing
                                                            ? "bg-primary border-primary"
                                                            : "border-border hover:border-primary/50"
                                                        }`}
                                                    title={isComparing ? "Remove from comparison" : "Add to comparison"}
                                                >
                                                    {isComparing && (
                                                        <svg viewBox="0 0 16 16" className="w-full h-full text-primary-foreground">
                                                            <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{row.name}</span>
                                                <span className="sm:hidden text-xs text-muted-foreground ml-1">
                                                    {row.city}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                                                {row.city}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                ${row.totalRevenue.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <RatingDisplay rating={row.avgRating} />
                                            </td>
                                            <td className="px-4 py-3 text-center hidden md:table-cell">
                                                <TrendIndicator pct={row.trendPct} />
                                            </td>
                                            <td className="px-4 py-3 text-center hidden lg:table-cell">
                                                <span
                                                    className={`text-sm tabular-nums ${row.wastePct > 15
                                                            ? "text-red-500 font-medium"
                                                            : row.wastePct > 10
                                                                ? "text-amber-600"
                                                                : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {row.wastePct.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={row.status} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
