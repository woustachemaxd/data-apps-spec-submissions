import { Sun, Moon, Search, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useFilters } from "@/contexts/FilterContext";
import { useLocations } from "@/hooks/useLocations";
import DateRangeFilter from "@/components/DateRangeFilter";
import { useState, useRef, useEffect } from "react";

interface TopBarProps {
    title: string;
    onLocationSelect?: (locationId: number) => void;
}

export default function TopBar({ title, onLocationSelect }: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const { searchQuery, setSearchQuery } = useFilters();
    const { data: locations } = useLocations();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredLocations = searchQuery.trim()
        ? locations.filter(
            (l) =>
                l.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.CITY.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    useEffect(() => {
        if (searchOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [searchOpen]);

    return (
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 gap-4">
            {/* Left: section title */}
            <div>
                <h1 className="text-sm font-semibold uppercase tracking-[0.15em]">{title}</h1>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2">
                {/* Date range filter - hidden on very small screens */}
                <div className="hidden md:flex">
                    <DateRangeFilter />
                </div>

                {/* Search */}
                <div className="relative">
                    {searchOpen ? (
                        <div className="flex items-center">
                            <input
                                ref={searchRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                                placeholder="Search locations..."
                                className="w-48 h-8 px-3 text-xs bg-muted border border-input
                  focus:outline-none focus:ring-1 focus:ring-ring
                  font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                            />
                            <button
                                onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                }}
                                className="ml-1 p-1 hover:bg-muted transition-colors"
                            >
                                <X size={14} />
                            </button>

                            {/* Dropdown results */}
                            {searchFocused && filteredLocations.length > 0 && (
                                <div className="absolute top-full right-0 mt-1 w-64 bg-popover border border-border shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                                    {filteredLocations.map((loc) => (
                                        <button
                                            key={loc.LOCATION_ID}
                                            onClick={() => {
                                                onLocationSelect?.(loc.LOCATION_ID);
                                                setSearchQuery("");
                                                setSearchOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                                        >
                                            <span className="font-medium">{loc.NAME}</span>
                                            <span className="text-muted-foreground ml-2 text-[10px] uppercase tracking-wider">
                                                {loc.CITY}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Search locations"
                        >
                            <Search size={14} />
                        </button>
                    )}
                </div>

                {/* Dark mode toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                    {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
            </div>
        </header>
    );
}
