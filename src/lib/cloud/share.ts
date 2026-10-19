import { CATEGORIES, type Category, type Expense } from "@/types/expense";
import { monthKey, toISODate } from "@/lib/format";

/**
 * Serverless share links.
 *
 * The snapshot is compressed and base64url-encoded into the URL *fragment*
 * (after "#"). Browsers never send the fragment to a server, so the data
 * travels only inside the link itself.
 */

export type ShareScope = "summary" | "full";

export interface ShareSnapshot {
  v: 1;
  scope: ShareScope;
  title: string;
  /** Sharer's display name (optional). */
  by: string;
  createdAt: string;
  /** Viewer refuses to open after this ISO time; null = never. Viewer-enforced only. */
  expiresAt: string | null;
  period: { start: string; end: string };
  total: number;
  count: number;
  categories: Array<[Category, number, number]>; // [category, count, total]
  months: Array<[string, number]>; // [YYYY-MM, total]
  /** Present only for "full" scope: [date, categoryIndex, amount, description?] */
  rows?: Array<[string, number, number, string?]>;
}

export interface ShareOptions {
  scope: ShareScope;
  title: string;
  by: string;
  includeDescriptions: boolean;
  startDate: string;
  endDate: string;
  expiresInDays: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildSnapshot(expenses: Expense[], options: ShareOptions, now = new Date()): ShareSnapshot {
  const records = expenses
    .filter((e) => (!options.startDate || e.date >= options.startDate) && (!options.endDate || e.date <= options.endDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  const months = new Map<string, number>();
  for (const e of records) months.set(monthKey(e.date), (months.get(monthKey(e.date)) ?? 0) + e.amount);

  return {
    v: 1,
    scope: options.scope,
    title: options.title.trim() || "Shared expenses",
    by: options.by.trim(),
    createdAt: now.toISOString(),
    expiresAt: options.expiresInDays ? new Date(now.getTime() + options.expiresInDays * 86_400_000).toISOString() : null,
    period: {
      start: options.startDate || records[0]?.date || toISODate(now),
      end: options.endDate || records[records.length - 1]?.date || toISODate(now),
    },
    total: round2(records.reduce((a, e) => a + e.amount, 0)),
    count: records.length,
    categories: CATEGORIES.map((c): [Category, number, number] => {
      const xs = records.filter((e) => e.category === c);
      return [c, xs.length, round2(xs.reduce((a, e) => a + e.amount, 0))];
    }).filter(([, n]) => n > 0),
    months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, t]) => [k, round2(t)]),
    rows:
      options.scope === "full"
        ? records.map((e) =>
            options.includeDescriptions
              ? [e.date, CATEGORIES.indexOf(e.category), e.amount, e.description]
              : [e.date, CATEGORIES.indexOf(e.category), e.amount],
          )
        : undefined,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

/** Returns the fragment payload: "z.<data>" (deflate) or "p.<data>" (plain). */
export async function encodeSnapshot(snapshot: ShareSnapshot): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(snapshot));
  if (canCompress()) return `z.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
  return `p.${toBase64Url(json)}`;
}

export async function decodeSnapshot(fragment: string): Promise<ShareSnapshot> {
  const [mode, data] = fragment.replace(/^#/, "").split(".", 2);
  if (!data || (mode !== "z" && mode !== "p")) throw new Error("This link is incomplete or malformed.");
  let bytes = fromBase64Url(data);
  if (mode === "z") {
    if (!canCompress()) throw new Error("Your browser can't open compressed share links. Try a recent Chrome, Safari or Firefox.");
    bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
  }
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as ShareSnapshot;
  if (parsed?.v !== 1 || !Array.isArray(parsed.categories)) throw new Error("Unsupported share link version.");
  return parsed;
}

export function shareUrl(origin: string, payload: string): string {
  return `${origin}/share#${payload}`;
}

/** Rebuild importable expenses from a full snapshot. */
export function snapshotRows(snapshot: ShareSnapshot) {
  return (snapshot.rows ?? []).map(([date, catIdx, amount, description]) => ({
    date,
    category: CATEGORIES[catIdx] ?? "Other",
    amount,
    description: description ?? `${CATEGORIES[catIdx] ?? "Other"} expense`,
  }));
}

/**
 * Longest link we render as a QR code. Byte-mode QR can hold ~2,900 chars, but
 * codes that dense are unreliable to scan from a phone screen.
 */
export const QR_MAX_LENGTH = 1200;
