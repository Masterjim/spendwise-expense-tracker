"use client";

import { CATEGORIES, type Category } from "@/types/expense";
import { CATEGORY_META } from "@/lib/categories";

interface Props {
  selected: Category[];
  /** Number of matching expenses per category within the current date range. */
  counts: Record<Category, number>;
  onToggle: (category: Category) => void;
  onOnly: (category: Category) => void;
  onSetAll: (categories: Category[]) => void;
  disabled?: boolean;
}

export default function CategorySelector({ selected, counts, onToggle, onOnly, onSetAll, disabled }: Props) {
  const allSelected = selected.length === CATEGORIES.length;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {allSelected ? "All categories" : `${selected.length} of ${CATEGORIES.length} selected`}
        </span>
        <div className="flex gap-3 text-xs font-medium">
          <button
            type="button"
            disabled={disabled || allSelected}
            onClick={() => onSetAll([...CATEGORIES])}
            className="text-brand-600 hover:text-brand-700 disabled:text-slate-300"
          >
            Select all
          </button>
          <button
            type="button"
            disabled={disabled || selected.length === 0}
            onClick={() => onSetAll([])}
            className="text-brand-600 hover:text-brand-700 disabled:text-slate-300"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((c) => {
          const checked = selected.includes(c);
          return (
            <label
              key={c}
              className={`group relative flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                checked ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50 text-slate-400"
              } ${disabled ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(c)}
                className="h-4 w-4 shrink-0 rounded border-slate-300"
                style={{ accentColor: CATEGORY_META[c].color }}
              />
              <span className={`flex-1 truncate ${checked ? "text-slate-700" : ""}`}>{c}</span>
              <span className="text-xs tabular-nums text-slate-400 group-hover:hidden">{counts[c]}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOnly(c);
                }}
                className="hidden text-xs font-medium text-brand-600 group-hover:inline"
                aria-label={`Only ${c}`}
              >
                Only
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}
