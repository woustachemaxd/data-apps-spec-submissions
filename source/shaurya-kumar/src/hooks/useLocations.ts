import { useMemo } from "react";
import { useSnowflakeQuery } from "./useSnowflake";

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

const SQL = `SELECT LOCATION_ID, NAME, CITY, STATE, ADDRESS, MANAGER_NAME,
  OPEN_DATE, SEATING_CAPACITY, IS_ACTIVE
  FROM LOCATIONS ORDER BY LOCATION_ID`;

export function useLocations() {
    const { data: raw, loading, error } = useSnowflakeQuery<Record<string, string>>(SQL);

    const data: Location[] = useMemo(
        () =>
            raw.map((r) => ({
                LOCATION_ID: Number(r.LOCATION_ID),
                NAME: String(r.NAME),
                CITY: String(r.CITY),
                STATE: String(r.STATE),
                ADDRESS: String(r.ADDRESS || ""),
                MANAGER_NAME: String(r.MANAGER_NAME || ""),
                OPEN_DATE: String(r.OPEN_DATE || ""),
                SEATING_CAPACITY: Number(r.SEATING_CAPACITY),
                IS_ACTIVE: r.IS_ACTIVE === "true" || r.IS_ACTIVE === "1",
            })),
        [raw]
    );

    return { data, loading, error };
}
