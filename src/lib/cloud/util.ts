import type { Expense } from "@/types/expense";

/** Cheap content fingerprint used to detect unsynced changes (incl. deletions). */
export function fingerprint(expenses: Expense[]): string {
  let h = 2166136261;
  for (const e of expenses) {
    const s = `${e.id}|${e.updatedAt}|${e.amount}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return `${expenses.length}:${(h >>> 0).toString(36)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** `now` lets callers re-render on a timer; it never lags behind the real clock. */
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - Math.max(now, Date.now());
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (abs < 45_000) return diff <= 0 ? "just now" : "in a moment";
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), "day");
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function downloadText(content: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
