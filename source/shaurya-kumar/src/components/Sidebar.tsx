import {
    LayoutDashboard,
    TrendingUp,
    PackageOpen,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export type ViewSection = "overview" | "sales" | "waste";

interface SidebarProps {
    activeView: ViewSection;
    onViewChange: (view: ViewSection) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const NAV_ITEMS: { id: ViewSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
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
        ${collapsed ? "w-16" : "w-56"}
      `}
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sidebar-primary-foreground text-sm font-bold">S</span>
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">Snowcone</p>
                        <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider truncate">
                            Warehouse
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-3 px-2 space-y-1">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeView === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onViewChange(id)}
                            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors duration-150
                ${isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                }
              `}
                            title={collapsed ? label : undefined}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <div className="px-2 pb-3">
                <button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center py-2 rounded-lg
            text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50
            transition-colors duration-150"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
