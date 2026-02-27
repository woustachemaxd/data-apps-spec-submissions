import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, ArrowLeft, Download } from "lucide-react";
import type { LocationWasteSummary, WasteData } from "@/lib/queries";
import { getLocationWasteSummary, getInventoryWaste } from "@/lib/queries";
import DateFilter from "@/components/DateFilter";

const WASTE_THRESHOLD = 500; // dollars

// Safe numeric formatter
const fmtFixed = (v: unknown, digits = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};

// Export helpers
const downloadFile = (filename: string, content: string, mime = "text/csv") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const toCSV = (rows: any[]) => {
  if (!rows || rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((r) => keys.map((k) => {
    const v = r[k];
    if (v === null || v === undefined) return "";
    return typeof v === "string" && v.includes(",") ? `"${v.replace(/"/g, '""')}"` : String(v);
  }).join(","));
  return [header, ...lines].join("\n");
};

export default function InventoryWasteTrackerPage() {
  const [wasteData, setWasteData] = useState<LocationWasteSummary[]>([]);
  const [categoryData, setCategoryData] = useState<WasteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByThreshold, setFilterByThreshold] = useState(false);
  const [sortBy, setSortBy] = useState<"waste" | "trend" | "units">("waste");
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [summary, rawWaste] = await Promise.all([
          getLocationWasteSummary(dateRange),
          getInventoryWaste(dateRange),
        ]);
        setWasteData(summary);
        setCategoryData(rawWaste);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

  async function refresh() {
    try {
      setLoading(true);
      const [summary, rawWaste] = await Promise.all([
        getLocationWasteSummary(dateRange),
        getInventoryWaste(dateRange),
      ]);
      setWasteData(summary);
      setCategoryData(rawWaste);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  let displayData = wasteData;
  if (filterByThreshold) displayData = displayData.filter((item) => item.WASTE_ABOVE_THRESHOLD);

  displayData = [...displayData].sort((a, b) => {
    switch (sortBy) {
      case "waste": return b.TOTAL_WASTE_COST - a.TOTAL_WASTE_COST;
      case "units": return b.TOTAL_WASTE_UNITS - a.TOTAL_WASTE_UNITS;
      case "trend":
        const trendOrder = { improving: 1, stable: 0, declining: -1 };
        return ((trendOrder[b.RECENT_TREND as keyof typeof trendOrder] || 0) - (trendOrder[a.RECENT_TREND as keyof typeof trendOrder] || 0));
      default: return 0;
    }
  });

  const totalWaste = wasteData.reduce((sum, item) => sum + item.TOTAL_WASTE_COST, 0);
  const aboveThresholdCount = wasteData.filter((item) => item.WASTE_ABOVE_THRESHOLD).length;
  const improvingCount = wasteData.filter((item) => item.RECENT_TREND === "improving").length;

  const globalCategoryMap = categoryData.reduce((acc, curr) => {
    if (!acc[curr.CATEGORY]) acc[curr.CATEGORY] = 0;
    acc[curr.CATEGORY] += curr.TOTAL_WASTE_COST;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(globalCategoryMap)
    .map(key => ({ name: key.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()), value: globalCategoryMap[key] }))
    .sort((a, b) => b.value - a.value);

  function handleExportCSV() {
    const csv = toCSV(displayData);
    downloadFile("inventory-waste.csv", csv);
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-primary uppercase mr-2">
            Inventory Waste
          </span>
          <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--page-waste)]">Supply Chain Shrinkage</h1>
          <p className="text-muted-foreground mt-2">Track waste by location and category. Red flags indicate locations exceeding the recent ${WASTE_THRESHOLD} threshold.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Waste Cost</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${totalWaste.toLocaleString()}</p></CardContent>
          </Card>
          <Card className="shadow-sm border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive">Recent High Shrink</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-destructive">{aboveThresholdCount}/{wasteData.length}</p></CardContent>
          </Card>
          <Card className="shadow-sm border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-500">Improving Trend</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{improvingCount}/{wasteData.length}</p></CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base font-bold">Time Period</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DateFilter selectedRange={dateRange} onRangeChange={setDateRange} />
          </CardContent>
        </Card>

        {!loading && !error && chartData.length > 0 && (
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-6 border-b border-border/50">
              <CardTitle className="text-base font-bold">Global Waste by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Waste Cost"]} />
                  <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex gap-2">
            {(["waste", "trend", "units"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  sortBy === option ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFilterByThreshold(!filterByThreshold)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filterByThreshold ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {filterByThreshold ? `Showing High Waste (${displayData.length})` : `Show All (${wasteData.length})`}
          </button>
        </div>

        {loading && (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium text-sm">Loading waste data...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && wasteData.length > 0 && (
          <Card className="shadow-sm border-border">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-base font-bold">Waste Summary by Location</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-5 font-semibold text-muted-foreground">Location</th>
                      <th className="text-right py-3 px-5 font-semibold text-muted-foreground">Waste Cost</th>
                      <th className="text-right py-3 px-5 font-semibold text-muted-foreground">Units Wasted</th>
                      <th className="text-center py-3 px-5 font-semibold text-muted-foreground">Categories</th>
                      <th className="text-center py-3 px-5 font-semibold text-muted-foreground">Trend (1W)</th>
                      <th className="text-center py-3 px-5 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.map((item) => (
                      <tr key={item.LOCATION_ID} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-5">
                          <Link to={`/location/${item.LOCATION_ID}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                            {item.LOCATION_NAME}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.CITY}</p>
                        </td>
                        <td className="text-right py-3 px-5 font-medium text-foreground">
                          ${item.TOTAL_WASTE_COST.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-5 text-muted-foreground">{item.TOTAL_WASTE_UNITS.toLocaleString()} u</td>
                        <td className="text-center py-3 px-5"><Badge variant="outline">{item.CATEGORY_COUNT}</Badge></td>
                        <td className="text-center py-3 px-5">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.RECENT_TREND === "improving" && <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
                            {item.RECENT_TREND === "declining" && <TrendingDown className="w-4 h-4 text-destructive" />}
                            <span className="text-xs font-medium capitalize">{item.RECENT_TREND}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-5">
                          {item.WASTE_ABOVE_THRESHOLD && (
                            <div className="flex items-center justify-center"><AlertCircle className="w-4 h-4 text-destructive" /></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}