import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { LocationScoreboard } from "@/lib/queries";
import { getLocationScorecard } from "@/lib/queries";

// Safe numeric formatter to avoid calling .toFixed on non-numeric values
const fmtFixed = (v: unknown, digits = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
};

export default function LocationScorecardPage() {
  const [locations, setLocations] = useState<LocationScoreboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"revenue" | "rating" | "trend">(
    "revenue"
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getLocationScorecard();
        console.debug("scorecard rows", data.length);
        setLocations(data);
        setError(null);
      } catch (e) {
        console.error("scorecard fetch error", e);
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const data = await getLocationScorecard();
      setLocations(data);
      setError(null);
    } catch (e) {
      console.error("refresh scorecard error", e);
      setError(e instanceof Error ? e.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }

  const sortedLocations = [...locations].sort((a, b) => {
    switch (sortBy) {
      case "revenue":
        return b.TOTAL_REVENUE - a.TOTAL_REVENUE;
      case "rating":
        return b.AVG_RATING - a.AVG_RATING;
      case "trend":
        const trendOrder = { improving: 1, stable: 0, declining: -1 };
        return (
          (trendOrder[b.REVENUE_TREND as keyof typeof trendOrder] || 0) -
          (trendOrder[a.REVENUE_TREND as keyof typeof trendOrder] || 0)
        );
      default:
        return 0;
    }
  });

  // Flag locations needing attention (low rating, declining trend, or low revenue)
  const needsAttention = (loc: LocationScoreboard) => {
    return (
      loc.AVG_RATING < 3.5 ||
      loc.REVENUE_TREND === "declining" ||
      loc.TOTAL_REVENUE < 5000
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="text-xs text-primary hover:underline font-medium"
        >
          ← Back to Dashboard
        </Link>
        <span className="text-xs tracking-widest text-muted-foreground uppercase">
          Location Scorecard
        </span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--page-scorecard)]">Location Scorecard</h1>
          <p className="text-muted-foreground mt-2">
            Performance overview of all stores. Sortable by revenue, rating, or
            trend. Red flags indicate locations needing attention.
          </p>
        </div>

        {/* Sorting Controls */}
        <div className="flex gap-2">
          {(["revenue", "rating", "trend"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading & Error States */}
        {loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading location data...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="font-semibold text-destructive">Error loading data</p>
              <p className="text-sm text-muted-foreground mt-1">There was an issue loading data. Try refreshing.</p>
              <div className="mt-3">
                <button onClick={refresh} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Retry</button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && locations.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No locations found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Snowflake returned no locations. Confirm your database has active locations, then try Refresh.</p>
              <div className="mt-3">
                <button onClick={refresh} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Refresh</button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scorecard Table */}
        {!loading && !error && locations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Locations ({locations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">
                        Location
                      </th>
                      <th className="text-right py-3 px-4 font-semibold">
                        Revenue
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">
                        Rating
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">
                        Reviews
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">
                        Trend
                      </th>
                      <th className="text-center py-3 px-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLocations.map((loc) => (
                      <tr
                        key={loc.LOCATION_ID}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/location/${loc.LOCATION_ID}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {loc.NAME}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {loc.CITY}
                          </p>
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          ${loc.TOTAL_REVENUE.toLocaleString()}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge
                            variant={
                              Number(loc.AVG_RATING) >= 4
                                ? "default"
                                : Number(loc.AVG_RATING) >= 3
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {fmtFixed(loc.AVG_RATING, 1)} ★
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-4 text-muted-foreground">
                          {loc.REVIEWS_COUNT}
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {loc.REVENUE_TREND === "improving" && (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            )}
                            {loc.REVENUE_TREND === "declining" && (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-xs capitalize">
                              {loc.REVENUE_TREND}
                            </span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {needsAttention(loc) && (
                            <div className="flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && !error && locations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue (All Locations)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${locations
                    .reduce((sum, loc) => sum + loc.TOTAL_REVENUE, 0)
                    .toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {fmtFixed(
                    locations.reduce((sum, loc) => sum + loc.AVG_RATING, 0) /
                      locations.length,
                    2
                  )}{" "}
                  ★
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Locations Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {locations.filter(needsAttention).length}/{locations.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}