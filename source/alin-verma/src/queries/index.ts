import { querySnowflake } from "@/lib/snowflake";
import type {
  Location,
  DailySale,
  CustomerReview,
  InventoryRecord,
} from "@/types";

// Fetch all locations
export async function fetchLocations(): Promise<Location[]> {
  return querySnowflake<Location>(`
    SELECT 
      LOCATION_ID,
      NAME,
      CITY,
      STATE,
      ADDRESS,
      MANAGER_NAME,
      TO_CHAR(OPEN_DATE, 'YYYY-MM-DD') as OPEN_DATE,
      SEATING_CAPACITY,
      IS_ACTIVE
    FROM LOCATIONS 
    ORDER BY LOCATION_ID
  `);
}

// Fetch all daily sales
export async function fetchDailySales(): Promise<DailySale[]> {
  return querySnowflake<DailySale>(`
    SELECT 
      LOCATION_ID,
      TO_CHAR(SALE_DATE, 'YYYY-MM-DD') as SALE_DATE,
      ORDER_TYPE,
      REVENUE,
      NUM_ORDERS,
      AVG_ORDER_VALUE
    FROM DAILY_SALES
  `);
}

// Fetch all customer reviews
export async function fetchCustomerReviews(): Promise<CustomerReview[]> {
  return querySnowflake<CustomerReview>(`
    SELECT 
      REVIEW_ID,
      LOCATION_ID,
      TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD') as REVIEW_DATE,
      RATING,
      REVIEW_TEXT,
      CUSTOMER_NAME
    FROM CUSTOMER_REVIEWS
  `);
}

// Fetch all inventory records
export async function fetchInventory(): Promise<InventoryRecord[]> {
  return querySnowflake<InventoryRecord>(`
    SELECT 
      INVENTORY_ID,
      LOCATION_ID,
      TO_CHAR(RECORD_DATE, 'YYYY-MM-DD') as RECORD_DATE,
      CATEGORY,
      UNITS_RECEIVED,
      UNITS_USED,
      UNITS_WASTED,
      WASTE_COST
    FROM INVENTORY
  `);
}

// Fetch all data in parallel
export async function fetchAllData() {
  const [locations, sales, reviews, inventory] = await Promise.all([
    fetchLocations(),
    fetchDailySales(),
    fetchCustomerReviews(),
    fetchInventory(),
  ]);

  return { locations, sales, reviews, inventory };
}

// Query builders for specific needs
export const queries = {
  // Get sales for a specific location
  salesByLocation: (locationId: number) => `
    SELECT * FROM DAILY_SALES 
    WHERE LOCATION_ID = ${locationId}
    ORDER BY SALE_DATE
  `,

  // Get reviews for a specific location
  reviewsByLocation: (locationId: number) => `
    SELECT * FROM CUSTOMER_REVIEWS 
    WHERE LOCATION_ID = ${locationId}
    ORDER BY REVIEW_DATE DESC
  `,

  // Get inventory for a specific location
  inventoryByLocation: (locationId: number) => `
    SELECT * FROM INVENTORY 
    WHERE LOCATION_ID = ${locationId}
    ORDER BY RECORD_DATE
  `,

  // Get sales within date range
  salesByDateRange: (startDate: string, endDate: string) => `
    SELECT * FROM DAILY_SALES 
    WHERE SALE_DATE >= '${startDate}' 
    AND SALE_DATE <= '${endDate}'
    ORDER BY SALE_DATE
  `,

  // Get revenue summary by location
  revenueByLocation: `
    SELECT 
      l.LOCATION_ID,
      l.NAME,
      l.CITY,
      SUM(s.REVENUE) as TOTAL_REVENUE,
      COUNT(s.SALE_ID) as TOTAL_ORDERS
    FROM LOCATIONS l
    JOIN DAILY_SALES s ON l.LOCATION_ID = s.LOCATION_ID
    GROUP BY l.LOCATION_ID, l.NAME, l.CITY
    ORDER BY TOTAL_REVENUE DESC
  `,

  // Get average rating by location
  avgRatingByLocation: `
    SELECT 
      l.LOCATION_ID,
      l.NAME,
      AVG(r.RATING) as AVG_RATING,
      COUNT(r.REVIEW_ID) as REVIEW_COUNT
    FROM LOCATIONS l
    LEFT JOIN CUSTOMER_REVIEWS r ON l.LOCATION_ID = r.LOCATION_ID
    GROUP BY l.LOCATION_ID, l.NAME
    ORDER BY AVG_RATING DESC
  `,

  // Get waste summary by location
  wasteByLocation: `
    SELECT 
      l.LOCATION_ID,
      l.NAME,
      SUM(i.UNITS_WASTED) as TOTAL_WASTE,
      SUM(i.UNITS_RECEIVED) as TOTAL_RECEIVED,
      SUM(i.WASTE_COST) as TOTAL_WASTE_COST,
      (SUM(i.UNITS_WASTED) / NULLIF(SUM(i.UNITS_RECEIVED), 0)) * 100 as WASTE_RATE
    FROM LOCATIONS l
    JOIN INVENTORY i ON l.LOCATION_ID = i.LOCATION_ID
    GROUP BY l.LOCATION_ID, l.NAME
    ORDER BY WASTE_RATE DESC
  `,

  // Get waste by category
  wasteByCategory: `
    SELECT 
      CATEGORY,
      SUM(UNITS_WASTED) as TOTAL_WASTED,
      SUM(WASTE_COST) as TOTAL_COST
    FROM INVENTORY
    GROUP BY CATEGORY
    ORDER BY TOTAL_WASTED DESC
  `,
};