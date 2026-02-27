import { format } from "date-fns";

/**
 * Safely parse a date string from Snowflake.
 *
 * The Snowflake REST API returns DATE columns as epoch-day strings
 * (number of days since 1970-01-01). For example:
 *   - "20393" → Nov 1, 2025
 *   - "20423" → Dec 1, 2025
 *
 * It may also return ISO strings or TIMESTAMP strings.
 * This function handles all cases gracefully.
 */
export function safeParse(dateStr: string): Date {
    if (!dateStr) return new Date();

    if (/^\d+$/.test(dateStr.trim())) {
        const epochDays = Number(dateStr.trim());
        if (epochDays > 10000 && epochDays < 100000) {
            return new Date(epochDays * 86_400_000);
        }
    }

    const iso = Date.parse(dateStr);
    if (!isNaN(iso)) return new Date(iso);

    return new Date();
}

/**
 * Format a date string from Snowflake to a display label.
 * Falls back gracefully if the date cannot be parsed.
 */
export function formatDate(dateStr: string, fmt: string = "MMM dd"): string {
    try {
        return format(safeParse(dateStr), fmt);
    } catch {
        return dateStr;
    }
}
