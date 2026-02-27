import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { BarChart3, TrendingUp, Trash2, AlertCircle, MapPin } from "lucide-react";
import { AppLoadingSkeleton } from "@/components/dashboard";
import { Logo } from "@/components/Logo";
import { Chatbot } from "@/components/Chatbot";

// Hooks
import {
  useDashboardData,
  useFilteredSales,
  useFilteredReviews,
  useFilteredInventory,
  useLocationScores,
  useWasteByLocation,
  useSummaryStats,
  useSalesByOrderType,
  useDailyRevenueTrend,
  useWasteByCategory,
  useDarkMode,
} from "@/hooks/useDashboardData";

// Pages
import { Overview, SalesAnalysis, WasteTracker, LocationDetail, Locations, LocationCompare } from "@/pages";

// Types
import type { LocationScore, DateRange, WasteByLocation } from "@/types";

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  // Data fetching
  const { data, loading, error } = useDashboardData();
  const { locations, sales, reviews, inventory } = data;

  // UI State
  const [selectedLocation, setSelectedLocation] = useState<LocationScore | null>(null);
  const [compareLocations, setCompareLocations] = useState<LocationScore[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: "2025-11-01",
    end: "2026-01-31",
  });
  const [activeTab, setActiveTab] = useState<"overview" | "locations" | "sales" | "waste">("overview");
  const [darkMode, setDarkMode] = useDarkMode();

  // Derived data using hooks - all filtered by date range
  const filteredSales = useFilteredSales(sales, dateRange);
  const filteredReviews = useFilteredReviews(reviews, dateRange);
  const filteredInventory = useFilteredInventory(inventory, dateRange);
  
  const locationScores = useLocationScores(locations, filteredSales, filteredReviews, filteredInventory);
  const wasteByLocation = useWasteByLocation(locationScores, filteredInventory);
  const summaryStats = useSummaryStats(locationScores, filteredInventory);
  const salesByOrderType = useSalesByOrderType(filteredSales);
  const dailyRevenueTrend = useDailyRevenueTrend(filteredSales);
  const wasteByCategory = useWasteByCategory(filteredInventory);

  // Key for re-animating charts when date range changes
  const chartKey = `${dateRange.start}-${dateRange.end}`;

  // Handlers
  const handleSelectLocation = useCallback((location: LocationScore | WasteByLocation) => {
    setSelectedLocation(location as LocationScore);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  // Compare handlers
  const handleStartCompare = useCallback((location: LocationScore) => {
    setCompareLocations([location]);
    setShowCompare(true);
  }, []);

  const handleAddToCompare = useCallback((location: LocationScore) => {
    if (compareLocations.length < 3) {
      setCompareLocations((prev) => [...prev, location]);
    }
  }, [compareLocations.length]);

  const handleRemoveFromCompare = useCallback((locationId: number) => {
    setCompareLocations((prev) => prev.filter((l) => l.location.LOCATION_ID !== locationId));
  }, []);

  const handleBackFromCompare = useCallback(() => {
    setShowCompare(false);
    setCompareLocations([]);
  }, []);

  // Loading state
  if (loading) {
    return <AppLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md border-destructive">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <AlertCircle className="h-6 w-6" />
              <p className="font-semibold">Connection Failed</p>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-3">
              Make sure you've copied{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                .env.example
              </code>{" "}
              to{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Location compare view
  if (showCompare) {
    return (
      <LocationCompare
        selectedLocations={compareLocations}
        allLocations={locationScores}
        sales={filteredSales}
        inventory={filteredInventory}
        onBack={handleBackFromCompare}
        onAddLocation={handleAddToCompare}
        onRemoveLocation={handleRemoveFromCompare}
        dateRange={dateRange}
        setDateRange={setDateRange}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  // Location drill-down view
  if (selectedLocation) {
    return (
      <LocationDetail
        locationScore={selectedLocation}
        sales={filteredSales.filter(
          (s) => Number(s.LOCATION_ID) === Number(selectedLocation.location.LOCATION_ID)
        )}
        reviews={filteredReviews.filter(
          (r) => Number(r.LOCATION_ID) === Number(selectedLocation.location.LOCATION_ID)
        )}
        inventory={filteredInventory.filter(
          (i) => Number(i.LOCATION_ID) === Number(selectedLocation.location.LOCATION_ID)
        )}
        onBack={handleBack}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onCompare={handleStartCompare}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size={42} animated={true} />
              <div>
                <h1 className="text-lg font-bold">Snowcone Warehouse</h1>
                <p className="text-xs text-muted-foreground">
                  Operations Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Date Filters */}
              <div className="hidden lg:flex items-center gap-1">
                {[
                  { label: "7D", days: 7 },
                  { label: "30D", days: 30 },
                  { label: "6M", days: 180 },
                  { label: "1Y", days: 365 },
                  { label: "All", days: null },
                ].map((preset) => {
                  const today = new Date("2026-01-31");
                  let start: string;
                  if (preset.days === null) {
                    start = "2020-01-01"; // All time - far back enough
                  } else {
                    const startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - preset.days);
                    start = startDate.toISOString().split("T")[0];
                  }
                  const isActive = dateRange.start === start;
                  return (
                    <Button
                      key={preset.label}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setDateRange({
                          start,
                          end: today.toISOString().split("T")[0],
                        })
                      }
                      className="text-xs px-2"
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>

              {/* Date Range Filter */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <DatePicker
                  date={dateRange.start}
                  onDateChange={(date) =>
                    setDateRange((d) => ({ ...d, start: date }))
                  }
                  placeholder="Start date"
                />
                <span className="text-muted-foreground">to</span>
                <DatePicker
                  date={dateRange.end}
                  onDateChange={(date) =>
                    setDateRange((d) => ({ ...d, end: date }))
                  }
                  placeholder="End date"
                />
              </div>

              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "☀️" : "🌙"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "locations", label: "Locations", icon: MapPin },
            { id: "sales", label: "Sales Analysis", icon: TrendingUp },
            { id: "waste", label: "Waste Tracker", icon: Trash2 },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content - key prop causes re-animation on date change */}
        {activeTab === "overview" && (
          <Overview
            key={chartKey}
            summaryStats={summaryStats}
            dailyRevenueTrend={dailyRevenueTrend}
            salesByOrderType={salesByOrderType}
            wasteByCategory={wasteByCategory}
            totalReviews={filteredReviews.length}
            dateRange={dateRange}
          />
        )}

        {activeTab === "locations" && (
          <Locations
            key={chartKey}
            locationScores={locationScores}
            reviews={filteredReviews}
            onSelectLocation={handleSelectLocation}
            onCompare={handleStartCompare}
            dateRange={dateRange}
          />
        )}

        {activeTab === "sales" && (
          <SalesAnalysis
            key={chartKey}
            locationScores={locationScores}
            filteredSales={filteredSales}
            salesByOrderType={salesByOrderType}
            dateRange={dateRange}
          />
        )}

        {activeTab === "waste" && (
          <WasteTracker
            key={chartKey}
            wasteByLocation={wasteByLocation}
            wasteByCategory={wasteByCategory}
            onSelectLocation={handleSelectLocation}
            dateRange={dateRange}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4 text-center text-xs text-muted-foreground">
        <p>Data Mavericks — The Snowcone Warehouse Challenge</p>
      </footer>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
