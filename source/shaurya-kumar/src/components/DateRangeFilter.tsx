import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useFilters, type DatePreset } from "@/contexts/FilterContext";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatLongDate } from "@/lib/dateUtils";

const PRESETS: { key: Exclude<DatePreset, "custom">; label: string }[] = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
    { key: "all", label: "All" },
];

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DATA_MIN = "2025-11-01";
const DATA_MAX = "2026-01-31";

// ── Calendar helpers ──

function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

/** Sunday = 0 */
function firstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function toISO(year: number, month: number, day: number) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

interface CalendarDay {
    day: number;
    iso: string;
    currentMonth: boolean;
}

function getCalendarGrid(year: number, month: number): CalendarDay[] {
    const totalDays = daysInMonth(year, month);
    const startDow = firstDayOfWeek(year, month);
    const grid: CalendarDay[] = [];

    // Previous month fill
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevDays = daysInMonth(prevYear, prevMonth);
    for (let i = startDow - 1; i >= 0; i--) {
        const d = prevDays - i;
        grid.push({ day: d, iso: toISO(prevYear, prevMonth, d), currentMonth: false });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
        grid.push({ day: d, iso: toISO(year, month, d), currentMonth: true });
    }

    // Next month fill (fill to 42 = 6 rows)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (grid.length < 42) {
        grid.push({ day: nextDay, iso: toISO(nextYear, nextMonth, nextDay), currentMonth: false });
        nextDay++;
    }

    return grid;
}

// ── Component ──

