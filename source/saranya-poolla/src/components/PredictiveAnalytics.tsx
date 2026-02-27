import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target,
  AlertTriangle,
  DollarSign,
  Calendar,
  Zap
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PredictionData {
  date: string;
  predictedRevenue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  riskFactors: string[];
}

interface InventoryOptimization {
  product: string;
  currentStock: number;
  predictedDemand: number;
  suggestedOrder: number;
  urgency: 'high' | 'medium' | 'low';
}

export default function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [inventoryOptimization, setInventoryOptimization] = useState<InventoryOptimization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate AI predictions
    const generatePredictions = () => {
      const data: PredictionData[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const baseRevenue = 15000 + Math.random() * 10000;
        const confidence = 85 + Math.random() * 15;
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
        
        data.push({
          date: date.toISOString().split('T')[0],
          predictedRevenue: Math.round(baseRevenue),
          confidence: Math.round(confidence),
          trend,
          riskFactors: Math.random() > 0.5 ? ['Weather forecast', 'Local events'] : []
        });
      }
      
      setPredictions(data);
    };

    const generateInventoryOptimization = () => {
      const items: InventoryOptimization[] = [
        {
          product: 'Strawberry Syrup',
          currentStock: 45,
          predictedDemand: 60,
          suggestedOrder: 25,
          urgency: 'high'
        },
        {
          product: 'Blue Raspberry Syrup',
          currentStock: 30,
          predictedDemand: 35,
          suggestedOrder: 10,
          urgency: 'medium'
        },
        {
          product: 'Cherry Syrup',
          currentStock: 50,
          predictedDemand: 40,
          suggestedOrder: 0,
          urgency: 'low'
        },
        {
          product: 'Cone Supplies',
          currentStock: 200,
          predictedDemand: 300,
          suggestedOrder: 150,
          urgency: 'high'
        }
      ];
      
      setInventoryOptimization(items);
    };

    setLoading(false);
    generatePredictions();
    generateInventoryOptimization();
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">🧠 Predictive Analytics</h1>
            <p className="welcome-subtitle">AI-powered insights and forecasting</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">🧠 Live</div>
            <div className="text-sm opacity-80">Predictive</div>
          </div>
        </div>
      </div>

      {/* ===== AI PREDICTIONS HEADER ===== */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI-Powered Predictions</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Machine learning forecasts for optimal decision making</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-yellow-500" />
          Real-time AI
        </Badge>
      </div>

      {/* ===== 7-DAY REVENUE PREDICTIONS ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Calendar className="h-6 w-6 text-blue-600" />
            7-Day Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.map((pred, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Confidence: {pred.confidence}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(pred.trend)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pred.trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      pred.trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {pred.trend.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  ${pred.predictedRevenue.toLocaleString()}
                </div>
                
                {pred.riskFactors.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{pred.riskFactors.join(', ')}</span>
                  </div>
                )}
                
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${pred.confidence}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== INVENTORY OPTIMIZATION ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <DollarSign className="h-6 w-6 text-green-600" />
            Smart Inventory Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryOptimization.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getUrgencyColor(item.urgency)}`}></div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.product}</h3>
                    <Badge variant="outline" className="text-xs">
                      Urgency: {item.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="font-medium">Current:</span> {item.currentStock} units
                    </div>
                    <div>
                      <span className="font-medium">Demand:</span> {item.predictedDemand} units
                    </div>
                    <div>
                      <span className="font-medium">Suggested:</span> {item.suggestedOrder} units
                    </div>
                    <div>
                      <span className="font-medium">Gap:</span> {item.predictedDemand - item.currentStock} units
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button 
                    variant={item.urgency === 'high' ? "destructive" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <Zap className="h-3 w-3" />
                    Order Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== AI INSIGHTS SUMMARY ===== */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Insights Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Revenue Trend</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                7-day forecast shows {predictions.filter(p => p.trend === 'up').length} days of growth potential
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Inventory Risk</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {inventoryOptimization.filter(i => i.urgency === 'high').length} items need immediate attention
              </p>
            </div>
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-lg">
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Optimization Score</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                AI suggests {inventoryOptimization.reduce((sum, i) => sum + i.suggestedOrder, 0)} units for optimal stock levels
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}