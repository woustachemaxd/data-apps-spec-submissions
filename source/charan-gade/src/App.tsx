import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, AlertCircle, Trash2, BarChart3, Moon, Sun, Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Legend
} from "recharts";

import type {
  LocationScoreboard,
  LocationWasteSummary,
} from "@/lib/queries";
import {
  getLocationScorecard,
  getLocationWasteSummary,
} from "@/lib/queries";

// Safe numeric formatter
const fmtFixed = (v: unknown, digits = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};

// Export helpers (kept for Insight Modal functionality)
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

export default function App() {
  const [scorecard, setScorecard] = useState<LocationScoreboard[]>([]);
  const [waste, setWaste] = useState<LocationWasteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [surpriseText, setSurpriseText] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("snowcone_dark");
      if (stored === "1") {
        document.documentElement.classList.add("dark");
        setDark(true);
      }
    } catch (e) {}

    async function fetchData() {
      try {
        setLoading(true);
        const [scores, wasteData] = await Promise.all([
          getLocationScorecard(),
          getLocationWasteSummary(),
        ]);
        setScorecard(scores);
        setWaste(wasteData);
        setError(null);
      } catch (e) {
        console.error("dashboard fetch error", e);
        setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("snowcone_dark", "1");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("snowcone_dark");
    }
  }

  function handleExportCSV(type: "scorecard" | "waste") {
    const rows = type === "scorecard" ? scorecard : waste;
    const csv = toCSV(rows as any[]);
    downloadFile(`snowcone-${type}-report.csv`, csv, "text/csv;charset=utf-8;");
  }

  function surpriseUs() {
    if (!scorecard || scorecard.length === 0) return;
    const highestRevenue = scorecard.reduce((a, b) => (a.TOTAL_REVENUE > b.TOTAL_REVENUE ? a : b));
    const lowestRating = scorecard.reduce((a, b) => (a.AVG_RATING < b.AVG_RATING ? a : b));
    const highWaste = waste && waste.length > 0 ? waste.reduce((a, b) => (a.TOTAL_WASTE_COST > b.TOTAL_WASTE_COST ? a : b)) : null;
    const tips = [] as string[];
    tips.push(`Star Performer: ${highestRevenue.NAME} is leading the chain with $${highestRevenue.TOTAL_REVENUE.toLocaleString()} in revenue.`);
    if (highWaste) tips.push(`Action Required: ${highWaste.LOCATION_NAME} is experiencing high inventory shrink ($${highWaste.TOTAL_WASTE_COST.toLocaleString()} lost).`);
    tips.push(`Customer Alert: Reviews for ${lowestRating.NAME} have dropped to ${fmtFixed(lowestRating.AVG_RATING,1)}★. Consider a manager check-in.`);
    const pick = tips[Math.floor(Math.random() * tips.length)];
    setSurpriseText(pick);
    setSurpriseOpen(true);
  }

  async function refreshDashboard() {
    try {
      setLoading(true);
      const [scores, wasteData] = await Promise.all([
        getLocationScorecard(),
        getLocationWasteSummary(),
      ]);
      setScorecard(scores);
      setWaste(wasteData);
      setError(null);
    } catch (e) {
      console.error("refresh error", e);
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  const revenueChartData = scorecard
    .sort((a, b) => b.TOTAL_REVENUE - a.TOTAL_REVENUE)
    .slice(0, 5)
    .map((loc) => ({ name: loc.NAME, revenue: loc.TOTAL_REVENUE }));

  const wasteChartData = waste
    .sort((a, b) => b.TOTAL_WASTE_COST - a.TOTAL_WASTE_COST)
    .slice(0, 5)
    .map((w) => ({ name: w.LOCATION_NAME, cost: w.TOTAL_WASTE_COST, units: w.TOTAL_WASTE_UNITS }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm tracking-widest text-primary font-bold uppercase">
            ❄️ Snowcone Warehouse
          </Link>
          <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground border-l pl-4 border-border">
            Executive Command Center
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-medium">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => surpriseUs()} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-bold shadow-sm">Insights ✨</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="space-y-3">
          <p className="text-xs tracking-widest text-primary font-bold uppercase">Real-Time Intelligence</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent pb-1">
            Operations Dashboard
          </h1>
          <p className="text-muted-foreground md:text-lg max-w-2xl leading-relaxed">
            Monitor chain performance across Texas. Instantly track revenue, analyze satisfaction, and identify supply chain waste.
          </p>
        </div>

        {/* 4 Navigation Cards */}
        {!loading && !error && scorecard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/scorecard" className="group block h-full">
              <Card style={{ backgroundColor: 'var(--card-1-bg)' }} className="h-full border-none shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5 duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--card-1-text)' }}>Store Matrix</CardTitle>
                      <p className="text-xs mt-1 opacity-80" style={{ color: 'var(--card-1-text)' }}>Rank locations by health.</p>
                    </div>
                    <BarChart3 className="w-5 h-5 opacity-80" style={{ color: 'var(--card-1-text)' }} />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--card-1-text)' }}>
                    Open Matrix <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/sales" className="group block h-full">
              <Card style={{ backgroundColor: 'var(--card-2-bg)' }} className="h-full border-none shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5 duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--card-2-text)' }}>Revenue Analytics</CardTitle>
                      <p className="text-xs mt-1 opacity-80" style={{ color: 'var(--card-2-text)' }}>Order type & sales trends.</p>
                    </div>
                    <TrendingUp className="w-5 h-5 opacity-80" style={{ color: 'var(--card-2-text)' }} />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--card-2-text)' }}>
                    View Trends <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/waste" className="group block h-full">
              <Card style={{ backgroundColor: 'var(--card-3-bg)' }} className="h-full border-none shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5 duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--card-3-text)' }}>Inventory Waste</CardTitle>
                      <p className="text-xs mt-1 opacity-80" style={{ color: 'var(--card-3-text)' }}>Track supply chain shrinkage.</p>
                    </div>
                    <Trash2 className="w-5 h-5 opacity-80" style={{ color: 'var(--card-3-text)' }} />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--card-3-text)' }}>
                    Track Waste <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* NEW: Top Performers Card */}
            <Link to="/scorecard" className="group block h-full">
              <Card style={{ backgroundColor: 'var(--card-4-bg)' }} className="h-full border-none shadow-sm hover:shadow-md transition-all group-hover:-translate-y-0.5 duration-200">
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" style={{ color: 'var(--card-4-text)' }}>Top Performers</CardTitle>
                      <p className="text-xs mt-1 opacity-80" style={{ color: 'var(--card-4-text)' }}>Chain leaders by gross revenue.</p>
                    </div>
                    <Trophy className="w-5 h-5 opacity-80" style={{ color: 'var(--card-4-text)' }} />
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm" style={{ color: 'var(--card-4-text)' }}>
                    View Leaders <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Mini KPI Stats */}
        {!loading && !error && scorecard.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card className="shadow-sm border-border/50 bg-card">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Active Locations</p>
                <p className="text-3xl font-black text-foreground">{scorecard.length}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50 bg-card">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Gross Revenue</p>
                <p className="text-3xl font-black text-foreground">${scorecard.reduce((sum, loc) => sum + loc.TOTAL_REVENUE, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/50 bg-card">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Avg Satisfaction</p>
                <p className="text-3xl font-black text-foreground flex items-baseline gap-1">
                  {fmtFixed(scorecard.reduce((sum, loc) => sum + Number(loc.AVG_RATING), 0) / scorecard.length, 2)}
                  <span className="text-yellow-500 text-2xl">★</span>
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Needs Attention
                </p>
                <p className="text-3xl font-black text-destructive">
                  {scorecard.filter((loc) => loc.AVG_RATING < 3.5 || loc.REVENUE_TREND === 'declining').length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {!loading && !error && revenueChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-base font-bold">Top Revenue Generators</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-6">
                <CardTitle className="text-base font-bold">Waste Impact vs Units Lost</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={wasteChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="cost" name="Cost ($)" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={45} />
                    <Line yAxisId="right" type="monotone" dataKey="units" name="Units Wasted" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-sm">Syncing latest data...</p>
          </div>
        )}
      </main>

      {surpriseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground p-8 rounded-xl shadow-2xl max-w-md w-full border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Executive Insight</h3>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">{surpriseText}</p>
            <div className="mt-8 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors" onClick={() => setSurpriseOpen(false)}>Dismiss</button>
              <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors" onClick={() => { setSurpriseOpen(false); handleExportCSV("scorecard"); }}>Generate Report</button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-border/50 bg-card px-6 py-8 text-center mt-auto">
        <p className="text-sm font-semibold text-foreground">Snowcone Warehouse Challenge</p>
        <p className="text-xs text-muted-foreground mt-1">Real-time Operations Command Center • Built by Data Mavericks</p>
      </footer>
    </div>
  );
}