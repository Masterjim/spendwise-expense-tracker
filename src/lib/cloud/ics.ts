import type { Schedule } from "./types";

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function icsDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A recurring calendar reminder that mirrors an export schedule. */
export function scheduleToICS(schedule: Schedule, appUrl: string): string {
  const start = new Date(schedule.nextRunAt);
  const end = new Date(start.getTime() + 15 * 60_000);
  const rrule =
    schedule.frequency === "daily"
      ? "FREQ=DAILY"
      : schedule.frequency === "weekly"
        ? `FREQ=WEEKLY;BYDAY=${DAY_CODES[schedule.weekday]}`
        : `FREQ=MONTHLY;BYMONTHDAY=${schedule.dayOfMonth}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spendwise//Export Schedules//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${schedule.id}@spendwise`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `RRULE:${rrule}`,
    `SUMMARY:${escapeText(`Spendwise: ${schedule.name}`)}`,
    `DESCRIPTION:${escapeText(`Review your expenses. Open Spendwise so the scheduled export can run: ${appUrl}`)}`,
    `URL:${appUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Spendwise export reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
