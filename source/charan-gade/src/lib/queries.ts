/**
 * All SQL queries for Snowcone Warehouse Dashboard
 * Uses querySnowflake() from ./snowflake.ts
 */

import { querySnowflake } from "./snowflake";

// ── Location Scorecard Data ──────────────────────────────────

export interface LocationScoreboard {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  TOTAL_REVENUE: number;
  AVG_RATING: number;
  REVIEWS_COUNT: number;
  LAST_SALE_DATE: string;
  REVENUE_TREND: string; // "improving" | "declining" | "stable"
}

export async function getLocationScorecard(): Promise<LocationScoreboard[]> {
  const query = `
    WITH last_sale AS (
      SELECT LOCATION_ID, MAX(SALE_DATE) AS LAST_SALE_DATE
      FROM DAILY_SALES
      GROUP BY LOCATION_ID
    ),
    sales_agg AS (
      SELECT
        s.LOCATION_ID,
        SUM(s.REVENUE) AS TOTAL_REVENUE,
        SUM(CASE WHEN s.SALE_DATE >= DATEADD(day, -30, COALESCE(ls.LAST_SALE_DATE, s.SALE_DATE)) THEN s.REVENUE ELSE 0 END) AS REV_LAST_30,
        SUM(CASE WHEN s.SALE_DATE < DATEADD(day, -30, COALESCE(ls.LAST_SALE_DATE, s.SALE_DATE)) AND s.SALE_DATE >= DATEADD(day, -60, COALESCE(ls.LAST_SALE_DATE, s.SALE_DATE)) THEN s.REVENUE ELSE 0 END) AS REV_PREV_30,
        MAX(s.SALE_DATE) AS LAST_SALE_DATE
      FROM DAILY_SALES s
      LEFT JOIN last_sale ls ON s.LOCATION_ID = ls.LOCATION_ID
      GROUP BY s.LOCATION_ID
    ),
    reviews_agg AS (
      SELECT LOCATION_ID, ROUND(AVG(RATING),2) AS AVG_RATING, COUNT(*) AS REVIEWS_COUNT
      FROM CUSTOMER_REVIEWS
      GROUP BY LOCATION_ID
    )
    SELECT
      l.LOCATION_ID,
      l.NAME,
      l.CITY,
      COALESCE(ROUND(sa.TOTAL_REVENUE,0),0) AS TOTAL_REVENUE,
      COALESCE(ra.AVG_RATING,0) AS AVG_RATING,
      COALESCE(ra.REVIEWS_COUNT,0) AS REVIEWS_COUNT,
      sa.LAST_SALE_DATE AS LAST_SALE_DATE,
      CASE
        WHEN sa.REV_LAST_30 > sa.REV_PREV_30 THEN 'improving'
        WHEN sa.REV_LAST_30 < sa.REV_PREV_30 THEN 'declining'
        ELSE 'stable'
      END AS REVENUE_TREND
    FROM LOCATIONS l
    LEFT JOIN sales_agg sa ON l.LOCATION_ID = sa.LOCATION_ID
    LEFT JOIN reviews_agg ra ON l.LOCATION_ID = ra.LOCATION_ID
    WHERE l.IS_ACTIVE = true
    ORDER BY TOTAL_REVENUE DESC
  `;
  const rows = await querySnowflake<LocationScoreboard>(query);
  return rows.map((r) => ({
    ...r,
    TOTAL_REVENUE: Number(r.TOTAL_REVENUE) || 0,
    AVG_RATING: Number(r.AVG_RATING) || 0,
    REVIEWS_COUNT: Number(r.REVIEWS_COUNT) || 0,
    LAST_SALE_DATE: r.LAST_SALE_DATE,
    REVENUE_TREND: String(r.REVENUE_TREND || "stable"),
  }));
}

// ── Historical Sales Data ────────────────────────────────────

export interface DailySalesData {
  LOCATION_ID: number;
  LOCATION_NAME: string;
  SALE_DATE: string;
  DAILY_REVENUE: number;
  NUM_ORDERS: number;
  AVG_ORDER_VALUE: number;
}

