import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

function formatAxisDate(value: unknown): string {
  const asString =
    typeof value === "string" ? value : value == null ? "" : String(value);
  if (!asString) return "";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(asString)
    ? asString
    : /^\d+$/.test(asString)
      ? new Date(
          Date.UTC(1970, 0, 1) + Number(asString) * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10)
      : asString;

  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
  }).format(d);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const numberTooltipFormatter = (value: any) =>
  typeof value === "number" ? value.toLocaleString() : String(value ?? "");

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

export default function ReviewsPage() {
  const { theme, toggle } = useTheme();
  const {
    locations,
    sales,
    reviews,
    inventory,
    dateRange,
    setDateRange,
  } = useSnowconeData();

  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

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

    return rows;
  }, [
    locations,
    sales,
    reviews,
    inventory,
    salesByLocationDate,
    dateRange.end,
  ]);

  const ratingTimeSeries = useMemo(() => {
    const map = new Map<
      string,
      { date: string; avgRating: number; count: number; _sum: number }
    >();
    for (const r of reviews) {
      if (
        selectedLocation &&
        r.LOCATION_ID !== selectedLocation.LOCATION_ID
      ) {
        continue;
      }
      const entry =
        map.get(r.REVIEW_DATE) ?? {
          date: r.REVIEW_DATE,
          avgRating: 0,
          count: 0,
          _sum: 0,
        };
      entry._sum += Number(r.RATING);
      entry.count += 1;
      map.set(r.REVIEW_DATE, entry);
    }
    const out = Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    return out.map((row) => ({
      date: row.date,
      avgRating: row.count ? row._sum / row.count : 0,
      count: row.count,
    }));
  }, [reviews, selectedLocation]);

  const topRiskLocations = useMemo(() => {
    const risky = scorecardRows
      .filter((r) => r.needsAttention)
      .map((r) => {
        const ratingPenalty =
          r.avgRating === null ? 0 : Math.max(0, 4.2 - r.avgRating);
        const wastePenalty = r.wasteCost / 250;
        const trendPenalty = r.trend === "declining" ? 1.5 : 0;
        const score = ratingPenalty + wastePenalty + trendPenalty;
        return { ...r, riskScore: score };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6);
    return risky;
  }, [scorecardRows]);

  const avgRatingByLocationChart = useMemo(() => {
    const buckets = new Map<number, { sum: number; count: number }>();
    for (const r of reviews) {
      const current = buckets.get(r.LOCATION_ID) ?? { sum: 0, count: 0 };
      current.sum += Number(r.RATING);
      current.count += 1;
      buckets.set(r.LOCATION_ID, current);
    }
    return locations
      .map((loc) => {
        const bucket = buckets.get(loc.LOCATION_ID);
        if (!bucket || bucket.count === 0) {
          return null;
        }
        return {
          name: loc.NAME,
          avgRating: bucket.sum / bucket.count,
        };
      })
      .filter((x): x is { name: string; avgRating: number } => x !== null)
      .sort((a, b) => a.avgRating - b.avgRating);
  }, [reviews, locations]);

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
                className="px-4 py-3 border-r bg-muted text-foreground transition-colors"
              >
                Reviews & experience
              </Link>
              <Link
                to="/scorecard"
                className="px-4 py-3 hover:bg-muted text-foreground transition-colors"
              >
                Scorecard & risk
              </Link>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4 md:space-y-6" aria-label="Customer reviews and experience">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <Card className="lg:col-span-8 bg-gradient-to-br from-teal-500/10 via-background to-background">
              <CardHeader>
                <CardTitle>Customer rating trend</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Average rating and review volume over time for{" "}
                  {selectedLocation ? selectedLocation.NAME : "the network"}.
                </p>
              </CardHeader>
              <CardContent className="h-[280px] md:h-[320px]">
                {ratingTimeSeries.length === 0 ? (
                  <div className="h-full flex flex-col gap-3 p-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={ratingTimeSeries}
                      margin={{ top: 10, bottom: 0, left: -10, right: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={formatAxisDate}
                        minTickGap={18}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 5]}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(v: unknown, name: unknown) => {
                          if (name === "Review count") {
                            return [numberTooltipFormatter(v), "Review count"];
                          }
                          return [
                            typeof v === "number"
                              ? v.toFixed(2)
                              : String(v ?? ""),
                            "Avg rating",
                          ];
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgRating"
                        name="Avg rating"
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="count"
                        name="Review count"
                        stroke="var(--color-chart-4)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 bg-gradient-to-br from-red-500/10 via-background to-background">
              <CardHeader>
                <CardTitle>Today's risk radar</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Locations most likely to need ops attention.
                </p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {topRiskLocations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No locations are flagged as "needs attention" in this window.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {topRiskLocations.map((row) => (
                      <li
                        key={row.location.LOCATION_ID}
                        className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() =>
                          setSelectedLocationId(String(row.location.LOCATION_ID))
                        }
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {row.location.NAME}
                            </span>
                            <TrendBadge trend={row.trend} />
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {row.location.CITY} • Revenue{" "}
                            {formatCurrency(row.totalRevenue)} • Waste{" "}
                            {formatCurrency(row.wasteCost)}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">
                          Needs attention
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          {avgRatingByLocationChart.length > 0 && (
            <Card className="bg-gradient-to-br from-indigo-500/10 via-background to-background">
              <CardHeader>
                <CardTitle>Average rating by location</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Which stores are delighting customers, and which may need help.
                </p>
              </CardHeader>
              <CardContent className="h-[260px] md:h-[320px]">
                {avgRatingByLocationChart.length === 0 ? (
                  <div className="h-full flex flex-col gap-3 p-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={avgRatingByLocationChart}
                    margin={{ top: 10, bottom: 40, left: -10, right: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.toFixed(1)}
                    />
                    <Tooltip
                      formatter={(v: unknown) =>
                        typeof v === "number"
                          ? v.toFixed(2)
                          : String(v ?? "")
                      }
                    />
                    <Bar
                      dataKey="avgRating"
                      name="Avg rating"
                      radius={[6, 6, 0, 0]}
                      fill="var(--color-chart-3)"
                    />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
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