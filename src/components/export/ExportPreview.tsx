"use client";

import { useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import { EXPORT_FORMATS, type ExportPayload } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";

const TABLE_LIMIT = 100;
const RAW_LIMIT = 20;

type Tab = "table" | "raw";

export default function ExportPreview({ payload, stale }: { payload: ExportPayload; stale: boolean }) {
  const [tab, setTab] = useState<Tab>("table");
  const format = EXPORT_FORMATS[payload.options.format];
  const activeTab: Tab = format.textPreview ? tab : "table";
  const { records } = payload;

  const raw = useMemo(() => {
    if (activeTab !== "raw" || !format.renderText) return "";
    // Render a truncated payload so huge exports stay snappy.
    return format.renderText({ ...payload, records: records.slice(0, RAW_LIMIT) });
  }, [activeTab, format, payload, records]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <div role="tablist" aria-label="Preview mode" className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
          {(["table", "raw"] as const).map((t) => {
            const disabled = t === "raw" && !format.textPreview;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={activeTab === t}
                disabled={disabled}
                title={disabled ? "Raw preview isn't available for PDF" : undefined}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:text-slate-300 ${
                  activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t === "table" ? "Table" : `Raw ${format.label}`}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-400">
          {records.length === 0
            ? "Nothing to preview"
            : activeTab === "table"
              ? `Showing ${Math.min(records.length, TABLE_LIMIT)} of ${records.length}`
              : `First ${Math.min(records.length, RAW_LIMIT)} of ${records.length}`}
        </span>
      </div>

      <div className={`min-h-0 flex-1 overflow-auto transition-opacity ${stale ? "opacity-60" : ""}`} aria-busy={stale}>
        {records.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 text-center">
            <span className="text-2xl" aria-hidden>
              🗂️
            </span>
            <p className="mt-2 text-sm font-medium text-slate-700">No expenses match</p>
            <p className="text-xs text-slate-500">Widen the date range or select more categories.</p>
          </div>
        ) : activeTab === "table" ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.slice(0, TABLE_LIMIT).map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatDate(e.date)}</td>
                  <td className="px-3 py-2">
                    <CategoryBadge category={e.category} />
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2 text-slate-800" title={e.description}>
                    {e.description}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                    {formatCurrency(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre p-3 font-mono text-[11px] leading-relaxed text-slate-700">
            {raw}
            {records.length > RAW_LIMIT && (
              <span className="text-slate-400">{`\n… ${records.length - RAW_LIMIT} more records`}</span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
