import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function LocationDetail() {
  const { id } = useParams();

  const [trend, setTrend] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const daily = await querySnowflake(`
        SELECT
          DATE,
          REVENUE,
          ORDERS,
          WASTE_KG
        FROM DAILY_SALES
        WHERE LOCATION_ID='${id}'
        ORDER BY DATE
      `);

      setTrend(daily);

      const sum = await querySnowflake(`
        SELECT
          l.NAME,
          ROUND(SUM(s.REVENUE),0) TOTAL_REVENUE,
          ROUND(AVG(r.RATING),1) AVG_RATING
        FROM LOCATIONS l
        JOIN DAILY_SALES s
          ON l.LOCATION_ID=s.LOCATION_ID
        LEFT JOIN CUSTOMER_REVIEWS r
          ON l.LOCATION_ID=r.LOCATION_ID
        WHERE l.LOCATION_ID='${id}'
        GROUP BY l.NAME
      `);

      setSummary(sum[0]);
    }

    loadData();
  }, [id]);

  if (!summary) return <div>Loading...</div>;

  /* ================= WEEK OVER WEEK ANALYSIS ================= */

  const midpoint = Math.floor(trend.length / 2);

  const lastWeek =
    trend
      .slice(midpoint)
      .reduce((s, d) => s + d.REVENUE, 0) /
    (trend.length - midpoint);

  const prevWeek =
    trend
      .slice(0, midpoint)
      .reduce((s, d) => s + d.REVENUE, 0) /
    midpoint;

  const change =
    ((lastWeek - prevWeek) / prevWeek) * 100;

  const avgWaste =
    trend.reduce((s, d) => s + d.WASTE_KG, 0) /
    trend.length;

  /* ================= AI INSIGHT ================= */

  let insight = "";
  let action = "";

  if (change < -10) {
    insight =
      "Revenue has significantly declined compared to last week.";
    action =
      "Review staffing levels and local promotions immediately.";
  } else if (summary.AVG_RATING < 4) {
    insight =
      "Customer ratings are below acceptable threshold.";
    action =
      "Investigate service delays or product quality issues.";
  } else if (avgWaste > 20) {
    insight =
      "Ingredient waste levels are unusually high.";
    action =
      "Adjust inventory forecasting and preparation volume.";
  } else {
    insight = "Store operating within healthy parameters.";
    action = "No immediate action required.";
  }

  return (
    <div className="space-y-6">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📍 Location Details</h1>
            <p className="welcome-subtitle">Deep dive into individual location performance</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📍 Live</div>
            <div className="text-sm opacity-80">Location</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🎪 {summary.NAME}</h1>

        {/* ================= KPI CARDS ================= */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 20,
          }}
        >
          <div className="card group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
            <h3 className="text-slate-900 dark:text-white">Total Revenue</h3>
            <p className="text-slate-900 dark:text-white">${summary.TOTAL_REVENUE}</p>
          </div>

          <div className="card group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900">
            <h3 className="text-slate-900 dark:text-white">Avg Rating</h3>
            <p className="text-slate-900 dark:text-white">{summary.AVG_RATING} ⭐</p>
          </div>

          <div className="card group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900">
            <h3 className="text-slate-900 dark:text-white">WoW Change</h3>
            <p className="text-slate-900 dark:text-white">{change.toFixed(1)}%</p>
          </div>
        </div>

        {/* ================= TREND CHART ================= */}
        <h2 style={{ marginTop: 40, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          📊 Revenue Trend
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="DATE" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="REVENUE"
              stroke="#2563eb"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* ================= DAILY DATA ================= */}
        <h2 style={{ marginTop: 40, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
          📈 Daily Operations
        </h2>

        <table border={1} cellPadding={10} width="100%">
          <thead>
            <tr>
              <th>Date</th>
              <th>Revenue</th>
              <th>Orders</th>
              <th>Waste</th>
            </tr>
          </thead>

          <tbody>
            {trend.map((d, i) => (
              <tr key={i}>
                <td>{d.DATE}</td>
                <td>${d.REVENUE}</td>
                <td>{d.ORDERS}</td>
                <td>{d.WASTE_KG}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= EXECUTIVE INSIGHT ================= */}
        <div
          style={{
            marginTop: 40,
            padding: 20,
            background: "#eef2ff",
            borderRadius: 10,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>🧠 Executive Insight</h2>
          <p style={{ fontSize: '1.1rem', color: '#374151' }}><b>Observation:</b> {insight}</p>
          <p style={{ fontSize: '1.1rem', color: '#374151' }}><b>Recommended Action:</b> {action}</p>
        </div>
      </div>
    </div>
  );
}