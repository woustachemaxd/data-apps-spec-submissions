import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";

export function useDashboardData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await querySnowflake(`
        SELECT
          LOCATION_ID,
          SALE_DATE,
          ORDER_TYPE,
          REVENUE
        FROM DAILY_SALES
        WHERE SALE_DATE >= DATEADD(day,-30,CURRENT_DATE)
      `);

      setData(result);
      setLoading(false);
    }

    load();
  }, []);

  return { data, loading };
}