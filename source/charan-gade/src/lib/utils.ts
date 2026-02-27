import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date Range Helpers ──────────────────────────────────────

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function getDateRange(rangeType: "week" | "month" | "year" | "all"): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = today.toISOString().split("T")[0];
  
  let startDate: string;

  switch (rangeType) {
    case "week":
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split("T")[0];
      break;
    case "month":
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split("T")[0];
      break;
    case "year":
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      startDate = yearAgo.toISOString().split("T")[0];
      break;
    case "all":
    default:
      startDate = "2000-01-01";
      break;
  }

  return { startDate, endDate };
}
