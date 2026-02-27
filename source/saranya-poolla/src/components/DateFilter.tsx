import { useState } from "react";
import { Calendar, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateFilterProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  defaultDays?: number;
}

export default function DateFilter({ onDateRangeChange, defaultDays = 30 }: DateFilterProps) {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - defaultDays * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showCustom, setShowCustom] = useState(false);

  const presets = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Last 6 months", days: 180 },
    { label: "Last 12 months", days: 365 },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleQuickSelect = (days: number) => {
    const newStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const newEndDate = new Date();
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setShowCustom(false);
    onDateRangeChange(newStartDate, newEndDate);
  };

  const handleCustomApply = () => {
    if (startDate && endDate && startDate <= endDate) {
      onDateRangeChange(startDate, endDate);
    }
  };

  return (
    <div className="interactive-card gpu-accelerated p-4 border-none bg-gradient-to-r from-navy to-black text-off-white rounded-xl shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-accent-cyan" />
          <h3 className="text-lg font-semibold">Date Range Filter</h3>
        </div>
        <div className="text-sm text-slate-300 font-mono">
          {formatDate(startDate)} - {formatDate(endDate)}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(preset.days)}
            className="interactive-button gpu-accelerated text-xs"
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={showCustom ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="interactive-button gpu-accelerated text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Custom
        </Button>
      </div>

      {/* Custom Date Inputs */}
      {showCustom && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-black/20 rounded-lg border border-slate-600">
          <div>
            <Label className="text-sm font-medium mb-2 block">Start Date</Label>
            <Input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="gpu-accelerated bg-slate-800 border-slate-600 text-off-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">End Date</Label>
            <Input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="gpu-accelerated bg-slate-800 border-slate-600 text-off-white"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button
              onClick={handleCustomApply}
              className="interactive-button gpu-accelerated"
            >
              Apply Custom Range
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCustom(false)}
              className="interactive-button gpu-accelerated"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Date Range Display */}
      <div className="flex items-center justify-between text-sm text-slate-300 border-t border-slate-600 pt-3">
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse"></div>
          Current Range
        </span>
        <span className="font-mono">
          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days selected
        </span>
      </div>
    </div>
  );
}
