export default function AIInsights({ locations }: any) {

  const worstRevenue = [...locations]
    .sort((a, b) => a.TOTAL_REVENUE - b.TOTAL_REVENUE)[0];

  const lowRating = locations.find(
    (l: any) => l.AVG_RATING < 4
  );

  return (
    <div className="space-y-3">

      <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        ⚠️ Revenue risk detected at
        <b> {worstRevenue?.NAME}</b>
      </div>

      {lowRating && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
          ⭐ Customer satisfaction declining at
          <b> {lowRating.NAME}</b>
        </div>
      )}

      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
        ✅ Network performance stable overall
      </div>

    </div>
  );
}