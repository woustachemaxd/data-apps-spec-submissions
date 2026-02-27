import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import type { DateRange } from "@/types/schema";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

const PRESETS = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "This month", days: -1 },
    { label: "Last quarter", days: -2 },
] as const;

function getPresetRange(days: number): DateRange {
    const to = new Date();
    const from = new Date();

    if (days === -1) {
        // This month
        from.setDate(1);
    } else if (days === -2) {
        // Last quarter (3 months back from start of current month)
        from.setMonth(from.getMonth() - 3);
        from.setDate(1);
    } else {
        from.setDate(from.getDate() - days);
    }

    return { from, to };
}

function isPresetActive(preset: (typeof PRESETS)[number], value: DateRange): boolean {
    const range = getPresetRange(preset.days);
    return (
        format(range.from, "yyyy-MM-dd") === format(value.from, "yyyy-MM-dd") &&
        format(range.to, "yyyy-MM-dd") === format(value.to, "yyyy-MM-dd")
    );
}

export default function DateRangePicker({
    value,
    onChange,
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const handlePreset = (days: number) => {
        onChange(getPresetRange(days));
        setOpen(false);
    };

    const handleCustomApply = () => {
        if (customFrom && customTo) {
            const from = new Date(customFrom + "T00:00:00");
            const to = new Date(customTo + "T00:00:00");
            if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
                onChange({ from, to });
                setOpen(false);
            }
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "justify-between text-left font-normal gap-2 min-w-[200px]",
                        !value && "text-muted-foreground"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                            {format(value.from, "MMM dd, yyyy")} – {format(value.to, "MMM dd, yyyy")}
                        </span>
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
                {/* Preset buttons */}
                <div className="p-2 space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 pt-1 pb-1.5">
                        Quick select
                    </p>
                    {PRESETS.map((preset) => {
                        const active = isPresetActive(preset, value);
                        return (
                            <button
                                key={preset.days}
                                onClick={() => handlePreset(preset.days)}
                                className={cn(
                                    "flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-colors",
                                    active
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-foreground hover:bg-muted"
                                )}
                            >
                                {preset.label}
                                {active && <Check className="h-3.5 w-3.5" />}
                            </button>
                        );
                    })}
                </div>

                {/* Custom range */}
                <div className="border-t p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Custom range
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={customFrom || format(value.from, "yyyy-MM-dd")}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-xs text-muted-foreground self-center">→</span>
                        <input
                            type="date"
                            value={customTo || format(value.to, "yyyy-MM-dd")}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={handleCustomApply}
                    >
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
