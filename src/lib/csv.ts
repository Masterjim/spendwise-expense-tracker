import type { Expense } from "@/types/expense";
import { todayISO } from "./format";

function escapeCell(value: string | number): string {
  let str = String(value);
  // Neutralize spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(str) && typeof value === "string") str = `'${str}`;
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function expensesToCSV(expenses: Expense[]): string {
  const header = ["Date", "Category", "Description", "Amount"];
  const rows = expenses.map((e) =>
    [e.date, e.category, e.description, e.amount.toFixed(2)].map(escapeCell).join(","),
  );
  return [header.join(","), ...rows].join("\r\n");
}

export function downloadCSV(expenses: Expense[], filename = `expenses-${todayISO()}.csv`): void {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["﻿" + expensesToCSV(expenses)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
