"use client";

import { useCallback, useDeferredValue, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ExpenseFormDialog";
import { useExpenses } from "@/hooks/useExpenses";
import { CATEGORIES, type Category } from "@/types/expense";
import {
  EXPORT_FORMATS,
  MAX_FILENAME_LENGTH,
  buildPayload,
  runExport,
  stripExtension,
  validateFilename,
  type ExportResult,
  type ExportSort,
} from "@/lib/export";
import { useExportState, type ExportInitialValues } from "./useExportState";
import FormatSelector from "./FormatSelector";
import DateRangeSection from "./DateRangeSection";
import CategorySelector from "./CategorySelector";
import ExportPreview from "./ExportPreview";
import ExportSummaryBar from "./ExportSummaryBar";

type Phase =
  | { status: "idle" }
  | { status: "rendering" }
  | { status: "success"; result: ExportResult }
  | { status: "error"; message: string };

interface Props {
  onClose: () => void;
  initialValues?: ExportInitialValues;
}

export default function ExportDialog({ onClose, initialValues = {} }: Props) {
  const { expenses } = useExpenses();
  const [state, dispatch] = useExportState(initialValues);
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [attempted, setAttempted] = useState(false);

  // Preview recomputes from a deferred copy so typing a filename or
  // toggling options never blocks on re-filtering a large dataset.
  const deferred = useDeferredValue(state);
  const payload = useMemo(() => buildPayload(expenses, deferred), [expenses, deferred]);
  const stale = deferred !== state;

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    for (const e of expenses) {
      if ((!state.startDate || e.date >= state.startDate) && (!state.endDate || e.date <= state.endDate)) {
        counts[e.category] += 1;
      }
    }
    return counts;
  }, [expenses, state.startDate, state.endDate]);

  const format = EXPORT_FORMATS[state.format];
  const baseName = stripExtension(state.filename.trim(), format.extension);
  const filenameError = validateFilename(baseName);
  const rangeInvalid = Boolean(state.startDate && state.endDate && state.startDate > state.endDate);
  const noCategories = state.categories.length === 0;
  const busy = phase.status === "rendering";

  const blocker = rangeInvalid
    ? "Fix the date range"
    : noCategories
      ? "Select at least one category"
      : payload.records.length === 0 && !stale
        ? "No matching expenses"
        : filenameError
          ? "Fix the filename"
          : null;

  // Any change to the options invalidates a previous success/error message.
  const update = useCallback(
    (action: Parameters<typeof dispatch>[0]) => {
      dispatch(action);
      setPhase((p) => (p.status === "rendering" ? p : { status: "idle" }));
    },
    [dispatch],
  );

  const handleExport = async () => {
    setAttempted(true);
    if (blocker || busy) return;
    setPhase({ status: "rendering" });
    // Let the loading state paint before potentially heavy work.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const result = await runExport(expenses, { ...state, filename: baseName });
      // Status is reported in the dialog footer; a toast would cover it on mobile.
      setPhase({ status: "success", result });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Export failed.";
      setPhase({ status: "error", message });
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleExport();
    }
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <FooterStatus
        phase={phase}
        blocker={attempted || payload.records.length === 0 ? blocker : null}
        count={payload.records.length}
        filename={`${baseName || "…"}.${format.extension}`}
      />
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={onClose} disabled={busy} className="btn-secondary flex-1 sm:flex-none">
          {phase.status === "success" ? "Done" : "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy || Boolean(blocker)}
          className="btn-primary flex-1 sm:min-w-[11rem] sm:flex-none"
          title="Ctrl/⌘ + Enter"
        >
          {busy ? (
            <>
              <Spinner /> {state.format === "pdf" ? "Generating PDF…" : "Preparing file…"}
            </>
          ) : phase.status === "success" ? (
            `Export again`
          ) : (
            `Export ${payload.records.length.toLocaleString("en-US")} as ${format.label}`
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      title="Export expenses"
      description="Choose a format, narrow down the data, and preview it before downloading."
      onClose={busy ? () => {} : onClose}
      size="xl"
      footer={footer}
    >
      <div onKeyDown={onKeyDown} className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Section step={1} title="Format">
            <FormatSelector value={state.format} onChange={(f) => update({ type: "format", format: f })} disabled={busy} />
          </Section>

          <Section step={2} title="Date range">
            <DateRangeSection
              preset={state.datePreset}
              startDate={state.startDate}
              endDate={state.endDate}
              disabled={busy}
              onPreset={(preset) => update({ type: "preset", preset })}
              onDates={(startDate, endDate) => update({ type: "dates", startDate, endDate })}
            />
          </Section>

          <Section step={3} title="Categories">
            <CategorySelector
              selected={state.categories}
              counts={categoryCounts}
              disabled={busy}
              onToggle={(category) => update({ type: "toggleCategory", category })}
              onOnly={(category) => update({ type: "onlyCategory", category })}
              onSetAll={(categories) => update({ type: "categories", categories })}
            />
          </Section>

          <Section step={4} title="File">
            <div className="space-y-3">
              <div>
                <label htmlFor="export-filename" className="text-xs font-medium text-slate-500">
                  Filename
                </label>
                <div
                  className={`mt-1 flex rounded-lg border bg-white shadow-sm transition focus-within:ring-2 ${
                    attempted && filenameError
                      ? "border-rose-400 focus-within:ring-rose-200"
                      : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-200"
                  }`}
                >
                  <input
                    id="export-filename"
                    type="text"
                    value={state.filename}
                    disabled={busy}
                    maxLength={MAX_FILENAME_LENGTH + 10}
                    spellCheck={false}
                    onChange={(e) => update({ type: "filename", filename: e.target.value })}
                    onBlur={() => setAttempted(true)}
                    aria-invalid={Boolean(attempted && filenameError)}
                    aria-describedby="export-filename-error"
                    className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm text-slate-900 outline-none"
                  />
                  <span className="flex items-center rounded-r-lg border-l border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-500">
                    .{format.extension}
                  </span>
                </div>
                {attempted && filenameError && (
                  <p id="export-filename-error" role="alert" className="mt-1 text-xs font-medium text-rose-600">
                    {filenameError}
                  </p>
                )}
              </div>
              <label className="block text-xs font-medium text-slate-500">
                Sort rows by
                <select
                  value={state.sort}
                  disabled={busy}
                  onChange={(e) => update({ type: "sort", sort: e.target.value as ExportSort })}
                  className="input mt-1"
                >
                  <option value="date-asc">Date — oldest first</option>
                  <option value="date-desc">Date — newest first</option>
                  <option value="amount-desc">Amount — highest first</option>
                </select>
              </label>
            </div>
          </Section>
        </div>

        <div className="flex min-h-[22rem] flex-col gap-3 lg:sticky lg:top-0 lg:h-[34rem]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
            {stale && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Spinner className="h-3 w-3" /> Updating
              </span>
            )}
          </div>
          <ExportSummaryBar summary={payload.summary} totalAvailable={expenses.length} />
          <ExportPreview payload={payload} stale={stale} />
        </div>
      </div>
    </Modal>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
          {step}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function FooterStatus({
  phase,
  blocker,
  count,
  filename,
}: {
  phase: Phase;
  blocker: string | null;
  count: number;
  filename: string;
}) {
  if (phase.status === "success") {
    return (
      <p className="flex min-w-0 items-center gap-2 text-sm text-emerald-700" role="status">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
        <span className="truncate">
          Downloaded <span className="font-medium">{phase.result.filename}</span> · {formatBytes(phase.result.bytes)}
        </span>
      </p>
    );
  }
  if (phase.status === "error") {
    return (
      <p className="text-sm font-medium text-rose-600" role="alert">
        {phase.message}
      </p>
    );
  }
  if (blocker) {
    return <p className="text-sm text-amber-700">{blocker}</p>;
  }
  return (
    <p className="min-w-0 truncate text-sm text-slate-500">
      {count.toLocaleString("en-US")} {count === 1 ? "record" : "records"} →{" "}
      <span className="font-mono text-xs text-slate-700">{filename}</span>
    </p>
  );
}
