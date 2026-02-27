import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalesTrend {
  DATE: string;
  REVENUE: number;
  ORDERS: number;
  AVG_RATING: number;
}

interface OrderType {
  ORDER_TYPE: string;
  REVENUE: number;
  ORDERS: number;
  AVG_ORDER_VALUE: number;
}

interface CustomerInsight {
  CITY: string;
  LOCATIONS: number;
  AVG_RATING: number;
  TOTAL_REVENUE: number;
}

interface PerformanceMetrics {
  active_locations: number;
  total_revenue: number;
  total_orders: number;
  network_rating: number;
  avg_order_value: number;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    salesTrends: [] as SalesTrend[],
    orderTypes: [] as OrderType[],
    customerInsights: [] as CustomerInsight[],
    performanceMetrics: {} as PerformanceMetrics
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        // Sales trends data
        const salesResult = await querySnowflake(`
          SELECT 
            DATE_TRUNC('day', s.SALE_DATE) as date,
            SUM(s.REVENUE) as revenue,
            COUNT(*) as orders,
            AVG(r.RATING) as avg_rating
          FROM DAILY_SALES s
          LEFT JOIN CUSTOMER_REVIEWS r 
            ON s.LOCATION_ID = r.LOCATION_ID 
            AND DATE_TRUNC('day', s.SALE_DATE) = DATE_TRUNC('day', r.REVIEW_DATE)
          WHERE s.SALE_DATE >= DATEADD(day, -${timeRange}, CURRENT_DATE())
          GROUP BY DATE_TRUNC('day', s.SALE_DATE)
          ORDER BY date
        `);

        // Order type breakdown
        const orderTypesResult = await querySnowflake(`
          SELECT 
            s.ORDER_TYPE,
            SUM(s.REVENUE) as revenue,
            COUNT(*) as orders,
            ROUND(AVG(s.REVENUE), 2) as avg_order_value
          FROM DAILY_SALES s
          WHERE s.SALE_DATE >= DATEADD(day, -${timeRange}, CURRENT_DATE())
          GROUP BY s.ORDER_TYPE
          ORDER BY revenue DESC
        `);

        // Customer insights
        const customerResult = await querySnowflake(`
          SELECT 
            l.CITY,
            COUNT(DISTINCT l.LOCATION_ID) as locations,
            ROUND(AVG(r.RATING), 1) as avg_rating,
            SUM(s.REVENUE) as total_revenue
          FROM LOCATIONS l
          JOIN DAILY_SALES s ON l.LOCATION_ID = s.LOCATION_ID
          LEFT JOIN CUSTOMER_REVIEWS r ON l.LOCATION_ID = r.LOCATION_ID
          WHERE s.SALE_DATE >= DATEADD(day, -${timeRange}, CURRENT_DATE())
          GROUP BY l.CITY
          ORDER BY total_revenue DESC
        `);

        // Performance metrics
        const metricsResult = await querySnowflake(`
          SELECT 
            COUNT(DISTINCT s.LOCATION_ID) as active_locations,
            SUM(s.REVENUE) as total_revenue,
            COUNT(*) as total_orders,
            ROUND(AVG(r.RATING), 1) as network_rating,
            ROUND(SUM(s.REVENUE) / COUNT(*), 2) as avg_order_value
          FROM DAILY_SALES s
          LEFT JOIN CUSTOMER_REVIEWS r 
            ON s.LOCATION_ID = r.LOCATION_ID 
            AND DATE_TRUNC('day', s.SALE_DATE) = DATE_TRUNC('day', r.REVIEW_DATE)
          WHERE s.SALE_DATE >= DATEADD(day, -${timeRange}, CURRENT_DATE())
        `);

