"use client";

import { useEffect, useReducer } from "react";
import { CATEGORIES, type Category } from "@/types/expense";
import { defaultFilename, type ExportFormat, type ExportOptions, type ExportSort } from "@/lib/export";
import { toISODate } from "@/lib/format";

export type DatePreset = "all" | "this-month" | "last-month" | "last-90" | "ytd" | "custom";

export interface ExportState extends ExportOptions {
  datePreset: DatePreset;
  /** True once the user edits the filename, so we stop auto-generating it. */
  filenameTouched: boolean;
}

type Action =
  | { type: "format"; format: ExportFormat }
  | { type: "preset"; preset: Exclude<DatePreset, "custom"> }
  | { type: "dates"; startDate: string; endDate: string }
  | { type: "toggleCategory"; category: Category }
  | { type: "onlyCategory"; category: Category }
  | { type: "categories"; categories: Category[] }
  | { type: "sort"; sort: ExportSort }
  | { type: "filename"; filename: string };

export function presetRange(preset: Exclude<DatePreset, "custom">, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = toISODate(now);
  switch (preset) {
    case "this-month":
      return { startDate: toISODate(new Date(y, m, 1)), endDate: today };
    case "last-month":
      return { startDate: toISODate(new Date(y, m - 1, 1)), endDate: toISODate(new Date(y, m, 0)) };
    case "last-90":
      return { startDate: toISODate(new Date(y, m, now.getDate() - 89)), endDate: today };
    case "ytd":
      return { startDate: toISODate(new Date(y, 0, 1)), endDate: today };
    case "all":
    default:
      return { startDate: "", endDate: "" };
  }
}

function matchPreset(startDate: string, endDate: string): DatePreset {
  const presets: Exclude<DatePreset, "custom">[] = ["all", "this-month", "last-month", "last-90", "ytd"];
  return (
    presets.find((p) => {
      const r = presetRange(p);
      return r.startDate === startDate && r.endDate === endDate;
    }) ?? "custom"
  );
}

function reducer(state: ExportState, action: Action): ExportState {
  switch (action.type) {
    case "format":
      return { ...state, format: action.format };
    case "preset":
      return { ...state, ...presetRange(action.preset), datePreset: action.preset };
    case "dates":
      return {
        ...state,
        startDate: action.startDate,
        endDate: action.endDate,
        datePreset: matchPreset(action.startDate, action.endDate),
      };
    case "toggleCategory": {
      const has = state.categories.includes(action.category);
      const next = has ? state.categories.filter((c) => c !== action.category) : [...state.categories, action.category];
      // Keep canonical order so filters and file metadata are stable.
      return { ...state, categories: CATEGORIES.filter((c) => next.includes(c)) };
    }
    case "onlyCategory":
      return { ...state, categories: [action.category] };
    case "categories":
      return { ...state, categories: CATEGORIES.filter((c) => action.categories.includes(c)) };
    case "sort":
      return { ...state, sort: action.sort };
    case "filename":
      return { ...state, filename: action.filename, filenameTouched: true };
  }
}

const PREFS_KEY = "expense-tracker:export-prefs:v1";

interface Prefs {
  format: ExportFormat;
  sort: ExportSort;
}

function loadPrefs(): Partial<Prefs> {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return {
      format: ["csv", "json", "pdf"].includes(parsed.format as string) ? parsed.format : undefined,
      sort: ["date-asc", "date-desc", "amount-desc"].includes(parsed.sort as string) ? parsed.sort : undefined,
    };
  } catch {
    return {};
  }
}

export interface ExportInitialValues {
  startDate?: string;
  endDate?: string;
  categories?: Category[];
}

function init(initial: ExportInitialValues): ExportState {
  const prefs = loadPrefs();
  const startDate = initial.startDate ?? "";
  const endDate = initial.endDate ?? "";
  return {
    format: prefs.format ?? "csv",
    sort: prefs.sort ?? "date-asc",
    startDate,
    endDate,
    datePreset: matchPreset(startDate, endDate),
    categories: initial.categories?.length ? CATEGORIES.filter((c) => initial.categories!.includes(c)) : [...CATEGORIES],
    filename: defaultFilename(),
    filenameTouched: false,
  };
}

export function useExportState(initial: ExportInitialValues) {
  const [state, dispatch] = useReducer(reducer, initial, init);

  // Remember format and sort for next time; filters are intentionally per-export.
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ format: state.format, sort: state.sort } satisfies Prefs));
    } catch {
      /* storage unavailable — preferences are a nicety */
    }
  }, [state.format, state.sort]);

  return [state, dispatch] as const;
}
