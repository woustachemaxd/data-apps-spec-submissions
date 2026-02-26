import { useMemo } from "react";
import { useSnowflakeQuery } from "./useSnowflake";
import { useFilters } from "@/contexts/FilterContext";

export interface ScorecardRow {
    locationId: number;
    name: string;
    city: string;
    state: string;
    totalRevenue: number;
    totalOrders: number;
    avgRating: number;
    reviewCount: number;
    recentRev: number;
    priorRev: number;
    totalWasteCost: number;
    wastePct: number;
    trendPct: number;
    status: "healthy" | "warning" | "critical";
}

function getMidDate(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const mid = new Date(s.getTime() + (e.getTime() - s.getTime()) / 2);
    return mid.toISOString().split("T")[0];
}

function getStatus(
    avgRating: number,
    trendPct: number,
    wastePct: number
): "healthy" | "warning" | "critical" {
    if (avgRating < 3.0 || trendPct < -15 || wastePct > 18) return "critical";
    if (avgRating < 3.5 || trendPct < -5 || wastePct > 12) return "warning";
    return "healthy";
}

export function useScorecard() {
    const { startDate, endDate } = useFilters();
    const midDate = useMemo(
        () => getMidDate(startDate, endDate),
        [startDate, endDate]
    );

    const sql = useMemo(
        () => `
    WITH revenue AS (
      SELECT LOCATION_ID,
        ROUND(SUM(REVENUE), 0) AS TOTAL_REVENUE,
        SUM(NUM_ORDERS) AS TOTAL_ORDERS
      FROM DAILY_SALES
      WHERE SALE_DATE BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY LOCATION_ID
    ),
    ratings AS (
      SELECT LOCATION_ID,
        ROUND(AVG(RATING), 1) AS AVG_RATING,
        COUNT(*) AS REVIEW_COUNT
      FROM CUSTOMER_REVIEWS
      WHERE REVIEW_DATE BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY LOCATION_ID
    ),
    trend AS (
      SELECT LOCATION_ID,
        ROUND(SUM(CASE WHEN SALE_DATE >= '${midDate}' THEN REVENUE ELSE 0 END), 0) AS RECENT_REV,
        ROUND(SUM(CASE WHEN SALE_DATE < '${midDate}' THEN REVENUE ELSE 0 END), 0) AS PRIOR_REV
      FROM DAILY_SALES
      WHERE SALE_DATE BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY LOCATION_ID
    ),
    waste AS (
      SELECT LOCATION_ID,
        ROUND(SUM(WASTE_COST), 2) AS TOTAL_WASTE_COST,
        ROUND(100.0 * SUM(UNITS_WASTED) / NULLIF(SUM(UNITS_RECEIVED), 0), 1) AS WASTE_PCT
      FROM INVENTORY
      WHERE RECORD_DATE BETWEEN '${startDate}' AND '${endDate}'
      GROUP BY LOCATION_ID
    )
    SELECT l.LOCATION_ID, l.NAME, l.CITY, l.STATE,
      COALESCE(rev.TOTAL_REVENUE, 0) AS TOTAL_REVENUE,
      COALESCE(rev.TOTAL_ORDERS, 0) AS TOTAL_ORDERS,
      COALESCE(rat.AVG_RATING, 0) AS AVG_RATING,
      COALESCE(rat.REVIEW_COUNT, 0) AS REVIEW_COUNT,
      COALESCE(t.RECENT_REV, 0) AS RECENT_REV,
      COALESCE(t.PRIOR_REV, 0) AS PRIOR_REV,
      COALESCE(w.TOTAL_WASTE_COST, 0) AS TOTAL_WASTE_COST,
      COALESCE(w.WASTE_PCT, 0) AS WASTE_PCT
    FROM LOCATIONS l
    LEFT JOIN revenue rev ON l.LOCATION_ID = rev.LOCATION_ID
    LEFT JOIN ratings rat ON l.LOCATION_ID = rat.LOCATION_ID
    LEFT JOIN trend t ON l.LOCATION_ID = t.LOCATION_ID
    LEFT JOIN waste w ON l.LOCATION_ID = w.LOCATION_ID
    ORDER BY l.LOCATION_ID`,
        [startDate, endDate, midDate]
    );

    const { data: raw, loading, error } = useSnowflakeQuery<Record<string, string>>(sql);

    const data: ScorecardRow[] = useMemo(
        () =>
            raw.map((r) => {
                const recentRev = Number(r.RECENT_REV);
                const priorRev = Number(r.PRIOR_REV);
                const trendPct =
                    priorRev > 0
                        ? Math.round(((recentRev - priorRev) / priorRev) * 100)
                        : 0;
                const avgRating = Number(r.AVG_RATING);
                const wastePct = Number(r.WASTE_PCT);

                return {
                    locationId: Number(r.LOCATION_ID),
                    name: String(r.NAME),
                    city: String(r.CITY),
                    state: String(r.STATE),
                    totalRevenue: Number(r.TOTAL_REVENUE),
                    totalOrders: Number(r.TOTAL_ORDERS),
                    avgRating,
                    reviewCount: Number(r.REVIEW_COUNT),
                    recentRev,
                    priorRev,
                    totalWasteCost: Number(r.TOTAL_WASTE_COST),
                    wastePct,
                    trendPct,
                    status: getStatus(avgRating, trendPct, wastePct),
                };
            }),
        [raw]
    );

    return { data, loading, error };
}
