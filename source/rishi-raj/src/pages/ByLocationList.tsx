import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DateRangeSelector } from "@/components/DateRangeSelector";
import { useDateRange } from "@/hooks/useDateRange";
import { useLocationData } from "@/hooks/useLocationData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ScorecardSortKey = "name" | "revenue" | "avgRating" | "trend";
type ScorecardSortDir = "asc" | "desc";

export default function ByLocationListPage() {
  const { range, error: rangeError } = useDateRange();

  // We only need the scorecard; pass a dummy locationId so the hook runs.
  const locationData = useLocationData(range, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Locations Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Scorecard of all locations with revenue, rating, and trend.
          </p>
        </div>
        <DateRangeSelector />
      </div>

      {(rangeError || locationData.error) && (
        <Card>
          <CardContent className="py-3 text-sm text-destructive">
            {rangeError || locationData.error}
          </CardContent>
        </Card>
      )}

      <LocationScorecardTable locationData={locationData} />
    </div>
  );
}

function LocationScorecardTable({
  locationData,
}: {
  locationData: ReturnType<typeof useLocationData>;
}) {
  const [sortKey, setSortKey] = useState<ScorecardSortKey>("revenue");
  const [sortDir, setSortDir] = useState<ScorecardSortDir>("desc");
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const base = locationData.scorecard;
    const sorted = [...base].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return direction * a.name.localeCompare(b.name);
        case "revenue":
          return direction * (a.revenue - b.revenue);
        case "avgRating":
          return (
            direction *
            (((a.avgRating ?? -Infinity) as number) -
              ((b.avgRating ?? -Infinity) as number))
          );
        case "trend":
          return (
            direction *
            (((a.revenueTrendPct ?? -Infinity) as number) -
              ((b.revenueTrendPct ?? -Infinity) as number))
          );
        default:
          return 0;
      }
    });
    return sorted;
  }, [locationData.scorecard, sortKey, sortDir]);

  function toggleSort(key: ScorecardSortKey) {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDir(key === "name" ? "asc" : "desc");
      return key;
    });
  }

  const sortIndicator = (key: ScorecardSortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "↑" : "↓";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Scorecard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Click a row to drill down into a specific location.
        </p>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No data for this date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Location {sortIndicator("name")}
                    </button>
                  </th>
                  <th className="py-2 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("revenue")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Revenue {sortIndicator("revenue")}
                    </button>
                  </th>
                  <th className="py-2 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("avgRating")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Avg Rating {sortIndicator("avgRating")}
                    </button>
                  </th>
                  <th className="py-2 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("trend")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Trend {sortIndicator("trend")}
                    </button>
                  </th>
                  <th className="py-2 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const needsAttention =
                    (row.revenueTrendPct ?? 0) < -5 ||
                    (row.avgRating ?? 5) < 3.5;
                  return (
                    <tr
                      key={row.locationId}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/60"
                      onClick={() => navigate(`/by-location/${row.locationId}`)}
                    >
                      <td className="py-1.5 pr-2 align-top">
                        <div className="font-medium text-xs">{row.name}</div>
                        <div className="text-[0.7rem] text-muted-foreground">
                          {row.city}, {row.state}
                        </div>
                      </td>
                      <td className="py-1.5 pr-2 align-top text-right font-mono text-xs">
                        ${row.revenue.toLocaleString()}
                      </td>
                      <td className="py-1.5 pr-2 align-top text-right text-xs">
                        {row.avgRating == null
                          ? "—"
                          : row.avgRating.toFixed(1)}
                      </td>
                      <td className="py-1.5 pr-2 align-top text-right text-xs">
                        {row.revenueTrendPct == null
                          ? "—"
                          : `${row.revenueTrendPct.toFixed(1)}%`}
                      </td>
                      <td className="py-1.5 pr-0 align-top text-right text-xs">
                        {needsAttention ? (
                          <Badge variant="destructive">Attention</Badge>
                        ) : (
                          <Badge variant="secondary">Healthy</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

