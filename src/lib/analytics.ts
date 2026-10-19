import { CATEGORIES, type Category, type Expense, type ExpenseFilters, type SortKey } from "@/types/expense";
import { formatMonthLabel, monthKey, toISODate } from "./format";

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const q = filters.search.trim().toLowerCase();
  return expenses.filter((e) => {
    if (filters.category !== "All" && e.category !== filters.category) return false;
    if (filters.startDate && e.date < filters.startDate) return false;
    if (filters.endDate && e.date > filters.endDate) return false;
    if (q && !e.description.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

export function sortExpenses(expenses: Expense[], sort: SortKey): Expense[] {
  const sorted = [...expenses];
  sorted.sort((a, b) => {
    switch (sort) {
      case "date-asc":
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "date-desc":
      default:
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    }
  });
  return sorted;
}

export function sum(expenses: Expense[]): number {
  return Math.round(expenses.reduce((acc, e) => acc + e.amount, 0) * 100) / 100;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
  share: number;
}

export function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const total = sum(expenses);
  return CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const catTotal = sum(items);
    return {
      category,
      total: catTotal,
      count: items.length,
      share: total > 0 ? catTotal / total : 0,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total);
}

export interface MonthTotal {
  key: string;
  label: string;
  total: number;
}

/** Totals for the last `months` calendar months, including the current one. */
export function monthlyTotals(expenses: Expense[], months = 6, now = new Date()): MonthTotal[] {
  const buckets: MonthTotal[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toISODate(d).slice(0, 7);
    buckets.push({ key, label: formatMonthLabel(key), total: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const e of expenses) {
    const i = index.get(monthKey(e.date));
    if (i !== undefined) buckets[i].total += e.amount;
  }
  return buckets.map((b) => ({ ...b, total: Math.round(b.total * 100) / 100 }));
}

export interface DashboardStats {
  total: number;
  count: number;
  thisMonth: number;
  lastMonth: number;
  monthChange: number | null;
  avgPerDayThisMonth: number;
  largest: Expense | null;
}

export function dashboardStats(expenses: Expense[], now = new Date()): DashboardStats {
  const thisKey = toISODate(now).slice(0, 7);
  const lastKey = toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  const thisMonth = sum(expenses.filter((e) => monthKey(e.date) === thisKey));
  const lastMonth = sum(expenses.filter((e) => monthKey(e.date) === lastKey));
  const largest = expenses.reduce<Expense | null>((max, e) => (!max || e.amount > max.amount ? e : max), null);

  return {
    total: sum(expenses),
    count: expenses.length,
    thisMonth,
    lastMonth,
    monthChange: lastMonth > 0 ? (thisMonth - lastMonth) / lastMonth : null,
    avgPerDayThisMonth: thisMonth / now.getDate(),
    largest,
  };
}
