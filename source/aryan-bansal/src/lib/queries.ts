/**
 * SQL query builders for the Snowcone Warehouse dashboard.
 *
 * Each function returns a SQL string with date filters injected.
 * We use aggregation to minimise the number of round-trips to Snowflake.
 */

import { format } from "date-fns";

/** Format a JS Date to the Snowflake date literal format. */
function sf(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Master Scorecard

/**
 * Returns one row per location with aggregated revenue, avg rating,
 * total waste cost, and total orders.
 */
export function buildScorecardQuery(from: Date, to: Date): string {
  return `
SELECT
  l.LOCATION_ID,
  l.NAME,
  l.MANAGER_NAME,
  l.SEATING_CAPACITY,
  COALESCE(s.TOTAL_REVENUE, 0)  AS TOTAL_REVENUE,
  COALESCE(r.AVG_RATING, 0)     AS AVG_RATING,
  COALESCE(i.TOTAL_WASTE, 0)    AS TOTAL_WASTE,
  COALESCE(s.TOTAL_ORDERS, 0)   AS TOTAL_ORDERS
FROM LOCATIONS l
LEFT JOIN (
  SELECT LOCATION_ID,
         SUM(REVENUE)    AS TOTAL_REVENUE,
         SUM(NUM_ORDERS) AS TOTAL_ORDERS
  FROM DAILY_SALES
  WHERE SALE_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
  GROUP BY LOCATION_ID
) s ON l.LOCATION_ID = s.LOCATION_ID
LEFT JOIN (
  SELECT LOCATION_ID,
         AVG(RATING) AS AVG_RATING
  FROM CUSTOMER_REVIEWS
  WHERE REVIEW_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
  GROUP BY LOCATION_ID
) r ON l.LOCATION_ID = r.LOCATION_ID
LEFT JOIN (
  SELECT LOCATION_ID,
         SUM(WASTE_COST) AS TOTAL_WASTE
  FROM INVENTORY
  WHERE RECORD_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
  GROUP BY LOCATION_ID
) i ON l.LOCATION_ID = i.LOCATION_ID
WHERE l.IS_ACTIVE = TRUE
ORDER BY TOTAL_REVENUE DESC;
  `.trim();
}

// Trend (Chart Data)

/**
 * Daily revenue grouped by sale_date and order_type.
 * Optionally filtered to a single location.
 */
export function buildTrendQuery(
  from: Date,
  to: Date,
  locationId?: number
): string {
  const locationFilter = locationId
    ? `AND LOCATION_ID = ${locationId}`
    : "";

  return `
SELECT
  SALE_DATE,
  ORDER_TYPE,
  SUM(REVENUE) AS DAILY_TOTAL
FROM DAILY_SALES
WHERE SALE_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
${locationFilter}
GROUP BY SALE_DATE, ORDER_TYPE
ORDER BY SALE_DATE ASC;
  `.trim();
}

// Waste by Location

/**
 * Aggregated waste cost per location, optionally filtered by category.
 */
export function buildWasteByLocationQuery(
  from: Date,
  to: Date,
  category?: string
): string {
  const categoryFilter = category ? `AND i.CATEGORY = '${category}'` : "";

  return `
SELECT
  l.LOCATION_ID,
  l.NAME,
  SUM(i.WASTE_COST)    AS TOTAL_WASTE_COST,
  SUM(i.UNITS_WASTED)  AS TOTAL_UNITS_WASTED
FROM INVENTORY i
JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
WHERE i.RECORD_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
${categoryFilter}
GROUP BY l.LOCATION_ID, l.NAME
ORDER BY TOTAL_WASTE_COST DESC;
  `.trim();
}

/**
 * Waste broken down by category for a specific location.
 */
export function buildWasteByCategoryQuery(
  from: Date,
  to: Date,
  locationId: number
): string {
  return `
SELECT
  i.CATEGORY,
  SUM(i.WASTE_COST)   AS WASTE_COST,
  SUM(i.UNITS_WASTED) AS UNITS_WASTED
FROM INVENTORY i
WHERE i.LOCATION_ID = ${locationId}
  AND i.RECORD_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
GROUP BY i.CATEGORY
ORDER BY WASTE_COST DESC;
  `.trim();
}

// Reviews

/**
 * Most recent reviews for a given location.
 */
export function buildReviewsQuery(
  locationId: number,
  limit: number = 5
): string {
  return `
SELECT
  REVIEW_DATE,
  RATING,
  REVIEW_TEXT,
  CUSTOMER_NAME
FROM CUSTOMER_REVIEWS
WHERE LOCATION_ID = ${locationId}
ORDER BY REVIEW_DATE DESC
LIMIT ${limit};
  `.trim();
}

// Company-wide daily average (for comparison line)

/**
 * Company-wide average daily revenue (all locations combined then averaged).
 */
export function buildCompanyAvgQuery(from: Date, to: Date): string {
  return `
SELECT
  SALE_DATE,
  SUM(REVENUE) / COUNT(DISTINCT LOCATION_ID) AS AVG_DAILY_REVENUE
FROM DAILY_SALES
WHERE SALE_DATE BETWEEN '${sf(from)}' AND '${sf(to)}'
GROUP BY SALE_DATE
ORDER BY SALE_DATE ASC;
  `.trim();
}
