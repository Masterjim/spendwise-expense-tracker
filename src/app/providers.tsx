"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/hooks/useToast";
import { ExpensesProvider } from "@/hooks/useExpenses";
import { ExpenseDialogProvider } from "@/hooks/useExpenseDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ExpensesProvider>
        <ExpenseDialogProvider>{children}</ExpenseDialogProvider>
      </ExpensesProvider>
    </ToastProvider>
  );
}
