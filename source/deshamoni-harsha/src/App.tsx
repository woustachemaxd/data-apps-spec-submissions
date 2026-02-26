import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, MapPin, Download, Search, CheckCircle2, Cpu, Sparkles, Terminal, ArrowUpDown, Database, Network, Moon, Sun } from 'lucide-react';

// --- ENHANCED MOCK DATA ---
const storeData = [
  { id: 1, name: "Downtown Chill", city: "New York", revenue: 12500, rating: 4.8, trend: 'up', waste: 5, wasteCategory: 'Dairy', orders: 1240, orderBreakdown: [{name: 'Dine-In', value: 600}, {name: 'Takeout', value: 400}, {name: 'Delivery', value: 240}] },
  { id: 2, name: "Midtown Scoops", city: "New York", revenue: 8400, rating: 3.2, trend: 'down', waste: 14, wasteCategory: 'Produce', orders: 890, orderBreakdown: [{name: 'Dine-In', value: 300}, {name: 'Takeout', value: 400}, {name: 'Delivery', value: 190}] },
  { id: 3, name: "Beachside Cones", city: "Miami", revenue: 15200, rating: 4.9, trend: 'up', waste: 4, wasteCategory: 'Dry Goods', orders: 1550, orderBreakdown: [{name: 'Dine-In', value: 800}, {name: 'Takeout', value: 450}, {name: 'Delivery', value: 300}] },
  { id: 4, name: "Valley Vanilla", city: "Phoenix", revenue: 6100, rating: 4.1, trend: 'down', waste: 18, wasteCategory: 'Dairy', orders: 620, orderBreakdown: [{name: 'Dine-In', value: 200}, {name: 'Takeout', value: 220}, {name: 'Delivery', value: 200}] },
  { id: 5, name: "Lakeside Licks", city: "Chicago", revenue: 9500, rating: 4.5, trend: 'up', waste: 8, wasteCategory: 'Produce', orders: 980, orderBreakdown: [{name: 'Dine-In', value: 500}, {name: 'Takeout', value: 280}, {name: 'Delivery', value: 200}] },
];

const salesHistory = [
  { date: 'Mon', dineIn: 2400, takeout: 1000, delivery: 600 },
  { date: 'Tue', dineIn: 1398, takeout: 1000, delivery: 602 },
  { date: 'Wed', dineIn: 2800, takeout: 2000, delivery: 200 },
  { date: 'Thu', dineIn: 1908, takeout: 500, delivery: 372 },
  { date: 'Fri', dineIn: 4800, takeout: 1500, delivery: 590 },
  { date: 'Sat', dineIn: 5800, takeout: 2000, delivery: 590 },
  { date: 'Sun', dineIn: 4300, takeout: 2500, delivery: 690 },
];

// AI Simulated Streaming Hook
const useStreamingText = (text, trigger) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 12); // Fast typing speed
    return () => clearInterval(interval);
  }, [text, trigger]);
  return displayedText;
};

// Helper to calculate mathematically accurate forecasts
const getForecast = (waste, trend) => {
  if (waste > 10 && trend === 'down') return 'Critical Decline';
  if (waste > 10 && trend === 'up') return 'High Risk Margin';
  if (waste <= 10 && trend === 'up') return 'Optimal Growth';
  return 'Stable Operations';
};

// Data generators for charts
const generateSparkline = (base) => Array.from({length: 7}, () => ({ value: base * (0.8 + Math.random() * 0.4) }));
const generateStoreChart = (baseRevenue) => salesHistory.map(day => ({
  date: day.date, revenue: Math.floor((day.dineIn + day.takeout + day.delivery) * (baseRevenue / 35000) * (0.8 + Math.random() * 0.4))
}));

// PIE CHART COLORS
const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981'];

