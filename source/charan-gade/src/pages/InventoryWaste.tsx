import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { LocationWasteSummary, WasteData } from "@/lib/queries";
import { getLocationWasteSummary, getInventoryWaste } from "@/lib/queries";

const WASTE_THRESHOLD = 500; // dollars

export default function InventoryWasteTrackerPage() {
  const [wasteData, setWasteData] = useState<LocationWasteSummary[]>([]);
  const [categoryData, setCategoryData] = useState<WasteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByThreshold, setFilterByThreshold] = useState(false);
  const [sortBy, setSortBy] = useState<"waste" | "trend" | "units">("waste");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [summary, rawWaste] = await Promise.all([
          getLocationWasteSummary(),
          getInventoryWaste(),
        ]);
        setWasteData(summary);
        setCategoryData(rawWaste);
        setError(null);
      } catch (e) {
        console.error("waste fetch error", e);
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const [summary, rawWaste] = await Promise.all([
        getLocationWasteSummary(),
        getInventoryWaste(),
      ]);
      setWasteData(summary);
      setCategoryData(rawWaste);
      setError(null);
    } catch (e) {
      console.error("waste refresh error", e);
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  let displayData = wasteData;

  if (filterByThreshold) {
    displayData = displayData.filter((item) => item.WASTE_ABOVE_THRESHOLD);
  }

  displayData = [...displayData].sort((a, b) => {
    switch (sortBy) {
      case "waste":
        return b.TOTAL_WASTE_COST - a.TOTAL_WASTE_COST;
      case "trend":
        const trendOrder = { improving: 1, stable: 0, declining: -1 };
        return (
          (trendOrder[b.RECENT_TREND as keyof typeof trendOrder] || 0) -
          (trendOrder[a.RECENT_TREND as keyof typeof trendOrder] || 0)
        );
      case "units":
        return b.TOTAL_WASTE_UNITS - a.TOTAL_WASTE_UNITS;
      default:
        return 0;
    }
  });

  const totalWaste = wasteData.reduce((sum, item) => sum + item.TOTAL_WASTE_COST, 0);
  const aboveThresholdCount = wasteData.filter((item) => item.WASTE_ABOVE_THRESHOLD).length;
  const improvingCount = wasteData.filter((item) => item.RECENT_TREND === "improving").length;

  // Aggregate global category waste for the chart
  const globalCategoryMap = categoryData.reduce((acc, curr) => {
    if (!acc[curr.CATEGORY]) acc[curr.CATEGORY] = 0;
    acc[curr.CATEGORY] += curr.TOTAL_WASTE_COST;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(globalCategoryMap)
    .map(key => ({
      name: key.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
      value: globalCategoryMap[key]
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xs text-primary hover:underline font-medium">
          ← Back to Dashboard
        </Link>
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          Inventory Waste Tracker
        </span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--page-waste)]">
            Supply Chain Shrinkage
          </h1>
          <p className="text-muted-foreground mt-2">
            Track waste by location and category. Red flags indicate locations exceeding the recent ${WASTE_THRESHOLD} threshold.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Waste Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalWaste.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all locations</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Recent High Shrink</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {aboveThresholdCount}/{wasteData.length}
              </p>
              <p className="text-xs text-destructive/80 mt-1">Locations exceeding ${WASTE_THRESHOLD} last week</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-500">Improving Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {improvingCount}/{wasteData.length}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80 mt-1">Showing weekly waste reduction</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Chart (Satisfies Spec 03) */}
        {!loading && !error && chartData.length > 0 && (
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-6">
              <CardTitle className="text-base font-bold">Global Waste by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Waste Cost"]} />
                  <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex gap-2">
            {(["waste", "trend", "units"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  sortBy === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilterByThreshold(!filterByThreshold)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filterByThreshold
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {filterByThreshold ? `Showing High Waste (${displayData.length})` : `Show All (${wasteData.length})`}
          </button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="font-semibold text-destructive">Error loading data</p>
              <div className="mt-3">
                <button onClick={refresh} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Retry</button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Loading waste data...</CardContent>
          </Card>
        )}

        {!loading && !error && wasteData.length > 0 && (
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle>Waste Summary by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Location</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Waste Cost</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Units Wasted</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Categories</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Trend (1W)</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((item) => (
                      <tr key={item.LOCATION_ID} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <Link to={`/location/${item.LOCATION_ID}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                            {item.LOCATION_NAME}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.CITY}</p>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">
                          <Badge variant="secondary" className="font-mono text-xs">${item.TOTAL_WASTE_COST.toLocaleString()}</Badge>
                        </td>
                        <td className="text-right py-3 px-4 text-muted-foreground">
                          {item.TOTAL_WASTE_UNITS.toLocaleString()} units
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="outline">{item.CATEGORY_COUNT}</Badge>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.RECENT_TREND === "improving" && <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
                            {item.RECENT_TREND === "declining" && <TrendingDown className="w-4 h-4 text-destructive" />}
                            <span className="text-xs font-medium capitalize">{item.RECENT_TREND}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {item.WASTE_ABOVE_THRESHOLD && (
                            <div className="flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {displayData.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No locations match the selected filter</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}