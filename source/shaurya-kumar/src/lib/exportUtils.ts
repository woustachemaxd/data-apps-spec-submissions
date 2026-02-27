import { toPng } from 'html-to-image';
import type { RefObject } from 'react';

export const exportChartPNG = (ref: RefObject<HTMLElement | null>, filename: string) => {
    if (!ref.current) return;

    // Ensure the chart's container renders correctly by providing it a white background during export
    // and specifying pixelRatio for higher resolution PNGs.
    toPng(ref.current, { backgroundColor: '#fff', pixelRatio: 2 })
        .then((dataUrl) => {
            const a = document.createElement("a");
            a.download = `${filename}_${new Date().toISOString().split("T")[0]}.png`;
            a.href = dataUrl;
            a.click();
        })
        .catch((err) => {
            console.error("Failed to export chart PNG", err);
        });
};

export const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = [
        headers.map((h) => `"${h}"`).join(","),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
};
