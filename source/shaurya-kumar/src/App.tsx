import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import LocationScorecard from "@/components/LocationScorecard";
import HistoricalSales from "@/components/HistoricalSales";
import WasteTracker from "@/components/WasteTracker";
import LocationDrillDown from "@/components/LocationDrillDown";
import { useFilters } from "@/contexts/FilterContext";
import type { ViewSection } from "@/components/Sidebar";

export default function App() {
  const [activeView, setActiveView] = useState<ViewSection>("overview");
  const [drillDownLocationId, setDrillDownLocationId] = useState<number | null>(null);
  const { comparisonLocationIds } = useFilters();

  const handleLocationSelect = useCallback((locationId: number) => {
    setDrillDownLocationId(locationId);
  }, []);

  const handleCloseDrillDown = useCallback(() => {
    setDrillDownLocationId(null);
  }, []);

  return (
    <>
      <DashboardLayout
        activeView={activeView}
        onViewChange={setActiveView}
        onLocationSelect={handleLocationSelect}
      >
        {activeView === "overview" && (
          <>
            {comparisonLocationIds.length >= 2 && (
              <div className="mb-6">
                <HistoricalSales />
              </div>
            )}
            <LocationScorecard onLocationSelect={handleLocationSelect} />
          </>
        )}
        {activeView === "sales" && <HistoricalSales />}
        {activeView === "waste" && <WasteTracker />}
      </DashboardLayout>

      {/* Drill-down slide-over */}
      {drillDownLocationId !== null && (
        <LocationDrillDown
          locationId={drillDownLocationId}
          onClose={handleCloseDrillDown}
        />
      )}
    </>
  );
}
