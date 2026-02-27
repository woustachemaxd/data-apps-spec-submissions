import { Button } from "@/components/ui/button";
import { exportChartPng } from "@/lib/exportChartPng";

export default function ChartDownloadButton({
  chartId,
  fileName,
}: {
  chartId: string;
  fileName: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Download PNG"
      onClick={() => exportChartPng(chartId, fileName)}
      className="h-8 w-8 rounded-lg border border-[var(--border-color)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-primary"
    >
      <span className="material-symbols-outlined text-base">download</span>
    </Button>
  );
}
