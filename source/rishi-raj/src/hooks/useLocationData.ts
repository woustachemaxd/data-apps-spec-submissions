import { useEffect, useMemo, useState } from "react";

import { querySnowflake } from "@/lib/snowflake";
import type { DateRange } from "@/hooks/useDateRange";

export interface LocationInfo {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  ADDRESS: string;
  MANAGER_NAME: string;
  OPEN_DATE: string;
  SEATING_CAPACITY: number;
}

interface SalesKpiRow {
  CUR_REVENUE: string | number | null;
  PREV_REVENUE: string | number | null;
  CUR_ORDERS: string | number | null;
}

interface ScalarRow {
  VALUE: string | number | null;
}

interface TrendRow {
  DATE: string;
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

interface ReviewRow {
  REVIEW_ID: number;
  REVIEW_DATE: string;
  RATING: string | number | null;
  REVIEW_TEXT: string | null;
  CUSTOMER_NAME: string | null;
}

interface ScorecardRow {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  CUR_REVENUE: string | number | null;
  PREV_REVENUE: string | number | null;
  AVG_RATING: string | number | null;
}

export interface LocationKpis {
  totalRevenue: number;
  revenueGrowthPct: number | null;
  revenueGrowthDirection: "up" | "down" | "flat" | null;
  avgRating: number | null;
  totalWasteCost: number;
  totalOrders: number;
}

export interface LocationData {
  locations: LocationInfo[];
  selectedLocation: LocationInfo | null;
  kpis: LocationKpis | null;
  revenueTrend: { date: string; revenue: number }[];
  orderTypeBreakdown: { orderType: string; revenue: number }[];
  wasteTrend: { date: string; wasteCost: number }[];
  wasteCategoryBreakdown: { category: string; wasteCost: number }[];
  latestReviews: {
    id: number;
    date: string;
    rating: number | null;
    customerName: string | null;
    text: string | null;
  }[];
  scorecard: {
    locationId: number;
    name: string;
    city: string;
    state: string;
    revenue: number;
    avgRating: number | null;
    revenueTrendPct: number | null;
  }[];
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

export function useLocationData(
  range: DateRange | null,
  locationId: number | null
): LocationData {
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
    null
  );
  const [kpis, setKpis] = useState<LocationKpis | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<
    { date: string; revenue: number }[]
  >([]);
  const [orderTypeBreakdown, setOrderTypeBreakdown] = useState<
    { orderType: string; revenue: number }[]
  >([]);
  const [wasteTrend, setWasteTrend] = useState<
    { date: string; wasteCost: number }[]
  >([]);
  const [wasteCategoryBreakdown, setWasteCategoryBreakdown] = useState<
    { category: string; wasteCost: number }[]
  >([]);
  const [latestReviews, setLatestReviews] = useState<
    {
      id: number;
      date: string;
      rating: number | null;
      customerName: string | null;
      text: string | null;
    }[]
  >([]);
  const [scorecard, setScorecard] = useState<
    {
      locationId: number;
      name: string;
      city: string;
      state: string;
      revenue: number;
      avgRating: number | null;
      revenueTrendPct: number | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocations() {
      try {
        const rows = await querySnowflake<LocationInfo>(
          `
SELECT
  LOCATION_ID,
  NAME,
  CITY,
  STATE,
  ADDRESS,
  MANAGER_NAME,
  OPEN_DATE,
  SEATING_CAPACITY
FROM LOCATIONS
WHERE IS_ACTIVE = TRUE
ORDER BY NAME
`.trim()
        );
        if (cancelled) return;
        setLocations(rows);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load locations"
          );
        }
      }
    }

    fetchLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locations.length || locationId == null) {
      setSelectedLocation(null);
      return;
    }
    const loc = locations.find((l) => l.LOCATION_ID === locationId) ?? null;
    setSelectedLocation(loc);
  }, [locations, locationId]);

  useEffect(() => {
    if (!range || locationId == null) return;

    const { startDate, endDate, days } = range;
    const prevEnd = addDays(startDate, -1);
    const prevStart = addDays(prevEnd, -(days - 1));

    let cancelled = false;

    async function fetchLocationData() {
      setLoading(true);
      setError(null);

      try {
        const [
          salesRows,
          ratingRows,
          wasteRows,
          revenueTrendRows,
          orderTypeRows,
          wasteTrendRows,
          wasteCategoryRows,
          reviewRows,
          scorecardRows,
        ] = await Promise.all([
          querySnowflake<SalesKpiRow>(
            `
SELECT
  SUM(CASE WHEN SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}' THEN REVENUE ELSE 0 END) AS CUR_REVENUE,
  SUM(CASE WHEN SALE_DATE >= DATE '${prevStart}' AND SALE_DATE <= DATE '${prevEnd}' THEN REVENUE ELSE 0 END) AS PREV_REVENUE,
  SUM(CASE WHEN SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}' THEN NUM_ORDERS ELSE 0 END) AS CUR_ORDERS
FROM DAILY_SALES
WHERE LOCATION_ID = ${locationId}
`.trim()
          ),
          querySnowflake<ScalarRow>(
            `
SELECT AVG(RATING) AS VALUE
FROM CUSTOMER_REVIEWS
WHERE LOCATION_ID = ${locationId}
  AND REVIEW_DATE >= DATE '${startDate}' AND REVIEW_DATE <= DATE '${endDate}'
`.trim()
          ),
          querySnowflake<ScalarRow>(
            `
SELECT SUM(WASTE_COST) AS VALUE
FROM INVENTORY
WHERE LOCATION_ID = ${locationId}
  AND RECORD_DATE >= DATE '${startDate}' AND RECORD_DATE <= DATE '${endDate}'
`.trim()
          ),
          querySnowflake<TrendRow>(
            `
SELECT SALE_DATE AS DATE, SUM(REVENUE) AS VALUE
FROM DAILY_SALES
WHERE LOCATION_ID = ${locationId}
  AND SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}'
GROUP BY SALE_DATE
ORDER BY SALE_DATE
`.trim()
          ),
          querySnowflake<OrderTypeRow>(
            `
SELECT ORDER_TYPE, SUM(REVENUE) AS REVENUE
FROM DAILY_SALES
WHERE LOCATION_ID = ${locationId}
  AND SALE_DATE >= DATE '${startDate}' AND SALE_DATE <= DATE '${endDate}'
GROUP BY ORDER_TYPE
`.trim()
          ),
          querySnowflake<TrendRow>(
            `
SELECT RECORD_DATE AS DATE, SUM(WASTE_COST) AS VALUE
FROM INVENTORY
WHERE LOCATION_ID = ${locationId}
  AND RECORD_DATE >= DATE '${startDate}' AND RECORD_DATE <= DATE '${endDate}'
GROUP BY RECORD_DATE
ORDER BY RECORD_DATE
`.trim()
          ),
          querySnowflake<WasteCategoryRow>(
            `
SELECT CATEGORY, SUM(WASTE_COST) AS WASTE_COST
FROM INVENTORY
WHERE LOCATION_ID = ${locationId}
  AND RECORD_DATE >= DATE '${startDate}' AND RECORD_DATE <= DATE '${endDate}'
GROUP BY CATEGORY
`.trim()
          ),
          querySnowflake<ReviewRow>(
            `
SELECT REVIEW_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME
FROM CUSTOMER_REVIEWS
WHERE LOCATION_ID = ${locationId}
  AND REVIEW_DATE >= DATE '${startDate}' AND REVIEW_DATE <= DATE '${endDate}'
ORDER BY REVIEW_DATE DESC
LIMIT 10
`.trim()
          ),
          querySnowflake<ScorecardRow>(
            `
SELECT
  l.LOCATION_ID,
  l.NAME,
  l.CITY,
  l.STATE,
  SUM(CASE WHEN s.SALE_DATE >= DATE '${startDate}' AND s.SALE_DATE <= DATE '${endDate}' THEN s.REVENUE ELSE 0 END) AS CUR_REVENUE,
  SUM(CASE WHEN s.SALE_DATE >= DATE '${prevStart}' AND s.SALE_DATE <= DATE '${prevEnd}' THEN s.REVENUE ELSE 0 END) AS PREV_REVENUE,
  AVG(CASE WHEN r.REVIEW_DATE >= DATE '${startDate}' AND r.REVIEW_DATE <= DATE '${endDate}' THEN r.RATING ELSE NULL END) AS AVG_RATING
FROM LOCATIONS l
LEFT JOIN DAILY_SALES s ON s.LOCATION_ID = l.LOCATION_ID
LEFT JOIN CUSTOMER_REVIEWS r ON r.LOCATION_ID = l.LOCATION_ID
WHERE l.IS_ACTIVE = TRUE
GROUP BY l.LOCATION_ID, l.NAME, l.CITY, l.STATE
ORDER BY CUR_REVENUE DESC
`.trim()
          ),
        ]);

        if (cancelled) return;

        const sales = salesRows[0];
        const curRevenue = toNumber(sales?.CUR_REVENUE);
        const prevRevenue = toNumber(sales?.PREV_REVENUE);
        const curOrders = toNumber(sales?.CUR_ORDERS);

        let revenueGrowthPct: number | null = null;
        let revenueGrowthDirection: LocationKpis["revenueGrowthDirection"] =
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

        setKpis({
          totalRevenue: curRevenue,
          revenueGrowthPct,
          revenueGrowthDirection,
          avgRating,
          totalWasteCost,
          totalOrders: curOrders,
        });

        setRevenueTrend(
          (revenueTrendRows ?? []).map((r) => ({
            date: r.DATE,
            revenue: toNumber(r.VALUE),
          }))
        );

        setOrderTypeBreakdown(
          (orderTypeRows ?? []).map((r) => ({
            orderType: r.ORDER_TYPE,
            revenue: toNumber(r.REVENUE),
          }))
        );

        setWasteTrend(
          (wasteTrendRows ?? []).map((r) => ({
            date: r.DATE,
            wasteCost: toNumber(r.VALUE),
          }))
        );

        setWasteCategoryBreakdown(
          (wasteCategoryRows ?? []).map((r) => ({
            category: r.CATEGORY,
            wasteCost: toNumber(r.WASTE_COST),
          }))
        );

        setLatestReviews(
          (reviewRows ?? []).map((r) => ({
            id: r.REVIEW_ID,
            date: r.REVIEW_DATE,
            rating:
              r.RATING == null || Number.isNaN(Number(r.RATING))
                ? null
                : Number(r.RATING),
            customerName: r.CUSTOMER_NAME,
            text: r.REVIEW_TEXT,
          }))
        );

        setScorecard(
          (scorecardRows ?? []).map((row) => {
            const cur = toNumber(row.CUR_REVENUE);
            const prev = toNumber(row.PREV_REVENUE);
            let trend: number | null = null;
            if (prev > 0) {
              trend = ((cur - prev) / prev) * 100;
            }
            const avg =
              row.AVG_RATING == null || Number.isNaN(Number(row.AVG_RATING))
                ? null
                : Number(row.AVG_RATING);
            return {
              locationId: row.LOCATION_ID,
              name: row.NAME,
              city: row.CITY,
              state: row.STATE,
              revenue: cur,
              avgRating: avg,
              revenueTrendPct: trend,
            };
          })
        );
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Failed to load location details";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLocationData();

    return () => {
      cancelled = true;
    };
  }, [range, locationId]);

  return useMemo(
    () => ({
      locations,
      selectedLocation,
      kpis,
      revenueTrend,
      orderTypeBreakdown,
      wasteTrend,
      wasteCategoryBreakdown,
      latestReviews,
      scorecard,
      loading,
      error,
    }),
    [
      locations,
      selectedLocation,
      kpis,
      revenueTrend,
      orderTypeBreakdown,
      wasteTrend,
      wasteCategoryBreakdown,
      latestReviews,
      scorecard,
      loading,
      error,
    ]
  );
}

