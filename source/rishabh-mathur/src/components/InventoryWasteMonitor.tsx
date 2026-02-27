import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
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
import { Badge } from "@/components/ui/badge";
import LoadingState from "@/components/LoadingState";
import DatePickerField from "@/components/DatePickerField";
import ChartDownloadButton from "@/components/ChartDownloadButton";

type Preset = "7d" | "30d" | "90d" | "all" | "custom";

type InventoryRow = {
  LOCATION_ID: number;
  RECORD_DATE: string;
  CATEGORY: string;
  UNITS_RECEIVED: number;
  UNITS_USED: number;
  UNITS_WASTED: number;
  WASTE_COST: number;
};

type LocationRow = {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
};

type SalesRow = {
  LOCATION_ID: number;
  SALE_DATE: string;
  REVENUE: number;
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

function formatMoney(v: number): string {
  return `$${Math.round(v).toLocaleString()}`;
}

export default function InventoryWasteMonitor(_props?: { locations?: unknown[] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [sales, setSales] = useState<SalesRow[]>([]);

  const [preset, setPreset] = useState<Preset>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [locRows, invRows, salesRows] = await Promise.all([
          querySnowflake<any>(`
            SELECT LOCATION_ID, NAME, CITY
            FROM LOCATIONS
            WHERE IS_ACTIVE = TRUE
            ORDER BY LOCATION_ID
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, RECORD_DATE, CATEGORY, UNITS_RECEIVED, UNITS_USED, UNITS_WASTED, WASTE_COST
            FROM INVENTORY
          `),
          querySnowflake<any>(`
            SELECT LOCATION_ID, SALE_DATE, REVENUE
            FROM DAILY_SALES
          `),
        ]);

        const locationsParsed = locRows.map((r: any) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          NAME: String(r.NAME),
          CITY: String(r.CITY),
        }));
        setLocations(locationsParsed);

        const inventoryParsed = invRows.map((r: any) => ({
          LOCATION_ID: toNum(r.LOCATION_ID),
          RECORD_DATE: normalizeDate(r.RECORD_DATE),
          CATEGORY: String(r.CATEGORY),
          UNITS_RECEIVED: toNum(r.UNITS_RECEIVED),
          UNITS_USED: toNum(r.UNITS_USED),
          UNITS_WASTED: toNum(r.UNITS_WASTED),
          WASTE_COST: toNum(r.WASTE_COST),
        }));
        setInventory(inventoryParsed);

        setSales(
          salesRows.map((r: any) => ({
            LOCATION_ID: toNum(r.LOCATION_ID),
            SALE_DATE: normalizeDate(r.SALE_DATE),
            REVENUE: toNum(r.REVENUE),
          }))
        );

        const allDates = inventoryParsed.map((r) => r.RECORD_DATE).filter(Boolean).sort((a, b) => a.localeCompare(b));
        const max = allDates[allDates.length - 1];
        setEndDate(max);
        setStartDate(shiftDays(max, -29));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inventory analytics.");
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
    if (!inventory.length) return { min: "", max: "" };
    const all = inventory.map((r) => r.RECORD_DATE).filter(Boolean).sort((a, b) => a.localeCompare(b));
    return { min: all[0], max: all[all.length - 1] };
  }, [inventory]);

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

  const categoryOptions = useMemo(() => {
    const set = new Set(inventory.map((i) => i.CATEGORY));
    return ["all", ...Array.from(set).sort()];
  }, [inventory]);

  const filtered = useMemo(() => {
    const safeStart = clampDate(startDate || bounds.min, bounds.min, bounds.max);
    const safeEnd = clampDate(endDate || bounds.max, bounds.min, bounds.max);

    const selectedLocationIds = new Set(
      locations
        .filter((l) => cityFilter === "all" || l.CITY === cityFilter)
        .map((l) => l.LOCATION_ID)
    );

    const inventoryFiltered = inventory.filter(
      (r) =>
        selectedLocationIds.has(r.LOCATION_ID) &&
        r.RECORD_DATE >= safeStart &&
        r.RECORD_DATE <= safeEnd &&
        (categoryFilter === "all" || r.CATEGORY === categoryFilter)
    );

    const salesFiltered = sales.filter(
      (s) => selectedLocationIds.has(s.LOCATION_ID) && s.SALE_DATE >= safeStart && s.SALE_DATE <= safeEnd
    );

    return { inventoryFiltered, salesFiltered, safeStart, safeEnd, selectedLocationIds };
  }, [inventory, sales, locations, cityFilter, categoryFilter, startDate, endDate, bounds.min, bounds.max]);

  const kpis = useMemo(() => {
    const received = filtered.inventoryFiltered.reduce((a, b) => a + b.UNITS_RECEIVED, 0);
    const wasted = filtered.inventoryFiltered.reduce((a, b) => a + b.UNITS_WASTED, 0);
    const wasteCost = filtered.inventoryFiltered.reduce((a, b) => a + b.WASTE_COST, 0);
    const revenue = filtered.salesFiltered.reduce((a, b) => a + b.REVENUE, 0);
    const wasteRate = received > 0 ? (wasted / received) * 100 : 0;
    const wasteToRevenue = revenue > 0 ? (wasteCost / revenue) * 100 : 0;

    return { received, wasted, wasteCost, wasteRate, wasteToRevenue };
  }, [filtered]);

  const weeklyWasteData = useMemo(() => {
    const byWeek = new Map<string, { cost: number; units: number }>();
    filtered.inventoryFiltered.forEach((r) => {
      const curr = byWeek.get(r.RECORD_DATE) ?? { cost: 0, units: 0 };
      curr.cost += r.WASTE_COST;
      curr.units += r.UNITS_WASTED;
      byWeek.set(r.RECORD_DATE, curr);
    });

    return Array.from(byWeek.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: formatUiDate(date),
        cost: Math.round(v.cost),
        units: Math.round(v.units),
      }));
  }, [filtered.inventoryFiltered]);

  const categoryWasteData = useMemo(() => {
    const byCat = new Map<string, { cost: number; units: number; received: number }>();
    filtered.inventoryFiltered.forEach((r) => {
      const curr = byCat.get(r.CATEGORY) ?? { cost: 0, units: 0, received: 0 };
      curr.cost += r.WASTE_COST;
      curr.units += r.UNITS_WASTED;
      curr.received += r.UNITS_RECEIVED;
      byCat.set(r.CATEGORY, curr);
    });

    return Array.from(byCat.entries())
      .map(([category, v]) => ({
        category,
        cost: Math.round(v.cost),
        units: Math.round(v.units),
        wasteRate: v.received > 0 ? Number(((v.units / v.received) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filtered.inventoryFiltered]);

  const locationRiskData = useMemo(() => {
    const invByLoc = new Map<number, { cost: number; waste: number; received: number }>();
    filtered.inventoryFiltered.forEach((r) => {
      const curr = invByLoc.get(r.LOCATION_ID) ?? { cost: 0, waste: 0, received: 0 };
      curr.cost += r.WASTE_COST;
      curr.waste += r.UNITS_WASTED;
      curr.received += r.UNITS_RECEIVED;
      invByLoc.set(r.LOCATION_ID, curr);
    });

    const salesByLoc = new Map<number, number>();
    filtered.salesFiltered.forEach((s) => {
      salesByLoc.set(s.LOCATION_ID, (salesByLoc.get(s.LOCATION_ID) ?? 0) + s.REVENUE);
    });

    return Array.from(invByLoc.entries()).map(([locationId, inv]) => {
      const revenue = salesByLoc.get(locationId) ?? 0;
      const wasteRate = inv.received > 0 ? (inv.waste / inv.received) * 100 : 0;
      return {
        name: locationMap.get(locationId)?.NAME ?? `L${locationId}`,
        wasteRate: Number(wasteRate.toFixed(2)),
        costK: Number((inv.cost / 1000).toFixed(2)),
        revenueK: Number((revenue / 1000).toFixed(1)),
      };
    });
  }, [filtered, locationMap]);

  const atRiskRows = useMemo(() => {
    const rows = locationRiskData
      .map((r) => ({
        ...r,
        risk: r.wasteRate > 12 || r.costK > 2.5 ? "critical" : r.wasteRate > 8 || r.costK > 1.2 ? "warning" : "ok",
      }))
      .sort((a, b) => b.wasteRate - a.wasteRate);
    return rows.slice(0, 6);
  }, [locationRiskData]);

  if (loading) {
    return <LoadingState label="Loading inventory analytics..." />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8">
        <h3 className="text-lg font-black text-rose-400 uppercase">Inventory health unavailable</h3>
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
            <span className="pl-1">Category</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-8 border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-none focus-visible:ring-0 text-[var(--text-main)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)]/90 backdrop-blur-xl border-[var(--border-color)] text-[var(--text-main)]">
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-primary">
            {formatUiDate(filtered.safeStart)} - {formatUiDate(filtered.safeEnd)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Waste Cost" value={formatMoney(kpis.wasteCost)} sub="Filtered period" icon="delete_outline" />
        <KpiCard label="Waste Units" value={Math.round(kpis.wasted).toLocaleString()} sub="Units discarded" icon="inventory_2" />
        <KpiCard label="Waste Rate" value={`${kpis.wasteRate.toFixed(1)}%`} sub="Wasted vs received" icon="trending_up" />
        <KpiCard label="Cost / Revenue" value={`${kpis.wasteToRevenue.toFixed(2)}%`} sub="Waste financial pressure" icon="payments" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Weekly Waste Cost & Units</h3>
            <ChartDownloadButton chartId="waste-weekly-cost-units" fileName="waste-weekly-cost-units" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Cost and volume moved together or diverging
          </p>
          <div id="waste-weekly-cost-units" className="h-[320px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyWasteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) =>
                    name === "cost"
                      ? [formatMoney(Number(value ?? 0)), "Cost"]
                      : [Math.round(Number(value ?? 0)), "Units"]
                  }
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(239,68,68,0.35)",
                    borderRadius: "16px",
                    color: "#fee2e2",
                  }}
                />
                <Bar yAxisId="right" dataKey="units" fill="#f97316" opacity={0.35} radius={[6, 6, 0, 0]} />
                <Area yAxisId="left" type="monotone" dataKey="cost" stroke="#ef4444" fill="#ef444433" strokeWidth={2.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Category Loss</h3>
            <ChartDownloadButton chartId="waste-category-loss" fileName="waste-category-loss" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Which category needs intervention first
          </p>
          <div id="waste-category-loss" className="h-[320px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryWasteData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="category" width={90} stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    if (name === "cost") return [formatMoney(Number(value ?? 0)), "Cost"];
                    return [Math.round(Number(value ?? 0)), name ?? "Value"];
                  }}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(251,146,60,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(251,146,60,0.4)",
                    borderRadius: "16px",
                    color: "#ffedd5",
                  }}
                />
                <Bar dataKey="cost" fill="#f97316" radius={[0, 8, 8, 0]}>
                  {categoryWasteData.map((row) => (
                    <Cell key={row.category} fill={row.wasteRate > 12 ? "#ef4444" : row.wasteRate > 8 ? "#f97316" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Location Risk Matrix</h3>
            <ChartDownloadButton chartId="waste-location-risk-matrix" fileName="waste-location-risk-matrix" />
          </div>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Waste rate vs cost, bubble by revenue
          </p>
          <div id="waste-location-risk-matrix" className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" dataKey="wasteRate" name="Waste Rate" unit="%" stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="number" dataKey="costK" name="Waste Cost" unit="k" stroke="var(--text-muted)" fontSize={11} />
                <ZAxis type="number" dataKey="revenueK" range={[80, 320]} />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => {
                    const n = Number(value ?? 0);
                    if (name === "Waste Rate") return [`${n.toFixed(1)}%`, name ?? "Waste Rate"];
                    if (name === "Waste Cost") return [`$${n}k`, name ?? "Waste Cost"];
                    return [`$${n}k`, name ?? "Revenue"];
                  }}
                  contentStyle={{
                    background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(15,23,42,0.95))",
                    border: "1px solid rgba(34,197,94,0.4)",
                    borderRadius: "16px",
                    color: "#dcfce7",
                  }}
                />
                <Scatter data={locationRiskData} fill="#22c55e" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">At-Risk Locations</h3>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Prioritized intervention queue
          </p>
          <div className="mt-4 space-y-3">
            {atRiskRows.map((row) => (
              <div key={row.name} className="rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{row.name}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      row.risk === "critical"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        : row.risk === "warning"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {row.risk}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <span>Rate {row.wasteRate.toFixed(1)}%</span>
                  <span>Cost ${row.costK}k</span>
                  <span>Rev ${row.revenueK}k</span>
                </div>
              </div>
            ))}
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
