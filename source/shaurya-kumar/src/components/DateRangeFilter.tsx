import { useFilters, type DatePreset } from "@/contexts/FilterContext";

const PRESETS: { key: DatePreset; label: string }[] = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
    { key: "all", label: "All" },
];

export default function DateRangeFilter() {
    const { datePreset, setDatePreset } = useFilters();

    return (
        <div className="flex items-center gap-1">
            {PRESETS.map(({ key, label }) => {
                const isActive = datePreset === key;
                return (
                    <button
                        key={key}
                        onClick={() => setDatePreset(key)}
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
            <span className="ml-1 px-2 py-0.5 text-[9px] text-muted-foreground border border-border uppercase tracking-[0.15em]">
                Nov 2025 – Jan 2026
            </span>
        </div>
    );
}
