"use client";

import { useMemo } from "react";
import { useCloud, useNow } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { TEMPLATES } from "@/lib/cloud/templates";
import { describeSchedule } from "@/lib/cloud/schedule";
import { relativeTime } from "@/lib/cloud/util";
import type { OpenDialog } from "../dialogs";
import HistoryList from "../HistoryList";
import { CloudIcon, ServiceIcon } from "../ui";

interface Suggestion {
  id: string;
  icon: string;
  title: string;
  body: string;
  cta: string;
  run: () => void;
}

export default function OverviewTab({ open, goTo }: { open: OpenDialog; goTo: (tab: string) => void }) {
  const cloud = useCloud();
  const { expenses } = useExpenses();
  const now = useNow();
  const { history, schedules, connections, overallSync, deliver } = cloud;

  const connected = Object.values(connections).filter(Boolean);
  const lastBackup = history.find((h) => h.status === "success" && h.templateId === "full-backup");
  const exportsThisMonth = history.filter((h) => h.status === "success" && new Date(h.createdAt).getMonth() === new Date(now).getMonth()).length;
  const upcoming = [...schedules].filter((s) => s.enabled).sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)).slice(0, 4);

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = [];
    const d = new Date(now);
    const daysSinceBackup = lastBackup ? Math.floor((now - new Date(lastBackup.createdAt).getTime()) / 86_400_000) : null;
    const pending = connected.filter((c) => c!.autoSync && c!.lastSyncFingerprint !== cloud.dataFingerprint);
    if (pending.length) {
      out.push({
        id: "pending",
        icon: "⏳",
        title: `${pending.length} destination${pending.length > 1 ? "s" : ""} waiting to sync`,
        body: "Your latest edits haven't reached the cloud yet.",
        cta: "Sync now",
        run: () => pending.forEach((c) => void deliver({ templateId: "full-backup", destination: c!.id, trigger: "auto-sync" })),
      });
    }
    if (!connected.some((c) => c!.autoSync) && (daysSinceBackup === null || daysSinceBackup >= 7)) {
      out.push({
        id: "backup",
        icon: "🛟",
        title: daysSinceBackup === null ? "Your expenses have never been backed up" : `Last backup was ${daysSinceBackup} days ago`,
        body: "Everything lives in this browser. Clearing site data would erase it.",
        cta: "Turn on cloud backup",
        run: () => goTo("integrations"),
      });
    }
    if (d.getDate() >= 25 || d.getDate() <= 2) {
      out.push({
        id: "month-end",
        icon: "🗓️",
        title: "Month-end is here",
        body: "Send yourself the Monthly Summary while it's fresh.",
        cta: "Email summary",
        run: () => open({ type: "email", templateId: "monthly-summary" }),
      });
    }
    if (d.getMonth() <= 3) {
      out.push({ id: "tax", icon: "🧾", title: "Tax season", body: "Your Tax Report groups every expense by category.", cta: "Preview report", run: () => open({ type: "preview", id: "tax-report" }) });
    }
    if (!schedules.some((s) => s.templateId === "monthly-summary")) {
      out.push({
        id: "automate",
        icon: "⚡",
        title: "Automate your monthly review",
        body: "Get the Monthly Summary in your inbox on the 1st of every month.",
        cta: "Set it up",
        run: () => open({ type: "schedule", initial: { templateId: "monthly-summary", destination: "email", frequency: "monthly", dayOfMonth: 1, time: "08:00" } }),
      });
    }
    return out.slice(0, 3);
  }, [now, lastBackup, connected, cloud.dataFingerprint, schedules, deliver, goTo, open]);

  const quick = [
    { icon: "🔗", title: "Share a snapshot", body: "Link or QR code", run: () => open({ type: "share" }) },
    { icon: "✉️", title: "Email a report", body: "To you or your accountant", run: () => open({ type: "email" }) },
    { icon: "▦", title: "Send to Sheets", body: "Paste or keep in sync", run: () => open({ type: "sheets" }) },
    { icon: "⤓", title: "Download backup", body: "JSON, restore-ready", run: () => void deliver({ templateId: "full-backup", destination: "download" }) },
  ];

  const syncCopy = {
    local: { title: "Stored on this device only", tone: "from-slate-700 to-slate-900" },
    synced: { title: "Everything is synced", tone: "from-emerald-600 to-teal-700" },
    syncing: { title: "Syncing in the background…", tone: "from-brand-600 to-indigo-800" },
    pending: { title: "Changes waiting to sync", tone: "from-amber-500 to-orange-600" },
  }[overallSync];

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg sm:p-8 ${syncCopy.tone}`}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
              <CloudIcon className="h-4 w-4" /> Sync status
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight" data-testid="sync-headline">
              {syncCopy.title}
            </h2>
            <div className="mt-3 flex -space-x-2">
              {connected.length === 0 ? (
                <span className="text-sm text-white/70">No services connected yet.</span>
              ) : (
                connected.map((c) => (
                  <span key={c!.id} className="rounded-xl ring-2 ring-white/40" title={DESTINATIONS[c!.id].name}>
                    <ServiceIcon id={c!.id} size="sm" />
                  </span>
                ))
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
              ["Connected", connected.length],
              ["Schedules", schedules.filter((s) => s.enabled).length],
              ["Exports this month", exportsThisMonth],
              ["Last backup", lastBackup ? relativeTime(lastBackup.createdAt, now) : "Never"],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-xs text-white/70">{k}</dt>
                <dd className="text-lg font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {suggestions.map((s) => (
            <div key={s.id} className="card flex flex-col p-4" data-testid="suggestion">
              <p className="text-sm font-semibold text-slate-900">
                <span aria-hidden>{s.icon}</span> {s.title}
              </p>
              <p className="mt-1 flex-1 text-xs text-slate-500">{s.body}</p>
              <button type="button" onClick={s.run} className="mt-3 self-start text-sm font-medium text-brand-600 hover:text-brand-700">
                {s.cta} →
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quick.map((q) => (
          <button
            key={q.title}
            type="button"
            onClick={q.run}
            disabled={expenses.length === 0}
            className="card group flex flex-col items-start p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg transition group-hover:bg-brand-100" aria-hidden>
              {q.icon}
            </span>
            <span className="mt-3 text-sm font-semibold text-slate-900">{q.title}</span>
            <span className="text-xs text-slate-500">{q.body}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
            <button type="button" onClick={() => goTo("history")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Full history →
            </button>
          </div>
          {history.length === 0 ? <p className="px-5 py-10 text-center text-sm text-slate-400">Exports and shares will show up here.</p> : <HistoryList entries={history.slice(0, 5)} compact />}
        </div>
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">Upcoming</h3>
            <button type="button" onClick={() => goTo("schedules")} className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Schedules →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">No automatic exports scheduled.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <ServiceIcon id={s.destination} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-800">
                      {TEMPLATES[s.templateId].icon} {s.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{describeSchedule(s)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium text-slate-600">{relativeTime(s.nextRunAt, now)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
