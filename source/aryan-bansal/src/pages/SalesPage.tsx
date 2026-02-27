import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/SalesChart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSnowflake } from "@/hooks/useSnowflake";
import {
    buildTrendQuery,
    buildScorecardQuery,
    buildCompanyAvgQuery,
} from "@/lib/queries";
import type { ScorecardRow, TrendRow, DateRange } from "@/types/schema";

interface SalesPageProps {
    dateRange: DateRange;
}

export default function SalesPage({ dateRange }: SalesPageProps) {
    const [locationFilter, setLocationFilter] = useState<string>("all");

    // Fetch location list
    const scorecardSql = useMemo(
        () => buildScorecardQuery(dateRange.from, dateRange.to),
        [dateRange]
    );
    const { data: locations } = useSnowflake<ScorecardRow>(scorecardSql);

    // Fetch trend data
    const trendSql = useMemo(
        () =>
            buildTrendQuery(
                dateRange.from,
                dateRange.to,
                locationFilter === "all" ? undefined : Number(locationFilter)
            ),
        [dateRange, locationFilter]
    );
    const { data: trends, loading: trendsLoading } =
        useSnowflake<TrendRow>(trendSql);

    // Company average
    const companyAvgSql = useMemo(
        () =>
            locationFilter !== "all"
                ? buildCompanyAvgQuery(dateRange.from, dateRange.to)
                : null,
        [dateRange, locationFilter]
    );
    const { data: companyAvg } = useSnowflake<{
        SALE_DATE: string;
        AVG_DAILY_REVENUE: string;
    }>(companyAvgSql);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Sales Trends</h2>
                    <p className="text-sm text-muted-foreground">
                        {locationFilter === "all"
                            ? "Total revenue across all locations"
                            : "Compare this store vs. the per-location daily average"}
                    </p>
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((loc) => (
                            <SelectItem key={loc.LOCATION_ID} value={loc.LOCATION_ID}>
                                {loc.NAME}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {locationFilter === "all"
                            ? "All Locations — Combined Revenue"
                            : `${locations.find((l) => l.LOCATION_ID === locationFilter)
                                ?.NAME ?? "Location"
                            } Revenue`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesChart
                        data={trends}
                        loading={trendsLoading}
                        companyAvg={
                            locationFilter !== "all" ? companyAvg : undefined
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
