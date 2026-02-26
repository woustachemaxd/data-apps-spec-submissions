import { useMemo } from "react";
import { useSnowflakeQuery } from "./useSnowflake";
import { useFilters } from "@/contexts/FilterContext";
import { toISODate } from "@/lib/dateUtils";

export interface DailySaleRecord {
    saleDate: string;
    locationId: number;
    locationName: string;
    orderType: string;
    revenue: number;
    numOrders: number;
}

export function useSales(locationIds?: number[]) {
    const { startDate, endDate } = useFilters();

    const sql = useMemo(() => {
        const locFilter =
            locationIds && locationIds.length > 0
                ? `AND s.LOCATION_ID IN (${locationIds.join(",")})`
                : "";

        return `
      SELECT s.SALE_DATE, s.LOCATION_ID, l.NAME AS LOCATION_NAME,
        s.ORDER_TYPE, s.REVENUE, s.NUM_ORDERS
      FROM DAILY_SALES s
      JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
      WHERE s.SALE_DATE BETWEEN '${startDate}' AND '${endDate}'
      ${locFilter}
      ORDER BY s.SALE_DATE, s.LOCATION_ID`;
    }, [startDate, endDate, locationIds]);

    const { data: raw, loading, error } = useSnowflakeQuery<Record<string, string>>(sql);

    const data: DailySaleRecord[] = useMemo(
        () =>
            raw.map((r) => ({
                saleDate: toISODate(r.SALE_DATE),
                locationId: Number(r.LOCATION_ID),
                locationName: String(r.LOCATION_NAME),
                orderType: String(r.ORDER_TYPE),
                revenue: Number(r.REVENUE),
                numOrders: Number(r.NUM_ORDERS),
            })),
        [raw]
    );

    return { data, loading, error };
}
