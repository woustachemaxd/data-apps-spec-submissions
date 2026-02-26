import { useMemo } from "react";
import { useSnowflakeQuery } from "./useSnowflake";
import { toISODate } from "@/lib/dateUtils";

export interface Review {
    reviewId: number;
    locationId: number;
    reviewDate: string;
    rating: number;
    reviewText: string;
    customerName: string;
}

export function useReviews(locationId: number | null) {
    const sql = useMemo(
        () =>
            locationId
                ? `SELECT REVIEW_ID, LOCATION_ID, REVIEW_DATE, RATING, REVIEW_TEXT, CUSTOMER_NAME
           FROM CUSTOMER_REVIEWS
           WHERE LOCATION_ID = ${locationId}
           ORDER BY REVIEW_DATE DESC`
                : null,
        [locationId]
    );

    const { data: raw, loading, error } = useSnowflakeQuery<Record<string, string>>(sql);

    const data: Review[] = useMemo(
        () =>
            raw.map((r) => ({
                reviewId: Number(r.REVIEW_ID),
                locationId: Number(r.LOCATION_ID),
                reviewDate: toISODate(r.REVIEW_DATE),
                rating: Number(r.RATING),
                reviewText: String(r.REVIEW_TEXT || ""),
                customerName: String(r.CUSTOMER_NAME || ""),
            })),
        [raw]
    );

    return { data, loading, error };
}
