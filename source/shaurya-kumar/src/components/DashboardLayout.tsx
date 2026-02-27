import { useState, type ReactNode } from "react";
import Sidebar, { type ViewSection } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Menu } from "lucide-react";
import Chatbot from "@/components/Chatbot";

const VIEW_TITLES: Record<ViewSection, string> = {
    overview: "Dashboard Overview",
    locations: "Location Directory",
    sales: "Sales Analysis",
    waste: "Waste Tracker",
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
            {/* Blueprint grid background */}
            <svg className="bp-grid" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
                    </pattern>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <rect width="100" height="100" fill="url(#smallGrid)" />
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

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
          relative z-[1] transition-all duration-300 ease-in-out
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

            <Chatbot />
        </div>
    );
}
