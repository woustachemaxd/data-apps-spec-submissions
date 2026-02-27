import { useState, useEffect, useMemo } from "react";
import { fetchAllData } from "@/queries";
import { WASTE_THRESHOLD } from "@/types";
import type {
  Location,
  DailySale,
  CustomerReview,
  InventoryRecord,
  LocationScore,
  WasteByLocation,
  SummaryStats,
  DateRange,
  ChartDataPoint,
  TrendDataPoint,
  WasteCategoryData,
} from "@/types";

interface DashboardData {
  locations: Location[];
  sales: DailySale[];
  reviews: CustomerReview[];
  inventory: InventoryRecord[];
}

interface UseDashboardDataReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
}

// Hook to fetch all dashboard data
export function useDashboardData(): UseDashboardDataReturn {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchAllData();
        setLocations(result.locations);
        setSales(result.sales);
        setReviews(result.reviews);
        setInventory(result.inventory);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return {
    data: { locations, sales, reviews, inventory },
    loading,
    error,
  };
}

// Hook to filter sales by date range
export function useFilteredSales(
  sales: DailySale[],
  dateRange: DateRange
): DailySale[] {
  return useMemo(() => {
    return sales.filter(
      (s) => s.SALE_DATE >= dateRange.start && s.SALE_DATE <= dateRange.end
    );
  }, [sales, dateRange]);
}

// Hook to filter reviews by date range
export function useFilteredReviews(
  reviews: CustomerReview[],
  dateRange: DateRange
): CustomerReview[] {
  return useMemo(() => {
    return reviews.filter(
      (r) => r.REVIEW_DATE >= dateRange.start && r.REVIEW_DATE <= dateRange.end
    );
  }, [reviews, dateRange]);
}

// Hook to filter inventory by date range
export function useFilteredInventory(
  inventory: InventoryRecord[],
  dateRange: DateRange
): InventoryRecord[] {
  return useMemo(() => {
    return inventory.filter(
      (i) => i.RECORD_DATE >= dateRange.start && i.RECORD_DATE <= dateRange.end
    );
  }, [inventory, dateRange]);
}

// Hook to calculate location scores
export function useLocationScores(
  locations: Location[],
  filteredSales: DailySale[],
  reviews: CustomerReview[],
  inventory: InventoryRecord[]
): LocationScore[] {
  return useMemo(() => {
    return locations.map((location) => {
      const locationSales = filteredSales.filter(
        (s) => Number(s.LOCATION_ID) === Number(location.LOCATION_ID)
      );
      const locationReviews = reviews.filter(
        (r) => Number(r.LOCATION_ID) === Number(location.LOCATION_ID)
      );

      // Total revenue
      const totalRevenue = locationSales.reduce(
        (sum, s) => sum + Number(s.REVENUE),
        0
      );

      // Average rating
      const avgRating =
        locationReviews.length > 0
          ? locationReviews.reduce((sum, r) => sum + Number(r.RATING), 0) /
            locationReviews.length
          : 0;

      // Calculate trend (compare first half vs second half of period)
      const sortedSales = [...locationSales].sort((a, b) =>
        a.SALE_DATE.localeCompare(b.SALE_DATE)
      );
      const midPoint = Math.floor(sortedSales.length / 2);
      const firstHalf = sortedSales.slice(0, midPoint);
      const secondHalf = sortedSales.slice(midPoint);

      const firstHalfRevenue = firstHalf.reduce(
        (sum, s) => sum + Number(s.REVENUE),
        0
      );
      const secondHalfRevenue = secondHalf.reduce(
        (sum, s) => sum + Number(s.REVENUE),
        0
      );

      let trend: "improving" | "declining" | "stable" = "stable";
      let trendPercent = 0;

      if (firstHalfRevenue > 0) {
        trendPercent =
          ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
        if (trendPercent > 5) trend = "improving";
        else if (trendPercent < -5) trend = "declining";
      }

      // Check for attention flags
      const attentionReasons: string[] = [];
      if (avgRating < 3.5) attentionReasons.push("Low rating");
      if (trend === "declining" && trendPercent < -10)
        attentionReasons.push("Declining sales");

      // Check waste
      const locationInv = inventory.filter(
        (i) => Number(i.LOCATION_ID) === Number(location.LOCATION_ID)
      );
      const totalWaste = locationInv.reduce(
        (sum, i) => sum + Number(i.UNITS_WASTED),
        0
      );
      const totalReceived = locationInv.reduce(
        (sum, i) => sum + Number(i.UNITS_RECEIVED),
        0
      );
      if (totalReceived > 0 && totalWaste / totalReceived > WASTE_THRESHOLD) {
        attentionReasons.push("High waste");
      }

      return {
        location,
        totalRevenue,
        avgRating,
        reviewCount: locationReviews.length,
        trend,
        trendPercent,
        needsAttention: attentionReasons.length > 0,
        attentionReasons,
      };
    });
  }, [locations, filteredSales, reviews, inventory]);
}

