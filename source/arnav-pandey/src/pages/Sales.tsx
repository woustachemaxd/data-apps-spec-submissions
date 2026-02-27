import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";

interface Loc { LOCATION_ID: number; NAME: string }

const SERIES_COLORS: Record<string, string> = {
  "dine-in": "#1f78b4",
  takeout: "#33a02c",
  delivery: "#e31a1c",
};

  function formatDateLabel(d: string) {
    // Show the value from DB as-is (ISO YYYY-MM-DD) to preserve uniqueness
    // If it's an ISO-like string, return the YYYY-MM-DD portion; otherwise return input
    if (!d) return "";
    if (typeof d !== "string") return String(d);
    // keep the original value (or the prefix if it contains time)
    return d.slice(0, 10);
  }

export default function SalesPage() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<number[] | "all">("all");
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [customRange, setCustomRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [groupBy, setGroupBy] = useState<"daily" | "weekly">("daily");
  const [movingAvg, setMovingAvg] = useState<boolean>(false);
  const [show, setShow] = useState<Record<string, boolean>>({ "dine-in": true, takeout: true, delivery: true });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    querySnowflake<Loc>("SELECT LOCATION_ID, NAME FROM LOCATIONS ORDER BY LOCATION_ID").then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Build SQL based on selection and grouping
        const whereLoc = selectedLocs === "all" ? "" : `AND LOCATION_ID IN (${selectedLocs.join(",")})`;
        const dateExpr = groupBy === "weekly" ? "DATE_TRUNC('week', SALE_DATE)" : "SALE_DATE";
        let sql: string;
        if (customRange) {
          // Use explicit start/end dates (safe ISO-format)
          sql = `SELECT ${dateExpr} AS SALE_DATE, ORDER_TYPE, SUM(REVENUE) AS REVENUE
            FROM DAILY_SALES
            WHERE SALE_DATE >= TO_DATE('${startDate}') AND SALE_DATE <= TO_DATE('${endDate}')
            ${whereLoc}
            GROUP BY ${dateExpr}, ORDER_TYPE
            ORDER BY ${dateExpr}`;
        } else {
          sql = `SELECT ${dateExpr} AS SALE_DATE, ORDER_TYPE, SUM(REVENUE) AS REVENUE
            FROM DAILY_SALES
            WHERE SALE_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE)
            ${whereLoc}
            GROUP BY ${dateExpr}, ORDER_TYPE
            ORDER BY ${dateExpr}`;
        }

        const rows = await querySnowflake<{ SALE_DATE: string; ORDER_TYPE: string; REVENUE: number }>(sql);

        // Pivot rows into series per date
        const map = new Map<string, any>();
        for (const r of rows) {
          // Normalize SALE_DATE to ISO YYYY-MM-DD when possible so x-axis shows unique dates
          let dKey = String(r.SALE_DATE);
          const dt = new Date(r.SALE_DATE as any);
          if (!Number.isNaN(dt.getTime())) {
            dKey = dt.toISOString().slice(0, 10);
          } else {
            // fallback: try to extract prefix
            dKey = dKey.slice(0, 10);
          }

          if (!map.has(dKey)) map.set(dKey, { date: dKey, "dine-in": 0, takeout: 0, delivery: 0, total: 0 });
          const obj = map.get(dKey);
          const ot = String(r.ORDER_TYPE).toLowerCase();
          obj[ot] = Number(r.REVENUE) + (obj[ot] || 0);
          obj.total = (obj.total || 0) + Number(r.REVENUE);
        }

        let arr = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

        if (movingAvg) {
          const keys = ["dine-in", "takeout", "delivery"];
          const window = 7;
          for (let i = 0; i < arr.length; i++) {
            for (const k of keys) {
              let sum = 0;
              let count = 0;
              for (let j = Math.max(0, i - window + 1); j <= i; j++) {
                sum += Number(arr[j][k] || 0);
                count++;
              }
              arr[i][`${k}_ma`] = count ? sum / count : 0;
            }
          }
        }

        setData(arr);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedLocs, rangeDays, groupBy, movingAvg, customRange, startDate, endDate]);

  const totals = useMemo(() => {
    const t = { total: 0, "dine-in": 0, takeout: 0, delivery: 0 } as Record<string, number>;
    for (const d of data) {
      t.total += Number(d.total || 0);
      t["dine-in"] += Number(d["dine-in"] || 0);
      t.takeout += Number(d.takeout || 0);
      t.delivery += Number(d.delivery || 0);
    }
    return t;
  }, [data]);

  function toggleSeries(k: string) {
    setShow((s) => ({ ...s, [k]: !s[k] }));
  }

  function onSelectLocs(e: React.ChangeEvent<HTMLSelectElement>) {
    const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
    if (opts.includes("all")) {
      setSelectedLocs("all");
    } else {
      const nums = opts.map((v) => Number(v)).filter(Boolean);
      setSelectedLocs(nums.length ? nums : "all");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xs text-primary hover:underline font-medium">← Back to Home</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest text-muted-foreground uppercase">Historical Sales</span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Historical Sales View</h1>
          <p className="text-muted-foreground mt-2">Trends over time with order-type breakdown. Use the controls to filter by location(s), grouping, and range.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters & Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Locations</label>
              <select multiple size={1} onChange={onSelectLocs} className="rounded border px-2 py-1 min-w-[220px]">
                <option value="all">All locations (hold Ctrl/Cmd to multi-select)</option>
                {locations.map((l) => (
                  <option key={l.LOCATION_ID} value={l.LOCATION_ID}>{l.NAME}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Range</label>
              <select
                value={customRange ? "custom" : String(rangeDays)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setCustomRange(true);
                  } else {
                    setCustomRange(false);
                    const n = Number(v) || 90;
                    setRangeDays(n);
                    // update start/end to match quick range
                    const now = new Date();
                    const s = new Date();
                    s.setDate(now.getDate() - n);
                    setStartDate(s.toISOString().slice(0, 10));
                    setEndDate(now.toISOString().slice(0, 10));
                  }
                }}
                className="rounded border px-2 py-1"
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="custom">Custom range...</option>
              </select>
            </div>

            {customRange && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Start</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border px-2 py-1" />
                <label className="text-sm font-medium">End</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border px-2 py-1" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Group</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="rounded border px-2 py-1">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Smoothing</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={movingAvg} onChange={(e) => setMovingAvg(e.target.checked)} /> 7-day MA</label>
            </div>

            <div className="ml-auto text-sm text-foreground">
              <div><span className="font-medium">Total:</span> ${totals.total.toLocaleString()}</div>
              <div className="text-muted-foreground">Dine-in: ${totals["dine-in"].toLocaleString()} · Takeout: ${totals.takeout.toLocaleString()} · Delivery: ${totals.delivery.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 420 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                {(["delivery", "dine-in", "takeout"] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!show[k]} onChange={() => toggleSeries(k)} />
                    <span className="w-3 h-3" style={{ background: SERIES_COLORS[k], display: 'inline-block', borderRadius: 4 }} />
                    <span className="capitalize">{k.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">X axis: date ({groupBy === 'weekly' ? 'week start' : 'day'}) — hover for exact values</div>
            </div>

            {loading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
            {error && <div className="py-6 text-destructive">{error}</div>}
            {!loading && !error && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateLabel} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} labelFormatter={(l) => `Date: ${l}`} />
                  <Legend />
                  {show["dine-in"] && (
                    <Area
                      type="monotone"
                      dataKey={movingAvg ? "dine-in_ma" : "dine-in"}
                      stackId="1"
                      stroke={SERIES_COLORS["dine-in"]}
                      fill={SERIES_COLORS["dine-in"]}
                      fillOpacity={0.25}
                    />
                  )}
                  {show["takeout"] && (
                    <Area
                      type="monotone"
                      dataKey={movingAvg ? "takeout_ma" : "takeout"}
                      stackId="1"
                      stroke={SERIES_COLORS["takeout"]}
                      fill={SERIES_COLORS["takeout"]}
                      fillOpacity={0.25}
                    />
                  )}
                  {show["delivery"] && (
                    <Area
                      type="monotone"
                      dataKey={movingAvg ? "delivery_ma" : "delivery"}
                      stackId="1"
                      stroke={SERIES_COLORS["delivery"]}
                      fill={SERIES_COLORS["delivery"]}
                      fillOpacity={0.25}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
