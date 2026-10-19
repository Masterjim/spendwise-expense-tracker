import type { Expense } from "@/types/expense";
import { csvFormat } from "./formats/csv";
import { jsonFormat } from "./formats/json";
import { pdfFormat } from "./formats/pdf";
import { downloadBlob } from "./download";
import { selectRecords, summarize } from "./select";
import type { ExportFormat, ExportFormatDefinition, ExportOptions, ExportPayload } from "./types";

export const EXPORT_FORMATS: Record<ExportFormat, ExportFormatDefinition> = {
  csv: csvFormat,
  json: jsonFormat,
  pdf: pdfFormat,
};

export function buildPayload(expenses: Expense[], options: ExportOptions, generatedAt = new Date()): ExportPayload {
  const records = selectRecords(expenses, options);
  return { records, summary: summarize(records), options, generatedAt };
}

export interface ExportResult {
  filename: string;
  count: number;
  bytes: number;
}

/** Renders the file for the given options and triggers a browser download. */
export async function runExport(expenses: Expense[], options: ExportOptions): Promise<ExportResult> {
  const format = EXPORT_FORMATS[options.format];
  const payload = buildPayload(expenses, options);
  if (payload.records.length === 0) throw new Error("No expenses match these filters.");
  const blob = await format.render(payload);
  const filename = `${options.filename.trim()}.${format.extension}`;
  downloadBlob(blob, filename);
  return { filename, count: payload.records.length, bytes: blob.size };
}

export * from "./types";
export { selectRecords, summarize } from "./select";
export { describeFilters } from "./describe";
export { defaultFilename, validateFilename, stripExtension, MAX_FILENAME_LENGTH } from "./filename";
