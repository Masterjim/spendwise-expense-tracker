import type { Frequency, Schedule } from "./types";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Next occurrence strictly after `from`, in local time. */
export function computeNextRun(
  s: Pick<Schedule, "frequency" | "weekday" | "dayOfMonth" | "time">,
  from: Date = new Date(),
): Date {
  const [hh, mm] = s.time.split(":").map(Number);
  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setHours(hh, mm);

  if (s.frequency === "daily") {
    if (candidate <= from) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  if (s.frequency === "weekly") {
    const delta = (s.weekday - candidate.getDay() + 7) % 7;
    candidate.setDate(candidate.getDate() + delta);
    if (candidate <= from) candidate.setDate(candidate.getDate() + 7);
    return candidate;
  }
  candidate.setDate(s.dayOfMonth);
  if (candidate <= from) candidate.setMonth(candidate.getMonth() + 1, s.dayOfMonth);
  return candidate;
}

export function describeSchedule(s: Pick<Schedule, "frequency" | "weekday" | "dayOfMonth" | "time">): string {
  const [hh, mm] = s.time.split(":").map(Number);
  const time = new Date(2000, 0, 1, hh, mm).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const map: Record<Frequency, string> = {
    daily: `Every day at ${time}`,
    weekly: `Every ${WEEKDAYS[s.weekday]} at ${time}`,
    monthly: `Monthly on the ${ordinal(s.dayOfMonth)} at ${time}`,
  };
  return map[s.frequency];
}
