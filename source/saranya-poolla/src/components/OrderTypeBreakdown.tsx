// OrderTypeBreakdown.tsx
import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface OrderTypeBreakdownProps {
  days: number;
}

export default function OrderTypeBreakdown({ days }: OrderTypeBreakdownProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const result = await querySnowflake(`
        SELECT ORDER_TYPE, COUNT(*) AS ORDER_COUNT, SUM(REVENUE) AS TOTAL_REVENUE
        FROM DAILY_SALES
        WHERE SALE_DATE >= DATEADD(day, -${days}, CURRENT_DATE)
        GROUP BY ORDER_TYPE
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
            <h1 className="welcome-title">📊 Order Type Performance</h1>
            <p className="welcome-subtitle">Analyze different order types and their impact</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📊 Live</div>
            <div className="text-sm opacity-80">Performance</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center interactive-card gpu-accelerated" style={{ padding: '16px', borderRadius: '12px' }}>
        <div>
          <h2 className="text-3xl font-bold text-gradient-accent">
            🎪 SnowCone Intelligence
          </h2>
          <p className="text-slate-600 dark:text-slate-300">📊 Analyze order types and revenue distribution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 interactive-button gpu-accelerated">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2 interactive-button gpu-accelerated">
            <PieChartIcon className="h-4 w-4" />
            Analyze Distribution
          </Button>
        </div>
      </div>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="ORDER_COUNT"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}