export default function DateRangeFilter() {
    const {
        datePreset,
        setDatePreset,
        startDate,
        endDate,
        customStartDate,
        customEndDate,
        setCustomDateRange,
    } = useFilters();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [tempStart, setTempStart] = useState(customStartDate);
    const [tempEnd, setTempEnd] = useState(customEndDate);
    /** Which date the next click will set: "start" or "end" */
    const [selecting, setSelecting] = useState<"start" | "end">("start");
    /** The left calendar shows this month (right = left + 1) */
    const [viewYear, setViewYear] = useState(2025);
    const [viewMonth, setViewMonth] = useState(10); // November = 10

    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Sync temp values when custom dates change externally
    useEffect(() => {
        setTempStart(customStartDate);
        setTempEnd(customEndDate);
    }, [customStartDate, customEndDate]);

    // Close popover on outside click
    useEffect(() => {
        if (!popoverOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [popoverOpen]);

    // Close on Escape
    useEffect(() => {
        if (!popoverOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPopoverOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [popoverOpen]);

    const handleApply = useCallback(() => {
        if (tempStart && tempEnd && tempStart <= tempEnd) {
            setCustomDateRange(tempStart, tempEnd);
            setPopoverOpen(false);
        }
    }, [tempStart, tempEnd, setCustomDateRange]);

    const handleReset = useCallback(() => {
        setDatePreset("all");
        setTempStart(DATA_MIN);
        setTempEnd(DATA_MAX);
        setSelecting("start");
        setPopoverOpen(false);
    }, [setDatePreset]);

    const handlePresetClick = (key: Exclude<DatePreset, "custom">) => {
        setDatePreset(key);
        setPopoverOpen(false);
    };

    // ── Calendar navigation ──
    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    // Right calendar month
    const rightYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const rightMonth = viewMonth === 11 ? 0 : viewMonth + 1;

    const leftGrid = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);
    const rightGrid = useMemo(() => getCalendarGrid(rightYear, rightMonth), [rightYear, rightMonth]);

    // ── Day click handler ──
    const handleDayClick = (iso: string) => {
        if (iso < DATA_MIN || iso > DATA_MAX) return; // out of data range

        if (selecting === "start") {
            setTempStart(iso);
            // If the new start is after the current end, reset end
            if (iso > tempEnd) {
                setTempEnd(iso);
            }
            setSelecting("end");
        } else {
            if (iso < tempStart) {
                // Clicked before start → make this the new start
                setTempStart(iso);
                setSelecting("end");
            } else {
                setTempEnd(iso);
                setSelecting("start");
            }
        }
    };

    // ── Day cell style helper ──
    const getDayCellClass = (iso: string, currentMonth: boolean) => {
        const isStart = iso === tempStart;
        const isEnd = iso === tempEnd;
        const inRange = tempStart && tempEnd && iso >= tempStart && iso <= tempEnd;
        const outOfDataRange = iso < DATA_MIN || iso > DATA_MAX;

        let base = "py-2 text-[11px] font-mono cursor-pointer transition-colors ";

        if (outOfDataRange || !currentMonth) {
            base += "text-muted-foreground/30 cursor-default ";
            if (inRange && currentMonth) {
                base += "bg-primary/10 ";
            }
            return base;
        }

        if (isStart || isEnd) {
            return base + "bg-primary text-primary-foreground font-bold ";
        }

        if (inRange) {
            return base + "bg-primary/20 text-foreground ";
        }

        return base + "text-foreground hover:bg-primary/10 ";
    };

    const isCustom = datePreset === "custom";
    const dateLabel = `${formatLongDate(startDate)} – ${formatLongDate(endDate)}`;

    // ── Render a single month grid ──
    const renderMonth = (
        year: number,
        month: number,
        grid: CalendarDay[],
        showLeftNav: boolean,
        showRightNav: boolean,
    ) => (
        <div className="flex-1">
            {/* Month header */}
            <div className="flex items-center justify-between mb-3 px-1">
                {showLeftNav ? (
                    <button
                        onClick={goToPrevMonth}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                    >
                        <ChevronLeft size={16} />
                    </button>
                ) : (
                    <div className="w-5" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                    {MONTH_NAMES[month]} {year}
                </span>
                {showRightNav ? (
                    <button
                        onClick={goToNextMonth}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                    >
                        <ChevronRight size={16} />
                    </button>
                ) : (
                    <div className="w-5" />
                )}
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 text-center">
                {DAY_LABELS.map((d, i) => (
                    <div key={i} className="text-[9px] font-bold text-muted-foreground pb-2">
                        {d}
                    </div>
                ))}

                {/* Date cells */}
                {grid.map((cell, i) => (
                    <div
                        key={i}
                        onClick={() => cell.currentMonth && handleDayClick(cell.iso)}
                        className={getDayCellClass(cell.iso, cell.currentMonth)}
                    >
                        {cell.day}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex items-center gap-1.5 relative">
            {/* Preset buttons */}
            {PRESETS.map(({ key, label }) => {
                const isActive = datePreset === key;
                return (
                    <button
                        key={key}
                        onClick={() => handlePresetClick(key)}
                        className={`
                            px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]
                            transition-colors duration-150 border
                            ${isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                            }
                        `}
                    >
                        {label}
                    </button>
                );
            })}

            {/* Custom Range trigger button */}
            <button
                ref={triggerRef}
                onClick={() => setPopoverOpen((prev) => !prev)}
                className={`
                    flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]
                    transition-all duration-150 border
                    ${isCustom
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                    }
                `}
            >
                <CalendarDays size={12} />
                Custom
            </button>

            {/* Dynamic date range label */}
            <span className="ml-1 px-2 py-0.5 text-[9px] text-muted-foreground border border-border uppercase tracking-[0.15em]">
                {dateLabel}
            </span>

            {/* ═══ Custom Date Popover Card ═══ */}
            {popoverOpen && (
                <div
                    ref={popoverRef}
                    className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                    <div className="w-[620px] bg-background border border-border shadow-2xl shadow-black/60 flex flex-col"
                        style={{ borderRadius: 0 }}>

                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-2.5">
                                <CalendarDays size={14} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    Timeframe Selection
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 bg-primary animate-pulse" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-primary/80">
                                        System Ready
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPopoverOpen(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* ── Main Content ── */}
                        <div className="p-5">
                            {/* Date inputs */}
                            <div className="grid grid-cols-2 gap-5 mb-6">
                                {/* Start Date input */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                        Start Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={tempStart}
                                            onClick={() => setSelecting("start")}
                                            className={`
                                                w-full bg-muted/20 border p-3 font-mono text-xs
                                                focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                                                transition-all cursor-pointer
                                                ${selecting === "start"
                                                    ? "border-primary text-primary"
                                                    : "border-border text-primary/70"
                                                }
                                            `}
                                            style={{ borderRadius: 0 }}
                                        />
                                        <CalendarDays
                                            size={14}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                                        />
                                    </div>
                                </div>

                                {/* End Date input */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                        End Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={tempEnd}
                                            onClick={() => setSelecting("end")}
                                            className={`
                                                w-full bg-muted/20 border p-3 font-mono text-xs
                                                focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                                                transition-all cursor-pointer
                                                ${selecting === "end"
                                                    ? "border-primary text-primary"
                                                    : "border-border text-primary/70"
                                                }
                                            `}
                                            style={{ borderRadius: 0 }}
                                        />
                                        <CalendarDays
                                            size={14}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Two-month calendar grid */}
                            <div className="flex gap-6">
                                {renderMonth(viewYear, viewMonth, leftGrid, true, false)}
                                <div className="w-px bg-border/30" />
                                {renderMonth(rightYear, rightMonth, rightGrid, false, true)}
                            </div>
                        </div>

                        {/* ── Footer Actions ── */}
                        <div className="flex items-center justify-end gap-5 px-5 py-3 border-t border-border bg-muted/10">
                            <button
                                onClick={handleReset}
                                className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!tempStart || !tempEnd || tempStart > tempEnd}
                                className="
                                    bg-primary text-primary-foreground px-8 py-2.5
                                    text-[10px] font-bold uppercase tracking-[0.2em]
                                    border border-primary
                                    hover:bg-transparent hover:text-primary transition-all
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                "
                            >
                                Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
