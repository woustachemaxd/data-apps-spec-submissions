import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import {
  ChevronLeft,
  Plus,
  X,
  MapPin,
  DollarSign,
  Star,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Trash2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import type {
  LocationScore,
  DailySale,
  InventoryRecord,
  DateRange,
} from "@/types";
import { Chatbot } from "@/components/Chatbot";

interface LocationCompareProps {
  selectedLocations: LocationScore[];
  allLocations: LocationScore[];
  sales: DailySale[];
  inventory: InventoryRecord[];
  onBack: () => void;
  onAddLocation: (location: LocationScore) => void;
  onRemoveLocation: (locationId: number) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

// Color palette for compared locations
const LOCATION_COLORS = [
  "var(--chart-1)", // Blue
  "var(--chart-2)", // Green  
  "var(--chart-3)", // Orange
];

export function LocationCompare({
  selectedLocations,
  allLocations,
  sales,
  inventory,
  onBack,
  onAddLocation,
  onRemoveLocation,
  dateRange,
  setDateRange,
  darkMode,
  setDarkMode,
}: LocationCompareProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Get available locations (not already selected)
  const availableLocations = useMemo(() => {
    const selectedIds = new Set(selectedLocations.map((l) => l.location.LOCATION_ID));
    return allLocations.filter((l) => !selectedIds.has(l.location.LOCATION_ID));
  }, [allLocations, selectedLocations]);

  // Sales data by location for comparison
  const salesByLocation = useMemo(() => {
    const result: Record<number, DailySale[]> = {};
    selectedLocations.forEach((loc) => {
      result[loc.location.LOCATION_ID] = sales.filter(
        (s) => Number(s.LOCATION_ID) === Number(loc.location.LOCATION_ID)
      );
    });
    return result;
  }, [selectedLocations, sales]);

  // Inventory data by location for comparison
  const inventoryByLocation = useMemo(() => {
    const result: Record<number, InventoryRecord[]> = {};
    selectedLocations.forEach((loc) => {
      result[loc.location.LOCATION_ID] = inventory.filter(
        (i) => Number(i.LOCATION_ID) === Number(loc.location.LOCATION_ID)
      );
    });
    return result;
  }, [selectedLocations, inventory]);

  // Revenue trend comparison data
  const revenueTrendComparison = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {};
    
    selectedLocations.forEach((loc) => {
      const locSales = salesByLocation[loc.location.LOCATION_ID] || [];
      locSales.forEach((s) => {
        if (!byDate[s.SALE_DATE]) {
          byDate[s.SALE_DATE] = {};
        }
        byDate[s.SALE_DATE][loc.location.NAME] = 
          (byDate[s.SALE_DATE][loc.location.NAME] || 0) + Number(s.REVENUE);
      });
    });

    return Object.entries(byDate)
      .map(([date, locations]) => {
        const entry: { date: string; [key: string]: string | number } = { date };
        selectedLocations.forEach((loc) => {
          entry[loc.location.NAME] = Math.round(locations[loc.location.NAME] || 0);
        });
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedLocations, salesByLocation]);

  // Order type comparison data
  const orderTypeComparison = useMemo(() => {
    const result: { name: string; [key: string]: string | number }[] = [];
    const orderTypes = ["dine-in", "takeout", "delivery"];
    
    orderTypes.forEach((type) => {
      const entry: Record<string, string | number> = {
        name: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
      };
      
      selectedLocations.forEach((loc) => {
        const locSales = salesByLocation[loc.location.LOCATION_ID] || [];
        const typeRevenue = locSales
          .filter((s) => s.ORDER_TYPE === type)
          .reduce((sum, s) => sum + Number(s.REVENUE), 0);
        entry[loc.location.NAME] = Math.round(typeRevenue);
      });
      
      result.push(entry);
    });
    
    return result;
  }, [selectedLocations, salesByLocation]);

  // Waste comparison data
  const wasteComparison = useMemo(() => {
    return selectedLocations.map((loc) => {
      const locInventory = inventoryByLocation[loc.location.LOCATION_ID] || [];
      const totalWaste = locInventory.reduce((sum, i) => sum + Number(i.UNITS_WASTED), 0);
      const wasteCost = locInventory.reduce((sum, i) => sum + Number(i.WASTE_COST), 0);
      const totalReceived = locInventory.reduce((sum, i) => sum + Number(i.UNITS_RECEIVED), 0);
      
      return {
        name: loc.location.NAME,
        city: loc.location.CITY,
        totalWaste,
        wasteCost: Math.round(wasteCost * 100) / 100,
        wasteRate: totalReceived > 0 ? (totalWaste / totalReceived) * 100 : 0,
      };
    });
  }, [selectedLocations, inventoryByLocation]);

  // Waste by category comparison
  const wasteByCategoryComparison = useMemo(() => {
    const categories = ["produce", "dairy", "supplies", "packaging"];
    
    return categories.map((category) => {
      const entry: Record<string, string | number> = {
        category: category.charAt(0).toUpperCase() + category.slice(1),
      };
      
      selectedLocations.forEach((loc) => {
        const locInventory = inventoryByLocation[loc.location.LOCATION_ID] || [];
        const categoryWaste = locInventory
          .filter((i) => i.CATEGORY === category)
          .reduce((sum, i) => sum + Number(i.UNITS_WASTED), 0);
        entry[loc.location.NAME] = categoryWaste;
      });
      
      return entry;
    });
  }, [selectedLocations, inventoryByLocation]);

  // Summary comparison metrics
  const summaryComparison = useMemo(() => {
    return selectedLocations.map((loc) => ({
      name: loc.location.NAME,
      city: loc.location.CITY,
      revenue: loc.totalRevenue,
      rating: loc.avgRating,
      reviewCount: loc.reviewCount,
      trend: loc.trend,
      trendPercent: loc.trendPercent,
      needsAttention: loc.needsAttention,
      attentionReasons: loc.attentionReasons,
    }));
  }, [selectedLocations]);

  const canAddMore = selectedLocations.length < 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              {/* Date Range Filter */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="bg-background border rounded px-2 py-1 text-sm"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="bg-background border rounded px-2 py-1 text-sm"
                />
              </div>
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
        {/* Title and Add Location */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Location Comparison</h1>
            <p className="text-sm text-muted-foreground">
              Compare performance metrics across {selectedLocations.length} location{selectedLocations.length !== 1 ? "s" : ""}
            </p>
          </div>
          
          {canAddMore && (
            <Button
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          )}
        </div>

        {/* Location Picker Dropdown */}
        {showLocationPicker && canAddMore && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Select a Location to Add</CardTitle>
              <CardDescription>
                {availableLocations.length} location{availableLocations.length !== 1 ? "s" : ""} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableLocations.map((loc) => (
                  <Button
                    key={loc.location.LOCATION_ID}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => {
                      onAddLocation(loc);
                      setShowLocationPicker(false);
                    }}
                  >
                    <div className="text-left">
                      <p className="font-medium">{loc.location.NAME}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.location.CITY}, {loc.location.STATE}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
              {availableLocations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All locations are already selected
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Locations Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedLocations.map((loc, index) => (
            <Card key={loc.location.LOCATION_ID} className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => onRemoveLocation(loc.location.LOCATION_ID)}
              >
                <X className="h-4 w-4" />
              </Button>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div
                    className="h-3 w-3 rounded-full mt-1.5"
                    style={{ backgroundColor: LOCATION_COLORS[index] }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{loc.location.NAME}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {loc.location.CITY}, {loc.location.STATE}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-bold">${loc.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <p className="font-bold">{loc.avgRating.toFixed(1)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <div className="flex items-center gap-1">
                      {loc.trend === "improving" && (
                        <>
                          <ArrowUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 font-medium text-sm">
                            +{loc.trendPercent.toFixed(0)}%
                          </span>
                        </>
                      )}
                      {loc.trend === "declining" && (
                        <>
                          <ArrowDown className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 font-medium text-sm">
                            {loc.trendPercent.toFixed(0)}%
                          </span>
                        </>
                      )}
                      {loc.trend === "stable" && (
                        <>
                          <Minus className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">Stable</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {loc.needsAttention ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Attention
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        OK
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add Location Placeholder */}
          {canAddMore && selectedLocations.length > 0 && (
            <Card
              className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowLocationPicker(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full py-8">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Add Location</p>
                <p className="text-xs text-muted-foreground">
                  {3 - selectedLocations.length} more available
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {selectedLocations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Locations Selected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add 2-3 locations to compare their performance
              </p>
              <Button onClick={() => setShowLocationPicker(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Locations
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedLocations.length > 0 && (
          <>
            {/* Summary Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Comparison</CardTitle>
                <CardDescription>Key metrics side by side</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Metric</th>
                        {selectedLocations.map((loc, index) => (
                          <th key={loc.location.LOCATION_ID} className="text-right py-3 px-2 font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: LOCATION_COLORS[index] }}
                              />
                              {loc.location.NAME}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-2 text-muted-foreground">Total Revenue</td>
                        {selectedLocations.map((loc) => (
                          <td key={loc.location.LOCATION_ID} className="text-right py-3 px-2 font-mono">
                            ${loc.totalRevenue.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-2 text-muted-foreground">Avg Rating</td>
                        {selectedLocations.map((loc) => (
                          <td key={loc.location.LOCATION_ID} className="text-right py-3 px-2">
                            <span className="font-medium">{loc.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              ({loc.reviewCount} reviews)
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-2 text-muted-foreground">Sales Trend</td>
                        {selectedLocations.map((loc) => (
                          <td key={loc.location.LOCATION_ID} className="text-right py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              {loc.trend === "improving" && (
                                <>
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">+{loc.trendPercent.toFixed(0)}%</span>
                                </>
                              )}
                              {loc.trend === "declining" && (
                                <>
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600">{loc.trendPercent.toFixed(0)}%</span>
                                </>
                              )}
                              {loc.trend === "stable" && (
                                <>
                                  <Minus className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Stable</span>
                                </>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-2 text-muted-foreground">Waste Cost</td>
                        {wasteComparison.map((w) => (
                          <td key={w.name} className="text-right py-3 px-2 font-mono">
                            ${w.wasteCost.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-2 text-muted-foreground">Waste Rate</td>
                        {wasteComparison.map((w) => (
                          <td key={w.name} className="text-right py-3 px-2">
                            <span className={w.wasteRate > 10 ? "text-red-600 font-medium" : ""}>
                              {w.wasteRate.toFixed(1)}%
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trend Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend Comparison</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrendComparison}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                      />
                      <Legend />
                      {selectedLocations.map((loc, index) => (
                        <Line
                          key={loc.location.LOCATION_ID}
                          type="monotone"
                          dataKey={loc.location.NAME}
                          stroke={LOCATION_COLORS[index]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Type Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Order Type</CardTitle>
                <CardDescription>Revenue breakdown by order type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderTypeComparison}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                      />
                      <Legend />
                      {selectedLocations.map((loc, index) => (
                        <Bar
                          key={loc.location.LOCATION_ID}
                          dataKey={loc.location.NAME}
                          fill={LOCATION_COLORS[index]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Waste Comparison Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Total Waste Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Waste Comparison</CardTitle>
                  <CardDescription>Units wasted by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wasteComparison}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar
                          dataKey="totalWaste"
                          fill="var(--chart-4)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Waste by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Waste by Category</CardTitle>
                  <CardDescription>Units wasted per category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wasteByCategoryComparison}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        {selectedLocations.map((loc, index) => (
                          <Bar
                            key={loc.location.LOCATION_ID}
                            dataKey={loc.location.NAME}
                            fill={LOCATION_COLORS[index]}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Waste Cost Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Waste Cost Analysis</CardTitle>
                <CardDescription>Financial impact of waste by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {wasteComparison.map((w, index) => (
                    <div
                      key={w.name}
                      className="p-4 rounded-lg bg-muted/50 border-l-4"
                      style={{ borderLeftColor: LOCATION_COLORS[index] }}
                    >
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.city}</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Waste Cost:</span>
                          <span className="font-medium">${w.wasteCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Waste Rate:</span>
                          <span className={`font-medium ${w.wasteRate > 10 ? "text-red-600" : ""}`}>
                            {w.wasteRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Units Wasted:</span>
                          <span className="font-medium">{w.totalWaste}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
