"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import CategoryBadge from "@/components/CategoryBadge";
import { ErrorState, PageSkeleton } from "@/components/States";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { CATEGORY_META } from "@/lib/categories";
import { csvRows } from "@/lib/cloud/csv";
import { decodeSnapshot, snapshotRows, type ShareSnapshot } from "@/lib/cloud/share";
import { absoluteTime, downloadText, relativeTime } from "@/lib/cloud/util";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "expired"; snapshot: ShareSnapshot } | { status: "ready"; snapshot: ShareSnapshot };

const PAGE = 50;

export default function SharedSnapshotView() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return setState({ status: "error", message: "This share link is empty. Ask the sender for the full link." });
      try {
        const snapshot = await decodeSnapshot(hash);
        const expired = snapshot.expiresAt && new Date(snapshot.expiresAt).getTime() < Date.now();
        setState(expired ? { status: "expired", snapshot } : { status: "ready", snapshot });
      } catch (err) {
        setState({ status: "error", message: err instanceof Error ? err.message : "This link couldn't be opened." });
      }
    };
    void load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, []);

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error") return <ErrorState message={state.message} action={<Link href="/" className="btn-primary">Go to Spendwise</Link>} />;
  if (state.status === "expired")
    return (
      <ErrorState
        message={`“${state.snapshot.title}” expired ${relativeTime(state.snapshot.expiresAt!)}. Ask ${state.snapshot.by || "the sender"} for a new link.`}
        action={<Link href="/" className="btn-primary">Go to Spendwise</Link>}
      />
    );
  return <Snapshot snapshot={state.snapshot} />;
}

function Snapshot({ snapshot: s }: { snapshot: ShareSnapshot }) {
  const { importExpenses, status } = useExpenses();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const [imported, setImported] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const rows = useMemo(() => snapshotRows(s), [s]);
  const maxCat = Math.max(...s.categories.map((c) => c[2]), 1);
  const maxMonth = Math.max(...s.months.map((m) => m[1]), 1);

  const downloadCsv = () =>
    downloadText(
      "﻿" + csvRows([["Date", "Category", "Amount", "Description"], ...rows.map((r) => [r.date, r.category, r.amount.toFixed(2), r.description])]),
      `${s.title.replace(/[^\w-]+/g, "-").toLowerCase() || "shared"}.csv`,
      "text/csv",
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
            Shared snapshot · read-only
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h1>
          <p className="mt-1 text-sm text-white/70">
            {s.by ? `Shared by ${s.by} · ` : ""}
            <time title={absoluteTime(s.createdAt)}>created {relativeTime(s.createdAt)}</time>
            {s.expiresAt && <> · expires {relativeTime(s.expiresAt)}</>}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-white/60">
            {formatDate(s.period.start)} – {formatDate(s.period.end)}
          </p>
          <p className="text-3xl font-semibold" data-testid="shared-total">
            {formatCurrency(s.total)}
          </p>
          <p className="text-xs text-white/60">{s.count} expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">By category</h2>
          <ul className="mt-4 space-y-3">
            {s.categories
              .slice()
              .sort((a, b) => b[2] - a[2])
              .map(([c, n, t]) => (
                <li key={c}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {CATEGORY_META[c].icon} {c} <span className="text-xs text-slate-400">· {n}</span>
                    </span>
                    <span className="font-medium tabular-nums text-slate-900">{formatCurrency(t)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(t / maxCat) * 100}%`, background: CATEGORY_META[c].color }} />
                  </div>
                </li>
              ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">By month</h2>
          <div className="mt-4 flex h-48 items-end gap-2">
            {s.months.map(([k, t]) => (
              <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${formatMonthLabel(k, "long")}: ${formatCurrency(t)}`}>
                <span className="text-[10px] tabular-nums text-slate-500">{formatCurrency(t).replace(/\.\d+$/, "")}</span>
                <div className="w-full max-w-[3rem] rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${(t / maxMonth) * 80}%`, minHeight: 4 }} />
                <span className="text-[11px] text-slate-500">{formatMonthLabel(k)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {s.scope === "full" ? (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Expenses</h2>
              <p className="text-xs text-slate-500">{rows.length} items{s.rows?.[0]?.[3] === undefined ? " · descriptions hidden by sender" : ""}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={downloadCsv} className="btn-secondary py-1.5 text-xs">
                Download CSV
              </button>
              <button type="button" onClick={() => setConfirm(true)} disabled={imported || status !== "ready"} className="btn-primary py-1.5 text-xs">
                {imported ? "✓ Imported" : "Import into my Spendwise"}
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, visible).map((r, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-5 py-2.5 text-slate-500">{formatDate(r.date)}</td>
                  <td className="hidden px-5 py-2.5 sm:table-cell">
                    <CategoryBadge category={r.category} />
                  </td>
                  <td className="max-w-[10rem] truncate px-5 py-2.5 text-slate-800">{r.description}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-right font-medium tabular-nums">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > visible && (
            <div className="border-t border-slate-100 p-3 text-center">
              <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="btn-secondary py-1.5 text-xs">
                Show more ({rows.length - visible})
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">This is a summary snapshot — individual expenses weren&apos;t included.</p>
      )}

      <p className="text-center text-xs text-slate-400">
        This page was rendered entirely from the link. No data was loaded from a server. <Link href="/" className="font-medium text-brand-600">Track your own expenses →</Link>
      </p>

      {confirm && (
        <ConfirmDialog
          title={`Import ${rows.length} expenses?`}
          message="They'll be added to the expenses stored in this browser. You can delete them later."
          confirmLabel="Import"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            importExpenses(rows);
            setConfirm(false);
            setImported(true);
            toast(`Imported ${rows.length} expenses`);
          }}
        />
      )}
    </div>
  );
}
