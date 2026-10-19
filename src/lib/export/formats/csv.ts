import type { ExportFormatDefinition, ExportPayload } from "../types";

const HEADER = ["Date", "Category", "Amount", "Description"];

function cell(value: string): string {
  // Prefix values that spreadsheets would evaluate as formulas.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCSV({ records }: ExportPayload): string {
  const rows = records.map((e) => [e.date, e.category, e.amount.toFixed(2), cell(e.description)].join(","));
  return [HEADER.join(","), ...rows].join("\r\n");
}

export const csvFormat: ExportFormatDefinition = {
  id: "csv",
  label: "CSV",
  extension: "csv",
  mimeType: "text/csv;charset=utf-8",
  description: "Spreadsheet-ready. Opens in Excel, Numbers and Google Sheets.",
  textPreview: true,
  renderText: toCSV,
  // A BOM makes Excel detect UTF-8 so non-ASCII descriptions survive.
  render: async (payload) => new Blob(["﻿" + toCSV(payload)], { type: "text/csv;charset=utf-8" }),
};
