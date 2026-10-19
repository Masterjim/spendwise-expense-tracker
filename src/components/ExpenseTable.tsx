"use client";

import type { Expense } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import CategoryBadge from "./CategoryBadge";

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: Props) {
  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-6 py-3 font-medium">Date</th>
            <th className="px-6 py-3 font-medium">Description</th>
            <th className="px-6 py-3 font-medium">Category</th>
            <th className="px-6 py-3 text-right font-medium">Amount</th>
            <th className="w-28 px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {expenses.map((e) => (
            <tr key={e.id} className="group transition hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-6 py-3.5 text-slate-500">{formatDate(e.date)}</td>
              <td className="max-w-xs truncate px-6 py-3.5 font-medium text-slate-900" title={e.description}>
                {e.description}
              </td>
              <td className="px-6 py-3.5">
                <CategoryBadge category={e.category} />
              </td>
              <td className="whitespace-nowrap px-6 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                {formatCurrency(e.amount)}
              </td>
              <td className="px-6 py-3.5">
                <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile list */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {expenses.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ backgroundColor: `${CATEGORY_META[e.category].color}1a` }}
              aria-hidden
            >
              {CATEGORY_META[e.category].icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{e.description}</p>
              <p className="text-xs text-slate-500">
                {e.category} · {formatDate(e.date)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(e.amount)}</span>
              <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} alwaysVisible />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function RowActions({
  expense,
  onEdit,
  onDelete,
  alwaysVisible = false,
}: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  alwaysVisible?: boolean;
}) {
  return (
    <div
      className={`flex justify-end gap-1 transition ${
        alwaysVisible ? "" : "opacity-60 group-hover:opacity-100 focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={() => onEdit(expense)}
        aria-label={`Edit ${expense.description}`}
        title="Edit"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onDelete(expense)}
        aria-label={`Delete ${expense.description}`}
        title="Delete"
        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
