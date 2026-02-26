import { useMemo } from "react";
import { useSnowflakeQuery } from "./useSnowflake";
import { useFilters } from "@/contexts/FilterContext";
import { toISODate } from "@/lib/dateUtils";

export interface InventoryRecord {
    recordDate: string;
    locationId: number;
    locationName: string;
    category: string;
    unitsReceived: number;
    unitsUsed: number;
    unitsWasted: number;
    wasteCost: number;
}

export interface WasteSummary {
    locationId: number;
    locationName: string;
    category: string;
    totalWasted: number;
    totalReceived: number;
    totalWasteCost: number;
    wastePct: number;
}

export function useInventory(locationIds?: number[]) {
    const { startDate, endDate } = useFilters();

    const sql = useMemo(() => {
        const locFilter =
            locationIds && locationIds.length > 0
                ? `AND i.LOCATION_ID IN (${locationIds.join(",")})`
                : "";

        return `
      SELECT i.RECORD_DATE, i.LOCATION_ID, l.NAME AS LOCATION_NAME,
        i.CATEGORY, i.UNITS_RECEIVED, i.UNITS_USED, i.UNITS_WASTED,
        i.WASTE_COST
      FROM INVENTORY i
      JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
      WHERE i.RECORD_DATE BETWEEN '${startDate}' AND '${endDate}'
      ${locFilter}
      ORDER BY i.RECORD_DATE, i.LOCATION_ID`;
    }, [startDate, endDate, locationIds]);

    const { data: raw, loading, error } = useSnowflakeQuery<Record<string, string>>(sql);

    const data: InventoryRecord[] = useMemo(
        () =>
            raw.map((r) => ({
                recordDate: toISODate(r.RECORD_DATE),
                locationId: Number(r.LOCATION_ID),
                locationName: String(r.LOCATION_NAME),
                category: String(r.CATEGORY),
                unitsReceived: Number(r.UNITS_RECEIVED),
                unitsUsed: Number(r.UNITS_USED),
                unitsWasted: Number(r.UNITS_WASTED),
                wasteCost: Number(r.WASTE_COST),
            })),
        [raw]
    );

    const wasteSummary: WasteSummary[] = useMemo(() => {
        const grouped: Record<string, WasteSummary> = {};
        for (const row of data) {
            const key = `${row.locationId}-${row.category}`;
            if (!grouped[key]) {
                grouped[key] = {
                    locationId: row.locationId,
                    locationName: row.locationName,
                    category: row.category,
                    totalWasted: 0,
                    totalReceived: 0,
                    totalWasteCost: 0,
                    wastePct: 0,
                };
            }
            grouped[key].totalWasted += row.unitsWasted;
            grouped[key].totalReceived += row.unitsReceived;
            grouped[key].totalWasteCost += row.wasteCost;
        }
        return Object.values(grouped).map((g) => ({
            ...g,
            totalWasteCost: Math.round(g.totalWasteCost * 100) / 100,
            wastePct:
                g.totalReceived > 0
                    ? Math.round((g.totalWasted / g.totalReceived) * 1000) / 10
                    : 0,
        }));
    }, [data]);

    return { data, wasteSummary, loading, error };
}
