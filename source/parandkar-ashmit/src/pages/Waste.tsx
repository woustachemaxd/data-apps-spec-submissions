import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useSnowconeData } from "@/hooks/useSnowconeData";
import { useTheme } from "@/hooks/useTheme";
import { MoonIcon, SunIcon } from "lucide-react";

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

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currencyTooltipFormatter = (value: any) =>
  formatCurrency(typeof value === "number" ? value : Number(value ?? 0));

export default function WastePage() {
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

  const wasteByLocationAndCategory = useMemo(() => {
    const byLocation = new Map<
      number,
      { name: string; total: number; dairy: number; produce: number; cones_cups: number; toppings: number; syrups: number }
    >();

    for (const i of inventory) {
      const loc =
        locations.find((l) => l.LOCATION_ID === i.LOCATION_ID) ?? null;
      if (!loc) continue;
      const bucket =
        byLocation.get(i.LOCATION_ID) ?? {
          name: loc.NAME,
          total: 0,
          dairy: 0,
          produce: 0,
          cones_cups: 0,
          toppings: 0,
          syrups: 0,
        };
      bucket.total += Number(i.WASTE_COST);
      bucket[i.CATEGORY] += Number(i.WASTE_COST);
      byLocation.set(i.LOCATION_ID, bucket);
    }

    return Array.from(byLocation.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [inventory, locations]);

  const wasteTimeSeries = useMemo(() => {
    const map = new Map<
      string,
      { date: string; wasteCost: number; unitsWasted: number }
    >();
    for (const i of inventory) {
      if (
        selectedLocation &&
        i.LOCATION_ID !== selectedLocation.LOCATION_ID
      ) {
        continue;
      }
      const entry =
        map.get(i.RECORD_DATE) ?? {
          date: i.RECORD_DATE,
          wasteCost: 0,
          unitsWasted: 0,
        };
      entry.wasteCost += Number(i.WASTE_COST);
      entry.unitsWasted += Number(i.UNITS_WASTED);
      map.set(i.RECORD_DATE, entry);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [inventory, selectedLocation]);

  const wasteCategoryMix = useMemo(() => {
    const totals: Record<
      "dairy" | "produce" | "cones_cups" | "toppings" | "syrups",
      number
    > = {
      dairy: 0,
      produce: 0,
      cones_cups: 0,
      toppings: 0,
      syrups: 0,
    };
    for (const i of inventory) {
      if (
        selectedLocation &&
        i.LOCATION_ID !== selectedLocation.LOCATION_ID
      ) {
        continue;
      }
      totals[i.CATEGORY] += Number(i.WASTE_COST);
    }
    const total =
      totals.dairy +
      totals.produce +
      totals.cones_cups +
      totals.toppings +
      totals.syrups;
    return (Object.entries(totals) as [keyof typeof totals, number][])
      .map(([key, value]) => ({
        key,
        name:
          key === "cones_cups"
            ? "Cones & cups"
            : key.charAt(0).toUpperCase() + key.slice(1),
        value,
        share: total ? value / total : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [inventory, selectedLocation]);

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
                className="px-4 py-3 border-b md:border-b-0 md:border-r bg-muted text-foreground transition-colors"
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
                className="px-4 py-3 hover:bg-muted text-foreground transition-colors"
              >
                Scorecard & risk
              </Link>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4 md:space-y-6" aria-label="Waste and inventory">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            <Card className="lg:col-span-7 bg-gradient-to-br from-rose-500/10 via-background to-background">
              <CardHeader>
                <CardTitle>Inventory waste by location</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Waste cost by location and category (weekly inventory records).
                </p>
              </CardHeader>
              <CardContent className="h-[320px] md:h-[380px]">
                {wasteByLocationAndCategory.length === 0 ? (
                  <div className="h-full flex flex-col gap-3 p-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={wasteByLocationAndCategory}
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
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip formatter={currencyTooltipFormatter as any} />
                      <Legend />
                      <Bar
                        dataKey="dairy"
                        stackId="w"
                        name="Dairy"
                        fill="var(--color-chart-1)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="produce"
                        stackId="w"
                        name="Produce"
                        fill="var(--color-chart-2)"
                      />
                      <Bar
                        dataKey="cones_cups"
                        stackId="w"
                        name="Cones & cups"
                        fill="var(--color-chart-3)"
                      />
                      <Bar
                        dataKey="toppings"
                        stackId="w"
                        name="Toppings"
                        fill="var(--color-chart-4)"
                      />
                      <Bar
                        dataKey="syrups"
                        stackId="w"
                        name="Syrups"
                        fill="var(--color-chart-5)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 bg-gradient-to-br from-fuchsia-500/10 via-background to-background">
              <CardHeader>
                <CardTitle>Waste trend & category mix</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Weekly waste cost over time, plus category share.
                </p>
              </CardHeader>
              <CardContent className="h-[320px] md:h-[380px] grid grid-rows-[1fr_auto] gap-3">
                {wasteTimeSeries.length === 0 ? (
                  <div className="h-full flex flex-col gap-3 p-4">
                    <Skeleton className="h-[180px] md:h-[220px] w-full" />
                    <Skeleton className="h-[120px] md:h-[130px] w-[200px] rounded-full mx-auto" />
                  </div>
                ) : (
                  <>
                    <div className="h-[180px] md:h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={wasteTimeSeries}
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
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) =>
                              `$${(v / 1000).toFixed(0)}k`
                            }
                          />
                          <Tooltip formatter={currencyTooltipFormatter as any} />
                          <Line
                            type="monotone"
                            dataKey="wasteCost"
                            name="Waste cost"
                            stroke="var(--color-chart-5)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-[120px] md:h-[130px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            formatter={(v: unknown) =>
                              currencyTooltipFormatter(v)
                            }
                          />
                          <Pie
                            data={wasteCategoryMix.filter((x) => x.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={2}
                          >
                            {wasteCategoryMix
                              .filter((x) => x.value > 0)
                              .map((_, idx) => (
                                <Cell
                                  key={idx}
                                  fill={CHART_COLORS[(idx + 1) % CHART_COLORS.length]}
                                />
                              ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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