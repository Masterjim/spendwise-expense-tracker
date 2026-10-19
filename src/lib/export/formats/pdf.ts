import type { ExportFormatDefinition, ExportPayload } from "../types";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import { describeFilters } from "../describe";

const BRAND: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * jsPDF's built-in fonts only cover Latin-1, so replace anything outside it
 * (emoji, smart punctuation, CJK) instead of letting it render as garbage.
 */
function pdfSafe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

async function renderPDF(payload: ExportPayload): Promise<Blob> {
  // Loaded on demand: ~350 KB that most sessions never need.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { records, summary, options, generatedAt } = payload;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const lastY = () => (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0;

  doc.setProperties({ title: options.filename, creator: "Spendwise", subject: "Expense report" });

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("Expense Report", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generated ${generatedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    pageWidth - margin,
    50,
    { align: "right" },
  );
  doc.text(pdfSafe(describeFilters(options)), margin, 68, { maxWidth: contentWidth });

  // Stat tiles
  const tiles = [
    { label: "Records", value: summary.count.toLocaleString("en-US") },
    { label: "Total spent", value: formatCurrency(summary.total) },
    { label: "Average", value: formatCurrency(summary.average) },
    {
      label: "Period",
      value: summary.firstDate && summary.lastDate ? `${formatDate(summary.firstDate)} - ${formatDate(summary.lastDate)}` : "-",
    },
  ];
  const gap = 10;
  const tileW = (contentWidth - gap * (tiles.length - 1)) / tiles.length;
  const tileY = 86;
  tiles.forEach((t, i) => {
    const x = margin + i * (tileW + gap);
    doc.setDrawColor(...LINE);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, tileY, tileW, 50, 6, 6, "FD");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t.label.toUpperCase(), x + 10, tileY + 17);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(t.label === "Period" ? 8.5 : 13);
    doc.setTextColor(...INK);
    doc.text(t.value, x + 10, tileY + 37, { maxWidth: tileW - 20 });
    doc.setFont("helvetica", "normal");
  });

  // Category breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("By category", margin, tileY + 78);
  autoTable(doc, {
    startY: tileY + 86,
    margin: { left: margin, right: margin },
    head: [["Category", "Records", "Total", "Share"]],
    body: summary.byCategory.map((c) => [
      c.category,
      String(c.count),
      formatCurrency(c.total),
      summary.total > 0 ? `${((c.total / summary.total) * 100).toFixed(1)}%` : "-",
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 5, textColor: INK },
    headStyles: { textColor: MUTED, fontStyle: "bold", fontSize: 8, lineWidth: { bottom: 0.75 }, lineColor: LINE },
    columnStyles: { 0: { cellPadding: { left: 16, top: 5, bottom: 5, right: 5 } } },
    didParseCell: (data) => {
      if (data.column.index > 0) data.cell.styles.halign = "right";
    },
    didDrawCell: (data) => {
      // Colored swatch inside the category cell, left of the name
      if (data.section === "body" && data.column.index === 0) {
        const cat = summary.byCategory[data.row.index]?.category;
        if (!cat) return;
        doc.setFillColor(...hexToRgb(CATEGORY_META[cat].color));
        doc.circle(data.cell.x + 7, data.cell.y + data.cell.height / 2, 2.5, "F");
      }
    },
  });

  // Transactions
  const txY = lastY() + 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Transactions", margin, txY);
  autoTable(doc, {
    startY: txY + 8,
    margin: { left: margin, right: margin, top: 40, bottom: 40 },
    head: [["Date", "Category", "Description", "Amount"]],
    body: records.map((e) => [formatDate(e.date), e.category, pdfSafe(e.description), formatCurrency(e.amount)]),
    foot: [["", "", "Total", formatCurrency(summary.total)]],
    showFoot: "lastPage",
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 5, textColor: INK, overflow: "linebreak" },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [241, 245, 249], textColor: INK, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 88 },
      3: { halign: "right", cellWidth: 80 },
    },
    didParseCell: (data) => {
      if (data.section !== "body" && data.column.index === 3) data.cell.styles.halign = "right";
    },
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Spendwise", margin, h - 20);
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, h - 20, { align: "right" });
  }

  return doc.output("blob");
}

export const pdfFormat: ExportFormatDefinition = {
  id: "pdf",
  label: "PDF",
  extension: "pdf",
  mimeType: "application/pdf",
  description: "A formatted report with totals and a category breakdown. Ready to print or share.",
  textPreview: false,
  render: renderPDF,
};
