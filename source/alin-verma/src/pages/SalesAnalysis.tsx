import { useMemo } from "react";
import {
  RevenueBarChart,
  LocationRevenueChart,
  OrderTypeTrendChart,
} from "@/components/dashboard";
import type { LocationScore, DailySale, ChartDataPoint } from "@/types";

interface SalesAnalysisProps {
  locationScores: LocationScore[];
  filteredSales: DailySale[];
  salesByOrderType: ChartDataPoint[];
}

export function SalesAnalysis({
  locationScores,
  filteredSales,
  salesByOrderType,
}: SalesAnalysisProps) {
  // Revenue by location for chart
  const revenueByLocation = useMemo(() => {
    return locationScores
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((s) => ({
        name:
          s.location.NAME.length > 15
            ? s.location.NAME.slice(0, 15) + "..."
            : s.location.NAME,
        revenue: Math.round(s.totalRevenue),
      }));
  }, [locationScores]);

  // Daily trend by order type
  const orderTypeTrend = useMemo(() => {
    const byDate: Record<
      string,
      { dinein: number; takeout: number; delivery: number }
    > = {};
    filteredSales.forEach((s) => {
      if (!byDate[s.SALE_DATE]) {
        byDate[s.SALE_DATE] = { dinein: 0, takeout: 0, delivery: 0 };
      }
      const key = s.ORDER_TYPE.replace("-", "") as
        | "dinein"
        | "takeout"
        | "delivery";
      byDate[s.SALE_DATE][key] += Number(s.REVENUE);
    });
    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        "Dine-in": Math.round(data.dinein),
        Takeout: Math.round(data.takeout),
        Delivery: Math.round(data.delivery),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [filteredSales]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Order Type Breakdown */}
      <RevenueBarChart
        data={salesByOrderType}
        title="Revenue by Order Type"
        description="Breakdown of sales across all locations"
      />

      {/* Daily Trend by Order Type - spans full width on large screens */}
      <OrderTypeTrendChart data={orderTypeTrend} />

      {/* Revenue by Location - spans full width */}
      <div className="lg:col-span-2">
        <LocationRevenueChart data={revenueByLocation} />
      </div>
    </div>
  );
}