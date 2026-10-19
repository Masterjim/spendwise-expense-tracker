"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCloud, useNow, type OverallSync } from "@/hooks/useCloud";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { relativeTime } from "@/lib/cloud/util";
import { CloudIcon, ServiceIcon } from "./ui";

const LABELS: Record<OverallSync, { label: string; tone: string; badge: string }> = {
  local: { label: "Local only", tone: "text-slate-500", badge: "bg-slate-300" },
  synced: { label: "All synced", tone: "text-emerald-600", badge: "bg-emerald-500" },
  syncing: { label: "Syncing", tone: "text-brand-600", badge: "bg-brand-500" },
  pending: { label: "Changes pending", tone: "text-amber-600", badge: "bg-amber-500" },
};

/** Navbar cloud indicator + background jobs tray. */
export default function SyncCenter() {
  const { overallSync, jobs, connections, dismissJob, connectionStatus } = useCloud();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = useNow(10_000);
  const running = jobs.filter((j) => j.status === "running").length;
  const s = LABELS[overallSync];
  const autoSynced = Object.values(connections).filter((c) => c?.autoSync);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Sync status: ${s.label}${running ? `, ${running} job${running > 1 ? "s" : ""} running` : ""}`}
        className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition hover:bg-slate-100 ${s.tone}`}
      >
        <span className="relative">
          <CloudIcon className={`h-5 w-5 ${overallSync === "syncing" ? "animate-pulse" : ""}`} />
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${s.badge}`} />
        </span>
        <span className="hidden lg:inline">{running ? `${running} running` : s.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Sync &amp; activity</p>
            <p className={`text-xs ${s.tone}`}>
              {overallSync === "local"
                ? "Data lives only in this browser. Turn on auto-sync to back it up."
                : overallSync === "pending"
                  ? "Recent edits will sync in a few seconds."
                  : overallSync === "syncing"
                    ? "Working in the background — you can keep using the app."
                    : "Every auto-sync destination has your latest data."}
            </p>
          </div>

          {autoSynced.length > 0 && (
            <ul className="divide-y divide-slate-100 border-b border-slate-100">
              {autoSynced.map((c) => (
                <li key={c!.id} className="flex items-center gap-3 px-4 py-2.5">
                  <ServiceIcon id={c!.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">{DESTINATIONS[c!.id].name}</p>
                    <p className="text-xs text-slate-500">{c!.lastSyncAt ? `Synced ${relativeTime(c!.lastSyncAt, now)}` : "Never synced"}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {{ synced: "✓", pending: "•••", syncing: "↻", connected: "", ready: "", disconnected: "" }[connectionStatus(c!.id)]}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="max-h-72 overflow-y-auto">
            {jobs.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">No background jobs right now.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <li key={j.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ServiceIcon id={j.destination} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{j.title}</p>
                        <p className={`truncate text-xs ${j.status === "failed" ? "text-rose-600" : "text-slate-500"}`}>
                          {j.status === "success" ? `Completed ${relativeTime(new Date(j.startedAt).toISOString(), now)}` : j.stage}
                        </p>
                      </div>
                      {j.status !== "running" && (
                        <button type="button" onClick={() => dismissJob(j.id)} className="text-slate-300 hover:text-slate-500" aria-label="Dismiss">
                          ×
                        </button>
                      )}
                    </div>
                    {j.status === "running" && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${j.progress}%` }} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/export#history"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            View export history →
          </Link>
        </div>
      )}
    </div>
  );
}
