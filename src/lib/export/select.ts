import { CATEGORIES, type Expense } from "@/types/expense";
import type { ExportOptions, ExportSort, ExportSummary } from "./types";

export function selectRecords(expenses: Expense[], options: Pick<ExportOptions, "startDate" | "endDate" | "categories" | "sort">): Expense[] {
  const allowed = new Set(options.categories);
  const records = expenses.filter(
    (e) =>
      allowed.has(e.category) &&
      (!options.startDate || e.date >= options.startDate) &&
      (!options.endDate || e.date <= options.endDate),
  );
  return records.sort(comparator(options.sort));
}

function comparator(sort: ExportSort) {
  return (a: Expense, b: Expense) => {
    switch (sort) {
      case "date-desc":
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      case "amount-desc":
        return b.amount - a.amount || b.date.localeCompare(a.date);
      case "date-asc":
      default:
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
    }
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(records: Expense[]): ExportSummary {
  let total = 0;
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  const byCat = new Map<string, { count: number; total: number }>();

  for (const e of records) {
    total += e.amount;
    if (!firstDate || e.date < firstDate) firstDate = e.date;
    if (!lastDate || e.date > lastDate) lastDate = e.date;
    const bucket = byCat.get(e.category) ?? { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += e.amount;
    byCat.set(e.category, bucket);
  }

  return {
    count: records.length,
    total: round2(total),
    average: records.length ? round2(total / records.length) : 0,
    firstDate,
    lastDate,
    byCategory: CATEGORIES.filter((c) => byCat.has(c))
      .map((category) => {
        const b = byCat.get(category)!;
        return { category, count: b.count, total: round2(b.total) };
      })
      .sort((a, b) => b.total - a.total),
  };
}
