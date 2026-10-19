"use client";

import { useMemo, useState } from "react";
import type { Expense, ExpenseFilters, SortKey } from "@/types/expense";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseDialog } from "@/hooks/useExpenseDialog";
import { useToast } from "@/hooks/useToast";
import { filterExpenses, sortExpenses, sum } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import DataGuard from "@/components/DataGuard";
import FilterBar, { EMPTY_FILTERS } from "@/components/FilterBar";
import ExpenseTable from "@/components/ExpenseTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState, Skeleton } from "@/components/States";
import ExportButton from "@/components/export/ExportButton";

const PAGE_SIZE = 25;

export default function ExpensesPage() {
  return (
    <DataGuard
      skeleton={
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <ExpensesView />
    </DataGuard>
  );
}

function ExpensesView() {
  const { expenses, deleteExpense, restoreExpense, clearAll, replaceAll } = useExpenses();
  const { openAdd, openEdit } = useExpenseDialog();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters), sort),
    [expenses, filters, sort],
  );
  const filteredTotal = useMemo(() => sum(filtered), [filtered]);
  const shown = filtered.slice(0, visible);

  const updateFilters = (next: ExpenseFilters) => {
    setFilters(next);
    setVisible(PAGE_SIZE);
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    const removed = deleteExpense(pendingDelete.id);
    setPendingDelete(null);
    if (removed) {
      toast(`Deleted "${removed.description}"`, {
        variant: "info",
        action: { label: "Undo", onClick: () => restoreExpense(removed) },
        duration: 6000,
      });
    }
  };

  const handleClearAll = () => {
    const previous = clearAll();
    setConfirmClear(false);
    toast(`Removed all ${previous.length} expenses`, {
      variant: "info",
      action: { label: "Undo", onClick: () => replaceAll(previous) },
      duration: 8000,
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">Search, filter, edit and export your transactions.</p>
        </div>
        <div className="flex gap-2">
          {expenses.length > 0 && (
            <button type="button" onClick={() => setConfirmClear(true)} className="btn-secondary text-rose-600">
              Clear all
            </button>
          )}
          <ExportButton
            getInitialValues={() => ({
              startDate: filters.startDate,
              endDate: filters.endDate,
              categories: filters.category === "All" ? undefined : [filters.category],
            })}
          />
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="card">
          <EmptyState icon="🧾" title="No expenses recorded" description="Once you add expenses they'll appear here.">
            <button type="button" onClick={openAdd} className="btn-primary">
              Add expense
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-4">
          <FilterBar filters={filters} onChange={updateFilters} sort={sort} onSortChange={setSort} />

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-sm sm:px-6">
              <span className="text-slate-500">
                {filtered.length} of {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
              </span>
              <span className="text-slate-500">
                Total <span className="font-semibold text-slate-900">{formatCurrency(filteredTotal)}</span>
              </span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState icon="🔍" title="No matches" description="Try adjusting your search or filters.">
                <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="btn-secondary">
                  Clear filters
                </button>
              </EmptyState>
            ) : (
              <>
                <ExpenseTable expenses={shown} onEdit={openEdit} onDelete={setPendingDelete} />
                {filtered.length > visible && (
                  <div className="border-t border-slate-100 p-4 text-center">
                    <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-secondary">
                      Show more ({filtered.length - visible} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete expense?"
          message={`"${pendingDelete.description}" (${formatCurrency(pendingDelete.amount)}) will be removed. You can undo this right after.`}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {confirmClear && (
        <ConfirmDialog
          title="Delete all expenses?"
          message={`This removes all ${expenses.length} expenses from this browser.`}
          confirmLabel="Delete all"
          onConfirm={handleClearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}
