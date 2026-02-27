import { useDateRange } from "@/hooks/useDateRange";
import { Input } from "@/components/ui/input";

export function DateRangeSelector() {
  const { range, setRange, loading, error } = useDateRange();

  const start = range?.startDate ?? "";
  const end = range?.endDate ?? "";

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        Date Range
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={start}
          onChange={(e) => setRange(e.target.value, end)}
          disabled={loading}
          className="h-8 w-[8.5rem] text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={end}
          onChange={(e) => setRange(start, e.target.value)}
          disabled={loading}
          className="h-8 w-[8.5rem] text-xs"
        />
      </div>
      {!range && !loading && error && (
        <div className="text-xs text-destructive">{error}</div>
      )}
    </div>
  );
}

