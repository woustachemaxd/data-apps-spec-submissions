import { useCallback, useEffect, useRef, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";

/**
 * Generic hook that wraps `querySnowflake` with loading / error / data state.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSnowflake<ScorecardRow>(sql);
 *
 * The query re-runs whenever the `sql` string changes.
 * Pass `null` to skip execution (useful for conditional fetching).
 */
export function useSnowflake<T = Record<string, unknown>>(
    sql: string | null
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Track the latest sql to avoid state updates from stale requests
    const latestSql = useRef(sql);
    latestSql.current = sql;

    const execute = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const rows = await querySnowflake<T>(query);
            // Only update state if the query hasn't changed since we started
            if (latestSql.current === query) {
                setData(rows);
            }
        } catch (err) {
            if (latestSql.current === query) {
                setError(err instanceof Error ? err.message : "Query failed");
                setData([]);
            }
        } finally {
            if (latestSql.current === query) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (sql === null) {
            setLoading(false);
            setData([]);
            return;
        }
        execute(sql);
    }, [sql, execute]);

    const refetch = useCallback(() => {
        if (sql !== null) execute(sql);
    }, [sql, execute]);

    return { data, loading, error, refetch } as const;
}
