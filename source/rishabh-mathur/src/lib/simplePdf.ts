type PdfOptions = {
  title: string;
  fileName: string;
  lines: string[];
};

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(text: string, maxChars = 94): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function downloadTextPdf({ title, fileName, lines }: PdfOptions): void {
  const pageWidth = 612;
  const left = 40;
  const top = 752;
  const lineHeight = 14;
  const headerHeight = 24;

  const contentLines: string[] = [];
  lines.forEach((line) => {
    const rawParts = line.split(/\r?\n/);
    rawParts.forEach((part) => {
      if (!part.trim()) {
        contentLines.push("");
        return;
      }
      wrapLine(part).forEach((wrapped) => contentLines.push(wrapped));
    });
  });

  let y = top - headerHeight;
  const contentOps: string[] = [];

  contentOps.push("BT");
  contentOps.push("/F1 20 Tf");
  contentOps.push(`1 0 0 1 ${left} ${top} Tm`);
  contentOps.push(`(${escapePdfText(title)}) Tj`);
  contentOps.push("ET");

  contentOps.push("0.4 w");
  contentOps.push(`${left} ${top - 8} m ${pageWidth - left} ${top - 8} l S`);

  contentOps.push("BT");
  contentOps.push("/F1 11 Tf");
  contentOps.push(`1 0 0 1 ${left} ${y} Tm`);

  contentLines.forEach((line, idx) => {
    if (idx > 0) {
      contentOps.push(`0 -${lineHeight} Td`);
      y -= lineHeight;
    }
    if (y < 36) return;
    contentOps.push(`(${escapePdfText(line)}) Tj`);
  });

  contentOps.push("ET");

  const contentStream = contentOps.join("\n");

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[5] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += "xref\n0 6\n";
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= 5; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/[^a-z0-9-_]/gi, "_")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
