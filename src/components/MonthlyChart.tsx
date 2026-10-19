"use client";

import { useState } from "react";
import type { MonthTotal } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatMonthLabel } from "@/lib/format";

export default function MonthlyChart({ data }: { data: MonthTotal[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  // Round the axis max up to a "nice" number
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const niceMax = Math.ceil(max / magnitude) * magnitude;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);
  const average = data.reduce((a, d) => a + d.total, 0) / data.length;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Monthly spending</h2>
          <p className="text-sm text-slate-500">Last {data.length} months</p>
        </div>
        <p className="text-sm text-slate-500">
          Avg <span className="font-semibold text-slate-900">{formatCurrency(average)}</span> / month
        </p>
      </div>

      <div className="mt-6 flex h-64 gap-3">
        {/* Y axis */}
        <div className="flex flex-col-reverse justify-between pb-6 text-right text-[11px] text-slate-400">
          {ticks.map((t) => (
            <span key={t} className="leading-none">
              {formatCurrencyCompact(t)}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* Grid lines */}
          <div className="absolute inset-0 bottom-6 flex flex-col-reverse justify-between">
            {ticks.map((t) => (
              <div key={t} className="border-t border-dashed border-slate-100" />
            ))}
          </div>
          {/* Average line */}
          <div
            className="absolute inset-x-0 z-10 border-t-2 border-dotted border-brand-300"
            style={{ bottom: `calc(1.5rem + (100% - 1.5rem) * ${average / niceMax})` }}
            aria-hidden
          />

          <div className="absolute inset-0 flex items-end gap-2 sm:gap-4">
            {data.map((d, i) => {
              const isCurrent = i === data.length - 1;
              const active = hovered === i;
              return (
                <div
                  key={d.key}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {active && (
                    <div className="absolute z-20 -translate-y-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
                      style={{ bottom: `calc(1.5rem + (100% - 1.5rem) * ${d.total / niceMax})` }}
                    >
                      <p className="font-medium">{formatMonthLabel(d.key, "long")}</p>
                      <p className="text-slate-300">{formatCurrency(d.total)}</p>
                    </div>
                  )}
                  <div className="flex w-full flex-1 items-end justify-center pb-0">
                    <div
                      role="img"
                      aria-label={`${formatMonthLabel(d.key, "long")}: ${formatCurrency(d.total)}`}
                      tabIndex={0}
                      onFocus={() => setHovered(i)}
                      onBlur={() => setHovered(null)}
                      className={`w-full max-w-[3rem] rounded-t-md transition-all duration-500 ${
                        isCurrent
                          ? "bg-gradient-to-t from-brand-600 to-brand-400"
                          : active
                            ? "bg-brand-300"
                            : "bg-brand-100"
                      }`}
                      style={{ height: `${(d.total / niceMax) * 100}%`, minHeight: d.total > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className={`mt-2 h-4 text-xs ${isCurrent ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
