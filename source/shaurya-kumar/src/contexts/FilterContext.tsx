import {
    createContext,
    useContext,
    useState,
    useMemo,
    type ReactNode,
} from "react";

export type DatePreset = "7d" | "30d" | "90d" | "all";

interface FilterContextType {
    datePreset: DatePreset;
    startDate: string;
    endDate: string;
    comparisonLocationIds: number[];
    searchQuery: string;
    setDatePreset: (preset: DatePreset) => void;
    setComparisonLocationIds: (ids: number[]) => void;
    toggleComparisonLocation: (id: number) => void;
    setSearchQuery: (query: string) => void;
    clearComparison: () => void;
}

const DATA_END = "2026-01-31";

function getDateRange(preset: DatePreset): {
    startDate: string;
    endDate: string;
} {
    switch (preset) {
        case "7d":
            return { startDate: "2026-01-25", endDate: DATA_END };
        case "30d":
            return { startDate: "2026-01-01", endDate: DATA_END };
        case "90d":
            return { startDate: "2025-11-01", endDate: DATA_END };
        case "all":
            return { startDate: "2025-11-01", endDate: DATA_END };
    }
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [comparisonLocationIds, setComparisonLocationIds] = useState<number[]>(
        []
    );
    const [searchQuery, setSearchQuery] = useState("");

    const { startDate, endDate } = useMemo(
        () => getDateRange(datePreset),
        [datePreset]
    );

    const toggleComparisonLocation = (id: number) => {
        setComparisonLocationIds((prev) =>
            prev.includes(id)
                ? prev.filter((lid) => lid !== id)
                : prev.length < 3
                    ? [...prev, id]
                    : prev
        );
    };

    const clearComparison = () => setComparisonLocationIds([]);

    return (
        <FilterContext.Provider
            value={{
                datePreset,
                startDate,
                endDate,
                comparisonLocationIds,
                searchQuery,
                setDatePreset,
                setComparisonLocationIds,
                toggleComparisonLocation,
                setSearchQuery,
                clearComparison,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const ctx = useContext(FilterContext);
    if (!ctx) throw new Error("useFilters must be used within FilterProvider");
    return ctx;
}
