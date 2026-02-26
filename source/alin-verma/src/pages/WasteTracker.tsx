import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WasteBarChart, WasteCostPieChart } from "@/components/dashboard";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import type { WasteByLocation, WasteCategoryData, DateRange } from "@/types";
import { WASTE_THRESHOLD } from "@/types";

interface WasteTrackerProps {
  wasteByLocation: WasteByLocation[];
  wasteByCategory: WasteCategoryData[];
  onSelectLocation: (location: WasteByLocation) => void;
  dateRange: DateRange;
}

export function WasteTracker({
  wasteByLocation,
  wasteByCategory,
  onSelectLocation,
  dateRange,
}: WasteTrackerProps) {
  // Calculate time period description
  const timePeriod = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "1 day";
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.round(diffDays / 7)} weeks`;
    if (diffDays <= 90) return `${Math.round(diffDays / 30)} months`;
    if (diffDays <= 365) return `${Math.round(diffDays / 30)} months`;
    return "year";
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Waste Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WasteBarChart data={wasteByCategory} />
        <WasteCostPieChart data={wasteByCategory} />
      </div>

      {/* Waste by Location Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waste by Location</CardTitle>
          <CardDescription>
            Locations with waste rate above {(WASTE_THRESHOLD * 100).toFixed(0)}
            % are flagged
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Location</th>
                  <th className="text-right py-3 px-2 font-medium">
                    Waste Rate
                  </th>
                  <th className="text-right py-3 px-2 font-medium">
                    Waste Cost
                  </th>
                  <th className="text-center py-3 px-2 font-medium">Trend</th>
                  <th className="text-center py-3 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {wasteByLocation
                  .sort((a, b) => {
                    // First, sort by threshold status (above threshold comes first)
                    if (a.aboveThreshold && !b.aboveThreshold) return -1;
                    if (!a.aboveThreshold && b.aboveThreshold) return 1;
                    // Then sort by waste rate (highest first)
                    return b.wasteRate - a.wasteRate;
                  })
                  .map((loc) => (
                    <tr
                      key={loc.location.LOCATION_ID}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => onSelectLocation(loc)}
                    >
                      <td className="py-3 px-2">
                        <p className="font-medium">{loc.location.NAME}</p>
                        <p className="text-xs text-muted-foreground">
                          {loc.location.CITY}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={
                            loc.aboveThreshold
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {loc.wasteRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        ${loc.wasteCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1">
                            {loc.wasteTrend === "improving" && (
                              <>
                                <TrendingDown className="h-4 w-4 text-green-500" />
                                <span className="text-green-600 text-xs font-medium">
                                  Better
                                </span>
                              </>
                            )}
                            {loc.wasteTrend === "worsening" && (
                              <>
                                <TrendingUp className="h-4 w-4 text-red-500" />
                                <span className="text-red-600 text-xs font-medium">
                                  Worse
                                </span>
                              </>
                            )}
                            {loc.wasteTrend === "stable" && (
                              <span className="text-muted-foreground text-xs">
                                Stable
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">vs {timePeriod}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center">
                          {loc.aboveThreshold ? (
                            <div 
                              className="relative group"
                              title={`Waste rate ${loc.wasteRate.toFixed(1)}% exceeds ${(WASTE_THRESHOLD * 100).toFixed(0)}% threshold`}
                            >
                              <Badge variant="destructive" className="gap-1 cursor-help">
                                <AlertTriangle className="h-3 w-3" />
                                Above Threshold
                              </Badge>
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg border p-2 min-w-48 max-w-64">
                                  <p className="font-semibold mb-1 text-destructive">High Waste Alert:</p>
                                  <ul className="space-y-1">
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-destructive mt-0.5">•</span>
                                      <span>Waste rate: <strong>{loc.wasteRate.toFixed(1)}%</strong> (threshold: {(WASTE_THRESHOLD * 100).toFixed(0)}%)</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-destructive mt-0.5">•</span>
                                      <span>Waste cost: <strong>${loc.wasteCost.toFixed(2)}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                      <span className="text-destructive mt-0.5">•</span>
                                      <span>Units wasted: <strong>{loc.totalWaste}</strong></span>
                                    </li>
                                    {loc.wasteTrend === "worsening" && (
                                      <li className="flex items-start gap-1.5">
                                        <span className="text-destructive mt-0.5">•</span>
                                        <span className="text-red-600 font-medium">Trend: Getting worse</span>
                                      </li>
                                    )}
                                  </ul>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                    <div className="border-4 border-transparent border-t-popover" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            >
                              Normal
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}