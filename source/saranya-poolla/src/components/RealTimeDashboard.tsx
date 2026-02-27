import { useEffect, useState, useRef } from "react";
import { 
  Activity, 
  Users, 
  DollarSign, 
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LiveMetric {
  location: string;
  revenue: number;
  orders: number;
  status: 'online' | 'offline' | 'warning';
  lastUpdate: string;
}

interface LiveOrder {
  id: string;
  location: string;
  amount: number;
  type: 'Dine-in' | 'Takeout' | 'Delivery';
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export default function RealTimeDashboard() {
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initialize live data
    initializeLiveData();
    
    // Start real-time updates
    intervalRef.current = setInterval(updateLiveData, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeLiveData = () => {
    const locations = [
      'Times Square', 'Central Park', 'Hollywood', 'Venice Beach', 
      'The Loop', 'Miami Beach', 'South Beach', 'Austin Downtown'
    ];

    const metrics: LiveMetric[] = locations.map((loc, index) => ({
      location: loc,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5,
      status: Math.random() > 0.1 ? 'online' : 'offline',
      lastUpdate: new Date().toLocaleTimeString()
    }));

    setLiveMetrics(metrics);
    setTotalRevenue(metrics.reduce((sum, m) => sum + m.revenue, 0));
    setActiveOrders(metrics.reduce((sum, m) => sum + m.orders, 0));
  };

  const updateLiveData = () => {
    setLiveMetrics(prev => {
      const updated = prev.map(metric => {
        const change = (Math.random() - 0.5) * 200;
        const newRevenue = Math.max(0, metric.revenue + change);
        const orderChange = Math.random() > 0.5 ? 1 : -1;
        const newOrders = Math.max(0, metric.orders + orderChange);
        
        return {
          ...metric,
          revenue: Math.round(newRevenue),
          orders: newOrders,
          lastUpdate: new Date().toLocaleTimeString(),
          status: Math.random() > 0.95 ? (Math.random() > 0.5 ? 'warning' : 'offline') : metric.status
        };
      });

      setTotalRevenue(updated.reduce((sum, m) => sum + m.revenue, 0));
      setActiveOrders(updated.reduce((sum, m) => sum + m.orders, 0));

      // Add new live orders
      if (Math.random() > 0.7) {
        const randomLocation = updated[Math.floor(Math.random() * updated.length)];
        const newOrder: LiveOrder = {
          id: `ORD-${Date.now()}`,
          location: randomLocation.location,
          amount: Math.floor(Math.random() * 20) + 5,
          type: ['Dine-in', 'Takeout', 'Delivery'][Math.floor(Math.random() * 3)] as any,
          time: new Date().toLocaleTimeString(),
          status: 'pending'
        };
        
        setLiveOrders(prevOrders => [newOrder, ...prevOrders.slice(0, 19)]);
      }

      return updated;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📊 Real-Time Dashboard</h1>
            <p className="welcome-subtitle">Live data streaming and monitoring</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📊 Live</div>
            <div className="text-sm opacity-80">Real-time</div>
          </div>
        </div>
      </div>

      {/* ===== CONNECTION STATUS ===== */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Live Operations Center</h2>
          <Badge variant="outline" className="text-xs">
            {isConnected ? 'Connected' : 'Disconnected'} • Real-time
          </Badge>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Last update: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* ===== LIVE KPIs ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <span>Total Revenue</span>
              <DollarSign className="h-6 w-6 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ${totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Live across all locations
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <span>Active Orders</span>
              <Users className="h-6 w-6 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeOrders}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Currently in progress
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <span>Active Locations</span>
              <MapPin className="h-6 w-6 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {liveMetrics.filter(m => m.status === 'online').length} / {liveMetrics.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Online and processing
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
              <span>System Health</span>
              <Activity className="h-6 w-6 text-orange-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {Math.floor(Math.random() * 20) + 80}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Network performance
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ===== LIVE LOCATIONS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Wifi className="h-6 w-6 text-blue-600" />
            Live Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {liveMetrics.map((metric, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{metric.location}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Location {index + 1}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)}`}></div>
                    {getStatusIcon(metric.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Revenue:</span>
                    <span className="font-medium text-slate-900 dark:text-white">${metric.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Orders:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{metric.orders}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Status: {metric.status}</span>
                  <span>Updated: {metric.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== LIVE ORDERS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Clock className="h-6 w-6 text-green-600" />
            Live Order Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveOrders.map((order, index) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{order.id}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{order.location} • {order.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getOrderStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">${order.amount}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{order.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== SYSTEM ALERTS ===== */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {liveMetrics.filter(m => m.status !== 'online').map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{metric.location}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Status: {metric.status}</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Investigate
                </Button>
              </div>
            ))}
            {liveMetrics.filter(m => m.status !== 'online').length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-300 py-4">
                All systems operational • No alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}