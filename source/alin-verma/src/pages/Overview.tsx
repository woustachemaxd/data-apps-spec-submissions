import { useMemo } from "react";
import {
  DollarSign,
  Star,
  Trash2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import {
  SummaryCard,
  RevenueTrendChart,
  SalesPieChart,
  WasteBarChart,
  WasteCostPieChart,
} from "@/components/dashboard";
import type {
  SummaryStats,
  ChartDataPoint,
  TrendDataPoint,
  WasteCategoryData,
  DateRange,
} from "@/types";

interface OverviewProps {
  summaryStats: SummaryStats;
  dailyRevenueTrend: TrendDataPoint[];
  salesByOrderType: ChartDataPoint[];
  wasteByCategory: WasteCategoryData[];
  totalReviews: number;
  dateRange: DateRange;
}

export function Overview({
  summaryStats,
  dailyRevenueTrend,
  salesByOrderType,
  wasteByCategory,
  totalReviews,
  dateRange,
}: OverviewProps) {
  // Calculate time period description
  const timePeriod = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "last 1 day";
    if (diffDays <= 7) return `last ${diffDays} days`;
    if (diffDays <= 30) return `last ${Math.round(diffDays / 7)} weeks`;
    if (diffDays <= 90) return `last ${Math.round(diffDays / 30)} months`;
    if (diffDays <= 365) return `last ${Math.round(diffDays / 30)} months`;
    return "last year";
  }, [dateRange]);
  return (
    <div className="space-y-6">
      {/* Summary Cards - Key Metrics at a Glance */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Revenue"
          value={`$${(summaryStats.totalRevenue / 1000).toFixed(0)}K`}
          icon={<DollarSign className="h-4 w-4" />}
          trend={`+12% vs ${timePeriod}`}
          trendUp
        />
        <SummaryCard
          title="Avg Rating"
          value={summaryStats.avgRating.toFixed(1)}
          icon={<Star className="h-4 w-4" />}
          subtitle="Across all locations"
        />
        <SummaryCard
          title="Total Reviews"
          value={totalReviews.toString()}
          icon={<MessageSquare className="h-4 w-4" />}
          subtitle="Customer feedback"
        />
        <SummaryCard
          title="Waste Cost"
          value={`$${summaryStats.totalWasteCost.toFixed(0)}`}
          icon={<Trash2 className="h-4 w-4" />}
          variant="warning"
        />
        <SummaryCard
          title="Needs Attention"
          value={summaryStats.locationsNeedingAttention.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={
            summaryStats.locationsNeedingAttention > 0 ? "danger" : "success"
          }
          subtitle="Locations flagged"
        />
      </div>

      {/* Revenue Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={dailyRevenueTrend} />
        <SalesPieChart data={salesByOrderType} />
      </div>

      {/* Waste Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WasteBarChart data={wasteByCategory} />
        <WasteCostPieChart data={wasteByCategory} />
      </div>
    </div>
  );
}