export async function getDailySalesByLocation(locationId?: number): Promise<DailySalesData[]> {
  const whereClause = locationId ? `WHERE s.LOCATION_ID = ${locationId}` : "";
  const query = `
    SELECT
      s.LOCATION_ID,
      l.NAME AS LOCATION_NAME,
      TO_CHAR(s.SALE_DATE, 'YYYY-MM-DD') AS SALE_DATE,
      ROUND(SUM(s.REVENUE), 2) AS DAILY_REVENUE,
      SUM(s.NUM_ORDERS) AS NUM_ORDERS,
      ROUND(AVG(s.AVG_ORDER_VALUE), 2) AS AVG_ORDER_VALUE
    FROM DAILY_SALES s
    JOIN LOCATIONS l ON s.LOCATION_ID = l.LOCATION_ID
    ${whereClause}
    GROUP BY s.LOCATION_ID, l.NAME, s.SALE_DATE
    ORDER BY s.SALE_DATE DESC
  `;
  const rows = await querySnowflake<DailySalesData>(query);
  return rows.map((r) => ({
    ...r,
    DAILY_REVENUE: Number(r.DAILY_REVENUE) || 0,
    NUM_ORDERS: Number(r.NUM_ORDERS) || 0,
    AVG_ORDER_VALUE: Number(r.AVG_ORDER_VALUE) || 0,
  }));
}

export interface OrderTypeBreakdown {
  ORDER_TYPE: string;
  LOCATION_ID: number;
  LOCATION_NAME: string;
  TOTAL_REVENUE: number;
  TOTAL_ORDERS: number;
}

export async function getSalesBreakdownByOrderType(locationId?: number): Promise<OrderTypeBreakdown[]> {
  const whereClause = locationId ? `WHERE s.LOCATION_ID = ${locationId}` : "";
  const query = `
    SELECT
      s.ORDER_TYPE,
      s.LOCATION_ID,
      l.NAME AS LOCATION_NAME,
      ROUND(SUM(s.REVENUE), 2) AS TOTAL_REVENUE,
      SUM(s.NUM_ORDERS) AS TOTAL_ORDERS
    FROM DAILY_SALES s
    JOIN LOCATIONS l ON s.LOCATION_ID = l.LOCATION_ID
    ${whereClause}
    GROUP BY s.ORDER_TYPE, s.LOCATION_ID, l.NAME
    ORDER BY TOTAL_REVENUE DESC
  `;
  const rows = await querySnowflake<OrderTypeBreakdown>(query);
  return rows.map((r) => ({
    ...r,
    TOTAL_REVENUE: Number(r.TOTAL_REVENUE) || 0,
    TOTAL_ORDERS: Number(r.TOTAL_ORDERS) || 0,
  }));
}

export interface SalesTimeSeriesData {
  SALE_DATE: string;
  DINE_IN: number;
  TAKEOUT: number;
  DELIVERY: number;
  TOTAL: number;
}

export async function getSalesTimeSeries(locationId: number): Promise<SalesTimeSeriesData[]> {
  const query = `
    SELECT
      TO_CHAR(s.SALE_DATE, 'YYYY-MM-DD') AS SALE_DATE,
      ROUND(SUM(CASE WHEN s.ORDER_TYPE = 'dine-in' THEN s.REVENUE ELSE 0 END), 2) AS DINE_IN,
      ROUND(SUM(CASE WHEN s.ORDER_TYPE = 'takeout' THEN s.REVENUE ELSE 0 END), 2) AS TAKEOUT,
      ROUND(SUM(CASE WHEN s.ORDER_TYPE = 'delivery' THEN s.REVENUE ELSE 0 END), 2) AS DELIVERY,
      ROUND(SUM(s.REVENUE), 2) AS TOTAL
    FROM DAILY_SALES s
    WHERE s.LOCATION_ID = ${locationId}
    GROUP BY s.SALE_DATE
    ORDER BY s.SALE_DATE
  `;
  const rows = await querySnowflake<SalesTimeSeriesData>(query);
  return rows.map((r) => ({
    ...r,
    DINE_IN: Number(r.DINE_IN) || 0,
    TAKEOUT: Number(r.TAKEOUT) || 0,
    DELIVERY: Number(r.DELIVERY) || 0,
    TOTAL: Number(r.TOTAL) || 0,
  }));
}

// ── Inventory Waste Data ────────────────────────────────────

export interface WasteData {
  LOCATION_ID: number;
  LOCATION_NAME: string;
  CATEGORY: string;
  TOTAL_WASTE_UNITS: number;
  TOTAL_WASTE_COST: number;
  AVG_WASTE_COST_PER_WEEK: number;
  WEEKS_OF_DATA: number;
}

const WASTE_THRESHOLD = 500; // dollars

