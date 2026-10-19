"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Expense, ExpenseInput } from "@/types/expense";
import { generateId, loadExpenses, saveExpenses } from "@/lib/storage";

type Status = "loading" | "ready" | "error";

interface ExpensesContextValue {
  expenses: Expense[];
  status: Status;
  error: string | null;
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => Expense | undefined;
  restoreExpense: (expense: Expense) => void;
  importExpenses: (inputs: ExpenseInput[]) => void;
  clearAll: () => Expense[];
  replaceAll: (expenses: Expense[]) => void;
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Load from localStorage once on mount (client only).
  useEffect(() => {
    try {
      setExpenses(loadExpenses());
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setError("We couldn't read your saved expenses. Your browser storage may be corrupted or disabled.");
      setStatus("error");
    }
    hydrated.current = true;
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated.current || status !== "ready") return;
    try {
      saveExpenses(expenses);
    } catch (err) {
      console.error(err);
      setError("Saving failed — your browser storage may be full or disabled.");
    }
  }, [expenses, status]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      try {
        setExpenses(loadExpenses());
      } catch {
        /* ignore malformed external writes */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addExpense = useCallback((input: ExpenseInput) => {
    const now = new Date().toISOString();
    const expense: Expense = { ...input, id: generateId(), createdAt: now, updatedAt: now };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, input: ExpenseInput) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } : e)),
    );
  }, []);

  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;

  const deleteExpense = useCallback((id: string) => {
    const removed = expensesRef.current.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return removed;
  }, []);

  const restoreExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => (prev.some((e) => e.id === expense.id) ? prev : [expense, ...prev]));
  }, []);

  const importExpenses = useCallback((inputs: ExpenseInput[]) => {
    const now = new Date().toISOString();
    setExpenses((prev) => [
      ...inputs.map((input) => ({ ...input, id: generateId(), createdAt: now, updatedAt: now })),
      ...prev,
    ]);
  }, []);

  const clearAll = useCallback(() => {
    const previous = expensesRef.current;
    setExpenses([]);
    return previous;
  }, []);

  const replaceAll = useCallback((next: Expense[]) => setExpenses(next), []);

  const value = useMemo(
    () => ({
      expenses,
      status,
      error,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      importExpenses,
      clearAll,
      replaceAll,
    }),
    [expenses, status, error, addExpense, updateExpense, deleteExpense, restoreExpense, importExpenses, clearAll, replaceAll],
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses(): ExpensesContextValue {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within an ExpensesProvider");
  return ctx;
}
