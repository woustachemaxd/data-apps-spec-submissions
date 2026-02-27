import {
    LayoutDashboard,
    TrendingUp,
    PackageOpen,
    MapPin,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export type ViewSection = "overview" | "locations" | "sales" | "waste";

interface SidebarProps {
    activeView: ViewSection;
    onViewChange: (view: ViewSection) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const NAV_ITEMS: { id: ViewSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "sales", label: "Sales", icon: TrendingUp },
    { id: "waste", label: "Waste", icon: PackageOpen },
];

export default function Sidebar({
    activeView,
    onViewChange,
    collapsed,
    onToggleCollapse,
}: SidebarProps) {
    return (
        <aside
            className={`
        fixed left-0 top-0 bottom-0 z-30
        flex flex-col
        bg-sidebar text-sidebar-foreground
        border-r border-sidebar-border
        transition-all duration-300 ease-in-out
        backdrop-blur-sm
        ${collapsed ? "w-16" : "w-56"}
      `}
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
                <div className="w-8 h-8 bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sidebar-primary-foreground text-sm font-bold">S</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate tracking-wide">Snowcone</p>
                        <p className="text-[9px] text-sidebar-foreground/50 uppercase tracking-[0.3em] truncate">
                            Warehouse
                        </p>
                    </div>
                )}
            </div>

            {/* Version tag */}
            {!collapsed && (
                <div className="px-4 pt-2 pb-1">
                    <span className="bp-spec text-[8px] text-sidebar-foreground/30">OPERATIONS v2.4</span>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-2 px-2 space-y-0.5">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeView === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onViewChange(id)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5
                text-xs font-medium uppercase tracking-[0.1em]
                transition-colors duration-150
                ${isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border-l-2 border-transparent"
                                }
              `}
                            title={collapsed ? label : undefined}
                        >
                            <Icon size={16} className="flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="px-2 pb-3">
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center py-2
            text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50
            transition-colors duration-150"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>
        </aside>
    );
}
