import { useState, useMemo } from "react";
import { useScorecard, type ScorecardRow } from "@/hooks/useScorecard";
import { useLocations } from "@/hooks/useLocations";
import { useFilters } from "@/contexts/FilterContext";
import ExportButton from "@/components/ExportButton";
import DateRangeFilter from "@/components/DateRangeFilter";
import {
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Star,
    ChevronUp,
    ChevronDown,
    GitCompareArrows,
    X,
} from "lucide-react";

type SortKey = "name" | "city" | "totalRevenue" | "avgRating" | "trendPct" | "wastePct";
type SortDir = "asc" | "desc";

interface LocationScorecardProps {
    onLocationSelect: (locationId: number) => void;
}

function StatusBadge({ status }: { status: ScorecardRow["status"] }) {
    const config = {
        healthy: { label: "Healthy", className: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" },
        warning: { label: "Attention", className: "border-amber-500/30 text-amber-500 bg-amber-500/5" },
        critical: { label: "Critical", className: "border-red-500/30 text-red-500 bg-red-500/5" },
    };
    const c = config[status];
    return (
        <span className={`bp-badge ${c.className}`}>
            {c.label}
        </span>
    );
}

function TrendIndicator({ pct }: { pct: number }) {
    if (Math.abs(pct) < 1) {
        return (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs">
                <Minus size={12} />
                <span className="tabular-nums">0%</span>
            </span>
        );
    }
    const isUp = pct > 0;
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-500" : "text-red-500"
                }`}
        >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span className="tabular-nums">{Math.abs(pct)}%</span>
        </span>
    );
}

function RatingDisplay({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-1">
            <Star
                size={11}
                className={rating >= 3.5 ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40 fill-muted-foreground/40"}
            />
            <span className={`text-xs font-medium tabular-nums ${rating < 3.0 ? "text-red-500" : ""}`}>
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
                    <ChevronUp size={11} />
                ) : (
                    <ChevronDown size={11} />
                )}
            </span>
        </button>
    );
}

export default function LocationScorecard({ onLocationSelect }: LocationScorecardProps) {
    const { data, loading, error } = useScorecard();
    const { data: locations } = useLocations();
    const { comparisonLocationIds, toggleComparisonLocation, clearComparison, searchQuery } = useFilters();
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
            <div className="bp-card p-12 text-center">
                <div className="flex items-center justify-center gap-3 text-muted-foreground text-[11px] uppercase tracking-[0.15em]">
                    <span className="w-2 h-2 bg-primary animate-pulse" style={{ animationDuration: '1.5s' }} />
                    Loading scorecard data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bp-card border-destructive p-8 text-center">
                <p className="text-destructive font-medium text-sm">Failed to load scorecard</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    const criticalCount = data.filter((r) => r.status === "critical").length;
    const warningCount = data.filter((r) => r.status === "warning").length;

    return (
        <div className="space-y-4">
            {/* Section label */}
            <div className="bp-section-label">
                <span>Location Scorecard</span>
            </div>

            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="bp-badge text-muted-foreground">
                    {data.length} locations
                </span>
                {criticalCount > 0 && (
                    <span className="bp-badge border-red-500/30 text-red-500 bg-red-500/5">
                        {criticalCount} critical
                    </span>
                )}
                {warningCount > 0 && (
                    <span className="bp-badge border-amber-500/30 text-amber-500 bg-amber-500/5">
                        {warningCount} need attention
                    </span>
                )}
                {/* Mobile date filter */}
                <div className="md:hidden ml-auto">
                    <DateRangeFilter />
                </div>
            </div>

            {/* Comparison mode banner */}
            {comparisonLocationIds.length > 0 && (
                <div className="flex items-center gap-3 text-xs bg-primary/5 border border-primary/20 px-4 py-2.5">
                    <GitCompareArrows size={14} className="text-primary shrink-0" />
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground font-semibold uppercase tracking-[0.1em] text-[10px]">Comparing:</span>
                        {comparisonLocationIds.map((id) => {
                            const loc = locations.find((l) => l.LOCATION_ID === id);
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 bg-background px-2 py-0.5 border text-[10px] font-medium"
                                >
                                    {loc?.NAME || `#${id}`}
                                    <button
                                        onClick={() => toggleComparisonLocation(id)}
                                        className="text-muted-foreground hover:text-foreground ml-0.5"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            );
                        })}
                        {comparisonLocationIds.length < 3 && (
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                (select up to 3)
                            </span>
                        )}
                    </div>
                    <button
                        onClick={clearComparison}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline shrink-0 uppercase tracking-wider"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bp-card">
                <div className="bp-corner-bl" />
                <div className="bp-corner-br" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <span className="bp-spec">No. 01</span>
                        <span className="text-sm font-semibold">Location Scorecard</span>
                    </div>
                    <ExportButton
                        data={sorted as unknown as Record<string, unknown>[]}
                        filename="snowcone_scorecard"
                        columns={[
                            { key: "name", label: "Location" },
                            { key: "city", label: "City" },
                            { key: "totalRevenue", label: "Revenue", format: (v) => `$${Number(v).toLocaleString()}` },
                            { key: "avgRating", label: "Avg Rating", format: (v) => Number(v).toFixed(1) },
                            { key: "trendPct", label: "Trend %", format: (v) => `${v}%` },
                            { key: "wastePct", label: "Waste %", format: (v) => `${Number(v).toFixed(1)}%` },
                            { key: "status", label: "Status" },
                        ]}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
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
                        border-b border-border/40 cursor-pointer
                        transition-colors duration-100
                        hover:bg-accent/50
                        ${row.status === "critical" ? "bg-red-500/[0.03]" : ""}
                        ${row.status === "warning" ? "bg-amber-500/[0.03]" : ""}
                        ${isComparing ? "ring-1 ring-inset ring-primary/30" : ""}
                      `}
                                    >
                                        <td className="px-4 py-2.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleComparisonLocation(row.locationId);
                                                }}
                                                className={`w-3.5 h-3.5 border transition-colors ${isComparing
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
                                        <td className="px-4 py-2.5">
                                            <span className="font-medium">{row.name}</span>
                                            <span className="sm:hidden text-[10px] text-muted-foreground ml-1">
                                                {row.city}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                                            {row.city}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                                            ${row.totalRevenue.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <RatingDisplay rating={row.avgRating} />
                                        </td>
                                        <td className="px-4 py-2.5 text-center hidden md:table-cell">
                                            <TrendIndicator pct={row.trendPct} />
                                        </td>
                                        <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                                            <span
                                                className={`text-xs tabular-nums ${row.wastePct > 15
                                                    ? "text-red-500 font-medium"
                                                    : row.wastePct > 10
                                                        ? "text-amber-500"
                                                        : "text-muted-foreground"
                                                    }`}
                                            >
                                                {row.wastePct.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <StatusBadge status={row.status} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
