"use client";

import { useExpenses } from "@/hooks/useExpenses";

export default function StorageWarning() {
  const { status, error } = useExpenses();
  if (status !== "ready" || !error) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
      {error}
    </div>
  );
}
