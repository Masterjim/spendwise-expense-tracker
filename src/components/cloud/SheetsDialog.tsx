"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ExpenseFormDialog";
import { useCloud } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { tsvRows } from "@/lib/cloud/csv";
import { relativeTime } from "@/lib/cloud/util";
import ConnectDialog from "./ConnectDialog";
import { ServiceIcon, SimulatedBadge, StatusPill, Toggle } from "./ui";

export default function SheetsDialog({ onClose }: { onClose: () => void }) {
  const { expenses } = useExpenses();
  const { connections, deliver, setAutoSync, connectionStatus } = useCloud();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const conn = connections["google-sheets"];

  const rows = useMemo(
    () => [
      ["Date", "Category", "Amount", "Description"],
      ...[...expenses].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.category, e.amount.toFixed(2), e.description]),
    ],
    [expenses],
  );

  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText(tsvRows(rows));
      setCopied(true);
      toast(`Copied ${rows.length - 1} rows — paste into cell A1`);
    } catch {
      toast("Clipboard unavailable in this browser.", { variant: "error" });
    }
  };

  const push = async () => {
    setPushing(true);
    const entry = await deliver({ templateId: "full-backup", destination: "google-sheets" });
    setPushing(false);
    toast(entry.status === "success" ? `Pushed ${entry.records} rows to “${conn?.target}” (simulated)` : entry.detail ?? "Failed", {
      variant: entry.status === "success" ? "success" : "error",
    });
  };

  return (
    <>
      <Modal title="Google Sheets" description="Get your expenses into a spreadsheet — instantly, or kept in sync." onClose={onClose} size="xl">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Real path */}
          <section className="flex flex-col rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Paste into a new sheet</h3>
              <SimulatedBadge simulated={false} />
            </div>
            <p className="mt-1 text-sm text-slate-500">Works right now, no sign-in. Copies a tab-separated table that Sheets and Excel paste as cells.</p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${copied ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>
                  {copied ? "✓" : 1}
                </span>
                <div className="flex-1">
                  <button type="button" onClick={copyTable} className="btn-primary w-full">
                    Copy {rows.length - 1} expenses as a table
                  </button>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span>
                <a href="https://sheets.new" target="_blank" rel="noreferrer" className="btn-secondary flex-1">
                  Open a blank Google Sheet ↗
                </a>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span>
                <p className="pt-0.5 text-slate-600">
                  Click cell <b>A1</b> and press <kbd className="rounded border border-slate-300 bg-slate-50 px-1 text-xs">Ctrl</kbd>/
                  <kbd className="rounded border border-slate-300 bg-slate-50 px-1 text-xs">⌘</kbd>+<kbd className="rounded border border-slate-300 bg-slate-50 px-1 text-xs">V</kbd>
                </p>
              </li>
            </ol>
            {/* Mini sheet preview */}
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 text-[11px]" aria-hidden>
              <div className="grid grid-cols-[2rem_repeat(4,minmax(0,1fr))] bg-slate-100 text-center text-slate-500">
                {["", "A", "B", "C", "D"].map((c) => (
                  <div key={c} className="border-r border-slate-200 py-1 last:border-r-0">
                    {c}
                  </div>
                ))}
              </div>
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="grid grid-cols-[2rem_repeat(4,minmax(0,1fr))] border-t border-slate-200">
                  <div className="bg-slate-100 py-1 text-center text-slate-500">{i + 1}</div>
                  {r.map((c, j) => (
                    <div key={j} className={`truncate border-l border-slate-200 px-1.5 py-1 ${i === 0 ? "font-semibold text-slate-800" : "text-slate-600"} ${j === 2 && i > 0 ? "text-right" : ""}`}>
                      {c}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Connected path */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/50 to-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Connected spreadsheet</h3>
              <SimulatedBadge simulated />
            </div>
            <p className="mt-1 text-sm text-slate-500">Link a spreadsheet once and Spendwise keeps it up to date in the background.</p>

            {!conn ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
                <ServiceIcon id="google-sheets" size="lg" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Not connected yet</p>
                  <p className="text-xs text-slate-500">You&apos;ll choose which spreadsheet to sync.</p>
                </div>
                <button type="button" onClick={() => setConnecting(true)} className="btn-primary">
                  Connect Google Sheets
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <ServiceIcon id="google-sheets" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{conn.target}</p>
                    <p className="truncate text-xs text-slate-500">
                      {conn.account} · {conn.lastSyncAt ? `last push ${relativeTime(conn.lastSyncAt)}` : "never pushed"}
                    </p>
                  </div>
                  <StatusPill status={connectionStatus("google-sheets")} />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-900">Keep in sync</span>
                    <span className="block text-xs text-slate-500">Mirror every add, edit and delete within seconds.</span>
                  </span>
                  <Toggle checked={conn.autoSync} onChange={(v) => setAutoSync("google-sheets", v)} label="Keep in sync" />
                </label>
                <button type="button" onClick={push} disabled={pushing} className="btn-primary w-full">
                  {pushing ? (
                    <>
                      <Spinner /> Writing rows…
                    </>
                  ) : (
                    `Push ${expenses.length} rows now`
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
      </Modal>
      {connecting && <ConnectDialog id="google-sheets" onClose={() => setConnecting(false)} />}
    </>
  );
}
