import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";

/* ───────────── TYPES ───────────── */

type LocationRow = {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  REVENUE: number;
  AVG_RATING: number;
};

type Daily = { SALE_DATE: string; REVENUE: number };
type OrderType = { ORDER_TYPE: string; TOTAL: number };
type Review = { CUSTOMER_NAME: string; RATING: number; REVIEW_TEXT: string };
type Waste = { CATEGORY: string; TOTAL_WASTE_COST: number };

/* ───────────── APP ───────────── */

export default function App() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [selected, setSelected] = useState<LocationRow | null>(null);

  const [trend, setTrend] = useState<Daily[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [waste, setWaste] = useState<Waste[]>([]);

  /* ───────── LOAD SCORECARD ───────── */

  useEffect(() => {
    async function load() {
      setLoading(true);
      const rows = await querySnowflake<LocationRow>(`
        SELECT l.LOCATION_ID, l.NAME, l.CITY,
               SUM(s.REVENUE) REVENUE,
               AVG(r.RATING) AVG_RATING
        FROM LOCATIONS l
        LEFT JOIN DAILY_SALES s ON s.LOCATION_ID = l.LOCATION_ID
        LEFT JOIN CUSTOMER_REVIEWS r ON r.LOCATION_ID = l.LOCATION_ID
        WHERE s.SALE_DATE >= (SELECT MAX(SALE_DATE) FROM DAILY_SALES) - ${days}
        GROUP BY 1, 2, 3
        ORDER BY REVENUE DESC
      `);

      setLocations(
        rows.map((r) => ({
          ...r,
          REVENUE: Number(r.REVENUE),
          AVG_RATING: Number(r.AVG_RATING),
        }))
      );
      setLoading(false);
    }
    load();
  }, [days]);

  /* ───────── LOAD DRILLDOWN ───────── */

  useEffect(() => {
    if (!selected) return;
    const activeLocation = selected; // Fixes 'possibly null' error

    async function loadDetail() {
      const [t, o, r, w] = await Promise.all([
        // Formatting date in SQL to avoid JS parsing issues
        querySnowflake<Daily>(`
          SELECT TO_CHAR(SALE_DATE, 'YYYY-MM-DD') as SALE_DATE, SUM(REVENUE) REVENUE
          FROM DAILY_SALES
          WHERE LOCATION_ID = ${activeLocation.LOCATION_ID}
          GROUP BY 1
          ORDER BY SALE_DATE ASC
        `),

        querySnowflake<OrderType>(`
          SELECT ORDER_TYPE, SUM(REVENUE) TOTAL
          FROM DAILY_SALES
          WHERE LOCATION_ID = ${activeLocation.LOCATION_ID}
          GROUP BY ORDER_TYPE
        `),

        querySnowflake<Review>(`
          SELECT CUSTOMER_NAME, RATING, REVIEW_TEXT
          FROM CUSTOMER_REVIEWS
          WHERE LOCATION_ID = ${activeLocation.LOCATION_ID}
          ORDER BY REVIEW_DATE DESC
          LIMIT 5
        `),

        querySnowflake<Waste>(`
          SELECT CATEGORY, SUM(WASTE_COST) TOTAL_WASTE_COST
          FROM INVENTORY
          WHERE LOCATION_ID = ${activeLocation.LOCATION_ID}
          GROUP BY CATEGORY
        `),
      ]);

      setTrend(t.map((x) => ({ ...x, REVENUE: Number(x.REVENUE) })));
      setOrders(o.map((x) => ({ ...x, TOTAL: Number(x.TOTAL) })));
      setReviews(r);
      setWaste(w.map((x) => ({ ...x, TOTAL_WASTE_COST: Number(x.TOTAL_WASTE_COST) })));
    }

    loadDetail();
  }, [selected]);

  const totalRevenue = useMemo(
    () => locations.reduce((a, b) => a + b.REVENUE, 0),
    [locations]
  );

  if (loading) return <Centered>Loading dashboard…</Centered>;

  return (
    <div className="min-h-screen bg-background p-8 space-y-8 text-foreground">
      <h1 className="text-3xl font-bold">Snowcone Operations Dashboard</h1>

      {/* DATE FILTER */}
      <div className="flex gap-2">
        {[7, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 border rounded transition-colors ${
              d === days ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI */}
      <Card>
        <CardContent className="text-xl font-semibold p-6">
          Total Revenue: ${totalRevenue.toLocaleString()}
        </CardContent>
      </Card>

      {/* SCORECARD */}
      <Card>
        <CardHeader>
          <CardTitle>Location Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-left">
                <th className="p-2">Location</th>
                <th className="p-2 text-right">Revenue</th>
                <th className="p-2 text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr
                  key={l.LOCATION_ID}
                  onClick={() => setSelected(l)}
                  className={`cursor-pointer hover:bg-muted border-b last:border-0 ${
                    selected?.LOCATION_ID === l.LOCATION_ID ? "bg-muted" : ""
                  }`}
                >
                  <td className="p-2 font-medium">{l.NAME}</td>
                  <td className="p-2 text-right">${l.REVENUE.toLocaleString()}</td>
                  <td className="p-2 text-right">{l.AVG_RATING.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ───────── DRILLDOWN ───────── */}
      {selected && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">{selected.NAME} Details</h2>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue Trend">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="SALE_DATE"
                  interval="preserveStartEnd"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) return value;
                    const d = String(date.getDate()).padStart(2, '0');
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const y = String(date.getFullYear()).slice(-2);
                    return `${d}-${m}-${y}`;
                  }}
                  fontSize={11}
                />
                <YAxis
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                   formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="REVENUE"
                  stroke="#1e3a8a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartCard>

            <ChartCard title="Order Types">
              <PieChart>
                <Pie
                  data={orders}
                  dataKey="TOTAL"
                  nameKey="ORDER_TYPE"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {orders.map((_, i) => {
                    const pastelColors = ['#FFB3BA', '#ADD8E6', '#B3E5C9', '#E1BEE7', '#FFFACD'];
                    return <Cell key={`cell-${i}`} fill={pastelColors[i % pastelColors.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b last:border-0 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-500">{"⭐".repeat(r.RATING)}</span>
                      <span className="font-semibold">{r.CUSTOMER_NAME}</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{r.REVIEW_TEXT}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <ChartCard title="Inventory Waste by Category">
              <BarChart data={waste}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="CATEGORY" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip />
                <Bar dataKey="TOTAL_WASTE_COST" fill="#FFB3BA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {children as React.ReactElement}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="h-screen flex items-center justify-center bg-background">{children}</div>;
}