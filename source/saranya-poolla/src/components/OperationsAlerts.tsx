import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";

export default function OperationsAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadAlerts() {

      const result = await querySnowflake(`
        SELECT
          l.NAME,
          ROUND(SUM(s.REVENUE),0) REVENUE,
          ROUND(AVG(r.RATING),1) RATING
        FROM LOCATIONS l
        JOIN DAILY_SALES s
          ON l.LOCATION_ID=s.LOCATION_ID
        LEFT JOIN CUSTOMER_REVIEWS r
          ON l.LOCATION_ID=r.LOCATION_ID
        GROUP BY l.NAME
      `);

      const generatedAlerts = result
        .filter(
          (r:any) =>
            r.REVENUE < 150000 ||
            r.RATING < 4
        )
        .map((r:any) => ({
          message:
            r.REVENUE < 150000
              ? `${r.NAME} revenue below expected threshold`
              : `${r.NAME} customer rating declining`,
        }));

      setAlerts(generatedAlerts);
    }

    loadAlerts();
  }, []);

  return (
    <div className="space-y-3">

      {alerts.length === 0 && (
        <div className="text-green-500">
          ✅ No operational risks detected
        </div>
      )}

      {alerts.map((a, i) => (
        <div
          key={i}
          className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20"
        >
          ⚠️ {a.message}
        </div>
      ))}
    </div>
  );
}