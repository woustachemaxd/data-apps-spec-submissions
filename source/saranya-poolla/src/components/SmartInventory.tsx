import { useEffect, useState } from "react";
import { 
  Warehouse, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  BarChart3,
  Target,
  Zap,
  Calendar,
  Percent
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
import { Label } from "@/components/ui/label";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  predictedDemand: number;
  suggestedOrder: number;
  urgency: 'high' | 'medium' | 'low';
  costPerUnit: number;
  lastOrderDate: string;
  supplier: string;
  leadTime: number; // days
  wasteRate: number; // percentage
  popularity: 'high' | 'medium' | 'low';
}

interface WasteAnalysis {
  product: string;
  wasteAmount: number;
  wastePercentage: number;
  cost: number;
  recommendations: string[];
}

export default function SmartInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [wasteAnalysis, setWasteAnalysis] = useState<WasteAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(true);

  useEffect(() => {
    // Initialize with comprehensive mock data
    const mockInventory: InventoryItem[] = [
      {
        id: 'strawberry-syrup',
        name: 'Strawberry Syrup',
        category: 'Syrups',
        currentStock: 45,
        minStock: 30,
        maxStock: 100,
        predictedDemand: 60,
        suggestedOrder: 25,
        urgency: 'high',
        costPerUnit: 15.99,
        lastOrderDate: '2024-02-15',
        supplier: 'FlavorCo',
        leadTime: 3,
        wasteRate: 5,
        popularity: 'high'
      },
      {
        id: 'blue-raspberry-syrup',
        name: 'Blue Raspberry Syrup',
        category: 'Syrups',
        currentStock: 30,
        minStock: 25,
        maxStock: 80,
        predictedDemand: 35,
        suggestedOrder: 10,
        urgency: 'medium',
        costPerUnit: 16.99,
        lastOrderDate: '2024-02-18',
        supplier: 'FlavorCo',
        leadTime: 3,
        wasteRate: 3,
        popularity: 'medium'
      },
      {
        id: 'cherry-syrup',
        name: 'Cherry Syrup',
        category: 'Syrups',
        currentStock: 50,
        minStock: 20,
        maxStock: 70,
        predictedDemand: 40,
        suggestedOrder: 0,
        urgency: 'low',
        costPerUnit: 14.99,
        lastOrderDate: '2024-02-10',
        supplier: 'FlavorCo',
        leadTime: 3,
        wasteRate: 8,
        popularity: 'medium'
      },
      {
        id: 'watermelon-syrup',
        name: 'Watermelon Syrup',
        category: 'Syrups',
        currentStock: 15,
        minStock: 25,
        maxStock: 60,
        predictedDemand: 45,
        suggestedOrder: 35,
        urgency: 'high',
        costPerUnit: 15.49,
        lastOrderDate: '2024-02-12',
        supplier: 'FlavorCo',
        leadTime: 3,
        wasteRate: 12,
        popularity: 'high'
      },
      {
        id: 'cone-supplies',
        name: 'Cone Supplies',
        category: 'Supplies',
        currentStock: 200,
        minStock: 300,
        maxStock: 1000,
        predictedDemand: 350,
        suggestedOrder: 150,
        urgency: 'high',
        costPerUnit: 0.25,
        lastOrderDate: '2024-02-05',
        supplier: 'ConeWorld',
        leadTime: 5,
        wasteRate: 2,
        popularity: 'high'
      },
      {
        id: 'napkins',
        name: 'Napkins',
        category: 'Supplies',
        currentStock: 500,
        minStock: 400,
        maxStock: 2000,
        predictedDemand: 450,
        suggestedOrder: 0,
        urgency: 'low',
        costPerUnit: 0.02,
        lastOrderDate: '2024-02-20',
        supplier: 'PaperPlus',
        leadTime: 2,
        wasteRate: 1,
        popularity: 'medium'
      },
      {
        id: 'cups',
        name: 'Cups',
        category: 'Supplies',
        currentStock: 100,
        minStock: 150,
        maxStock: 500,
        predictedDemand: 200,
        suggestedOrder: 100,
        urgency: 'medium',
        costPerUnit: 0.10,
        lastOrderDate: '2024-02-14',
        supplier: 'CupSuppliers',
        leadTime: 4,
        wasteRate: 4,
        popularity: 'medium'
      },
      {
        id: 'straws',
        name: 'Straws',
        category: 'Supplies',
        currentStock: 1000,
        minStock: 800,
        maxStock: 3000,
        predictedDemand: 900,
        suggestedOrder: 0,
        urgency: 'low',
        costPerUnit: 0.01,
        lastOrderDate: '2024-02-08',
        supplier: 'EcoStraws',
        leadTime: 7,
        wasteRate: 0,
        popularity: 'low'
      }
    ];

    const mockWasteAnalysis: WasteAnalysis[] = [
      {
        product: 'Watermelon Syrup',
        wasteAmount: 8,
        wastePercentage: 12,
        cost: 123.92,
        recommendations: [
          'Reduce order quantity by 20%',
          'Monitor demand trends more closely',
          'Consider alternative storage methods'
        ]
      },
      {
        product: 'Cherry Syrup',
        wasteAmount: 5,
        wastePercentage: 8,
        cost: 74.95,
        recommendations: [
          'Optimize reorder timing',
          'Review supplier lead times',
          'Implement first-in-first-out rotation'
        ]
      },
      {
        product: 'Cone Supplies',
        wasteAmount: 10,
        wastePercentage: 2,
        cost: 2.50,
        recommendations: [
          'Current waste rate is acceptable',
          'Continue monitoring usage patterns'
        ]
      }
    ];

    setInventory(mockInventory);
    setWasteAnalysis(mockWasteAnalysis);
    setLoading(false);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const calculateTotalCost = () => {
    return inventory.reduce((sum, item) => sum + (item.suggestedOrder * item.costPerUnit), 0);
  };

  const calculateWasteCost = () => {
    return wasteAnalysis.reduce((sum, waste) => sum + waste.cost, 0);
  };

  const optimizeInventory = () => {
    const optimized = inventory.map(item => {
      // AI-powered optimization logic
      const demandFactor = item.popularity === 'high' ? 1.2 : item.popularity === 'medium' ? 1.0 : 0.8;
      const newPredictedDemand = Math.round(item.predictedDemand * demandFactor);
      const safetyStock = Math.round(newPredictedDemand * 0.2);
      const newOrder = Math.max(0, newPredictedDemand + safetyStock - item.currentStock);
      
      return {
        ...item,
        predictedDemand: newPredictedDemand,
        suggestedOrder: newOrder,
        urgency: (newOrder > 20 ? 'high' : newOrder > 10 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      };
    });

    setInventory(optimized);
  };

  const placeOrder = (item: InventoryItem) => {
    // Simulate placing an order
    const updated = inventory.map(i => 
      i.id === item.id 
        ? { 
            ...i, 
            currentStock: i.currentStock + i.suggestedOrder,
            lastOrderDate: new Date().toISOString().split('T')[0],
            suggestedOrder: 0,
            urgency: 'low' as const
          }
        : i
    );
    setInventory(updated);
  };

  const adjustStock = (itemId: string, adjustment: number) => {
    const updated = inventory.map(item =>
      item.id === itemId
        ? { ...item, currentStock: Math.max(0, item.currentStock + adjustment) }
        : item
    );
    setInventory(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* ===== WELCOME BANNER ===== */}
      <div className="welcome-banner fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="welcome-title">📦 Smart Inventory</h1>
            <p className="welcome-subtitle">AI-powered inventory optimization</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold pulse">📦 Live</div>
            <div className="text-sm opacity-80">Inventory</div>
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Inventory Management</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">AI-powered optimization and waste reduction</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={optimizeInventory} className="gap-2">
            <Zap className="h-4 w-4" />
            Optimize All
          </Button>
          <Button variant="outline" onClick={() => setAutoOptimize(!autoOptimize)} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${autoOptimize ? 'animate-spin' : ''}`} />
            Auto-Optimize: {autoOptimize ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* ===== INVENTORY SUMMARY ===== */}
      <div className="grid gap-6 md:grid-cols-3">
        
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              Suggested Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Total Cost</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${calculateTotalCost().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">High Priority</span>
                <span className="font-bold text-red-600">
                  {inventory.filter(i => i.urgency === 'high').length} items
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Waste Cost</span>
                <span className="font-bold text-orange-600">
                  ${calculateWasteCost().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Target className="h-6 w-6 text-purple-600" />
              Stock Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Below Minimum</span>
                <span className="font-bold text-red-600">
                  {inventory.filter(i => i.currentStock < i.minStock).length} items
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Optimal Range</span>
                <span className="font-bold text-green-600">
                  {inventory.filter(i => i.currentStock >= i.minStock && i.currentStock <= i.maxStock).length} items
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Excess Stock</span>
                <span className="font-bold text-yellow-600">
                  {inventory.filter(i => i.currentStock > i.maxStock).length} items
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Average Waste Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round(inventory.reduce((sum, i) => sum + i.wasteRate, 0) / inventory.length)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Supplier Efficiency</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round((inventory.length * 100 - wasteAnalysis.reduce((sum, w) => sum + w.wastePercentage, 0)) / inventory.length)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-300">Forecast Accuracy</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round(100 - wasteAnalysis.reduce((sum, w) => sum + w.wastePercentage, 0) / wasteAnalysis.length)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ===== INVENTORY LIST ===== */}
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <Warehouse className="h-6 w-6 text-blue-600" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((item, index) => {
              const stockPercentage = (item.currentStock / item.maxStock) * 100;
              const isLowStock = item.currentStock < item.minStock;
              const isHighStock = item.currentStock > item.maxStock;
              const needsOrder = item.suggestedOrder > 0;

              return (
                <div
                  key={index}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center">
                    
                    {/* Product Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getUrgencyColor(item.urgency)}`}></div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{item.category}</p>
                        </div>
                        <Badge variant="outline" className={getPopularityColor(item.popularity)}>
                          {item.popularity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Stock Levels */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">Current Stock</span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.currentStock}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            isLowStock ? 'bg-red-500' : isHighStock ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                    </div>

                    {/* Demand & Order */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">Predicted Demand</span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.predictedDemand}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">Suggested Order</span>
                        <span className={`font-medium ${needsOrder ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                          {item.suggestedOrder}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Cost: ${item.suggestedOrder * item.costPerUnit}</span>
                        <span>Lead Time: {item.leadTime} days</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant={needsOrder ? "default" : "outline"}
                        size="sm"
                        onClick={() => placeOrder(item)}
                        disabled={!needsOrder}
                        className="gap-2"
                      >
                        <Truck className="h-3 w-3" />
                        Order Now
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustStock(item.id, -1)}
                          className="p-1"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustStock(item.id, 1)}
                          className="p-1"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${getUrgencyColor(item.urgency)}`}></span>
                        <span className="font-medium">Urgency: {item.urgency.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>Last Order: {item.lastOrderDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Percent className="h-3 w-3 text-slate-500" />
                        <span>Waste Rate: {item.wasteRate}%</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== WASTE ANALYSIS ===== */}
      <Card className="border-none shadow-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Waste Analysis & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wasteAnalysis.map((waste, index) => (
              <div
                key={index}
                className="p-4 bg-white/50 dark:bg-white/10 rounded-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{waste.product}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Waste: {waste.wasteAmount} units ({waste.wastePercentage}%) • Cost: ${waste.cost}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  {waste.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}