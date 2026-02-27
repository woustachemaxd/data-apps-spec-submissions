import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import type { DateRange } from "@/types/schema";

/**
 * Dashboard Shell
 */
export default function App() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2025, 10, 1), // Nov 1, 2025
    to: new Date(2026, 0, 31),   // Jan 31, 2026
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar dateRange={dateRange} onDateRangeChange={setDateRange} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ dateRange }} />
        </main>

        <footer className="border-t px-6 py-3 text-center text-xs text-muted-foreground">
          The Snowcone Warehouse — Data Mavericks Dashboard
        </footer>
      </div>
    </div>
  );
}
