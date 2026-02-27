import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WasteTracker from "@/components/dashboard/WasteTracker";
import { useSnowflake } from "@/hooks/useSnowflake";
import { buildWasteByLocationQuery } from "@/lib/queries";
import type { WasteByLocationRow, DateRange } from "@/types/schema";

interface WastePageProps {
    dateRange: DateRange;
}

export default function WastePage({ dateRange }: WastePageProps) {
    const [category, setCategory] = useState("all");

    const wasteSql = useMemo(
        () =>
            buildWasteByLocationQuery(
                dateRange.from,
                dateRange.to,
                category === "all" ? undefined : category
            ),
        [dateRange, category]
    );
    const { data: waste, loading: wasteLoading } =
        useSnowflake<WasteByLocationRow>(wasteSql);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold tracking-tight">Waste Tracker</h2>
                <p className="text-sm text-muted-foreground">
                    Inventory waste by location — flag stores with excessive waste
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Waste Cost by Location
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <WasteTracker
                        data={waste}
                        loading={wasteLoading}
                        selectedCategory={category}
                        onCategoryChange={setCategory}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
