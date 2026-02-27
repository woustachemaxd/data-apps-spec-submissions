import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { querySnowflake } from "@/lib/snowflake";

export interface DateRange {
  startDate: string;
  endDate: string;
  days: number;
}

interface DateRangeContextValue {
  range: DateRange | null;
  setRange: (startDate: string, endDate: string) => void;
  loading: boolean;
  error: string | null;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

function normalizeToIsoDate(value: unknown): string {
  if (!value) throw new Error("MAX_DATE is null");

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const str = String(value);

  // Snowflake REST can return dates as day offsets like "20484"
  if (/^\d+$/.test(str)) {
    const daysSinceEpoch = Number(str);
    if (!Number.isFinite(daysSinceEpoch)) {
      throw new Error(`Numeric MAX_DATE not finite: ${str}`);
    }
    const base = new Date(Date.UTC(1970, 0, 1));
    base.setUTCDate(base.getUTCDate() + daysSinceEpoch);
    if (isNaN(base.getTime())) {
      throw new Error(`Unable to convert numeric MAX_DATE: ${str}`);
    }
    return base.toISOString().slice(0, 10);
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // If full timestamp
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  throw new Error(`Unable to normalize date: ${value}`);
}

function addDays(base: string, delta: number): string {
  if (!base) throw new Error("addDays received empty base");

  const [year, month, day] = base.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid base date passed to addDays: ${base}`);
  }

  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);

  if (isNaN(d.getTime())) {
    throw new Error(`Date overflow from base ${base} with delta ${delta}`);
  }

  return d.toISOString().slice(0, 10);
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRangeState] = useState<DateRange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialRange() {
      setLoading(true);
      setError(null);
      try {
        const rows = await querySnowflake<{ MAX_DATE: unknown }>(
          "SELECT MAX(SALE_DATE) AS MAX_DATE FROM DAILY_SALES"
        );
        const maxRow = rows[0];
        const maxDate = maxRow?.MAX_DATE;

        if (!maxDate) {
          if (!cancelled) {
            setRangeState(null);
            setError("No sales data available.");
          }
          return;
        }

        const defaultDays = 7;
        const endDate = normalizeToIsoDate(maxDate);
        const startDate = addDays(endDate, -(defaultDays - 1));

        if (!cancelled) {
          setRangeState({ startDate, endDate, days: defaultDays });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load date range");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialRange();

    return () => {
      cancelled = true;
    };
  }, []);

  function setRange(startDate: string, endDate: string) {
    const start = startDate || endDate;
    const end = endDate || startDate;
    if (!start || !end) return;

    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) return;

    const [minDate, maxDate] =
      startTime <= endTime ? [start, end] : [end, start];

    const min = new Date(minDate + "T00:00:00Z");
    const max = new Date(maxDate + "T00:00:00Z");
    const diffMs = max.getTime() - min.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

    setRangeState({
      startDate: minDate,
      endDate: maxDate,
      days,
    });
  }

  const value = useMemo<DateRangeContextValue>(
    () => ({
      range,
      loading,
      error,
      setRange,
    }),
    [range, loading, error]
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return ctx;
}

