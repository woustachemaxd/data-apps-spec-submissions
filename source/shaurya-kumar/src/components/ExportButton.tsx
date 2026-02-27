import { Download } from "lucide-react";

interface Column {
    key: string;
    label: string;
    format?: (value: unknown) => string;
}

interface ExportButtonProps {
    data: Record<string, unknown>[];
    columns: Column[];
    filename?: string;
}

export default function ExportButton({ data, columns, filename = "export" }: ExportButtonProps) {
    const handleExport = () => {
        if (data.length === 0) return;

        // Build CSV content
        const header = columns.map((c) => `"${c.label}"`).join(",");
        const rows = data.map((row) =>
            columns
                .map((col) => {
                    const raw = row[col.key];
                    const value = col.format ? col.format(raw) : String(raw ?? "");
                    // Escape double quotes in CSV
                    return `"${value.replace(/"/g, '""')}"`;
                })
                .join(",")
        );

        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border
                       text-[10px] font-semibold uppercase tracking-[0.12em]
                       text-muted-foreground hover:bg-accent hover:text-foreground
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Export as CSV"
        >
            <Download size={11} />
            CSV
        </button>
    );
}
