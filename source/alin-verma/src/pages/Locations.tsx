import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  X,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationScore, CustomerReview, DateRange } from "@/types";

interface LocationsProps {
  locationScores: LocationScore[];
  reviews: CustomerReview[];
  onSelectLocation: (location: LocationScore) => void;
  onCompare: (location: LocationScore) => void;
  dateRange: DateRange;
}

export function Locations({
  locationScores,
  reviews,
  onSelectLocation,
  onCompare,
  dateRange,
}: LocationsProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"revenue" | "rating" | "trend">("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  // Filter locations
  const filteredLocations = useMemo(() => {
    return locationScores.filter((s) => {
      const searchLower = search.toLowerCase();
      return (
        s.location.NAME.toLowerCase().includes(searchLower) ||
        s.location.CITY.toLowerCase().includes(searchLower) ||
        s.location.MANAGER_NAME.toLowerCase().includes(searchLower)
      );
    });
  }, [locationScores, search]);

  // Sort locations - attention items first, then by sort key
  const sortedLocations = useMemo(() => {
    return [...filteredLocations].sort((a, b) => {
      // First, sort by attention status (attention items come first)
      if (a.needsAttention && !b.needsAttention) return -1;
      if (!a.needsAttention && b.needsAttention) return 1;
      
      // Then sort by the selected sort key
      let aVal: number, bVal: number;
      if (sortKey === "revenue") {
        aVal = a.totalRevenue;
        bVal = b.totalRevenue;
      } else if (sortKey === "rating") {
        aVal = a.avgRating;
        bVal = b.avgRating;
      } else {
        aVal = a.trendPercent;
        bVal = b.trendPercent;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredLocations, sortKey, sortDir]);

  // Aggregate review stats
  const reviewStats = useMemo(() => {
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + Number(r.RATING), 0) / totalReviews
        : 0;
    
    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rating = Math.round(Number(r.RATING));
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    // Recent reviews (last 10)
    const recentReviews = [...reviews]
      .sort((a, b) => b.REVIEW_DATE.localeCompare(a.REVIEW_DATE))
      .slice(0, 10);

    return { totalReviews, avgRating, distribution, recentReviews };
  }, [reviews]);

  // Location ratings breakdown
  const locationRatings = useMemo(() => {
    return locationScores
      .map((s) => ({
        name: s.location.NAME,
        city: s.location.CITY,
        rating: s.avgRating,
        reviewCount: s.reviewCount,
      }))
      .sort((a, b) => b.rating - a.rating);
  }, [locationScores]);

  const handleSort = (key: "revenue" | "rating" | "trend") => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Total Reviews</span>
            </div>
            <p className="text-xl font-bold">{reviewStats.totalReviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs">Avg Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">{reviewStats.avgRating.toFixed(1)}</p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(reviewStats.avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">5-Star Reviews</span>
            </div>
            <p className="text-xl font-bold">{reviewStats.distribution[5]}</p>
            <p className="text-xs text-muted-foreground">
              {reviewStats.totalReviews > 0
                ? ((reviewStats.distribution[5] / reviewStats.totalReviews) * 100).toFixed(0)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Low Ratings (1-2)</span>
            </div>
            <p className="text-xl font-bold text-destructive">
              {reviewStats.distribution[1] + reviewStats.distribution[2]}
            </p>
            <p className="text-xs text-muted-foreground">
              {reviewStats.totalReviews > 0
                ? (((reviewStats.distribution[1] + reviewStats.distribution[2]) /
                    reviewStats.totalReviews) *
                  100).toFixed(0)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Location Scorecard with Search */}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg bg-background text-sm w-full sm:w-64"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Location</th>
                  <th
                    className="text-right py-3 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue{" "}
                    {sortKey === "revenue" &&
                      (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                  <th
                    className="text-right py-3 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort("rating")}
                  >
                    Rating{" "}
                    {sortKey === "rating" &&
                      (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                  <th
                    className="text-center py-3 px-2 font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleSort("trend")}
                  >
                    Trend{" "}
                    {sortKey === "trend" &&
                      (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="text-center py-3 px-2 font-medium">Status</th>
                  <th className="text-center py-3 px-2 font-medium">Compare</th>
                </tr>
              </thead>
              <tbody>
                {sortedLocations.map((score) => (
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
                        <span className="text-xs text-muted-foreground">
                          ({score.reviewCount})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
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
                        <span className="text-[10px] text-muted-foreground">vs {timePeriod}</span>
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
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
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
                            OK
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompare(score);
                        }}
                        className="gap-1"
                      >
                        <GitCompare className="h-3 w-3" />
                        Compare
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution & Location Rankings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of all customer reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewStats.distribution[rating as keyof typeof reviewStats.distribution];
                const percentage =
                  reviewStats.totalReviews > 0
                    ? (count / reviewStats.totalReviews) * 100
                    : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Location Rankings by Rating</CardTitle>
            <CardDescription>Best to worst rated locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locationRatings.map((loc, index) => (
                <div
                  key={loc.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold w-5 ${
                        index < 3 ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{loc.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({loc.reviewCount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Latest customer feedback across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {reviewStats.recentReviews.map((review) => (
              <div
                key={review.REVIEW_ID}
                className="p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {review.CUSTOMER_NAME}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {Number(review.RATING).toFixed(1)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {review.REVIEW_TEXT}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {review.REVIEW_DATE}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}