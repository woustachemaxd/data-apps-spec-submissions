// SalesTrend.tsx
import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp } from "lucide-react";

interface SalesTrendProps {
  days: number; // Number of days to show
}

export default function SalesTrend({ days }: SalesTrendProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const result = await querySnowflake(`
        SELECT SALE_DATE, SUM(REVENUE) AS DAILY_REVENUE
        FROM DAILY_SALES
        WHERE SALE_DATE >= DATEADD(day, -${days}, CURRENT_DATE)
        GROUP BY SALE_DATE
        ORDER BY SALE_DATE
      `);
      setData(result);
    }
    loadData();
  }, [days]);

  return (
    <div className="space-y-6">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📈 Sales Trend Analysis</h1>
            <p className="welcome-subtitle">Revenue patterns and performance insights</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📈 Live</div>
            <div className="text-sm opacity-80">Trends</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center interactive-card gpu-accelerated" style={{ padding: '16px', borderRadius: '12px' }}>
        <div>
          <h2 className="text-3xl font-bold text-gradient-accent">
            🎪 SnowCone Intelligence
          </h2>
          <p className="text-slate-600 dark:text-slate-300">📈 Track sales performance and revenue trends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 interactive-button gpu-accelerated">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2 interactive-button gpu-accelerated">
            <TrendingUp className="h-4 w-4" />
            Analyze Trends
          </Button>
        </div>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="SALE_DATE" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="DAILY_REVENUE" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}