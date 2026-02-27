import BrandLogo from "./BrandLogo";
import { Button } from "@/components/ui/button";

export default function Sidebar({
    activeTab,
    onTabChange,
    theme,
    onThemeToggle,
    collapsed = false,
    onToggleCollapse,
}: any) {
    const menuItems = [
        { id: 'overview', icon: 'dashboard', label: 'Overview' },
        { id: 'locations', icon: 'warehouse', label: 'Locations', count: 12 },
        { id: 'analysis', icon: 'analytics', label: 'Sales analysis' },
        { id: 'inventory', icon: 'inventory_2', label: 'Inventory health', alert: true },
    ];

    return (
        <div className="flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] transition-colors duration-500">
            <div className={`p-6 ${collapsed ? "px-3" : "px-6"}`}>
                <div className={`${collapsed ? "flex justify-center" : ""}`}>
                    <BrandLogo variant="v1" compact={collapsed} />
                </div>
            </div>

            <nav className={`flex-1 py-4 flex flex-col gap-5 ${collapsed ? "px-2" : "px-4"}`}>
                {!collapsed && (
                    <p className="px-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-50">Management</p>
                )}
                <div className="flex flex-col gap-1.5">
                    {menuItems.map((item) => (
                        <Button
                            type="button"
                            variant="ghost"
                            title={collapsed ? item.label : undefined}
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`!h-12 !w-full rounded-2xl transition-all group relative !px-3 ${
                                collapsed ? "!justify-center" : "!justify-start"
                            } ${
                                activeTab === item.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-[var(--text-muted)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
                            }`}
                        >
                            <span className="material-symbols-outlined w-5 text-[20px] text-center shrink-0">{item.icon}</span>
                            {!collapsed && <span className="text-xs font-black tracking-tight uppercase">{item.label}</span>}
                            {!collapsed && item.count && (
                                <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20" : "bg-[var(--glass-bg)] border border-[var(--border-color)]"
                                    }`}>
                                    {item.count}
                                </span>
                            )}
                            {!collapsed && item.alert && (
                                <span className="ml-auto flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            )}
                            {collapsed && item.alert && (
                                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            )}
                        </Button>
                    ))}
                </div>
            </nav>

            <div className={`p-4 mt-auto border-t border-[var(--border-color)] flex flex-col gap-2 ${collapsed ? "px-2" : ""}`}>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        title="Toggle theme"
                        onClick={onThemeToggle}
                        className={`!h-10 rounded-xl border border-[var(--border-color)] ${
                            theme === "dark" ? "bg-primary/15 text-primary" : "bg-[var(--glass-bg)] text-[var(--text-muted)]"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        title="Toggle sidebar"
                        onClick={onToggleCollapse}
                        className={`!h-10 rounded-xl border border-[var(--border-color)] ${
                            collapsed ? "bg-primary/15 text-primary" : "bg-[var(--glass-bg)] text-[var(--text-muted)]"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {collapsed ? "right_panel_open" : "right_panel_close"}
                        </span>
                    </Button>
                </div>

                <div className={`mt-4 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-xl transition-colors ${collapsed ? "px-2 py-3" : ""}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rishabh" alt="user" />
                        </div>
                        {!collapsed && <div className="flex-1">
                            <p className="text-[10px] font-black text-[var(--text-main)] truncate">Rishabh Mathur</p>
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest">Admin Manager</p>
                        </div>}
                        <span className="material-symbols-outlined text-[16px] text-[var(--text-muted)] hover:text-primary transition-colors cursor-pointer">settings</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
