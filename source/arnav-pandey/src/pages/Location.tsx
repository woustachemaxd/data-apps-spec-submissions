import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { querySnowflake } from "@/lib/snowflake";
import { sendMockEmail } from "@/lib/mockMailer";

type LocationRow = {
  LOCATION_ID: number;
  NAME: string;
  CITY?: string;
  STATE?: string;
};

export default function LocationPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<LocationRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [revenue30, setRevenue30] = useState<number | null>(null);
  const [waste30, setWaste30] = useState<number | null>(null);
  const [rating30, setRating30] = useState<number | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [movingAvg, setMovingAvg] = useState<boolean>(false);
  const [smoothWindow, setSmoothWindow] = useState<number>(7);
  const [orderTypeSeries, setOrderTypeSeries] = useState<Array<{ date: string; dinein: number; delivery: number; takeout: number }>>([]);
  const [showDinein, setShowDinein] = useState(true);
  const [showTakeout, setShowTakeout] = useState(true);
  const [showDelivery, setShowDelivery] = useState(true);
  const [locationsList, setLocationsList] = useState<Array<LocationRow>>([]);
  const [compareId, setCompareId] = useState<number | null>(null);
  const [compareSalesSeries, setCompareSalesSeries] = useState<Array<{ date: string; revenue: number }>>([]);
  const [compareWasteSeries, setCompareWasteSeries] = useState<Array<{ date: string; waste: number }>>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [snapshotEnabled, setSnapshotEnabled] = useState<boolean>(() => (typeof window !== 'undefined' && localStorage.getItem('snapshotEnabled') === '1'));
  const [exportOpen, setExportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesSeries, setSalesSeries] = useState<Array<{ date: string; revenue: number }>>([]);
  const [wasteSeries, setWasteSeries] = useState<Array<{ date: string; waste: number }>>([]);
  const [recentReviews, setRecentReviews] = useState<Array<{ DATE: string; RATING: number; COMMENT: string }>>([]);
  const [inventoryRows, setInventoryRows] = useState<Array<{ ITEM_NAME: string; WASTE_COST: number; DATE: string }>>([]);

  useEffect(() => {
    // load locations list once for compare selector
    let mounted = true;
    (async function loadLocations() {
      try {
        const rows = await querySnowflake<LocationRow>(`SELECT LOCATION_ID, NAME, CITY, STATE FROM LOCATIONS ORDER BY NAME`);
        if (!mounted) return;
        setLocationsList(rows || []);
      } catch (err) {
        // non-fatal
        console.warn('Failed to load locations list', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // persist snapshot toggle
  useEffect(() => {
    try { localStorage.setItem('snapshotEnabled', snapshotEnabled ? '1' : '0'); } catch (e) {}
  }, [snapshotEnabled]);

  // load compare series when compareId or rangeDays change
  useEffect(() => {
    if (!compareId) {
      setCompareSalesSeries([]);
      setCompareWasteSeries([]);
      return;
    }
    let mounted = true;
    (async function loadCompare() {
      try {
        const [sRows, wRows] = await Promise.all([
          querySnowflake<{ DATE: string; REVENUE: number }>(
            `SELECT SALE_DATE AS DATE, SUM(REVENUE) AS REVENUE FROM DAILY_SALES WHERE LOCATION_ID = ${compareId} AND SALE_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) GROUP BY SALE_DATE ORDER BY SALE_DATE`
          ),
          querySnowflake<{ DATE: string; WASTE_COST: number }>(
            `SELECT RECORD_DATE AS DATE, SUM(WASTE_COST) AS WASTE_COST FROM INVENTORY WHERE LOCATION_ID = ${compareId} AND RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) GROUP BY RECORD_DATE ORDER BY RECORD_DATE`
          ),
        ]);
        if (!mounted) return;
        setCompareSalesSeries((sRows || []).map((r) => ({ date: String(r.DATE).slice(0, 10), revenue: Number((r as any).REVENUE) || 0 })));
        setCompareWasteSeries((wRows || []).map((r) => ({ date: String(r.DATE).slice(0, 10), waste: Number((r as any).WASTE_COST) || 0 })));
      } catch (err) {
        console.warn('compare load failed', err);
      }
    })();
    return () => { mounted = false; };
  }, [compareId, rangeDays]);
  useEffect(() => {
    if (!id) return;
    const locId = Number(id);
    let mounted = true;
    const to = setTimeout(() => {
      async function load() {
        setLoading(true);
        try {
          setError(null);
          const locRows = await querySnowflake<LocationRow>(
            `SELECT LOCATION_ID, NAME, CITY, STATE FROM LOCATIONS WHERE LOCATION_ID = ${locId}`
          );
          if (!mounted) return;
          setLocation(locRows[0] ?? null);

          const [revRows, wasteRows, ratingRows, salesRows, wasteSeriesRows, orderTypeRows, reviews, inventory] = await Promise.all([
            querySnowflake<{ REVENUE_30D: number }>(
              `SELECT SUM(REVENUE) AS REVENUE_30D FROM DAILY_SALES WHERE LOCATION_ID = ${locId} AND SALE_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE())`
            ),
            querySnowflake<{ WASTE_30D: number }>(
              `SELECT SUM(WASTE_COST) AS WASTE_30D FROM INVENTORY WHERE LOCATION_ID = ${locId} AND RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE())`
            ),
            querySnowflake<{ AVG_RATING: number }>(
              `SELECT AVG(RATING) AS AVG_RATING FROM CUSTOMER_REVIEWS WHERE LOCATION_ID = ${locId} AND REVIEW_DATE >= DATEADD(day, -${Math.min(rangeDays,90)}, CURRENT_DATE())`
            ),
            // time series for sales (last N days)
            querySnowflake<{ DATE: string; REVENUE: number }>(
              `SELECT SALE_DATE AS DATE, SUM(REVENUE) AS REVENUE FROM DAILY_SALES WHERE LOCATION_ID = ${locId} AND SALE_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) GROUP BY SALE_DATE ORDER BY SALE_DATE`
            ),
            // time series for waste (last N days)
            querySnowflake<{ DATE: string; WASTE_COST: number }>(
              `SELECT RECORD_DATE AS DATE, SUM(WASTE_COST) AS WASTE_COST FROM INVENTORY WHERE LOCATION_ID = ${locId} AND RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) GROUP BY RECORD_DATE ORDER BY RECORD_DATE`
            ),
            // breakdown by order type
            querySnowflake<{ DATE: string; ORDER_TYPE: string; REVENUE: number }>(
              `SELECT SALE_DATE AS DATE, ORDER_TYPE, SUM(REVENUE) AS REVENUE FROM DAILY_SALES WHERE LOCATION_ID = ${locId} AND SALE_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) GROUP BY SALE_DATE, ORDER_TYPE ORDER BY SALE_DATE`
            ),
            querySnowflake<{ DATE: string; RATING: number; COMMENT: string }>(
              `SELECT REVIEW_DATE AS DATE, RATING, REVIEW_TEXT AS COMMENT FROM CUSTOMER_REVIEWS WHERE LOCATION_ID = ${locId} ORDER BY REVIEW_DATE DESC LIMIT 5`
            ),
            querySnowflake<{ ITEM_NAME: string; WASTE_COST: number; DATE: string }>(
              `SELECT RECORD_DATE AS DATE, CATEGORY AS ITEM_NAME, WASTE_COST FROM INVENTORY WHERE LOCATION_ID = ${locId} AND RECORD_DATE >= DATEADD(day, -${rangeDays}, CURRENT_DATE()) ORDER BY RECORD_DATE DESC LIMIT 10`
            ),
          ]);

          setRevenue30(Number(revRows?.[0]?.REVENUE_30D ?? 0));
          setWaste30(Number(wasteRows?.[0]?.WASTE_30D ?? 0));
          setRating30(Number(ratingRows?.[0]?.AVG_RATING ?? 0));
          setSalesSeries((salesRows || []).map((r) => ({ date: String(r.DATE).slice(0, 10), revenue: Number((r as any).REVENUE) || 0 })));
          setWasteSeries((wasteSeriesRows || []).map((r) => ({ date: String(r.DATE).slice(0, 10), waste: Number((r as any).WASTE_COST) || 0 })));
          // pivot order type rows into a per-date object
          const otMap = new Map<string, { dinein: number; delivery: number; takeout: number }>();
          (orderTypeRows || []).forEach((r: any) => {
            const d = String(r.DATE).slice(0, 10);
            if (!otMap.has(d)) otMap.set(d, { dinein: 0, delivery: 0, takeout: 0 });
            const cur = otMap.get(d)!;
            const t = String(r.ORDER_TYPE || "").toLowerCase();
            if (t.includes("delivery")) cur.delivery += Number(r.REVENUE) || 0;
            else if (t.includes("takeout")) cur.takeout += Number(r.REVENUE) || 0;
            else cur.dinein += Number(r.REVENUE) || 0;
          });
          const otArr = Array.from(otMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
          setOrderTypeSeries(otArr);
          setRecentReviews(reviews || []);
          setInventoryRows(inventory || []);
        } catch (err) {
          console.error("Location load error", err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          if (mounted) setLoading(false);
        }
      }
      load();
    }, 300);
    return () => {
      mounted = false;
      clearTimeout(to);
    };
  }, [id, rangeDays]);

  // helper: build chart data aligned across dates
  const chartData = useMemo(() => {
    const dates = Array.from(new Set([...salesSeries.map((s) => s.date), ...wasteSeries.map((w) => w.date)])).sort();
    let base = dates.map((d) => ({
      date: d,
      revenue: salesSeries.find((s) => s.date === d)?.revenue ?? 0,
      waste: wasteSeries.find((w) => w.date === d)?.waste ?? 0,
    }));
    if (!movingAvg) return base;
    // simple moving average with configurable window
    const k = Math.max(1, smoothWindow);
    const smoothed = base.map((_, i) => {
      const start = Math.max(0, i - (k - 1));
      const window = base.slice(start, i + 1);
      const rev = Math.round(window.reduce((s, x) => s + x.revenue, 0) / window.length);
      const wst = Math.round(window.reduce((s, x) => s + x.waste, 0) / window.length);
      return { date: base[i].date, revenue: rev, waste: wst };
    });
    return smoothed;
  }, [salesSeries, wasteSeries, movingAvg]);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return inventoryRows;
    const s = searchTerm.toLowerCase();
    return inventoryRows.filter(r => (r.ITEM_NAME || "").toLowerCase().includes(s));
  }, [inventoryRows, searchTerm]);

  const filteredReviews = useMemo(() => {
    if (!searchTerm) return recentReviews;
    const s = searchTerm.toLowerCase();
    return recentReviews.filter(r => (r.COMMENT || "").toLowerCase().includes(s));
  }, [recentReviews, searchTerm]);

  // merged chart data with optional compare overlay
  const mergedChartData = useMemo(() => {
    const base = chartData.map(d => ({ ...d }));
    if (!compareSalesSeries.length && !compareWasteSeries.length) return base;
    const cmpMapRev = new Map(compareSalesSeries.map(c => [c.date, c.revenue]));
    const cmpMapWst = new Map(compareWasteSeries.map(c => [c.date, c.waste]));
    return base.map(d => ({ ...d, compareRevenue: cmpMapRev.get(d.date) ?? 0, compareWaste: cmpMapWst.get(d.date) ?? 0 }));
  }, [chartData, compareSalesSeries, compareWasteSeries]);

  // Anomaly detection: compare last 7 days avg vs previous 7 days
  const anomaly = useMemo(() => {
    const n = 7;
    if (chartData.length < n * 2) return null;
    const last = chartData.slice(-n).map((d) => d.revenue || 0);
    const prev = chartData.slice(-n * 2, -n).map((d) => d.revenue || 0);
    const avgLast = last.reduce((s, x) => s + x, 0) / last.length;
    const avgPrev = prev.reduce((s, x) => s + x, 0) / prev.length;
    if (avgPrev <= 0) return null;
    const change = (avgLast - avgPrev) / avgPrev;
    if (change <= -0.3) {
      return {
        type: 'drop',
        pct: Math.round(Math.abs(change) * 100),
        avgPrev: Math.round(avgPrev),
        avgLast: Math.round(avgLast),
      };
    }
    return null;
  }, [chartData]);

  // quick insights
  const insights = useMemo(() => {
    // top wasted item
    const byItem: Record<string, number> = {};
    inventoryRows.forEach((r) => { byItem[r.ITEM_NAME] = (byItem[r.ITEM_NAME] || 0) + Number(r.WASTE_COST || 0); });
    const topItem = Object.keys(byItem).length === 0 ? null : Object.entries(byItem).sort((a,b)=>b[1]-a[1])[0];
    // best order type
    const otTotals = { dinein: 0, takeout: 0, delivery: 0 };
    orderTypeSeries.forEach((r) => { otTotals.dinein += r.dinein; otTotals.takeout += r.takeout; otTotals.delivery += r.delivery; });
    const bestOrderType = Object.entries(otTotals).sort((a,b)=>b[1]-a[1])[0];
    // lowest-rated review
    const lowest = recentReviews.length === 0 ? null : recentReviews.slice().sort((a,b) => a.RATING - b.RATING)[0];
    return { topItem: topItem ? { name: topItem[0], cost: topItem[1] } : null, bestOrderType: bestOrderType ? { type: bestOrderType[0], value: bestOrderType[1] } : null, lowestReview: lowest };
  }, [inventoryRows, orderTypeSeries, recentReviews]);

  async function sendSnapshotNow() {
    // generate two CSVs and call mock mailer
    const chartCsvRows = chartData.map(r => ({ date: r.date, revenue: r.revenue, waste: r.waste, compareRevenue: (r as any).compareRevenue, compareWaste: (r as any).compareWaste }));
    const invRows = filteredInventory.map(r => ({ date: r.DATE, item: r.ITEM_NAME, waste_cost: r.WASTE_COST }));
    // create CSV strings
    const toCsv = (rows: any[]) => {
      if (!rows.length) return '';
      const keys = Object.keys(rows[0]);
      return [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    };
    const chartCsv = toCsv(chartCsvRows);
    const invCsv = toCsv(invRows);
    // download as demo attachments and record mock email
    downloadCSV(`location-${id}-snapshot-chart.csv`, chartCsvRows);
    downloadCSV(`location-${id}-snapshot-inventory.csv`, invRows);
    try {
      await sendMockEmail('demo@localhost', `Snapshot for location ${id}`, `Attached snapshot for location ${id}`, [ { name: 'chart.csv', content: chartCsv }, { name: 'inventory.csv', content: invCsv } ]);
      alert('Snapshot sent (demo) — also downloaded CSVs.');
    } catch (e) {
      alert('Failed to send snapshot (demo).');
    }
  }

  function downloadCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows || rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
      const v = r[k];
      if (v == null) return '';
      const s = String(v).replace(/\"/g, '"');
      return `"${s.replace(/"/g, '""')}"`;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/scorecard">← Back to Scorecard</Link>
          <h1 className="text-2xl font-bold">Location Details</h1>
        </div>
        <ThemeToggle />
      </nav>
      {loading && <p>Loading…</p>}
      {error && (
        <div className="mt-3 rounded border p-3 bg-destructive/10 text-destructive">{error}</div>
      )}
      {!loading && (
        <div className="mt-6 space-y-6">
          <div className="rounded border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{location?.NAME ?? `Location ${id}`}</h2>
                <p className="text-sm text-muted-foreground">{location?.CITY ?? ""} {location?.STATE ?? ""}</p>
              </div>
                <div className="flex gap-3 items-center">
                  <label className="text-sm text-muted-foreground">Range</label>
                  <select aria-label="Date range" value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))} className="rounded border px-2 py-1">
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={60}>Last 60 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={180}>Last 180 days</option>
                    <option value={365}>Last 365 days</option>
                    <option value={1825}>All (5 years)</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input aria-label="Toggle smoothing" type="checkbox" checked={movingAvg} onChange={(e) => setMovingAvg(e.target.checked)} />
                    <span className="text-muted-foreground">SMoothed</span>
                  </label>
                  {movingAvg && (
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-sm text-muted-foreground">Window</span>
                      <select value={smoothWindow} onChange={(e) => setSmoothWindow(Number(e.target.value))} className="rounded border px-2 py-1">
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                        <option value={14}>14</option>
                      </select>
                    </label>
                  )}
                  <div className="flex items-center gap-2 ml-4">
                    <div className="relative">
                      <button
                        onClick={() => setExportOpen((s) => !s)}
                        aria-haspopup="true"
                        aria-expanded={exportOpen}
                        className="rounded border px-2 py-1 text-sm"
                      >
                        Export ▾
                      </button>
                      {exportOpen && (
                        <div className="absolute right-0 mt-1 bg-background border rounded shadow z-10">
                          <button className="block w-full text-left px-3 py-2 text-sm" onClick={() => { downloadCSV(`location-${id}-chart.csv`, chartData); setExportOpen(false); }}>Chart CSV</button>
                          <button className="block w-full text-left px-3 py-2 text-sm" onClick={() => { downloadCSV(`location-${id}-ordertype.csv`, orderTypeSeries); setExportOpen(false); }}>Order-type CSV</button>
                          <button className="block w-full text-left px-3 py-2 text-sm" onClick={() => { downloadCSV(`location-${id}-inventory.csv`, inventoryRows); setExportOpen(false); }}>Inventory CSV</button>
                        </div>
                      )}
                    </div>

                    <input
                      aria-label="Search reviews and inventory"
                      placeholder="Search reviews / items"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded border px-2 py-1 text-sm ml-2"
                    />

                    <label className="flex items-center gap-2 text-sm ml-2">
                      <span className="text-sm text-muted-foreground">Compare</span>
                      <select aria-label="Compare location" value={compareId ?? ""} onChange={(e) => setCompareId(e.target.value ? Number(e.target.value) : null)} className="rounded border px-2 py-1">
                        <option value="">— none —</option>
                        {locationsList.map((l) => (
                          <option key={l.LOCATION_ID} value={l.LOCATION_ID}>{l.NAME}</option>
                        ))}
                      </select>
                    </label>
                    {compareId && (
                      <button title="Clear compare" aria-label="Clear compare" className="rounded border px-2 py-1 text-sm" onClick={() => setCompareId(null)}>Clear</button>
                    )}

                    <div className="flex items-center gap-2 ml-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={snapshotEnabled} onChange={(e) => setSnapshotEnabled(e.target.checked)} />
                        <span className="text-muted-foreground">Daily snapshot (demo)</span>
                      </label>
                      <button className="rounded border px-2 py-1 text-sm" onClick={() => sendSnapshotNow()}>Send snapshot now</button>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {anomaly && (
            <div className="rounded border-destructive bg-destructive/10 text-destructive p-3">
              <strong>Alert:</strong> Revenue dropped {anomaly.pct}% vs previous period (avg {anomaly.avgPrev} → {anomaly.avgLast}). Consider investigating recent promotions, staffing, or inventory waste.
            </div>
          )}

          {/* Quick insights panel */}
          <div className="rounded border p-4">
            <h3 className="font-medium">Quick Insights</h3>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div className="p-3 border rounded">
                <div className="text-xs text-muted-foreground">Top wasted item</div>
                {insights.topItem ? (
                  <div className="mt-2 font-semibold">{insights.topItem.name} — ${Number(insights.topItem.cost).toFixed(2)}</div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">No data</div>
                )}
              </div>

              <div className="p-3 border rounded">
                <div className="text-xs text-muted-foreground">Best order type</div>
                {insights.bestOrderType ? (
                  <div className="mt-2 font-semibold capitalize">{insights.bestOrderType.type.replace(/_/g,' ')} — ${Number(insights.bestOrderType.value).toLocaleString()}</div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">No data</div>
                )}
              </div>

              <div className="p-3 border rounded">
                <div className="text-xs text-muted-foreground">Lowest-rated review</div>
                {insights.lowestReview ? (
                  <div className="mt-2">
                    <div className="text-sm">{insights.lowestReview.COMMENT}</div>
                    <div className="text-xs text-muted-foreground mt-1">{insights.lowestReview.DATE?.slice(0,10)} — ⭐ {insights.lowestReview.RATING}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">No reviews</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded border p-4">
              <div className="text-sm text-muted-foreground">Revenue ({rangeDays}d)</div>
                <div className="text-xl font-semibold">${(revenue30 ?? 0).toLocaleString()}</div>
                <div style={{ height: 80 }} className="mt-2" role="img" aria-label={`Revenue trend for last ${rangeDays} days` }>
                {loading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="w-6 h-6 border-4 border-muted-200 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-20 flex items-center justify-center border border-dashed rounded text-sm text-muted-foreground bg-muted/20">No revenue data for the selected range.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={mergedChartData.slice(-rangeDays)}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--chart-revenue)" strokeWidth={2} dot={false} />
                      {compareId && <Line type="monotone" dataKey="compareRevenue" stroke="var(--chart-compare)" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded border p-4">
              <div className="text-sm text-muted-foreground">Waste ({rangeDays}d)</div>
              <div className="text-xl font-semibold">${(waste30 ?? 0).toLocaleString()}</div>
              <div style={{ height: 80 }} className="mt-2" role="img" aria-label={`Waste trend for last ${rangeDays} days` }>
                {loading ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="w-6 h-6 border-4 border-muted-200 border-t-destructive rounded-full animate-spin" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-20 flex items-center justify-center border border-dashed rounded text-sm text-muted-foreground bg-muted/20">No waste data for the selected range.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={mergedChartData.slice(-rangeDays)}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="waste" stroke="var(--chart-waste)" strokeWidth={2} dot={false} />
                      {compareId && <Line type="monotone" dataKey="compareWaste" stroke="var(--chart-compare)" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded border p-4">
              <div className="text-sm text-muted-foreground">Avg Rating (30d)</div>
              <div className="text-xl font-semibold">{(rating30 ?? 0).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mt-2">Recent reviews</div>
              <ul className="mt-2 space-y-2">
                {loading ? (
                  <li className="flex items-center justify-center h-16"><div className="w-6 h-6 border-4 border-muted-200 border-t-primary rounded-full animate-spin" /></li>
                ) : filteredReviews.length === 0 ? (
                  <li className="h-16 flex items-center justify-center border border-dashed rounded text-sm text-muted-foreground bg-muted/20">No recent reviews</li>
                ) : (
                  filteredReviews.map((r, i) => (
                    <li key={i} className="text-sm border rounded p-2">
                      <div className="flex justify-between text-xs text-muted-foreground"><span>{r.DATE?.slice(0,10)}</span><span>⭐ {r.RATING}</span></div>
                      <div className="mt-1">{r.COMMENT}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="rounded border p-4">
            <h3 className="font-medium">Inventory — recent waste items</h3>
            <div className="overflow-x-auto mt-3">
              {loading ? (
                <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-muted-200 border-t-primary rounded-full animate-spin" /></div>
              ) : filteredInventory.length === 0 ? (
                <div className="h-32 flex items-center justify-center border border-dashed rounded text-sm text-muted-foreground bg-muted/20">No inventory waste rows for the selected range.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Item</th>
                      <th className="pb-2">Waste Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">{r.DATE?.slice(0,10)}</td>
                        <td className="py-2">{r.ITEM_NAME}</td>
                        <td className="py-2">${Number(r.WASTE_COST).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Sales by Order Type</h3>
              <div className="flex gap-3 items-center">
                <label className="text-sm"><input type="checkbox" checked={showDinein} onChange={(e) => setShowDinein(e.target.checked)} /> <span className="ml-2">Dine-in</span></label>
                <label className="text-sm"><input type="checkbox" checked={showTakeout} onChange={(e) => setShowTakeout(e.target.checked)} /> <span className="ml-2">Takeout</span></label>
                <label className="text-sm"><input type="checkbox" checked={showDelivery} onChange={(e) => setShowDelivery(e.target.checked)} /> <span className="ml-2">Delivery</span></label>
                <button className="rounded border px-2 py-1 text-sm" onClick={() => downloadCSV(`location-${id}-chart.csv`, chartData)}>Export CSV</button>
              </div>
            </div>

            {loading ? (
              <div className="mt-3 flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-muted-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : orderTypeSeries.length === 0 ? (
              <div className="mt-3 h-40 flex items-center justify-center border border-dashed rounded text-sm text-muted-foreground bg-muted/20">No order-type data for the selected range.</div>
            ) : (
              <>
                <div className="mt-2 flex gap-3 text-sm aria-hidden">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]" /> Dine-in</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F59E0B]" /> Takeout</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-var(--chart-delivery)" style={{background: 'var(--chart-delivery)'}} /> Delivery</span>
                </div>
                <div style={{ height: 160 }} className="mt-3" role="img" aria-label={`Sales by order type over last ${rangeDays} days`}>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={orderTypeSeries.slice(-rangeDays)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                    {showDinein && <Line type="monotone" dataKey="dinein" stroke="var(--chart-dinein)" strokeWidth={2} dot={false} />}
                    {showTakeout && <Line type="monotone" dataKey="takeout" stroke="var(--chart-takeout)" strokeWidth={2} dot={false} />}
                    {showDelivery && <Line type="monotone" dataKey="delivery" stroke="var(--chart-delivery)" strokeWidth={2} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Daily table & CSV export for order-type series */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Daily rows</div>
                <div>
                </div>
              </div>
              <div className="overflow-x-auto mt-2" role="region" aria-label="Daily order type rows">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Dine-in</th>
                      <th className="pb-2">Takeout</th>
                      <th className="pb-2">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderTypeSeries.map((r) => (
                      <tr key={r.date} className="border-b last:border-0">
                        <td className="py-2 text-muted-foreground">{r.date}</td>
                        <td className="py-2">${r.dinein.toLocaleString()}</td>
                        <td className="py-2">${r.takeout.toLocaleString()}</td>
                        <td className="py-2">${r.delivery.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
