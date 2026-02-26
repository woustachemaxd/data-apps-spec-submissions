import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { ChartDataPoint, TrendDataPoint, WasteCategoryData } from "@/types";

// Revenue Trend Chart
interface RevenueTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
}

export function RevenueTrendChart({
  data,
  title = "Revenue Trend",
}: RevenueTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Sales by Order Type Pie Chart
interface SalesPieChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export function SalesPieChart({
  data,
  title = "Sales by Order Type",
}: SalesPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={`var(--chart-${index + 1})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Revenue by Order Type Bar Chart
interface RevenueBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
}

export function RevenueBarChart({
  data,
  title = "Revenue by Order Type",
  description,
}: RevenueBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Revenue by Location Bar Chart
interface LocationRevenueChartProps {
  data: { name: string; revenue: number }[];
}

export function LocationRevenueChart({ data }: LocationRevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Daily Revenue Trend by Order Type
interface OrderTypeTrendChartProps {
  data: {
    date: string;
    "Dine-in": number;
    Takeout: number;
    Delivery: number;
  }[];
  title?: string;
}

export function OrderTypeTrendChart({
  data,
  title = "Daily Revenue Trend by Order Type",
}: OrderTypeTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Dine-in"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Takeout"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Delivery"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Waste by Category Bar Chart
interface WasteBarChartProps {
  data: WasteCategoryData[];
}

export function WasteBarChart({ data }: WasteBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waste by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar
                dataKey="wasted"
                fill="var(--chart-4)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Waste Cost Pie Chart
interface WasteCostPieChartProps {
  data: WasteCategoryData[];
}

export function WasteCostPieChart({ data }: WasteCostPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waste Cost by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="cost"
                nameKey="category"
                label={({ name, value }) => `${name}: $${value}`}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={`var(--chart-${index + 1})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}