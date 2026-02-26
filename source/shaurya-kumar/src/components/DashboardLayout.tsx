import { useState, type ReactNode } from "react";
import Sidebar, { type ViewSection } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Menu } from "lucide-react";

const VIEW_TITLES: Record<ViewSection, string> = {
    overview: "Location Overview",
    sales: "Sales Performance",
    waste: "Inventory & Waste",
};

interface DashboardLayoutProps {
    activeView: ViewSection;
    onViewChange: (view: ViewSection) => void;
    onLocationSelect: (locationId: number) => void;
    children: ReactNode;
}

export default function DashboardLayout({
    activeView,
    onViewChange,
    onLocationSelect,
    children,
}: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    activeView={activeView}
                    onViewChange={onViewChange}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
                />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative z-50">
                        <Sidebar
                            activeView={activeView}
                            onViewChange={(v) => {
                                onViewChange(v);
                                setMobileMenuOpen(false);
                            }}
                            collapsed={false}
                            onToggleCollapse={() => setMobileMenuOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div
                className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "md:ml-16" : "md:ml-56"}
        `}
            >
                {/* Mobile menu button + top bar */}
                <div className="flex items-center">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden p-3 text-muted-foreground hover:text-foreground"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1">
                        <TopBar
                            title={VIEW_TITLES[activeView]}
                            onLocationSelect={onLocationSelect}
                        />
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
