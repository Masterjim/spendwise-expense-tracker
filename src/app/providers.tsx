"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/hooks/useToast";
import { ExpensesProvider } from "@/hooks/useExpenses";
import { ExpenseDialogProvider } from "@/hooks/useExpenseDialog";
import { CloudProvider } from "@/hooks/useCloud";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ExpensesProvider>
        <CloudProvider>
          <ExpenseDialogProvider>{children}</ExpenseDialogProvider>
        </CloudProvider>
      </ExpensesProvider>
    </ToastProvider>
  );
}
