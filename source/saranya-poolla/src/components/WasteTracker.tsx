// WasteTracker.tsx
import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Target, Sparkles } from "lucide-react";

interface WasteTrackerProps {
  days: number;
}

export default function WasteTracker({ days }: WasteTrackerProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const result = await querySnowflake(`
        SELECT CATEGORY, SUM(UNITS_WASTED) AS TOTAL_WASTED, SUM(WASTE_COST) AS TOTAL_COST
        FROM INVENTORY
        WHERE RECORD_DATE >= DATEADD(day, -${days}, CURRENT_DATE)
        GROUP BY CATEGORY
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
            <h1 className="welcome-title">🧠 Smart Waste Intelligence</h1>
            <p className="welcome-subtitle">AI-powered waste reduction and optimization</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">🧠 Live</div>
            <div className="text-sm opacity-80">Waste</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center interactive-card gpu-accelerated" style={{ padding: '16px', borderRadius: '12px' }}>
        <div>
          <h2 className="text-3xl font-bold text-gradient-accent">
            🎪 SnowCone Intelligence
          </h2>
          <p className="text-slate-600 dark:text-slate-300">🧠 AI-powered waste reduction and cost optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 interactive-button gpu-accelerated">
            <Download className="h-4 w-4" />
            Export Waste Report
          </Button>
          <Button className="gap-2 interactive-button gpu-accelerated">
            <Sparkles className="h-4 w-4" />
            Optimize Inventory
          </Button>
        </div>
      </div>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="CATEGORY" />
            <YAxis />
            <Tooltip
              formatter={(value: number | string | undefined) =>
                value !== undefined ? `$${Number(value).toLocaleString()}` : ""
              }
            />
            <Legend />
            <Bar dataKey="TOTAL_WASTED" fill="#f87171" name="Units Wasted" />
            <Bar dataKey="TOTAL_COST" fill="#fbbf24" name="Waste Cost ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}