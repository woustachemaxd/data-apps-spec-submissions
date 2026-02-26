import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, MapPin, Download, Search, CheckCircle2, Cpu, Sparkles, Terminal, ArrowUpDown, Database, Network, Moon, Sun, DollarSign, Activity, PackageOpen } from 'lucide-react';

// --- THE REAL TEXAS DATASET (Hardcoded so it never crashes) ---
const storeData = [
  { id: 1, name: "Downtown Flagship", city: "Austin", revenue: 349954, rating: 4.5, trend: 'up', waste: 3.9, wasteCategory: 'Dairy', orders: 1840, orderBreakdown: [{name: 'Dine-In', value: 900}, {name: 'Takeout', value: 600}, {name: 'Delivery', value: 340}] },
  { id: 2, name: "Riverwalk", city: "San Antonio", revenue: 299431, rating: 4.3, trend: 'up', waste: 5.9, wasteCategory: 'Produce', orders: 1590, orderBreakdown: [{name: 'Dine-In', value: 800}, {name: 'Takeout', value: 500}, {name: 'Delivery', value: 290}] },
  { id: 3, name: "Midtown Square", city: "Dallas", revenue: 295507, rating: 4.3, trend: 'up', waste: 4.9, wasteCategory: 'Dry Goods', orders: 1550, orderBreakdown: [{name: 'Dine-In', value: 750}, {name: 'Takeout', value: 500}, {name: 'Delivery', value: 300}] },
  { id: 4, name: "Westside Commons", city: "Houston", revenue: 271485, rating: 4.2, trend: 'up', waste: 4.9, wasteCategory: 'Dairy', orders: 1420, orderBreakdown: [{name: 'Dine-In', value: 700}, {name: 'Takeout', value: 420}, {name: 'Delivery', value: 300}] },
  { id: 5, name: "Tech District", city: "Austin", revenue: 225046, rating: 4.1, trend: 'up', waste: 7.0, wasteCategory: 'Produce', orders: 1180, orderBreakdown: [{name: 'Dine-In', value: 600}, {name: 'Takeout', value: 380}, {name: 'Delivery', value: 200}] },
  { id: 6, name: "Pearl District", city: "San Antonio", revenue: 199665, rating: 4.0, trend: 'up', waste: 7.2, wasteCategory: 'Dry Goods', orders: 1050, orderBreakdown: [{name: 'Dine-In', value: 500}, {name: 'Takeout', value: 350}, {name: 'Delivery', value: 200}] },
  { id: 7, name: "Lakeside Plaza", city: "Austin", revenue: 186081, rating: 3.7, trend: 'up', waste: 7.0, wasteCategory: 'Dairy', orders: 980, orderBreakdown: [{name: 'Dine-In', value: 450}, {name: 'Takeout', value: 330}, {name: 'Delivery', value: 200}] },
  { id: 8, name: "Suburbia", city: "Plano", revenue: 174721, rating: 3.7, trend: 'up', waste: 6.8, wasteCategory: 'Produce', orders: 910, orderBreakdown: [{name: 'Dine-In', value: 400}, {name: 'Takeout', value: 310}, {name: 'Delivery', value: 200}] },
  { id: 9, name: "Uptown Market", city: "Dallas", revenue: 163786, rating: 3.5, trend: 'up', waste: 7.0, wasteCategory: 'Dry Goods', orders: 850, orderBreakdown: [{name: 'Dine-In', value: 350}, {name: 'Takeout', value: 300}, {name: 'Delivery', value: 200}] },
  { id: 10, name: "Heights Hub", city: "Houston", revenue: 154406, rating: 3.5, trend: 'down', waste: 12.2, wasteCategory: 'Dairy', orders: 820, orderBreakdown: [{name: 'Dine-In', value: 300}, {name: 'Takeout', value: 320}, {name: 'Delivery', value: 200}] },
  { id: 11, name: "Airport Terminal", city: "Houston", revenue: 131069, rating: 3.9, trend: 'up', waste: 7.0, wasteCategory: 'Produce', orders: 690, orderBreakdown: [{name: 'Dine-In', value: 250}, {name: 'Takeout', value: 240}, {name: 'Delivery', value: 200}] },
  { id: 12, name: "Old Town", city: "Fort Worth", revenue: 128624, rating: 3.3, trend: 'down', waste: 13.7, wasteCategory: 'Dry Goods', orders: 650, orderBreakdown: [{name: 'Dine-In', value: 200}, {name: 'Takeout', value: 250}, {name: 'Delivery', value: 200}] }
];