// Hook to calculate waste by location
export function useWasteByLocation(
  locationScores: LocationScore[],
  inventory: InventoryRecord[]
): WasteByLocation[] {
  return useMemo(() => {
    return locationScores.map((score) => {
      const locationInv = inventory.filter(
        (i) => Number(i.LOCATION_ID) === Number(score.location.LOCATION_ID)
      );
      const totalWaste = locationInv.reduce(
        (sum, i) => sum + Number(i.UNITS_WASTED),
        0
      );
      const totalReceived = locationInv.reduce(
        (sum, i) => sum + Number(i.UNITS_RECEIVED),
        0
      );
      const wasteCost = locationInv.reduce(
        (sum, i) => sum + Number(i.WASTE_COST),
        0
      );
      const wasteRate =
        totalReceived > 0 ? (totalWaste / totalReceived) * 100 : 0;

      // Calculate waste trend
      const sortedInv = [...locationInv].sort((a, b) =>
        a.RECORD_DATE.localeCompare(b.RECORD_DATE)
      );
      const midPoint = Math.floor(sortedInv.length / 2);
      const firstHalf = sortedInv.slice(0, midPoint);
      const secondHalf = sortedInv.slice(midPoint);

      const firstHalfWaste = firstHalf.reduce(
        (sum, i) => sum + Number(i.UNITS_WASTED),
        0
      );
      const secondHalfWaste = secondHalf.reduce(
        (sum, i) => sum + Number(i.UNITS_WASTED),
        0
      );

      let wasteTrend: "improving" | "worsening" | "stable" = "stable";
      if (firstHalfWaste > 0) {
        const change =
          ((secondHalfWaste - firstHalfWaste) / firstHalfWaste) * 100;
        if (change > 10) wasteTrend = "worsening";
        else if (change < -10) wasteTrend = "improving";
      }

      return {
        ...score,
        totalWaste,
        wasteCost,
        wasteRate,
        wasteTrend,
        aboveThreshold: wasteRate > WASTE_THRESHOLD * 100,
      };
    });
  }, [locationScores, inventory]);
}

// Hook to calculate summary stats
export function useSummaryStats(
  locationScores: LocationScore[],
  inventory: InventoryRecord[]
): SummaryStats {
  return useMemo(() => {
    const totalRevenue = locationScores.reduce(
      (sum, s) => sum + s.totalRevenue,
      0
    );
    const avgRating =
      locationScores.reduce((sum, s) => sum + s.avgRating, 0) /
      locationScores.length;
    const totalWasteCost = inventory.reduce(
      (sum, i) => sum + Number(i.WASTE_COST),
      0
    );
    const locationsNeedingAttention = locationScores.filter(
      (s) => s.needsAttention
    ).length;

    return {
      totalRevenue,
      avgRating,
      totalWasteCost,
      locationsNeedingAttention,
    };
  }, [locationScores, inventory]);
}

// Hook for sales by order type chart data
export function useSalesByOrderType(filteredSales: DailySale[]): ChartDataPoint[] {
  return useMemo(() => {
    const totals: Record<string, number> = {};
    filteredSales.forEach((s) => {
      totals[s.ORDER_TYPE] = (totals[s.ORDER_TYPE] || 0) + Number(s.REVENUE);
    });
    return Object.entries(totals).map(([type, revenue]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
      value: Math.round(revenue),
    }));
  }, [filteredSales]);
}

// Hook for daily revenue trend
export function useDailyRevenueTrend(filteredSales: DailySale[]): TrendDataPoint[] {
  return useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredSales.forEach((s) => {
      byDate[s.SALE_DATE] = (byDate[s.SALE_DATE] || 0) + Number(s.REVENUE);
    });
    return Object.entries(byDate)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);
}

// Hook for waste by category
export function useWasteByCategory(inventory: InventoryRecord[]): WasteCategoryData[] {
  return useMemo(() => {
    const byCategory: Record<string, { wasted: number; cost: number }> = {};
    inventory.forEach((i) => {
      if (!byCategory[i.CATEGORY]) {
        byCategory[i.CATEGORY] = { wasted: 0, cost: 0 };
      }
      byCategory[i.CATEGORY].wasted += Number(i.UNITS_WASTED);
      byCategory[i.CATEGORY].cost += Number(i.WASTE_COST);
    });
    return Object.entries(byCategory).map(([category, data]) => ({
      category:
        category.charAt(0).toUpperCase() +
        category.slice(1).replace("_", " "),
      wasted: data.wasted,
      cost: Math.round(data.cost * 100) / 100,
    }));
  }, [inventory]);
}

// Hook for dark mode
export function useDarkMode(): [boolean, (value: boolean) => void] {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return [darkMode, setDarkMode];
}
