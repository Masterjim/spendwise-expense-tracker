"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import ExportDialog from "./ExportDialog";
import type { ExportInitialValues } from "./useExportState";

/** Opens the export dialog. `getInitialValues` is read at click time so it reflects current page filters. */
export default function ExportButton({ getInitialValues }: { getInitialValues?: () => ExportInitialValues }) {
  const { expenses, status } = useExpenses();
  const [initial, setInitial] = useState<ExportInitialValues | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setInitial(getInitialValues?.() ?? {})}
        disabled={status !== "ready" || expenses.length === 0}
        className="btn-secondary"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
          <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
          <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
        </svg>
        Export…
      </button>
      {initial && <ExportDialog initialValues={initial} onClose={() => setInitial(null)} />}
    </>
  );
}
