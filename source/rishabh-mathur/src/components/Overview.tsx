import { useEffect, useMemo, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Legend,
  Line,
  XAxis,
  YAxis,
  ZAxis,
  Bar,
} from "recharts";
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

type DatePreset = "7d" | "30d" | "90d" | "all" | "custom";

type LocationRow = {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
};

type SalesRow = {
  LOCATION_ID: number;
  SALE_DATE: string;
  ORDER_TYPE: "dine-in" | "takeout" | "delivery";
  REVENUE: number;
  NUM_ORDERS: number;
};

type ReviewRow = {
  LOCATION_ID: number;
  REVIEW_DATE: string;
  RATING: number;
};

type InventoryRow = {
  LOCATION_ID: number;
  RECORD_DATE: string;
  UNITS_RECEIVED: number;
  UNITS_WASTED: number;
  WASTE_COST: number;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(value: unknown): string {
  // Snowflake SQL API can return DATE as day offset (e.g. 20393) or ISO-like string.
  if (typeof value === "number" && Number.isFinite(value)) {
    return shiftDays("1970-01-01", Math.trunc(value));
  }

  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d+$/.test(raw)) {
    return shiftDays("1970-01-01", Number(raw));
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return isoFromDate(parsed);
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

function clampDate(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function formatUiDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function sortIsoAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [locRows, salesRows, reviewRows, inventoryRows] = await Promise.all([
          querySnowflake<any>(`
            SELECT LOCATION_ID, NAME, CITY, STATE
            FROM LOCATIONS
            WHERE IS_ACTIVE = TRUE
            ORDER BY LOCATION_ID
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS
            FROM DAILY_SALES
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, REVIEW_DATE, RATING
            FROM CUSTOMER_REVIEWS
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, RECORD_DATE, UNITS_RECEIVED, UNITS_WASTED, WASTE_COST
            FROM INVENTORY
          `),
        ]);

        const parsedLocations: LocationRow[] = locRows.map((r) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          NAME: String(r.NAME),
          CITY: String(r.CITY),
          STATE: String(r.STATE),
        }));

        const parsedSales: SalesRow[] = salesRows.map((r) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          SALE_DATE: normalizeDate(r.SALE_DATE),
          ORDER_TYPE: String(r.ORDER_TYPE) as SalesRow["ORDER_TYPE"],
          REVENUE: toNum(r.REVENUE),
          NUM_ORDERS: toNum(r.NUM_ORDERS),
        }));

        const parsedReviews: ReviewRow[] = reviewRows.map((r) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          REVIEW_DATE: normalizeDate(r.REVIEW_DATE),
          RATING: toNum(r.RATING),
        }));

        const parsedInventory: InventoryRow[] = inventoryRows.map((r) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          RECORD_DATE: normalizeDate(r.RECORD_DATE),
          UNITS_RECEIVED: toNum(r.UNITS_RECEIVED),
          UNITS_WASTED: toNum(r.UNITS_WASTED),
          WASTE_COST: toNum(r.WASTE_COST),
        }));

        setLocations(parsedLocations);
        setSales(parsedSales);
        setReviews(parsedReviews);
        setInventory(parsedInventory);

        const allDates = parsedSales.map((r) => r.SALE_DATE).filter(Boolean).sort(sortIsoAsc);
        const minDate = allDates[0];
        const maxDate = allDates[allDates.length - 1];
        setStartDate(shiftDays(maxDate, -29));
        setEndDate(maxDate);
        if (!minDate || !maxDate) {
          setError("No sales data found.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load overview data");
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

  const dateBounds = useMemo(() => {
    if (!sales.length) return { min: "", max: "" };
    const sorted = sales.map((r) => r.SALE_DATE).sort(sortIsoAsc);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  }, [sales]);

  useEffect(() => {
    if (!dateBounds.max || !dateBounds.min) return;
    if (preset === "custom") return;

    const max = dateBounds.max;
    if (preset === "all") {
      setStartDate(dateBounds.min);
      setEndDate(max);
      return;
    }

    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    setEndDate(max);
    setStartDate(clampDate(shiftDays(max, -(days - 1)), dateBounds.min, dateBounds.max));
  }, [preset, dateBounds.max, dateBounds.min]);

  const cityOptions = useMemo(() => {
    const set = new Set(locations.map((l) => l.CITY));
    return ["all", ...Array.from(set).sort()];
  }, [locations]);

  const isLocationSelected = (locationId: number): boolean => {
    if (cityFilter === "all") return true;
    return locationMap.get(locationId)?.CITY === cityFilter;
  };

  const inRange = (date: string, start: string, end: string): boolean =>
    date >= start && date <= end;

  const filtered = useMemo(() => {
    const safeStart = clampDate(startDate || dateBounds.min, dateBounds.min, dateBounds.max);
    const safeEnd = clampDate(endDate || dateBounds.max, dateBounds.min, dateBounds.max);

    const filteredSales = sales.filter(
      (r) => r.SALE_DATE && isLocationSelected(r.LOCATION_ID) && inRange(r.SALE_DATE, safeStart, safeEnd)
    );
    const filteredReviews = reviews.filter(
      (r) => r.REVIEW_DATE && isLocationSelected(r.LOCATION_ID) && inRange(r.REVIEW_DATE, safeStart, safeEnd)
    );
    const filteredInventory = inventory.filter(
      (r) =>
        r.RECORD_DATE && isLocationSelected(r.LOCATION_ID) && inRange(r.RECORD_DATE, safeStart, safeEnd)
    );

    return { filteredSales, filteredReviews, filteredInventory, safeStart, safeEnd };
  }, [sales, reviews, inventory, startDate, endDate, cityFilter, dateBounds.min, dateBounds.max]);

  const previousRange = useMemo(() => {
    const { safeStart, safeEnd } = filtered;
    if (!safeStart || !safeEnd) return null;
    const durationDays =
      Math.round(
        (new Date(`${safeEnd}T00:00:00`).getTime() - new Date(`${safeStart}T00:00:00`).getTime()) /
          86400000
      ) + 1;
    const prevEnd = shiftDays(safeStart, -1);
    const prevStart = shiftDays(prevEnd, -(durationDays - 1));
    if (prevEnd < dateBounds.min) return null;
    return {
      start: clampDate(prevStart, dateBounds.min, dateBounds.max),
      end: clampDate(prevEnd, dateBounds.min, dateBounds.max),
    };
  }, [filtered, dateBounds.min, dateBounds.max]);

  const metrics = useMemo(() => {
    const totalRevenue = filtered.filteredSales.reduce((acc, row) => acc + row.REVENUE, 0);
    const totalOrders = filtered.filteredSales.reduce((acc, row) => acc + row.NUM_ORDERS, 0);

    const ratingSum = filtered.filteredReviews.reduce((acc, row) => acc + row.RATING, 0);
    const avgRating = filtered.filteredReviews.length
      ? ratingSum / filtered.filteredReviews.length
      : 0;

    const totalReceived = filtered.filteredInventory.reduce(
      (acc, row) => acc + row.UNITS_RECEIVED,
      0
    );
    const totalWasted = filtered.filteredInventory.reduce((acc, row) => acc + row.UNITS_WASTED, 0);
    const wasteRate = totalReceived > 0 ? (totalWasted / totalReceived) * 100 : 0;

    let prevRevenue = 0;
    if (previousRange) {
      prevRevenue = sales
        .filter(
          (r) =>
            isLocationSelected(r.LOCATION_ID) &&
            inRange(r.SALE_DATE, previousRange.start, previousRange.end)
        )
        .reduce((acc, r) => acc + r.REVENUE, 0);
    }

    return {
      totalRevenue,
      totalOrders,
      avgRating,
      wasteRate,
      revenueDelta: previousRange ? pctChange(totalRevenue, prevRevenue) : null,
    };
  }, [filtered, previousRange, sales, cityFilter]);

  const trendChartData = useMemo(() => {
    const byDate = new Map<string, { date: string; revenue: number; ratingSum: number; ratingCount: number }>();

    filtered.filteredSales.forEach((row) => {
      const curr = byDate.get(row.SALE_DATE) ?? {
        date: row.SALE_DATE,
        revenue: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
      curr.revenue += row.REVENUE;
      byDate.set(row.SALE_DATE, curr);
    });

    filtered.filteredReviews.forEach((row) => {
      const curr = byDate.get(row.REVIEW_DATE) ?? {
        date: row.REVIEW_DATE,
        revenue: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
      curr.ratingSum += row.RATING;
      curr.ratingCount += 1;
      byDate.set(row.REVIEW_DATE, curr);
    });

    return Array.from(byDate.values())
      .sort((a, b) => sortIsoAsc(a.date, b.date))
      .map((r) => ({
        date: r.date.slice(5),
        revenue: Math.round(r.revenue),
        rating: r.ratingCount ? Number((r.ratingSum / r.ratingCount).toFixed(2)) : null,
      }));
  }, [filtered]);

  const wasteTrendData = useMemo(() => {
    const byWeek = new Map<string, number>();
    filtered.filteredInventory.forEach((r) => {
      byWeek.set(r.RECORD_DATE, (byWeek.get(r.RECORD_DATE) ?? 0) + r.WASTE_COST);
    });
    return Array.from(byWeek.entries())
      .sort(([a], [b]) => sortIsoAsc(a, b))
      .map(([date, wasteCost]) => ({
        date: date.slice(5),
        wasteCost: Number(wasteCost.toFixed(2)),
      }));
  }, [filtered.filteredInventory]);

  const orderTypeData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filteredSales.forEach((r) => {
      map.set(r.ORDER_TYPE, (map.get(r.ORDER_TYPE) ?? 0) + r.REVENUE);
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [filtered.filteredSales]);

  const efficiencyData = useMemo(() => {
    const byLocation = new Map<
      number,
      { revenue: number; received: number; wasted: number; reviews: number; ratingSum: number }
    >();

    filtered.filteredSales.forEach((row) => {
      const curr = byLocation.get(row.LOCATION_ID) ?? {
        revenue: 0,
        received: 0,
        wasted: 0,
        reviews: 0,
        ratingSum: 0,
      };
      curr.revenue += row.REVENUE;
      byLocation.set(row.LOCATION_ID, curr);
    });

    filtered.filteredInventory.forEach((row) => {
      const curr = byLocation.get(row.LOCATION_ID) ?? {
        revenue: 0,
        received: 0,
        wasted: 0,
        reviews: 0,
        ratingSum: 0,
      };
      curr.received += row.UNITS_RECEIVED;
      curr.wasted += row.UNITS_WASTED;
      byLocation.set(row.LOCATION_ID, curr);
    });

    filtered.filteredReviews.forEach((row) => {
      const curr = byLocation.get(row.LOCATION_ID) ?? {
        revenue: 0,
        received: 0,
        wasted: 0,
        reviews: 0,
        ratingSum: 0,
      };
      curr.reviews += 1;
      curr.ratingSum += row.RATING;
      byLocation.set(row.LOCATION_ID, curr);
    });

    return Array.from(byLocation.entries())
      .map(([locationId, v]) => {
        const wasteRate = v.received > 0 ? (v.wasted / v.received) * 100 : 0;
        const rating = v.reviews > 0 ? v.ratingSum / v.reviews : 0;
        const name = locationMap.get(locationId)?.NAME ?? `Location ${locationId}`;
        return {
          name,
          wasteRate: Number(wasteRate.toFixed(2)),
          revenueK: Number((v.revenue / 1000).toFixed(1)),
          rating: Number(rating.toFixed(2)),
        };
      })
      .filter((r) => r.revenueK > 0);
  }, [filtered, locationMap]);

  const locationPerformance = useMemo(() => {
    const nowMap = new Map<number, number>();
    filtered.filteredSales.forEach((row) => {
      nowMap.set(row.LOCATION_ID, (nowMap.get(row.LOCATION_ID) ?? 0) + row.REVENUE);
    });

    const prevMap = new Map<number, number>();
    if (previousRange) {
      sales
        .filter(
          (row) =>
            isLocationSelected(row.LOCATION_ID) &&
            inRange(row.SALE_DATE, previousRange.start, previousRange.end)
        )
        .forEach((row) => {
          prevMap.set(row.LOCATION_ID, (prevMap.get(row.LOCATION_ID) ?? 0) + row.REVENUE);
        });
    }

    const ratingByLocation = new Map<number, { sum: number; count: number }>();
    filtered.filteredReviews.forEach((r) => {
      const curr = ratingByLocation.get(r.LOCATION_ID) ?? { sum: 0, count: 0 };
      curr.sum += r.RATING;
      curr.count += 1;
      ratingByLocation.set(r.LOCATION_ID, curr);
    });

    const wasteByLocation = new Map<number, { recv: number; waste: number }>();
    filtered.filteredInventory.forEach((r) => {
      const curr = wasteByLocation.get(r.LOCATION_ID) ?? { recv: 0, waste: 0 };
      curr.recv += r.UNITS_RECEIVED;
      curr.waste += r.UNITS_WASTED;
      wasteByLocation.set(r.LOCATION_ID, curr);
    });

    return locations
      .filter((l) => cityFilter === "all" || l.CITY === cityFilter)
      .map((l) => {
        const revenue = nowMap.get(l.LOCATION_ID) ?? 0;
        const prevRevenue = prevMap.get(l.LOCATION_ID) ?? 0;
        const delta = pctChange(revenue, prevRevenue);
        const r = ratingByLocation.get(l.LOCATION_ID);
        const avgRating = r && r.count > 0 ? r.sum / r.count : 0;
        const w = wasteByLocation.get(l.LOCATION_ID);
        const wasteRate = w && w.recv > 0 ? (w.waste / w.recv) * 100 : 0;

        return {
          locationId: l.LOCATION_ID,
          name: l.NAME,
          city: l.CITY,
          revenue,
          delta,
          avgRating,
          wasteRate,
          atRisk: wasteRate > 12 || avgRating < 3.6 || (delta !== null && delta < -5),
        };
      })
      .filter((l) => l.revenue > 0);
  }, [locations, filtered, previousRange, cityFilter, sales]);

  const topLocations = useMemo(
    () => [...locationPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [locationPerformance]
  );

  const atRiskLocations = useMemo(
    () => locationPerformance.filter((l) => l.atRisk).sort((a, b) => b.wasteRate - a.wasteRate).slice(0, 5),
    [locationPerformance]
  );

  if (loading) {
    return <LoadingState label="Loading overview metrics..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <h3 className="mb-2 text-lg font-black text-rose-400">Overview unavailable</h3>
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </div>
    );
  }

  const pieColors = ["#a855f7", "#3b82f6", "#22c55e"];
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-xl">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] p-1">
            {(["7d", "30d", "90d", "all"] as DatePreset[]).map((p) => (
              <Button
                type="button"
                variant="ghost"
                key={p}
                onClick={() => setPreset(p)}
                className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                  preset === p
                    ? "bg-primary text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--glass-bg)]"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>

          <DatePickerField
            label="From"
            value={filtered.safeStart}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(isoDate) => {
              setPreset("custom");
              setStartDate(isoDate);
            }}
          />

          <DatePickerField
            label="To"
            value={filtered.safeEnd}
            min={dateBounds.min}
            max={dateBounds.max}
            onChange={(isoDate) => {
              setPreset("custom");
              setEndDate(isoDate);
            }}
          />

          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-2 py-1 text-xs font-bold text-[var(--text-muted)]">
            <span className="pl-1">City</span>
            <Select
              value={cityFilter}
              onValueChange={(value) => setCityFilter(value)}
            >
              <SelectTrigger className="w-full h-8 border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-none focus-visible:ring-0 text-[var(--text-main)]">
                <SelectValue placeholder="All cities" />
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

          <div className="flex items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary">
            {formatUiDate(filtered.safeStart)} to {formatUiDate(filtered.safeEnd)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={`$${Math.round(metrics.totalRevenue).toLocaleString()}`}
          delta={formatDelta(metrics.revenueDelta)}
          icon="payments"
        />
        <KpiCard
          label="Total Orders"
          value={Math.round(metrics.totalOrders).toLocaleString()}
          delta="filtered"
          icon="shopping_bag"
        />
        <KpiCard
          label="Avg Rating"
          value={metrics.avgRating.toFixed(2)}
          delta={`${filtered.filteredReviews.length} reviews`}
          icon="star"
        />
        <KpiCard
          label="Waste Rate"
          value={`${metrics.wasteRate.toFixed(1)}%`}
          delta={`${Math.round(
            filtered.filteredInventory.reduce((a, b) => a + b.WASTE_COST, 0)
          ).toLocaleString()} cost`}
          icon="delete_outline"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-6 xl:col-span-2">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
              Revenue vs Rating
            </h3>
            <ChartDownloadButton chartId="overview-revenue-vs-rating" fileName="overview-revenue-vs-rating" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Combined daily performance
          </p>
          <div id="overview-revenue-vs-rating" className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[2.5, 5]}
                  stroke="var(--text-muted)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(59,130,246,0.35)",
                    borderRadius: "16px",
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#93c5fd", fontWeight: 700 }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} opacity={0.55} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rating"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
              Order Mix
            </h3>
            <ChartDownloadButton chartId="overview-order-mix" fileName="overview-order-mix" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Revenue share by channel
          </p>
          <div id="overview-order-mix" className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderTypeData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={4}>
                  {orderTypeData.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    `$${Math.round(Number(value ?? 0)).toLocaleString()}`
                  }
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(168,85,247,0.4)",
                    borderRadius: "16px",
                    color: "#f5f3ff",
                  }}
                  labelStyle={{ color: "#c4b5fd", fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {orderTypeData.map((row, idx) => (
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
              Waste Cost Trend
            </h3>
            <ChartDownloadButton chartId="overview-waste-cost-trend" fileName="overview-waste-cost-trend" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Weekly financial impact
          </p>
          <div id="overview-waste-cost-trend" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wasteTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined) =>
                    `$${Number(value ?? 0).toLocaleString()}`
                  }
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "16px",
                    color: "#fee2e2",
                  }}
                  labelStyle={{ color: "#fca5a5", fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="wasteCost" stroke="#ef4444" fill="#ef444433" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--text-main)]">
              Efficiency Scatter
            </h3>
            <ChartDownloadButton chartId="overview-efficiency-scatter" fileName="overview-efficiency-scatter" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Waste rate vs revenue by location
          </p>
          <div id="overview-efficiency-scatter" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="wasteRate" name="Waste Rate" unit="%" stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="number" dataKey="revenueK" name="Revenue" unit="k" stroke="var(--text-muted)" fontSize={11} />
                <ZAxis type="number" dataKey="rating" range={[80, 280]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    const numericValue = Number(value ?? 0);
                    const safeName = name ?? "Value";
                    if (safeName === "Revenue") return [`$${numericValue}k`, safeName];
                    if (safeName === "Waste Rate") return [`${numericValue}%`, safeName];
                    return [numericValue, safeName];
                  }}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(16,185,129,0.4)",
                    borderRadius: "16px",
                    color: "#d1fae5",
                  }}
                  labelStyle={{ color: "#86efac", fontWeight: 700 }}
                />
                <Scatter name="Locations" data={efficiencyData} fill="#a855f7" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LocationListCard title="Top Performers" rows={topLocations} emptyText="No locations for this filter." />
        <LocationListCard title="At-Risk Locations" rows={atRiskLocations} emptyText="No at-risk locations in this range." />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="text-3xl font-black tracking-tighter text-[var(--text-main)]">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{delta}</p>
    </div>
  );
}

