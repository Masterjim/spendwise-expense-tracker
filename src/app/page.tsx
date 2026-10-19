"use client";

import { useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseDialog } from "@/hooks/useExpenseDialog";
import { useToast } from "@/hooks/useToast";
import { dashboardStats, monthlyTotals, sortExpenses, totalsByCategory } from "@/lib/analytics";
import { generateSampleExpenses } from "@/lib/sampleData";
import { formatMonthLabel, monthKey, todayISO } from "@/lib/format";
import DataGuard from "@/components/DataGuard";
import SummaryCards from "@/components/SummaryCards";
import MonthlyChart from "@/components/MonthlyChart";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import RecentExpenses from "@/components/RecentExpenses";
import { EmptyState } from "@/components/States";
import ExportButton from "@/components/export/ExportButton";

export default function DashboardPage() {
  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">An overview of your spending habits.</p>
        </div>
        <ExportButton />
      </div>
      <DataGuard>
        <Dashboard />
      </DataGuard>
    </>
  );
}

function Dashboard() {
  const { expenses, importExpenses } = useExpenses();
  const { openAdd } = useExpenseDialog();
  const { toast } = useToast();

  const stats = useMemo(() => dashboardStats(expenses), [expenses]);
  const byCategory = useMemo(() => totalsByCategory(expenses), [expenses]);
  const thisMonthByCategory = useMemo(() => {
    const key = monthKey(todayISO());
    return totalsByCategory(expenses.filter((e) => monthKey(e.date) === key));
  }, [expenses]);
  const monthly = useMemo(() => monthlyTotals(expenses, 6), [expenses]);
  const recent = useMemo(() => sortExpenses(expenses, "date-desc").slice(0, 6), [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="💸"
          title="No expenses yet"
          description="Add your first expense to start seeing insights, or load sample data to explore the app."
        >
          <button type="button" onClick={openAdd} className="btn-primary">
            Add your first expense
          </button>
          <button
            type="button"
            onClick={() => {
              const sample = generateSampleExpenses();
              importExpenses(sample);
              toast(`Loaded ${sample.length} sample expenses`, { variant: "info" });
            }}
            className="btn-secondary"
          >
            Load sample data
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards stats={stats} topCategory={byCategory[0]} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthlyChart data={monthly} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdown
            data={thisMonthByCategory}
            title={`${formatMonthLabel(monthKey(todayISO()), "long")} by category`}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentExpenses expenses={recent} />
        </div>
        <div className="lg:col-span-2">
          <CategoryBreakdown data={byCategory} title="All-time by category" />
        </div>
      </div>
    </div>
  );
}