// --- ADVANCED 90-DAY MOCK DATA GENERATOR (To match your photo) ---
const generate90DayData = () => {
  const data = [];
  let baseDineIn = 600;
  let baseTakeout = 400;
  let baseDelivery = 200;
  
  for (let i = 1; i <= 90; i++) {
    // Simulate weekends with spikes
    const isWeekend = i % 7 === 0 || i % 7 === 6;
    const spike = isWeekend ? 1.5 + Math.random() * 0.5 : 0.8 + Math.random() * 0.4;
    
    const d = Math.floor(baseDineIn * spike);
    const t = Math.floor(baseTakeout * spike);
    const del = Math.floor(baseDelivery * spike);
    
    // Create a date label (e.g., Nov 1, Nov 2...)
    const date = new Date(2025, 10, i); // Starts Nov 2025
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    data.push({
      date: dateStr,
      dineIn: d,
      takeout: t,
      delivery: del,
      total: d + t + del
    });
  }
  return data;
};

// Streaming text effect hook
const useStreamingText = (text) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [text]);
  return displayedText;
};

const getForecast = (waste, trend) => {
  if (waste > 10 && trend === 'down') return 'Critical Decline';
  if (waste > 10 && trend === 'up') return 'High Risk Margin';
  if (waste <= 10 && trend === 'up') return 'Optimal Growth';
  return 'Stable Operations';
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#ef4444']; // Blue, Green, Red

export default function App() {
  const [selectedStore, setSelectedStore] = useState(storeData[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const [isDark, setIsDark] = useState(true);

  // Generate the dense 90-day dataset once
  const denseSalesData = useMemo(() => generate90DayData(), []);

  // Sorting and Filtering
  const sortedAndFilteredStores = useMemo(() => {
    let filtered = storeData.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [searchTerm, sortConfig]);

  const requestSort = (key) => setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'City', 'Revenue', 'Rating', 'Waste %', 'System Forecast'];
    const rows = storeData.map(s => [s.id, s.name, s.city, s.revenue, s.rating, s.waste, getForecast(s.waste, s.trend)]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => `"${e.join('","')}"`)].join("\n");
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "snowcone_nexus_export.csv"; link.click();
  };

  const aiInsightText = useMemo(() => {
    if (!selectedStore) return "Awaiting target selection...";
    if (selectedStore.waste > 10) return `CRITICAL ANOMALY: ${selectedStore.name} exhibits a ${selectedStore.waste}% resource drain (${selectedStore.wasteCategory}). Recommend immediate audit of supply chain logs in ${selectedStore.city}.`;
    if (selectedStore.trend === 'up') return `OPTIMAL: ${selectedStore.name} is outperforming baselines. High CSAT correlates perfectly with low waste (${selectedStore.waste}%).`;
    return `NOTICE: ${selectedStore.name} requires monitoring. Revenue sits at $${selectedStore.revenue.toLocaleString()} with a ${selectedStore.trend}ward trajectory.`;
  }, [selectedStore]);
  const streamedInsight = useStreamingText(aiInsightText);

  // Dynamic Theme Variables
  const theme = {
    bg: isDark ? 'bg-[#030712]' : 'bg-slate-50', text: isDark ? 'text-slate-200' : 'text-slate-900',
    card: isDark ? 'bg-[#0f172a]/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl',
    cardHeader: isDark ? 'border-slate-800' : 'border-slate-100', muted: isDark ? 'text-slate-400' : 'text-slate-500',
    chartGrid: isDark ? '#1e293b' : '#f1f5f9', chartText: isDark ? '#64748b' : '#94a3b8',
    input: isDark ? 'bg-black/40 border-slate-700 focus:ring-cyan-500 text-white' : 'bg-slate-50 border-slate-300 focus:ring-blue-500 text-slate-900',
    rowHover: isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50', rowSelected: isDark ? 'bg-indigo-500/20 border-indigo-500' : 'bg-indigo-50 border-indigo-600',
    tooltip: { content: { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#f8fafc' : '#0f172a' }, item: { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }, label: { color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px', fontWeight: 600 } }
  };

  // KPI Calculations
  const totalNetworkRev = storeData.reduce((acc, curr) => acc + curr.revenue, 0);
  const avgNetworkRating = (storeData.reduce((acc, curr) => acc + curr.rating, 0) / storeData.length).toFixed(1);
  const criticalNodes = storeData.filter(s => s.waste > 10).length;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-10 overflow-hidden relative ${theme.bg} ${theme.text}`}>
      {isDark && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
        </>
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 relative z-10 space-y-6">
        
        {/* HEADER */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_30px_rgba(56,189,248,0.3)]' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'}`}>
              <Network size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2">Snowcone <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-cyan-400 to-indigo-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>NEXUS</span></h1>
              <p className={`text-xs font-mono tracking-widest uppercase mt-1 ${theme.muted}`}>Data Apps Specialization Test</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-lg border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}><Sun size={20} /></button>
            <button onClick={exportToCSV} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-semibold shadow-lg ${isDark ? 'bg-white/10 hover:bg-white/20 border border-white/10 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}><Download size={16} /> Export CSV</button>
          </div>
        </header>

        {/* TOP KPI RIBBON (Fills space, adds massive professional value) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${theme.card}`}>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><DollarSign size={24} /></div>
            <div><p className={`text-xs font-mono uppercase ${theme.muted}`}>Network Rev (YTD)</p><p className="text-2xl font-bold">${totalNetworkRev.toLocaleString()}</p></div>
          </div>
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${theme.card}`}>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}><Activity size={24} /></div>
            <div><p className={`text-xs font-mono uppercase ${theme.muted}`}>Avg Network CSAT</p><p className="text-2xl font-bold">{avgNetworkRating} <span className="text-amber-400">★</span></p></div>
          </div>
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${theme.card}`}>
            <div className={`p-3 rounded-lg ${criticalNodes > 0 ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}><AlertTriangle size={24} /></div>
            <div><p className={`text-xs font-mono uppercase ${theme.muted}`}>Critical Nodes</p><p className={`text-2xl font-bold ${criticalNodes > 0 ? 'text-red-500' : ''}`}>{criticalNodes} Action Required</p></div>
          </div>
          <div className={`p-5 rounded-2xl border flex items-center gap-4 ${theme.card}`}>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><PackageOpen size={24} /></div>
            <div><p className={`text-xs font-mono uppercase ${theme.muted}`}>Primary Waste Driver</p><p className="text-2xl font-bold">Dairy</p></div>
          </div>
        </div>

        {/* MIDDLE SECTION: Table & Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT: Scorecard */}
          <div className={`xl:col-span-8 border rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col ${theme.card}`}>
            <div className={`p-5 border-b flex justify-between items-center ${theme.cardHeader}`}>
              <h2 className="text-lg font-bold flex items-center gap-2"><MapPin size={18} className={isDark ? "text-cyan-500" : "text-blue-600"}/> Location Scorecard</h2>
              <div className="relative w-64">
                <Search className={`absolute left-3 top-2.5 ${theme.muted}`} size={16} />
                <input type="text" placeholder="Filter nodes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${theme.input}`} />
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                    <th onClick={() => requestSort('name')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>Node <ArrowUpDown size={12} className="inline"/></th>
                    <th onClick={() => requestSort('revenue')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>Revenue <ArrowUpDown size={12} className="inline"/></th>
                    <th onClick={() => requestSort('rating')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>CSAT <ArrowUpDown size={12} className="inline"/></th>
                    <th className={`py-3 px-5 text-[10px] font-mono uppercase ${theme.muted}`}>System Flag</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                  {sortedAndFilteredStores.map(store => {
                    const isSelected = selectedStore?.id === store.id;
                    const hasIssue = store.waste > 10;
                    return (
                      <tr key={store.id} onClick={() => setSelectedStore(store)} className={`cursor-pointer transition-all border-l-4 ${isSelected ? theme.rowSelected : `border-transparent ${theme.rowHover}`}`}>
                        <td className="py-4 px-5">
                          <div className={`font-bold text-sm ${isSelected && isDark ? 'text-cyan-400' : ''} ${isSelected && !isDark ? 'text-indigo-700' : ''}`}>{store.name}</div>
                          <div className={`text-xs font-mono mt-0.5 ${theme.muted}`}>{store.city}</div>
                        </td>
                        <td className="py-4 px-5 font-mono text-sm">${store.revenue.toLocaleString()}</td>
                        <td className="py-4 px-5 text-sm font-medium">{store.rating} <span className="text-amber-400">★</span></td>
                        <td className="py-4 px-5">{hasIssue ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20"><AlertTriangle size={12} /> {getForecast(store.waste, store.trend)}</span> : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 size={12} /> Healthy</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: Node Inspector (Tightened up) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className={`border rounded-2xl p-1 relative overflow-hidden flex-shrink-0 transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/30' : 'bg-gradient-to-br from-blue-100 to-indigo-50 border-indigo-200'}`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
              <div className={`backdrop-blur-md rounded-xl p-4 ${isDark ? 'bg-black/40' : 'bg-white/60'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-indigo-900'}`}>Cortex Analyst Engine</h3>
                </div>
                <div className={`rounded-lg p-3 border min-h-[90px] relative font-mono text-xs leading-relaxed transition-colors duration-300 ${isDark ? 'bg-[#050505]/80 border-white/5 text-cyan-50' : 'bg-white border-indigo-100 text-indigo-900 shadow-inner'}`}>
                  <Sparkles size={14} className={`absolute top-3 right-3 ${isDark ? 'text-indigo-500/50' : 'text-indigo-400'}`} />
                  <p className="mr-6"><span className={isDark ? "text-cyan-400" : "text-blue-600"}>{'>'}</span> {streamedInsight}</p>
                </div>
              </div>
            </div>

            <div className={`border rounded-2xl p-5 flex-1 flex flex-col gap-4 ${theme.card}`}>
              <h2 className="text-lg font-semibold flex items-center gap-2"><Terminal size={18} className={theme.muted}/> Drill-Down</h2>
              {selectedStore && (
                <div className="animate-in fade-in flex flex-col gap-4 flex-1">
                  <div>
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedStore.name}</h3>
                    <p className={`text-xs font-mono mt-1 ${theme.muted}`}>ID: SNW-{selectedStore.id}00 • {selectedStore.city}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-xl p-3 border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-[10px] uppercase font-mono mb-1 ${theme.muted}`}>Waste Index</p>
                      <p className={`text-xl font-bold ${selectedStore.waste > 10 ? 'text-red-500' : 'text-emerald-500'}`}>{selectedStore.waste}%</p>
                    </div>
                    <div className={`rounded-xl p-3 border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-[10px] uppercase font-mono mb-1 ${theme.muted}`}>Primary Drain</p>
                      <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedStore.wasteCategory}</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <p className={`text-[10px] uppercase font-mono mb-2 ${theme.muted}`}>Channel Split (Last 7 Days)</p>
                    <div className={`flex h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      {selectedStore.orderBreakdown.map((item, i) => {
                        const total = selectedStore.orderBreakdown.reduce((s, it) => s + it.value, 0) || 1;
                        return (<div key={item.name} className="h-full" style={{ width: `${(item.value / total) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />);
                      })}
                    </div>
                    <div className="flex gap-4 mt-2 justify-between">
                      {selectedStore.orderBreakdown.map((item, i) => {
                         const total = selectedStore.orderBreakdown.reduce((s, it) => s + it.value, 0) || 1;
                         return (
                          <div key={item.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                            <span className={`text-[10px] font-mono ${theme.muted}`}>{String(item.name).substring(0,4)}</span>
                            <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{Math.round((item.value / total) * 100)}%</span>
                          </div>
                         );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: The Massive 90-Day Charts (Matches your Photo) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Sales Trend Over Time (Filled Area) */}
          <div className={`border rounded-2xl p-6 ${theme.card}`}>
            <h2 className="text-lg font-bold mb-6">Sales Trend Over Time</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={denseSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} minTickGap={30} />
                  <YAxis stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={theme.tooltip.content} itemStyle={theme.tooltip.item} labelStyle={theme.tooltip.label} />
                  <Area type="monotone" dataKey="total" name="Total Revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Revenue by Order Type (Stacked Bar) */}
          <div className={`border rounded-2xl p-6 ${theme.card}`}>
            <h2 className="text-lg font-bold mb-6">Revenue by Order Type</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={denseSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                  <XAxis dataKey="date" stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} minTickGap={30} />
                  <YAxis stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip cursor={{fill: isDark ? '#ffffff05' : '#00000005'}} contentStyle={theme.tooltip.content} itemStyle={theme.tooltip.item} labelStyle={theme.tooltip.label} />
                  <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                  <Bar dataKey="delivery" name="Delivery" stackId="a" fill="#ef4444" />
                  <Bar dataKey="takeout" name="Takeout" stackId="a" fill="#10b981" />
                  <Bar dataKey="dineIn" name="Dine-In" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}