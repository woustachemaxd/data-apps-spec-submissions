function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toTitleCase(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveCssVarColors(originalSvg: SVGElement, clonedSvg: SVGElement) {
  const originalNodes = [originalSvg, ...Array.from(originalSvg.querySelectorAll("*"))];
  const clonedNodes = [clonedSvg, ...Array.from(clonedSvg.querySelectorAll("*"))];

  const attrs = ["stroke", "fill", "color", "stop-color"];
  const cssMap: Record<string, string> = {
    stroke: "stroke",
    fill: "fill",
    color: "color",
    "stop-color": "stopColor",
  };

  clonedNodes.forEach((cloneNode, idx) => {
    const originalNode = originalNodes[idx] as Element | undefined;
    if (!originalNode) return;
    const styles = window.getComputedStyle(originalNode as Element);

    attrs.forEach((attr) => {
      const attrVal = cloneNode.getAttribute(attr);
      if (attrVal?.includes("var(")) {
        const computed = styles.getPropertyValue(cssMap[attr] ?? attr).trim();
        if (computed) cloneNode.setAttribute(attr, computed);
      }
    });

    // Ensure text labels keep their visible color.
    if (cloneNode.tagName.toLowerCase() === "text") {
      const fill = cloneNode.getAttribute("fill");
      if (!fill || fill.includes("var(")) {
        const computed = styles.getPropertyValue("fill").trim() || styles.getPropertyValue("color").trim();
        if (computed) cloneNode.setAttribute("fill", computed);
      }
    }
  });
}

export async function exportChartPng(
  containerId: string,
  fileName: string,
  chartTitle?: string
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) return;

  const svg = container.querySelector("svg");
  if (!svg) return;

  const rect = container.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  resolveCssVarColors(svg, clone);

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const image = new Image();
  image.onload = () => {
    const title = chartTitle?.trim() || toTitleCase(fileName);
    const titleBandHeight = 44;
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = (height + titleBandHeight) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }

    ctx.scale(2, 2);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--card-bg").trim() || "#0f0f11";
    const textMain = getComputedStyle(document.documentElement).getPropertyValue("--text-main").trim() || "#ffffff";
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#94a3b8";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height + titleBandHeight);

    ctx.fillStyle = textMain;
    ctx.font = "800 18px Manrope, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(title, 16, 20);
    ctx.strokeStyle = textMuted;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(16, titleBandHeight - 4);
    ctx.lineTo(width - 16, titleBandHeight - 4);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.drawImage(image, 0, titleBandHeight, width, height);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${sanitizeFilename(fileName)}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
  };

  image.src = url;
}