        setAnalyticsData({
          salesTrends: salesResult as unknown as SalesTrend[],
          orderTypes: orderTypesResult as unknown as OrderType[],
          customerInsights: customerResult as unknown as CustomerInsight[],
          performanceMetrics: metricsResult[0] as unknown as PerformanceMetrics || {}
        });
      } catch (error) {
        console.error("Error loading analytics:", error);
        // Set comprehensive mock data for demonstration
        setAnalyticsData({
          salesTrends: [
            { DATE: '2024-02-20', REVENUE: 1250, ORDERS: 35, AVG_RATING: 4.5 },
            { DATE: '2024-02-21', REVENUE: 1400, ORDERS: 42, AVG_RATING: 4.7 },
            { DATE: '2024-02-22', REVENUE: 1100, ORDERS: 30, AVG_RATING: 4.3 },
            { DATE: '2024-02-23', REVENUE: 1650, ORDERS: 48, AVG_RATING: 4.8 },
            { DATE: '2024-02-24', REVENUE: 1800, ORDERS: 52, AVG_RATING: 4.6 },
            { DATE: '2024-02-25', REVENUE: 1350, ORDERS: 38, AVG_RATING: 4.4 }
          ],
          orderTypes: [
            { ORDER_TYPE: 'Dine-in', REVENUE: 25000, ORDERS: 650, AVG_ORDER_VALUE: 38.46 },
            { ORDER_TYPE: 'Takeout', REVENUE: 15000, ORDERS: 420, AVG_ORDER_VALUE: 35.71 },
            { ORDER_TYPE: 'Delivery', REVENUE: 5000, ORDERS: 130, AVG_ORDER_VALUE: 38.46 }
          ],
          customerInsights: [
            { CITY: 'New York', LOCATIONS: 5, AVG_RATING: 4.6, TOTAL_REVENUE: 18000 },
            { CITY: 'Los Angeles', LOCATIONS: 4, AVG_RATING: 4.4, TOTAL_REVENUE: 12000 },
            { CITY: 'Chicago', LOCATIONS: 3, AVG_RATING: 4.7, TOTAL_REVENUE: 9000 },
            { CITY: 'Miami', LOCATIONS: 2, AVG_RATING: 4.3, TOTAL_REVENUE: 4500 },
            { CITY: 'Austin', LOCATIONS: 1, AVG_RATING: 4.5, TOTAL_REVENUE: 1500 }
          ],
          performanceMetrics: {
            active_locations: 15,
            total_revenue: 45000,
            total_orders: 1200,
            network_rating: 4.2,
            avg_order_value: 37.50
          }
        });
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [timeRange]);

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
  };

  return (
    <div className="space-y-8 animate-in fade-in-5 slide-in-from-top-2 duration-700">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📊 Advanced Analytics</h1>
            <p className="welcome-subtitle">Deep insights and performance metrics</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📊 Live</div>
            <div className="text-sm opacity-80">Analytics</div>
          </div>
        </div>
      </div>

      {/* ===== TIME RANGE FILTERS ===== */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {[7, 30, 90, 365].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                onClick={() => handleTimeRangeChange(days)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Last {days} days
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== PERFORMANCE METRICS ===== */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="interactive-card gpu-accelerated card-navy group hover:shadow-xl transition-all duration-150 border-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-navy dark:text-off-white">Active Locations</CardTitle>
              <Users className="h-4 w-4 text-accent-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy dark:text-off-white">
              {analyticsData.performanceMetrics.active_locations || 0}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Network coverage
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card gpu-accelerated card-navy group hover:shadow-xl transition-all duration-150 border-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-navy dark:text-off-white">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-accent-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy dark:text-off-white">
              ${(analyticsData.performanceMetrics.total_revenue || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {timeRange} day period
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card gpu-accelerated card-navy group hover:shadow-xl transition-all duration-150 border-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-navy dark:text-off-white">Total Orders</CardTitle>
              <BarChart3 className="h-4 w-4 text-accent-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy dark:text-off-white">
              {(analyticsData.performanceMetrics.total_orders || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Customer transactions
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card gpu-accelerated card-navy group hover:shadow-xl transition-all duration-150 border-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-sm font-medium text-navy dark:text-off-white">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent-yellow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy dark:text-off-white">
              ${(analyticsData.performanceMetrics.avg_order_value || 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Revenue per transaction
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ===== SALES TRENDS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Sales Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {analyticsData.salesTrends.slice(0, 6).map((trend, index) => (
              <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(trend.DATE).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {trend.ORDERS} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      ${trend.REVENUE?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Rating: {trend.AVG_RATING?.toFixed(1) || 'N/A'} ⭐
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${Math.min((trend.REVENUE / Math.max(...analyticsData.salesTrends.map(t => t.REVENUE || 0))) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== ORDER TYPE ANALYSIS ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <PieChart className="h-6 w-6 text-green-600" />
              Order Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.orderTypes.map((orderType, index) => (
                <div key={index} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">
                      {orderType.ORDER_TYPE}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {orderType.ORDERS} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                      ${orderType.REVENUE?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Avg: ${orderType.AVG_ORDER_VALUE?.toFixed(2) || '0'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ===== CUSTOMER INSIGHTS ===== */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Users className="h-6 w-6 text-purple-600" />
              Customer Insights by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.customerInsights.map((city, index) => (
                <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                        {city.CITY}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {city.LOCATIONS} locations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white text-lg">
                        ${city.TOTAL_REVENUE?.toLocaleString() || '0'}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-600 dark:text-slate-300">Rating:</span>
                        <span className="font-semibold">{city.AVG_RATING?.toFixed(1) || '0'} ⭐</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${Math.min((city.TOTAL_REVENUE / Math.max(...analyticsData.customerInsights.map(c => c.TOTAL_REVENUE || 0))) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ===== ANALYTICS SUMMARY ===== */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <AlertTriangle className="h-6 w-6 text-blue-600" />
            Analytics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Top Performing Order Type</h4>
              <p className="text-slate-600 dark:text-slate-300">
                {analyticsData.orderTypes[0]?.ORDER_TYPE || 'N/A'} - ${(analyticsData.orderTypes[0]?.REVENUE || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Best Rated City</h4>
              <p className="text-slate-600 dark:text-slate-300">
                {analyticsData.customerInsights[0]?.CITY || 'N/A'} - {(analyticsData.customerInsights[0]?.AVG_RATING || 0).toFixed(1)} ⭐
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Peak Sales Day</h4>
              <p className="text-slate-600 dark:text-slate-300">
                {analyticsData.salesTrends.length > 0 ? new Date(analyticsData.salesTrends.reduce((prev, current) => (prev.REVENUE > current.REVENUE) ? prev : current).DATE).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
