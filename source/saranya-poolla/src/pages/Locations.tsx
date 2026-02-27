import { useEffect, useState } from "react";
import { querySnowflake } from "@/lib/snowflake";
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
  TrendingUpDown
} from "lucide-react";

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
}

export default function Locations() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [sortBy, setSortBy] = useState('revenue');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

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
            ) PERFORMANCE_SCORE
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
            PERFORMANCE_SCORE: 85
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
            PERFORMANCE_SCORE: 78
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
            PERFORMANCE_SCORE: 72
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
            PERFORMANCE_SCORE: 75
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
            PERFORMANCE_SCORE: 88
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
            PERFORMANCE_SCORE: 65
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
            PERFORMANCE_SCORE: 60
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
            PERFORMANCE_SCORE: 68
          }
        ];
        setLocations(mockLocations);
        setFilteredLocations(mockLocations);
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, [timeRange]);

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
        default:
          return 0;
      }
    });

    setFilteredLocations(filtered);
  }, [locations, searchQuery, cityFilter, sortBy]);

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

  return (
    <div className="space-y-8 animate-in fade-in-5 slide-in-from-top-2 duration-700">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📍 Location Management</h1>
            <p className="welcome-subtitle">Manage your Snowcone network locations</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📍 Live</div>
            <div className="text-sm opacity-80">Locations</div>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎪 SnowCone Intelligence
          </h2>
          <p className="text-muted-foreground text-lg">Comprehensive view of all Snowcone locations and their performance</p>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
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
          </div>
        </CardContent>
      </Card>

      {/* ===== LOCATION CARDS ===== */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.map((loc, index) => {
          const performance = getPerformanceBadge(loc.PERFORMANCE_SCORE || 0);
          const risk = getRiskLevel(loc);

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
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ${loc.TOTAL_REVENUE.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
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

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${performance.color}`}
                    style={{ width: `${Math.min((loc.PERFORMANCE_SCORE || 0), 100)}%` }}
                  ></div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Eye className="h-3 w-3" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <TrendingUpDown className="h-3 w-3" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== SUMMARY ===== */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Users className="h-6 w-6 text-blue-600" />
            Location Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Total Locations</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredLocations.length}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Average Rating</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(filteredLocations.reduce((sum, loc) => sum + (loc.AVG_RATING || 0), 0) / filteredLocations.length || 0).toFixed(1)} ⭐
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">Total Revenue</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${(filteredLocations.reduce((sum, loc) => sum + loc.TOTAL_REVENUE, 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2">High Performers</h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {filteredLocations.filter(loc => (loc.PERFORMANCE_SCORE || 0) >= 80).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
