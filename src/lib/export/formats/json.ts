import type { ExportFormatDefinition, ExportPayload } from "../types";

export const JSON_SCHEMA_VERSION = 1;

function toJSON({ records, summary, options, generatedAt }: ExportPayload): string {
  const document = {
    schemaVersion: JSON_SCHEMA_VERSION,
    generator: "Spendwise",
    generatedAt: generatedAt.toISOString(),
    currency: "USD",
    filters: {
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      categories: options.categories,
      sort: options.sort,
    },
    summary,
    expenses: records.map(({ id, date, category, amount, description, createdAt, updatedAt }) => ({
      id,
      date,
      category,
      amount,
      description,
      createdAt,
      updatedAt,
    })),
  };
  return JSON.stringify(document, null, 2);
}

export const jsonFormat: ExportFormatDefinition = {
  id: "json",
  label: "JSON",
  extension: "json",
  mimeType: "application/json",
  description: "Structured data with metadata and a summary. Best for backups and other apps.",
  textPreview: true,
  renderText: toJSON,
  render: async (payload) => new Blob([toJSON(payload)], { type: "application/json" }),
};
