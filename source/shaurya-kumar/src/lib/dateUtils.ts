/**
 * Snowflake SQL REST API returns DATE columns as integer strings
 * representing the number of days since the Unix epoch (1970-01-01).
 * This utility converts those to proper Date objects and formatted strings.
 */

const EPOCH = new Date("1970-01-01T00:00:00Z").getTime();
const DAY_MS = 86_400_000;

/**
 * Parse a Snowflake date value (either epoch day number or ISO string) into a Date.
 */
export function parseSnowflakeDate(value: string | number): Date {
    const num = Number(value);
    // If it's a reasonable epoch day count (between ~18000 and ~25000 for 2019-2038)
    if (!isNaN(num) && num > 10000 && num < 40000) {
        return new Date(EPOCH + num * DAY_MS);
    }
    // Otherwise try parsing as ISO/date string
    return new Date(value);
}

/**
 * Format a Snowflake date to a short display string: "Nov 3", "Jan 15"
 */
export function formatShortDate(value: string | number): string {
    const d = parseSnowflakeDate(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a Snowflake date to a long display string: "Mar 15, 2022"
 */
export function formatLongDate(value: string | number): string {
    const d = parseSnowflakeDate(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Format a Snowflake date to sortable ISO string: "2022-03-15"
 */
export function toISODate(value: string | number): string {
    const d = parseSnowflakeDate(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toISOString().split("T")[0];
}
