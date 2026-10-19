"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/analytics";
import { CATEGORY_META } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryBreakdown({ data, title = "By category" }: { data: CategoryTotal[]; title?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((a, d) => a + d.total, 0);
  const focused = data.find((d) => d.category === active);

  let offset = 0;
  const segments = data.map((d) => {
    const length = d.share * CIRCUMFERENCE;
    const seg = { ...d, length, offset };
    offset += length;
    return seg;
  });

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">Where your money goes</p>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">No data for this period</p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
          <div className="relative shrink-0">
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
              {segments.map((s) => (
                <circle
                  key={s.category}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={CATEGORY_META[s.category].color}
                  strokeWidth={active === s.category ? STROKE + 6 : STROKE}
                  strokeDasharray={`${Math.max(s.length - (segments.length > 1 ? 2 : 0), 0)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-s.offset}
                  className="cursor-pointer transition-all duration-300"
                  opacity={active && active !== s.category ? 0.35 : 1}
                  onMouseEnter={() => setActive(s.category)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-slate-500">{focused ? focused.category : "Total"}</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(focused ? focused.total : total)}
              </span>
              {focused && <span className="text-xs text-slate-500">{(focused.share * 100).toFixed(1)}%</span>}
            </div>
          </div>

          <ul className="w-full space-y-2.5">
            {data.map((d) => (
              <li
                key={d.category}
                onMouseEnter={() => setActive(d.category)}
                onMouseLeave={() => setActive(null)}
                className={`rounded-lg px-2 py-1 transition ${active === d.category ? "bg-slate-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META[d.category].color }} />
                    {d.category}
                  </span>
                  <span className="font-medium tabular-nums text-slate-900">{formatCurrency(d.total)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.share * 100}%`, backgroundColor: CATEGORY_META[d.category].color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
