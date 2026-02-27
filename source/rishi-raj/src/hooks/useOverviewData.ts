import { useEffect, useMemo, useState } from "react";

import { querySnowflake } from "@/lib/snowflake";
import type { DateRange } from "@/hooks/useDateRange";

interface SalesKpiRow {
  CUR_REVENUE: string | number | null;
  PREV_REVENUE: string | number | null;
  CUR_ORDERS: string | number | null;
}

interface ScalarRow {
  VALUE: string | number | null;
}

interface LabeledValueRow {
  NAME: string;
  VALUE: string | number | null;
}

interface OrderTypeRow {
  ORDER_TYPE: string;
  REVENUE: string | number | null;
}

interface WasteCategoryRow {
  CATEGORY: string;
  WASTE_COST: string | number | null;
}

interface RatingByLocationRow {
  NAME: string;
  AVG_RATING: string | number | null;
}

export interface OverviewKpis {
  totalRevenue: number;
  revenueGrowthPct: number | null;
  revenueGrowthDirection: "up" | "down" | "flat" | null;
  avgRating: number | null;
  totalWasteCost: number;
  totalOrders: number;
}

export interface RankedLocation {
  name: string;
  value: number;
}

export interface OverviewData {
  kpis: OverviewKpis | null;
  revenueByLocation: RankedLocation[];
  wasteByLocation: RankedLocation[];
  orderTypeDistribution: { orderType: string; revenue: number }[];
  wasteCategoryDistribution: { category: string; wasteCost: number }[];
  ratingByLocation: { name: string; avgRating: number | null }[];
  topRevenueLocations: RankedLocation[];
  bottomRevenueLocations: RankedLocation[];
  topWasteLocations: RankedLocation[];
  bottomRatingLocations: { name: string; avgRating: number | null }[];
  loading: boolean;
  error: string | null;
}

function addDays(base: string, delta: number): string {
  if (!base) throw new Error("addDays received empty base");

  const [year, month, day] = base.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid base date passed to addDays: ${base}`);
  }

  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);

  if (isNaN(d.getTime())) {
    throw new Error(`Date overflow from base ${base} with delta ${delta}`);
  }

  return d.toISOString().slice(0, 10);
}

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function useOverviewData(range: DateRange | null): OverviewData {
  const [state, setState] = useState<Omit<OverviewData, "loading" | "error">>({
    kpis: null,
    revenueByLocation: [],
    wasteByLocation: [],
    orderTypeDistribution: [],
    wasteCategoryDistribution: [],
    ratingByLocation: [],
    topRevenueLocations: [],
    bottomRevenueLocations: [],
    topWasteLocations: [],
    bottomRatingLocations: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!range) return;

    const { startDate, endDate, days } = range;
    const prevEnd = addDays(startDate, -1);
    const prevStart = addDays(prevEnd, -(days - 1));

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [
          salesRows,
          ratingRows,
          wasteRows,
          revenueByLocationRows,
          wasteByLocationRows,
          orderTypeRows,
          wasteCategoryRows,
          ratingByLocationRows,
        ] = await Promise.all([
          querySnowflake<SalesKpiRow>(
            `
SELECT
  SUM(CASE WHEN SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}' THEN REVENUE ELSE 0 END) AS CUR_REVENUE,
  SUM(CASE WHEN SALE_DATE >= DATE '${prevStart}' AND SALE_DATE <= DATE '${prevEnd}' THEN REVENUE ELSE 0 END) AS PREV_REVENUE,
  SUM(CASE WHEN SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}' THEN NUM_ORDERS ELSE 0 END) AS CUR_ORDERS
FROM DAILY_SALES
`.trim()
          ),
          querySnowflake<ScalarRow>(
            `
SELECT AVG(RATING) AS VALUE
FROM CUSTOMER_REVIEWS
WHERE REVIEW_DATE >= DATE '${startDate}' AND REVIEW_DATE <= DATE '${endDate}'
`.trim()
          ),
          querySnowflake<ScalarRow>(
            `
SELECT SUM(WASTE_COST) AS VALUE
FROM INVENTORY
WHERE RECORD_DATE >= DATE '${startDate}' AND RECORD_DATE <= DATE '${endDate}'
`.trim()
          ),
          querySnowflake<LabeledValueRow>(
            `
SELECT l.NAME, SUM(s.REVENUE) AS VALUE
FROM DAILY_SALES s
JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
WHERE s.SALE_DATE >= DATE '${startDate}' AND s.SALE_DATE <= DATE '${endDate}'
GROUP BY l.NAME
ORDER BY SUM(s.REVENUE) DESC
`.trim()
          ),
          querySnowflake<LabeledValueRow>(
            `
SELECT l.NAME, SUM(i.WASTE_COST) AS VALUE
FROM INVENTORY i
JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
WHERE i.RECORD_DATE >= DATE '${startDate}' AND i.RECORD_DATE <= DATE '${endDate}'
GROUP BY l.NAME
ORDER BY SUM(i.WASTE_COST) DESC
`.trim()
          ),
          querySnowflake<OrderTypeRow>(
            `
SELECT ORDER_TYPE, SUM(REVENUE) AS REVENUE
FROM DAILY_SALES
WHERE SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}'
GROUP BY ORDER_TYPE
`.trim()
          ),
          querySnowflake<WasteCategoryRow>(
            `