export async function getInventoryWaste(): Promise<WasteData[]> {
  const query = `
    SELECT
      i.LOCATION_ID,
      l.NAME AS LOCATION_NAME,
      i.CATEGORY,
      SUM(i.UNITS_WASTED) AS TOTAL_WASTE_UNITS,
      ROUND(SUM(i.WASTE_COST), 2) AS TOTAL_WASTE_COST,
      ROUND(AVG(i.WASTE_COST), 2) AS AVG_WASTE_COST_PER_WEEK,
      COUNT(DISTINCT i.RECORD_DATE) AS WEEKS_OF_DATA
    FROM INVENTORY i
    JOIN LOCATIONS l ON i.LOCATION_ID = l.LOCATION_ID
    GROUP BY i.LOCATION_ID, l.NAME, i.CATEGORY
    ORDER BY TOTAL_WASTE_COST DESC
  `;
  const rows = await querySnowflake<WasteData>(query);
  return rows.map((r) => ({
    ...r,
    TOTAL_WASTE_UNITS: Number(r.TOTAL_WASTE_UNITS) || 0,
    TOTAL_WASTE_COST: Number(r.TOTAL_WASTE_COST) || 0,
    AVG_WASTE_COST_PER_WEEK: Number(r.AVG_WASTE_COST_PER_WEEK) || 0,
    WEEKS_OF_DATA: Number(r.WEEKS_OF_DATA) || 0,
  }));
}

export interface LocationWasteSummary {
  LOCATION_ID: number;
  LOCATION_NAME: string;
  CITY: string;
  TOTAL_WASTE_COST: number;
  WASTE_ABOVE_THRESHOLD: boolean;
  TOTAL_WASTE_UNITS: number;
  CATEGORY_COUNT: number;
  RECENT_TREND: string; // "improving" | "declining" | "stable"
}

// UPDATED LOGIC: Accurately checks 1W vs 1W, and checks threshold against last 1 week
export async function getLocationWasteSummary(): Promise<LocationWasteSummary[]> {
  const query = `
    WITH last_record AS (
      SELECT LOCATION_ID, MAX(RECORD_DATE) AS LAST_RECORD_DATE
      FROM INVENTORY
      GROUP BY LOCATION_ID
    ),
    inv_agg AS (
      SELECT
        i.LOCATION_ID,
        SUM(i.UNITS_WASTED) AS TOTAL_WASTE_UNITS,
        ROUND(SUM(i.WASTE_COST),2) AS TOTAL_WASTE_COST,
        ROUND(AVG(i.WASTE_COST),2) AS AVG_WASTE_COST_PER_WEEK,
        COUNT(DISTINCT i.CATEGORY) AS CATEGORY_COUNT,
        SUM(CASE WHEN i.RECORD_DATE >= DATEADD(day, -7, COALESCE(lr.LAST_RECORD_DATE, i.RECORD_DATE)) THEN i.WASTE_COST ELSE 0 END) AS COST_LAST_1W,
        SUM(CASE WHEN i.RECORD_DATE >= DATEADD(day, -14, COALESCE(lr.LAST_RECORD_DATE, i.RECORD_DATE)) AND i.RECORD_DATE < DATEADD(day, -7, COALESCE(lr.LAST_RECORD_DATE, i.RECORD_DATE)) THEN i.WASTE_COST ELSE 0 END) AS COST_PREV_1W
      FROM INVENTORY i
      LEFT JOIN last_record lr ON i.LOCATION_ID = lr.LOCATION_ID
      GROUP BY i.LOCATION_ID
    )
    SELECT
      ia.LOCATION_ID,
      l.NAME AS LOCATION_NAME,
      l.CITY,
      ia.TOTAL_WASTE_COST,
      CASE WHEN ia.COST_LAST_1W > ${WASTE_THRESHOLD} THEN true ELSE false END AS WASTE_ABOVE_THRESHOLD,
      ia.TOTAL_WASTE_UNITS,
      ia.CATEGORY_COUNT,
      CASE
        WHEN ia.COST_LAST_1W < ia.COST_PREV_1W THEN 'improving'
        WHEN ia.COST_LAST_1W > ia.COST_PREV_1W THEN 'declining'
        ELSE 'stable'
      END AS RECENT_TREND
    FROM inv_agg ia
    JOIN LOCATIONS l ON ia.LOCATION_ID = l.LOCATION_ID
    ORDER BY ia.TOTAL_WASTE_COST DESC
  `;
  const rows = await querySnowflake<LocationWasteSummary>(query);
  return rows.map((r) => ({
    ...r,
    TOTAL_WASTE_COST: Number(r.TOTAL_WASTE_COST) || 0,
    WASTE_ABOVE_THRESHOLD: Boolean(r.WASTE_ABOVE_THRESHOLD),
    TOTAL_WASTE_UNITS: Number(r.TOTAL_WASTE_UNITS) || 0,
    CATEGORY_COUNT: Number(r.CATEGORY_COUNT) || 0,
    RECENT_TREND: String(r.RECENT_TREND || "stable"),
  }));
}

