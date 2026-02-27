import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import KpiCards from "@/components/dashboard/KpiCards";
import LocationScorecard from "@/components/dashboard/LocationScorecard";
import SalesChart from "@/components/dashboard/SalesChart";
import WasteTracker from "@/components/dashboard/WasteTracker";
import DrillDownSheet from "@/components/dashboard/DrillDownSheet";
import { useSnowflake } from "@/hooks/useSnowflake";
import {
    buildScorecardQuery,
    buildTrendQuery,
    buildWasteByLocationQuery,
    buildCompanyAvgQuery,
} from "@/lib/queries";
import type {
    ScorecardRow,
    TrendRow,
    WasteByLocationRow,
    DateRange,
} from "@/types/schema";

interface DashboardPageProps {
    dateRange: DateRange;
}

export default function DashboardPage({ dateRange }: DashboardPageProps) {
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [wasteCategory, setWasteCategory] = useState("all");

    const filterLocationId =
        locationFilter === "all" ? undefined : Number(locationFilter);

    // Queries
    const scorecardSql = useMemo(
        () => buildScorecardQuery(dateRange.from, dateRange.to),
        [dateRange]
    );
    const trendSql = useMemo(
        () => buildTrendQuery(dateRange.from, dateRange.to, filterLocationId),
        [dateRange, filterLocationId]
    );
    const wasteSql = useMemo(
        () =>
            buildWasteByLocationQuery(
                dateRange.from,
                dateRange.to,
                wasteCategory === "all" ? undefined : wasteCategory
            ),
        [dateRange, wasteCategory]
    );
    const companyAvgSql = useMemo(
        () =>
            filterLocationId
                ? buildCompanyAvgQuery(dateRange.from, dateRange.to)
                : null,
        [dateRange, filterLocationId]
    );

    // Data fetching
    const { data: scorecard, loading: scorecardLoading } =
        useSnowflake<ScorecardRow>(scorecardSql);
    const { data: trends, loading: trendsLoading } =
        useSnowflake<TrendRow>(trendSql);
    const { data: waste, loading: wasteLoading } =
        useSnowflake<WasteByLocationRow>(wasteSql);
    const { data: companyAvg } = useSnowflake<{
        SALE_DATE: string;
        AVG_DAILY_REVENUE: string;
    }>(companyAvgSql);

    // Derived data
    const selectedLocation = useMemo(
        () =>
            scorecard.find((r) => Number(r.LOCATION_ID) === selectedLocationId) ?? null,
        [scorecard, selectedLocationId]
    );

    // For KPI comparison when filtered
    const filteredScorecardData = useMemo(() => {
        if (!filterLocationId) return scorecard;
        return scorecard.filter((r) => Number(r.LOCATION_ID) === filterLocationId);
    }, [scorecard, filterLocationId]);

    const filterLocationName = useMemo(
        () => scorecard.find((r) => Number(r.LOCATION_ID) === filterLocationId)?.NAME,
        [scorecard, filterLocationId]
    );

    return (
        <div className="space-y-6">
            {/* Location Filter Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-[220px]">
                            <span className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="All Locations" />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {scorecard.map((loc) => (
                                <SelectItem key={loc.LOCATION_ID} value={loc.LOCATION_ID}>
                                    {loc.NAME}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {filterLocationId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setLocationFilter("all")}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear filter
                        </Button>
                    )}
                </div>

                {filterLocationId && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        Showing data for{" "}
                        <span className="font-semibold text-foreground">
                            {filterLocationName}
                        </span>{" "}
                        — KPIs compare against company average
                    </p>
                )}
            </div>

            {/* KPI Summary Row */}
            <KpiCards
                data={filteredScorecardData}
                loading={scorecardLoading}
                companyData={filterLocationId ? scorecard : undefined}
            />

            {/* Tabbed content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 h-9">
                    <TabsTrigger value="overview" className="text-xs">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="text-xs">
                        Sales Trends
                    </TabsTrigger>
                    <TabsTrigger value="waste" className="text-xs">
                        Waste Tracker
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                        <Card className="xl:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-base">Location Scorecard</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Click a row to see detailed store analytics
                                </p>
                            </CardHeader>
                            <CardContent>
                                <LocationScorecard
                                    data={scorecard}
                                    loading={scorecardLoading}
                                    onSelectLocation={setSelectedLocationId}
                                />
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {filterLocationId
                                        ? `${filterLocationName} — Revenue`
                                        : "Revenue Trend"}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {filterLocationId
                                        ? "Toggle the checkbox to compare vs. per-location daily average"
                                        : "Daily sales by order type"}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <SalesChart
                                    data={trends}
                                    loading={trendsLoading}
                                    companyAvg={filterLocationId ? companyAvg : undefined}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Sales Tab */}
                <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        {filterLocationId
                                            ? `${filterLocationName} — Historical Sales`
                                            : "Historical Sales"}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {filterLocationId
                                            ? "Revenue stacked by order type — toggle checkbox to compare vs. company average"
                                            : "Revenue stacked by order type (dine-in, takeout, delivery)"}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <SalesChart
                                data={trends}
                                loading={trendsLoading}
                                companyAvg={filterLocationId ? companyAvg : undefined}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Waste Tab */}
                <TabsContent value="waste">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Inventory Waste</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Waste cost by location — worst offenders appear first
                            </p>
                        </CardHeader>
                        <CardContent>
                            <WasteTracker
                                data={waste}
                                loading={wasteLoading}
                                selectedCategory={wasteCategory}
                                onCategoryChange={setWasteCategory}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Drill-Down Sheet */}
            <DrillDownSheet
                open={selectedLocationId !== null}
                onClose={() => setSelectedLocationId(null)}
                location={selectedLocation}
                dateRange={dateRange}
            />
        </div>
    );
}
