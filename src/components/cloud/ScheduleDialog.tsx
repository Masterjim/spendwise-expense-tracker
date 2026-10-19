"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS, DESTINATION_LIST } from "@/lib/cloud/destinations";
import { TEMPLATES, TEMPLATE_LIST } from "@/lib/cloud/templates";
import { WEEKDAYS, computeNextRun, describeSchedule } from "@/lib/cloud/schedule";
import type { DestinationId, Frequency, Schedule, TemplateId } from "@/lib/cloud/types";
import { EMAIL_RE } from "@/lib/cloud/util";

export type ScheduleDraft = Partial<Omit<Schedule, "createdAt" | "lastRunAt" | "nextRunAt">>;

export default function ScheduleDialog({ initial = {}, onClose }: { initial?: ScheduleDraft; onClose: () => void }) {
  const { saveSchedule, connections } = useCloud();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<TemplateId>(initial.templateId ?? "full-backup");
  const [destination, setDestination] = useState<DestinationId>(initial.destination ?? "email");
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency ?? "weekly");
  const [weekday, setWeekday] = useState(initial.weekday ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(initial.dayOfMonth ?? 1);
  const [time, setTime] = useState(initial.time ?? "09:00");
  const [recipients, setRecipients] = useState((initial.recipients ?? []).join(", "));
  const [name, setName] = useState(initial.name ?? "");
  const [submitted, setSubmitted] = useState(false);

  const options = DESTINATION_LIST.filter((d) => d.id !== "download");
  const autoName = `${frequency[0].toUpperCase()}${frequency.slice(1)} ${TEMPLATES[templateId].name} → ${DESTINATIONS[destination].name}`;
  const emails = recipients.split(/[\s,;]+/).filter(Boolean);
  const errors = {
    recipients:
      destination === "email" && (emails.length === 0 ? "Add at least one recipient." : emails.find((e) => !EMAIL_RE.test(e)) ? "One of the addresses isn't valid." : null),
    destination: DESTINATIONS[destination].requiresConnection && !connections[destination] ? `Connect ${DESTINATIONS[destination].name} first.` : null,
    time: /^\d{2}:\d{2}$/.test(time) ? null : "Pick a time.",
  };
  const valid = !errors.recipients && !errors.destination && !errors.time;
  const preview = useMemo(() => (/^\d{2}:\d{2}$/.test(time) ? computeNextRun({ frequency, weekday, dayOfMonth, time }) : null), [frequency, weekday, dayOfMonth, time]);

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    saveSchedule({
      id: initial.id,
      name: name.trim() || autoName,
      templateId,
      destination,
      frequency,
      weekday,
      dayOfMonth,
      time,
      recipients: destination === "email" ? emails.map((e) => e.toLowerCase()) : [],
      enabled: initial.enabled ?? true,
    });
    toast(initial.id ? "Schedule updated" : "Schedule created");
    onClose();
  };

  return (
    <Modal title={initial.id ? "Edit schedule" : "New automatic export"} description="Recurring exports run in the background on your schedule." onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            What
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value as TemplateId)} className="input mt-1">
              {TEMPLATE_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Where
            <select value={destination} onChange={(e) => setDestination(e.target.value as DestinationId)} className={`input mt-1 ${submitted && errors.destination ? "input-error" : ""}`}>
              {options.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.requiresConnection && !connections[d.id] ? " (not connected)" : ""}
                </option>
              ))}
            </select>
            {submitted && errors.destination && <span className="mt-1 block text-xs text-rose-600">{errors.destination}</span>}
          </label>
        </div>

        {destination === "email" && (
          <label className="block text-sm font-medium text-slate-700">
            Recipients
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="me@example.com, accountant@example.com"
              className={`input mt-1 ${submitted && errors.recipients ? "input-error" : ""}`}
            />
            {submitted && errors.recipients && <span className="mt-1 block text-xs text-rose-600">{errors.recipients}</span>}
          </label>
        )}

        <div>
          <p className="text-sm font-medium text-slate-700">When</p>
          <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Frequency">
            {(["daily", "weekly", "monthly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={frequency === f}
                onClick={() => setFrequency(f)}
                className={`rounded-md py-1.5 text-sm font-medium capitalize transition ${frequency === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {frequency === "weekly" && (
              <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="input" aria-label="Day of week">
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            {frequency === "monthly" && (
              <select value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))} className="input" aria-label="Day of month">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            )}
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`input ${frequency === "daily" ? "col-span-2" : ""}`} aria-label="Time" />
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Name <span className="font-normal text-slate-400">(optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={autoName} className="input mt-1" />
        </label>

        <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          <p className="font-medium">{describeSchedule({ frequency, weekday, dayOfMonth, time })}</p>
          {preview && (
            <p className="text-xs text-brand-700">
              Next run: {preview.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={save} className="btn-primary">
            {initial.id ? "Save changes" : "Create schedule"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
