import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { querySnowflake } from "@/lib/snowflake";
import { 
  ArrowLeft, Search, TrendingUp, TrendingDown, AlertTriangle, 
  Download, MapPin, Star, DollarSign, Package, Snowflake
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────
interface Location {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  MANAGER_NAME: string;
}

interface DailySale {
  LOCATION_ID: number;
  SALE_DATE: string;
  ORDER_TYPE: string;
  REVENUE: number;
}

interface Inventory {
  LOCATION_ID: number;
  RECORD_DATE: string;
  CATEGORY: string;
  UNITS_WASTED: number;
  WASTE_COST: number;
}

interface Review {
  LOCATION_ID: number;
  REVIEW_DATE: string;
  RATING: number;
  REVIEW_TEXT: string;
  CUSTOMER_NAME: string;
}

// ── Main App ────────────────────────────────────────────────────
export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive State
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "30">("all");

  // Fetch Data
  useEffect(() => {
    async function fetchAllData() {
      try {
        const [locs, salesData, invData, revData] = await Promise.all([
          querySnowflake<Location>("SELECT LOCATION_ID, NAME, CITY, STATE, MANAGER_NAME FROM LOCATIONS"),
          querySnowflake<DailySale>("SELECT LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE FROM DAILY_SALES"),
          querySnowflake<Inventory>("SELECT LOCATION_ID, RECORD_DATE, CATEGORY, UNITS_WASTED, WASTE_COST FROM INVENTORY"),
          querySnowflake<Review>("SELECT LOCATION_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME FROM CUSTOMER_REVIEWS ORDER BY REVIEW_DATE DESC")
        ]);
        setLocations(locs || []);
        setSales(salesData || []);
        setInventory(invData || []);
        setReviews(revData || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect to Snowflake");
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  // ── HOOKS (Memoized Data Processing) ──────────────────────────
  const filteredSales = useMemo(() => {
    if (dateFilter === "all") return sales;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return sales.filter(s => new Date(s.SALE_DATE) >= thirtyDaysAgo);
  }, [sales, dateFilter]);

  const locationStats = useMemo(() => {
    return locations.map(loc => {
      const locSales = filteredSales.filter(s => s.LOCATION_ID === loc.LOCATION_ID);
      const locInv = inventory.filter(i => i.LOCATION_ID === loc.LOCATION_ID);
      const locRev = reviews.filter(r => r.LOCATION_ID === loc.LOCATION_ID);

      const totalRevenue = locSales.reduce((sum, s) => sum + Number(s.REVENUE), 0);
      const totalWaste = locInv.reduce((sum, i) => sum + Number(i.WASTE_COST), 0);
      const avgRating = locRev.length ? locRev.reduce((sum, r) => sum + Number(r.RATING), 0) / locRev.length : 0;
      
      const sortedSales = [...locSales].sort((a, b) => new Date(a.SALE_DATE).getTime() - new Date(b.SALE_DATE).getTime());
      const midPoint = Math.floor(sortedSales.length / 2);
      const firstHalfRev = sortedSales.slice(0, midPoint).reduce((sum, s) => sum + Number(s.REVENUE), 0);
      const secondHalfRev = sortedSales.slice(midPoint).reduce((sum, s) => sum + Number(s.REVENUE), 0);
      const trend = firstHalfRev === 0 ? 0 : ((secondHalfRev - firstHalfRev) / firstHalfRev) * 100;

      // New Status Logic
      let status = "Normal";
      if (trend > 0) {
        status = "Healthy";
      } else if (trend <= -15) {
        status = "Critical";
      }

      return {
        ...loc,
        totalRevenue,
        totalWaste,
        avgRating,
        trend,
        status
      };
    }).filter(loc => (loc.NAME || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [locations, filteredSales, inventory, reviews, searchTerm]);

  const revenueTrendsData = useMemo(() => {
    const dateMap: Record<string, any> = {};
    filteredSales.forEach(s => {
      if (!dateMap[s.SALE_DATE]) dateMap[s.SALE_DATE] = { date: s.SALE_DATE, 'dine-in': 0, takeout: 0, delivery: 0 };
      if(dateMap[s.SALE_DATE][s.ORDER_TYPE] !== undefined) {
        dateMap[s.SALE_DATE][s.ORDER_TYPE] += Number(s.REVENUE);
      }
    });
    return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales]);


  // ── RENDER HELPERS ──────────────────────────────────────────────
  const selectedLocation = locations.find(l => l.LOCATION_ID === selectedLocationId);

  const exportCSV = () => {
    const headers = ["Location", "Manager", "Revenue", "Waste Cost", "Avg Rating", "Trend %", "Status"];
    const csvData = locationStats.map(loc => 
      `${loc.NAME},${loc.MANAGER_NAME},${loc.totalRevenue.toFixed(2)},${loc.totalWaste.toFixed(2)},${loc.avgRating.toFixed(1)},${loc.trend.toFixed(1)},${loc.status}`
    );
    const blob = new Blob([[headers.join(","), ...csvData].join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snowcone_nexus_export.csv";
    a.click();
  };

  // ── SKELETON LOADER ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] p-6 sm:p-10 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Snowflake className="text-cyan-400 h-12 w-12 animate-spin-slow" />
          <p className="text-cyan-400/70 font-medium tracking-widest uppercase text-sm">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="p-10 bg-[#0B0F19] text-rose-400 text-center flex flex-col items-center justify-center min-h-screen">
      <AlertTriangle className="h-12 w-12 mb-4" />
      <h2 className="text-2xl font-bold">Connection Interrupted</h2>
      <p className="mt-2 text-slate-400">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 transition-colors duration-300 font-sans selection:bg-cyan-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
      
      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <nav className="border-b border-white/5 sticky top-0 z-20 bg-[#0B0F19]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setSelectedLocationId(null)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-all">
            <Snowflake size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-2xl hidden sm:block text-slate-100 leading-none">
              Snowcone <span className="text-cyan-400">NEXUS</span>
            </span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase mt-1 hidden sm:block">
              Data Apps Specialization
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-5">
          <select 
            className="bg-[#131B2C] text-sm font-medium rounded-lg px-4 py-2 border border-[#2A3441] text-slate-300 outline-none focus:ring-2 ring-cyan-500/50 transition-shadow cursor-pointer hover:bg-[#1A2438]"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as "all" | "30")}
          >
            <option value="all">Last 90 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-[#131B2C] hover:bg-[#1A2438] border border-[#2A3441] text-slate-200 rounded-lg font-medium transition-colors text-sm shadow-sm">
            <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {!selectedLocationId ? (
          // ── DASHBOARD OVERVIEW ───────────────────────────────────
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md overflow-hidden relative group hover:border-blue-500/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="p-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl shadow-inner group-hover:scale-105 transition-transform"><DollarSign size={28} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Network Rev (YTD)</p>
                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-100">${(locationStats.reduce((sum, l) => sum + l.totalRevenue, 0) / 1000).toFixed(1)}k</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md overflow-hidden relative group hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl shadow-inner group-hover:scale-105 transition-transform"><Star size={28} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Avg Network CSAT</p>
                    <h3 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                      {(locationStats.reduce((sum, l) => sum + l.avgRating, 0) / (locationStats.length || 1)).toFixed(1)} 
                      <Star size={20} className="text-amber-400 fill-amber-400" />
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md overflow-hidden relative group hover:border-rose-500/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl shadow-inner group-hover:scale-105 transition-transform"><AlertTriangle size={28} /></div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-1">Critical Nodes</p>
                    <h3 className="text-3xl font-extrabold tracking-tight text-rose-500">
                      {locationStats.filter(l => l.status === "Critical").length} <span className="text-xl font-bold">Action Required</span>
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Scorecard */}
            <Card className="border border-white/5 shadow-xl bg-[#131B2C]/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="text-cyan-400" size={20} />
                  <CardTitle className="text-lg font-bold text-slate-100">Location Scorecard</CardTitle>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Filter nodes..." 
                    className="w-full pl-10 pr-4 py-2 text-sm bg-[#0B0F19] border border-white/5 text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-500 uppercase bg-[#0B0F19]/50 tracking-widest border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Node ↑↓</th>
                      <th className="px-6 py-4 font-semibold">Revenue ↑↓</th>
                      <th className="px-6 py-4 font-semibold">Waste Cost</th>
                      <th className="px-6 py-4 font-semibold">CSAT ↑↓</th>
                      <th className="px-6 py-4 font-semibold">System Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {locationStats.map((loc) => (
                      <tr 
                        key={loc.LOCATION_ID} 
                        onClick={() => setSelectedLocationId(loc.LOCATION_ID)}
                        className="group hover:bg-indigo-500/10 hover:border-l-2 hover:border-cyan-400 border-l-2 border-transparent cursor-pointer transition-all duration-150"
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">{loc.NAME}</div>
                          <div className="text-xs text-slate-500 mt-1">{loc.CITY}, {loc.STATE}</div>
                        </td>
                        <td className="px-6 py-5 font-medium text-slate-300">${loc.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                        <td className="px-6 py-5 font-medium text-slate-400">${loc.totalWaste.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-200">
                            {loc.avgRating.toFixed(1)} <Star size={14} className="text-amber-400 fill-amber-400" />
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {loc.status === "Critical" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2 animate-pulse"></span> Critical
                            </span>
                          )}
                          {loc.status === "Healthy" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span> Healthy
                            </span>
                          )}
                          {loc.status === "Normal" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-200">Revenue Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDineIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorTakeout" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: "#64748b"}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: "#64748b"}} tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc' }}
                          formatter={(val: number) => `$${val.toFixed(0)}`} 
                          labelFormatter={(label) => new Date(label).toDateString()} 
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#94a3b8' }} />
                        <Area type="monotone" dataKey="dine-in" stackId="1" stroke="#22d3ee" strokeWidth={2} fill="url(#colorDineIn)" />
                        <Area type="monotone" dataKey="takeout" stackId="1" stroke="#6366f1" strokeWidth={2} fill="url(#colorTakeout)" />
                        <Area type="monotone" dataKey="delivery" stackId="1" stroke="#c084fc" strokeWidth={2} fill="#c084fc" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-200">Waste Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[...locationStats].sort((a,b) => b.totalWaste - a.totalWaste).slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
                        <XAxis type="number" tickFormatter={(val) => `$${val}`} tick={{fontSize: 12, fill: "#64748b"}} axisLine={false} tickLine={false} />
                        <YAxis dataKey="NAME" type="category" width={110} tick={{fontSize: 12, fill: "#cbd5e1", fontWeight: 500}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', color: '#f8fafc' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                        <Bar dataKey="totalWaste" radius={[0, 4, 4, 0]} barSize={20}>
                          {locationStats.sort((a,b) => b.totalWaste - a.totalWaste).slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.status === "Critical" ? "#f43f5e" : entry.status === "Normal" ? "#475569" : "#10b981"} className="transition-all hover:opacity-80" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // ── DRILL-DOWN VIEW ──────────────────────────────────────
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 ease-out">
            <button 
              onClick={() => setSelectedLocationId(null)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 bg-[#131B2C] border border-[#2A3441] rounded-lg hover:bg-[#1A2438] hover:border-cyan-500/30 transition-all shadow-sm"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">{selectedLocation?.NAME}</h1>
                <p className="text-slate-400 mt-2 flex items-center gap-2 font-medium text-sm">
                  <MapPin size={16} className="text-cyan-500" /> {selectedLocation?.CITY}, {selectedLocation?.STATE} <span className="text-slate-700">|</span> Manager: {selectedLocation?.MANAGER_NAME}
                </p>
              </div>
            </div>

            {(() => {
              const locSales = filteredSales.filter(s => s.LOCATION_ID === selectedLocationId);
              const locInv = inventory.filter(i => i.LOCATION_ID === selectedLocationId);
              const locRev = reviews.filter(r => r.LOCATION_ID === selectedLocationId).slice(0, 6); 
              
              const wasteByCategory = locInv.reduce((acc, curr) => {
                acc[curr.CATEGORY] = (acc[curr.CATEGORY] || 0) + Number(curr.WASTE_COST);
                return acc;
              }, {} as Record<string, number>);
              
              const pieData = Object.entries(wasteByCategory).map(([name, value]) => ({ name, value }));
              const COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f43f5e', '#8b5cf6'];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  <Card className="lg:col-span-2 border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-200">Daily Revenue Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locSales.reduce((acc: any[], curr) => {
                            const existing = acc.find(x => x.date === curr.SALE_DATE);
                            if (existing) existing.total += Number(curr.REVENUE);
                            else acc.push({ date: curr.SALE_DATE, total: Number(curr.REVENUE) });
                            return acc;
                          }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: "#64748b"}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize: 12, fill: "#64748b"}} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                            <Bar dataKey="total" fill="#22d3ee" radius={[4, 4, 0, 0]} className="hover:opacity-80 transition-opacity" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-base font-bold text-slate-200">Waste Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 outline-none transition-opacity shadow-[0_0_10px_rgba(255,255,255,0.2)]" />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)' }} formatter={(val: number) => `$${val.toFixed(2)}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-6 text-[11px] uppercase tracking-wider font-semibold">
                        {pieData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_currentColor]" style={{backgroundColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length]}}></div>
                            <span className="text-slate-400">{entry.name.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-3 border border-white/5 shadow-lg bg-[#111827]/60 backdrop-blur-md mt-2">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-200">
                        <Star className="text-cyan-400 fill-cyan-400/20" size={18} /> Customer Telemetry
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {locRev.length > 0 ? locRev.map((r, i) => (
                          <div key={i} className="p-5 rounded-xl bg-[#0B0F19]/50 border border-white/5 flex flex-col justify-between hover:border-cyan-500/20 transition-all shadow-inner">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <span className="font-bold text-slate-200">{r.CUSTOMER_NAME}</span>
                                <div className="flex gap-0.5 bg-[#131B2C] px-2 py-1 rounded border border-white/5">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} size={10} className={idx < Math.floor(r.RATING) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed italic">"{r.REVIEW_TEXT}"</p>
                            </div>
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-5">
                              {new Date(r.REVIEW_DATE).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        )) : (
                          <p className="text-slate-500 text-sm col-span-full text-center py-10 bg-[#0B0F19]/50 rounded-xl border border-white/5">No telemetry data found for this node.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}