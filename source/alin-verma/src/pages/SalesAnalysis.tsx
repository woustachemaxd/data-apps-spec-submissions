import { useMemo } from "react";
import {
  RevenueBarChart,
  LocationRevenueChart,
  OrderTypeTrendChart,
} from "@/components/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus, Star } from "lucide-react";
import type { LocationScore, DailySale, ChartDataPoint, DateRange } from "@/types";

interface SalesAnalysisProps {
  locationScores: LocationScore[];
  filteredSales: DailySale[];
  salesByOrderType: ChartDataPoint[];
  dateRange: DateRange;
}

export function SalesAnalysis({
  locationScores,
  filteredSales,
  salesByOrderType,
  dateRange,
}: SalesAnalysisProps) {
  // Calculate time period description
  const timePeriod = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "1 day";
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.round(diffDays / 7)} weeks`;
    if (diffDays <= 90) return `${Math.round(diffDays / 30)} months`;
    if (diffDays <= 365) return `${Math.round(diffDays / 30)} months`;
    return "year";
  }, [dateRange]);

  // Revenue by location for chart
  const revenueByLocation = useMemo(() => {
    return locationScores
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((s) => ({
        name: s.location.NAME,
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

  // Detailed location data for table
  const locationDetails = useMemo(() => {
    return locationScores
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((s) => {
        // Calculate order counts by type for this location
        const locationSales = filteredSales.filter(
          (sale) => sale.LOCATION_ID === s.location.LOCATION_ID
        );
        const orderCounts = {
          dinein: 0,
          takeout: 0,
          delivery: 0,
        };
        locationSales.forEach((sale) => {
          const type = sale.ORDER_TYPE.replace("-", "");
          const numOrders = Number(sale.NUM_ORDERS) || 0;
          if (type === "dinein") orderCounts.dinein += numOrders;
          else if (type === "takeout") orderCounts.takeout += numOrders;
          else if (type === "delivery") orderCounts.delivery += numOrders;
        });

        return {
          id: s.location.LOCATION_ID,
          name: s.location.NAME,
          city: s.location.CITY,
          state: s.location.STATE,
          manager: s.location.MANAGER_NAME,
          revenue: s.totalRevenue,
          avgRating: s.avgRating,
          reviewCount: s.reviewCount,
          trend: s.trend,
          trendPercent: s.trendPercent,
          orderCounts,
          totalOrders: orderCounts.dinein + orderCounts.takeout + orderCounts.delivery,
        };
      });
  }, [locationScores, filteredSales]);

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Type Breakdown */}
        <RevenueBarChart
          data={salesByOrderType}
          title="Revenue by Order Type"
          description="Breakdown of sales across all locations"
        />

        {/* Daily Trend by Order Type */}
        <OrderTypeTrendChart data={orderTypeTrend} />

        {/* Revenue by Location - spans full width */}
        <div className="lg:col-span-2">
          <LocationRevenueChart data={revenueByLocation} />
        </div>
      </div>

      {/* Location Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Location</CardTitle>
          <CardDescription>
            Detailed breakdown of revenue, orders, and ratings by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Location</th>
                  <th className="text-right py-3 px-2 font-medium">Revenue</th>
                  <th className="text-right py-3 px-2 font-medium">Orders</th>
                  <th className="text-center py-3 px-2 font-medium">Rating</th>
                  <th className="text-center py-3 px-2 font-medium">Sales Trend</th>
                </tr>
              </thead>
              <tbody>
                {locationDetails.map((loc) => (
                  <tr
                    key={loc.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="py-3 px-2">
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.city}, {loc.state}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      ${loc.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div>
                        <p className="font-medium">{loc.totalOrders.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {loc.orderCounts.dinein} Dine • {loc.orderCounts.takeout} Take • {loc.orderCounts.delivery} Del
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{loc.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({loc.reviewCount})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          {loc.trend === "improving" && (
                            <>
                              <ArrowUp className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 font-medium">
                                +{loc.trendPercent.toFixed(0)}%
                              </span>
                            </>
                          )}
                          {loc.trend === "declining" && (
                            <>
                              <ArrowDown className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 font-medium">
                                {loc.trendPercent.toFixed(0)}%
                              </span>
                            </>
                          )}
                          {loc.trend === "stable" && (
                            <>
                              <Minus className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Stable</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">vs {timePeriod}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}