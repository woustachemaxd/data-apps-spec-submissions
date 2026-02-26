import { useState, useEffect } from "react";
import { querySnowflake } from "@/lib/snowflake";

const queryCache = new Map<string, unknown[]>();

export function useSnowflakeQuery<T = Record<string, unknown>>(
  sql: string | null
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(!!sql);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sql) {
      setData([]);
      setLoading(false);
      return;
    }

    const cached = queryCache.get(sql);
    if (cached) {
      setData(cached as T[]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    querySnowflake<T>(sql)
      .then((rows) => {
        if (!cancelled) {
          queryCache.set(sql, rows as unknown[]);
          setData(rows);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Query failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sql]);

  return { data, loading, error };
}

export function clearQueryCache() {
  queryCache.clear();
}
