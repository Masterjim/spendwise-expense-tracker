import { CATEGORIES } from "@/types/expense";
import { formatDate } from "@/lib/format";
import type { ExportOptions } from "./types";

/** Human-readable one-liner of the active filters, e.g. for the PDF header. */
export function describeFilters(options: Pick<ExportOptions, "startDate" | "endDate" | "categories">): string {
  const { startDate, endDate, categories } = options;
  let range: string;
  if (startDate && endDate) range = `${formatDate(startDate)} to ${formatDate(endDate)}`;
  else if (startDate) range = `From ${formatDate(startDate)}`;
  else if (endDate) range = `Up to ${formatDate(endDate)}`;
  else range = "All dates";

  const cats =
    categories.length === CATEGORIES.length ? "all categories" : categories.length === 1 ? categories[0] : categories.join(", ");
  return `${range} · ${cats}`;
}
