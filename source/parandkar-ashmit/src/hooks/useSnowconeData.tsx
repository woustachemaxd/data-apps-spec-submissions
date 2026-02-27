import { useEffect, useMemo, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";

function normalizeSnowflakeDate(value: unknown): string {
  // Snowflake SQL REST API can return DATEs as:
  // - ISO strings: "2025-12-31"
  // - day counts since epoch: 20424 (or "20424")
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d+$/.test(trimmed)) {
      const days = Number(trimmed);
      const ms = Date.UTC(1970, 0, 1) + days * 24 * 60 * 60 * 1000;
      return new Date(ms).toISOString().slice(0, 10);
    }
    return trimmed;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = Date.UTC(1970, 0, 1) + value * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  return "";
}

export type Location = {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  ADDRESS: string;
  MANAGER_NAME: string;
  OPEN_DATE: string;
  SEATING_CAPACITY: number;
  IS_ACTIVE: boolean;
};

export type DailySale = {
  LOCATION_ID: number;
  SALE_DATE: string;
  ORDER_TYPE: "dine-in" | "takeout" | "delivery";
  REVENUE: number;
  NUM_ORDERS: number;
  AVG_ORDER_VALUE: number;
};

export type CustomerReview = {
  REVIEW_ID: number;
  LOCATION_ID: number;
  REVIEW_DATE: string;
  RATING: number;
  REVIEW_TEXT: string;
  CUSTOMER_NAME: string;
};

export type InventoryRecord = {
  INVENTORY_ID: number;
  LOCATION_ID: number;
  RECORD_DATE: string;
  CATEGORY: "dairy" | "produce" | "cones_cups" | "toppings" | "syrups";
  UNITS_RECEIVED: number;
  UNITS_USED: number;
  UNITS_WASTED: number;
  WASTE_COST: number;
};

export type DateRange = {
  start: string;
  end: string;
};

type Status = "idle" | "loading" | "success" | "error";

export interface SnowconeState {
  locations: Location[];
  sales: DailySale[];
  reviews: CustomerReview[];
  inventory: InventoryRecord[];
  loading: boolean;
  error: string | null;
  status: Status;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

function getDefaultDateRange(): DateRange {
  // Default to December 2025 to align with seeded sample data
  return { start: "2025-12-01", end: "2025-12-31" };
}

export function useSnowconeData(): SnowconeState {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sales, setSales] = useState<DailySale[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setStatus("loading");
      setError(null);
      try {
        const { start, end } = dateRange;

        const [locs, salesRows, reviewRows, inventoryRows] = await Promise.all([
          querySnowflake<Location>(
            `
            SELECT LOCATION_ID, NAME, CITY, STATE, ADDRESS, MANAGER_NAME, OPEN_DATE, SEATING_CAPACITY, IS_ACTIVE
            FROM LOCATIONS
            ORDER BY LOCATION_ID
          `
          ),
          querySnowflake<DailySale>(
            `
            SELECT LOCATION_ID, SALE_DATE, ORDER_TYPE, REVENUE, NUM_ORDERS, AVG_ORDER_VALUE
            FROM DAILY_SALES
            WHERE SALE_DATE BETWEEN '${start}' AND '${end}'
          `
          ),
          querySnowflake<CustomerReview>(
            `
            SELECT REVIEW_ID, LOCATION_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME
            FROM CUSTOMER_REVIEWS
            WHERE REVIEW_DATE BETWEEN '${start}' AND '${end}'
          `
          ),
          querySnowflake<InventoryRecord>(
            `
            SELECT INVENTORY_ID, LOCATION_ID, RECORD_DATE, CATEGORY, UNITS_RECEIVED, UNITS_USED, UNITS_WASTED, WASTE_COST
            FROM INVENTORY
            WHERE RECORD_DATE BETWEEN '${start}' AND '${end}'
          `
          ),
        ]);

        if (cancelled) return;

        setLocations(
          locs.map((l) => ({
            ...l,
            OPEN_DATE: normalizeSnowflakeDate(l.OPEN_DATE),
          }))
        );
        setSales(
          salesRows.map((s) => ({
            ...s,
            SALE_DATE: normalizeSnowflakeDate(s.SALE_DATE),
            REVENUE: Number(s.REVENUE),
            NUM_ORDERS: Number(s.NUM_ORDERS),
            AVG_ORDER_VALUE: Number(s.AVG_ORDER_VALUE),
          }))
        );
        setReviews(
          reviewRows.map((r) => ({
            ...r,
            REVIEW_DATE: normalizeSnowflakeDate(r.REVIEW_DATE),
            RATING: Number(r.RATING),
          }))
        );
        setInventory(
          inventoryRows.map((i) => ({
            ...i,
            RECORD_DATE: normalizeSnowflakeDate(i.RECORD_DATE),
            UNITS_RECEIVED: Number(i.UNITS_RECEIVED),
            UNITS_USED: Number(i.UNITS_USED),
            UNITS_WASTED: Number(i.UNITS_WASTED),
            WASTE_COST: Number(i.WASTE_COST),
          }))
        );
        setStatus("success");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load data");
        setStatus("error");
      }
    }

    void fetchAll();

    return () => {
      cancelled = true;
    };
  }, [dateRange.start, dateRange.end]);

  return useMemo(
    () => ({
      locations,
      sales,
      reviews,
      inventory,
      loading: status === "loading" && !locations.length && !sales.length,
      status,
      error,
      dateRange,
      setDateRange,
    }),
    [locations, sales, reviews, inventory, status, error, dateRange]
  );
}

