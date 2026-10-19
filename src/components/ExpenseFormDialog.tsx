"use client";

import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import { CATEGORIES, type Expense } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency, todayISO } from "@/lib/format";
import {
  MAX_DESCRIPTION,
  toExpenseInput,
  validateExpense,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from "@/lib/validation";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

export default function ExpenseFormDialog({ expense, onClose }: Props) {
  const { addExpense, updateExpense } = useExpenses();
  const { toast } = useToast();
  const isEdit = expense !== null;

  const [values, setValues] = useState<ExpenseFormValues>(() =>
    expense
      ? {
          date: expense.date,
          amount: expense.amount.toFixed(2),
          category: expense.category,
          description: expense.description,
        }
      : { date: todayISO(), amount: "", category: "", description: "" },
  );
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseFormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors: ExpenseFormErrors = validateExpense(values);
  const hasErrors = Object.keys(errors).length > 0;
  const showError = (field: keyof ExpenseFormValues) => (submitted || touched[field]) && errors[field];

  const set = <K extends keyof ExpenseFormValues>(field: K, value: ExpenseFormValues[K]) =>
    setValues((v) => ({ ...v, [field]: value }));
  const blur = (field: keyof ExpenseFormValues) => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      // Brief delay gives visible feedback; persistence itself is synchronous.
      await new Promise((r) => setTimeout(r, 250));
      const input = toExpenseInput(values);
      if (isEdit) {
        updateExpense(expense.id, input);
        toast("Expense updated");
      } else {
        addExpense(input);
        toast(`Added ${formatCurrency(input.amount)} for ${input.category}`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast("Something went wrong saving this expense.", { variant: "error" });
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Edit expense" : "Add expense"}
      description={isEdit ? "Update the details of this expense." : "Record a new purchase or bill."}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Amount" htmlFor="amount" error={showError("amount")}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">$</span>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                autoFocus
                value={values.amount}
                onChange={(e) => set("amount", e.target.value)}
                onBlur={() => blur("amount")}
                aria-invalid={!!showError("amount")}
                className={`input pl-7 ${showError("amount") ? "input-error" : ""}`}
              />
            </div>
          </Field>

          <Field label="Date" htmlFor="date" error={showError("date")}>
            <input
              id="date"
              type="date"
              max={todayISO()}
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
              onBlur={() => blur("date")}
              aria-invalid={!!showError("date")}
              className={`input ${showError("date") ? "input-error" : ""}`}
            />
          </Field>
        </div>

        <Field label="Category" error={showError("category")}>
          <div role="radiogroup" aria-label="Category" className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const active = values.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    set("category", c);
                    blur("category");
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {CATEGORY_META[c].icon}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={showError("description")}
          hint={`${values.description.trim().length}/${MAX_DESCRIPTION}`}
        >
          <input
            id="description"
            type="text"
            placeholder="e.g. Weekly groceries"
            maxLength={MAX_DESCRIPTION + 20}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            onBlur={() => blur("description")}
            aria-invalid={!!showError("description")}
            className={`input ${showError("description") ? "input-error" : ""}`}
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary min-w-[8rem]">
            {saving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Add expense"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | false;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
