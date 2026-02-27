import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSnowconeData, type Location } from "@/hooks/useSnowconeData";
import { useTheme } from "@/hooks/useTheme";
import { MoonIcon, SunIcon } from "lucide-react";

type Trend = "improving" | "declining" | "flat";

interface LocationScorecardRow {
  location: Location;
  totalRevenue: number;
  avgRating: number | null;
  wasteCost: number;
  trend: Trend;
  needsAttention: boolean;
}

type SortKey = "revenue" | "rating" | "trend" | "waste";

// ── Helpers ──────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "-";
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(0)}%`;
}

function computeTrend(
  locationId: number,
  endDate: string,
  salesByLocationDate: Map<number, Map<string, number>>
): Trend {
  const byDate = salesByLocationDate.get(locationId);
  if (!byDate) return "flat";

  const end = new Date(endDate);
  const last7Start = new Date(end);
  last7Start.setDate(end.getDate() - 6);
  const prev7Start = new Date(end);
  prev7Start.setDate(end.getDate() - 13);
  const prev7End = new Date(end);
  prev7End.setDate(end.getDate() - 7);

  let last7 = 0;
  let prev7 = 0;

  for (const [dateStr, value] of byDate.entries()) {
    const d = new Date(dateStr);
    if (d >= last7Start && d <= end) {
      last7 += value;
    } else if (d >= prev7Start && d <= prev7End) {
      prev7 += value;
    }
  }

  if (prev7 === 0 && last7 === 0) return "flat";
  if (prev7 === 0 && last7 > 0) return "improving";

  const change = (last7 - prev7) / prev7;
  if (change > 0.05) return "improving";
  if (change < -0.05) return "declining";
  return "flat";
}

export default function ScorecardPage() {
  const { theme, toggle } = useTheme();
  const {
    locations,
    sales,
    reviews,
    inventory,
    loading,
    error,
    dateRange,
    setDateRange,
  } = useSnowconeData();

  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const selectedLocation =
    selectedLocationId === "all"
      ? null
      : locations.find(
          (l) => String(l.LOCATION_ID) === selectedLocationId
        ) ?? null;

  const salesByLocationDate = useMemo(() => {
    const map = new Map<number, Map<string, number>>();
    for (const row of sales) {
      const locMap =
        map.get(row.LOCATION_ID) ?? new Map<string, number>();
      locMap.set(
        row.SALE_DATE,
        (locMap.get(row.SALE_DATE) ?? 0) + Number(row.REVENUE)
      );
      map.set(row.LOCATION_ID, locMap);
    }
    return map;
  }, [sales]);

  const scorecardRows: LocationScorecardRow[] = useMemo(() => {
    const revenueByLocation = new Map<number, number>();
    const ratingsByLocation = new Map<
      number,
      { total: number; count: number }
    >();
    const wasteByLocation = new Map<number, number>();

    for (const s of sales) {
      revenueByLocation.set(
        s.LOCATION_ID,
        (revenueByLocation.get(s.LOCATION_ID) ?? 0) + Number(s.REVENUE)
      );
    }
    for (const r of reviews) {
      const bucket =
        ratingsByLocation.get(r.LOCATION_ID) ?? { total: 0, count: 0 };
      bucket.total += Number(r.RATING);
      bucket.count += 1;
      ratingsByLocation.set(r.LOCATION_ID, bucket);
    }
    for (const i of inventory) {
      wasteByLocation.set(
        i.LOCATION_ID,
        (wasteByLocation.get(i.LOCATION_ID) ?? 0) + Number(i.WASTE_COST)
      );
    }

    const rows: LocationScorecardRow[] = locations.map((loc) => {
      const totalRevenue = revenueByLocation.get(loc.LOCATION_ID) ?? 0;
      const ratingBucket = ratingsByLocation.get(loc.LOCATION_ID);
      const avgRating =
        ratingBucket && ratingBucket.count > 0
          ? ratingBucket.total / ratingBucket.count
          : null;
      const wasteCost = wasteByLocation.get(loc.LOCATION_ID) ?? 0;
      const trend = computeTrend(
        loc.LOCATION_ID,
        dateRange.end,
        salesByLocationDate
      );

      const needsAttention =
        trend === "declining" &&
        (avgRating !== null && avgRating < 3.5) ||
        wasteCost > 1000;

      return {
        location: loc,
        totalRevenue,
        avgRating,
        wasteCost,
        trend,
        needsAttention,
      };
    });

    const filtered = rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.location.NAME.toLowerCase().includes(search.toLowerCase()) ||
        row.location.CITY.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "revenue") {
        cmp = a.totalRevenue - b.totalRevenue;
      } else if (sortBy === "rating") {
        cmp = (a.avgRating ?? 0) - (b.avgRating ?? 0);
      } else if (sortBy === "waste") {
        cmp = a.wasteCost - b.wasteCost;
      } else if (sortBy === "trend") {
        const order: Record<Trend, number> = {
          improving: 2,
          flat: 1,
          declining: 0,
        };
        cmp = order[a.trend] - order[b.trend];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [
    locations,
    sales,
    reviews,
    inventory,
    salesByLocationDate,
    dateRange.end,
    search,
    sortBy,
    sortDir,
  ]);

  const locationInventorySummary = useMemo(() => {
    if (!selectedLocation) return null;
    const bucket = {
      dairy: 0,
      produce: 0,
      cones_cups: 0,
      toppings: 0,
      syrups: 0,
    };
    for (const i of inventory) {
      if (i.LOCATION_ID !== selectedLocation.LOCATION_ID) continue;
      bucket[i.CATEGORY] += Number(i.WASTE_COST);
    }
    return bucket;
  }, [inventory, selectedLocation]);

  const selectedLocationReviews = useMemo(() => {
    if (!selectedLocation) return [];
    return reviews
      .filter((r) => r.LOCATION_ID === selectedLocation.LOCATION_ID)
      .sort((a, b) => b.REVIEW_DATE.localeCompare(a.REVIEW_DATE))
      .slice(0, 6);
  }, [reviews, selectedLocation]);

  const selectedLocationHeadline = useMemo(() => {
    if (!selectedLocation) return null;
    const revenue = sales
      .filter((s) => s.LOCATION_ID === selectedLocation.LOCATION_ID)
      .reduce((sum, s) => sum + Number(s.REVENUE), 0);
    const ratingBucket = reviews
      .filter((r) => r.LOCATION_ID === selectedLocation.LOCATION_ID)
      .reduce(
        (acc, r) => {
          acc.total += Number(r.RATING);
          acc.count += 1;
          return acc;
        },
        { total: 0, count: 0 }
      );
    const avgRating =
      ratingBucket.count > 0 ? ratingBucket.total / ratingBucket.count : null;
    const waste = inventory
      .filter((i) => i.LOCATION_ID === selectedLocation.LOCATION_ID)
      .reduce((sum, i) => sum + Number(i.WASTE_COST), 0);
    return { revenue, avgRating, waste };
  }, [selectedLocation, sales, reviews, inventory]);

  const totalRevenueAll = useMemo(
    () =>
      sales.reduce(
        (sum, s) => sum + Number(s.REVENUE),
        0
      ),
    [sales]
  );

  const avgRatingAll = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce(
      (sum, r) => sum + Number(r.RATING),
      0
    );
    return total / reviews.length;
  }, [reviews]);

  const totalWasteAll = useMemo(
    () =>
      inventory.reduce(
        (sum, i) => sum + Number(i.WASTE_COST),
        0
      ),
    [inventory]
  );

  const snapshotTitle = selectedLocation
    ? selectedLocation.NAME
    : "All locations";

  const snapshotRevenue = selectedLocationHeadline?.revenue ?? totalRevenueAll;
  const snapshotAvgRating =
    selectedLocationHeadline?.avgRating ?? avgRatingAll;
  const snapshotWaste = selectedLocationHeadline?.waste ?? totalWasteAll;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b px-6 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-primary font-semibold uppercase">
            The Snowcone Warehouse
          </p>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">
            Operations Command Center
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            SNOWCONE_DB • Live Snowflake data
          </span>
          <Button
            size="xs"
            variant="outline"
            onClick={toggle}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {theme === "dark" ? (
              <SunIcon className="size-3.5" />
            ) : (
              <MoonIcon className="size-3.5" />
            )}
          </Button>
          <Button asChild size="xs" variant="outline">
            <Link to="/ai">AI Insights</Link>
          </Button>
          <Button asChild size="xs" variant="outline">
            <Link to="/data">View schema</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1 px-4 md:px-6 py-4 md:py-6 max-w-7xl w-full mx-auto space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-primary/8 via-background to-background">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Snapshot</CardTitle>
                <p className="text-l text-muted-foreground mt-1">
                  Totals for{" "}
                  <span className="font-medium text-foreground">
                    {snapshotTitle}
                  </span>{" "}
                  in the selected date range.
                </p>
              </div>
              <div className="flex flex-col gap-4 items-stretch sm:items-end">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex items-center gap-1.5 text-base text-muted-foreground font-semibold">
                    <span>Location</span>
                  </div>
                  <Select
                    value={selectedLocationId}
                    onValueChange={setSelectedLocationId}
                  >
                    <SelectTrigger className="w-full sm:w-[360px] h-12 text-base">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem
                          key={loc.LOCATION_ID}
                          value={String(loc.LOCATION_ID)}
                        >
                          {loc.NAME} — {loc.CITY}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex items-center gap-1.5 text-base text-muted-foreground font-semibold">
                    <span>Date range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange({
                          ...dateRange,
                          start: e.target.value,
                        })
                      }
                      className="w-[160px] h-12 text-base"
                    />
                    <span className="text-base text-muted-foreground font-medium">to</span>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange({
                          ...dateRange,
                          end: e.target.value,
                        })
                      }
                      className="w-[160px] h-12 text-base"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <SummaryStat
                label="Revenue"
                value={formatCurrency(snapshotRevenue)}
                helper={selectedLocation ? "Selected location" : "All locations"}
                tone="sky"
              />
              <SummaryStat
                label="Avg customer rating"
                value={
                  snapshotAvgRating !== null
                    ? `${snapshotAvgRating.toFixed(1)} / 5`
                    : "—"
                }
                helper={
                  snapshotAvgRating !== null
                    ? selectedLocation
                      ? "Recent reviews (selected location)"
                      : "Across all recent reviews"
                    : "No reviews in range"
                }
                tone="amber"
              />
              <SummaryStat
                label="Inventory waste"
                value={formatCurrency(snapshotWaste)}
                helper={selectedLocation ? "Selected location" : "All locations"}
                tone="rose"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 via-background to-background lg:w-[280px]">
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Get intelligent recommendations and analysis powered by AI.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Ask questions about your data, identify trends, and get actionable insights.
              </p>
              <Button asChild className="w-full">
                <Link to="/ai">Go to AI Insights →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="px-2">
            <div className="grid grid-cols-2 md:grid-cols-4 text-xs md:text-sm">
              <Link
                to="/sales"
                className="px-4 py-3 border-r border-b md:border-b-0 hover:bg-muted text-foreground transition-colors"
              >
                Sales & orders
              </Link>
              <Link
                to="/waste"
                className="px-4 py-3 border-b md:border-b-0 md:border-r hover:bg-muted text-foreground transition-colors"
              >
                Waste & inventory
              </Link>
              <Link
                to="/reviews"
                className="px-4 py-3 border-r hover:bg-muted text-foreground transition-colors"
              >
                Reviews & experience
              </Link>
              <Link
                to="/scorecard"
                className="px-4 py-3 bg-muted text-foreground transition-colors"
              >
                Scorecard & risk
              </Link>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4 md:space-y-6" aria-label="Scorecard and operational risk">
          <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <section className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Location scorecard</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sort, search, and click into any store to see what needs
                      attention.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Input
                      placeholder="Search by name or city…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-[180px] md:w-[220px]"
                    />
                    <Select
                      value={sortBy}
                      onValueChange={(value) =>
                        setSortBy(value as SortKey)
                      }
                    >
                      <SelectTrigger size="sm" className="w-[120px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">
                          Revenue
                        </SelectItem>
                        <SelectItem value="rating">
                          Rating
                        </SelectItem>
                        <SelectItem value="waste">
                          Waste
                        </SelectItem>
                        <SelectItem value="trend">
                          Trend
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        setSortDir((d) =>
                          d === "asc" ? "desc" : "asc"
                        )
                      }
                    >
                      {sortDir === "asc" ? "Asc" : "Desc"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {loading && !scorecardRows.length ? (
                    <div className="py-6 space-y-3">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-12 flex-1" />
                          <Skeleton className="h-12 w-24" />
                          <Skeleton className="h-12 w-20" />
                          <Skeleton className="h-12 w-24" />
                          <Skeleton className="h-12 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="py-6 text-sm text-destructive">
                      Failed to load data: {error}
                    </div>
                  ) : !scorecardRows.length ? (
                    <div className="py-6 text-sm text-muted-foreground">
                      No locations found for the selected filters.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="py-2 pr-2 text-left font-medium">
                            Location
                          </th>
                          <th className="py-2 px-2 text-right font-medium">
                            Revenue
                          </th>
                          <th className="py-2 px-2 text-right font-medium">
                            Avg rating
                          </th>
                          <th className="py-2 px-2 text-right font-medium">
                            Waste
                          </th>
                          <th className="py-2 pl-2 text-left font-medium">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {scorecardRows.map((row) => {
                          const isSelected =
                            selectedLocation &&
                            selectedLocation.LOCATION_ID ===
                              row.location.LOCATION_ID;
                          return (
                            <tr
                              key={row.location.LOCATION_ID}
                              className={
                                "border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/60" +
                                (isSelected
                                  ? " bg-muted/80"
                                  : "")
                              }
                              onClick={() =>
                                setSelectedLocationId(
                                  String(row.location.LOCATION_ID)
                                )
                              }
                            >
                              <td className="py-2 pr-2">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">
                                    {row.location.NAME}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {row.location.CITY},{" "}
                                    {row.location.STATE}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right font-medium tabular-nums">
                                {formatCurrency(
                                  row.totalRevenue
                                )}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums">
                                {row.avgRating !== null ? (
                                  <span>
                                    {row.avgRating.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums">
                                {formatCurrency(row.wasteCost)}
                              </td>
                              <td className="py-2 pl-2">
                                <div className="flex items-center gap-1.5">
                                  <TrendBadge
                                    trend={row.trend}
                                  />
                                  {row.needsAttention && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[10px]"
                                    >
                                      Needs attention
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </section>

            <aside className="space-y-4 md:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by category</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Waste cost breakdown for the selected location.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedLocation ? (
                    <p className="text-xs text-muted-foreground">
                      Select a location to see its inventory waste mix.
                    </p>
                  ) : !locationInventorySummary ? (
                    <p className="text-xs text-muted-foreground">
                      No inventory data for this location in the selected range.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(
                        Object.entries(
                          locationInventorySummary
                        ) as [string, number][]
                      )
                        .filter(([, v]) => v > 0)
                        .map(([category, value]) => {
                          const total = Object.values(
                            locationInventorySummary
                          ).reduce((s, v) => s + v, 0);
                          const pct = total ? value / total : 0;
                          const label = {
                            dairy: "Dairy",
                            produce: "Produce",
                            cones_cups: "Cones & cups",
                            toppings: "Toppings",
                            syrups: "Syrups",
                          }[category as keyof typeof locationInventorySummary];
                          return (
                            <div
                              key={category}
                              className="space-y-1"
                            >
                              <div className="flex justify-between text-xs">
                                <span>{label}</span>
                                <span className="tabular-nums text-muted-foreground">
                                  {formatCurrency(value)} •{" "}
                                  {formatPercent(pct)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{
                                    width: `${pct * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent customer feedback</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Most recent reviews for the selected location.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedLocation ? (
                    <p className="text-xs text-muted-foreground">
                      Select a location to see its latest reviews.
                    </p>
                  ) : selectedLocationReviews.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No reviews found for this location in the selected date
                      range.
                    </p>
                  ) : (
                    <ul className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {selectedLocationReviews.map((review) => (
                        <li
                          key={review.REVIEW_ID}
                          className="border border-border rounded-lg px-3 py-2.5"
                        >
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {review.CUSTOMER_NAME}
                            </span>
                            <span className="text-xs tabular-nums">
                              {review.RATING.toFixed(1)} ★
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {review.REVIEW_TEXT}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {review.REVIEW_DATE}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-3 text-center text-[11px] text-muted-foreground">
        Built for The Snowcone Warehouse — live ops dashboard powered by Snowflake
      </footer>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  tone = "sky",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "sky" | "amber" | "rose";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-500/20"
      : tone === "amber"
        ? "from-amber-500/20"
        : "from-rose-500/20";
  return (
    <div
      className={[
        "rounded-lg border border-border/60 px-3 py-2.5 flex flex-col gap-1",
        "bg-gradient-to-br",
        toneClass,
        "via-muted/30 to-background",
      ].join(" ")}
    >
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="text-base md:text-lg font-semibold">
        {value}
      </span>
      {helper && (
        <span className="text-[11px] text-muted-foreground">
          {helper}
        </span>
      )}
    </div>
  );
}

function TrendBadge({ trend }: { trend: Trend }) {
  if (trend === "improving") {
    return (
      <Badge
        variant="secondary"
        className="text-[10px] border border-emerald-500/40 bg-emerald-500/15 text-emerald-700"
      >
        ↑ Improving
      </Badge>
    );
  }
  if (trend === "declining") {
    return (
      <Badge
        variant="destructive"
        className="text-[10px]"
      >
        ↓ Declining
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px]"
    >
      → Stable
    </Badge>
  );
}