// ── Location Detail Data ────────────────────────────────────

export interface LocationDetail {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  ADDRESS: string;
  MANAGER_NAME: string;
  OPEN_DATE: string;
  SEATING_CAPACITY: number;
  IS_ACTIVE: boolean;
}

export async function getLocationDetail(locationId: number): Promise<LocationDetail | null> {
  const query = `
    SELECT
      LOCATION_ID,
      NAME,
      CITY,
      STATE,
      ADDRESS,
      MANAGER_NAME,
      OPEN_DATE,
      SEATING_CAPACITY,
      IS_ACTIVE
    FROM LOCATIONS
    WHERE LOCATION_ID = ${locationId}
  `;
  const result = await querySnowflake<LocationDetail>(query);
  return result.length > 0 ? result[0] : null;
}

export interface LocationReview {
  REVIEW_ID: number;
  CUSTOMER_NAME: string;
  RATING: number;
  REVIEW_TEXT: string;
  REVIEW_DATE: string;
}

export async function getLocationReviews(locationId: number, limit: number = 10): Promise<LocationReview[]> {
  const query = `
    SELECT
      REVIEW_ID,
      CUSTOMER_NAME,
      RATING,
      REVIEW_TEXT,
      REVIEW_DATE
    FROM CUSTOMER_REVIEWS
    WHERE LOCATION_ID = ${locationId}
    ORDER BY REVIEW_DATE DESC
    LIMIT ${limit}
  `;
  const rows = await querySnowflake<LocationReview>(query);
  return rows.map((r) => ({
    ...r,
    RATING: Number(r.RATING) || 0,
  }));
}

export interface LocationInventorySummary {
  CATEGORY: string;
  TOTAL_UNITS_RECEIVED: number;
  TOTAL_UNITS_USED: number;
  TOTAL_UNITS_WASTED: number;
  WASTE_COST_TOTAL: number;
  WASTE_PERCENTAGE: number;
}

export async function getLocationInventorySummary(locationId: number): Promise<LocationInventorySummary[]> {
  const query = `
    SELECT
      CATEGORY,
      SUM(UNITS_RECEIVED) AS TOTAL_UNITS_RECEIVED,
      SUM(UNITS_USED) AS TOTAL_UNITS_USED,
      SUM(UNITS_WASTED) AS TOTAL_UNITS_WASTED,
      ROUND(SUM(WASTE_COST), 2) AS WASTE_COST_TOTAL,
      ROUND(100.0 * SUM(UNITS_WASTED) / NULLIF(SUM(UNITS_RECEIVED), 0), 2) AS WASTE_PERCENTAGE
    FROM INVENTORY
    WHERE LOCATION_ID = ${locationId}
    GROUP BY CATEGORY
    ORDER BY WASTE_COST_TOTAL DESC
  `;
  const rows = await querySnowflake<LocationInventorySummary>(query);
  return rows.map((r) => ({
    ...r,
    TOTAL_UNITS_RECEIVED: Number(r.TOTAL_UNITS_RECEIVED) || 0,
    TOTAL_UNITS_USED: Number(r.TOTAL_UNITS_USED) || 0,
    TOTAL_UNITS_WASTED: Number(r.TOTAL_UNITS_WASTED) || 0,
    WASTE_COST_TOTAL: Number(r.WASTE_COST_TOTAL) || 0,
    WASTE_PERCENTAGE: Number(r.WASTE_PERCENTAGE) || 0,
  }));
}

export async function getAllLocations(): Promise<LocationDetail[]> {
  const query = `
    SELECT
      LOCATION_ID,
      NAME,
      CITY,
      STATE,
      ADDRESS,
      MANAGER_NAME,
      OPEN_DATE,
      SEATING_CAPACITY,
      IS_ACTIVE
    FROM LOCATIONS
    WHERE IS_ACTIVE = true
    ORDER BY NAME
  `;
  return querySnowflake<LocationDetail>(query);
}