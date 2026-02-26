// Database Types
export interface Location {
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

export interface DailySale {
  LOCATION_ID: number;
  SALE_DATE: string;
  ORDER_TYPE: string;
  REVENUE: number;
  NUM_ORDERS: number;
  AVG_ORDER_VALUE: number;
}

export interface CustomerReview {
  REVIEW_ID: number;
  LOCATION_ID: number;
  REVIEW_DATE: string;
  RATING: number;
  REVIEW_TEXT: string;
  CUSTOMER_NAME: string;
}

export interface InventoryRecord {
  INVENTORY_ID: number;
  LOCATION_ID: number;
  RECORD_DATE: string;
  CATEGORY: string;
  UNITS_RECEIVED: number;
  UNITS_USED: number;
  UNITS_WASTED: number;
  WASTE_COST: number;
}

// Derived Types
export interface LocationScore {
  location: Location;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  trend: "improving" | "declining" | "stable";
  trendPercent: number;
  needsAttention: boolean;
  attentionReasons: string[];
}

export interface WasteByLocation extends LocationScore {
  totalWaste: number;
  wasteCost: number;
  wasteRate: number;
  wasteTrend: "improving" | "worsening" | "stable";
  aboveThreshold: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SummaryStats {
  totalRevenue: number;
  avgRating: number;
  totalWasteCost: number;
  locationsNeedingAttention: number;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TrendDataPoint {
  date: string;
  revenue: number;
}

export interface WasteCategoryData {
  category: string;
  wasted: number;
  cost: number;
}

export interface InventorySummaryItem {
  category: string;
  received: number;
  used: number;
  wasted: number;
  cost: number;
  wasteRate: number;
}

// Constants
export const WASTE_THRESHOLD = 0.10; // 10% waste threshold