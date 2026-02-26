import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ── Summary Card Skeleton ─────────────────────────────────────────────────────
export function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <div className="flex items-center gap-1 mt-3">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Location Scorecard Skeleton ───────────────────────────────────────────────
export function LocationScorecardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="text-right py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </th>
                <th className="text-right py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </th>
                <th className="text-center py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </th>
                <th className="text-center py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-14 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 px-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-6 w-20 mx-auto rounded-full" />
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

// ── Chart Card Skeleton ───────────────────────────────────────────────────────
export function ChartCardSkeleton({ title = true }: { title?: boolean }) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Revenue Trend Chart Skeleton ──────────────────────────────────────────────
export function RevenueTrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="h-64 space-y-2">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sales Pie Chart Skeleton ──────────────────────────────────────────────────
export function SalesPieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Revenue Bar Chart Skeleton ────────────────────────────────────────────────
export function RevenueBarChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Location Revenue Chart Skeleton ───────────────────────────────────────────
export function LocationRevenueChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Order Type Trend Chart Skeleton ───────────────────────────────────────────
export function OrderTypeTrendChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-52" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Waste Bar Chart Skeleton ──────────────────────────────────────────────────
export function WasteBarChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

// ── Waste Cost Pie Chart Skeleton ─────────────────────────────────────────────
export function WasteCostPieChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Waste Location Table Skeleton ─────────────────────────────────────────────
export function WasteLocationTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-16" />
                </th>
                <th className="text-right py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </th>
                <th className="text-right py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </th>
                <th className="text-center py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </th>
                <th className="text-center py-3 px-2 font-medium">
                  <Skeleton className="h-4 w-14 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-3 px-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-4 w-14 mx-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <Skeleton className="h-6 w-28 mx-auto rounded-full" />
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

// ── Overview Page Skeleton ────────────────────────────────────────────────────
export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </div>

      {/* Location Scorecard */}
      <LocationScorecardSkeleton />

      {/* Quick Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueTrendChartSkeleton />
        <SalesPieChartSkeleton />
      </div>
    </div>
  );
}

// ── Sales Analysis Page Skeleton ──────────────────────────────────────────────
export function SalesAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Order Type Breakdown */}
      <RevenueBarChartSkeleton />

      {/* Revenue by Location */}
      <LocationRevenueChartSkeleton />

      {/* Daily Trend by Order Type */}
      <OrderTypeTrendChartSkeleton />
    </div>
  );
}

// ── Waste Tracker Page Skeleton ───────────────────────────────────────────────
export function WasteTrackerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Waste Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WasteBarChartSkeleton />
        <WasteCostPieChartSkeleton />
      </div>

      {/* Waste by Location Table */}
      <WasteLocationTableSkeleton />
    </div>
  );
}

// ── Location Detail Page Skeleton ─────────────────────────────────────────────
export function LocationDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Location Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>

        {/* Inventory & Reviews Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-24 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-12 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-24 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ── App Loading Skeleton ──────────────────────────────────────────────────────
export function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-9 w-28" />
              </div>
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Content */}
        <OverviewSkeleton />
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4 text-center">
        <Skeleton className="h-3 w-52 mx-auto" />
      </footer>
    </div>
  );
}