import type { ExportSummary } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/format";

export default function ExportSummaryBar({ summary, totalAvailable }: { summary: ExportSummary; totalAvailable: number }) {
  const pct = totalAvailable > 0 ? Math.round((summary.count / totalAvailable) * 100) : 0;
  const items = [
    { label: "Records", value: summary.count.toLocaleString("en-US"), sub: `${pct}% of ${totalAvailable}` },
    { label: "Total", value: formatCurrency(summary.total), sub: `avg ${formatCurrency(summary.average)}` },
    {
      label: "Period",
      value: summary.firstDate ? formatDate(summary.firstDate) : "—",
      sub: summary.lastDate ? `to ${formatDate(summary.lastDate)}` : "",
    },
  ];
  return (
    <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/60" aria-live="polite">
      {items.map((it) => (
        <div key={it.label} className="min-w-0 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{it.label}</p>
          <p className="truncate text-sm font-semibold tabular-nums text-slate-900">{it.value}</p>
          <p className="truncate text-[11px] text-slate-500">{it.sub}</p>
        </div>
      ))}
    </div>
  );
}
