import { Button } from "@/components/ui/button";

export interface DateFilterProps {
  selectedRange: "week" | "month" | "year" | "all";
  onRangeChange: (range: "week" | "month" | "year" | "all") => void;
}

export default function DateFilter({ selectedRange, onRangeChange }: DateFilterProps) {
  const ranges: Array<{ label: string; value: "week" | "month" | "year" | "all" }> = [
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "Last Year", value: "year" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range.value}
          onClick={() => onRangeChange(range.value)}
          variant={selectedRange === range.value ? "default" : "outline"}
          size="sm"
          className={selectedRange === range.value ? "bg-blue-600 text-white" : ""}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
