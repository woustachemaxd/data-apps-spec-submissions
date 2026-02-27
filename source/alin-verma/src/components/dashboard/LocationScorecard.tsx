import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Minus,
  Search,
  X,
  Star,
} from "lucide-react";
import type { LocationScore } from "@/types";

interface LocationScorecardProps {
  locationScores: LocationScore[];
  onSelectLocation: (location: LocationScore) => void;
}

type SortField = "revenue" | "rating" | "trend";

export function LocationScorecard({
  locationScores,
  onSelectLocation,
}: LocationScorecardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let filtered = locationScores;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.location.NAME.toLowerCase().includes(query) ||
          s.location.CITY.toLowerCase().includes(query) ||
          s.location.MANAGER_NAME.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      // First, sort by attention status (attention items come first)
      if (a.needsAttention && !b.needsAttention) return -1;
      if (!a.needsAttention && b.needsAttention) return 1;
      
      // Then sort by the selected sort field
      let comparison = 0;
      if (sortField === "revenue")
        comparison = a.totalRevenue - b.totalRevenue;
      else if (sortField === "rating") comparison = a.avgRating - b.avgRating;
      else if (sortField === "trend")
        comparison = a.trendPercent - b.trendPercent;

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [locationScores, searchQuery, sortField, sortDirection]);

  // Handle sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Location Scorecard</CardTitle>
            <CardDescription>Click on a location for detailed view</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg bg-background text-sm w-full sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Location</th>
                <th
                  className="text-right py-3 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort("revenue")}
                >
                  Revenue{" "}
                  {sortField === "revenue" &&
                    (sortDirection === "desc" ? "↓" : "↑")}
                </th>
                <th
                  className="text-right py-3 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort("rating")}
                >
                  Rating{" "}
                  {sortField === "rating" &&
                    (sortDirection === "desc" ? "↓" : "↑")}
                </th>
                <th
                  className="text-center py-3 px-2 font-medium cursor-pointer hover:text-primary"
                  onClick={() => handleSort("trend")}
                >
                  Trend{" "}
                  {sortField === "trend" &&
                    (sortDirection === "desc" ? "↓" : "↑")}
                </th>
                <th className="text-center py-3 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((score) => (
                <tr
                  key={score.location.LOCATION_ID}
                  onClick={() => onSelectLocation(score)}
                  className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium">{score.location.NAME}</p>
                      <p className="text-xs text-muted-foreground">
                        {score.location.CITY}, {score.location.STATE}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    ${score.totalRevenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{score.avgRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-1">
                      {score.trend === "improving" && (
                        <>
                          <ArrowUp className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">
                            +{score.trendPercent.toFixed(0)}%
                          </span>
                        </>
                      )}
                      {score.trend === "declining" && (
                        <>
                          <ArrowDown className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 font-medium">
                            {score.trendPercent.toFixed(0)}%
                          </span>
                        </>
                      )}
                      {score.trend === "stable" && (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Stable</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex justify-center">
                      {score.needsAttention ? (
                        <div 
                          className="relative group"
                          title={score.attentionReasons.join(", ")}
                        >
                          <Badge variant="destructive" className="gap-1 cursor-help">
                            <AlertTriangle className="h-3 w-3" />
                            Attention
                          </Badge>
                          {/* Tooltip on hover */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-[60]">
                            <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg border p-2 min-w-48 max-w-64">
                              <p className="font-semibold mb-1 text-destructive">Needs Attention:</p>
                              <ul className="space-y-1">
                                {score.attentionReasons.map((reason, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-destructive mt-0.5">•</span>
                                    <span>{reason}</span>
                                  </li>
                                ))}
                              </ul>
                              {/* Arrow */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
                                <div className="border-4 border-transparent border-b-popover" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          OK
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
  );
}