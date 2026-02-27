import { useEffect, useState } from "react"
import { querySnowflake } from "@/lib/snowflake"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

type LocationRow = {
  LOCATION_ID: string
  NAME: string
  CITY: string
  CURRENT_REVENUE: string
  PREVIOUS_REVENUE: string
  AVG_RATING: string
}

type SalesRow = {
  SALE_DATE: string
  ORDER_TYPE: string
  REVENUE: string
}

type WasteRow = {
  CATEGORY: string
  TOTAL_WASTE: string
}

export default function App() {
  const [data, setData] = useState<LocationRow[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [wasteData, setWasteData] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("1")
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  /* ================= SCORECARD ================= */

  useEffect(() => {
    async function fetchScorecard() {
      const result = await querySnowflake<LocationRow>(`
        WITH max_date AS (
          SELECT MAX(SALE_DATE) AS max_date FROM DAILY_SALES
        ),
        current_period AS (
          SELECT LOCATION_ID, SUM(REVENUE) AS current_revenue
          FROM DAILY_SALES, max_date
          WHERE SALE_DATE > DATEADD(day, -30, max_date.max_date)
          GROUP BY LOCATION_ID
        ),
        previous_period AS (
          SELECT LOCATION_ID, SUM(REVENUE) AS previous_revenue
          FROM DAILY_SALES, max_date
          WHERE SALE_DATE BETWEEN DATEADD(day, -60, max_date.max_date)
                              AND DATEADD(day, -31, max_date.max_date)
          GROUP BY LOCATION_ID
        ),
        ratings AS (
          SELECT LOCATION_ID, AVG(RATING) AS avg_rating
          FROM CUSTOMER_REVIEWS
          GROUP BY LOCATION_ID
        )
        SELECT
          l.LOCATION_ID,
          l.NAME,
          l.CITY,
          COALESCE(c.current_revenue, 0) AS CURRENT_REVENUE,
          COALESCE(p.previous_revenue, 0) AS PREVIOUS_REVENUE,
          COALESCE(r.avg_rating, 0) AS AVG_RATING
        FROM LOCATIONS l
        LEFT JOIN current_period c ON l.LOCATION_ID = c.LOCATION_ID
        LEFT JOIN previous_period p ON l.LOCATION_ID = p.LOCATION_ID
        LEFT JOIN ratings r ON l.LOCATION_ID = r.LOCATION_ID
        ORDER BY CURRENT_REVENUE DESC
      `)

      setData(result)
      setSelectedLocation(result[0]?.LOCATION_ID || "1")
      setLoading(false)
    }

    fetchScorecard()
  }, [])

  /* ================= SALES ================= */

  useEffect(() => {
    async function fetchSales() {
      const result = await querySnowflake<SalesRow>(`
        SELECT 
          TO_CHAR(SALE_DATE, 'Mon DD') AS SALE_DATE,
          ORDER_TYPE,
          SUM(REVENUE) AS REVENUE
        FROM DAILY_SALES
        WHERE LOCATION_ID = ${selectedLocation}
        GROUP BY SALE_DATE, ORDER_TYPE
        ORDER BY SALE_DATE
      `)

      const grouped: Record<string, any> = {}

      result.forEach((row) => {
        if (!grouped[row.SALE_DATE]) {
          grouped[row.SALE_DATE] = {
            date: row.SALE_DATE,
            "dine-in": 0,
            takeout: 0,
            delivery: 0,
          }
        }

        grouped[row.SALE_DATE][row.ORDER_TYPE] = Number(row.REVENUE)
      })

      setSalesData(Object.values(grouped))
    }

    fetchSales()
  }, [selectedLocation])

  /* ================= WASTE ================= */

  useEffect(() => {
    async function fetchWaste() {
      const result = await querySnowflake<WasteRow>(`
        SELECT CATEGORY, SUM(WASTE_COST) AS TOTAL_WASTE
        FROM INVENTORY
        WHERE LOCATION_ID = ${selectedLocation}
        GROUP BY CATEGORY
      `)

      const processed = result.map((r) => {
        const total = Number(r.TOTAL_WASTE)
        return {
          category: r.CATEGORY,
          total,
          excessive: total > 500,
        }
      })

      setWasteData(processed)
    }

    fetchWaste()
  }, [selectedLocation])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        Loading...
      </div>
    )
  }

  const processed = data.map((row) => {
    const current = Number(row.CURRENT_REVENUE)
    const previous = Number(row.PREVIOUS_REVENUE)
    const rating = Number(row.AVG_RATING)
    const change =
      previous === 0 ? 0 : ((current - previous) / previous) * 100

    return {
      ...row,
      current,
      rating,
      change,
      declining: change < -5,
      lowRating: rating < 3.5,
    }
  })

  const totalRevenue = processed.reduce((sum, r) => sum + r.current, 0)
  const avgRating =
    processed.reduce((sum, r) => sum + r.rating, 0) / processed.length
  const decliningCount = processed.filter((r) => r.declining).length

  const selectedName =
    processed.find((l) => l.LOCATION_ID === selectedLocation)?.NAME || ""

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-8 py-10 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Snowcone Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Regional performance overview
            </p>
          </div>

          <div className="flex items-center gap-4">
            {decliningCount > 0 && (
              <div className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                ⚠ {decliningCount} locations need attention
              </div>
            )}

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-sm"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <KpiCard title="Revenue (Last 30 Days)" value={`$${totalRevenue.toLocaleString()}`} />
          <KpiCard title="Average Rating" value={avgRating.toFixed(2)} />
          <KpiCard title="Declining Locations" value={decliningCount} danger />
        </div>

        {/* SCORECARD */}
        <SectionCard title="Location Scorecard">
          <div className="grid grid-cols-2 md:grid-cols-4 px-6 py-3 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <div>Location</div>
            <div>Revenue</div>
            <div>Trend</div>
            <div>Rating</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {processed.map((row) => (
              <div
                key={row.LOCATION_ID}
                onClick={() => setSelectedLocation(row.LOCATION_ID)}
                className={`px-6 py-5 grid grid-cols-2 md:grid-cols-4 items-center cursor-pointer transition-all
                ${
                  selectedLocation === row.LOCATION_ID
                    ? "bg-slate-100 dark:bg-slate-800/60"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div>
                  <p className="font-medium">{row.NAME}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {row.CITY}
                  </p>
                </div>

                <div className="text-sm font-semibold">
                  ${row.current.toLocaleString()}
                </div>

                <div className={row.declining ? "text-red-500" : "text-emerald-500"}>
                  {row.change.toFixed(1)}%
                </div>

                <div className={row.lowRating ? "text-red-500" : ""}>
                  {row.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* SALES */}
        <SectionCard title={`Historical Sales — ${selectedName}`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="dine-in" stroke="#6366f1" dot={false} />
                <Line type="monotone" dataKey="takeout" stroke="#22c55e" dot={false} />
                <Line type="monotone" dataKey="delivery" stroke="#f59e0b" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* WASTE */}
        <SectionCard title="Inventory Waste Tracker">
          <div className="space-y-5">
            {wasteData.map((w) => {
              const max = Math.max(...wasteData.map(x => x.total))
              const width = (w.total / max) * 100

              return (
                <div key={w.category}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="capitalize">
                      {w.category.replace("_", " ")}
                    </span>
                    <span className={w.excessive ? "text-red-500 font-medium" : ""}>
                      ${w.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        w.excessive
                          ? "bg-red-500"
                          : "bg-slate-500 dark:bg-slate-400"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

      </div>
    </div>
  )
}

function KpiCard({ title, value, danger }: any) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${danger ? "text-red-500" : ""}`}>
        {value}
      </p>
    </div>
  )
}

function SectionCard({ title, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-20">
      <h2 className="text-lg font-semibold tracking-tight mb-6">{title}</h2>
      {children}
    </div>
  )
}