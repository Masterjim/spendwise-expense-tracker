"use client";

import { EXPORT_FORMATS, type ExportFormat } from "@/lib/export";

const ICONS: Record<ExportFormat, { glyph: string; tint: string }> = {
  csv: { glyph: "CSV", tint: "bg-emerald-100 text-emerald-700" },
  json: { glyph: "{ }", tint: "bg-amber-100 text-amber-700" },
  pdf: { glyph: "PDF", tint: "bg-rose-100 text-rose-700" },
};

export default function FormatSelector({
  value,
  onChange,
  disabled,
}: {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Export format" className="grid grid-cols-3 gap-2">
      {Object.values(EXPORT_FORMATS).map((f) => {
        const active = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(f.id)}
            title={f.description}
            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
              active
                ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-200"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-8 w-10 items-center justify-center rounded-md font-mono text-[11px] font-bold ${ICONS[f.id].tint}`}
              aria-hidden
            >
              {ICONS[f.id].glyph}
            </span>
            <span className="text-sm font-semibold text-slate-900">{f.label}</span>
          </button>
        );
      })}
      <p className="col-span-3 text-xs text-slate-500">{EXPORT_FORMATS[value].description}</p>
    </div>
  );
}