function LocationListCard({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: Array<{
    locationId: number;
    name: string;
    city: string;
    revenue: number;
    delta: number | null;
    avgRating: number;
    wasteRate: number;
  }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-[var(--text-main)]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={`${title}-${row.locationId}`}
              className={`rounded-xl border p-4 ${
                row.wasteRate > 12 || row.avgRating < 3.6
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{row.name}</p>
                <p className="text-sm font-black text-[var(--text-main)]">${Math.round(row.revenue).toLocaleString()}</p>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <StarRating value={row.avgRating} />
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                  {row.avgRating.toFixed(2)}
                </span>
                {(row.wasteRate > 12 || row.avgRating < 3.6) && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Action Needed
                  </span>
                )}
                {row.wasteRate <= 12 && row.avgRating >= 3.6 && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Stable
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <span>{row.city}</span>
                <span>Waste {row.wasteRate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(5, value));
  const starPath =
    "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const fill = Math.max(0, Math.min(1, normalized - idx));
        return (
          <span key={idx} className="relative inline-flex h-[14px] w-[14px]">
            <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] text-slate-600" aria-hidden="true">
              <path d={starPath} fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${Math.round(fill * 100)}%` }}
            >
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] text-amber-400" aria-hidden="true">
                <path d={starPath} fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
}
