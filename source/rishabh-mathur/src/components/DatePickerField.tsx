import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type DatePickerFieldProps = {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (isoDate: string) => void;
};

function parseIsoDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "dd/mm/yyyy";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isOutOfBounds(iso: string, min?: string, max?: string): boolean {
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function DatePickerField({ label, value, min, max, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseIsoDate(value) ?? new Date());
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const monthLabel = useMemo(
    () =>
      viewDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [viewDate]
  );

  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const mondayFirstOffset = (firstOfMonth.getDay() + 6) % 7;
    const firstGridDate = new Date(year, month, 1 - mondayFirstOffset);

    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(firstGridDate);
      d.setDate(firstGridDate.getDate() + idx);
      const iso = toIsoDate(d);
      return {
        iso,
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isDisabled: isOutOfBounds(iso, min, max),
      };
    });
  }, [viewDate, min, max]);

  const selectedIso = value;
  const todayIso = toIsoDate(new Date());

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 text-xs font-bold text-[var(--text-muted)]">
      <span>{label}</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="h-auto min-w-0 flex-1 justify-between border border-[var(--border-color)] bg-[var(--glass-bg)] px-2 py-1.5 text-left text-xs text-[var(--text-main)] backdrop-blur-xl hover:bg-[var(--glass-bg)]"
      >
        <span className={`${value ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{formatDisplayDate(value)}</span>
        <span className="material-symbols-outlined text-base text-primary">calendar_month</span>
      </Button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-[290px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/95 p-3 shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="h-8 w-8 rounded-lg border border-[var(--border-color)] bg-[var(--glass-bg)]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">{monthLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="h-8 w-8 rounded-lg border border-[var(--border-color)] bg-[var(--glass-bg)]"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <span key={day} className="py-1 text-center text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const isSelected = cell.iso === selectedIso;
              const isToday = cell.iso === todayIso;

              return (
                <Button
                  key={cell.iso}
                  type="button"
                  variant="ghost"
                  disabled={cell.isDisabled}
                  onClick={() => {
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-lg p-0 text-xs font-bold ${
                    isSelected
                      ? "bg-primary text-white hover:bg-primary"
                      : cell.isCurrentMonth
                        ? "text-[var(--text-main)] hover:bg-[var(--glass-bg)]"
                        : "text-[var(--text-muted)]/70 hover:bg-[var(--glass-bg)]"
                  } ${isToday && !isSelected ? "border border-primary/40" : "border border-transparent"} disabled:opacity-30`}
                >
                  {cell.day}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
