"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useCloud, useNow } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { TEMPLATES } from "@/lib/cloud/templates";
import { describeSchedule } from "@/lib/cloud/schedule";
import { scheduleToICS } from "@/lib/cloud/ics";
import type { Schedule } from "@/lib/cloud/types";
import { absoluteTime, downloadText, relativeTime } from "@/lib/cloud/util";
import { EmptyState } from "@/components/States";
import type { OpenDialog } from "../dialogs";
import { SectionHeader, ServiceIcon, Toggle } from "../ui";

export default function SchedulesTab({ open }: { open: OpenDialog }) {
  const { schedules, toggleSchedule, deleteSchedule, runScheduleNow, connections, jobs } = useCloud();
  const { toast } = useToast();
  const now = useNow();
  const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);

  const addToCalendar = (s: Schedule) => {
    downloadText(scheduleToICS(s, window.location.origin + "/export"), `${s.name.replace(/[^\w-]+/g, "-").toLowerCase()}.ics`, "text/calendar");
    toast("Calendar file downloaded — open it to add the reminder");
  };

  return (
    <div>
      <SectionHeader
        title="Automatic exports"
        description="Set it and forget it. Each run is logged in history."
        action={
          <button type="button" onClick={() => open({ type: "schedule" })} className="btn-primary">
            + New schedule
          </button>
        }
      />
      <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <span aria-hidden>ℹ️</span>
        <p>
          <b>Demo:</b> there&apos;s no server, so schedules run while Spendwise is open in a browser tab. Runs missed while it was closed happen the next time you open it.
          Use <b>Add to calendar</b> to get a reminder.
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="card">
          <EmptyState icon="⏱️" title="No schedules yet" description="Back up weekly, email your accountant monthly, or post a summary to Slack every Friday.">
            <button type="button" onClick={() => open({ type: "schedule" })} className="btn-primary">
              Create your first schedule
            </button>
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {schedules.map((s) => {
            const t = TEMPLATES[s.templateId];
            const blocked = DESTINATIONS[s.destination].requiresConnection && !connections[s.destination];
            const running = jobs.some((j) => j.status === "running" && j.title === `${t.name} → ${DESTINATIONS[s.destination].name}`);
            return (
              <li key={s.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${s.enabled ? "" : "opacity-70"}`} data-testid="schedule-row">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <ServiceIcon id={s.destination} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {t.icon} {s.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {describeSchedule(s)}
                      {s.recipients.length > 0 && ` · ${s.recipients.join(", ")}`}
                    </p>
                    <p className="mt-0.5 text-xs">
                      {blocked ? (
                        <span className="text-rose-600">Paused — {DESTINATIONS[s.destination].name} is disconnected</span>
                      ) : s.enabled ? (
                        <span className="text-slate-600">
                          Next run <time title={absoluteTime(s.nextRunAt)} className="font-medium">{relativeTime(s.nextRunAt, now)}</time>
                        </span>
                      ) : (
                        <span className="text-slate-400">Paused</span>
                      )}
                      {s.lastRunAt && <span className="text-slate-400"> · last ran {relativeTime(s.lastRunAt, now)}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" disabled={blocked || running} onClick={() => runScheduleNow(s.id)} className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:text-slate-300">
                    {running ? "Running…" : "Run now"}
                  </button>
                  <button type="button" onClick={() => addToCalendar(s)} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    Add to calendar
                  </button>
                  <button type="button" onClick={() => open({ type: "schedule", initial: s })} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    Edit
                  </button>
                  <button type="button" onClick={() => setPendingDelete(s)} className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">
                    Delete
                  </button>
                  <Toggle checked={s.enabled && !blocked} disabled={blocked} onChange={(v) => toggleSchedule(s.id, v)} label={`Enable ${s.name}`} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete schedule?"
          message={`“${pendingDelete.name}” will stop running. Past runs stay in history.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteSchedule(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
