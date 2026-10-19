"use client";

import { CATEGORIES, type ExpenseFilters, type SortKey } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";
import { toISODate } from "@/lib/format";

interface Props {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

export const EMPTY_FILTERS: ExpenseFilters = { search: "", category: "All", startDate: "", endDate: "" };

function presetRange(preset: string): Pick<ExpenseFilters, "startDate" | "endDate"> {
  const now = new Date();
  switch (preset) {
    case "this-month":
      return { startDate: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: toISODate(now) };
    case "last-month":
      return {
        startDate: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        endDate: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "last-30":
      return { startDate: toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), endDate: toISODate(now) };
    case "this-year":
      return { startDate: toISODate(new Date(now.getFullYear(), 0, 1)), endDate: toISODate(now) };
    default:
      return { startDate: "", endDate: "" };
  }
}

const PRESETS = [
  { id: "all", label: "All time" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "last-30", label: "Last 30 days" },
  { id: "this-year", label: "This year" },
];

export default function FilterBar({ filters, onChange, sort, onSortChange }: Props) {
  const set = (patch: Partial<ExpenseFilters>) => onChange({ ...filters, ...patch });
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.id);
    return r.startDate === filters.startDate && r.endDate === filters.endDate;
  })?.id;
  const isFiltered =
    filters.search !== "" || filters.category !== "All" || filters.startDate !== "" || filters.endDate !== "";
  const rangeInvalid = filters.startDate && filters.endDate && filters.startDate > filters.endDate;

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            placeholder="Search descriptions…"
            aria-label="Search expenses"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="input pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(e) => set({ category: e.target.value as ExpenseFilters["category"] })}
            className="input sm:w-44"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].icon} {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort expenses"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="input sm:w-44"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set(presetRange(p.id))}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activePreset === p.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            From
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(e) => set({ startDate: e.target.value })}
              className="input w-auto py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            To
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(e) => set({ endDate: e.target.value })}
              className="input w-auto py-1.5 text-sm"
            />
          </label>
          {isFiltered && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      {rangeInvalid && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          The start date is after the end date — no expenses can match.
        </p>
      )}
    </div>
  );
}
