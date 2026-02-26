import { useFilters, type DatePreset } from "@/contexts/FilterContext";
import { Badge } from "@/components/ui/badge";

const PRESETS: { key: DatePreset; label: string }[] = [
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
    { key: "all", label: "All" },
];

export default function DateRangeFilter() {
    const { datePreset, setDatePreset } = useFilters();

    return (
        <div className="flex items-center gap-1.5">
            {PRESETS.map(({ key, label }) => {
                const isActive = datePreset === key;
                return (
                    <button
                        key={key}
                        onClick={() => setDatePreset(key)}
                        className={`
              px-3 py-1.5 rounded-md text-xs font-medium
              transition-colors duration-150
              ${isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }
            `}
                    >
                        {label}
                    </button>
                );
            })}
            <Badge variant="outline" className="ml-1 text-[10px] font-normal">
                Nov 2025 - Jan 2026
            </Badge>
        </div>
    );
}
