// import { useEffect, useState, useMemo } from "react";
// import { Link } from "react-router-dom";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { querySnowflake } from "@/lib/snowflake";

// // ── Types ───────────────────────────────────────────────────────
// interface Location {
//   LOCATION_ID: number;
//   NAME: string;
//   CITY: string;
//   STATE: string;
// }

// interface DailySale {
//   LOCATION_ID: number;
//   REVENUE: number;
// }

// // ── App ─────────────────────────────────────────────────────────
// export default function App() {
//   const [locations, setLocations] = useState<Location[]>([]);
//   const [sales, setSales] = useState<DailySale[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch some sample data to prove the Snowflake connection works
//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const [locs, dailySales] = await Promise.all([
//           querySnowflake<Location>(
//             "SELECT LOCATION_ID, NAME, CITY, STATE FROM LOCATIONS ORDER BY LOCATION_ID"
//           ),
//           querySnowflake<DailySale>(
//             "SELECT LOCATION_ID, REVENUE FROM DAILY_SALES"
//           ),
//         ]);
//         setLocations(locs);
//         setSales(dailySales);
//       } catch (e) {
//         setError(e instanceof Error ? e.message : "Failed to connect");
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, []);

//   // Aggregate total revenue per location for the sample chart
//   const revenueByLocation = useMemo(() => {
//     const totals: Record<number, number> = {};
//     for (const s of sales) {
//       totals[s.LOCATION_ID] =
//         (totals[s.LOCATION_ID] || 0) + Number(s.REVENUE);
//     }
//     return locations
//       .map((loc) => ({
//         name: loc.NAME,
//         revenue: Math.round(totals[loc.LOCATION_ID] || 0),
//       }))
//       .sort((a, b) => b.revenue - a.revenue);
//   }, [locations, sales]);

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Nav */}
//       <nav className="border-b px-6 py-3 flex items-center justify-between">
//         <span className="text-xs tracking-widest text-muted-foreground uppercase">
//           The Snowcone Warehouse — Starter
//         </span>
//         <Link
//           to="/data"
//           className="text-xs text-primary underline font-bold"
//         >
//           View Database Schema →
//         </Link>
//       </nav>

//       <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
//         {/* Hero */}
//         <div>
//           <p className="text-xs tracking-widest text-primary font-semibold mb-2">
//             YOUR STARTING POINT
//           </p>
//           <h1 className="text-3xl font-bold tracking-tight">
//             Welcome to the Snowcone Starter
//           </h1>
//           <p className="text-muted-foreground mt-2 max-w-xl">
//             This page confirms your Snowflake connection is working and shows
//             you the basics. Once you're ready, delete this file and start
//             building your dashboard.
//           </p>
//         </div>

//         {/* ── Getting Started Steps ────────────────────────────── */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Getting Started</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-4 text-sm">
//             <div className="space-y-3">
//               <Step
//                 number={1}
//                 title="Explore the data"
//               >
//                 Head to the{" "}
//                 <Link to="/data" className="text-primary underline font-bold">
//                   Database Schema
//                 </Link>{" "}
//                 page to see every table, column, and some example queries.
//                 You can also open Snowflake directly and run queries to understand
//                 the data.
//               </Step>

//               <Step
//                 number={2}
//                 title="Try querying from your code"
//               >
//                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
//                   querySnowflake()
//                 </code>{" "}
//                 is ready to go — see the example below. The chart on this page
//                 is built with it.
//               </Step>

//               <Step number={3} title="Build your dashboard">
//                 Delete{" "}
//                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
//                   src/App.tsx
//                 </code>{" "}
//                 (this file) and{" "}
//                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
//                   src/pages/Data.tsx
//                 </code>{" "}
//                 then start building. You can also remove the router in{" "}
//                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
//                   main.tsx
//                 </code>{" "}
//                 if you don't need it.
//               </Step>

//               <Step number={4} title="Submit">
//                 Run{" "}
//                 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
//                   ./submit.sh your.name@datamavericks.com
//                 </code>{" "}
//                 and your app goes live.
//               </Step>
//             </div>
//           </CardContent>
//         </Card>

//         {/* ── How to Query ─────────────────────────────────────── */}
//         <Card className="bg-muted/50">
//           <CardHeader>
//             <CardTitle className="text-base">How to query Snowflake</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <pre className="text-sm bg-foreground text-background rounded-md p-4 overflow-x-auto">
//               {`import { querySnowflake } from "@/lib/snowflake";

// // Fetch all locations
// const locations = await querySnowflake("SELECT * FROM LOCATIONS");

// // Revenue by location with a JOIN
// const revenue = await querySnowflake(\`
//   SELECT l.NAME, SUM(s.REVENUE) AS TOTAL_REVENUE
//   FROM DAILY_SALES s
//   JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
//   GROUP BY l.NAME
//   ORDER BY TOTAL_REVENUE DESC
// \`);`}
//             </pre>
//           </CardContent>
//         </Card>

//         {/* ── Connection Status / Sample Chart ─────────────────── */}
//         {loading && (
//           <Card>
//             <CardContent className="py-8 text-center text-muted-foreground">
//               Connecting to Snowflake...
//             </CardContent>
//           </Card>
//         )}

//         {error && (
//           <Card className="border-destructive">
//             <CardContent className="py-6">
//               <p className="font-semibold text-destructive">
//                 Connection failed
//               </p>
//               <p className="text-sm text-muted-foreground mt-1">{error}</p>
//               <p className="text-sm text-muted-foreground mt-3">
//                 Make sure you've copied{" "}
//                 <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
//                   .env.example
//                 </code>{" "}
//                 to{" "}
//                 <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
//                   .env
//                 </code>{" "}
//                 and that the{" "}
//                 <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
//                   rsa_key.p8
//                 </code>{" "}
//                 file is in the project root.
//               </p>
//             </CardContent>
//           </Card>
//         )}

//         {!loading && !error && (
//           <Card>
//             <CardHeader>
//               <CardTitle>
//                 Snowflake Connected — Revenue by Location
//               </CardTitle>
//               <p className="text-sm text-muted-foreground">
//                 Live data from your SNOWCONE_DB database. {locations.length}{" "}
//                 locations loaded.
//               </p>
//             </CardHeader>
//             <CardContent>
//               <ResponsiveContainer width="100%" height={300}>
//                 <BarChart
//                   data={revenueByLocation}
//                   margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
//                 >
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     className="stroke-border"
//                   />
//                   <XAxis
//                     dataKey="name"
//                     tick={{ fontSize: 11 }}
//                     angle={-35}
//                     textAnchor="end"
//                     height={80}
//                   />
//                   <YAxis
//                     tick={{ fontSize: 11 }}
//                     tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
//                   />
//                   <Tooltip
//                     formatter={(v) => [
//                       `$${Number(v).toLocaleString()}`,
//                       "Revenue",
//                     ]}
//                   />
//                   <Bar
//                     dataKey="revenue"
//                     fill="var(--color-primary)"
//                     radius={[4, 4, 0, 0]}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>
//         )}

//         {/* ── What You Need to Build ───────────────────────────── */}
//         <Card>
//           <CardHeader>
//             <CardTitle>What You Need to Build</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-3 text-sm">
//             <Spec title="Location Scorecard">
//               Table/grid of all locations with revenue, avg rating, and trend.
//               Sortable. Flag locations needing attention.
//             </Spec>
//             <Spec title="Historical Sales View">
//               Charts showing sales over time by location. Breakdown by order type
//               (dine-in, takeout, delivery).
//             </Spec>
//             <Spec title="Inventory Waste Tracker">
//               Waste by location and category. Flag above-threshold locations.
//               Show waste trends.
//             </Spec>
//             <Spec title="Location Drill-Down">
//               Click a location to see detailed info, sales charts, reviews, and
//               inventory.
//             </Spec>
//             <Spec title="Interactive Elements">
//               Date range filter, location comparison, search, or similar. The
//               dashboard should not be static.
//             </Spec>
//           </CardContent>
//         </Card>
//       </main>

//       <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
//         Data Mavericks — The Snowcone Warehouse Challenge
//       </footer>
//     </div>
//   );
// }

// // ── Small helper components (inline, no separate files needed) ───

// function Step({
//   number,
//   title,
//   children,
// }: {
//   number: number;
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex gap-3">
//       <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
//         {number}
//       </span>
//       <div>
//         <p className="font-medium">{title}</p>
//         <p className="text-muted-foreground mt-0.5">{children}</p>
//       </div>
//     </div>
//   );
// }

// function Spec({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="border-l-2 border-primary/30 pl-3">
//       <p className="font-medium">{title}</p>
//       <p className="text-muted-foreground">{children}</p>
//     </div>
//   );
// }


// -------





// import { useEffect, useState, useMemo } from "react";
// import {
//   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
// } from "recharts";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Search, TrendingDown, TrendingUp, AlertCircle, IceCream2, MapPin, Download, Moon, Sun, ArrowUpDown, Sparkles, Activity } from "lucide-react";
// import { querySnowflake } from "@/lib/snowflake";

// // ── Types ───────────────────────────────────────────────────────
// interface Review { id: string; text: string; rating: number; date: string; }
// interface OrderType { name: string; value: number; color: string; }
// interface StoreMetrics {
//   LOCATION_ID: number;
//   NAME: string;
//   CITY: string;
//   REVENUE: number;
//   REVENUE_TREND: number;
//   RATING: number;
//   WASTE_LBS: number;
//   WASTE_TREND: number;
//   STATUS: "Healthy" | "Attention" | "Critical";
//   RECENT_REVIEWS: Review[];
//   SALES_HISTORY: { day: string; sales: number }[];
//   ORDER_TYPES: OrderType[];
// }

// type SortField = 'NAME' | 'REVENUE' | 'RATING' | 'WASTE_LBS';

// // ── App ─────────────────────────────────────────────────────────
// export default function App() {
//   const [stores, setStores] = useState<StoreMetrics[]>([]);
//   const [globalTrend, setGlobalTrend] = useState<any[]>([]);
//   const [globalWaste, setGlobalWaste] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   const [searchQuery, setSearchQuery] = useState("");
//   const [timeframe, setTimeframe] = useState("7d");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [selectedStore, setSelectedStore] = useState<StoreMetrics | null>(null);
  
//   const [sortField, setSortField] = useState<SortField>('REVENUE');
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
//   const [isDarkMode, setIsDarkMode] = useState(true);

//   useEffect(() => {
//     if (isDarkMode) document.documentElement.classList.add('dark');
//     else document.documentElement.classList.remove('dark');
//   }, [isDarkMode]);

//   useEffect(() => {
//     async function fetchData() {
//       setLoading(true);
//       try {
//         const data = await querySnowflake<any>(`
//           WITH GlobalMaxDate AS (SELECT MAX(SALE_DATE) as max_date FROM DAILY_SALES),
//           RevenueStats AS (
//             SELECT LOCATION_ID, SUM(REVENUE) as TOTAL_REVENUE,
//               (SUM(CASE WHEN SALE_DATE >= DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END) - 
//                SUM(CASE WHEN SALE_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END)) 
//                / NULLIF(SUM(CASE WHEN SALE_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END), 0) * 100 AS REVENUE_TREND
//             FROM DAILY_SALES GROUP BY LOCATION_ID
//           ),
//           RatingStats AS (SELECT LOCATION_ID, AVG(RATING) as AVG_RATING FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID),
//           WasteStats AS (
//             SELECT LOCATION_ID, SUM(UNITS_WASTED) as TOTAL_WASTE_LBS,
//                (SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END) - 
//                SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END)) 
//                / NULLIF(SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END), 0) * 100 AS WASTE_TREND
//             FROM INVENTORY GROUP BY LOCATION_ID
//           ),
//           RecentReviews AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('id', REVIEW_ID, 'rating', RATING, 'text', REVIEW_TEXT, 'date', TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD'))) WITHIN GROUP (ORDER BY REVIEW_DATE DESC) as REVIEWS
//             FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID
//           ),
//           SalesHistory AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Dy'), 'sales', REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as HISTORY
//             FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -6, (SELECT max_date FROM GlobalMaxDate)) GROUP BY LOCATION_ID
//           ),
//           OrderTypesStore AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('name', INITCAP(ORDER_TYPE), 'value', REVENUE)) WITHIN GROUP (ORDER BY REVENUE DESC) as ORDER_TYPES
//             FROM (SELECT LOCATION_ID, ORDER_TYPE, SUM(REVENUE) as REVENUE FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -30, (SELECT max_date FROM GlobalMaxDate)) GROUP BY LOCATION_ID, ORDER_TYPE)
//             GROUP BY LOCATION_ID
//           ),
//           CombinedData AS (
//             SELECT l.LOCATION_ID, l.NAME, l.CITY, COALESCE(rs.TOTAL_REVENUE, 0) as REVENUE, COALESCE(rs.REVENUE_TREND, 0) as REVENUE_TREND, COALESCE(rt.AVG_RATING, 0) as RATING, COALESCE(ws.TOTAL_WASTE_LBS, 0) as WASTE_LBS, COALESCE(ws.WASTE_TREND, 0) as WASTE_TREND,
//               CASE WHEN COALESCE(rt.AVG_RATING, 0) < 4.0 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1500 THEN 'Critical' WHEN COALESCE(rt.AVG_RATING, 0) < 4.3 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1000 THEN 'Attention' ELSE 'Healthy' END as STATUS,
//               COALESCE(rr.REVIEWS, ARRAY_CONSTRUCT()) as RECENT_REVIEWS, COALESCE(sh.HISTORY, ARRAY_CONSTRUCT()) as SALES_HISTORY, COALESCE(ot.ORDER_TYPES, ARRAY_CONSTRUCT()) as ORDER_TYPES
//             FROM LOCATIONS l
//             LEFT JOIN RevenueStats rs ON l.LOCATION_ID = rs.LOCATION_ID LEFT JOIN RatingStats rt ON l.LOCATION_ID = rt.LOCATION_ID LEFT JOIN WasteStats ws ON l.LOCATION_ID = ws.LOCATION_ID LEFT JOIN RecentReviews rr ON l.LOCATION_ID = rr.LOCATION_ID LEFT JOIN SalesHistory sh ON l.LOCATION_ID = sh.LOCATION_ID LEFT JOIN OrderTypesStore ot ON l.LOCATION_ID = ot.LOCATION_ID
//           ),
//           GlobalSalesCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Dy'), 'sales', TOTAL_REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as global_sales
//             FROM (SELECT SALE_DATE, SUM(REVENUE) as TOTAL_REVENUE FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -6, (SELECT max_date FROM GlobalMaxDate)) GROUP BY SALE_DATE)
//           ),
//           GlobalWasteCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('category', INITCAP(REPLACE(CATEGORY, '_', ' ')), 'amount', TOTAL_WASTED)) as global_waste
//             FROM (SELECT CATEGORY, SUM(UNITS_WASTED) as TOTAL_WASTED FROM INVENTORY GROUP BY CATEGORY)
//           )
          
//           SELECT TO_JSON(OBJECT_CONSTRUCT(
//             'stores', (SELECT ARRAY_AGG(OBJECT_CONSTRUCT('LOCATION_ID', LOCATION_ID, 'NAME', NAME, 'CITY', CITY, 'REVENUE', REVENUE, 'REVENUE_TREND', REVENUE_TREND, 'RATING', RATING, 'WASTE_LBS', WASTE_LBS, 'WASTE_TREND', WASTE_TREND, 'STATUS', STATUS, 'RECENT_REVIEWS', RECENT_REVIEWS, 'SALES_HISTORY', SALES_HISTORY, 'ORDER_TYPES', ORDER_TYPES)) FROM CombinedData),
//             'globalSalesTrend', (SELECT global_sales FROM GlobalSalesCTE),
//             'globalWasteData', (SELECT global_waste FROM GlobalWasteCTE)
//           )) AS PAYLOAD;
//         `);

//         if (data && data.length > 0 && data[0].PAYLOAD) {
//           const payload = typeof data[0].PAYLOAD === 'string' ? JSON.parse(data[0].PAYLOAD) : data[0].PAYLOAD;
//           const colorMap: Record<string, string> = { 'Takeout': '#0ea5e9', 'Dine-In': '#a855f7', 'Delivery': '#f43f5e' };
          
//           const formattedStores = (payload.stores || []).map((store: any) => ({
//             ...store,
//             RATING: Number(store.RATING) || 0,
//             REVENUE: Number(store.REVENUE) || 0,
//             WASTE_LBS: Number(store.WASTE_LBS) || 0,
//             RECENT_REVIEWS: (store.RECENT_REVIEWS || []).slice(0, 3), 
//             SALES_HISTORY: store.SALES_HISTORY || [],
//             ORDER_TYPES: (store.ORDER_TYPES || []).map((ot: any) => ({ ...ot, color: colorMap[ot.name] || '#cbd5e1' }))
//           }));

//           setStores(formattedStores as StoreMetrics[]);
//           setGlobalTrend(payload.globalSalesTrend || []);
//           setGlobalWaste(payload.globalWasteData || []);
//         }
//       } catch (e) {
//         console.error("Snowflake query failed:", e);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [timeframe]);

