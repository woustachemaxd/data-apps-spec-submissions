import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  OrderTypeBreakdown,
  LocationDetail,
  SalesTimeSeriesData,
} from "@/lib/queries";
import {
  getSalesBreakdownByOrderType,
  getSalesTimeSeries,
  getAllLocations,
} from "@/lib/queries";

// Safe numeric formatter
const fmtFixed = (v: unknown, digits = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};

export default function HistoricalSalesPage() {
  const [locations, setLocations] = useState<LocationDetail[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [orderTypeData, setOrderTypeData] = useState<OrderTypeBreakdown[]>([]);
  const [salesTime, setSalesTime] = useState<SalesTimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all locations on mount
  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const data = await getAllLocations();
        setLocations(data);
        if (data.length > 0) {
          setSelectedLocationId(data[0].LOCATION_ID);
        }
        setError(null);
      } catch (e) {
        console.error("fetchLocations error", e);
        setError(e instanceof Error ? e.message : "Failed to load locations");
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  // Fetch order type and time series data when location changes
  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        const [orders, timeSeries] = await Promise.all([
          getSalesBreakdownByOrderType(selectedLocationId || undefined),
          selectedLocationId ? getSalesTimeSeries(selectedLocationId) : Promise.resolve([])
        ]);
        setOrderTypeData(orders);
        setSalesTime(timeSeries);
      } catch (e) {
        console.error("sales fetch error", e);
        setError(e instanceof Error ? e.message : "Failed to load sales data");
      } finally {
        setLoading(false);
      }
    }
    if (locations.length > 0) {
      fetchSalesData();
    }
  }, [selectedLocationId, locations]);

  async function refreshAll() {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
      if (data.length > 0) setSelectedLocationId(data[0].LOCATION_ID);
      setError(null);
    } catch (e) {
      console.error("refreshAll error", e);
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  const selectedLocation = locations.find((l) => l.LOCATION_ID === selectedLocationId);

  // Prepare pie chart data
  const pieData = orderTypeData.map((item) => ({
    name: item.ORDER_TYPE.charAt(0).toUpperCase() + item.ORDER_TYPE.slice(1),
    value: Number(item.TOTAL_REVENUE),
  }));

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

  // Prepare bar chart data
  const barData = orderTypeData
    .sort((a, b) => Number(b.TOTAL_REVENUE) - Number(a.TOTAL_REVENUE))
    .map((item) => ({
      name: item.ORDER_TYPE.charAt(0).toUpperCase() + item.ORDER_TYPE.slice(1),
      revenue: Number(item.TOTAL_REVENUE),
      orders: item.TOTAL_ORDERS,
    }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xs text-primary hover:underline font-medium">
          ← Back to Dashboard
        </Link>
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          Historical Sales View
        </span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--page-sales)]">
            Revenue Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Sales performance trends by location and order type breakdown.
          </p>
        </div>

        {/* Location Selector */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select Location Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.LOCATION_ID}
                  onClick={() => setSelectedLocationId(loc.LOCATION_ID)}
                  className={`p-2 rounded-md text-sm font-medium transition-all text-left border ${
                    selectedLocationId === loc.LOCATION_ID
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  <div className="font-semibold">{loc.NAME}</div>
                  <div className="text-xs opacity-75">{loc.CITY}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="font-semibold text-destructive">Error loading data</p>
              <p className="text-sm text-muted-foreground mt-1">There was a problem loading sales data. Try refreshing.</p>
              <div className="mt-3">
                <button onClick={refreshAll} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Retry</button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading sales data...
            </CardContent>
          </Card>
        )}

        {!loading && !error && locations.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">No locations available. Confirm your data and click refresh.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && selectedLocation && (
          <>
            {/* Quick Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${orderTypeData.reduce((sum, item) => sum + Number(item.TOTAL_REVENUE), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {orderTypeData.reduce((sum, item) => sum + item.TOTAL_ORDERS, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    ${fmtFixed(
                      orderTypeData.reduce((sum, item) => sum + Number(item.TOTAL_REVENUE), 0) /
                        (orderTypeData.reduce((sum, item) => sum + item.TOTAL_ORDERS, 0) || NaN),
                      2
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Chart */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-6">
                <CardTitle className="text-base font-bold">Sales Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {salesTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesTime} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="SALE_DATE" 
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                        tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10} 
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                        tickFormatter={(v) => `$${v/1000}k`} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        cursor={{fill: 'var(--muted)'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} 
                        labelFormatter={(v) => new Date(v).toLocaleDateString()} 
                      />
                      <Area type="monotone" dataKey="TOTAL" stroke="var(--chart-1)" strokeWidth={3} fill="var(--chart-1)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No time-series data available</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle className="text-base">Revenue by Order Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No sales data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle className="text-base">Order Volume by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
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