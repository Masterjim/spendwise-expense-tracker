import type { Category, Expense } from "@/types/expense";

export type ExportFormat = "csv" | "json" | "pdf";

export type ExportSort = "date-asc" | "date-desc" | "amount-desc";

export interface ExportOptions {
  format: ExportFormat;
  /** Inclusive YYYY-MM-DD bounds; empty string means unbounded. */
  startDate: string;
  endDate: string;
  /** Categories to include. Never empty when exporting. */
  categories: Category[];
  sort: ExportSort;
  /** Base filename without extension. */
  filename: string;
}

export interface ExportSummary {
  count: number;
  total: number;
  average: number;
  /** Earliest and latest dates actually present in the selection. */
  firstDate: string | null;
  lastDate: string | null;
  byCategory: Array<{ category: Category; count: number; total: number }>;
}

/** Everything a format needs to render a file. */
export interface ExportPayload {
  records: Expense[];
  summary: ExportSummary;
  options: ExportOptions;
  generatedAt: Date;
}

export interface ExportFormatDefinition {
  id: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
  description: string;
  /** Whether a raw text preview of the output can be shown. */
  textPreview: boolean;
  render: (payload: ExportPayload) => Promise<Blob>;
  /** Text output for the "Raw" preview tab (only when textPreview is true). */
  renderText?: (payload: ExportPayload) => string;
}