//   const handleSort = (field: SortField) => {
//     if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     else { setSortField(field); setSortDirection('desc'); }
//   };

//   const sortedAndFilteredStores = useMemo(() => {
//     let result = stores.filter(s => {
//       const matchesSearch = s.NAME.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesStatus = statusFilter === "All" || s.STATUS === statusFilter;
//       return matchesSearch && matchesStatus;
//     });
//     return result.sort((a, b) => {
//       const aVal = a[sortField];
//       const bVal = b[sortField];
//       if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
//       if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [stores, searchQuery, statusFilter, sortField, sortDirection]);

//   const exportCSV = () => {
//     const headers = ["Location ID,Name,City,Revenue,Rating,Waste (lbs),Status\n"];
//     const rows = sortedAndFilteredStores.map(s => 
//       `${s.LOCATION_ID},"${s.NAME}","${s.CITY}",${s.REVENUE},${s.RATING.toFixed(1)},${s.WASTE_LBS},${s.STATUS}`
//     ).join("\n");
//     const blob = new Blob([headers + rows], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `snowcone-report-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//   };

//   const globalMetrics = useMemo(() => stores.reduce((acc, store) => {
//     acc.revenue += store.REVENUE; acc.waste += store.WASTE_LBS; acc.ratingSum += store.RATING;
//     if (store.STATUS !== "Healthy") acc.alerts++;
//     return acc;
//   }, { revenue: 0, waste: 0, ratingSum: 0, alerts: 0 }), [stores]);

