import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    TrendingUp,
    Trash2,
    IceCream,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
    { label: "Overview", path: "/", icon: LayoutDashboard },
    { label: "Sales", path: "/sales", icon: TrendingUp },
    { label: "Waste", path: "/waste", icon: Trash2 },
] as const;

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
                collapsed ? "w-16" : "w-56"
            )}
        >
            {/* Brand */}
            <div className="flex items-center gap-2 px-4 h-14 border-b">
                <IceCream className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
                {!collapsed && (
                    <span className="text-sm font-semibold tracking-tight truncate">
                        Snowcone HQ
                    </span>
                )}
            </div>

            {/* Nav links */}
            <nav className="flex-1 py-4 space-y-1 px-2">
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="border-t p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setCollapsed((c) => !c)}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </aside>
    );
}
