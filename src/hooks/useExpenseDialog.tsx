"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Expense } from "@/types/expense";
import ExpenseFormDialog from "@/components/ExpenseFormDialog";

interface ExpenseDialogContextValue {
  openAdd: () => void;
  openEdit: (expense: Expense) => void;
}

const ExpenseDialogContext = createContext<ExpenseDialogContextValue | null>(null);

type DialogState = { open: false } | { open: true; expense: Expense | null };

export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ open: false });

  const openAdd = useCallback(() => setState({ open: true, expense: null }), []);
  const openEdit = useCallback((expense: Expense) => setState({ open: true, expense }), []);
  const close = useCallback(() => setState({ open: false }), []);

  const value = useMemo(() => ({ openAdd, openEdit }), [openAdd, openEdit]);

  return (
    <ExpenseDialogContext.Provider value={value}>
      {children}
      {state.open && <ExpenseFormDialog expense={state.expense} onClose={close} />}
    </ExpenseDialogContext.Provider>
  );
}

export function useExpenseDialog(): ExpenseDialogContextValue {
  const ctx = useContext(ExpenseDialogContext);
  if (!ctx) throw new Error("useExpenseDialog must be used within an ExpenseDialogProvider");
  return ctx;
}
