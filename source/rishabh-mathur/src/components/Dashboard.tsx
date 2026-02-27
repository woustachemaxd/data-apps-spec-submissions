import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    tabDirection: "forward" | "backward";
    title: string;
    subtitle: string;
    theme: 'dark' | 'light';
    onThemeToggle: (e: React.MouseEvent) => void;
    alerts: Array<{
        id: string;
        locationName: string;
        city: string;
        severity: "critical" | "warning" | "info";
        reason: string;
        metric: string;
    }>;
    onGenerateReport: () => void;
    reportLoading: boolean;
}

export default function Dashboard({
    children,
    activeTab,
    onTabChange,
    tabDirection,
    title,
    subtitle,
    theme,
    onThemeToggle,
    alerts,
    onGenerateReport,
    reportLoading,
}: DashboardProps) {
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsAlertsOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const criticalCount = alerts.filter((a) => a.severity === "critical").length;

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-color)]">
            {/* Sidebar */}
            <aside className={`${isSidebarCollapsed ? "w-24" : "w-72"} hidden md:block shrink-0 transition-all duration-300`}>
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    theme={theme}
                    onThemeToggle={onThemeToggle}
                    collapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Background Design Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none transition-colors duration-1000"></div>
                <div className="absolute bottom-0 left-48 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none transition-colors duration-1000"></div>

                {/* Global Header */}
                <header className="px-4 py-6 md:px-8 md:py-10 sm:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 z-10 shrink-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-lg"
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden w-11 h-11 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-primary"
                            >
                                <span className="material-symbols-outlined text-[22px]">menu</span>
                            </Button>
                            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tighter uppercase">{title}</h2>
                            <div className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 rounded-full h-fit flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.16)]">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                Live
                            </div>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-muted)] tracking-tight italic opacity-80">{subtitle}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={reportLoading}
                            onClick={onGenerateReport}
                            title="Download PDF Report"
                            className="relative h-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center gap-2 px-3 text-[var(--text-muted)] hover:text-primary transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {reportLoading ? "progress_activity" : "download"}
                            </span>
                            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider whitespace-nowrap">Download PDF Report</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            onClick={() => setIsAlertsOpen(true)}
                            className="relative w-12 h-12 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-primary transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 group"
                        >
                            <span className="material-symbols-outlined text-[24px] group-hover:animate-swing">notifications</span>
                            {alerts.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[var(--card-bg)]">
                                    {alerts.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </header>

                {/* Dynamic Viewport */}
                <section className="flex-1 overflow-y-auto px-4 md:px-8 sm:px-12 pb-12 no-scrollbar scroll-smooth">
                    <div
                        key={activeTab}
                        className={`max-w-[1600px] mx-auto py-2 tab-page-enter ${tabDirection === "forward" ? "tab-page-forward" : "tab-page-backward"}`}
                    >
                        {children}
                    </div>
                </section>
            </main>

            {/* Mobile Sidebar Drawer */}
            <div className={`fixed inset-0 z-[130] transition-all duration-300 md:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                <aside className={`absolute left-0 top-0 h-full w-[18rem] max-w-[88vw] border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] shadow-2xl transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <Sidebar
                        activeTab={activeTab}
                        onTabChange={(tab: string) => {
                            onTabChange(tab);
                            setIsMobileMenuOpen(false);
                        }}
                        theme={theme}
                        onThemeToggle={onThemeToggle}
                        collapsed={false}
                        onToggleCollapse={() => {}}
                    />
                </aside>
            </div>

            {/* Alerts Drawer */}
            <div className={`fixed inset-0 z-[120] transition-all duration-300 ${isAlertsOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAlertsOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsAlertsOpen(false)}
                />

                <aside
                    className={`absolute right-0 top-0 h-full w-full max-w-[430px] bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-2xl transition-transform duration-300 ${isAlertsOpen ? "translate-x-0" : "translate-x-full"}`}
                >
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-[var(--border-color)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight text-[var(--text-main)] uppercase">Action Center</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                        {alerts.length} alerts • {criticalCount} critical
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-lg"
                                    onClick={() => setIsAlertsOpen(false)}
                                    className="w-10 h-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                                    <p className="text-sm font-black text-emerald-400 uppercase tracking-wider">All clear</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">No at-risk locations right now.</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`rounded-2xl border p-4 ${
                                            alert.severity === "critical"
                                                ? "border-rose-500/30 bg-rose-500/5"
                                                : alert.severity === "warning"
                                                    ? "border-amber-500/30 bg-amber-500/5"
                                                    : "border-blue-500/30 bg-blue-500/5"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{alert.locationName}</p>
                                                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{alert.city}</p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    alert.severity === "critical"
                                                        ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                                                        : alert.severity === "warning"
                                                            ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                                            : "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === "critical" ? "bg-rose-500" : alert.severity === "warning" ? "bg-amber-500" : "bg-blue-500"}`}></span>
                                                {alert.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-bold text-[var(--text-main)] mt-3">{alert.reason}</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mt-2">{alert.metric}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
