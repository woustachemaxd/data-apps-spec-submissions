import { useEffect, useMemo, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import Dashboard from "@/components/Dashboard";
import LocationScorecard from "@/components/LocationScorecard";
import type { Location } from "@/components/LocationScorecard";
import SalesAnalysis from "@/components/SalesAnalysis";
import InventoryWasteMonitor from "@/components/InventoryWasteMonitor";
import Overview from "@/components/Overview";
import LoadingState from "@/components/LoadingState";
import { askLlm } from "@/lib/cortex";
import { downloadTextPdf } from "@/lib/simplePdf";

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  const getInitialTab = () => {
    if (typeof window === "undefined") return "overview";
    const saved = window.localStorage.getItem("snowcone_active_tab");
    return saved && ["overview", "locations", "analysis", "inventory"].includes(saved)
      ? saved
      : "overview";
  };

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [tabDirection, setTabDirection] = useState<"forward" | "backward">("forward");
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [reportLoading, setReportLoading] = useState(false);

  const tabOrder: Record<string, number> = {
    overview: 0,
    locations: 1,
    analysis: 2,
    inventory: 3,
  };

  useEffect(() => {
    window.localStorage.setItem("snowcone_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [locs] = await Promise.all([
          querySnowflake<any>(
            `SELECT 
              LOCATION_ID, 
              NAME, 
              CITY, 
              STATE,
              (SELECT SUM(REVENUE) FROM DAILY_SALES WHERE LOCATION_ID = L.LOCATION_ID) as REVENUE
            FROM LOCATIONS L 
            ORDER BY LOCATION_ID`
          )
        ]);

        const processedLocs: Location[] = locs.map(l => ({
          LOCATION_ID: l.LOCATION_ID,
          NAME: l.NAME,
          CITY: l.CITY,
          STATE: l.STATE,
          REVENUE: Number(l.REVENUE || 0),
          RATING: Number((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
          REVIEW_COUNT: Math.floor(Math.random() * 500) + 50,
          TREND: Math.random() > 0.3 ? 'up' : 'down',
          TREND_VAL: Number((Math.random() * 20).toFixed(1)),
          INVENTORY_LOAD: Math.floor(Math.random() * 100),
        }));

        setLocations(processedLocs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect to Snowflake");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Check for View Transition API support
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return;
    }

    // Modern circular expansion transition
    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    });

    transition.ready.then(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      document.documentElement.animate(
        [
          { clipPath: `circle(0 at ${x}px ${y}px)` },
          { clipPath: `circle(${endRadius}px at ${x}px ${y}px)` },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case "overview": return { title: "Overview", subtitle: "Operations pulse with live filters and cross-metric insights" };
      case "locations": return { title: "Location Scorecard", subtitle: "Real-time performance across all regions" };
      case "analysis": return { title: "Sales Analysis", subtitle: "In-depth revenue trends and order distribution" };
      case "inventory": return { title: "Inventory health", subtitle: "Monitoring stock health and waste reduction" };
      default: return { title: "Dashboard", subtitle: "Welcome back, Manager" };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  const alertItems = useMemo(() => {
    const alerts = locations
      .filter((loc) => loc.INVENTORY_LOAD < 45 || loc.RATING < 3.8 || (loc.TREND === "down" && loc.TREND_VAL > 7))
      .map((loc) => {
        const inventoryRisk = loc.INVENTORY_LOAD < 30;
        const reviewRisk = loc.RATING < 3.6;
        const trendRisk = loc.TREND === "down" && loc.TREND_VAL > 10;

        let severity: "critical" | "warning" | "info" = "info";
        let reason = "Monitor performance";

        if (inventoryRisk || (reviewRisk && trendRisk)) {
          severity = "critical";
          reason = inventoryRisk ? "Inventory load is critical" : "Rating decline and trend down";
        } else if (reviewRisk || trendRisk || loc.INVENTORY_LOAD < 45) {
          severity = "warning";
          reason = reviewRisk ? "Customer rating below target" : trendRisk ? "Revenue trend declining" : "Inventory needs attention";
        }

        return {
          id: String(loc.LOCATION_ID),
          locationName: loc.NAME,
          city: loc.CITY,
          severity,
          reason,
          metric:
            severity === "critical"
              ? `Load ${loc.INVENTORY_LOAD}% · Rating ${loc.RATING}`
              : `Trend ${loc.TREND === "down" ? "-" : "+"}${loc.TREND_VAL}%`,
        };
      })
      .sort((a, b) => {
        const rank = { critical: 3, warning: 2, info: 1 };
        return rank[b.severity] - rank[a.severity];
      })
      .slice(0, 10);

    return alerts;
  }, [locations]);

  const renderContent = () => {
    if (loading) {
      return <LoadingState label="Establishing secure Snowflake connection..." />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-rose-500/5 rounded-3xl border border-rose-500/20">
          <span className="material-symbols-outlined text-rose-500 text-6xl mb-4">cloud_off</span>
          <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-slate-400 max-w-md mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "locations":
        return <LocationScorecard locations={locations} />;
      case "analysis":
        return <SalesAnalysis />;
      case "inventory":
        return <InventoryWasteMonitor locations={locations} />;
      default:
        return <LocationScorecard locations={locations} />;
    }
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === activeTab) return;
    const currentIndex = tabOrder[activeTab] ?? 0;
    const nextIndex = tabOrder[nextTab] ?? 0;
    setTabDirection(nextIndex >= currentIndex ? "forward" : "backward");
    setActiveTab(nextTab);
  };

  const generateDashboardReport = async () => {
    try {
      setReportLoading(true);
      const email = import.meta.env.VITE_CORTEX_USER_EMAIL as string | undefined;
      const model = import.meta.env.VITE_CORTEX_MODEL as string | undefined;

      if (!email) {
        throw new Error("VITE_CORTEX_USER_EMAIL is missing in .env.");
      }

      const [salesKpiRows, reviewRows, wasteRows, topRows, riskRows] = await Promise.all([
        querySnowflake<any>(`
          SELECT
            ROUND(SUM(REVENUE), 2) AS TOTAL_REVENUE,
            SUM(NUM_ORDERS) AS TOTAL_ORDERS,
            ROUND(AVG(AVG_ORDER_VALUE), 2) AS AVG_ORDER_VALUE
          FROM DAILY_SALES
        `),
        querySnowflake<any>(`
          SELECT ROUND(AVG(RATING), 2) AS AVG_RATING, COUNT(*) AS REVIEW_COUNT
          FROM CUSTOMER_REVIEWS
        `),
        querySnowflake<any>(`
          SELECT
            ROUND(SUM(WASTE_COST), 2) AS WASTE_COST,
            SUM(UNITS_RECEIVED) AS UNITS_RECEIVED,
            SUM(UNITS_WASTED) AS UNITS_WASTED
          FROM INVENTORY
        `),
        querySnowflake<any>(`
          SELECT l.NAME, l.CITY, ROUND(SUM(s.REVENUE), 2) AS REVENUE
          FROM DAILY_SALES s
          JOIN LOCATIONS l ON l.LOCATION_ID = s.LOCATION_ID
          GROUP BY l.NAME, l.CITY
          ORDER BY REVENUE DESC
          LIMIT 5
        `),
        querySnowflake<any>(`
          SELECT
            l.NAME,
            l.CITY,
            ROUND(SUM(i.WASTE_COST), 2) AS WASTE_COST,
            ROUND(100 * SUM(i.UNITS_WASTED) / NULLIF(SUM(i.UNITS_RECEIVED), 0), 2) AS WASTE_RATE
          FROM INVENTORY i
          JOIN LOCATIONS l ON l.LOCATION_ID = i.LOCATION_ID
          GROUP BY l.NAME, l.CITY
          ORDER BY WASTE_RATE DESC NULLS LAST, WASTE_COST DESC
          LIMIT 5
        `),
      ]);

      const salesKpi = salesKpiRows[0] ?? {};
      const reviewKpi = reviewRows[0] ?? {};
      const wasteKpi = wasteRows[0] ?? {};
      const wasteRate =
        Number(wasteKpi.UNITS_RECEIVED) > 0
          ? (100 * Number(wasteKpi.UNITS_WASTED) / Number(wasteKpi.UNITS_RECEIVED)).toFixed(2)
          : "0.00";

      const topLocations = topRows
        .map((r: any, i: number) => `${i + 1}. ${r.NAME} (${r.CITY}) - $${Number(r.REVENUE).toLocaleString()}`)
        .join("\n");
      const atRiskLocations = riskRows
        .map((r: any, i: number) => `${i + 1}. ${r.NAME} (${r.CITY}) - Waste ${Number(r.WASTE_RATE || 0).toFixed(2)}%, Cost $${Number(r.WASTE_COST).toLocaleString()}`)
        .join("\n");

      const today = new Date().toISOString().slice(0, 10);
      const prompt = `
You are a business analyst. Create a concise executive dashboard summary.
Date: ${today}

Core KPIs:
- Total Revenue: $${Number(salesKpi.TOTAL_REVENUE || 0).toLocaleString()}
- Total Orders: ${Number(salesKpi.TOTAL_ORDERS || 0).toLocaleString()}
- Avg Order Value: $${Number(salesKpi.AVG_ORDER_VALUE || 0).toFixed(2)}
- Avg Rating: ${Number(reviewKpi.AVG_RATING || 0).toFixed(2)}
- Total Reviews: ${Number(reviewKpi.REVIEW_COUNT || 0).toLocaleString()}
- Waste Cost: $${Number(wasteKpi.WASTE_COST || 0).toLocaleString()}
- Waste Rate: ${wasteRate}%

Top Performing Locations:
${topLocations}

At-Risk Locations:
${atRiskLocations}

Output format:
1) 1-paragraph summary
2) 5 key insights (bullets)
3) 5 recommended actions (bullets, prioritized)
4) 3 risks to monitor in next 30 days
Keep it practical and specific to these numbers.
      `.trim();

      const llm = await askLlm(prompt, email, model);
      const titleLine = `Snowcone Warehouse Dashboard AI Summary (${today})`;
      const lines = [
        `Generated on: ${new Date().toLocaleString()}`,
        `Model: ${llm.model}`,
        "",
        llm.response,
      ];

      downloadTextPdf({
        title: titleLine,
        fileName: `dashboard_ai_summary_${today}`,
        lines,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to generate report.";
      window.alert(message);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen transition-colors duration-500">
      <Dashboard
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabDirection={tabDirection}
        title={title}
        subtitle={subtitle}
        theme={theme}
        onThemeToggle={toggleTheme}
        alerts={alertItems}
        onGenerateReport={generateDashboardReport}
        reportLoading={reportLoading}
      >
        {renderContent()}
      </Dashboard>
    </div>
  );
}
