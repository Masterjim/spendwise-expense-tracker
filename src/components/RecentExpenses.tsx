"use client";

import Link from "next/link";
import type { Expense } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import { useExpenseDialog } from "@/hooks/useExpenseDialog";

export default function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const { openEdit } = useExpenseDialog();

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent expenses</h2>
          <p className="text-sm text-slate-500">Your latest transactions</p>
        </div>
        <Link href="/expenses" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          View all →
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {expenses.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => openEdit(e)}
              className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-slate-50 sm:px-6"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: `${CATEGORY_META[e.category].color}1a` }}
                aria-hidden
              >
                {CATEGORY_META[e.category].icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{e.description}</span>
                <span className="block text-xs text-slate-500">
                  {e.category} · {formatDate(e.date)}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">-{formatCurrency(e.amount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
