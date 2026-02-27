import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DateRangeSelector } from "@/components/DateRangeSelector";
import { useDateRange } from "@/hooks/useDateRange";
import { useLocationData } from "@/hooks/useLocationData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams } from "react-router-dom";

export default function ByLocationPage() {
  const { range, error: rangeError } = useDateRange();
  const params = useParams();
  const initialId = params.locationId ? Number(params.locationId) : null;
  const [locationId, setLocationId] = useState<number | null>(initialId);
  const locationData = useLocationData(range, locationId);

  useEffect(() => {
    if (!locationData.locations.length) return;
    if (locationId != null) return;
    const first = locationData.locations[0];
    setLocationId(first.LOCATION_ID);
  }, [locationData.locations, locationId]);

  const selectorOptions = useMemo(
    () =>
      locationData.locations.map((loc) => ({
        value: String(loc.LOCATION_ID),
        label: loc.NAME,
      })),
    [locationData.locations]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">By Location</h1>
          <p className="text-sm text-muted-foreground">
            Drill into a single store&apos;s performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeSelector />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Location
            </span>
            <Select
              value={locationId != null ? String(locationId) : ""}
              onValueChange={(v) => setLocationId(v ? Number(v) : null)}
              disabled={!selectorOptions.length}
            >
              <SelectTrigger size="sm" className="min-w-48">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {selectorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {(rangeError || locationData.error) && (
        <Card>
          <CardContent className="py-3 text-sm text-destructive">
            {rangeError || locationData.error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <LocationInfoCard locationData={locationData} />
        <LocationKpis locationData={locationData} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={locationData.revenueTrend}
                margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `$${Number(value ?? 0).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 72% 45%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationData.orderTypeBreakdown}
                margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="orderType"
                  tick={{ fontSize: 11 }}
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `$${Number(value ?? 0).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  radius={[4, 4, 0, 0]}
                  fill="hsl(221 83% 53%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Waste Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={locationData.wasteTrend}
                margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  height={40}
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
                <Line
                  type="monotone"
                  dataKey="wasteCost"
                  stroke="hsl(0 84% 60%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waste Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationData.wasteCategoryBreakdown}
                margin={{ top: 8, right: 16, left: -16, bottom: 24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  height={40}
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

      <ReviewsTable locationData={locationData} />
    </div>
  );
}

function LocationInfoCard({
  locationData,
}: {
  locationData: ReturnType<typeof useLocationData>;
}) {
  const loc = locationData.selectedLocation;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm">
        {loc ? (
          <>
            <div className="font-medium">{loc.NAME}</div>
            <div className="text-muted-foreground">
              {loc.ADDRESS}, {loc.CITY}, {loc.STATE}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span>Manager: {loc.MANAGER_NAME}</span>
              <span>Seating: {loc.SEATING_CAPACITY}</span>
              <span>Open since: {loc.OPEN_DATE}</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Select a location to see details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocationKpis({
  locationData,
}: {
  locationData: ReturnType<typeof useLocationData>;
}) {
  const kpis = locationData.kpis;
  if (!kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const growthColor =
    kpis.revenueGrowthDirection === "up"
      ? "text-emerald-600"
      : kpis.revenueGrowthDirection === "down"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Revenue
          </div>
          <div className="text-lg font-semibold">
            ${kpis.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Revenue Growth
          </div>
          <div className={`text-lg font-semibold ${growthColor}`}>
            {kpis.revenueGrowthPct == null
              ? "—"
              : `${kpis.revenueGrowthPct.toFixed(1)}%`}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Avg. Rating
          </div>
          <div className="text-lg font-semibold">
            {kpis.avgRating == null ? "—" : kpis.avgRating.toFixed(1)}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground uppercase">
            Waste Cost
          </div>
          <div className="text-lg font-semibold">
            ${kpis.totalWasteCost.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsTable({
  locationData,
}: {
  locationData: ReturnType<typeof useLocationData>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {locationData.latestReviews.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No reviews in this date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Rating</th>
                  <th className="py-2 pr-2">Customer</th>
                  <th className="py-2 pr-2">Review</th>
                </tr>
              </thead>
              <tbody>
                {locationData.latestReviews.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 align-top text-xs text-muted-foreground">
                      {r.date}
                    </td>
                    <td className="py-2 pr-2 align-top text-xs">
                      {r.rating == null ? "—" : r.rating.toFixed(1)}
                    </td>
                    <td className="py-2 pr-2 align-top text-xs">
                      {r.customerName ?? "Anonymous"}
                    </td>
                    <td className="py-2 pr-2 align-top text-xs max-w-xs">
                      <span className="line-clamp-3">
                        {r.text ?? "No comment"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

