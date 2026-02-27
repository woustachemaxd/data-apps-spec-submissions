import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { querySnowflake } from "@/lib/snowflake";
import { Button } from "@/components/ui/button";
import LoadingState from "@/components/LoadingState";
import ChartDownloadButton from "@/components/ChartDownloadButton";

type Period = 30 | 60 | 90;

type SalesRow = {
  SALE_DATE: string;
  ORDER_TYPE: "dine-in" | "takeout" | "delivery";
  REVENUE: number;
  NUM_ORDERS: number;
  AVG_ORDER_VALUE: number;
};

type ReviewRow = {
  REVIEW_DATE: string;
  CUSTOMER_NAME: string;
  REVIEW_TEXT: string;
  RATING: number;
};

type InventoryRow = {
  RECORD_DATE: string;
  CATEGORY: string;
  UNITS_RECEIVED: number;
  UNITS_WASTED: number;
  WASTE_COST: number;
};

type LocationMeta = {
  MANAGER_NAME: string;
  ADDRESS: string;
  OPEN_DATE: string;
  SEATING_CAPACITY: number;
  IS_ACTIVE: boolean;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

function normalizeDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return shiftDays("1970-01-01", Math.trunc(value));
  }
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return shiftDays("1970-01-01", Number(raw));
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : isoFromDate(parsed);
}

function formatUiDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export default function LocationDrillDown({
  location,
  onBack: _onBack,
}: {
  location: { LOCATION_ID: number; NAME: string; CITY: string; STATE: string };
  onBack?: () => void;
}) {
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [meta, setMeta] = useState<LocationMeta | null>(null);

  useEffect(() => {
    async function fetchLocationData() {
      setLoading(true);
      setError(null);
      try {
        const [sales, reviews, inventory, locationMeta] = await Promise.all([
          querySnowflake<any>(`
            SELECT SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS, AVG_ORDER_VALUE
            FROM DAILY_SALES
            WHERE LOCATION_ID = ${location.LOCATION_ID}
            ORDER BY SALE_DATE
          `),
          querySnowflake<any>(`
            SELECT REVIEW_DATE, CUSTOMER_NAME, REVIEW_TEXT, RATING
            FROM CUSTOMER_REVIEWS
            WHERE LOCATION_ID = ${location.LOCATION_ID}
            ORDER BY REVIEW_DATE DESC
            LIMIT 25
          `),
          querySnowflake<any>(`
            SELECT RECORD_DATE, CATEGORY, UNITS_RECEIVED, UNITS_WASTED, WASTE_COST
            FROM INVENTORY
            WHERE LOCATION_ID = ${location.LOCATION_ID}
            ORDER BY RECORD_DATE
          `),
          querySnowflake<any>(`
            SELECT MANAGER_NAME, ADDRESS, OPEN_DATE, SEATING_CAPACITY, IS_ACTIVE
            FROM LOCATIONS
            WHERE LOCATION_ID = ${location.LOCATION_ID}
          `),
        ]);

        setSalesRows(
          sales.map((r: any) => ({
            SALE_DATE: normalizeDate(r.SALE_DATE),
            ORDER_TYPE: String(r.ORDER_TYPE) as SalesRow["ORDER_TYPE"],
            REVENUE: toNum(r.REVENUE),
            NUM_ORDERS: toNum(r.NUM_ORDERS),
            AVG_ORDER_VALUE: toNum(r.AVG_ORDER_VALUE),
          }))
        );

        setReviewRows(
          reviews.map((r: any) => ({
            REVIEW_DATE: normalizeDate(r.REVIEW_DATE),
            CUSTOMER_NAME: String(r.CUSTOMER_NAME),
            REVIEW_TEXT: String(r.REVIEW_TEXT),
            RATING: toNum(r.RATING),
          }))
        );

        setInventoryRows(
          inventory.map((r: any) => ({
            RECORD_DATE: normalizeDate(r.RECORD_DATE),
            CATEGORY: String(r.CATEGORY),
            UNITS_RECEIVED: toNum(r.UNITS_RECEIVED),
            UNITS_WASTED: toNum(r.UNITS_WASTED),
            WASTE_COST: toNum(r.WASTE_COST),
          }))
        );

        const metaRow = locationMeta[0];
        setMeta(
          metaRow
            ? {
                MANAGER_NAME: String(metaRow.MANAGER_NAME),
                ADDRESS: String(metaRow.ADDRESS),
                OPEN_DATE: normalizeDate(metaRow.OPEN_DATE),
                SEATING_CAPACITY: toNum(metaRow.SEATING_CAPACITY),
                IS_ACTIVE: String(metaRow.IS_ACTIVE).toLowerCase() === "true",
              }
            : null
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load location details.");
      } finally {
        setLoading(false);
      }
    }
    fetchLocationData();
  }, [location.LOCATION_ID]);

  const salesDateBounds = useMemo(() => {
    if (!salesRows.length) return { min: "", max: "" };
    const all = salesRows.map((r) => r.SALE_DATE).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return { min: all[0], max: all[all.length - 1] };
  }, [salesRows]);

  const filteredSales = useMemo(() => {
    if (!salesDateBounds.max) return [];
    const start = shiftDays(salesDateBounds.max, -(period - 1));
    return salesRows.filter((r) => r.SALE_DATE >= start && r.SALE_DATE <= salesDateBounds.max);
  }, [salesRows, period, salesDateBounds.max]);

  const filteredInventory = useMemo(() => {
    if (!salesDateBounds.max) return [];
    const start = shiftDays(salesDateBounds.max, -(period - 1));
    return inventoryRows.filter((r) => r.RECORD_DATE >= start && r.RECORD_DATE <= salesDateBounds.max);
  }, [inventoryRows, period, salesDateBounds.max]);

  const kpis = useMemo(() => {
    const totalRevenue = filteredSales.reduce((a, b) => a + b.REVENUE, 0);
    const totalOrders = filteredSales.reduce((a, b) => a + b.NUM_ORDERS, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgRating =
      reviewRows.length > 0 ? reviewRows.reduce((a, b) => a + b.RATING, 0) / reviewRows.length : 0;
    const wasteCost = filteredInventory.reduce((a, b) => a + b.WASTE_COST, 0);
    return { totalRevenue, totalOrders, avgOrderValue, avgRating, wasteCost };
  }, [filteredSales, filteredInventory, reviewRows]);

  const salesTrendData = useMemo(() => {
    const byDate = new Map<string, { revenue: number; orders: number }>();
    filteredSales.forEach((r) => {
      const curr = byDate.get(r.SALE_DATE) ?? { revenue: 0, orders: 0 };
      curr.revenue += r.REVENUE;
      curr.orders += r.NUM_ORDERS;
      byDate.set(r.SALE_DATE, curr);
    });

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: formatUiDate(date),
        revenue: Math.round(v.revenue),
        orders: v.orders,
      }));
  }, [filteredSales]);

  const orderTypeMix = useMemo(() => {
    const map = new Map<string, number>();
    filteredSales.forEach((r) => {
      map.set(r.ORDER_TYPE, (map.get(r.ORDER_TYPE) ?? 0) + r.REVENUE);
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [filteredSales]);

  const wasteByCategory = useMemo(() => {
    const map = new Map<string, { units: number; cost: number }>();
    filteredInventory.forEach((r) => {
      const curr = map.get(r.CATEGORY) ?? { units: 0, cost: 0 };
      curr.units += r.UNITS_WASTED;
      curr.cost += r.WASTE_COST;
      map.set(r.CATEGORY, curr);
    });
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, units: v.units, cost: Math.round(v.cost) }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredInventory]);

  const wasteTrend = useMemo(() => {
    const map = new Map<string, number>();
    filteredInventory.forEach((r) => {
      map.set(r.RECORD_DATE, (map.get(r.RECORD_DATE) ?? 0) + r.WASTE_COST);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date: formatUiDate(date), wasteCost: Math.round(value) }));
  }, [filteredInventory]);

  const ratingDistribution = useMemo(() => {
    const bins = [1, 2, 3, 4, 5].map((star) => ({ star, count: 0 }));
    reviewRows.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.RATING)));
      const idx = star - 1;
      bins[idx].count += 1;
    });
    return bins;
  }, [reviewRows]);

  const pieColors = ["#38bdf8", "#3b82f6", "#a855f7"];
  const mapQuery = encodeURIComponent(
    `${meta?.ADDRESS ?? ""}, ${location.CITY}, ${location.STATE}`
  );
  const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  if (loading) {
    return <LoadingState label="Loading location insights..." variant="panel" />;
  }

  if (error) {
    return (
      <div className="p-16">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8">
          <h3 className="text-lg font-black text-rose-400 uppercase">Failed to load details</h3>
          <p className="text-sm text-[var(--text-muted)] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pt-20 sm:p-12 sm:pt-20 lg:p-14 lg:pt-20 space-y-8 drill-entrance">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between drill-stagger-1">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-[var(--text-main)]">{location.NAME}</h2>
          <p className="mt-2 text-sm font-bold text-[var(--text-muted)]">
            {location.CITY}, {location.STATE} • {meta?.MANAGER_NAME ?? "Manager unavailable"}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{meta?.ADDRESS ?? "Address unavailable"}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-1">
          {[30, 60, 90].map((d) => (
            <Button
              key={d}
              type="button"
              variant="ghost"
              onClick={() => setPeriod(d as Period)}
              className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest ${
                period === d ? "bg-primary text-white" : "text-[var(--text-muted)]"
              }`}
            >
              {d}D
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5 drill-stagger-2">
        <StatCard label="Total Revenue" value={formatMoney(kpis.totalRevenue)} icon="payments" />
        <StatCard label="Orders" value={kpis.totalOrders.toLocaleString()} icon="shopping_bag" />
        <StatCard label="Avg Rating" value={kpis.avgRating.toFixed(2)} icon="star" />
        <StatCard label="Avg Order Value" value={formatMoney(kpis.avgOrderValue)} icon="receipt_long" />
        <StatCard label="Waste Cost" value={formatMoney(kpis.wasteCost)} icon="delete_outline" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 drill-stagger-3">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Revenue & Order Demand</h3>
            <ChartDownloadButton chartId="location-revenue-order-demand" fileName="location-revenue-order-demand" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Dual-axis daily performance
          </p>
          <div id="location-revenue-order-demand" className="h-[320px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(59,130,246,0.45)",
                    borderRadius: "16px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar yAxisId="right" dataKey="orders" fill="#22d3ee" opacity={0.35} radius={[6, 6, 0, 0]} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#a855f7" fill="#a855f733" strokeWidth={2.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Order Type Mix</h3>
            <ChartDownloadButton chartId="location-order-type-mix" fileName="location-order-type-mix" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Revenue share by channel
          </p>
          <div id="location-order-type-mix" className="h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderTypeMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={85} paddingAngle={4}>
                  {orderTypeMix.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    `$${Math.round(Number(value ?? 0)).toLocaleString()}`
                  }
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(168,85,247,0.45)",
                    borderRadius: "16px",
                    color: "#f5f3ff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {orderTypeMix.map((row, idx) => (
              <div key={row.name} className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }} />
                  <span className="font-black uppercase text-[var(--text-main)]">{row.name}</span>
                </div>
                <span className="font-black text-[var(--text-muted)]">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 drill-stagger-4">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Waste by Category</h3>
            <ChartDownloadButton chartId="location-waste-by-category" fileName="location-waste-by-category" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Cost concentration and units wasted
          </p>
          <div id="location-waste-by-category" className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteByCategory} layout="vertical" margin={{ left: 20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="category" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} width={90} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    if (name === "cost") return [formatMoney(Number(value ?? 0)), "Cost"];
                    return [Math.round(Number(value ?? 0)), "Units"];
                  }}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(239,68,68,0.45)",
                    borderRadius: "16px",
                    color: "#fee2e2",
                  }}
                />
                <Bar dataKey="cost" fill="#ef4444" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Weekly Waste Trend</h3>
            <ChartDownloadButton chartId="location-weekly-waste-trend" fileName="location-weekly-waste-trend" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Track drift before it becomes loss
          </p>
          <div id="location-weekly-waste-trend" className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wasteTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined) => formatMoney(Number(value ?? 0))}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(251,146,60,0.45)",
                    borderRadius: "16px",
                    color: "#ffedd5",
                  }}
                />
                <Area type="monotone" dataKey="wasteCost" stroke="#f97316" fill="#f9731633" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 drill-stagger-5">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Rating Distribution</h3>
            <ChartDownloadButton chartId="location-rating-distribution" fileName="location-rating-distribution" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Quality signal across recent reviews
          </p>
          <div id="location-rating-distribution" className="h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="star" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined) => [Math.round(Number(value ?? 0)), "Reviews"]}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(34,197,94,0.45)",
                    borderRadius: "16px",
                    color: "#dcfce7",
                  }}
                />
                <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Recent Reviews</h3>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Last {reviewRows.length} reviews
          </p>
          <div className="mt-4 space-y-3 max-h-[280px] overflow-y-auto no-scrollbar">
            {reviewRows.slice(0, 8).map((r, i) => (
              <div key={`${r.CUSTOMER_NAME}-${i}`} className="rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-[var(--text-main)]">{r.CUSTOMER_NAME}</p>
                  <span className="text-xs font-black text-amber-400">★ {r.RATING.toFixed(1)}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">{r.REVIEW_TEXT}</p>
                <p className="text-[11px] font-bold text-[var(--text-muted)] mt-2 uppercase">{r.REVIEW_DATE}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 drill-stagger-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Location Map</h3>
            <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
              Address visibility and on-ground context
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              <span className="material-symbols-outlined text-sm">person</span>
              {meta?.MANAGER_NAME ?? "Manager N/A"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta?.IS_ACTIVE ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
              <span className="material-symbols-outlined text-sm">radio_button_checked</span>
              {meta?.IS_ACTIVE ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)]">
            <iframe
              title={`${location.NAME} map`}
              src={mapSrc}
              loading="lazy"
              className="h-[320px] w-full"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)] p-4 space-y-4">
            <Detail label="Address" value={meta?.ADDRESS ?? "N/A"} />
            <Detail label="City / State" value={`${location.CITY}, ${location.STATE}`} />
            <Detail label="Seating Capacity" value={`${meta?.SEATING_CAPACITY ?? 0} seats`} />
            <Detail label="Open Date" value={meta?.OPEN_DATE ?? "N/A"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tighter text-[var(--text-main)]">{value}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-lg font-black ${valueClass ?? "text-[var(--text-main)]"}`}>{value}</p>
    </div>
  );
}