export default function App() {
  const [selectedStore, setSelectedStore] = useState(storeData[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });
  const [isDark, setIsDark] = useState(true);

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

  const requestSort = (key) => {
    setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'City', 'Revenue', 'Rating', 'Waste %', 'System Forecast'];
    const rows = storeData.map(s => [s.id, s.name, s.city, s.revenue, s.rating, s.waste, getForecast(s.waste, s.trend)]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => `"${e.join('","')}"`)].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "snowcone_nexus_export.csv";
    link.click();
  };

  // Conversational BI Insight Generation
  const aiInsightText = useMemo(() => {
    if (!selectedStore) return "Awaiting target selection...";
    if (selectedStore.waste > 10) {
      return `CRITICAL ANOMALY: ${selectedStore.name} is exhibiting a ${selectedStore.waste}% resource drain, primarily in ${selectedStore.wasteCategory}. Revenue is heavily impacted. Recommend immediate audit of supply chain logs in the ${selectedStore.city} sector.`;
    }
    if (selectedStore.trend === 'up') {
      return `OPTIMAL: ${selectedStore.name} is outperforming regional baselines. High customer CSAT (${selectedStore.rating}) correlates perfectly with low waste metrics (${selectedStore.waste}%). Recommend mirroring this operational model to underperforming branches.`;
    }
    return `NOTICE: ${selectedStore.name} requires monitoring. Revenue sits at $${selectedStore.revenue.toLocaleString()} with a ${selectedStore.trend}ward trajectory. NLP models suggest investigating local foot-traffic data for correlation.`;
  }, [selectedStore]);

  const streamedInsight = useStreamingText(aiInsightText, selectedStore?.id);

  // Dynamic Theme Variables (Including explicit Tooltip styling)
  const theme = {
    bg: isDark ? 'bg-[#030712]' : 'bg-slate-50',
    text: isDark ? 'text-slate-200' : 'text-slate-900',
    card: isDark ? 'bg-[#0f172a]/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl',
    cardHeader: isDark ? 'border-slate-800' : 'border-slate-100',
    muted: isDark ? 'text-slate-400' : 'text-slate-500',
    chartGrid: isDark ? '#1e293b' : '#f1f5f9',
    chartText: isDark ? '#64748b' : '#94a3b8',
    input: isDark ? 'bg-black/40 border-slate-700 focus:ring-cyan-500 text-white' : 'bg-slate-50 border-slate-300 focus:ring-blue-500 text-slate-900',
    rowHover: isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50',
    rowSelected: isDark ? 'bg-indigo-500/20 border-indigo-500' : 'bg-indigo-50 border-indigo-600',
    
    // Explicit styles for tooltips to guarantee visibility
    tooltip: {
      content: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        borderRadius: '8px',
        color: isDark ? '#f8fafc' : '#0f172a',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      },
      item: { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 },
      label: { color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px', fontWeight: 600 }
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 pb-10 overflow-hidden relative ${theme.bg} ${theme.text}`}>
      
      {/* Background Grid & Glows (Only visible in Dark Mode) */}
      {isDark && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
        </>
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 relative z-10">
        
        {/* HEADER */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-[0_0_30px_rgba(56,189,248,0.3)]' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'}`}>
              <Network size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2">
                Snowcone <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-cyan-400 to-indigo-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>NEXUS</span>
              </h1>
              <p className={`text-xs font-mono tracking-widest uppercase mt-1 ${theme.muted}`}>Regional Operations Command</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
            <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-lg border transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-yellow-400' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'}`}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={exportToCSV} className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-lg transition-all font-semibold shadow-lg ${isDark ? 'bg-white/10 hover:bg-white/20 border border-white/10 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* LEFT PANEL */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* Spec 01: Interactive Location Scorecard */}
            <div className={`border rounded-2xl backdrop-blur-xl overflow-hidden ${theme.card}`}>
              <div className={`p-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${theme.cardHeader}`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin size={18} className={isDark ? "text-cyan-500" : "text-blue-600"}/> Fleet Command Center
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className={`absolute left-3 top-2.5 ${theme.muted}`} size={16} />
                  <input type="text" placeholder="Filter nodes by text..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${theme.input}`} />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={isDark ? 'bg-slate-900/50' : 'bg-slate-50'}>
                      <th onClick={() => requestSort('name')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono tracking-widest uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>Node <ArrowUpDown size={12} className="inline"/></th>
                      <th onClick={() => requestSort('revenue')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono tracking-widest uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>Gross Rev <ArrowUpDown size={12} className="inline"/></th>
                      <th className={`py-3 px-5 text-[10px] font-mono tracking-widest uppercase ${theme.muted}`}>7D Pulse</th>
                      <th onClick={() => requestSort('rating')} className={`cursor-pointer py-3 px-5 text-[10px] font-mono tracking-widest uppercase ${theme.muted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-blue-600'}`}>CSAT <ArrowUpDown size={12} className="inline"/></th>
                      <th className={`py-3 px-5 text-[10px] font-mono tracking-widest uppercase ${theme.muted}`}>Algorithm Forecast</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                    {sortedAndFilteredStores.map(store => {
                      const isSelected = selectedStore?.id === store.id;
                      const hasIssue = store.waste > 10;
                      const dynamicForecast = getForecast(store.waste, store.trend);
                      
                      return (
                        <tr key={store.id} onClick={() => setSelectedStore(store)}
                          className={`cursor-pointer transition-all border-l-4 ${isSelected ? theme.rowSelected : `border-transparent ${theme.rowHover}`}`}>
                          <td className="py-4 px-5">
                            <div className={`font-bold text-sm flex items-center gap-2 ${isSelected && isDark ? 'text-cyan-400' : ''} ${isSelected && !isDark ? 'text-indigo-700' : ''}`}>
                              {store.name}
                            </div>
                            <div className={`text-xs font-mono mt-0.5 ${theme.muted}`}>{store.city}</div>
                          </td>
                          <td className="py-4 px-5 font-mono text-sm">${store.revenue.toLocaleString()}</td>
                          <td className="py-4 px-5 w-24">
                            <div className="h-6 w-16 opacity-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={generateSparkline(store.revenue)}>
                                  <Line type="monotone" dataKey="value" stroke={hasIssue ? '#ef4444' : '#10b981'} strokeWidth={2} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-sm font-medium">{store.rating} <span className="text-amber-400">★</span></td>
                          <td className="py-4 px-5">
                            {hasIssue ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                <AlertTriangle size={12} /> {dynamicForecast}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                <CheckCircle2 size={12} /> {dynamicForecast}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spec 02: Global Charts */}
            <div className={`border rounded-2xl p-6 backdrop-blur-xl ${theme.card}`}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold flex items-center gap-2"><Database size={18} className={isDark ? "text-cyan-500" : "text-blue-600"}/> Aggregated Network Telemetry</h2>
               </div>
               <div className="h-[280px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={salesHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorDineIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient>
                       <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} vertical={false} />
                     <XAxis dataKey="date" stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                     <YAxis stroke={theme.chartText} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                     <RechartsTooltip 
                       contentStyle={theme.tooltip.content}
                       itemStyle={theme.tooltip.item}
                       labelStyle={theme.tooltip.label}
                     />
                     <Area type="monotone" dataKey="dineIn" name="Dine-In" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDineIn)" />
                     <Area type="monotone" dataKey="delivery" name="Delivery" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDelivery)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* RIGHT PANEL: Cortex Agent & Drill-Down */}
          <div className="xl:col-span-4 space-y-6 flex flex-col">
            
            {/* CORTEX ANALYST AGENT */}
            <div className={`border rounded-2xl p-1 relative overflow-hidden flex-shrink-0 transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'bg-gradient-to-br from-blue-100 to-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10'}`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
              <div className={`backdrop-blur-md rounded-xl p-5 h-full ${isDark ? 'bg-black/40' : 'bg-white/60'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-indigo-900'}`}>Cortex Analyst Engine</h3>
                  <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}`}></span>
                    STREAMING
                  </div>
                </div>
                
                <div className={`rounded-lg p-4 border min-h-[140px] relative font-mono text-xs leading-relaxed transition-colors duration-300 ${isDark ? 'bg-[#050505]/80 border-white/5 text-cyan-50' : 'bg-white border-indigo-100 text-indigo-900 shadow-inner'}`}>
                  <Sparkles size={14} className={`absolute top-4 right-4 ${isDark ? 'text-indigo-500/50' : 'text-indigo-400'}`} />
                  <p className="mr-6">
                    <span className={isDark ? "text-cyan-400" : "text-blue-600"}>{'>'}</span> {streamedInsight}
                    <span className={`inline-block w-1.5 h-3 ml-1 animate-pulse align-middle ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`}></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Spec 04: Node Inspector */}
            <div className={`border rounded-2xl p-6 flex-1 flex flex-col ${theme.card}`}>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Terminal size={18} className={theme.muted}/> Node Inspector
              </h2>
              
              {!selectedStore ? (
                <div className={`flex-1 flex flex-col items-center justify-center text-center ${theme.muted}`}>
                  <div className={`w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-3 ${isDark ? 'border-slate-700' : 'border-slate-300'}`}><MapPin size={20} /></div>
                  <p className="text-sm">Awaiting node selection...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                  <div className="mb-6">
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedStore.name}</h3>
                    <p className={`text-xs font-mono mt-1 ${theme.muted}`}>ID: SNW-{selectedStore.id}00 • {selectedStore.city}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-[10px] uppercase font-mono mb-1 ${theme.muted}`}>Vol (7D)</p>
                      <p className="text-xl font-bold flex items-center gap-2">
                        {selectedStore.orders}
                        {selectedStore.trend === 'up' ? <TrendingUp size={16} className="text-emerald-500"/> : <TrendingDown size={16} className="text-red-500"/>}
                      </p>
                    </div>
                    <div className={`rounded-xl p-4 border ${selectedStore.waste > 10 ? (isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200') : (isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200')}`}>
                      <p className={`text-[10px] uppercase font-mono mb-1 ${theme.muted}`}>Waste Index</p>
                      <p className={`text-xl font-bold ${selectedStore.waste > 10 ? 'text-red-500' : 'text-emerald-500'}`}>{selectedStore.waste}%</p>
                    </div>
                  </div>

                  {/* Node Graphs: Bar Chart + Pie Chart Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className={`text-[10px] uppercase font-mono mb-2 ${theme.muted}`}>Revenue Trend</p>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={generateStoreChart(selectedStore.revenue)}>
                            <RechartsTooltip 
                              cursor={{fill: isDark ? '#ffffff05' : '#00000005'}} 
                              contentStyle={theme.tooltip.content}
                              itemStyle={theme.tooltip.item}
                              labelStyle={theme.tooltip.label}
                              formatter={(value) => [`$${value}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
                              {generateStoreChart(selectedStore.revenue).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={selectedStore.trend === 'up' ? '#0ea5e9' : (isDark ? '#334155' : '#cbd5e1')} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase font-mono mb-2 ${theme.muted}`}>Channel Split</p>
                      <div className="h-[100px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={selectedStore.orderBreakdown} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value" stroke="none">
                              {selectedStore.orderBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{...theme.tooltip.content, fontSize: '12px'}}
                              itemStyle={theme.tooltip.item}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Spec 03: Inventory Waste Tracker */}
                  <div className="mt-auto">
                    <p className={`text-[10px] uppercase font-mono mb-3 flex justify-between ${theme.muted}`}>
                      <span>Waste Root Cause</span><span>Threshold: 10%</span>
                    </p>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span>{selectedStore.wasteCategory}</span><span className="font-mono">{selectedStore.waste}%</span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full transition-all duration-1000 ${selectedStore.waste > 10 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(selectedStore.waste * 3, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}