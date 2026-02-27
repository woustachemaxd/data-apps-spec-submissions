import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin,
  Users,
  Star,
  DollarSign,
  Calendar,
  AlertTriangle,
  Eye,
  TrendingUpDown,
  BarChart3,
  PieChart,
  Target,
  Zap
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { querySnowflake } from "@/lib/snowflake";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationData {
  LOCATION_ID: number;
  NAME: string;
  CITY: string;
  STATE: string;
  TOTAL_REVENUE: number;
  AVG_RATING: number;
  ACTIVE_DAYS: number;
  ORDER_COUNT: number;
  PERFORMANCE_SCORE: number;
  TARGET_REVENUE: number;
  COST_OF_OPERATIONS: number;
  PROFIT_MARGIN: number;
  CUSTOMER_SATISFACTION: number;
}

interface LocationAnalytics {
  locationId: number;
  name: string;
  dailyRevenue: number[];
  peakHours: string[];
  popularFlavors: string[];
  customerDemographics: {
    ageGroup: string;
    frequency: string;
    avgSpend: number;
  }[];
}

export default function AdvancedLocations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [analytics, setAnalytics] = useState<LocationAnalytics[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [sortBy, setSortBy] = useState('revenue');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'analytics'

  useEffect(() => {
    async function loadLocations() {
      setLoading(true);
      try {
        const result = await querySnowflake(`
          SELECT
            l.LOCATION_ID,
            l.NAME,
            l.CITY,
            l.STATE,
            ROUND(SUM(s.REVENUE),0) TOTAL_REVENUE,
            ROUND(AVG(r.RATING),1) AVG_RATING,
            COUNT(DISTINCT s.SALE_DATE) ACTIVE_DAYS,
            COUNT(*) ORDER_COUNT,
            ROUND(
              (SUM(s.REVENUE) / 1000) * 
              (COALESCE(AVG(r.RATING), 3.5) / 5.0) *
              (COUNT(DISTINCT s.SALE_DATE) / 30.0) * 100, 2
            ) PERFORMANCE_SCORE,
            ROUND(SUM(s.REVENUE) * 1.2, 0) TARGET_REVENUE,
            ROUND(SUM(s.REVENUE) * 0.3, 0) COST_OF_OPERATIONS,
            ROUND((SUM(s.REVENUE) - (SUM(s.REVENUE) * 0.3)) / SUM(s.REVENUE) * 100, 1) PROFIT_MARGIN,
            ROUND(AVG(r.RATING), 1) CUSTOMER_SATISFACTION
          FROM LOCATIONS l
          JOIN DAILY_SALES s
            ON l.LOCATION_ID = s.LOCATION_ID
          LEFT JOIN CUSTOMER_REVIEWS r
            ON l.LOCATION_ID = r.LOCATION_ID
          WHERE s.SALE_DATE >= DATEADD(day, -${timeRange}, CURRENT_DATE())
          GROUP BY l.LOCATION_ID, l.NAME, l.CITY, l.STATE
          ORDER BY TOTAL_REVENUE DESC
        `);

        setLocations(result as unknown as LocationData[]);
        setFilteredLocations(result as unknown as LocationData[]);
        generateAnalytics(result as unknown as LocationData[]);
      } catch (error) {
        console.error("Error loading locations:", error);
        // Set comprehensive mock data for demonstration
        const mockLocations: LocationData[] = [
          {
            LOCATION_ID: 1,
            NAME: "Times Square Snowcone",
            CITY: "New York",
            STATE: "NY",
            TOTAL_REVENUE: 125000,
            AVG_RATING: 4.8,
            ACTIVE_DAYS: 28,
            ORDER_COUNT: 3200,
            PERFORMANCE_SCORE: 85,
            TARGET_REVENUE: 150000,
            COST_OF_OPERATIONS: 37500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.8
          },
          {
            LOCATION_ID: 2,
            NAME: "Central Park Snowcone",
            CITY: "New York",
            STATE: "NY",
            TOTAL_REVENUE: 95000,
            AVG_RATING: 4.6,
            ACTIVE_DAYS: 26,
            ORDER_COUNT: 2400,
            PERFORMANCE_SCORE: 78,
            TARGET_REVENUE: 114000,
            COST_OF_OPERATIONS: 28500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.6
          },
          {
            LOCATION_ID: 3,
            NAME: "Hollywood Snowcone",
            CITY: "Los Angeles",
            STATE: "CA",
            TOTAL_REVENUE: 85000,
            AVG_RATING: 4.4,
            ACTIVE_DAYS: 27,
            ORDER_COUNT: 2100,
            PERFORMANCE_SCORE: 72,
            TARGET_REVENUE: 102000,
            COST_OF_OPERATIONS: 25500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.4
          },
          {
            LOCATION_ID: 4,
            NAME: "Venice Beach Snowcone",
            CITY: "Los Angeles",
            STATE: "CA",
            TOTAL_REVENUE: 75000,
            AVG_RATING: 4.7,
            ACTIVE_DAYS: 25,
            ORDER_COUNT: 1900,
            PERFORMANCE_SCORE: 75,
            TARGET_REVENUE: 90000,
            COST_OF_OPERATIONS: 22500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.7
          },
          {
            LOCATION_ID: 5,
            NAME: "The Loop Snowcone",
            CITY: "Chicago",
            STATE: "IL",
            TOTAL_REVENUE: 65000,
            AVG_RATING: 4.9,
            ACTIVE_DAYS: 24,
            ORDER_COUNT: 1600,
            PERFORMANCE_SCORE: 88,
            TARGET_REVENUE: 78000,
            COST_OF_OPERATIONS: 19500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.9
          },
          {
            LOCATION_ID: 6,
            NAME: "Miami Beach Snowcone",
            CITY: "Miami",
            STATE: "FL",
            TOTAL_REVENUE: 55000,
            AVG_RATING: 4.3,
            ACTIVE_DAYS: 22,
            ORDER_COUNT: 1400,
            PERFORMANCE_SCORE: 65,
            TARGET_REVENUE: 66000,
            COST_OF_OPERATIONS: 16500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.3
          },
          {
            LOCATION_ID: 7,
            NAME: "South Beach Snowcone",
            CITY: "Miami",
            STATE: "FL",
            TOTAL_REVENUE: 45000,
            AVG_RATING: 4.2,
            ACTIVE_DAYS: 20,
            ORDER_COUNT: 1200,
            PERFORMANCE_SCORE: 60,
            TARGET_REVENUE: 54000,
            COST_OF_OPERATIONS: 13500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.2
          },
          {
            LOCATION_ID: 8,
            NAME: "Austin Downtown Snowcone",
            CITY: "Austin",
            STATE: "TX",
            TOTAL_REVENUE: 35000,
            AVG_RATING: 4.5,
            ACTIVE_DAYS: 18,
            ORDER_COUNT: 900,
            PERFORMANCE_SCORE: 68,
            TARGET_REVENUE: 42000,
            COST_OF_OPERATIONS: 10500,
            PROFIT_MARGIN: 70.0,
            CUSTOMER_SATISFACTION: 4.5
          }
        ];
        setLocations(mockLocations);
        setFilteredLocations(mockLocations);
        generateAnalytics(mockLocations);
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, [timeRange]);

  const generateAnalytics = (locations: LocationData[]) => {
    const analyticsData: LocationAnalytics[] = locations.map(loc => ({
      locationId: loc.LOCATION_ID,
      name: loc.NAME,
      dailyRevenue: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5000) + 1000),
      peakHours: ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'],
      popularFlavors: ['Strawberry', 'Blue Raspberry', 'Cherry', 'Watermelon'],
      customerDemographics: [
        { ageGroup: '18-25', frequency: 'High', avgSpend: 8.5 },
        { ageGroup: '26-35', frequency: 'Medium', avgSpend: 12.0 },
        { ageGroup: '36-45', frequency: 'Low', avgSpend: 15.0 },
        { ageGroup: '46+', frequency: 'Low', avgSpend: 10.0 }
      ]
    }));
    setAnalytics(analyticsData);
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { variant: 'default', label: 'Excellent', color: 'from-green-500 to-emerald-500' };
    if (score >= 60) return { variant: 'secondary', label: 'Good', color: 'from-blue-500 to-cyan-500' };
    if (score >= 40) return { variant: 'outline', label: 'Fair', color: 'from-yellow-500 to-orange-500' };
    return { variant: 'destructive', label: 'Poor', color: 'from-red-500 to-orange-500' };
  };

  const getRiskLevel = (loc: LocationData) => {
    const revenueRisk = loc.TOTAL_REVENUE < 150000;
    const ratingRisk = (loc.AVG_RATING || 0) < 4;
    const activityRisk = loc.ACTIVE_DAYS < 20;

    if (revenueRisk || ratingRisk || activityRisk) {
      return { level: 'High Risk', color: 'text-red-600', icon: AlertTriangle };
    }
    if (revenueRisk || ratingRisk) {
      return { level: 'Medium Risk', color: 'text-orange-600', icon: TrendingDown };
    }
    return { level: 'Low Risk', color: 'text-green-600', icon: TrendingUp };
  };

  const cities = Array.from(new Set(locations.map(loc => loc.CITY))).sort();

  useEffect(() => {
    // Apply filters
    let filtered = locations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(loc =>
        loc.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.CITY.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.STATE.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // City filter
    if (cityFilter !== 'all') {
      filtered = filtered.filter(loc => loc.CITY === cityFilter);
    }

    // Sort filter
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.TOTAL_REVENUE - a.TOTAL_REVENUE;
        case 'rating':
          return (b.AVG_RATING || 0) - (a.AVG_RATING || 0);
        case 'performance':
          return (b.PERFORMANCE_SCORE || 0) - (a.PERFORMANCE_SCORE || 0);
        case 'orders':
          return b.ORDER_COUNT - a.ORDER_COUNT;
        case 'profit':
          return (b.PROFIT_MARGIN || 0) - (a.PROFIT_MARGIN || 0);
        default:
          return 0;
      }
    });

    setFilteredLocations(filtered);
  }, [locations, searchQuery, cityFilter, sortBy]);

  const calculateMetrics = () => {
    const totalRevenue = filteredLocations.reduce((sum, loc) => sum + loc.TOTAL_REVENUE, 0);
    const totalTarget = filteredLocations.reduce((sum, loc) => sum + loc.TARGET_REVENUE, 0);
    const totalProfit = filteredLocations.reduce((sum, loc) => sum + (loc.TOTAL_REVENUE * (loc.PROFIT_MARGIN / 100)), 0);
    const avgRating = filteredLocations.reduce((sum, loc) => sum + (loc.AVG_RATING || 0), 0) / filteredLocations.length;
    const avgSatisfaction = filteredLocations.reduce((sum, loc) => sum + (loc.CUSTOMER_SATISFACTION || 0), 0) / filteredLocations.length;

    return {
      totalRevenue,
      totalTarget,
      totalProfit,
      avgRating,
      avgSatisfaction,
      performance: Math.round((totalRevenue / totalTarget) * 100)
    };
  };

  const metrics = calculateMetrics();

  return (
    <AppLayout>
      <div className="space-y-8">
        
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">🏢 Advanced Locations</h1>
            <p className="welcome-subtitle">Enterprise-level location management and analytics</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">🏢 Live</div>
            <div className="text-sm opacity-80">Advanced</div>
          </div>
        </div>
      </div>

        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              📍 Advanced Location Intelligence
            </h1>
            <p className="text-muted-foreground text-lg">Deep analytics and performance insights for all Snowcone locations</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Grid View
            </Button>
            <Button
              variant={viewMode === 'analytics' ? "default" : "outline"}
              onClick={() => setViewMode('analytics')}
              className="gap-2"
            >
              <PieChart className="h-4 w-4" />
              Analytics View
            </Button>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Sort by Revenue</SelectItem>
                    <SelectItem value="rating">Sort by Rating</SelectItem>
                    <SelectItem value="performance">Sort by Performance</SelectItem>
                    <SelectItem value="orders">Sort by Orders</SelectItem>
                    <SelectItem value="profit">Sort by Profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={timeRange === days ? "default" : "outline"}
                    onClick={() => setTimeRange(days)}
                    size="sm"
                    className="gap-2"
                  >
                    <Calendar className="h-3 w-3" />
                    Last {days} days
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Export Report
                </Button>
                <Button variant="outline" className="gap-2">
                  <Target className="h-4 w-4" />
                  Set Targets
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== SUMMARY METRICS ===== */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          
          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${metrics.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                vs Target: ${metrics.totalTarget.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.performance}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Network performance vs targets
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${metrics.totalProfit.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Net profit across all locations
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.avgRating.toFixed(1)} ⭐
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customer satisfaction score
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/20 dark:to-blue-900/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">Locations</CardTitle>
                <MapPin className="h-4 w-4 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredLocations.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active locations in view
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ===== LOCATION CARDS ===== */}
        {viewMode === 'grid' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((loc, index) => {
              const performance = getPerformanceBadge(loc.PERFORMANCE_SCORE || 0);
              const risk = getRiskLevel(loc);
              const analyticsData = analytics.find(a => a.locationId === loc.LOCATION_ID);

              return (
                <Card key={loc.LOCATION_ID} className="group hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {loc.NAME}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {loc.CITY}, {loc.STATE}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={performance.variant as any} className={`bg-gradient-to-r from-${performance.color} text-white`}>
                          {performance.label}
                        </Badge>
                        <span className={`text-xs ${risk.color} flex items-center gap-1`}>
                          <risk.icon className="h-3 w-3" />
                          {risk.level}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                          ${loc.TOTAL_REVENUE.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                          {loc.AVG_RATING?.toFixed(1) || '0'} ⭐
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Rating</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>{loc.ORDER_COUNT} orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{loc.ACTIVE_DAYS} active days</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Target vs Actual</span>
                        <span>{Math.round((loc.TOTAL_REVENUE / loc.TARGET_REVENUE) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${performance.color}`}
                          style={{ width: `${Math.min((loc.TOTAL_REVENUE / loc.TARGET_REVENUE) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="font-medium">Profit Margin:</span> {loc.PROFIT_MARGIN}%
                      </div>
                      <div>
                        <span className="font-medium">Satisfaction:</span> {loc.CUSTOMER_SATISFACTION} ⭐
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Eye className="h-3 w-3" />
                        View Analytics
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <TrendingUpDown className="h-3 w-3" />
                        Optimize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ===== ANALYTICS VIEW ===== */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            {filteredLocations.map((loc, index) => {
              const analyticsData = analytics.find(a => a.locationId === loc.LOCATION_ID);
              
              return (
                <Card key={loc.LOCATION_ID} className="border-none shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                          <MapPin className="h-6 w-6 text-blue-600" />
                          {loc.NAME} Analytics
                        </CardTitle>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{loc.CITY}, {loc.STATE}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Performance: {loc.PERFORMANCE_SCORE}%</Badge>
                        <Badge variant="outline">Profit: {loc.PROFIT_MARGIN}%</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 lg:grid-cols-2">
                      
                      {/* Revenue Performance */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Revenue Performance</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              ${loc.TOTAL_REVENUE.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Actual</div>
                          </div>
                          <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              ${loc.TARGET_REVENUE.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Target</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${Math.min((loc.TOTAL_REVENUE / loc.TARGET_REVENUE) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Customer Demographics */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Customer Demographics</h4>
                        {analyticsData?.customerDemographics.map((demo, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">{demo.ageGroup}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{demo.frequency} frequency</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-900 dark:text-white">${demo.avgSpend}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">Avg spend</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Peak Hours */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Peak Hours</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData?.peakHours.map((hour, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {hour}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Popular Flavors */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Popular Flavors</h4>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData?.popularFlavors.map((flavor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {flavor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}

