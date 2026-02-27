import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Calendar, Users, ArrowLeft, AlertCircle, Download } from "lucide-react";
import type { LocationDetail, LocationReview, LocationInventorySummary, SalesTimeSeriesData, OrderTypeBreakdown, LocationScoreboard } from "@/lib/queries";
import { getLocationDetail, getLocationReviews, getLocationInventorySummary, getSalesTimeSeries, getSalesBreakdownByOrderType, getLocationScorecard } from "@/lib/queries";
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

export default function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const id = parseInt(locationId || "0");

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [reviews, setReviews] = useState<LocationReview[]>([]);
  const [inventory, setInventory] = useState<LocationInventorySummary[]>([]);
  const [salesTime, setSalesTime] = useState<SalesTimeSeriesData[]>([]);
  const [orderTypes, setOrderTypes] = useState<OrderTypeBreakdown[]>([]);
  const [scorecard, setScorecard] = useState<LocationScoreboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [loc, revs, inv, sales, orders, scores] = await Promise.all([
          getLocationDetail(id),
          getLocationReviews(id, 10),
          getLocationInventorySummary(id),
          getSalesTimeSeries(id, dateRange),
          getSalesBreakdownByOrderType(id, dateRange),
          getLocationScorecard(),
        ]);

        setLocation(loc);
        setReviews(revs);
        setInventory(inv);
        setSalesTime(sales);
        setOrderTypes(orders);
        setScorecard(scores.find((s) => Number(s.LOCATION_ID) === id) || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load location data");
      } finally {
        setLoading(false);
      }
    }
    if (id > 0) fetchData();
  }, [id, dateRange]);

  const totalRevenue = orderTypes.reduce((sum, item) => sum + Number(item.TOTAL_REVENUE), 0);
  const totalOrders = orderTypes.reduce((sum, item) => sum + item.TOTAL_ORDERS, 0);
  const totalWaste = inventory.reduce((sum, item) => sum + item.WASTE_COST_TOTAL, 0);

  function handleExportCSV() {
    const csv = toCSV(salesTime);
    downloadFile(`${location?.NAME?.replace(/\s+/g, '-')}-sales.csv`, csv);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium text-sm">Fetching Location Data...</p>
      </div>
    );
  }

  if (error || !location) return (<div>Error loading location...</div>);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-primary uppercase mr-2">
            Location Intelligence
          </span>
          <button onClick={handleExportCSV} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent pb-1">
              {location.NAME}
            </h1>
            <p className="text-muted-foreground font-medium mt-1">{location.CITY}, {location.STATE}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">STATUS</span>
            <Badge className="px-3 py-1 text-xs" variant={location.IS_ACTIVE ? "default" : "destructive"}>
              {location.IS_ACTIVE ? "Active Store" : "Inactive"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Store Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <InfoRow icon={MapPin} label="Address" value={location.ADDRESS} />
              <InfoRow icon={User} label="Manager" value={location.MANAGER_NAME} />
              <InfoRow icon={Calendar} label="Grand Opening" value={new Date(location.OPEN_DATE).toLocaleDateString()} />
              <InfoRow icon={Users} label="Seating Capacity" value={`${location.SEATING_CAPACITY} seats`} />
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border bg-card flex flex-col justify-center">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-black text-foreground">${scorecard?.TOTAL_REVENUE.toLocaleString() || totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border bg-card flex flex-col justify-center">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Avg Rating</p>
                <p className="text-2xl font-black text-foreground flex items-baseline gap-1">
                  {scorecard && scorecard.AVG_RATING > 0 ? fmtFixed(scorecard.AVG_RATING, 1) : "—"}
                  <span className="text-amber-500 text-xl">★</span>
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border bg-card flex flex-col justify-center">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-black text-foreground">{totalOrders.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-destructive/20 bg-destructive/5 flex flex-col justify-center">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Total Waste
                </p>
                <p className="text-2xl font-black text-destructive">${totalWaste.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
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

        {salesTime.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-6 border-b border-border/50">
                <CardTitle className="text-base font-bold">Gross Sales Trajectory</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="SALE_DATE" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Area type="monotone" dataKey="TOTAL" stroke="var(--chart-1)" strokeWidth={3} fill="var(--chart-1)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-6 border-b border-border/50">
                <CardTitle className="text-base font-bold">Daily Revenue by Order Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={salesTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="SALE_DATE" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                    <Bar dataKey="DINE_IN" stackId="a" fill="var(--chart-1)" name="Dine-In" />
                    <Bar dataKey="TAKEOUT" stackId="a" fill="var(--chart-2)" name="Takeout" />
                    <Bar dataKey="DELIVERY" stackId="a" fill="var(--chart-4)" name="Delivery" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {inventory.length > 0 && (
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold">Inventory Shrinkage Matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="text-left py-3 px-5 font-semibold text-muted-foreground">Category</th>
                        <th className="text-right py-3 px-5 font-semibold text-muted-foreground">Wasted</th>
                        <th className="text-right py-3 px-5 font-semibold text-muted-foreground">Rate</th>
                        <th className="text-right py-3 px-5 font-semibold text-muted-foreground">Lost Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.CATEGORY} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-5 font-medium capitalize text-foreground">{item.CATEGORY.replace("_", " ")}</td>
                          <td className="text-right py-3 px-5 text-muted-foreground">{item.TOTAL_UNITS_WASTED.toLocaleString()} u</td>
                          <td className="text-right py-3 px-5"><Badge variant={item.WASTE_PERCENTAGE > 5 ? "destructive" : "secondary"}>{fmtFixed(item.WASTE_PERCENTAGE, 1)}%</Badge></td>
                          <td className="text-right py-3 px-5 font-semibold text-foreground">${item.WASTE_COST_TOTAL.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reviews.length > 0 ? (
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base font-bold">Latest Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.REVIEW_ID} className="p-5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{review.CUSTOMER_NAME}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(review.REVIEW_DATE).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={Number(review.RATING) >= 4 ? "default" : Number(review.RATING) >= 3 ? "secondary" : "destructive"}>{fmtFixed(review.RATING, 1)} ★</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.REVIEW_TEXT}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="py-12 text-center text-muted-foreground">No customer reviews available yet.</CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string; }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary/10 rounded-md shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}