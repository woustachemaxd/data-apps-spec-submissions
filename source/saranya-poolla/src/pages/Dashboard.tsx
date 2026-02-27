import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Star, DollarSign } from "lucide-react";

import GlobalFilters from "@/components/GlobalFilters";
import AIInsights from "@/components/AIInsights";
import OperationsAlerts from "@/components/OperationsAlerts";

import SalesTrend from "@/components/SalesTrend";
import OrderTypeBreakdown from "@/components/OrderTypeBreakdown";
import WasteTracker from "@/components/WasteTracker";
import DateFilter from "@/components/DateFilter";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* =====================================================
   🎪 SNOWCONE INTELLIGENCE DASHBOARD
===================================================== */

export default function Dashboard() {
  /* ---------- GLOBAL FILTER STATE ---------- */
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  /* ---------- DATA ---------- */
  const [locations, setLocations] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    revenue: 0,
    avgRating: 0,
    risks: 0,
  });

  /* =====================================================
     LOAD KPI DATA
  ===================================================== */
  useEffect(() => {
    async function loadData() {
      const result = await querySnowflake(`
        SELECT
          l.LOCATION_ID,
          l.NAME,
          ROUND(SUM(s.REVENUE),0) TOTAL_REVENUE,
          ROUND(AVG(r.RATING),1) AVG_RATING
        FROM LOCATIONS l
        JOIN DAILY_SALES s
          ON l.LOCATION_ID = s.LOCATION_ID
        LEFT JOIN CUSTOMER_REVIEWS r
          ON l.LOCATION_ID = r.LOCATION_ID
          AND s.SALE_DATE = r.REVIEW_DATE
        WHERE s.SALE_DATE >= '${startDate.toISOString().split('T')[0]}'
          AND s.SALE_DATE <= '${endDate.toISOString().split('T')[0]}'
        GROUP BY l.LOCATION_ID, l.NAME
      `);

      setLocations(result);

      const revenue = result.reduce(
        (sum: number, r: any) => sum + r.TOTAL_REVENUE,
        0
      );

      const avgRating =
        result.reduce(
          (sum: number, r: any) => sum + (r.AVG_RATING || 0),
          0
        ) / result.length;

      const risks = result.filter(
        (r: any) =>
          r.TOTAL_REVENUE < 150000 ||
          r.AVG_RATING < 4
      ).length;

      setKpis({
        revenue,
        avgRating,
        risks,
      });
    }

    loadData();
  }, [startDate, endDate]);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="space-y-8 animate-in fade-in-5 slide-in-from-top-2 duration-700">

      {/* ================= WELCOME BANNER ================= */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">🎪 SnowCone Intelligence</h1>
            <p className="welcome-subtitle">Your AI-Powered Analytics Command Center</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">✨ Live</div>
            <div className="text-sm opacity-80">Real-time Analytics</div>
          </div>
        </div>
      </div>

      {/* ================= DATE FILTER ================= */}
      <DateFilter 
        onDateRangeChange={(newStartDate, newEndDate) => {
          // Update the date range state
          setStartDate(newStartDate);
          setEndDate(newEndDate);
          
          // Calculate days between dates
          const daysDiff = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
          setDays(Math.max(1, daysDiff));
        }}
        defaultDays={30}
      />

      {/* ================= EXECUTIVE AI ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 interactive-card gpu-accelerated" style={{ padding: '12px', borderRadius: '12px' }}>
          <Sparkles className="h-6 w-6 text-accent-cyan animate-spin gpu-accelerated" />
          <h2 className="text-2xl font-bold text-gradient-accent">
            🤖 Executive AI Insights
          </h2>
        </div>
        <AIInsights locations={locations} />
      </div>

      {/* ================= GLOBAL FILTERS ================= */}
      <GlobalFilters
        days={days}
        onDaysChange={setDays}
      />

      {/* ================= KPI STRIP ================= */}
      <div className="grid gap-6 md:grid-cols-3">
        <KpiCard
          title="Network Revenue"
          value={`$${kpis.revenue.toLocaleString()}`}
          trend="↑ Healthy Growth"
          icon={<DollarSign className="h-8 w-8" />}
          color="from-accent-green to-green-600"
        />

        <KpiCard
          title="Customer Satisfaction"
          value={`${kpis.avgRating.toFixed(1)} ⭐`}
          trend="↑ Positive Trend"
          icon={<Star className="h-8 w-8" />}
          color="from-accent-cyan to-accent-blue"
        />

        <KpiCard
          title="Locations At Risk"
          value={kpis.risks}
          trend="Needs Attention"
          danger
          icon={<AlertTriangle className="h-8 w-8" />}
          color="from-accent-red to-red-600"
        />
      </div>

      {/* ================= OPS ALERTS ================= */}
      <OperationsAlerts />

      {/* ================= ANALYTICS ================= */}
      <div className="grid xl:grid-cols-2 gap-8">

        {/* Revenue Trend */}
        <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-xl font-bold">
                Revenue Trend ({days} days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <SalesTrend days={days} />
          </CardContent>
        </Card>

        {/* Order Breakdown */}
        <Card className="hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-green-500" />
              <CardTitle className="text-xl font-bold">
                Order Type Performance
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <OrderTypeBreakdown days={days} />
          </CardContent>
        </Card>

        {/* Waste Intelligence */}
        <Card className="xl:col-span-2 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-500 animate-spin" />
              <CardTitle className="text-xl font-bold">
                🧠 Smart Waste Intelligence
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <WasteTracker days={days} />
          </CardContent>
        </Card>

      </div>

    </div>
  );
}

/* =====================================================
   KPI CARD COMPONENT
===================================================== */

function KpiCard({
  title,
  value,
  trend,
  danger,
  icon,
  color,
}: {
  title: string;
  value: any;
  trend: string;
  danger?: boolean;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="interactive-card gpu-accelerated card-navy group hover:shadow-2xl transition-all duration-150 transform hover:scale-102 border-none bg-gradient-to-br from-white to-slate-50 dark:from-navy-light dark:to-navy relative overflow-hidden">
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-10 group-hover:opacity-20 transition-all duration-150 gpu-accelerated`}></div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg gpu-accelerated`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-medium text-navy dark:text-off-white">
                {title}
              </CardTitle>
            </div>
          </div>
          <div className={`text-sm font-medium ${
            danger ? "text-accent-red" : "text-accent-green"
          } gpu-accelerated`}>
            {trend}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="text-4xl font-bold tracking-tight text-navy dark:text-off-white gpu-accelerated">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
