import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function App() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
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
              <button
                type="button"
                onClick={() => navigate("/sales")}
                className="px-4 py-3 border-r border-b md:border-b-0 hover:bg-muted text-foreground transition-colors"
              >
                Sales & orders
              </button>
              <button
                type="button"
                onClick={() => navigate("/waste")}
                className="px-4 py-3 border-b md:border-b-0 md:border-r hover:bg-muted text-foreground transition-colors"
              >
                Waste & inventory
              </button>
              <button
                type="button"
                onClick={() => navigate("/reviews")}
                className="px-4 py-3 border-r hover:bg-muted text-foreground transition-colors"
              >
                Reviews & experience
              </button>
              <button
                type="button"
                onClick={() => navigate("/scorecard")}
                className="px-4 py-3 hover:bg-muted text-foreground transition-colors"
              >
                Scorecard & risk
              </button>
            </div>
          </CardContent>
        </Card>
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