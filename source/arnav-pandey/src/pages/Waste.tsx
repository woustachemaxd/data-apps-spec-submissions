import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";

interface Loc { LOCATION_ID: number; NAME: string }

const CATEGORY_COLORS: Record<string, string> = {
  dairy: "#7b68ee",
  produce: "#ff8c00",
  cones_cups: "#6b8e23",
  toppings: "#ff69b4",
  syrups: "#20b2aa",
};

export default function WastePage() {
  const [locations, setLocations] = useState<Loc[]>([]);
  const [selectedLocs, setSelectedLocs] = useState<number[] | "all">("all");
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [customRange, setCustomRange] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0,10); });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [groupBy, setGroupBy] = useState<"weekly" | "monthly">("weekly");
  const [categories, setCategories] = useState<Record<string, boolean>>({ dairy: true, produce: true, cones_cups: true, toppings: true, syrups: true });
  const [threshold, setThreshold] = useState<number>(500); // dollars per period

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
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
        const whereLocRaw = selectedLocs === "all" ? "" : `AND LOCATION_ID IN (${Array.isArray(selectedLocs) ? selectedLocs.join(",") : selectedLocs})`;
        const whereLocAliased = selectedLocs === "all" ? "" : `AND i.LOCATION_ID IN (${Array.isArray(selectedLocs) ? selectedLocs.join(",") : selectedLocs})`;
        const dateExpr = groupBy === "monthly" ? "DATE_TRUNC('month', RECORD_DATE)" : "DATE_TRUNC('week', RECORD_DATE)";

        let sql: string;
        if (customRange) {
          sql = `SELECT ${dateExpr} AS PERIOD_START, CATEGORY, SUM(UNITS_WASTED) AS UNITS_WASTED, SUM(WASTE_COST) AS WASTE_COST
            FROM INVENTORY
            WHERE RECORD_DATE >= TO_DATE('${startDate}') AND RECORD_DATE <= TO_DATE('${endDate}')
            ${whereLocRaw}
            GROUP BY ${dateExpr}, CATEGORY
            ORDER BY ${dateExpr}`;
        } else {
          sql = `SELECT ${dateExpr} AS PERIOD_START, CATEGORY, SUM(UNITS_WASTED) AS UNITS_WASTED, SUM(WASTE_COST) AS WASTE_COST
            FROM INVENTORY
            WHERE RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE)
            ${whereLocRaw}
            GROUP BY ${dateExpr}, CATEGORY
            ORDER BY ${dateExpr}`;
        }

        const rows = await querySnowflake<{ PERIOD_START: string; CATEGORY: string; UNITS_WASTED: number; WASTE_COST: number }>(sql);

        const map = new Map<string, any>();
        for (const r of rows) {
          const raw = String(r.PERIOD_START);
          const key = raw.slice(0,10);
          if (!map.has(key)) map.set(key, { period: key, dairy: 0, produce: 0, cones_cups: 0, toppings: 0, syrups: 0, total: 0 });
          const obj = map.get(key);
          const cat = String(r.CATEGORY);
          obj[cat] = Number(r.WASTE_COST) + (obj[cat] || 0);
          obj.total = (obj.total || 0) + Number(r.WASTE_COST);
        }

        const arr = Array.from(map.values()).sort((a,b) => a.period.localeCompare(b.period));
        setData(arr);

        // summary by location
          const sumSql = customRange
           ? `SELECT i.LOCATION_ID AS LOCATION_ID, l.NAME AS LOCATION_NAME, SUM(i.WASTE_COST) AS WASTE_COST
             FROM INVENTORY i JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
             WHERE i.RECORD_DATE >= TO_DATE('${startDate}') AND i.RECORD_DATE <= TO_DATE('${endDate}') ${whereLocAliased}
             GROUP BY i.LOCATION_ID, l.NAME ORDER BY WASTE_COST DESC`
           : `SELECT i.LOCATION_ID AS LOCATION_ID, l.NAME AS LOCATION_NAME, SUM(i.WASTE_COST) AS WASTE_COST
             FROM INVENTORY i JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
             WHERE i.RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE) ${whereLocAliased}
             GROUP BY i.LOCATION_ID, l.NAME ORDER BY WASTE_COST DESC`;

        const sums = await querySnowflake<{ LOCATION_ID: number; LOCATION_NAME: string; WASTE_COST: number }>(sumSql);
        const withNames = sums.map((s) => ({ location: s.LOCATION_NAME || locations.find((l) => Number(l.LOCATION_ID) === Number(s.LOCATION_ID))?.NAME || String(s.LOCATION_ID), id: Number(s.LOCATION_ID), waste: Number(s.WASTE_COST) }));
        setSummary(withNames);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedLocs, rangeDays, customRange, startDate, endDate, groupBy, locations]);

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
          <span className="text-xs tracking-widest text-muted-foreground uppercase">Inventory Waste Tracker</span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Waste Tracker</h1>
          <p className="text-muted-foreground mt-2">View waste cost by category and location. Flag locations above threshold.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Locations</label>
              <select
                multiple
                size={1}
                value={
                  selectedLocs === "all"
                    ? locations.map((l) => String(l.LOCATION_ID))
                    : Array.isArray(selectedLocs)
                    ? selectedLocs.map((v) => String(v))
                    : []
                }
                onChange={onSelectLocs}
                className="rounded border px-2 py-1 min-w-[220px]"
              >
                <option value="all">All locations</option>
                {locations.map((l) => (
                  <option key={l.LOCATION_ID} value={l.LOCATION_ID}>{l.NAME}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Range</label>
              <select value={customRange ? "custom" : String(rangeDays)} onChange={(e) => {
                const v = e.target.value;
                if (v === "custom") setCustomRange(true);
                else {
                  setCustomRange(false);
                  const n = Number(v) || 90;
                  setRangeDays(n);
                  const now = new Date();
                  const s = new Date(); s.setDate(now.getDate() - n);
                  setStartDate(s.toISOString().slice(0,10)); setEndDate(now.toISOString().slice(0,10));
                }
              }} className="rounded border px-2 py-1">
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
                <option value="custom">Custom range...</option>
              </select>
            </div>

            {customRange && (
              <div className="flex items-center gap-2">
                <label className="text-sm">Start</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border px-2 py-1" />
                <label className="text-sm">End</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border px-2 py-1" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Group</label>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="rounded border px-2 py-1">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Categories</label>
              {Object.keys(CATEGORY_COLORS).map((c) => (
                <label key={c} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!categories[c]} onChange={() => setCategories((s) => ({ ...s, [c]: !s[c] }))} />
                  <span style={{ width: 12, height: 12, background: CATEGORY_COLORS[c], display: 'inline-block', borderRadius: 2 }} />
                  <span className="capitalize">{c.replace('_', ' ')}</span>
                </label>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm">Flag threshold ($)</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="rounded border px-2 py-1 w-28" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waste Cost Trend</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 420 }}>
            {loading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
            {error && <div className="py-6 text-destructive">{error}</div>}
            {!loading && !error && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(0,10)} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Waste cost"]} />
                  <Legend />
                  {Object.keys(CATEGORY_COLORS).map((c) => categories[c] ? (
                    <Bar key={c} dataKey={c} stackId="a" fill={CATEGORY_COLORS[c]}>
                      {data.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} />
                      ))}
                    </Bar>
                  ) : null)}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locations Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Location</th>
                    <th className="pb-2 font-medium text-muted-foreground">Waste Cost</th>
                    <th className="pb-2 font-medium text-muted-foreground">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Compute displayed summary based on selected locations
                    const displayed =
                      selectedLocs === "all"
                        ? summary
                        : (Array.isArray(selectedLocs)
                            ? selectedLocs.map((id) => {
                                const found = summary.find((s) => Number(s.id) === Number(id));
                                if (found) return found;
                                const name = locations.find((l) => Number(l.LOCATION_ID) === Number(id))?.NAME || String(id);
                                return { id: Number(id), location: name, waste: 0 };
                              })
                            : summary);

                    return displayed.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-2.5">{s.location}</td>
                        <td className="py-2.5">${Number(s.waste).toLocaleString()}</td>
                        <td className="py-2.5">{Number(s.waste) > threshold ? <span className="text-destructive font-medium">Above threshold</span> : <span className="text-muted-foreground">OK</span>}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
