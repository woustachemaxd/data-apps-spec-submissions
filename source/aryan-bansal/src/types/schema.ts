/**
 * TypeScript interfaces for the Snowcone Warehouse database schema.
 *
 * Column names are UPPERCASE to match the Snowflake REST API response format.
 * The `querySnowflake` helper returns objects keyed by column name exactly
 * as Snowflake sends them.
 */

// Raw table types

export interface LocationRow {
    LOCATION_ID: string;
    NAME: string;
    CITY: string;
    STATE: string;
    ADDRESS: string;
    MANAGER_NAME: string;
    OPEN_DATE: string;
    SEATING_CAPACITY: string;
    IS_ACTIVE: string;
}

export interface DailySaleRow {
    SALE_ID: string;
    LOCATION_ID: string;
    SALE_DATE: string;
    ORDER_TYPE: "dine-in" | "takeout" | "delivery";
    REVENUE: string;
    NUM_ORDERS: string;
    AVG_ORDER_VALUE: string;
}

export interface ReviewRow {
    REVIEW_ID: string;
    LOCATION_ID: string;
    REVIEW_DATE: string;
    RATING: string;
    REVIEW_TEXT: string;
    CUSTOMER_NAME: string;
}

export interface InventoryRow {
    INVENTORY_ID: string;
    LOCATION_ID: string;
    RECORD_DATE: string;
    CATEGORY: string;
    UNITS_RECEIVED: string;
    UNITS_USED: string;
    UNITS_WASTED: string;
    WASTE_COST: string;
}

// Aggregated / query result types

/** Master Scorecard */
export interface ScorecardRow {
    LOCATION_ID: string;
    NAME: string;
    MANAGER_NAME: string;
    SEATING_CAPACITY: string;
    TOTAL_REVENUE: string;
    AVG_RATING: string;
    TOTAL_WASTE: string;
    TOTAL_ORDERS: string;
}

/** Trend data */
export interface TrendRow {
    SALE_DATE: string;
    ORDER_TYPE: "dine-in" | "takeout" | "delivery";
    DAILY_TOTAL: string;
}

/** Waste tracker */
export interface WasteByLocationRow {
    LOCATION_ID: string;
    NAME: string;
    TOTAL_WASTE_COST: string;
    TOTAL_UNITS_WASTED: string;
}

/** Waste breakdown */
export interface WasteByCategoryRow {
    LOCATION_ID: string;
    NAME: string;
    CATEGORY: string;
    WASTE_COST: string;
    UNITS_WASTED: string;
}

// Utility types

export type SortDirection = "asc" | "desc";

export interface DateRange {
    from: Date;
    to: Date;
}
