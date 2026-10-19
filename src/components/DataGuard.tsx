"use client";

import type { ReactNode } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ErrorState, PageSkeleton } from "./States";

/** Renders loading / error states until expenses are hydrated from localStorage. */
export default function DataGuard({ children, skeleton }: { children: ReactNode; skeleton?: ReactNode }) {
  const { status, error } = useExpenses();

  if (status === "loading") return <>{skeleton ?? <PageSkeleton />}</>;
  if (status === "error") {
    return (
      <ErrorState
        message={error ?? "Unknown error"}
        action={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              try {
                window.localStorage.removeItem("expense-tracker:expenses:v1");
              } catch {
                /* storage disabled */
              }
              window.location.reload();
            }}
          >
            Reset saved data
          </button>
        }
      />
    );
  }
  return <>{children}</>;
}