//   const avgRating = stores.length ? (globalMetrics.ratingSum / stores.length).toFixed(1) : "0.0";

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      
//       {/* ── Sleek Header ── */}
//       <header className="bg-white/70 dark:bg-[#0f1523]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm dark:shadow-none">
//         <div className="flex items-center gap-3 text-primary">
//           <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
//             <IceCream2 className="h-5 w-5 text-white" />
//           </div>
//           <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
//             Snowcone HQ
//           </h1>
//         </div>
//         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
//           <div className="relative flex-1 md:w-64">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
//             <Input placeholder="Search locations..." className="pl-9 bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 focus:ring-blue-500 transition-all w-full rounded-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//           </div>
          
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-[140px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="All">All Statuses</SelectItem>
//               <SelectItem value="Healthy">Healthy</SelectItem>
//               <SelectItem value="Attention">Attention</SelectItem>
//               <SelectItem value="Critical">Critical</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={timeframe} onValueChange={setTimeframe}>
//             <SelectTrigger className="w-[140px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full">
//               <SelectValue placeholder="Timeframe" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="7d">Last 7 Days</SelectItem>
//               <SelectItem value="30d">Last 30 Days</SelectItem>
//             </SelectContent>
//           </Select>

//           <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV" className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             <Download className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
//           </Button>
//         </div>
//       </header>

//       <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        
//         {/* ── Refined, Elegant AI Banner ── */}
//         {!loading && stores.length > 0 && (
//           <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
//             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl">
//               <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
//             </div>
//             <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">
//               <span className="font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-400 text-xs mr-2 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full">AI Insight</span>
//               You have <strong className="text-indigo-900 dark:text-white font-semibold">{globalMetrics.alerts} stores</strong> requiring management attention today based on recent ratings drops and high inventory waste.
//             </p>
//           </div>
//         )}

//         {loading && (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Activity className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
//             <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm">Querying Snowflake...</p>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//             <KpiCard title="Total Revenue" value={`$${(globalMetrics.revenue / 1000).toFixed(1)}k`} trend={+5.2} />
//             <KpiCard title="Avg Customer Rating" value={`${avgRating} / 5.0`} trend={-0.1} />
//             <KpiCard title="Inventory Waste" value={`${globalMetrics.waste} lbs`} trend={-12.5} reverseColors />
            
//             {/* Elevated Action Required Card */}
//             <Card className={`relative overflow-hidden border ${globalMetrics.alerts > 0 ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-sm" : "bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/5"}`}>
//               {globalMetrics.alerts > 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>}
//               <CardContent className="p-6 flex items-center gap-5 relative z-10">
//                 <div className={`p-3 rounded-2xl ${globalMetrics.alerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
//                   <AlertCircle className="h-8 w-8" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Required</p>
//                   <h3 className={`text-3xl font-bold mt-1 ${globalMetrics.alerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{globalMetrics.alerts} Stores</h3>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
//             {/* ── Location Scorecard ── */}
//             <Card className="xl:col-span-2 shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 flex flex-col rounded-2xl overflow-hidden">
//               <CardHeader className="bg-slate-50/50 dark:bg-[#0f1523]/50 border-b border-slate-200 dark:border-white/5 pb-4">
//                 <CardTitle className="text-lg">Location Scorecard</CardTitle>
//                 <CardDescription>Click any column to sort. Select a row for detailed analytics.</CardDescription>
//               </CardHeader>
              
//               <CardContent className="max-h-[500px] overflow-y-auto p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                 <table className="w-full text-sm text-left min-w-[600px] border-collapse">
//                   <thead className="bg-white/90 dark:bg-[#0f1523]/90 backdrop-blur-sm text-slate-500 dark:text-slate-400 sticky top-0 z-20 shadow-sm dark:shadow-none dark:border-b dark:border-white/5">
//                     <tr>
//                       <SortableHeader label="Location" field="NAME" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Revenue" field="REVENUE" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Rating" field="RATING" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Waste (lbs)" field="WASTE_LBS" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <th className="px-6 py-4 font-semibold text-right uppercase text-xs tracking-wider">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
//                     {sortedAndFilteredStores.map((store) => (
//                       <tr key={store.LOCATION_ID} onClick={() => setSelectedStore(store)} className="group hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-all duration-200">
//                         <td className="px-6 py-4 font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                           {store.NAME}
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">${store.REVENUE.toLocaleString()}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.REVENUE_TREND > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.REVENUE_TREND > 0 ? '▲' : '▼'} {Math.abs(store.REVENUE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
//                             {store.RATING.toFixed(1)}
//                             {store.RATING < 4.0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">{store.WASTE_LBS}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.WASTE_TREND < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.WASTE_TREND < 0 ? '▼' : '▲'} {Math.abs(store.WASTE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-right">
//                           <StatusBadge status={store.STATUS} />
//                         </td>
//                       </tr>
//                     ))}
//                     {sortedAndFilteredStores.length === 0 && (
//                       <tr>
//                         <td colSpan={5} className="text-center py-12 text-slate-500">
//                           <div className="flex flex-col items-center justify-center gap-2">
//                             <Search className="h-8 w-8 opacity-20" />
//                             <p>No locations found matching your filters.</p>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </CardContent>
//             </Card>

//             {/* Right Column: Global Trends */}
//             <div className="space-y-6">
              
//               {/* Premium Area Chart */}
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Global Sales Trend</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[200px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <AreaChart data={globalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                         <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} tick={{fill: '#64748b'}} />
//                         <Tooltip 
//                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
//                           itemStyle={{ color: '#fff', fontWeight: 'bold' }}
//                           formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
//                         />
//                         <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSales)" />
//                       </AreaChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Improved Bar Chart with Labels */}
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waste by Category</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[200px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <BarChart data={globalWaste} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorWaste" x1="0" y1="0" x2="1" y2="0">
//                             <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
//                             <stop offset="100%" stopColor="#f97316" stopOpacity={0.8}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
//                         <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis dataKey="category" type="category" fontSize={11} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 500}} width={75} />
//                         <Tooltip 
//                           cursor={{fill: 'rgba(255,255,255,0.05)'}} 
//                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} 
//                           formatter={(value: number) => [`${value} lbs`, 'Waste']}
//                         />
//                         <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
//                           {globalWaste.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill="url(#colorWaste)" />
//                           ))}
//                           <LabelList dataKey="amount" position="right" fill="#94a3b8" fontSize={11} fontWeight={500} formatter={(v: number) => `${v} lbs`} />
//                         </Bar>
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         )}
//       </main>

//       {/* ── Advanced Drill-down Modal ── */}
//       <Dialog open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
//         <DialogContent 
//           className="bg-white dark:bg-[#0f1523] text-slate-900 dark:text-slate-50 border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
//           style={{ maxWidth: '1050px', width: '95vw' }}
//         >
//           <DialogHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
//             <div className="flex items-center gap-3">
//               <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
//                 <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//               </div>
//               <div>
//                 <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedStore?.NAME}</DialogTitle>
//                 <DialogDescription className="text-sm mt-1 text-slate-500 font-medium">
//                   {selectedStore?.CITY} • Store ID: {selectedStore?.LOCATION_ID}
//                 </DialogDescription>
//               </div>
//             </div>
//           </DialogHeader>
          
//           {selectedStore && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              
//               {/* Left Column: KPI & Order breakdown */}
//               <div className="space-y-6 col-span-1 min-w-0">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-slate-50 dark:bg-[#151c2c] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
//                     <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-semibold">Weekly Rev</p>
//                     <p className="text-2xl font-bold text-slate-900 dark:text-white">${selectedStore.REVENUE.toLocaleString()}</p>
//                   </div>
//                   <div className={`p-5 rounded-2xl border ${selectedStore.RATING < 4.0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-[#151c2c] border-slate-100 dark:border-white/5'}`}>
//                     <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-semibold">Avg Rating</p>
//                     <p className={`text-2xl font-bold ${selectedStore.RATING < 4.0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{selectedStore.RATING.toFixed(1)} <span className="text-sm font-medium text-slate-400">/ 5</span></p>
//                   </div>
//                 </div>

//                 <div className="bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
//                   <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Distribution</h4>
//                   <div className="h-[180px] w-full">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         {/* THE FIX: Replaced stroke="none" with a subtle transparent stroke so hover boundaries work, and forced clean tooltip text */}
//                         <Pie 
//                           data={selectedStore.ORDER_TYPES} 
//                           cx="50%" cy="50%" 
//                           innerRadius={55} outerRadius={75} 
//                           paddingAngle={5} 
//                           dataKey="value"
//                           stroke="rgba(255,255,255,0.05)"
//                           strokeWidth={2}
//                           cornerRadius={4}
//                         >
//                           {selectedStore.ORDER_TYPES.map((entry, index) => (
//                             <Cell key={`cell-${index}`} fill={entry.color} />
//                           ))}
//                         </Pie>
//                         <Tooltip 
//                           formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
//                           contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
//                           itemStyle={{ color: '#fff', fontWeight: 'bold' }}
//                         />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   </div>
//                   <div className="flex justify-center flex-wrap gap-4 text-xs mt-4 font-medium">
//                     {selectedStore.ORDER_TYPES.map(type => (
//                       <div key={type.name} className="flex items-center gap-1.5">
//                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
//                         <span className="text-slate-600 dark:text-slate-300">{type.name}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Middle Column: Upgraded Store Area Chart */}
//               <div className="col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 min-w-0 flex flex-col">
//                 <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">7-Day Local Trend</h4>
//                 <div className="flex-1 min-h-[200px] w-full mt-2">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={selectedStore.SALES_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                       <defs>
//                         <linearGradient id="colorLocalSales" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
//                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                       <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                       <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} tick={{fill: '#64748b'}} />
//                       <Tooltip 
//                         contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} 
//                         itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
//                         formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
//                       />
//                       <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="url(#colorLocalSales)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               {/* Right Column: Recent Reviews */}
//               <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex flex-col min-w-0">
//                 <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
//                   Recent Feedback 
//                   {selectedStore.RATING < 4.0 && <span className="text-rose-600 dark:text-rose-400 text-[10px] bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle className="h-3 w-3"/> ACTION NEEDED</span>}
//                 </h4>
//                 <div className="space-y-3 overflow-y-auto flex-1 max-h-[280px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                   {selectedStore.RECENT_REVIEWS.length > 0 ? selectedStore.RECENT_REVIEWS.map(review => (
//                     <div key={review.id} className="bg-white dark:bg-[#0f1523] p-4 rounded-xl border border-slate-100 dark:border-white/5 text-sm shadow-sm">
//                       <div className="flex justify-between items-center mb-2">
//                         <div className="text-amber-400 text-sm tracking-widest">{"★".repeat(Math.round(review.rating))}<span className="text-slate-200 dark:text-slate-700">{"★".repeat(5-Math.round(review.rating))}</span></div>
//                         <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{review.date}</span>
//                       </div>
//                       <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{review.text}"</p>
//                     </div>
//                   )) : (
//                      <p className="text-sm text-slate-500 italic mt-4 text-center">No recent reviews found.</p>
//                   )}
//                 </div>
//               </div>

//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// // ── Enhanced Sub-Components ────────────────────────────────────────

// function SortableHeader({ label, field, currentSort, dir, onSort }: { label: string, field: SortField, currentSort: SortField, dir: 'asc'|'desc', onSort: (f: SortField)=>void }) {
//   return (
//     <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors select-none" onClick={() => onSort(field)}>
//       <div className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
//         {label}
//         <ArrowUpDown className={`h-3 w-3 transition-colors ${currentSort === field ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
//       </div>
//     </th>
//   );
// }

// function KpiCard({ title, value, trend, reverseColors = false }: { title: string, value: string, trend: number, reverseColors?: boolean }) {
//   const isPositiveTrend = trend > 0;
//   const isGood = reverseColors ? !isPositiveTrend : isPositiveTrend;
//   return (
//     <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
//       <CardContent className="p-6">
//         <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
//         <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">{value}</h3>
//         <div className={`flex items-center text-xs font-bold px-2.5 py-1 w-fit rounded-md ${isGood ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
//           {isPositiveTrend ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
//           <span>{Math.abs(trend || 0).toFixed(1)}% vs last week</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: StoreMetrics["STATUS"] }) {
//   switch (status) {
//     case "Healthy": return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Healthy</Badge>;
//     case "Attention": return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Attention</Badge>;
//     case "Critical": return (
//       <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1 flex items-center gap-1.5 w-fit ml-auto">
//         <span className="relative flex h-2 w-2">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//           <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
//         </span>
//         Critical
//       </Badge>
//     );
//   }
// }
//---------------------------------------

// import { useEffect, useState, useMemo } from "react";
// import {
//   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
// } from "recharts";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Search, TrendingDown, TrendingUp, AlertCircle, IceCream2, MapPin, Download, Moon, Sun, ArrowUpDown, Sparkles, Activity, Target, Zap } from "lucide-react";
// import { querySnowflake } from "@/lib/snowflake";

// // ── Types ───────────────────────────────────────────────────────
// interface Review { id: string; text: string; rating: number; date: string; }
// interface OrderType { name: string; value: number; color: string; }
// interface StoreMetrics {
//   LOCATION_ID: number;
//   NAME: string;
//   CITY: string;
//   REVENUE: number;
//   REVENUE_TREND: number;
//   AOV: number;
//   RATING: number;
//   WASTE_LBS: number;
//   WASTE_COST: number;
//   WASTE_TREND: number;
//   STATUS: "Healthy" | "Attention" | "Critical";
//   RECENT_REVIEWS: Review[];
//   SALES_HISTORY: { day: string; sales: number }[];
//   ORDER_TYPES: OrderType[];
// }

// type SortField = 'NAME' | 'REVENUE' | 'AOV' | 'RATING' | 'WASTE_LBS';

// // ── App ─────────────────────────────────────────────────────────
// export default function App() {
//   const [stores, setStores] = useState<StoreMetrics[]>([]);
//   const [globalTrend, setGlobalTrend] = useState<any[]>([]);
//   const [globalWaste, setGlobalWaste] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   const [searchQuery, setSearchQuery] = useState("");
//   const [timeframe, setTimeframe] = useState("7d");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [selectedStore, setSelectedStore] = useState<StoreMetrics | null>(null);
  
//   const [sortField, setSortField] = useState<SortField>('REVENUE');
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
//   const [isDarkMode, setIsDarkMode] = useState(true);

//   useEffect(() => {
//     if (isDarkMode) document.documentElement.classList.add('dark');
//     else document.documentElement.classList.remove('dark');
//   }, [isDarkMode]);

//   // Fetch Real Snowflake Data 
//   useEffect(() => {
//     async function fetchData() {
//       setLoading(true);
//       try {
//         const data = await querySnowflake<any>(`
//           WITH GlobalMaxDate AS (SELECT MAX(SALE_DATE) as max_date FROM DAILY_SALES),
//           RevenueStats AS (
//             SELECT LOCATION_ID, 
//               SUM(REVENUE) as TOTAL_REVENUE,
//               SUM(REVENUE) / NULLIF(SUM(NUM_ORDERS), 0) as AOV,
//               (SUM(CASE WHEN SALE_DATE >= DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END) - 
//                SUM(CASE WHEN SALE_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END)) 
//                / NULLIF(SUM(CASE WHEN SALE_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN REVENUE ELSE 0 END), 0) * 100 AS REVENUE_TREND
//             FROM DAILY_SALES GROUP BY LOCATION_ID
//           ),
//           RatingStats AS (SELECT LOCATION_ID, AVG(RATING) as AVG_RATING FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID),
//           WasteStats AS (
//             SELECT LOCATION_ID, 
//               SUM(UNITS_WASTED) as TOTAL_WASTE_LBS,
//               SUM(WASTE_COST) as TOTAL_WASTE_COST,
//                (SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END) - 
//                SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END)) 
//                / NULLIF(SUM(CASE WHEN RECORD_DATE >= DATEADD(day, -28, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -14, (SELECT max_date FROM GlobalMaxDate)) THEN UNITS_WASTED ELSE 0 END), 0) * 100 AS WASTE_TREND
//             FROM INVENTORY GROUP BY LOCATION_ID
//           ),
//           RecentReviews AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('id', REVIEW_ID, 'rating', RATING, 'text', REVIEW_TEXT, 'date', TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD'))) WITHIN GROUP (ORDER BY REVIEW_DATE DESC) as REVIEWS
//             FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID
//           ),
//           SalesHistory AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Dy'), 'sales', REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as HISTORY
//             FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -6, (SELECT max_date FROM GlobalMaxDate)) GROUP BY LOCATION_ID
//           ),
//           OrderTypesStore AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('name', INITCAP(ORDER_TYPE), 'value', REVENUE)) WITHIN GROUP (ORDER BY REVENUE DESC) as ORDER_TYPES
//             FROM (SELECT LOCATION_ID, ORDER_TYPE, SUM(REVENUE) as REVENUE FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -30, (SELECT max_date FROM GlobalMaxDate)) GROUP BY LOCATION_ID, ORDER_TYPE)
//             GROUP BY LOCATION_ID
//           ),
//           CombinedData AS (
//             SELECT l.LOCATION_ID, l.NAME, l.CITY, 
//               COALESCE(rs.TOTAL_REVENUE, 0) as REVENUE, COALESCE(rs.REVENUE_TREND, 0) as REVENUE_TREND, COALESCE(rs.AOV, 0) as AOV,
//               COALESCE(rt.AVG_RATING, 0) as RATING, 
//               COALESCE(ws.TOTAL_WASTE_LBS, 0) as WASTE_LBS, COALESCE(ws.TOTAL_WASTE_COST, 0) as WASTE_COST, COALESCE(ws.WASTE_TREND, 0) as WASTE_TREND,
//               CASE WHEN COALESCE(rt.AVG_RATING, 0) < 4.0 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1500 THEN 'Critical' WHEN COALESCE(rt.AVG_RATING, 0) < 4.3 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1000 THEN 'Attention' ELSE 'Healthy' END as STATUS,
//               COALESCE(rr.REVIEWS, ARRAY_CONSTRUCT()) as RECENT_REVIEWS, COALESCE(sh.HISTORY, ARRAY_CONSTRUCT()) as SALES_HISTORY, COALESCE(ot.ORDER_TYPES, ARRAY_CONSTRUCT()) as ORDER_TYPES
//             FROM LOCATIONS l
//             LEFT JOIN RevenueStats rs ON l.LOCATION_ID = rs.LOCATION_ID LEFT JOIN RatingStats rt ON l.LOCATION_ID = rt.LOCATION_ID LEFT JOIN WasteStats ws ON l.LOCATION_ID = ws.LOCATION_ID LEFT JOIN RecentReviews rr ON l.LOCATION_ID = rr.LOCATION_ID LEFT JOIN SalesHistory sh ON l.LOCATION_ID = sh.LOCATION_ID LEFT JOIN OrderTypesStore ot ON l.LOCATION_ID = ot.LOCATION_ID
//           ),
//           GlobalSalesCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Dy'), 'sales', TOTAL_REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as global_sales
//             FROM (SELECT SALE_DATE, SUM(REVENUE) as TOTAL_REVENUE FROM DAILY_SALES WHERE SALE_DATE >= DATEADD(day, -6, (SELECT max_date FROM GlobalMaxDate)) GROUP BY SALE_DATE)
//           ),
//           GlobalWasteCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('category', INITCAP(REPLACE(CATEGORY, '_', ' ')), 'amount', TOTAL_WASTED)) as global_waste
//             FROM (SELECT CATEGORY, SUM(UNITS_WASTED) as TOTAL_WASTED FROM INVENTORY GROUP BY CATEGORY)
//           )
          
//           SELECT TO_JSON(OBJECT_CONSTRUCT(
//             'stores', (SELECT ARRAY_AGG(OBJECT_CONSTRUCT('LOCATION_ID', LOCATION_ID, 'NAME', NAME, 'CITY', CITY, 'REVENUE', REVENUE, 'REVENUE_TREND', REVENUE_TREND, 'AOV', AOV, 'RATING', RATING, 'WASTE_LBS', WASTE_LBS, 'WASTE_COST', WASTE_COST, 'WASTE_TREND', WASTE_TREND, 'STATUS', STATUS, 'RECENT_REVIEWS', RECENT_REVIEWS, 'SALES_HISTORY', SALES_HISTORY, 'ORDER_TYPES', ORDER_TYPES)) FROM CombinedData),
//             'globalSalesTrend', (SELECT global_sales FROM GlobalSalesCTE),
//             'globalWasteData', (SELECT global_waste FROM GlobalWasteCTE)
//           )) AS PAYLOAD;
//         `);

//         if (data && data.length > 0 && data[0].PAYLOAD) {
//           const payload = typeof data[0].PAYLOAD === 'string' ? JSON.parse(data[0].PAYLOAD) : data[0].PAYLOAD;
//           const colorMap: Record<string, string> = { 'Takeout': '#0ea5e9', 'Dine-In': '#a855f7', 'Delivery': '#f43f5e' };
          
//           const formattedStores = (payload.stores || []).map((store: any) => ({
//             ...store,
//             RATING: Number(store.RATING) || 0,
//             REVENUE: Number(store.REVENUE) || 0,
//             AOV: Number(store.AOV) || 0,
//             WASTE_LBS: Number(store.WASTE_LBS) || 0,
//             WASTE_COST: Number(store.WASTE_COST) || 0,
//             RECENT_REVIEWS: (store.RECENT_REVIEWS || []).slice(0, 3), 
//             SALES_HISTORY: store.SALES_HISTORY || [],
//             ORDER_TYPES: (store.ORDER_TYPES || []).map((ot: any) => ({ ...ot, color: colorMap[ot.name] || '#cbd5e1' }))
//           }));

//           setStores(formattedStores as StoreMetrics[]);
//           setGlobalTrend(payload.globalSalesTrend || []);
//           setGlobalWaste(payload.globalWasteData || []);
//         }
//       } catch (e) {
//         console.error("Snowflake query failed:", e);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [timeframe]);

//   const handleSort = (field: SortField) => {
//     if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     else { setSortField(field); setSortDirection('desc'); }
//   };

//   const sortedAndFilteredStores = useMemo(() => {
//     let result = stores.filter(s => {
//       const matchesSearch = s.NAME.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesStatus = statusFilter === "All" || s.STATUS === statusFilter;
//       return matchesSearch && matchesStatus;
//     });
//     return result.sort((a, b) => {
//       const aVal = a[sortField];
//       const bVal = b[sortField];
//       if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
//       if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [stores, searchQuery, statusFilter, sortField, sortDirection]);

//   // ── ADVANCED ANALYTICS ENGINE (Calculated on Frontend) ──
//   const globalMetrics = useMemo(() => stores.reduce((acc, store) => {
//     acc.revenue += store.REVENUE; 
//     acc.wasteLbs += store.WASTE_LBS; 
//     acc.wasteCost += store.WASTE_COST;
//     acc.ratingSum += store.RATING;
//     acc.aovSum += store.AOV;
//     if (store.STATUS !== "Healthy") acc.alerts++;
//     return acc;
//   }, { revenue: 0, wasteLbs: 0, wasteCost: 0, ratingSum: 0, aovSum: 0, alerts: 0 }), [stores]);

//   const regionalAverages = useMemo(() => ({
//     revenue: stores.length ? globalMetrics.revenue / stores.length : 0,
//     rating: stores.length ? globalMetrics.ratingSum / stores.length : 0,
//     wasteCost: stores.length ? globalMetrics.wasteCost / stores.length : 0,
//     aov: stores.length ? globalMetrics.aovSum / stores.length : 0
//   }), [globalMetrics, stores.length]);

//   const avgRating = stores.length ? (globalMetrics.ratingSum / stores.length).toFixed(1) : "0.0";

//   // Automated Text Insights Generator
//   const generateStoreDiagnosis = (store: StoreMetrics | null) => {
//     if (!store) return null;
//     let insights = [];
    
//     // Revenue logic
//     if (store.REVENUE > regionalAverages.revenue * 1.2) insights.push(<span key="1" className="text-emerald-500 font-semibold">Top tier revenue producer.</span>);
//     else if (store.REVENUE < regionalAverages.revenue * 0.8) insights.push(<span key="2" className="text-rose-500 font-semibold">Underperforming in overall sales.</span>);
//     else insights.push(<span key="3" className="text-slate-500 dark:text-slate-400">Revenue is aligned with the regional average.</span>);

//     // Waste logic
//     if (store.WASTE_COST > regionalAverages.wasteCost * 1.3) insights.push(<span key="4" className="text-rose-500 font-semibold">Severe inventory leakage detected.</span>);
//     else if (store.WASTE_COST < regionalAverages.wasteCost * 0.7) insights.push(<span key="5" className="text-emerald-500 font-semibold">Excellent waste control.</span>);

//     // AOV logic
//     if (store.AOV > regionalAverages.aov * 1.15) insights.push(<span key="6" className="text-indigo-500 dark:text-indigo-400 font-semibold">Staff is successfully upselling (High AOV).</span>);

//     return (
//       <div className="flex gap-2 flex-wrap items-center mt-1 text-sm">
//         {insights.map((insight, i) => <div key={i} className="flex items-center gap-1.5">{i > 0 && <span className="text-slate-300 dark:text-slate-700">•</span>} {insight}</div>)}
//       </div>
//     );
//   };

//   const exportCSV = () => {
//     const headers = ["Location ID,Name,City,Revenue,AOV,Rating,Waste (lbs),Waste Cost,Status\n"];
//     const rows = sortedAndFilteredStores.map(s => 
//       `${s.LOCATION_ID},"${s.NAME}","${s.CITY}",${s.REVENUE},${s.AOV.toFixed(2)},${s.RATING.toFixed(1)},${s.WASTE_LBS},${s.WASTE_COST},${s.STATUS}`
//     ).join("\n");
//     const blob = new Blob([headers + rows], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `snowcone-report-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 pb-10">
      
//       {/* ── Header ── */}
//       <header className="bg-white/70 dark:bg-[#0f1523]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm dark:shadow-none">
//         <div className="flex items-center gap-3 text-primary">
//           <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
//             <IceCream2 className="h-5 w-5 text-white" />
//           </div>
//           <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
//             Snowcone HQ
//           </h1>
//         </div>
//         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
//           <div className="relative flex-1 md:w-64">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
//             <Input placeholder="Search locations..." className="pl-9 bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 focus:ring-blue-500 transition-all w-full rounded-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//           </div>
          
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-[140px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="All">All Statuses</SelectItem>
//               <SelectItem value="Healthy">Healthy</SelectItem>
//               <SelectItem value="Attention">Attention</SelectItem>
//               <SelectItem value="Critical">Critical</SelectItem>
//             </SelectContent>
//           </Select>

//           <Select value={timeframe} onValueChange={setTimeframe}>
//             <SelectTrigger className="w-[140px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full">
//               <SelectValue placeholder="Timeframe" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="7d">Last 7 Days</SelectItem>
//               <SelectItem value="30d">Last 30 Days</SelectItem>
//             </SelectContent>
//           </Select>

//           <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV" className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             <Download className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
//           </Button>
//         </div>
//       </header>

//       <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        
//         {/* Global Insight Banner */}
//         {!loading && stores.length > 0 && (
//           <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
//             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl">
//               <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
//             </div>
//             <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">
//               <span className="font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-400 text-xs mr-2 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full">AI Insight</span>
//               You have <strong className="text-indigo-900 dark:text-white font-semibold">{globalMetrics.alerts} stores</strong> requiring management attention today based on recent ratings drops and high inventory waste.
//             </p>
//           </div>
//         )}

//         {loading && (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Activity className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
//             <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm">Analyzing Business Metrics...</p>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//             <KpiCard title="Total Revenue" value={`$${(globalMetrics.revenue / 1000).toFixed(1)}k`} trend={+5.2} />
//             <KpiCard title="Avg Customer Rating" value={`${avgRating} / 5.0`} trend={-0.1} />
//             <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
//               <CardContent className="p-6">
//                 <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Waste Impact</p>
//                 <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">${globalMetrics.wasteCost.toLocaleString()}</h3>
//                 <div className="flex items-center text-xs font-bold px-2.5 py-1 w-fit rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
//                   <TrendingDown className="h-3 w-3 mr-1" />
//                   <span>{globalMetrics.wasteLbs} lbs discarded</span>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className={`relative overflow-hidden border ${globalMetrics.alerts > 0 ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-sm" : "bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/5"}`}>
//               {globalMetrics.alerts > 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>}
//               <CardContent className="p-6 flex items-center gap-5 relative z-10">
//                 <div className={`p-3 rounded-2xl ${globalMetrics.alerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
//                   <AlertCircle className="h-8 w-8" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Required</p>
//                   <h3 className={`text-3xl font-bold mt-1 ${globalMetrics.alerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{globalMetrics.alerts} Stores</h3>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
//             {/* ── Location Scorecard ── */}
//             <Card className="xl:col-span-2 shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 flex flex-col rounded-2xl overflow-hidden">
//               <CardHeader className="bg-slate-50/50 dark:bg-[#0f1523]/50 border-b border-slate-200 dark:border-white/5 pb-4">
//                 <CardTitle className="text-lg">Location Scorecard</CardTitle>
//                 <CardDescription>Click any column to sort. Select a row for deeper analytics & benchmarking.</CardDescription>
//               </CardHeader>
//               <CardContent className="max-h-[500px] overflow-y-auto p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                 <table className="w-full text-sm text-left min-w-[600px] border-collapse">
//                   <thead className="bg-white/90 dark:bg-[#0f1523]/90 backdrop-blur-sm text-slate-500 dark:text-slate-400 sticky top-0 z-20 shadow-sm dark:shadow-none dark:border-b dark:border-white/5">
//                     <tr>
//                       <SortableHeader label="Location" field="NAME" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Revenue" field="REVENUE" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="AOV" field="AOV" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Rating" field="RATING" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Waste (lbs)" field="WASTE_LBS" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <th className="px-6 py-4 font-semibold text-right uppercase text-xs tracking-wider">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
//                     {sortedAndFilteredStores.map((store) => (
//                       <tr key={store.LOCATION_ID} onClick={() => setSelectedStore(store)} className="group hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-all duration-200">
//                         <td className="px-6 py-4 font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                           {store.NAME}
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">${store.REVENUE.toLocaleString()}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.REVENUE_TREND > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.REVENUE_TREND > 0 ? '▲' : '▼'} {Math.abs(store.REVENUE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
//                           ${store.AOV.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
//                             {store.RATING.toFixed(1)}
//                             {store.RATING < 4.0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">{store.WASTE_LBS}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.WASTE_TREND < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.WASTE_TREND < 0 ? '▼' : '▲'} {Math.abs(store.WASTE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-right">
//                           <StatusBadge status={store.STATUS} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </CardContent>
//             </Card>

//             {/* Right Column: Global Trends */}
//             <div className="space-y-6">
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Global Sales Trend</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[200px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <AreaChart data={globalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                         <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} tick={{fill: '#64748b'}} />
//                         <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}/>
//                         <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSales)" />
//                       </AreaChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waste by Category</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-[200px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <BarChart data={globalWaste} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorWaste" x1="0" y1="0" x2="1" y2="0">
//                             <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
//                             <stop offset="100%" stopColor="#f97316" stopOpacity={0.8}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
//                         <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis dataKey="category" type="category" fontSize={11} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 500}} width={75} />
//                         <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(value: number) => [`${value} lbs`, 'Waste']}/>
//                         <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
//                           {globalWaste.map((entry, index) => <Cell key={`cell-${index}`} fill="url(#colorWaste)" />)}
//                           <LabelList dataKey="amount" position="right" fill="#94a3b8" fontSize={11} fontWeight={500} formatter={(v: number) => `${v} lbs`} />
//                         </Bar>
//                       </BarChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         )}
//       </main>

//       {/* ── Advanced Business Benchmarking Modal ── */}
//       <Dialog open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
//         <DialogContent 
//           className="bg-white dark:bg-[#0f1523] text-slate-900 dark:text-slate-50 border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
//           style={{ maxWidth: '1100px', width: '95vw' }}
//         >
//           <DialogHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
//                   <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//                 </div>
//                 <div>
//                   <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedStore?.NAME}</DialogTitle>
//                   <DialogDescription className="text-sm mt-1 text-slate-500 font-medium">
//                     {selectedStore?.CITY} • Store ID: {selectedStore?.LOCATION_ID}
//                   </DialogDescription>
//                 </div>
//               </div>
//               <StatusBadge status={selectedStore?.STATUS || "Healthy"} />
//             </div>
//           </DialogHeader>
          
//           {selectedStore && (
//             <div className="flex flex-col gap-6 mt-4">
              
//               {/* NEW: Store AI Diagnosis & Benchmarking Strip */}
//               <div className="bg-gradient-to-r from-slate-50 to-white dark:from-[#151c2c] dark:to-[#111827] rounded-2xl p-5 border border-slate-100 dark:border-white/5">
//                 <div className="flex items-start gap-3 mb-4">
//                   <Target className="h-5 w-5 text-indigo-500 mt-0.5" />
//                   <div>
//                     <h4 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Store Diagnosis vs Region</h4>
//                     {generateStoreDiagnosis(selectedStore)}
//                   </div>
//                 </div>
                
//                 {/* Visual Benchmark Bars */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
//                   <BenchmarkBar label="Revenue vs Region" storeValue={selectedStore.REVENUE} regionAvg={regionalAverages.revenue} format="$" />
//                   <BenchmarkBar label="Avg Order (AOV) vs Region" storeValue={selectedStore.AOV} regionAvg={regionalAverages.aov} format="$" />
//                   <BenchmarkBar label="Waste Impact vs Region" storeValue={selectedStore.WASTE_COST} regionAvg={regionalAverages.wasteCost} format="$" reverseColors />
//                 </div>
//               </div>

//               {/* Standard Drill-down Content */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
//                 {/* Left Column: KPI Grid & Donut */}
//                 <div className="space-y-6 col-span-1 min-w-0">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="bg-slate-50 dark:bg-[#151c2c] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Weekly Rev</p>
//                       <p className="text-xl font-bold text-slate-900 dark:text-white">${selectedStore.REVENUE.toLocaleString()}</p>
//                     </div>
//                     <div className="bg-slate-50 dark:bg-[#151c2c] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
//                       <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1 font-bold">AOV</p>
//                       <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">${selectedStore.AOV.toFixed(2)}</p>
//                     </div>
//                     <div className={`p-4 rounded-2xl border ${selectedStore.RATING < 4.0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-[#151c2c] border-slate-100 dark:border-white/5'}`}>
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Avg Rating</p>
//                       <p className={`text-xl font-bold ${selectedStore.RATING < 4.0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{selectedStore.RATING.toFixed(1)} <span className="text-xs font-medium text-slate-400">/ 5</span></p>
//                     </div>
//                     <div className={`p-4 rounded-2xl border ${selectedStore.WASTE_LBS > 1000 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-[#151c2c] border-slate-100 dark:border-white/5'}`}>
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Waste Impact</p>
//                       <p className={`text-xl font-bold ${selectedStore.WASTE_LBS > 1000 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>${selectedStore.WASTE_COST.toLocaleString()}</p>
//                     </div>
//                   </div>

//                   <div className="bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
//                     <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Distribution</h4>
//                     <div className="h-[140px] w-full">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie data={selectedStore.ORDER_TYPES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="rgba(255,255,255,0.05)" strokeWidth={2} cornerRadius={4}>
//                             {selectedStore.ORDER_TYPES.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
//                           </Pie>
//                           <Tooltip formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }}/>
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <div className="flex justify-center flex-wrap gap-4 text-xs mt-4 font-medium">
//                       {selectedStore.ORDER_TYPES.map(type => (
//                         <div key={type.name} className="flex items-center gap-1.5">
//                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
//                           <span className="text-slate-600 dark:text-slate-300">{type.name}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Middle Column: Store Area Chart */}
//                 <div className="col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 min-w-0 flex flex-col">
//                   <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">7-Day Local Trend</h4>
//                   <div className="flex-1 min-h-[200px] w-full mt-2">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <AreaChart data={selectedStore.SALES_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorLocalSales" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                         <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} tick={{fill: '#64748b'}} />
//                         <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
//                         <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="url(#colorLocalSales)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
//                       </AreaChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>

//                 {/* Right Column: Recent Reviews */}
//                 <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex flex-col min-w-0">
//                   <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
//                     Recent Feedback 
//                     {selectedStore.RATING < 4.0 && <span className="text-rose-600 dark:text-rose-400 text-[10px] bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle className="h-3 w-3"/> ACTION NEEDED</span>}
//                   </h4>
//                   <div className="space-y-3 overflow-y-auto flex-1 max-h-[350px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                     {selectedStore.RECENT_REVIEWS.length > 0 ? selectedStore.RECENT_REVIEWS.map(review => (
//                       <div key={review.id} className="bg-white dark:bg-[#0f1523] p-4 rounded-xl border border-slate-100 dark:border-white/5 text-sm shadow-sm">
//                         <div className="flex justify-between items-center mb-2">
//                           <div className="text-amber-400 text-sm tracking-widest">{"★".repeat(Math.round(review.rating))}<span className="text-slate-200 dark:text-slate-700">{"★".repeat(5-Math.round(review.rating))}</span></div>
//                           <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{review.date}</span>
//                         </div>
//                         <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{review.text}"</p>
//                       </div>
//                     )) : (
//                        <p className="text-sm text-slate-500 italic mt-4 text-center">No recent reviews found.</p>
//                     )}
//                   </div>
//                 </div>

//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// // ── Enhanced Sub-Components ────────────────────────────────────────

// function BenchmarkBar({ label, storeValue, regionAvg, format = "", reverseColors = false }: { label: string, storeValue: number, regionAvg: number, format?: string, reverseColors?: boolean }) {
//   // Calculate percentage fill based on the max of either store or avg (plus 10% padding)
//   const max = Math.max(storeValue, regionAvg) * 1.1;
//   const storePct = (storeValue / max) * 100;
//   const avgPct = (regionAvg / max) * 100;
  
//   // Determine if store is doing "better" than average
//   const isBetter = reverseColors ? storeValue <= regionAvg : storeValue >= regionAvg;
//   const barColor = isBetter ? 'bg-emerald-500' : 'bg-rose-500';

//   return (
//     <div className="flex flex-col gap-2 relative">
//       <div className="flex justify-between items-end">
//         <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
//         <span className="text-sm font-bold dark:text-white">{format === "$" ? `$${storeValue.toLocaleString(undefined, {minimumFractionDigits: format==='$'&&storeValue<100?2:0, maximumFractionDigits:2})}` : storeValue}</span>
//       </div>
//       <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
//         <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${storePct}%` }}></div>
//       </div>
//       {/* The Average Line Marker */}
//       <div className="absolute top-6 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10 rounded-full" style={{ left: `${avgPct}%`, height: '14px' }}></div>
//       <span className="text-[10px] text-slate-400 absolute -bottom-4" style={{ left: `max(0%, calc(${avgPct}% - 12px))` }}>Avg: {format === "$" ? `$${regionAvg.toLocaleString(undefined, {maximumFractionDigits: 0})}` : regionAvg.toFixed(1)}</span>
//     </div>
//   );
// }

// function SortableHeader({ label, field, currentSort, dir, onSort }: { label: string, field: SortField, currentSort: SortField, dir: 'asc'|'desc', onSort: (f: SortField)=>void }) {
//   return (
//     <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors select-none" onClick={() => onSort(field)}>
//       <div className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
//         {label}
//         <ArrowUpDown className={`h-3 w-3 transition-colors ${currentSort === field ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
//       </div>
//     </th>
//   );
// }

// function KpiCard({ title, value, trend, reverseColors = false }: { title: string, value: string, trend: number, reverseColors?: boolean }) {
//   const isPositiveTrend = trend > 0;
//   const isGood = reverseColors ? !isPositiveTrend : isPositiveTrend;
//   return (
//     <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
//       <CardContent className="p-6">
//         <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
//         <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">{value}</h3>
//         <div className={`flex items-center text-xs font-bold px-2.5 py-1 w-fit rounded-md ${isGood ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
//           {isPositiveTrend ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
//           <span>{Math.abs(trend || 0).toFixed(1)}% vs last week</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: StoreMetrics["STATUS"] }) {
//   switch (status) {
//     case "Healthy": return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Healthy</Badge>;
//     case "Attention": return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Attention</Badge>;
//     case "Critical": return (
//       <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1 flex items-center gap-1.5 w-fit ml-auto">
//         <span className="relative flex h-2 w-2">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//           <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
//         </span>
//         Critical
//       </Badge>
//     );
//   }
// }

// import { useEffect, useState, useMemo } from "react";
// import {
//   BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList, ScatterChart, Scatter, ZAxis
// } from "recharts";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Search, TrendingDown, TrendingUp, AlertCircle, IceCream2, MapPin, Download, Moon, Sun, ArrowUpDown, Sparkles, Activity, Target, CalendarDays, Calendar as CalendarIcon, Crosshair } from "lucide-react";
// import { querySnowflake } from "@/lib/snowflake";

// // ── Types ───────────────────────────────────────────────────────
// interface Review { id: string; text: string; rating: number; date: string; }
// interface OrderType { name: string; value: number; color: string; }
// interface StoreMetrics {
//   LOCATION_ID: number;
//   NAME: string;
//   CITY: string;
//   MANAGER_NAME: string; // NEW: Pulled from seed data
//   REVENUE: number;
//   REVENUE_TREND: number;
//   AOV: number;
//   RATING: number;
//   WASTE_LBS: number;
//   WASTE_COST: number;
//   WASTE_TREND: number;
//   STATUS: "Healthy" | "Attention" | "Critical";
//   RECENT_REVIEWS: Review[];
//   SALES_HISTORY: { day: string; sales: number }[];
//   ORDER_TYPES: OrderType[];
// }

// type SortField = 'NAME' | 'REVENUE' | 'AOV' | 'RATING' | 'WASTE_LBS';

// // ── App ─────────────────────────────────────────────────────────
// export default function App() {
//   const [stores, setStores] = useState<StoreMetrics[]>([]);
//   const [globalTrend, setGlobalTrend] = useState<any[]>([]);
//   const [globalWaste, setGlobalWaste] = useState<any[]>([]);
//   const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [selectedStore, setSelectedStore] = useState<StoreMetrics | null>(null);
  
//   const [dateMode, setDateMode] = useState<"preset" | "custom">("preset");
//   const [timeframe, setTimeframe] = useState("30d"); 
//   const [customDate, setCustomDate] = useState({ start: "2025-11-01", end: "2026-01-31" });

//   const [sortField, setSortField] = useState<SortField>('REVENUE');
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
//   const [isDarkMode, setIsDarkMode] = useState(true);

//   useEffect(() => {
//     if (isDarkMode) document.documentElement.classList.add('dark');
//     else document.documentElement.classList.remove('dark');
//   }, [isDarkMode]);

//   // Fetch Real Snowflake Data dynamically
//   useEffect(() => {
//     async function fetchData() {
//       setLoading(true);
      
//       let currentSaleFilter = "";
//       let prevSaleFilter = "";
//       let currentInvFilter = "";
//       let prevInvFilter = "";
//       const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : timeframe === '180d' ? 180 : 365;
      
//       // Determine if we should group the timeline by DAY or by WEEK based on the selected range length
//       const isLongTerm = days > 31 || dateMode === 'custom';
//       const dateGrouping = isLongTerm ? `DATE_TRUNC('week', SALE_DATE)` : `SALE_DATE`;
//       const dateSelect = isLongTerm ? `TO_CHAR(DATE_TRUNC('week', SALE_DATE), 'Mon DD')` : `TO_CHAR(SALE_DATE, 'Mon DD')`;

//       if (dateMode === 'preset') {
//         currentSaleFilter = `SALE_DATE >= DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
//         prevSaleFilter = `SALE_DATE >= DATEADD(day, -${days * 2}, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
        
//         currentInvFilter = `RECORD_DATE >= DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
//         prevInvFilter = `RECORD_DATE >= DATEADD(day, -${days * 2}, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
//       } else {
//         const s = new Date(customDate.start);
//         const e = new Date(customDate.end);
//         const diffTime = Math.abs(e.getTime() - s.getTime());
//         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

//         const prevStart = new Date(s); prevStart.setDate(prevStart.getDate() - diffDays);
//         const prevEnd = new Date(s); prevEnd.setDate(prevEnd.getDate() - 1);

//         const prevStartStr = prevStart.toISOString().split('T')[0];
//         const prevEndStr = prevEnd.toISOString().split('T')[0];

//         currentSaleFilter = `SALE_DATE >= '${customDate.start}' AND SALE_DATE <= '${customDate.end}'`;
//         prevSaleFilter = `SALE_DATE >= '${prevStartStr}' AND SALE_DATE <= '${prevEndStr}'`;

//         currentInvFilter = `RECORD_DATE >= '${customDate.start}' AND RECORD_DATE <= '${customDate.end}'`;
//         prevInvFilter = `RECORD_DATE >= '${prevStartStr}' AND RECORD_DATE <= '${prevEndStr}'`;
//       }

//       try {
//         const data = await querySnowflake<any>(`
//           WITH GlobalMaxDate AS (SELECT MAX(SALE_DATE) as max_date FROM DAILY_SALES),
//           RevenueStats AS (
//             SELECT LOCATION_ID, 
//               SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) as TOTAL_REVENUE,
//               SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) / NULLIF(SUM(CASE WHEN ${currentSaleFilter} THEN NUM_ORDERS ELSE 0 END), 0) as AOV,
//               (SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) - SUM(CASE WHEN ${prevSaleFilter} THEN REVENUE ELSE 0 END)) / NULLIF(SUM(CASE WHEN ${prevSaleFilter} THEN REVENUE ELSE 0 END), 0) * 100 AS REVENUE_TREND
//             FROM DAILY_SALES GROUP BY LOCATION_ID
//           ),
//           RatingStats AS (SELECT LOCATION_ID, AVG(RATING) as AVG_RATING FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID),
//           WasteStats AS (
//             SELECT LOCATION_ID, 
//               SUM(CASE WHEN ${currentInvFilter} THEN UNITS_WASTED ELSE 0 END) as TOTAL_WASTE_LBS,
//               SUM(CASE WHEN ${currentInvFilter} THEN WASTE_COST ELSE 0 END) as TOTAL_WASTE_COST,
//               (SUM(CASE WHEN ${currentInvFilter} THEN UNITS_WASTED ELSE 0 END) - SUM(CASE WHEN ${prevInvFilter} THEN UNITS_WASTED ELSE 0 END)) / NULLIF(SUM(CASE WHEN ${prevInvFilter} THEN UNITS_WASTED ELSE 0 END), 0) * 100 AS WASTE_TREND
//             FROM INVENTORY GROUP BY LOCATION_ID
//           ),
//           RecentReviews AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('id', REVIEW_ID, 'rating', RATING, 'text', REVIEW_TEXT, 'date', TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD'))) WITHIN GROUP (ORDER BY REVIEW_DATE DESC) as REVIEWS
//             FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID
//           ),
//           SalesHistory AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Mon DD'), 'sales', REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as HISTORY
//             FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY LOCATION_ID
//           ),
//           OrderTypesStore AS (
//             SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('name', INITCAP(ORDER_TYPE), 'value', REVENUE)) WITHIN GROUP (ORDER BY REVENUE DESC) as ORDER_TYPES
//             FROM (SELECT LOCATION_ID, ORDER_TYPE, SUM(REVENUE) as REVENUE FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY LOCATION_ID, ORDER_TYPE)
//             GROUP BY LOCATION_ID
//           ),
//           CombinedData AS (
//             SELECT l.LOCATION_ID, l.NAME, l.CITY, l.MANAGER_NAME,
//               COALESCE(rs.TOTAL_REVENUE, 0) as REVENUE, COALESCE(rs.REVENUE_TREND, 0) as REVENUE_TREND, COALESCE(rs.AOV, 0) as AOV,
//               COALESCE(rt.AVG_RATING, 0) as RATING, 
//               COALESCE(ws.TOTAL_WASTE_LBS, 0) as WASTE_LBS, COALESCE(ws.TOTAL_WASTE_COST, 0) as WASTE_COST, COALESCE(ws.WASTE_TREND, 0) as WASTE_TREND,
//               CASE WHEN COALESCE(rt.AVG_RATING, 0) < 4.0 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1500 THEN 'Critical' WHEN COALESCE(rt.AVG_RATING, 0) < 4.3 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1000 THEN 'Attention' ELSE 'Healthy' END as STATUS,
//               COALESCE(rr.REVIEWS, ARRAY_CONSTRUCT()) as RECENT_REVIEWS, COALESCE(sh.HISTORY, ARRAY_CONSTRUCT()) as SALES_HISTORY, COALESCE(ot.ORDER_TYPES, ARRAY_CONSTRUCT()) as ORDER_TYPES
//             FROM LOCATIONS l
//             LEFT JOIN RevenueStats rs ON l.LOCATION_ID = rs.LOCATION_ID LEFT JOIN RatingStats rt ON l.LOCATION_ID = rt.LOCATION_ID LEFT JOIN WasteStats ws ON l.LOCATION_ID = ws.LOCATION_ID LEFT JOIN RecentReviews rr ON l.LOCATION_ID = rr.LOCATION_ID LEFT JOIN SalesHistory sh ON l.LOCATION_ID = sh.LOCATION_ID LEFT JOIN OrderTypesStore ot ON l.LOCATION_ID = ot.LOCATION_ID
//           ),
//           GlobalSalesCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('day', DATE_STR, 'sales', TOTAL_REVENUE)) WITHIN GROUP (ORDER BY SORT_DATE ASC) as global_sales
//             FROM (
//               SELECT 
//                 ${dateSelect} as DATE_STR,
//                 MIN(SALE_DATE) as SORT_DATE,
//                 SUM(REVENUE) as TOTAL_REVENUE 
//               FROM DAILY_SALES 
//               WHERE ${currentSaleFilter} 
//               GROUP BY ${dateGrouping}
//             )
//           ),
//           GlobalWasteCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('category', INITCAP(REPLACE(CATEGORY, '_', ' ')), 'amount', TOTAL_WASTED)) as global_waste
//             FROM (SELECT CATEGORY, SUM(UNITS_WASTED) as TOTAL_WASTED FROM INVENTORY WHERE ${currentInvFilter} GROUP BY CATEGORY)
//           ),
//           DayOfWeekCTE AS (
//             SELECT ARRAY_AGG(OBJECT_CONSTRUCT('dayName', DOW, 'avgRev', AVG_REV)) WITHIN GROUP (ORDER BY DOW_NUM) as dow_data
//             FROM (
//               SELECT DAYNAME(SALE_DATE) as DOW, DAYOFWEEK(SALE_DATE) as DOW_NUM, AVG(REVENUE) as AVG_REV
//               FROM DAILY_SALES WHERE ${currentSaleFilter}
//               GROUP BY DAYNAME(SALE_DATE), DAYOFWEEK(SALE_DATE)
//             )
//           )
          
//           SELECT TO_JSON(OBJECT_CONSTRUCT(
//             'stores', (SELECT ARRAY_AGG(OBJECT_CONSTRUCT('LOCATION_ID', LOCATION_ID, 'NAME', NAME, 'CITY', CITY, 'MANAGER_NAME', MANAGER_NAME, 'REVENUE', REVENUE, 'REVENUE_TREND', REVENUE_TREND, 'AOV', AOV, 'RATING', RATING, 'WASTE_LBS', WASTE_LBS, 'WASTE_COST', WASTE_COST, 'WASTE_TREND', WASTE_TREND, 'STATUS', STATUS, 'RECENT_REVIEWS', RECENT_REVIEWS, 'SALES_HISTORY', SALES_HISTORY, 'ORDER_TYPES', ORDER_TYPES)) FROM CombinedData),
//             'globalSalesTrend', (SELECT global_sales FROM GlobalSalesCTE),
//             'globalWasteData', (SELECT global_waste FROM GlobalWasteCTE),
//             'dayOfWeekData', (SELECT dow_data FROM DayOfWeekCTE)
//           )) AS PAYLOAD;
//         `);

//         if (data && data.length > 0 && data[0].PAYLOAD) {
//           const payload = typeof data[0].PAYLOAD === 'string' ? JSON.parse(data[0].PAYLOAD) : data[0].PAYLOAD;
//           const colorMap: Record<string, string> = { 'Takeout': '#0ea5e9', 'Dine-In': '#a855f7', 'Delivery': '#f43f5e' };
          
//           const formattedStores = (payload.stores || []).map((store: any) => ({
//             ...store,
//             RATING: Number(store.RATING) || 0,
//             REVENUE: Number(store.REVENUE) || 0,
//             AOV: Number(store.AOV) || 0,
//             WASTE_LBS: Number(store.WASTE_LBS) || 0,
//             WASTE_COST: Number(store.WASTE_COST) || 0,
//             RECENT_REVIEWS: (store.RECENT_REVIEWS || []).slice(0, 3), 
//             SALES_HISTORY: store.SALES_HISTORY || [],
//             ORDER_TYPES: (store.ORDER_TYPES || []).map((ot: any) => ({ ...ot, color: colorMap[ot.name] || '#cbd5e1' }))
//           }));

//           setStores(formattedStores as StoreMetrics[]);
//           setGlobalTrend(payload.globalSalesTrend || []);
//           setGlobalWaste(payload.globalWasteData || []);
//           setDayOfWeekData(payload.dayOfWeekData || []);
//         }
//       } catch (e) {
//         console.error("Snowflake query failed:", e);
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [timeframe, dateMode, customDate]);

//   const handleSort = (field: SortField) => {
//     if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     else { setSortField(field); setSortDirection('desc'); }
//   };

//   const sortedAndFilteredStores = useMemo(() => {
//     let result = stores.filter(s => {
//       const matchesSearch = s.NAME.toLowerCase().includes(searchQuery.toLowerCase()) || s.MANAGER_NAME.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchesStatus = statusFilter === "All" || s.STATUS === statusFilter;
//       return matchesSearch && matchesStatus;
//     });
//     return result.sort((a, b) => {
//       const aVal = a[sortField];
//       const bVal = b[sortField];
//       if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
//       if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }, [stores, searchQuery, statusFilter, sortField, sortDirection]);

//   const globalMetrics = useMemo(() => stores.reduce((acc, store) => {
//     acc.revenue += store.REVENUE; 
//     acc.wasteLbs += store.WASTE_LBS; 
//     acc.wasteCost += store.WASTE_COST;
//     acc.ratingSum += store.RATING;
//     acc.aovSum += store.AOV;
//     if (store.STATUS !== "Healthy") acc.alerts++;
//     return acc;
//   }, { revenue: 0, wasteLbs: 0, wasteCost: 0, ratingSum: 0, aovSum: 0, alerts: 0 }), [stores]);

//   const regionalAverages = useMemo(() => ({
//     revenue: stores.length ? globalMetrics.revenue / stores.length : 0,
//     rating: stores.length ? globalMetrics.ratingSum / stores.length : 0,
//     wasteCost: stores.length ? globalMetrics.wasteCost / stores.length : 0,
//     aov: stores.length ? globalMetrics.aovSum / stores.length : 0
//   }), [globalMetrics, stores.length]);

//   const avgRating = stores.length ? (globalMetrics.ratingSum / stores.length).toFixed(1) : "0.0";
  
//   const bestDay = useMemo(() => {
//     if (!dayOfWeekData.length) return null;
//     return dayOfWeekData.reduce((prev, current) => (prev.avgRev > current.avgRev) ? prev : current);
//   }, [dayOfWeekData]);

//   const exportCSV = () => {
//     const headers = ["Location ID,Name,City,Manager,Revenue,AOV,Rating,Waste (lbs),Waste Cost,Status\n"];
//     const rows = sortedAndFilteredStores.map(s => 
//       `${s.LOCATION_ID},"${s.NAME}","${s.CITY}","${s.MANAGER_NAME}",${s.REVENUE},${s.AOV.toFixed(2)},${s.RATING.toFixed(1)},${s.WASTE_LBS},${s.WASTE_COST},${s.STATUS}`
//     ).join("\n");
//     const blob = new Blob([headers + rows], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `snowcone-report-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-[#090e17] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 pb-10">
      
//       <header className="bg-white/70 dark:bg-[#0f1523]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm dark:shadow-none">
//         <div className="flex items-center gap-3 text-primary">
//           <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
//             <IceCream2 className="h-5 w-5 text-white" />
//           </div>
//           <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
//             Snowcone HQ
//           </h1>
//         </div>
        
//         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
//           <div className="relative flex-1 md:w-56">
//             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
//             <Input placeholder="Search location or manager..." className="pl-9 bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 focus:ring-blue-500 transition-all w-full rounded-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//           </div>
          
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-[130px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full">
//               <SelectValue placeholder="Status" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="All">All Statuses</SelectItem>
//               <SelectItem value="Healthy">Healthy</SelectItem>
//               <SelectItem value="Attention">Attention</SelectItem>
//               <SelectItem value="Critical">Critical</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* DYNAMIC TIMEFRAME SELECTOR */}
//           <Select value={timeframe} onValueChange={(val) => {
//             setTimeframe(val);
//             if (val === 'custom') setDateMode('custom');
//             else setDateMode('preset');
//           }}>
//             <SelectTrigger className="w-[150px] bg-slate-100/50 dark:bg-[#151c2c] border-slate-200 dark:border-white/5 rounded-full font-semibold text-indigo-600 dark:text-indigo-400">
//               <SelectValue placeholder="Timeframe" />
//             </SelectTrigger>
//             <SelectContent className="dark:bg-[#0f1523] dark:border-white/10">
//               <SelectItem value="7d">Last 7 Days</SelectItem>
//               <SelectItem value="30d">Last 30 Days</SelectItem>
//               <SelectItem value="90d">Quarterly (90d)</SelectItem>
//               <SelectItem value="180d">6 Months</SelectItem>
//               <SelectItem value="365d">Yearly</SelectItem>
//               <SelectItem value="custom">Custom Range...</SelectItem>
//             </SelectContent>
//           </Select>

//           {/* CUSTOM DATE RANGE INPUTS */}
//           {dateMode === 'custom' && (
//             <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-[#151c2c] border border-slate-200 dark:border-white/5 rounded-full px-3 py-1.5 shadow-inner">
//               <CalendarIcon className="h-4 w-4 text-slate-400" />
//               <input 
//                 type="date" 
//                 value={customDate.start} 
//                 onChange={(e) => setCustomDate(prev => ({...prev, start: e.target.value}))} 
//                 className="bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
//               />
//               <span className="text-slate-400 text-sm font-medium">to</span>
//               <input 
//                 type="date" 
//                 value={customDate.end} 
//                 onChange={(e) => setCustomDate(prev => ({...prev, end: e.target.value}))} 
//                 className="bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
//               />
//             </div>
//           )}

//           <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV" className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             <Download className="h-4 w-4" />
//           </Button>
//           <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-full border-slate-200 dark:border-white/5 dark:bg-[#151c2c] hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
//             {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
//           </Button>
//         </div>
//       </header>

//       <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        
//         {!loading && stores.length > 0 && (
//           <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-sm backdrop-blur-sm">
//             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl flex-shrink-0">
//               <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
//             </div>
//             <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">
//               <span className="font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-400 text-xs mr-2 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full">AI Insight</span>
//               You have <strong className="text-rose-500 dark:text-rose-400 font-semibold">{globalMetrics.alerts} stores</strong> requiring attention. 
//               {bestDay && <span className="ml-1">Operations optimization tip: <strong>{bestDay.dayName}s</strong> generate the highest average yield. Consider staffing adjustments.</span>}
//             </p>
//           </div>
//         )}

//         {loading && (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Activity className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
//             <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm">Processing Operational Forecast...</p>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//             <KpiCard title="Total Revenue" value={`$${(globalMetrics.revenue / 1000).toFixed(1)}k`} trend={+5.2} />
//             <KpiCard title="Avg Customer Rating" value={`${avgRating} / 5.0`} trend={-0.1} />
//             <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
//               <CardContent className="p-6">
//                 <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Waste Impact</p>
//                 <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">${globalMetrics.wasteCost.toLocaleString()}</h3>
//                 <div className="flex items-center text-xs font-bold px-2.5 py-1 w-fit rounded-md bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
//                   <TrendingDown className="h-3 w-3 mr-1" />
//                   <span>{globalMetrics.wasteLbs} lbs discarded</span>
//                 </div>
//               </CardContent>
//             </Card>
//             <Card className={`relative overflow-hidden border ${globalMetrics.alerts > 0 ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-sm" : "bg-slate-50 dark:bg-[#111827] border-slate-200 dark:border-white/5"}`}>
//               {globalMetrics.alerts > 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>}
//               <CardContent className="p-6 flex items-center gap-5 relative z-10">
//                 <div className={`p-3 rounded-2xl ${globalMetrics.alerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
//                   <AlertCircle className="h-8 w-8" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Required</p>
//                   <h3 className={`text-3xl font-bold mt-1 ${globalMetrics.alerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{globalMetrics.alerts} Stores</h3>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {!loading && stores.length > 0 && (
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
//             {/* ── Location Scorecard ── */}
//             <Card className="xl:col-span-2 shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 flex flex-col rounded-2xl overflow-hidden min-h-[500px]">
//               <CardHeader className="bg-slate-50/50 dark:bg-[#0f1523]/50 border-b border-slate-200 dark:border-white/5 pb-4">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <CardTitle className="text-lg">Location Scorecard</CardTitle>
//                     <CardDescription>Select a row to view AI diagnosis & benchmarking.</CardDescription>
//                   </div>
//                   <Badge variant="secondary" className="font-mono bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400">
//                     {dateMode === 'preset' ? timeframe.toUpperCase() : 'CUSTOM RANGE'}
//                   </Badge>
//                 </div>
//               </CardHeader>
//               <CardContent className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                 <table className="w-full text-sm text-left min-w-[600px] border-collapse">
//                   <thead className="bg-white/90 dark:bg-[#0f1523]/90 backdrop-blur-sm text-slate-500 dark:text-slate-400 sticky top-0 z-20 shadow-sm dark:shadow-none dark:border-b dark:border-white/5">
//                     <tr>
//                       <SortableHeader label="Location & Manager" field="NAME" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Revenue" field="REVENUE" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="AOV" field="AOV" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Rating" field="RATING" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <SortableHeader label="Waste (lbs)" field="WASTE_LBS" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
//                       <th className="px-6 py-4 font-semibold text-right uppercase text-xs tracking-wider">Status</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100 dark:divide-white/5">
//                     {sortedAndFilteredStores.map((store) => (
//                       <tr key={store.LOCATION_ID} onClick={() => setSelectedStore(store)} className="group hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer transition-all duration-200">
//                         <td className="px-6 py-4">
//                           <span className="font-medium text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{store.NAME}</span>
//                           <span className="text-[10px] text-slate-500 uppercase tracking-wider">{store.MANAGER_NAME}</span>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">${store.REVENUE.toLocaleString()}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.REVENUE_TREND > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.REVENUE_TREND > 0 ? '▲' : '▼'} {Math.abs(store.REVENUE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 font-semibold text-indigo-600 dark:text-indigo-400">
//                           ${store.AOV.toFixed(2)}
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
//                             {store.RATING.toFixed(1)}
//                             {store.RATING < 4.0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <span className="block font-semibold text-slate-700 dark:text-slate-200">{store.WASTE_LBS}</span>
//                           <span className={`text-[11px] font-medium flex items-center gap-0.5 mt-0.5 ${store.WASTE_TREND < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                             {store.WASTE_TREND < 0 ? '▼' : '▲'} {Math.abs(store.WASTE_TREND || 0).toFixed(1)}%
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-right">
//                           <StatusBadge status={store.STATUS} />
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </CardContent>
//             </Card>

//             {/* Right Column: Dynamic Data Visualizations */}
//             <div className="space-y-6 flex flex-col">
              
//               {/* Timeline Chart - Will automatically group by week for >30d */}
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2 flex flex-row items-center justify-between">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Timeline</CardTitle>
//                 </CardHeader>
//                 <CardContent className="h-[200px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <AreaChart data={globalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                       <defs>
//                         <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
//                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                       <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                       <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{fill: '#64748b'}} />
//                       <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}/>
//                       <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fill="url(#colorSales)" />
//                     </AreaChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//               {/* Operational Heatmap (Day of Week Analysis) with FIX applied */}
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2 flex flex-row items-center justify-between">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Hotspots by Day</CardTitle>
//                   <CalendarDays className="h-4 w-4 text-indigo-500" />
//                 </CardHeader>
//                 <CardContent className="h-[200px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={dayOfWeekData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
//                       <defs>
//                         <linearGradient id="colorDOW" x1="0" y1="0" x2="0" y2="1">
//                           <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/>
//                           <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9}/>
//                         </linearGradient>
//                       </defs>
//                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                       <XAxis dataKey="dayName" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                       {/* FIX: Formatter now accurately displays k values (e.g. 0.8k) or absolute values without wildly rounding */}
//                       <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} tick={{fill: '#64748b'}} />
//                       <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, 'Avg Daily Rev']}/>
//                       <Bar dataKey="avgRev" radius={[4, 4, 0, 0]} barSize={24} fill="url(#colorDOW)">
//                         <LabelList dataKey="avgRev" position="top" fill="#94a3b8" fontSize={10} formatter={(v: number) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(0)}`} />
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>
              
//               {/* ADVANCED BI: Store Performance Matrix (Scatter) */}
//               <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl">
//                 <CardHeader className="pb-2 flex flex-row items-center justify-between">
//                   <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Efficiency Matrix (Rev vs Rating)</CardTitle>
//                   <Crosshair className="h-4 w-4 text-emerald-500" />
//                 </CardHeader>
//                 <CardContent className="h-[200px]">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <ScatterChart margin={{ top: 10, right: 10, bottom: -10, left: -20 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
//                       <XAxis type="number" dataKey="RATING" name="Rating" domain={[2, 5]} fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                       <YAxis type="number" dataKey="REVENUE" name="Revenue" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
//                       <ZAxis type="number" range={[60, 60]} />
//                       <Tooltip 
//                         cursor={{strokeDasharray: '3 3'}}
//                         content={({ active, payload }) => {
//                           if (active && payload && payload.length) {
//                             const data = payload[0].payload;
//                             return (
//                               <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white shadow-xl text-sm">
//                                 <p className="font-bold mb-1">{data.NAME}</p>
//                                 <p className="text-emerald-400">Rev: ${data.REVENUE.toLocaleString()}</p>
//                                 <p className="text-amber-400">Rating: {data.RATING.toFixed(1)}</p>
//                               </div>
//                             );
//                           }
//                           return null;
//                         }} 
//                       />
//                       <Scatter data={stores} fill="#10b981" />
//                     </ScatterChart>
//                   </ResponsiveContainer>
//                 </CardContent>
//               </Card>

//             </div>
//           </div>
//         )}
//       </main>

//       {/* ── Advanced Business Benchmarking Modal ── */}
//       <Dialog open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
//         <DialogContent 
//           className="bg-white dark:bg-[#0f1523] text-slate-900 dark:text-slate-50 border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
//           style={{ maxWidth: '1100px', width: '95vw' }}
//         >
//           <DialogHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
//                   <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//                 </div>
//                 <div>
//                   <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedStore?.NAME}</DialogTitle>
//                   <DialogDescription className="text-sm mt-1 text-slate-500 font-medium">
//                     {selectedStore?.CITY} • Store ID: {selectedStore?.LOCATION_ID} • Manager: {selectedStore?.MANAGER_NAME}
//                   </DialogDescription>
//                 </div>
//               </div>
//               <StatusBadge status={selectedStore?.STATUS || "Healthy"} />
//             </div>
//           </DialogHeader>
          
//           {selectedStore && (
//             <div className="flex flex-col gap-6 mt-4">
              
//               <div className="bg-gradient-to-r from-slate-50 to-white dark:from-[#151c2c] dark:to-[#111827] rounded-2xl p-5 border border-slate-100 dark:border-white/5">
//                 <div className="flex items-start gap-3 mb-4">
//                   <Target className="h-5 w-5 text-indigo-500 mt-0.5" />
//                   <div>
//                     <h4 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Store Diagnosis vs Region</h4>
//                     <div className="flex gap-2 flex-wrap items-center mt-1 text-sm">
//                       {selectedStore.REVENUE > regionalAverages.revenue * 1.2 ? <span className="text-emerald-500 font-semibold">• Top tier revenue producer.</span> : selectedStore.REVENUE < regionalAverages.revenue * 0.8 ? <span className="text-rose-500 font-semibold">• Underperforming in overall sales.</span> : <span className="text-slate-500 dark:text-slate-400">• Revenue is aligned with the regional average.</span>}
//                       {selectedStore.WASTE_COST > regionalAverages.wasteCost * 1.3 ? <span className="text-rose-500 font-semibold">• Severe inventory leakage detected.</span> : selectedStore.WASTE_COST < regionalAverages.wasteCost * 0.7 ? <span className="text-emerald-500 font-semibold">• Excellent waste control.</span> : null}
//                       {selectedStore.AOV > regionalAverages.aov * 1.15 ? <span className="text-indigo-500 dark:text-indigo-400 font-semibold">• Staff is successfully upselling (High AOV).</span> : null}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
//                   <BenchmarkBar label="Revenue vs Region" storeValue={selectedStore.REVENUE} regionAvg={regionalAverages.revenue} format="$" />
//                   <BenchmarkBar label="Avg Order (AOV) vs Region" storeValue={selectedStore.AOV} regionAvg={regionalAverages.aov} format="$" />
//                   <BenchmarkBar label="Waste Impact vs Region" storeValue={selectedStore.WASTE_COST} regionAvg={regionalAverages.wasteCost} format="$" reverseColors />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
//                 <div className="space-y-6 col-span-1 min-w-0">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="bg-slate-50 dark:bg-[#151c2c] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Selected Rev</p>
//                       <p className="text-xl font-bold text-slate-900 dark:text-white">${selectedStore.REVENUE.toLocaleString()}</p>
//                     </div>
//                     <div className="bg-slate-50 dark:bg-[#151c2c] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
//                       <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1 font-bold">AOV</p>
//                       <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">${selectedStore.AOV.toFixed(2)}</p>
//                     </div>
//                     <div className={`p-4 rounded-2xl border ${selectedStore.RATING < 4.0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-[#151c2c] border-slate-100 dark:border-white/5'}`}>
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Avg Rating</p>
//                       <p className={`text-xl font-bold ${selectedStore.RATING < 4.0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{selectedStore.RATING.toFixed(1)} <span className="text-xs font-medium text-slate-400">/ 5</span></p>
//                     </div>
//                     <div className={`p-4 rounded-2xl border ${selectedStore.WASTE_LBS > 1000 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-[#151c2c] border-slate-100 dark:border-white/5'}`}>
//                       <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Waste Impact</p>
//                       <p className={`text-xl font-bold ${selectedStore.WASTE_LBS > 1000 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>${selectedStore.WASTE_COST.toLocaleString()}</p>
//                     </div>
//                   </div>

//                   <div className="bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5">
//                     <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Distribution</h4>
//                     <div className="h-[140px] w-full">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie data={selectedStore.ORDER_TYPES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="rgba(255,255,255,0.05)" strokeWidth={2} cornerRadius={4}>
//                             {selectedStore.ORDER_TYPES.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
//                           </Pie>
//                           <Tooltip formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }}/>
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </div>
//                     <div className="flex justify-center flex-wrap gap-4 text-xs mt-4 font-medium">
//                       {selectedStore.ORDER_TYPES.map(type => (
//                         <div key={type.name} className="flex items-center gap-1.5">
//                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
//                           <span className="text-slate-600 dark:text-slate-300">{type.name}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 min-w-0 flex flex-col">
//                   <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local Trend</h4>
//                   <div className="flex-1 min-h-[200px] w-full mt-2">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <AreaChart data={selectedStore.SALES_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                         <defs>
//                           <linearGradient id="colorLocalSales" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
//                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
//                         <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
//                         <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{fill: '#64748b'}} />
//                         <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
//                         <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="url(#colorLocalSales)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
//                       </AreaChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>

//                 <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-slate-50 dark:bg-[#151c2c] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex flex-col min-w-0">
//                   <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
//                     Recent Feedback 
//                     {selectedStore.RATING < 4.0 && <span className="text-rose-600 dark:text-rose-400 text-[10px] bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle className="h-3 w-3"/> ACTION NEEDED</span>}
//                   </h4>
//                   <div className="space-y-3 overflow-y-auto flex-1 max-h-[350px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
//                     {selectedStore.RECENT_REVIEWS.length > 0 ? selectedStore.RECENT_REVIEWS.map(review => (
//                       <div key={review.id} className="bg-white dark:bg-[#0f1523] p-4 rounded-xl border border-slate-100 dark:border-white/5 text-sm shadow-sm">
//                         <div className="flex justify-between items-center mb-2">
//                           <div className="text-amber-400 text-sm tracking-widest">{"★".repeat(Math.round(review.rating))}<span className="text-slate-200 dark:text-slate-700">{"★".repeat(5-Math.round(review.rating))}</span></div>
//                           <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{review.date}</span>
//                         </div>
//                         <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{review.text}"</p>
//                       </div>
//                     )) : (
//                        <p className="text-sm text-slate-500 italic mt-4 text-center">No recent reviews found.</p>
//                     )}
//                   </div>
//                 </div>

//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// // ── Enhanced Sub-Components ────────────────────────────────────────

// function BenchmarkBar({ label, storeValue, regionAvg, format = "", reverseColors = false }: { label: string, storeValue: number, regionAvg: number, format?: string, reverseColors?: boolean }) {
//   const max = Math.max(storeValue, regionAvg) * 1.1 || 1;
//   const storePct = (storeValue / max) * 100;
//   const avgPct = (regionAvg / max) * 100;
//   const isBetter = reverseColors ? storeValue <= regionAvg : storeValue >= regionAvg;
//   const barColor = isBetter ? 'bg-emerald-500' : 'bg-rose-500';

//   return (
//     <div className="flex flex-col gap-2 relative">
//       <div className="flex justify-between items-end">
//         <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
//         <span className="text-sm font-bold dark:text-white">{format === "$" ? `$${storeValue.toLocaleString(undefined, {minimumFractionDigits: format==='$'&&storeValue<100?2:0, maximumFractionDigits:2})}` : storeValue}</span>
//       </div>
//       <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
//         <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${storePct}%` }}></div>
//       </div>
//       <div className="absolute top-6 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10 rounded-full" style={{ left: `${avgPct}%`, height: '14px' }}></div>
//       <span className="text-[10px] text-slate-400 absolute -bottom-4" style={{ left: `max(0%, calc(${avgPct}% - 12px))` }}>Avg: {format === "$" ? `$${regionAvg.toLocaleString(undefined, {maximumFractionDigits: 0})}` : regionAvg.toFixed(1)}</span>
//     </div>
//   );
// }

// function SortableHeader({ label, field, currentSort, dir, onSort }: { label: string, field: SortField, currentSort: SortField, dir: 'asc'|'desc', onSort: (f: SortField)=>void }) {
//   return (
//     <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors select-none" onClick={() => onSort(field)}>
//       <div className="flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
//         {label}
//         <ArrowUpDown className={`h-3 w-3 transition-colors ${currentSort === field ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
//       </div>
//     </th>
//   );
// }

// function KpiCard({ title, value, trend, reverseColors = false }: { title: string, value: string, trend: number, reverseColors?: boolean }) {
//   const isPositiveTrend = trend > 0;
//   const isGood = reverseColors ? !isPositiveTrend : isPositiveTrend;
//   return (
//     <Card className="shadow-sm dark:bg-[#111827] border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
//       <CardContent className="p-6">
//         <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
//         <h3 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">{value}</h3>
//         <div className={`flex items-center text-xs font-bold px-2.5 py-1 w-fit rounded-md ${isGood ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
//           {isPositiveTrend ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
//           <span>{Math.abs(trend || 0).toFixed(1)}% vs prev period</span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// function StatusBadge({ status }: { status: StoreMetrics["STATUS"] }) {
//   switch (status) {
//     case "Healthy": return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Healthy</Badge>;
//     case "Attention": return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1">Attention</Badge>;
//     case "Critical": return (
//       <Badge variant="outline" className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 uppercase tracking-widest text-[10px] px-2.5 py-1 flex items-center gap-1.5 w-fit ml-auto">
//         <span className="relative flex h-2 w-2">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//           <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
//         </span>
//         Critical
//       </Badge>
//     );
//   }
// }

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingDown, TrendingUp, AlertCircle, IceCream2, MapPin, Download, Moon, Sun, ArrowUpDown, Sparkles, Activity, Target, CalendarIcon, Maximize2 } from "lucide-react";
import { querySnowflake } from "@/lib/snowflake";

// ── Types ───────────────────────────────────────────────────────
interface Review { id: string; text: string; rating: number; date: string; }
interface OrderType { name: string; value: number; color: string; }
interface StoreMetrics {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  MANAGER_NAME: string;
  REVENUE: number;
  REVENUE_TREND: number;
  AOV: number;
  RATING: number;
  WASTE_LBS: number;
  WASTE_COST: number;
  WASTE_TREND: number;
  STATUS: "Healthy" | "Attention" | "Critical";
  RECENT_REVIEWS: Review[];
  SALES_HISTORY: { day: string; sales: number }[];
  ORDER_TYPES: OrderType[];
}

type SortField = 'NAME' | 'REVENUE' | 'AOV' | 'RATING' | 'WASTE_LBS';
type ChartType = 'trend' | 'compare' | 'waste' | null;

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  const [stores, setStores] = useState<StoreMetrics[]>([]);
  const [globalTrend, setGlobalTrend] = useState<any[]>([]);
  const [globalWaste, setGlobalWaste] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All"); 
  const [compareMode, setCompareMode] = useState<"location" | "city" | "day">("location"); 
  const [selectedStore, setSelectedStore] = useState<StoreMetrics | null>(null);
  const [expandedChart, setExpandedChart] = useState<ChartType>(null); // NEW: Expanded Chart State
  
  const [dateMode, setDateMode] = useState<"preset" | "custom">("preset");
  const [timeframe, setTimeframe] = useState("30d"); 
  const [customDate, setCustomDate] = useState({ start: "2025-11-01", end: "2026-01-31" });

  const [sortField, setSortField] = useState<SortField>('REVENUE');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Fetch Real Snowflake Data dynamically
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorState(false);
      
      let currentSaleFilter = "";
      let prevSaleFilter = "";
      let currentInvFilter = "";
      let prevInvFilter = "";
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : timeframe === '180d' ? 180 : 365;
      
      const isLongTerm = days > 31 || dateMode === 'custom';
      const dateGrouping = isLongTerm ? `DATE_TRUNC('week', SALE_DATE)` : `SALE_DATE`;
      const dateSelect = isLongTerm ? `TO_CHAR(DATE_TRUNC('week', SALE_DATE), 'Mon DD')` : `TO_CHAR(SALE_DATE, 'Mon DD')`;

      if (dateMode === 'preset') {
        currentSaleFilter = `SALE_DATE >= DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
        prevSaleFilter = `SALE_DATE >= DATEADD(day, -${days * 2}, (SELECT max_date FROM GlobalMaxDate)) AND SALE_DATE < DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
        currentInvFilter = `RECORD_DATE >= DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
        prevInvFilter = `RECORD_DATE >= DATEADD(day, -${days * 2}, (SELECT max_date FROM GlobalMaxDate)) AND RECORD_DATE < DATEADD(day, -${days}, (SELECT max_date FROM GlobalMaxDate))`;
      } else {
        let s = new Date(customDate.start);
        let e = new Date(customDate.end);
        if (isNaN(s.getTime())) s = new Date("2025-11-01");
        if (isNaN(e.getTime())) e = new Date("2026-01-31");

        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const prevStart = new Date(s); prevStart.setDate(prevStart.getDate() - diffDays);
        const prevEnd = new Date(s); prevEnd.setDate(prevEnd.getDate() - 1);

        const sStr = s.toISOString().split('T')[0];
        const eStr = e.toISOString().split('T')[0];
        const pSStr = prevStart.toISOString().split('T')[0];
        const pEStr = prevEnd.toISOString().split('T')[0];

        currentSaleFilter = `SALE_DATE >= '${sStr}' AND SALE_DATE <= '${eStr}'`;
        prevSaleFilter = `SALE_DATE >= '${pSStr}' AND SALE_DATE <= '${pEStr}'`;
        currentInvFilter = `RECORD_DATE >= '${sStr}' AND RECORD_DATE <= '${eStr}'`;
        prevInvFilter = `RECORD_DATE >= '${pSStr}' AND RECORD_DATE <= '${pEStr}'`;
      }

      try {
        const data = await querySnowflake<any>(`
          WITH GlobalMaxDate AS (SELECT MAX(SALE_DATE) as max_date FROM DAILY_SALES),
          RevenueStats AS (
            SELECT LOCATION_ID, 
              SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) as TOTAL_REVENUE,
              SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) / NULLIF(SUM(CASE WHEN ${currentSaleFilter} THEN NUM_ORDERS ELSE 0 END), 0) as AOV,
              (SUM(CASE WHEN ${currentSaleFilter} THEN REVENUE ELSE 0 END) - SUM(CASE WHEN ${prevSaleFilter} THEN REVENUE ELSE 0 END)) / NULLIF(SUM(CASE WHEN ${prevSaleFilter} THEN REVENUE ELSE 0 END), 0) * 100 AS REVENUE_TREND
            FROM DAILY_SALES GROUP BY LOCATION_ID
          ),
          RatingStats AS (SELECT LOCATION_ID, AVG(RATING) as AVG_RATING FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID),
          WasteStats AS (
            SELECT LOCATION_ID, 
              SUM(CASE WHEN ${currentInvFilter} THEN UNITS_WASTED ELSE 0 END) as TOTAL_WASTE_LBS,
              SUM(CASE WHEN ${currentInvFilter} THEN WASTE_COST ELSE 0 END) as TOTAL_WASTE_COST,
              (SUM(CASE WHEN ${currentInvFilter} THEN UNITS_WASTED ELSE 0 END) - SUM(CASE WHEN ${prevInvFilter} THEN UNITS_WASTED ELSE 0 END)) / NULLIF(SUM(CASE WHEN ${prevInvFilter} THEN UNITS_WASTED ELSE 0 END), 0) * 100 AS WASTE_TREND
            FROM INVENTORY GROUP BY LOCATION_ID
          ),
          RecentReviews AS (
            SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('id', REVIEW_ID, 'rating', RATING, 'text', REVIEW_TEXT, 'date', TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD'))) WITHIN GROUP (ORDER BY REVIEW_DATE DESC) as REVIEWS
            FROM CUSTOMER_REVIEWS GROUP BY LOCATION_ID
          ),
          SalesHistory AS (
            SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('day', TO_CHAR(SALE_DATE, 'Mon DD'), 'sales', REVENUE)) WITHIN GROUP (ORDER BY SALE_DATE ASC) as HISTORY
            FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY LOCATION_ID
          ),
          OrderTypesStore AS (
            SELECT LOCATION_ID, ARRAY_AGG(OBJECT_CONSTRUCT('name', INITCAP(ORDER_TYPE), 'value', REVENUE)) WITHIN GROUP (ORDER BY REVENUE DESC) as ORDER_TYPES
            FROM (SELECT LOCATION_ID, ORDER_TYPE, SUM(REVENUE) as REVENUE FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY LOCATION_ID, ORDER_TYPE)
            GROUP BY LOCATION_ID
          ),
          CombinedData AS (
            SELECT l.LOCATION_ID, l.NAME, l.CITY, l.MANAGER_NAME,
              COALESCE(rs.TOTAL_REVENUE, 0) as REVENUE, COALESCE(rs.REVENUE_TREND, 0) as REVENUE_TREND, COALESCE(rs.AOV, 0) as AOV,
              COALESCE(rt.AVG_RATING, 0) as RATING, 
              COALESCE(ws.TOTAL_WASTE_LBS, 0) as WASTE_LBS, COALESCE(ws.TOTAL_WASTE_COST, 0) as WASTE_COST, COALESCE(ws.WASTE_TREND, 0) as WASTE_TREND,
              CASE WHEN COALESCE(rt.AVG_RATING, 0) < 4.0 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1500 THEN 'Critical' WHEN COALESCE(rt.AVG_RATING, 0) < 4.3 OR COALESCE(ws.TOTAL_WASTE_LBS, 0) > 1000 THEN 'Attention' ELSE 'Healthy' END as STATUS,
              COALESCE(rr.REVIEWS, ARRAY_CONSTRUCT()) as RECENT_REVIEWS, COALESCE(sh.HISTORY, ARRAY_CONSTRUCT()) as SALES_HISTORY, COALESCE(ot.ORDER_TYPES, ARRAY_CONSTRUCT()) as ORDER_TYPES
            FROM LOCATIONS l
            LEFT JOIN RevenueStats rs ON l.LOCATION_ID = rs.LOCATION_ID LEFT JOIN RatingStats rt ON l.LOCATION_ID = rt.LOCATION_ID LEFT JOIN WasteStats ws ON l.LOCATION_ID = ws.LOCATION_ID LEFT JOIN RecentReviews rr ON l.LOCATION_ID = rr.LOCATION_ID LEFT JOIN SalesHistory sh ON l.LOCATION_ID = sh.LOCATION_ID LEFT JOIN OrderTypesStore ot ON l.LOCATION_ID = ot.LOCATION_ID
          ),
          GlobalSalesCTE AS (
            SELECT ARRAY_AGG(OBJECT_CONSTRUCT('day', DATE_STR, 'sales', TOTAL_REVENUE)) WITHIN GROUP (ORDER BY SORT_DATE ASC) as global_sales
            FROM (SELECT ${dateSelect} as DATE_STR, MIN(SALE_DATE) as SORT_DATE, SUM(REVENUE) as TOTAL_REVENUE FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY ${dateGrouping})
          ),
          GlobalWasteCTE AS (
            SELECT ARRAY_AGG(OBJECT_CONSTRUCT('category', INITCAP(REPLACE(CATEGORY, '_', ' ')), 'amount', TOTAL_WASTED)) as global_waste
            FROM (SELECT CATEGORY, SUM(UNITS_WASTED) as TOTAL_WASTED FROM INVENTORY WHERE ${currentInvFilter} GROUP BY CATEGORY)
          ),
          DayOfWeekCTE AS (
            SELECT ARRAY_AGG(OBJECT_CONSTRUCT('dayName', DOW, 'avgRev', AVG_REV)) WITHIN GROUP (ORDER BY DOW_NUM) as dow_data
            FROM (
              SELECT DAYNAME(SALE_DATE) as DOW, DAYOFWEEK(SALE_DATE) as DOW_NUM, AVG(REVENUE) as AVG_REV
              FROM DAILY_SALES WHERE ${currentSaleFilter} GROUP BY DAYNAME(SALE_DATE), DAYOFWEEK(SALE_DATE)
            )
          )
          
          SELECT TO_JSON(OBJECT_CONSTRUCT(
            'stores', (SELECT ARRAY_AGG(OBJECT_CONSTRUCT('LOCATION_ID', LOCATION_ID, 'NAME', NAME, 'CITY', CITY, 'MANAGER_NAME', MANAGER_NAME, 'REVENUE', REVENUE, 'REVENUE_TREND', REVENUE_TREND, 'AOV', AOV, 'RATING', RATING, 'WASTE_LBS', WASTE_LBS, 'WASTE_COST', WASTE_COST, 'WASTE_TREND', WASTE_TREND, 'STATUS', STATUS, 'RECENT_REVIEWS', RECENT_REVIEWS, 'SALES_HISTORY', SALES_HISTORY, 'ORDER_TYPES', ORDER_TYPES)) FROM CombinedData),
            'globalSalesTrend', (SELECT global_sales FROM GlobalSalesCTE),
            'globalWasteData', (SELECT global_waste FROM GlobalWasteCTE),
            'dayOfWeekData', (SELECT dow_data FROM DayOfWeekCTE)
          )) AS PAYLOAD;
        `);

        if (data && data.length > 0 && data[0].PAYLOAD) {
          const payload = typeof data[0].PAYLOAD === 'string' ? JSON.parse(data[0].PAYLOAD) : data[0].PAYLOAD;
          const colorMap: Record<string, string> = { 'Takeout': '#0ea5e9', 'Dine-In': '#a855f7', 'Delivery': '#f43f5e' };
          
          const formattedStores = (payload.stores || []).map((store: any) => ({
            ...store,
            RATING: Number(store.RATING) || 0,
            REVENUE: Number(store.REVENUE) || 0,
            AOV: Number(store.AOV) || 0,
            WASTE_LBS: Number(store.WASTE_LBS) || 0,
            WASTE_COST: Number(store.WASTE_COST) || 0,
            RECENT_REVIEWS: (store.RECENT_REVIEWS || []).slice(0, 3), 
            SALES_HISTORY: store.SALES_HISTORY || [],
            ORDER_TYPES: (store.ORDER_TYPES || []).map((ot: any) => ({ ...ot, color: colorMap[ot.name] || '#cbd5e1' }))
          }));

          setStores(formattedStores as StoreMetrics[]);
          setGlobalTrend(payload.globalSalesTrend || []);
          setGlobalWaste(payload.globalWasteData || []);
          setDayOfWeekData(payload.dayOfWeekData || []);
          if (formattedStores.length === 0) setErrorState(true);
        }
      } catch (e) {
        console.error("Snowflake query failed:", e);
        setErrorState(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeframe, dateMode, customDate]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const uniqueCities = useMemo(() => Array.from(new Set(stores.map(s => s.CITY))).sort(), [stores]);

  const sortedAndFilteredStores = useMemo(() => {
    let result = stores.filter(s => {
      const matchesSearch = s.NAME.toLowerCase().includes(searchQuery.toLowerCase()) || s.MANAGER_NAME.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || s.STATUS === statusFilter;
      const matchesCity = cityFilter === "All" || s.CITY === cityFilter;
      return matchesSearch && matchesStatus && matchesCity;
    });
    return result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [stores, searchQuery, statusFilter, cityFilter, sortField, sortDirection]);

  const comparisonData = useMemo(() => {
    if (compareMode === "location") {
      return sortedAndFilteredStores.slice(0, 8); 
    } else if (compareMode === "city") {
      const cityMap = new Map();
      sortedAndFilteredStores.forEach(s => {
        if (!cityMap.has(s.CITY)) cityMap.set(s.CITY, { NAME: s.CITY, REVENUE: 0 });
        cityMap.get(s.CITY).REVENUE += s.REVENUE;
      });
      return Array.from(cityMap.values()).sort((a, b) => b.REVENUE - a.REVENUE);
    }
    return [];
  }, [sortedAndFilteredStores, compareMode]);

  const globalMetrics = useMemo(() => sortedAndFilteredStores.reduce((acc, store) => {
    acc.revenue += store.REVENUE; 
    acc.wasteLbs += store.WASTE_LBS; 
    acc.wasteCost += store.WASTE_COST;
    acc.ratingSum += store.RATING;
    acc.aovSum += store.AOV;
    if (store.STATUS !== "Healthy") acc.alerts++;
    return acc;
  }, { revenue: 0, wasteLbs: 0, wasteCost: 0, ratingSum: 0, aovSum: 0, alerts: 0 }), [sortedAndFilteredStores]);

  const regionalAverages = useMemo(() => ({
    revenue: sortedAndFilteredStores.length ? globalMetrics.revenue / sortedAndFilteredStores.length : 0,
    rating: sortedAndFilteredStores.length ? globalMetrics.ratingSum / sortedAndFilteredStores.length : 0,
    wasteCost: sortedAndFilteredStores.length ? globalMetrics.wasteCost / sortedAndFilteredStores.length : 0,
    aov: sortedAndFilteredStores.length ? globalMetrics.aovSum / sortedAndFilteredStores.length : 0
  }), [globalMetrics, sortedAndFilteredStores.length]);

  const avgRating = sortedAndFilteredStores.length ? (globalMetrics.ratingSum / sortedAndFilteredStores.length).toFixed(1) : "0.0";

  const bestDay = useMemo(() => {
    if (!dayOfWeekData.length) return null;
    return dayOfWeekData.reduce((prev, current) => (prev.avgRev > current.avgRev) ? prev : current);
  }, [dayOfWeekData]);

  const dynamicMoneyFormat = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return `$${Math.round(v)}`;
  };

  const exportCSV = () => {
    const headers = ["Location ID,Name,City,Manager,Revenue,AOV,Rating,Waste (lbs),Waste Cost,Status\n"];
    const rows = sortedAndFilteredStores.map(s => 
      `${s.LOCATION_ID},"${s.NAME}","${s.CITY}","${s.MANAGER_NAME}",${s.REVENUE},${s.AOV.toFixed(2)},${s.RATING.toFixed(1)},${s.WASTE_LBS},${s.WASTE_COST},${s.STATUS}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snowcone-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-slate-900 dark:text-slate-50 font-sans transition-colors duration-500 pb-10">
      
      {/* ── Apple Glassy Header ── */}
      <header className="bg-white/60 dark:bg-[#09090b]/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 text-primary">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-[14px] shadow-lg shadow-blue-500/30">
            <IceCream2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Snowcone HQ
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input placeholder="Search locations..." className="pl-9 bg-black/5 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-[#1f1f22] focus:ring-2 focus:ring-blue-500/50 transition-all w-full rounded-full border-none shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[110px] bg-black/5 dark:bg-white/5 border-transparent rounded-full shadow-inner text-xs">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#1f1f22]/95 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-2xl">
              <SelectItem value="All">All Cities</SelectItem>
              {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] bg-black/5 dark:bg-white/5 border-transparent rounded-full shadow-inner text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#1f1f22]/95 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-2xl">
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Attention">Attention</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={(val) => {
            setTimeframe(val);
            setDateMode(val === 'custom' ? 'custom' : 'preset');
          }}>
            <SelectTrigger className="w-[130px] bg-black/5 dark:bg-white/5 border-transparent rounded-full font-medium text-blue-600 dark:text-blue-400 shadow-inner text-xs">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-[#1f1f22]/95 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-2xl">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Quarterly</SelectItem>
              <SelectItem value="180d">6 Months</SelectItem>
              <SelectItem value="365d">Yearly</SelectItem>
              <SelectItem value="custom">Custom...</SelectItem>
            </SelectContent>
          </Select>

          {dateMode === 'custom' && (
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1.5 shadow-inner">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <input type="date" value={customDate.start} onChange={(e) => setCustomDate(prev => ({...prev, start: e.target.value}))} className="bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 cursor-pointer dark:[color-scheme:dark]" />
              <span className="text-slate-400 text-xs font-medium">to</span>
              <input type="date" value={customDate.end} onChange={(e) => setCustomDate(prev => ({...prev, end: e.target.value}))} className="bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 cursor-pointer dark:[color-scheme:dark]" />
            </div>
          )}

          <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV" className="rounded-full border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-inner">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="rounded-full border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors shadow-inner">
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
        
        {/* ── Sleek Dark/Neon AI Insight Banner ── */}
        {!loading && stores.length > 0 && (
          <div className="bg-[#0f1115] border border-indigo-500/30 rounded-2xl p-4 md:p-4 flex items-center gap-4 shadow-lg shadow-indigo-500/10">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl flex-shrink-0 border border-indigo-500/20">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-sm md:text-base text-slate-300 font-medium tracking-wide">
              <span className="font-bold tracking-wider uppercase text-indigo-300 text-[10px] mr-3 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">AI Insight</span>
              You have <span className="underline decoration-rose-500 decoration-2 font-bold text-rose-400">{globalMetrics.alerts} stores</span> requiring attention today based on recent ratings and inventory logs.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Activity className="h-10 w-10 text-blue-500 animate-pulse mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase text-sm">Processing Data...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && (stores.length === 0 || errorState) && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
            <div className="bg-rose-500/10 p-4 rounded-full mb-4">
              <AlertCircle className="h-12 w-12 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Data Found</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">We couldn't find any records for the selected filters. Try adjusting your date range or removing search queries.</p>
            <Button onClick={() => { setTimeframe("30d"); setDateMode("preset"); setSearchQuery(""); }} className="mt-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              Reset Filters
            </Button>
          </div>
        )}

        {!loading && stores.length > 0 && !errorState && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Deep Glassy Colored KPI Cards */}
            <Card className="relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_0_15px_rgba(59,130,246,0.05)] bg-white dark:bg-[#121214] border border-black/5 dark:border-blue-500/20 rounded-[1rem] group hover:bg-white/80 dark:hover:bg-[#18181b] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none"></div>
              <CardContent className="p-5 relative z-10">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Filtered Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">${(globalMetrics.revenue / 1000).toFixed(1)}k</h3>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_0_15px_rgba(99,102,241,0.05)] bg-white dark:bg-[#121214] border border-black/5 dark:border-indigo-500/20 rounded-[1rem] group hover:bg-white/80 dark:hover:bg-[#18181b] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/10 dark:to-transparent pointer-events-none"></div>
              <CardContent className="p-5 relative z-10">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Avg Customer Rating</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{avgRating} / 5.0</h3>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_0_15px_rgba(249,115,22,0.05)] bg-white dark:bg-[#121214] border border-black/5 dark:border-orange-500/20 rounded-[1rem] group hover:bg-white/80 dark:hover:bg-[#18181b] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent pointer-events-none"></div>
              <CardContent className="p-5 relative z-10">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Waste Impact</p>
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">${globalMetrics.wasteCost.toLocaleString()}</h3>
                <div className="flex items-center text-[10px] font-bold px-2.5 py-1 w-fit rounded-md bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/10">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>{globalMetrics.wasteLbs} lbs discarded</span>
                </div>
              </CardContent>
            </Card>

            <Card className={`relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] rounded-[1rem] group hover:bg-opacity-80 transition-all duration-300 ${globalMetrics.alerts > 0 ? "bg-rose-50 dark:bg-[#151112] border border-rose-200 dark:border-rose-500/30" : "bg-white dark:bg-[#121214] border border-black/5 dark:border-white/5"}`}>
              {globalMetrics.alerts > 0 && <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 to-transparent dark:from-rose-900/20 dark:to-transparent pointer-events-none"></div>}
              <CardContent className="p-5 flex items-center gap-4 relative z-10 h-full">
                <div className={`p-3 rounded-xl shadow-sm ${globalMetrics.alerts > 0 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Required</p>
                  <h3 className={`text-2xl font-bold mt-0.5 ${globalMetrics.alerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{globalMetrics.alerts} Stores</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── PERFECTLY FITTED GRID NO SCROLL ON CHARTS ── */}
        {!loading && stores.length > 0 && !errorState && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 h-[calc(100vh-16rem)] min-h-[600px]">
            
            {/* Left Column: Location Scorecard */}
            <Card className="xl:col-span-2 shadow-2xl shadow-black/5 dark:shadow-black/40 bg-white/80 dark:bg-[#16181d]/80 backdrop-blur-2xl border border-black/5 dark:border-white/5 flex flex-col rounded-[1rem] overflow-hidden h-full">
              <CardHeader className="bg-transparent border-b border-black/5 dark:border-white/5 pb-3 shrink-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold">Location Scorecard</CardTitle>
                  <Badge variant="secondary" className="font-mono bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md px-2 border border-blue-500/20 shadow-none">
                    {dateMode === 'preset' ? timeframe.toUpperCase() : 'CUSTOM RANGE'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-sm text-left min-w-[600px] border-collapse relative">
                  <thead className="bg-slate-50/90 dark:bg-[#1c1e24]/90 backdrop-blur-xl text-slate-500 dark:text-slate-400 sticky top-0 z-20 shadow-sm border-b border-black/5 dark:border-white/5">
                    <tr>
                      <SortableHeader label="Location & Manager" field="NAME" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
                      <SortableHeader label="Revenue" field="REVENUE" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
                      <SortableHeader label="AOV" field="AOV" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
                      <SortableHeader label="Rating" field="RATING" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
                      <SortableHeader label="Waste (lbs)" field="WASTE_LBS" currentSort={sortField} dir={sortDirection} onSort={handleSort} />
                      <th className="px-5 py-3 font-semibold text-right uppercase text-[10px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {sortedAndFilteredStores.map((store) => (
                      <tr key={store.LOCATION_ID} onClick={() => setSelectedStore(store)} className="group hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all duration-200">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-900 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{store.NAME}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{store.MANAGER_NAME}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="block font-bold text-slate-700 dark:text-slate-200">${store.REVENUE.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${store.REVENUE_TREND > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {store.REVENUE_TREND > 0 ? '▲' : '▼'} {Math.abs(store.REVENUE_TREND || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-blue-600 dark:text-blue-400">
                          ${store.AOV.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                            {store.RATING.toFixed(1)}
                            {store.RATING < 4.0 && <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="block font-bold text-slate-700 dark:text-slate-200">{store.WASTE_LBS}</span>
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${store.WASTE_TREND < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {store.WASTE_TREND < 0 ? '▼' : '▲'} {Math.abs(store.WASTE_TREND || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <StatusBadge status={store.STATUS} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Right Column: 3 Adaptive Charts */}
            <div className="flex flex-col gap-4 h-full min-h-0">
              
              {/* Chart 1: Global Revenue Timeline */}
              <Card className="flex-1 min-h-0 shadow-2xl shadow-black/5 dark:shadow-black/40 bg-white dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-[1rem] flex flex-col group">
                <CardHeader className="pb-0 shrink-0 pt-4">
                  <div className="flex justify-between items-center pr-2">
                    <CardTitle className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue Timeline</CardTitle>
                    <button onClick={() => setExpandedChart('trend')} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 p-1">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2 pl-0 pb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={globalTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8c8c8c" opacity={0.1} />
                      <XAxis dataKey="day" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{fill: '#8c8c8c'}} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}/>
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2: MULTI-VIEW COMPARISON */}
              <Card className="flex-1 min-h-0 shadow-2xl shadow-black/5 dark:shadow-black/40 bg-white dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-[1rem] flex flex-col group">
                <CardHeader className="pb-0 shrink-0 pt-4">
                  <div className="flex justify-between items-center pr-2">
                    <CardTitle className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Analytics View</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full shadow-inner">
                        <span className={`text-[9px] uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'location' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('location')}>Loc</span>
                        <span className="text-slate-400/50 text-[9px]">|</span>
                        <span className={`text-[9px] uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'city' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('city')}>City</span>
                        <span className="text-slate-400/50 text-[9px]">|</span>
                        <span className={`text-[9px] uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'day' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('day')}>Day</span>
                      </div>
                      <button onClick={() => setExpandedChart('compare')} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 p-1">
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2 pl-0 pb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareMode === 'day' ? dayOfWeekData : comparisonData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={compareMode==='day' ? "#0ea5e9" : "#8b5cf6"} stopOpacity={0.9}/>
                          <stop offset="100%" stopColor={compareMode==='day' ? "#3b82f6" : "#d946ef"} stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8c8c8c" opacity={0.1} />
                      <XAxis dataKey={compareMode === 'day' ? "dayName" : "NAME"} fontSize={8} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} angle={compareMode === 'day' ? 0 : -25} textAnchor={compareMode === 'day' ? "middle" : "end"} height={compareMode === 'day' ? 20 : 35} interval={0} />
                      <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={dynamicMoneyFormat} tick={{fill: '#8c8c8c'}} />
                      <Tooltip cursor={{fill: 'rgba(150,150,150,0.1)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, compareMode === 'day' ? 'Avg Rev' : 'Revenue']}/>
                      <Bar dataKey={compareMode === 'day' ? "avgRev" : "REVENUE"} radius={[4, 4, 0, 0]} barSize={compareMode === 'day' ? 24 : 12} fill="url(#colorComp)">
                         {compareMode === 'day' && <LabelList dataKey="avgRev" position="top" fill="#8c8c8c" fontSize={9} formatter={dynamicMoneyFormat} />}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 3: Waste By Category */}
              <Card className="flex-1 min-h-0 shadow-2xl shadow-black/5 dark:shadow-black/40 bg-white dark:bg-[#121214] border border-black/5 dark:border-white/5 rounded-[1rem] flex flex-col group">
                <CardHeader className="pb-0 shrink-0 pt-4">
                  <div className="flex justify-between items-center pr-2">
                    <CardTitle className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waste by Category</CardTitle>
                    <button onClick={() => setExpandedChart('waste')} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 p-1">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2 pl-0 pb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* FIXED WIDTH TO 120 SO CONES CUPS DOES NOT CUT OFF */}
                    <BarChart data={globalWaste} layout="vertical" margin={{ top: 0, right: 35, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWaste" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8c8c8c" opacity={0.1} />
                      <XAxis type="number" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} />
                      <YAxis dataKey="category" type="category" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#8c8c8c', fontWeight: 600}} width={120} />
                      <Tooltip cursor={{fill: 'rgba(150,150,150,0.1)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`${value} lbs`, 'Waste']}/>
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={10}>
                        {globalWaste.map((entry, index) => <Cell key={`cell-${index}`} fill="url(#colorWaste)" />)}
                        <LabelList dataKey="amount" position="right" fill="#8c8c8c" fontSize={9} fontWeight={600} formatter={(v: number) => `${v} lbs`} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </main>

      {/* ── EXPANDED CHART MODAL (NEW) ── */}
      <Dialog open={!!expandedChart} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent 
          className="bg-white/95 dark:bg-[#1c1e24]/95 backdrop-blur-3xl text-slate-900 dark:text-slate-50 border-black/10 dark:border-white/10 shadow-2xl rounded-[2rem]"
          style={{ maxWidth: '1200px', width: '90vw' }}
        >
          <DialogHeader className="pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {expandedChart === 'trend' && 'Revenue Timeline Detail'}
                {expandedChart === 'compare' && 'Advanced Analytics View'}
                {expandedChart === 'waste' && 'Detailed Waste Analysis'}
              </DialogTitle>
              {/* If comparison chart is expanded, allow them to toggle modes while enlarged! */}
              {expandedChart === 'compare' && (
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full shadow-inner mr-6">
                  <span className={`text-xs uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'location' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('location')}>Location</span>
                  <span className="text-slate-400/50 text-xs">|</span>
                  <span className={`text-xs uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'city' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('city')}>City</span>
                  <span className="text-slate-400/50 text-xs">|</span>
                  <span className={`text-xs uppercase tracking-wider cursor-pointer transition-colors ${compareMode === 'day' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => setCompareMode('day')}>Day</span>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="h-[65vh] w-full mt-4 pb-6">
            <ResponsiveContainer width="100%" height="100%">
              {expandedChart === 'trend' ? (
                <AreaChart data={globalTrend} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorSalesExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8c8c8c" opacity={0.15} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} dy={10} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{fill: '#8c8c8c'}} dx={-10}/>
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}/>
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fill="url(#colorSalesExp)" activeDot={{ r: 8, strokeWidth: 2 }} />
                </AreaChart>
              ) : expandedChart === 'compare' ? (
                <BarChart data={compareMode === 'day' ? dayOfWeekData : comparisonData} margin={{ top: 20, right: 20, left: 10, bottom: compareMode === 'day' ? 20 : 60 }}>
                  <defs>
                    <linearGradient id="colorCompExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={compareMode==='day' ? "#0ea5e9" : "#8b5cf6"} stopOpacity={0.9}/>
                      <stop offset="100%" stopColor={compareMode==='day' ? "#3b82f6" : "#d946ef"} stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8c8c8c" opacity={0.15} />
                  <XAxis dataKey={compareMode === 'day' ? "dayName" : "NAME"} fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} angle={compareMode === 'day' ? 0 : -35} textAnchor={compareMode === 'day' ? "middle" : "end"} height={compareMode === 'day' ? 30 : 70} interval={0} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={dynamicMoneyFormat} tick={{fill: '#8c8c8c'}} dx={-10} />
                  <Tooltip cursor={{fill: 'rgba(150,150,150,0.1)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, compareMode === 'day' ? 'Avg Rev' : 'Revenue']}/>
                  <Bar dataKey={compareMode === 'day' ? "avgRev" : "REVENUE"} radius={[6, 6, 0, 0]} barSize={compareMode === 'day' ? 60 : 30} fill="url(#colorCompExp)">
                     <LabelList dataKey={compareMode === 'day' ? "avgRev" : "REVENUE"} position="top" fill="#8c8c8c" fontSize={12} formatter={dynamicMoneyFormat} />
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={globalWaste} layout="vertical" margin={{ top: 20, right: 50, left: 30, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorWasteExp" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8c8c8c" opacity={0.15} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} />
                  <YAxis dataKey="category" type="category" fontSize={14} axisLine={false} tickLine={false} tick={{fill: '#8c8c8c', fontWeight: 600}} width={150} />
                  <Tooltip cursor={{fill: 'rgba(150,150,150,0.1)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`${value} lbs`, 'Waste']}/>
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={25}>
                    {globalWaste.map((entry, index) => <Cell key={`cell-${index}`} fill="url(#colorWasteExp)" />)}
                    <LabelList dataKey="amount" position="right" fill="#8c8c8c" fontSize={12} fontWeight={600} formatter={(v: number) => `${v} lbs`} />
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Store Drill-down Modal (Original) ── */}
      <Dialog open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
        <DialogContent 
          className="bg-white/95 dark:bg-[#1c1e24]/95 backdrop-blur-3xl text-slate-900 dark:text-slate-50 border-black/10 dark:border-white/10 max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ maxWidth: '1100px', width: '95vw' }}
        >
          <DialogHeader className="pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                  <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{selectedStore?.NAME}</DialogTitle>
                  <DialogDescription className="text-sm mt-1 text-slate-500 font-medium">
                    {selectedStore?.CITY} • Store ID: {selectedStore?.LOCATION_ID} • Manager: {selectedStore?.MANAGER_NAME}
                  </DialogDescription>
                </div>
              </div>
              <StatusBadge status={selectedStore?.STATUS || "Healthy"} />
            </div>
          </DialogHeader>
          
          {selectedStore && (
            <div className="flex flex-col gap-6 mt-4">
              
              <div className="bg-black/5 dark:bg-black/20 rounded-[1.5rem] p-6 border border-black/5 dark:border-white/5 shadow-inner">
                <div className="flex items-start gap-3 mb-6">
                  <Target className="h-5 w-5 text-indigo-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Store Diagnosis vs Region</h4>
                    <div className="flex gap-2 flex-wrap items-center mt-1.5 text-sm">
                      {selectedStore.REVENUE > regionalAverages.revenue * 1.2 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">• Top tier revenue producer</span> : selectedStore.REVENUE < regionalAverages.revenue * 0.8 ? <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">• Underperforming in overall sales</span> : <span className="text-slate-600 dark:text-slate-400 font-medium">• Revenue is aligned with the regional average</span>}
                      {selectedStore.WASTE_COST > regionalAverages.wasteCost * 1.3 ? <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">• Severe inventory leakage detected</span> : selectedStore.WASTE_COST < regionalAverages.wasteCost * 0.7 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">• Excellent waste control</span> : null}
                      {selectedStore.AOV > regionalAverages.aov * 1.15 ? <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">• High AOV (Successful Upselling)</span> : null}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <BenchmarkBar label="Revenue vs Region" storeValue={selectedStore.REVENUE} regionAvg={regionalAverages.revenue} format="$" />
                  <BenchmarkBar label="Avg Order (AOV) vs Region" storeValue={selectedStore.AOV} regionAvg={regionalAverages.aov} format="$" />
                  <BenchmarkBar label="Waste Impact vs Region" storeValue={selectedStore.WASTE_COST} regionAvg={regionalAverages.wasteCost} format="$" reverseColors />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="space-y-6 col-span-1 min-w-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 dark:bg-[#2c2c2e]/50 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Selected Rev</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">${selectedStore.REVENUE.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-[#2c2c2e]/50 backdrop-blur-md p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 font-bold">AOV</p>
                      <p className="text-xl font-bold text-blue-700 dark:text-blue-300">${selectedStore.AOV.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-sm ${selectedStore.RATING < 4.0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/50 dark:bg-[#2c2c2e]/50 border-black/5 dark:border-white/10'}`}>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Avg Rating</p>
                      <p className={`text-xl font-bold ${selectedStore.RATING < 4.0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{selectedStore.RATING.toFixed(1)} <span className="text-xs font-medium text-slate-400">/ 5</span></p>
                    </div>
                    <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-sm ${selectedStore.WASTE_LBS > 1000 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/50 dark:bg-[#2c2c2e]/50 border-black/5 dark:border-white/10'}`}>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Waste Impact</p>
                      <p className={`text-xl font-bold ${selectedStore.WASTE_LBS > 1000 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>${selectedStore.WASTE_COST.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-[#2c2c2e]/50 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm rounded-2xl p-5">
                    <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Distribution</h4>
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={selectedStore.ORDER_TYPES} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="rgba(255,255,255,0.05)" strokeWidth={2} cornerRadius={6}>
                            {selectedStore.ORDER_TYPES.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 text-xs mt-4 font-bold">
                      {selectedStore.ORDER_TYPES.map(type => (
                        <div key={type.name} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                          <span className="text-slate-700 dark:text-slate-200">{type.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 bg-white/50 dark:bg-[#2c2c2e]/50 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm rounded-2xl p-5 min-w-0 flex flex-col">
                  <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local Trend</h4>
                  <div className="flex-1 min-h-[200px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedStore.SALES_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLocalSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#8c8c8c" opacity={0.2} />
                        <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#8c8c8c'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{fill: '#8c8c8c'}} />
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', borderRadius: '12px', color: '#ffffff' }} itemStyle={{ color: '#10b981', fontWeight: 'bold' }} labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fill="url(#colorLocalSales)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-white/50 dark:bg-[#2c2c2e]/50 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm rounded-2xl p-5 flex flex-col min-w-0">
                  <h4 className="font-bold mb-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between items-center">
                    Recent Feedback 
                    {selectedStore.RATING < 4.0 && <span className="text-rose-600 dark:text-rose-400 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle className="h-3 w-3"/> ACTION NEEDED</span>}
                  </h4>
                  <div className="space-y-3 overflow-y-auto flex-1 max-h-[350px] pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {selectedStore.RECENT_REVIEWS.length > 0 ? selectedStore.RECENT_REVIEWS.map(review => (
                      <div key={review.id} className="bg-white/80 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5 text-sm shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-amber-400 text-sm tracking-widest drop-shadow-sm">{"★".repeat(Math.round(review.rating))}<span className="text-slate-300 dark:text-slate-700">{"★".repeat(5-Math.round(review.rating))}</span></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{review.date}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-300 italic leading-relaxed font-medium">"{review.text}"</p>
                      </div>
                    )) : (
                       <p className="text-sm text-slate-500 italic mt-4 text-center">No recent reviews found.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Enhanced Sub-Components ────────────────────────────────────────

function BenchmarkBar({ label, storeValue, regionAvg, format = "", reverseColors = false }: { label: string, storeValue: number, regionAvg: number, format?: string, reverseColors?: boolean }) {
  const max = Math.max(storeValue, regionAvg) * 1.1 || 1;
  const storePct = (storeValue / max) * 100;
  const avgPct = (regionAvg / max) * 100;
  const isBetter = reverseColors ? storeValue <= regionAvg : storeValue >= regionAvg;
  const barColor = isBetter ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{format === "$" ? `$${storeValue.toLocaleString(undefined, {minimumFractionDigits: format==='$'&&storeValue<100?2:0, maximumFractionDigits:2})}` : storeValue}</span>
      </div>
      <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full relative overflow-hidden shadow-inner">
        <div className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${storePct}%` }}></div>
      </div>
      <div className="absolute top-6 bottom-0 w-[3px] bg-slate-400 dark:bg-slate-300 z-10 rounded-full shadow-sm" style={{ left: `${avgPct}%`, height: '14px' }}></div>
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 absolute -bottom-4" style={{ left: `max(0%, calc(${avgPct}% - 12px))` }}>Avg: {format === "$" ? `$${regionAvg.toLocaleString(undefined, {maximumFractionDigits: 0})}` : regionAvg.toFixed(1)}</span>
    </div>
  );
}

function SortableHeader({ label, field, currentSort, dir, onSort }: { label: string, field: SortField, currentSort: SortField, dir: 'asc'|'desc', onSort: (f: SortField)=>void }) {
  return (
    <th className="px-5 py-3 font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1.5 uppercase text-[10px] tracking-widest text-slate-500 dark:text-slate-400">
        {label}
        <ArrowUpDown className={`h-3 w-3 transition-colors ${currentSort === field ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
      </div>
    </th>
  );
}

function KpiCard({ title, value }: { title: string, value: string }) {
  return (
    <Card className="shadow-xl shadow-black/5 dark:shadow-none bg-white/60 dark:bg-[#1c1c1e]/60 backdrop-blur-3xl border-white/40 dark:border-white/10 rounded-[1.5rem] overflow-hidden border">
      <CardContent className="p-5">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: StoreMetrics["STATUS"] }) {
  switch (status) {
    case "Healthy": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-md">Healthy</Badge>;
    case "Attention": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-md">Attention</Badge>;
    case "Critical": return (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit ml-auto">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
        </span>
        Critical
      </Badge>
    );
  }
}