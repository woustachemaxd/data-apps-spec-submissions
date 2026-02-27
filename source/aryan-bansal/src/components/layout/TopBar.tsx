import type { DateRange } from "@/types/schema";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { IceCream, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";

const NAV_ITEMS = [
    { label: "Overview", path: "/", icon: LayoutDashboard },
    { label: "Sales", path: "/sales", icon: TrendingUp },
    { label: "Waste", path: "/waste", icon: Trash2 },
] as const;

interface TopBarProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
}

export default function TopBar({ dateRange, onDateRangeChange }: TopBarProps) {
    const location = useLocation();
    const { resolved, setTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
            {/* Mobile menu */}
            <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <div className="flex items-center gap-2 px-4 h-14 border-b">
                            <IceCream className="h-6 w-6 text-primary" />
                            <span className="text-sm font-semibold">Snowcone HQ</span>
                        </div>
                        <nav className="py-4 space-y-1 px-2">
                            {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                                const active = location.pathname === path;
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                            active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent/50"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </SheetContent>
                </Sheet>

                <h1 className="text-sm font-semibold tracking-tight">
                    Dashboard
                </h1>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
                <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    {resolved === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </header>
    );
}
