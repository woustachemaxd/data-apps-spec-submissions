import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { querySnowflake } from "@/lib/snowflake";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingState from "@/components/LoadingState";
import DatePickerField from "@/components/DatePickerField";
import ChartDownloadButton from "@/components/ChartDownloadButton";

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

type SalesRow = {
  LOCATION_ID: number;
  SALE_DATE: string;
  ORDER_TYPE: "dine-in" | "takeout" | "delivery";
  REVENUE: number;
  NUM_ORDERS: number;
  AVG_ORDER_VALUE: number;
};

type ReviewRow = {
  LOCATION_ID: number;
  REVIEW_DATE: string;
  RATING: number;
};

type LocationRow = {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
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
  if (typeof value === "number" && Number.isFinite(value)) return shiftDays("1970-01-01", Math.trunc(value));
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d+$/.test(raw)) return shiftDays("1970-01-01", Number(raw));
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : isoFromDate(parsed);
}

function clampDate(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function formatUiDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatDelta(delta: number | null): string {
  if (delta === null) return "n/a";
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export default function SalesAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);

  const [preset, setPreset] = useState<Preset>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [locRows, salesRows, reviewRows] = await Promise.all([
          querySnowflake<any>(`
            SELECT LOCATION_ID, NAME, CITY
            FROM LOCATIONS
            WHERE IS_ACTIVE = TRUE
            ORDER BY LOCATION_ID
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS, AVG_ORDER_VALUE
            FROM DAILY_SALES
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, REVIEW_DATE, RATING
            FROM CUSTOMER_REVIEWS
          `),
        ]);

        setLocations(
          locRows.map((r: any) => ({
            LOCATION_ID: toNum(r.LOCATION_ID),
            NAME: String(r.NAME),
            CITY: String(r.CITY),
          }))
        );

        const salesParsed = salesRows.map((r: any) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          SALE_DATE: normalizeDate(r.SALE_DATE),
          ORDER_TYPE: String(r.ORDER_TYPE) as SalesRow["ORDER_TYPE"],
          REVENUE: toNum(r.REVENUE),
          NUM_ORDERS: toNum(r.NUM_ORDERS),
          AVG_ORDER_VALUE: toNum(r.AVG_ORDER_VALUE),
        }));
        setSales(salesParsed);

        setReviews(
          reviewRows.map((r: any) => ({
            LOCATION_ID: toNum(r.LOCATION_ID),
            REVIEW_DATE: normalizeDate(r.REVIEW_DATE),
            RATING: toNum(r.RATING),
          }))
        );

        const allDates = salesParsed.map((r) => r.SALE_DATE).filter(Boolean).sort((a, b) => a.localeCompare(b));
        const max = allDates[allDates.length - 1];
        setEndDate(max);
        setStartDate(shiftDays(max, -29));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load sales analytics.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const locationMap = useMemo(() => {
    const map = new Map<number, LocationRow>();
    locations.forEach((l) => map.set(l.LOCATION_ID, l));
    return map;
  }, [locations]);

  const bounds = useMemo(() => {
    if (!sales.length) return { min: "", max: "" };
    const all = sales.map((s) => s.SALE_DATE).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return { min: all[0], max: all[all.length - 1] };
  }, [sales]);

  useEffect(() => {
    if (!bounds.max || !bounds.min) return;
    if (preset === "custom") return;
    if (preset === "all") {
      setStartDate(bounds.min);
      setEndDate(bounds.max);
      return;
    }
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    setEndDate(bounds.max);
    setStartDate(clampDate(shiftDays(bounds.max, -(days - 1)), bounds.min, bounds.max));
  }, [preset, bounds.max, bounds.min]);

  const cityOptions = useMemo(() => {
    const set = new Set(locations.map((l) => l.CITY));
    return ["all", ...Array.from(set).sort()];
  }, [locations]);

  const filtered = useMemo(() => {
    const safeStart = clampDate(startDate || bounds.min, bounds.min, bounds.max);
    const safeEnd = clampDate(endDate || bounds.max, bounds.min, bounds.max);

    const selectedLocationIds = new Set(
      locations
        .filter((l) => cityFilter === "all" || l.CITY === cityFilter)
        .map((l) => l.LOCATION_ID)
    );

    const salesFiltered = sales.filter(
      (s) =>
        selectedLocationIds.has(s.LOCATION_ID) &&
        s.SALE_DATE >= safeStart &&
        s.SALE_DATE <= safeEnd &&
        (orderTypeFilter === "all" || s.ORDER_TYPE === orderTypeFilter)
    );

    const reviewFiltered = reviews.filter(
      (r) =>
        selectedLocationIds.has(r.LOCATION_ID) &&
        r.REVIEW_DATE >= safeStart &&
        r.REVIEW_DATE <= safeEnd
    );

    return { salesFiltered, reviewFiltered, safeStart, safeEnd, selectedLocationIds };
  }, [sales, reviews, locations, cityFilter, orderTypeFilter, startDate, endDate, bounds.min, bounds.max]);

  const previousWindow = useMemo(() => {
    if (!filtered.safeStart || !filtered.safeEnd) return null;
    const days =
      Math.round(
        (new Date(`${filtered.safeEnd}T00:00:00`).getTime() -
          new Date(`${filtered.safeStart}T00:00:00`).getTime()) /
          86400000
      ) + 1;
    const prevEnd = shiftDays(filtered.safeStart, -1);
    const prevStart = shiftDays(prevEnd, -(days - 1));
    if (prevEnd < bounds.min) return null;
    return {
      start: clampDate(prevStart, bounds.min, bounds.max),
      end: clampDate(prevEnd, bounds.min, bounds.max),
    };
  }, [filtered.safeStart, filtered.safeEnd, bounds.min, bounds.max]);

  const kpis = useMemo(() => {
    const totalRevenue = filtered.salesFiltered.reduce((a, b) => a + b.REVENUE, 0);
    const totalOrders = filtered.salesFiltered.reduce((a, b) => a + b.NUM_ORDERS, 0);
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgRating =
      filtered.reviewFiltered.length > 0
        ? filtered.reviewFiltered.reduce((a, b) => a + b.RATING, 0) / filtered.reviewFiltered.length
        : 0;

    let prevRevenue = 0;
    if (previousWindow) {
      prevRevenue = sales
        .filter(
          (s) =>
            filtered.selectedLocationIds.has(s.LOCATION_ID) &&
            s.SALE_DATE >= previousWindow.start &&
            s.SALE_DATE <= previousWindow.end &&
            (orderTypeFilter === "all" || s.ORDER_TYPE === orderTypeFilter)
        )
        .reduce((a, b) => a + b.REVENUE, 0);
    }

    return { totalRevenue, totalOrders, aov, avgRating, revenueDelta: pctChange(totalRevenue, prevRevenue) };
  }, [filtered, previousWindow, sales, orderTypeFilter]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, { revenue: number; orders: number }>();
    filtered.salesFiltered.forEach((s) => {
      const curr = byDate.get(s.SALE_DATE) ?? { revenue: 0, orders: 0 };
      curr.revenue += s.REVENUE;
      curr.orders += s.NUM_ORDERS;
      byDate.set(s.SALE_DATE, curr);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: formatUiDate(date), revenue: Math.round(v.revenue), orders: v.orders }));
  }, [filtered.salesFiltered]);

  const orderTypeTrend = useMemo(() => {
    const byDate = new Map<string, { date: string; "dine-in": number; takeout: number; delivery: number }>();
    filtered.salesFiltered.forEach((s) => {
      const curr = byDate.get(s.SALE_DATE) ?? {
        date: formatUiDate(s.SALE_DATE),
        "dine-in": 0,
        takeout: 0,
        delivery: 0,
      };
      curr[s.ORDER_TYPE] += s.REVENUE;
      byDate.set(s.SALE_DATE, curr);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filtered.salesFiltered]);

  const weekdayPattern = useMemo(() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const bins = names.map((name, i) => ({ day: name, idx: i, revenue: 0, orders: 0 }));
    filtered.salesFiltered.forEach((s) => {
      const d = new Date(`${s.SALE_DATE}T00:00:00`).getDay();
      bins[d].revenue += s.REVENUE;
      bins[d].orders += s.NUM_ORDERS;
    });
    return bins.map((b) => ({
      day: b.day,
      revenue: Math.round(b.revenue),
      orders: Math.round(b.orders),
    }));
  }, [filtered.salesFiltered]);

  const locationScatter = useMemo(() => {
    const salesByLoc = new Map<number, { revenue: number; orders: number }>();
    filtered.salesFiltered.forEach((s) => {
      const curr = salesByLoc.get(s.LOCATION_ID) ?? { revenue: 0, orders: 0 };
      curr.revenue += s.REVENUE;
      curr.orders += s.NUM_ORDERS;
      salesByLoc.set(s.LOCATION_ID, curr);
    });

    const ratingByLoc = new Map<number, { sum: number; count: number }>();
    filtered.reviewFiltered.forEach((r) => {
      const curr = ratingByLoc.get(r.LOCATION_ID) ?? { sum: 0, count: 0 };
      curr.sum += r.RATING;
      curr.count += 1;
      ratingByLoc.set(r.LOCATION_ID, curr);
    });

    return Array.from(salesByLoc.entries()).map(([locationId, salesAgg]) => {
      const ratingAgg = ratingByLoc.get(locationId);
      const rating = ratingAgg && ratingAgg.count > 0 ? ratingAgg.sum / ratingAgg.count : 0;
      return {
        name: locationMap.get(locationId)?.NAME ?? `L${locationId}`,
        revenueK: Number((salesAgg.revenue / 1000).toFixed(1)),
        orders: salesAgg.orders,
        rating: Number(rating.toFixed(2)),
      };
    });
  }, [filtered.salesFiltered, filtered.reviewFiltered, locationMap]);

  if (loading) {
    return <LoadingState label="Loading sales analytics..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8">
        <h3 className="text-lg font-black text-rose-400 uppercase">Sales analysis unavailable</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-xl">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-1">
            {(["7d", "30d", "90d", "all"] as Preset[]).map((p) => (
              <Button
                key={p}
                type="button"
                variant="ghost"
                onClick={() => setPreset(p)}
                className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-wider ${
                  preset === p ? "bg-primary text-white" : "text-[var(--text-muted)]"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>

          <DatePickerField
            label="From"
            value={filtered.safeStart}
            min={bounds.min}
            max={bounds.max}
            onChange={(isoDate) => {
              setPreset("custom");
              setStartDate(isoDate);
            }}
          />

          <DatePickerField
            label="To"
            value={filtered.safeEnd}
            min={bounds.min}
            max={bounds.max}
            onChange={(isoDate) => {
              setPreset("custom");
              setEndDate(isoDate);
            }}
          />

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-2 py-1 text-xs font-bold text-[var(--text-muted)]">
            <span className="pl-1">City</span>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full h-8 border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-none focus-visible:ring-0 text-[var(--text-main)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)]/90 backdrop-blur-xl border-[var(--border-color)] text-[var(--text-main)]">
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city === "all" ? "All cities" : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-2 py-1 text-xs font-bold text-[var(--text-muted)]">
            <span className="pl-1">Type</span>
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger className="w-full h-8 border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-none focus-visible:ring-0 text-[var(--text-main)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)]/90 backdrop-blur-xl border-[var(--border-color)] text-[var(--text-main)]">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeout">Takeout</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary">
            {formatUiDate(filtered.safeStart)} - {formatUiDate(filtered.safeEnd)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={`$${Math.round(kpis.totalRevenue).toLocaleString()}`} sub={formatDelta(kpis.revenueDelta)} icon="payments" />
        <KpiCard label="Orders" value={Math.round(kpis.totalOrders).toLocaleString()} sub="Filtered volume" icon="shopping_bag" />
        <KpiCard label="Avg Order Value" value={`$${kpis.aov.toFixed(2)}`} sub="Revenue per order" icon="receipt_long" />
        <KpiCard label="Avg Rating" value={kpis.avgRating.toFixed(2)} sub={`${filtered.reviewFiltered.length} reviews`} icon="star" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Revenue & Orders Trend</h3>
            <ChartDownloadButton chartId="sales-revenue-orders-trend" fileName="sales-revenue-orders-trend" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Daily demand and earnings linkage</p>
          <div id="sales-revenue-orders-trend" className="h-[330px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(59,130,246,0.35)",
                    borderRadius: "16px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar yAxisId="right" dataKey="orders" fill="#22d3ee" opacity={0.35} radius={[6, 6, 0, 0]} />
                <Line yAxisId="left" dataKey="revenue" stroke="#a855f7" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Weekday Pattern</h3>
            <ChartDownloadButton chartId="sales-weekday-pattern" fileName="sales-weekday-pattern" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Which days drive most revenue</p>
          <div id="sales-weekday-pattern" className="h-[330px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) =>
                    name === "revenue"
                      ? [`$${Math.round(Number(value ?? 0)).toLocaleString()}`, "Revenue"]
                      : [Math.round(Number(value ?? 0)), "Orders"]
                  }
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(34,197,94,0.4)",
                    borderRadius: "16px",
                    color: "#dcfce7",
                  }}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Order Type Composition</h3>
            <ChartDownloadButton chartId="sales-order-type-composition" fileName="sales-order-type-composition" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Channel mix trend over selected period</p>
          <div id="sales-order-type-composition" className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderTypeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined) => `$${Math.round(Number(value ?? 0)).toLocaleString()}`}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(168,85,247,0.4)",
                    borderRadius: "16px",
                    color: "#f5f3ff",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="dine-in" stackId="1" stroke="#a855f7" fill="#a855f766" />
                <Area type="monotone" dataKey="takeout" stackId="1" stroke="#3b82f6" fill="#3b82f666" />
                <Area type="monotone" dataKey="delivery" stackId="1" stroke="#22d3ee" fill="#22d3ee66" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Location Performance Matrix</h3>
            <ChartDownloadButton chartId="sales-location-performance-matrix" fileName="sales-location-performance-matrix" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Revenue vs orders, bubble by rating</p>
          <div id="sales-location-performance-matrix" className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="orders" name="Orders" stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="number" dataKey="revenueK" name="Revenue" unit="k" stroke="var(--text-muted)" fontSize={11} />
                <ZAxis type="number" dataKey="rating" range={[70, 300]} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    const n = Number(value ?? 0);
                    if (name === "Revenue") return [`$${n}k`, name ?? "Revenue"];
                    if (name === "Orders") return [Math.round(n), name ?? "Orders"];
                    return [n.toFixed(2), name ?? "Rating"];
                  }}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(251,146,60,0.4)",
                    borderRadius: "16px",
                    color: "#ffedd5",
                  }}
                />
                <Scatter data={locationScatter} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="text-3xl font-black tracking-tighter text-[var(--text-main)]">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}
