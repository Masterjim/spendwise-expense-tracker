import type { Category, ExpenseInput } from "@/types/expense";
import { toISODate } from "./format";

const TEMPLATES: Array<{ category: Category; items: string[]; min: number; max: number; perMonth: number }> = [
  { category: "Food", items: ["Groceries", "Coffee", "Lunch with team", "Pizza night", "Farmers market", "Bakery"], min: 4, max: 85, perMonth: 9 },
  { category: "Transportation", items: ["Gas", "Train pass", "Rideshare", "Parking", "Bike repair"], min: 3, max: 70, perMonth: 4 },
  { category: "Entertainment", items: ["Movie tickets", "Concert", "Streaming subscription", "Board game", "Museum"], min: 8, max: 90, perMonth: 2 },
  { category: "Shopping", items: ["New shoes", "Books", "Home decor", "Headphones", "Clothing"], min: 15, max: 180, perMonth: 2 },
  { category: "Bills", items: ["Electricity", "Internet", "Phone plan", "Water"], min: 30, max: 140, perMonth: 3 },
  { category: "Other", items: ["Gift", "Haircut", "Charity donation", "Pet supplies"], min: 10, max: 60, perMonth: 1 },
];

/** Deterministic PRNG so sample data is stable across reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSampleExpenses(months = 6, now = new Date()): ExpenseInput[] {
  const rand = mulberry32(42);
  const result: ExpenseInput[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const year = now.getFullYear();
    const month = now.getMonth() - m;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay = m === 0 ? now.getDate() : daysInMonth;
    for (const t of TEMPLATES) {
      for (let i = 0; i < t.perMonth; i++) {
        const day = 1 + Math.floor(rand() * maxDay);
        result.push({
          date: toISODate(new Date(year, month, day)),
          amount: Math.round((t.min + rand() * (t.max - t.min)) * 100) / 100,
          category: t.category,
          description: t.items[Math.floor(rand() * t.items.length)],
        });
      }
    }
  }
  return result;
}
