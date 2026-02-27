import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";

interface Location {
  LOCATION_ID: number;
  NAME: string;
  CITY?: string;
}

interface RevAgg {
  LOCATION_ID: number;
  REV_30: number;
  REV_PREV_30: number;
}

interface RatingAgg {
  LOCATION_ID: number;
  AVG_RATING: number;
}

export default function ScorecardPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [revAgg, setRevAgg] = useState<RevAgg[]>([]);
  const [ratings, setRatings] = useState<RatingAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [locs, revs, rats] = await Promise.all([
          querySnowflake<Location>(
            "SELECT LOCATION_ID, NAME, CITY FROM LOCATIONS ORDER BY LOCATION_ID"
          ),
          querySnowflake<RevAgg>(
            `SELECT LOCATION_ID,
              SUM(CASE WHEN SALE_DATE >= DATEADD(day, -30, CURRENT_DATE) THEN REVENUE ELSE 0 END) AS REV_30,
              SUM(CASE WHEN SALE_DATE >= DATEADD(day, -60, CURRENT_DATE) AND SALE_DATE < DATEADD(day, -30, CURRENT_DATE) THEN REVENUE ELSE 0 END) AS REV_PREV_30
            FROM DAILY_SALES GROUP BY LOCATION_ID`
          ),
          querySnowflake<RatingAgg>(
            `SELECT LOCATION_ID, ROUND(AVG(RATING),2) AS AVG_RATING FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID`
          ),
        ]);

        setLocations(locs);
        setRevAgg(revs);
        setRatings(rats);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Merge data into rows
  const rows = useMemo(() => {
    const revMap = new Map<number, RevAgg>();
    revAgg.forEach((r) => revMap.set(r.LOCATION_ID, r));
    const ratingMap = new Map<number, number>();
    ratings.forEach((r) => ratingMap.set(r.LOCATION_ID, Number(r.AVG_RATING) || 0));

    return locations.map((loc) => {
      const r = revMap.get(loc.LOCATION_ID) ?? ({ REV_30: 0, REV_PREV_30: 0, LOCATION_ID: loc.LOCATION_ID } as RevAgg);
      const avg = ratingMap.get(loc.LOCATION_ID) ?? 0;
      const trend = r.REV_PREV_30 === 0 ? 0 : (r.REV_30 - r.REV_PREV_30) / (r.REV_PREV_30 || 1);
      const needsAttention = avg < 3.5 || (r.REV_PREV_30 > 0 && r.REV_30 < r.REV_PREV_30 * 0.9);
      return {
        id: loc.LOCATION_ID,
        name: loc.NAME,
        city: loc.CITY,
        revenue: Math.round(Number(r.REV_30) || 0),
        avgRating: Number(avg),
        trend,
        needsAttention,
      };
    });
  }, [locations, revAgg, ratings]);

  // Sorting
  const [sortKey, setSortKey] = useState<"name" | "revenue" | "avgRating" | "trend">("revenue");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const s = [...rows];
    s.sort((a, b) => {
      let v = 0;
      if (sortKey === "name") v = a.name.localeCompare(b.name);
      if (sortKey === "revenue") v = a.revenue - b.revenue;
      if (sortKey === "avgRating") v = a.avgRating - b.avgRating;
      if (sortKey === "trend") v = a.trend - b.trend;
      return dir === "asc" ? v : -v;
    });
    return s;
  }, [rows, sortKey, dir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xs text-primary hover:underline font-medium">← Back to Home</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-widest text-muted-foreground uppercase">Location Scorecard</span>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Location Scorecard</h1>
          <p className="text-muted-foreground mt-2">Overview of all locations with key metrics. Click a row to drill down.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
            {error && <div className="py-6 text-destructive">{error}</div>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">#</th>
                      <th onClick={() => toggleSort("name")} className="pb-2 font-medium text-muted-foreground cursor-pointer">Location</th>
                      <th className="pb-2 font-medium text-muted-foreground">City</th>
                      <th onClick={() => toggleSort("revenue")} className="pb-2 font-medium text-muted-foreground cursor-pointer">Revenue (30d)</th>
                      <th onClick={() => toggleSort("avgRating")} className="pb-2 font-medium text-muted-foreground cursor-pointer">Avg Rating</th>
                      <th onClick={() => toggleSort("trend")} className="pb-2 font-medium text-muted-foreground cursor-pointer">Trend</th>
                      <th className="pb-2 font-medium text-muted-foreground">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r, i) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 font-mono text-xs">{i + 1}</td>
                        <td className="py-2.5 font-medium">
                          <Link to={`/location/${r.id}`} className="text-primary hover:underline">{r.name}</Link>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{r.city}</td>
                        <td className="py-2.5">${r.revenue.toLocaleString()}</td>
                        <td className="py-2.5">{r.avgRating ? r.avgRating.toFixed(1) : "—"}</td>
                        <td className="py-2.5">{r.trend === 0 ? "—" : `${(r.trend * 100).toFixed(0)}%`}</td>
                        <td className="py-2.5">
                          {r.needsAttention ? <span className="inline-flex items-center gap-2 text-destructive"><span className="w-2 h-2 rounded-full bg-destructive"/>Needs attention</span> : <span className="text-muted-foreground">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
