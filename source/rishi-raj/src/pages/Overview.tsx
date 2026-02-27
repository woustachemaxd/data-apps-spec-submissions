import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DateRangeSelector } from "@/components/DateRangeSelector";
import { useDateRange } from "@/hooks/useDateRange";
import { useOverviewData } from "@/hooks/useOverviewData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type RevenueMode = "revenue" | "waste";

export default function OverviewPage() {
  const { range, loading: rangeLoading, error: rangeError } = useDateRange();
  const [mode, setMode] = useState<RevenueMode>("revenue");
  const overview = useOverviewData(range);

  const activeSeries =
    mode === "revenue" ? overview.revenueByLocation : overview.wasteByLocation;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            High-level performance across all locations.
          </p>
        </div>
        <DateRangeSelector />
      </div>

      {(rangeError || overview.error) && (
        <Card>
          <CardContent className="py-3 text-sm text-destructive">
            {rangeError || overview.error}
          </CardContent>
        </Card>
      )}

      <KpiHeader overview={overview} loading={rangeLoading || overview.loading} />

      <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
  <CardTitle>
    {mode === "revenue" ? "Revenue by Location" : "Waste by Location"}
  </CardTitle>

  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant={mode === "revenue" ? "default" : "outline"}
      onClick={() => setMode("revenue")}
    >
      Revenue
    </Button>
    <Button
      size="sm"
      variant={mode === "waste" ? "default" : "outline"}
      onClick={() => setMode("waste")}
    >
      Waste
    </Button>
  </div>
</CardHeader>
        <CardContent className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeSeries}
              margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number | string | undefined) => [
                  `$${Number(value ?? 0).toLocaleString()}`,
                  mode === "revenue" ? "Revenue" : "Waste",
                ]}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill={
                  mode === "revenue"
                    ? "hsl(142 72% 45%)"
                    : "hsl(0 84% 60%)"
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview.orderTypeDistribution}
                  dataKey="revenue"
                  nameKey="orderType"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {overview.orderTypeDistribution.map((_, index) => (
                    <CellWithColor
                      key={index}
                      index={index}
                      baseColor="hsl(221 83% 53%)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `$${Number(value ?? 0).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waste Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview.wasteCategoryDistribution}
                margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `$${Number(value ?? 0).toLocaleString()}`,
                    "Waste",
                  ]}
                />
                <Bar
                  dataKey="wasteCost"
                  radius={[4, 4, 0, 0]}
                  fill="hsl(0 84% 60%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopBottomCard
          title="Top Performers"
          sections={[
            {
              heading: "Top 3 Revenue Locations",
              rows: overview.topRevenueLocations,
              label: "Revenue",
              valueFormatter: (v) => `$${v.toLocaleString()}`,
            },
            {
              heading: "Top 3 Waste Locations",
              rows: overview.topWasteLocations,
              label: "Waste",
              valueFormatter: (v) => `$${v.toLocaleString()}`,
            },
          ]}
        />
        <TopBottomCard
          title="Needs Attention"
          sections={[
            {
              heading: "Bottom 3 Revenue Locations",
              rows: overview.bottomRevenueLocations,
              label: "Revenue",
              valueFormatter: (v) => `$${v.toLocaleString()}`,
            },
            {
              heading: "Bottom 3 Rating Locations",
              rows: overview.bottomRatingLocations.map((r) => ({
                name: r.name,
                value: r.avgRating ?? 0,
              })),
              label: "Rating",
              valueFormatter: (v) => v.toFixed(1),
            },
          ]}
        />
      </div>
    </div>
  );
}

function KpiHeader({
  overview,
  loading,
}: {
  overview: ReturnType<typeof useOverviewData>;
  loading: boolean;
}) {
  const kpis = overview.kpis;
  if (!kpis || loading) {
    return (
      <div className="grid gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-6 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const growthColor =
    kpis.revenueGrowthDirection === "up"
      ? "text-emerald-600"
      : kpis.revenueGrowthDirection === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <div className="grid gap-3 md:grid-cols-5">
      <Card>
        <CardContent className="py-4 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Total Revenue
          </div>
          <div className="text-lg font-semibold">
            ${kpis.totalRevenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Revenue Growth
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-semibold ${growthColor}`}>
              {kpis.revenueGrowthPct == null
                ? "—"
                : `${kpis.revenueGrowthPct.toFixed(1)}%`}
            </span>
            {kpis.revenueGrowthDirection && (
              <Badge
                variant={
                  kpis.revenueGrowthDirection === "up"
                    ? "secondary"
                    : kpis.revenueGrowthDirection === "down"
                    ? "destructive"
                    : "outline"
                }
              >
                {kpis.revenueGrowthDirection === "up"
                  ? "Growing"
                  : kpis.revenueGrowthDirection === "down"
                  ? "Declining"
                  : "Flat"}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Avg. Customer Rating
          </div>
          <div className="text-lg font-semibold">
            {kpis.avgRating == null ? "—" : kpis.avgRating.toFixed(1)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Total Waste Cost
          </div>
          <div className="text-lg font-semibold">
            ${kpis.totalWasteCost.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Total Orders
          </div>
          <div className="text-lg font-semibold">
            {kpis.totalOrders.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CellWithColor({
  index,
  baseColor,
}: {
  index: number;
  baseColor: string;
}) {
  const opacity = 0.5 + (index % 3) * 0.2;
  return <rect fill={baseColor} fillOpacity={opacity} />;
}

interface TopBottomSection {
  heading: string;
  rows: { name: string; value: number }[];
  label: string;
  valueFormatter: (v: number) => string;
}

function TopBottomCard({
  title,
  sections,
}: {
  title: string;
  sections: TopBottomSection[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.heading}>
            <div className="text-xs font-medium text-muted-foreground uppercase mb-1.5">
              {section.heading}
            </div>
            {section.rows.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No data for this range.
              </div>
            ) : (
              <div className="text-xs border rounded-lg divide-y">
                {section.rows.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between px-2.5 py-1.5"
                  >
                    <span className="truncate max-w-[60%]">{row.name}</span>
                    <span className="font-mono">
                      {section.valueFormatter(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

