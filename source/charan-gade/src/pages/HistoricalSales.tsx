import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import type { OrderTypeBreakdown, LocationDetail, SalesTimeSeriesData } from "@/lib/queries";
import { getSalesBreakdownByOrderType, getSalesTimeSeries, getAllLocations } from "@/lib/queries";
import DateFilter from "@/components/DateFilter";

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

export default function HistoricalSalesPage() {
  const [locations, setLocations] = useState<LocationDetail[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [orderTypeData, setOrderTypeData] = useState<OrderTypeBreakdown[]>([]);
  const [salesTime, setSalesTime] = useState<SalesTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const data = await getAllLocations();
        setLocations(data);
        if (data.length > 0) setSelectedLocationId(data[0].LOCATION_ID);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load locations");
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        const [orders, timeSeries] = await Promise.all([
          getSalesBreakdownByOrderType(selectedLocationId || undefined, dateRange),
          selectedLocationId ? getSalesTimeSeries(selectedLocationId, dateRange) : Promise.resolve([])
        ]);
        setOrderTypeData(orders);
        setSalesTime(timeSeries);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load sales data");
      } finally {
        setLoading(false);
      }
    }
    if (locations.length > 0) fetchSalesData();
  }, [selectedLocationId, locations, dateRange]);

  async function refreshAll() {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
      if (data.length > 0) setSelectedLocationId(data[0].LOCATION_ID);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  const selectedLocation = locations.find((l) => l.LOCATION_ID === selectedLocationId);

  const pieData = orderTypeData.map((item) => ({
    name: item.ORDER_TYPE.charAt(0).toUpperCase() + item.ORDER_TYPE.slice(1),
    value: Number(item.TOTAL_REVENUE),
  }));

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  const barData = orderTypeData
    .sort((a, b) => Number(b.TOTAL_REVENUE) - Number(a.TOTAL_REVENUE))
    .map((item) => ({
      name: item.ORDER_TYPE.charAt(0).toUpperCase() + item.ORDER_TYPE.slice(1),
      revenue: Number(item.TOTAL_REVENUE),
      orders: item.TOTAL_ORDERS,
    }));

  function handleExportCSV() {
    const csv = toCSV(salesTime.length > 0 ? salesTime : orderTypeData);
    const locName = selectedLocation?.NAME?.replace(/\s+/g, '-') || 'all';
    downloadFile(`historical-sales-${locName}.csv`, csv);
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-primary uppercase mr-2">
            Historical Sales
          </span>
          <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--page-sales)]">Revenue Analytics</h1>
          <p className="text-muted-foreground mt-2">Sales performance trends by location and order type breakdown.</p>
        </div>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base font-bold">Select Location Filter</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.LOCATION_ID}
                  onClick={() => setSelectedLocationId(loc.LOCATION_ID)}
                  className={`p-2 rounded-md text-sm font-medium transition-all text-left border ${
                    selectedLocationId === loc.LOCATION_ID
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-semibold">{loc.NAME}</div>
                  <div className="text-xs opacity-75">{loc.CITY}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Filter */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base font-bold">Time Period</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DateFilter selectedRange={dateRange} onRangeChange={setDateRange} />
          </CardContent>
        </Card>

        {loading && (
          <Card className="shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium text-sm">Loading sales data...</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && selectedLocation && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">${orderTypeData.reduce((sum, item) => sum + Number(item.TOTAL_REVENUE), 0).toLocaleString()}</p></CardContent>
              </Card>
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{orderTypeData.reduce((sum, item) => sum + item.TOTAL_ORDERS, 0).toLocaleString()}</p></CardContent>
              </Card>
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${fmtFixed(orderTypeData.reduce((sum, item) => sum + Number(item.TOTAL_REVENUE), 0) / (orderTypeData.reduce((sum, item) => sum + item.TOTAL_ORDERS, 0) || NaN), 2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-6"><CardTitle className="text-base font-bold">Sales Performance Over Time</CardTitle></CardHeader>
              <CardContent>
                {salesTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="SALE_DATE" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                      <Area type="monotone" dataKey="TOTAL" stroke="var(--chart-1)" strokeWidth={3} fill="var(--chart-1)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No time-series data available</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader><CardTitle className="text-base font-bold">Revenue by Order Type</CardTitle></CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name }) => `${name}`} outerRadius={80} dataKey="value">
                          {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No sales data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader><CardTitle className="text-base font-bold">Order Volume by Type</CardTitle></CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="orders" fill="var(--chart-2)" name="Orders" radius={[4, 4, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No sales data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}