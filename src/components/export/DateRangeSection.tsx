"use client";

import type { DatePreset } from "./useExportState";

const PRESETS: Array<{ id: Exclude<DatePreset, "custom">; label: string }> = [
  { id: "all", label: "All time" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-90", label: "Last 90 days" },
  { id: "ytd", label: "Year to date" },
];

interface Props {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  onPreset: (preset: Exclude<DatePreset, "custom">) => void;
  onDates: (startDate: string, endDate: string) => void;
  disabled?: boolean;
}

export default function DateRangeSection({ preset, startDate, endDate, onPreset, onDates, disabled }: Props) {
  const invalid = Boolean(startDate && endDate && startDate > endDate);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onPreset(p.id)}
            aria-pressed={preset === p.id}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              preset === p.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
            Custom
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-slate-500">
          Start date
          <input
            type="date"
            value={startDate}
            disabled={disabled}
            max={endDate || undefined}
            onChange={(e) => onDates(e.target.value, endDate)}
            aria-invalid={invalid}
            className={`input mt-1 ${invalid ? "input-error" : ""}`}
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          End date
          <input
            type="date"
            value={endDate}
            disabled={disabled}
            min={startDate || undefined}
            onChange={(e) => onDates(startDate, e.target.value)}
            aria-invalid={invalid}
            className={`input mt-1 ${invalid ? "input-error" : ""}`}
          />
        </label>
      </div>
      {invalid && (
        <p role="alert" className="text-xs font-medium text-rose-600">
          Start date must be on or before the end date.
        </p>
      )}
    </div>
  );
}
