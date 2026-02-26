import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";

// ── Types ───────────────────────────────────────────────────────
interface Location {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
}

interface DailySale {
  LOCATION_ID: number;
  REVENUE: number;
}

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch some sample data to prove the Snowflake connection works
  useEffect(() => {
    async function fetchData() {
      try {
        const [locs, dailySales] = await Promise.all([
          querySnowflake<Location>(
            "SELECT LOCATION_ID, NAME, CITY, STATE FROM LOCATIONS ORDER BY LOCATION_ID"
          ),
          querySnowflake<DailySale>(
            "SELECT LOCATION_ID, REVENUE FROM DAILY_SALES"
          ),
        ]);
        setLocations(locs);
        setSales(dailySales);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggregate total revenue per location for the sample chart
  const revenueByLocation = useMemo(() => {
    const totals: Record<number, number> = {};
    for (const s of sales) {
      totals[s.LOCATION_ID] =
        (totals[s.LOCATION_ID] || 0) + Number(s.REVENUE);
    }
    return locations
      .map((loc) => ({
        name: loc.NAME,
        revenue: Math.round(totals[loc.LOCATION_ID] || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [locations, sales]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          The Snowcone Warehouse — Starter
        </span>
        <Link
          to="/data"
          className="text-xs text-primary underline font-bold"
        >
          View Database Schema →
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Hero */}
        <div>
          <p className="text-xs tracking-widest text-primary font-semibold mb-2">
            YOUR STARTING POINT
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            SNOWCONE TEST PUSH
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            This page confirms your Snowflake connection is working and shows
            you the basics. Once you're ready, delete this file and start
            building your dashboard.
          </p>
        </div>

        {/* ── Getting Started Steps ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-3">
              <Step
                number={1}
                title="Explore the data"
              >
                Head to the{" "}
                <Link to="/data" className="text-primary underline font-bold">
                  Database Schema
                </Link>{" "}
                page to see every table, column, and some example queries.
                You can also open Snowflake directly and run queries to understand
                the data.
              </Step>

              <Step
                number={2}
                title="Try querying from your code"
              >
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  querySnowflake()
                </code>{" "}
                is ready to go — see the example below. The chart on this page
                is built with it.
              </Step>

              <Step number={3} title="Build your dashboard">
                Delete{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  src/App.tsx
                </code>{" "}
                (this file) and{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  src/pages/Data.tsx
                </code>{" "}
                then start building. You can also remove the router in{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  main.tsx
                </code>{" "}
                if you don't need it.
              </Step>

              <Step number={4} title="Submit">
                Run{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  ./submit.sh your.name@datamavericks.com
                </code>{" "}
                and your app goes live.
              </Step>
            </div>
          </CardContent>
        </Card>

        {/* ── How to Query ─────────────────────────────────────── */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">How to query Snowflake</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-foreground text-background rounded-md p-4 overflow-x-auto">
              {`import { querySnowflake } from "@/lib/snowflake";

// Fetch all locations
const locations = await querySnowflake("SELECT * FROM LOCATIONS");

// Revenue by location with a JOIN
const revenue = await querySnowflake(\`
  SELECT l.NAME, SUM(s.REVENUE) AS TOTAL_REVENUE
  FROM DAILY_SALES s
  JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
  GROUP BY l.NAME
  ORDER BY TOTAL_REVENUE DESC
\`);`}
            </pre>
          </CardContent>
        </Card>

        {/* ── Connection Status / Sample Chart ─────────────────── */}
        {loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Connecting to Snowflake...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="font-semibold text-destructive">
                Connection failed
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <p className="text-sm text-muted-foreground mt-3">
                Make sure you've copied{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                  .env.example
                </code>{" "}
                to{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                  .env
                </code>{" "}
                and that the{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                  rsa_key.p8
                </code>{" "}
                file is in the project root.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>
                Snowflake Connected — Revenue by Location
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Live data from your SNOWCONE_DB database. {locations.length}{" "}
                locations loaded.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenueByLocation}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `$${Number(v).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── What You Need to Build ───────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>What You Need to Build</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Spec title="Location Scorecard">
              Table/grid of all locations with revenue, avg rating, and trend.
              Sortable. Flag locations needing attention.
            </Spec>
            <Spec title="Historical Sales View">
              Charts showing sales over time by location. Breakdown by order type
              (dine-in, takeout, delivery).
            </Spec>
            <Spec title="Inventory Waste Tracker">
              Waste by location and category. Flag above-threshold locations.
              Show waste trends.
            </Spec>
            <Spec title="Location Drill-Down">
              Click a location to see detailed info, sales charts, reviews, and
              inventory.
            </Spec>
            <Spec title="Interactive Elements">
              Date range filter, location comparison, search, or similar. The
              dashboard should not be static.
            </Spec>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Data Mavericks — The Snowcone Warehouse Challenge
      </footer>
    </div>
  );
}

// ── Small helper components (inline, no separate files needed) ───

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function Spec({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-primary/30 pl-3">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