SELECT CATEGORY, SUM(WASTE_COST) AS WASTE_COST
FROM INVENTORY
WHERE RECORD_DATE >= DATE '${startDate}' AND RECORD_DATE <= DATE '${endDate}'
GROUP BY CATEGORY
`.trim()
          ),
          querySnowflake<RatingByLocationRow>(
            `
SELECT l.NAME, AVG(r.RATING) AS AVG_RATING
FROM CUSTOMER_REVIEWS r
JOIN LOCATIONS l ON l.LOCATION_ID = r.LOCATION_ID
WHERE r.REVIEW_DATE >= DATE '${startDate}' AND r.REVIEW_DATE <= DATE '${endDate}'
GROUP BY l.NAME
`.trim()
          ),
        ]);

        if (cancelled) return;

        const sales = salesRows[0];
        const curRevenue = toNumber(sales?.CUR_REVENUE);
        const prevRevenue = toNumber(sales?.PREV_REVENUE);
        const curOrders = toNumber(sales?.CUR_ORDERS);

        let revenueGrowthPct: number | null = null;
        let revenueGrowthDirection: OverviewKpis["revenueGrowthDirection"] =
          null;
        if (prevRevenue > 0) {
          const diff = curRevenue - prevRevenue;
          revenueGrowthPct = (diff / prevRevenue) * 100;
          if (revenueGrowthPct > 0.1) revenueGrowthDirection = "up";
          else if (revenueGrowthPct < -0.1) revenueGrowthDirection = "down";
          else revenueGrowthDirection = "flat";
        }

        const avgRatingRow = ratingRows[0];
        const avgRatingRaw = avgRatingRow?.VALUE;
        const avgRating = avgRatingRaw == null ? null : Number(avgRatingRaw);

        const wasteRow = wasteRows[0];
        const totalWasteCost = toNumber(wasteRow?.VALUE);

        const revenueByLocation = (revenueByLocationRows ?? []).map((r) => ({
          name: r.NAME,
          value: toNumber(r.VALUE),
        }));

        const wasteByLocation = (wasteByLocationRows ?? []).map((r) => ({
          name: r.NAME,
          value: toNumber(r.VALUE),
        }));

        const orderTypeDistribution = (orderTypeRows ?? []).map((r) => ({
          orderType: r.ORDER_TYPE,
          revenue: toNumber(r.REVENUE),
        }));

        const wasteCategoryDistribution = (wasteCategoryRows ?? []).map(
          (r) => ({
            category: r.CATEGORY,
            wasteCost: toNumber(r.WASTE_COST),
          })
        );

        const ratingByLocation = (ratingByLocationRows ?? []).map((r) => ({
          name: r.NAME,
          avgRating:
            r.AVG_RATING == null || Number.isNaN(Number(r.AVG_RATING))
              ? null
              : Number(r.AVG_RATING),
        }));

        const topRevenueLocations = revenueByLocation.slice(0, 3);
        const bottomRevenueLocations = [...revenueByLocation]
          .sort((a, b) => a.value - b.value)
          .slice(0, 3);
        const topWasteLocations = wasteByLocation.slice(0, 3);
        const bottomRatingLocations = [...ratingByLocation]
          .filter((r) => r.avgRating != null)
          .sort(
            (a, b) => (a.avgRating ?? Infinity) - (b.avgRating ?? Infinity)
          )
          .slice(0, 3);

        setState({
          kpis: {
            totalRevenue: curRevenue,
            revenueGrowthPct,
            revenueGrowthDirection,
            avgRating,
            totalWasteCost,
            totalOrders: curOrders,
          },
          revenueByLocation,
          wasteByLocation,
          orderTypeDistribution,
          wasteCategoryDistribution,
          ratingByLocation,
          topRevenueLocations,
          bottomRevenueLocations,
          topWasteLocations,
          bottomRatingLocations,
        });
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load overview";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [range]);

  return useMemo(
    () => ({
      ...state,
      loading,
      error,
    }),
    [state, loading, error]
  );
}

