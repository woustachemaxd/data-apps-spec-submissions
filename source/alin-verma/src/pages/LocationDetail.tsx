import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChevronLeft,
  MapPin,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  AlertTriangle,
  GitCompare,
  Calendar,
} from "lucide-react";
import type {
  LocationScore,
  DailySale,
  CustomerReview,
  InventoryRecord,
  InventorySummaryItem,
  DateRange,
} from "@/types";
import { WASTE_THRESHOLD } from "@/types";
import { Chatbot } from "@/components/Chatbot";

interface LocationDetailProps {
  locationScore: LocationScore;
  sales: DailySale[];
  reviews: CustomerReview[];
  inventory: InventoryRecord[];
  onBack: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onCompare: (location: LocationScore) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

export function LocationDetail({
  locationScore,
  sales,
  reviews,
  inventory,
  onBack,
  darkMode,
  setDarkMode,
  onCompare,
  dateRange,
  setDateRange,
}: LocationDetailProps) {
  const { location } = locationScore;

  // Sales chart data
  const salesTrend = useMemo(() => {
    const byDate: Record<string, number> = {};
    sales.forEach((s) => {
      byDate[s.SALE_DATE] = (byDate[s.SALE_DATE] || 0) + Number(s.REVENUE);
    });
    return Object.entries(byDate)
      .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sales]);

  // Order type breakdown
  const orderTypeBreakdown = useMemo(() => {
    const byType: Record<string, number> = {};
    sales.forEach((s) => {
      byType[s.ORDER_TYPE] = (byType[s.ORDER_TYPE] || 0) + Number(s.REVENUE);
    });
    return Object.entries(byType).map(([type, revenue]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
      value: Math.round(revenue),
    }));
  }, [sales]);

  // Inventory summary
  const inventorySummary = useMemo((): InventorySummaryItem[] => {
    const byCategory: Record<
      string,
      { received: number; used: number; wasted: number; cost: number }
    > = {};
    inventory.forEach((i) => {
      if (!byCategory[i.CATEGORY]) {
        byCategory[i.CATEGORY] = { received: 0, used: 0, wasted: 0, cost: 0 };
      }
      byCategory[i.CATEGORY].received += Number(i.UNITS_RECEIVED);
      byCategory[i.CATEGORY].used += Number(i.UNITS_USED);
      byCategory[i.CATEGORY].wasted += Number(i.UNITS_WASTED);
      byCategory[i.CATEGORY].cost += Number(i.WASTE_COST);
    });
    return Object.entries(byCategory).map(([category, data]) => ({
      category:
        category.charAt(0).toUpperCase() +
        category.slice(1).replace("_", " "),
      ...data,
      wasteRate:
        data.received > 0 ? (data.wasted / data.received) * 100 : 0,
    }));
  }, [inventory]);

  // Recent reviews
  const recentReviews = useMemo(() => {
    return [...reviews]
      .sort((a, b) => b.REVIEW_DATE.localeCompare(a.REVIEW_DATE))
      .slice(0, 10);
  }, [reviews]);

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
                onClick={() => onCompare(locationScore)}
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
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
        {/* Location Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{location.NAME}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {location.CITY}, {location.STATE}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {location.MANAGER_NAME}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {location.ADDRESS}
            </p>
          </div>

          {locationScore.needsAttention && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Needs Attention</p>
                    <p className="text-xs">
                      {locationScore.attentionReasons.join(", ")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Revenue</span>
              </div>
              <p className="text-xl font-bold">
                ${locationScore.totalRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-xs">Avg Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">
                  {locationScore.avgRating.toFixed(1)}
                </p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(locationScore.avgRating)
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
                <span className="text-xs">Sales Trend</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">
                  {locationScore.trend === "improving"
                    ? "+"
                    : locationScore.trend === "declining"
                    ? ""
                    : ""}
                  {locationScore.trendPercent.toFixed(0)}%
                </p>
                {locationScore.trend === "improving" && (
                  <ArrowUp className="h-5 w-5 text-green-500" />
                )}
                {locationScore.trend === "declining" && (
                  <ArrowDown className="h-5 w-5 text-red-500" />
                )}
                {locationScore.trend === "stable" && (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Open Since</span>
              </div>
              <p className="text-xl font-bold">
                {new Date(location.OPEN_DATE).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
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
                      formatter={(v) => [
                        `$${Number(v).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Order Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderTypeBreakdown.map((_, index) => (
                        <Cell
                          key={index}
                          fill={`var(--chart-${index + 1})`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [
                        `$${Number(v).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory & Reviews Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inventory Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Waste by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inventorySummary.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.wasted} units wasted
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          cat.wasteRate > WASTE_THRESHOLD * 100
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {cat.wasteRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${cat.cost.toFixed(2)} cost
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>{reviews.length} total reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentReviews.map((review) => (
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
                    <p className="text-sm text-muted-foreground">
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

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Manager</p>
                <p className="font-medium">{location.MANAGER_NAME}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Seating Capacity</p>
                <p className="font-medium">{location.SEATING_CAPACITY} seats</p>
              </div>
              <div>
                <p className="text-muted-foreground">Open Date</p>
                <p className="font-medium">
                  {new Date(location.OPEN_DATE).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={location.IS_ACTIVE ? "default" : "secondary"}>
                  {location.IS_ACTIVE ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
