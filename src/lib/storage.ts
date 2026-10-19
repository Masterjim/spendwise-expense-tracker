import { CATEGORIES, type Expense } from "@/types/expense";

const STORAGE_KEY = "expense-tracker:expenses:v1";

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    typeof e.amount === "number" &&
    Number.isFinite(e.amount) &&
    typeof e.description === "string" &&
    CATEGORIES.includes(e.category as Expense["category"])
  );
}

export function loadExpenses(): Expense[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Stored data is corrupted.");
  return parsed.filter(isExpense);
}

export function saveExpenses(expenses: Expense[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
