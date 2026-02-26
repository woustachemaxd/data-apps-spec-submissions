import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function SummaryCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  subtitle,
  variant = "default",
}: SummaryCardProps) {
  const variantStyles = {
    default: "bg-card",
    success:
      "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    warning:
      "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800",
    danger: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  };

  const iconBgStyles = {
    default: "bg-muted",
    success: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300",
    warning:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300",
    danger: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}