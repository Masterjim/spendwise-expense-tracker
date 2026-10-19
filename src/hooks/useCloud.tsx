"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useExpenses } from "./useExpenses";
import { generateId } from "@/lib/storage";
import { DESTINATIONS, DEFAULT_TARGETS } from "@/lib/cloud/destinations";
import { TEMPLATES } from "@/lib/cloud/templates";
import { computeNextRun } from "@/lib/cloud/schedule";
import { byteLength, downloadText, fingerprint, sleep } from "@/lib/cloud/util";
import type { Connection, DestinationId, HistoryEntry, Job, Schedule, TemplateId, Trigger } from "@/lib/cloud/types";

const STORAGE_KEY = "expense-tracker:cloud:v1";
const MAX_HISTORY = 60;
/** Keep file contents in history for re-download up to this size. */
const MAX_STORED_BYTES = 64 * 1024;
const AUTO_SYNC_DEBOUNCE_MS = 3000;
const SCHEDULER_TICK_MS = 20_000;

interface PersistedState {
  connections: Partial<Record<DestinationId, Connection>>;
  schedules: Schedule[];
  history: HistoryEntry[];
}

const EMPTY: PersistedState = { connections: {}, schedules: [], history: [] };

export type ConnectionStatus = "disconnected" | "ready" | "connected" | "syncing" | "synced" | "pending";
export type OverallSync = "local" | "synced" | "syncing" | "pending";

export interface DeliverRequest {
  templateId: TemplateId;
  destination: DestinationId;
  trigger?: Trigger;
  recipients?: string[];
  message?: string;
}

interface CloudContextValue extends PersistedState {
  hydrated: boolean;
  jobs: Job[];
  dataFingerprint: string;
  deliver: (req: DeliverRequest) => Promise<HistoryEntry>;
  connect: (id: DestinationId, account: string, target?: string) => Promise<void>;
  disconnect: (id: DestinationId) => void;
  setAutoSync: (id: DestinationId, enabled: boolean) => void;
  connectionStatus: (id: DestinationId) => ConnectionStatus;
  overallSync: OverallSync;
  saveSchedule: (schedule: Omit<Schedule, "id" | "createdAt" | "lastRunAt" | "nextRunAt"> & { id?: string }) => Schedule;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string, enabled: boolean) => void;
  runScheduleNow: (id: string) => Promise<void>;
  recordShare: (entry: { title: string; link: string; records: number }) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  dismissJob: (id: string) => void;
}

const CloudContext = createContext<CloudContextValue | null>(null);

function load(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      connections: parsed.connections ?? {},
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return EMPTY;
  }
}

export function CloudProvider({ children }: { children: ReactNode }) {
  const { expenses, status: expensesStatus } = useExpenses();
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const dataFingerprint = useMemo(() => fingerprint(expenses), [expenses]);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full: drop stored file bodies and retry once.
      try {
        const slim = { ...state, history: state.history.map((h) => ({ ...h, content: null })) };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch {
        /* give up silently; in-memory state still works */
      }
    }
  }, [state, hydrated]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const dismissJob = useCallback((id: string) => setJobs((prev) => prev.filter((j) => j.id !== id)), []);

  const addHistory = useCallback((entry: HistoryEntry) => {
    setState((s) => ({ ...s, history: [entry, ...s.history].slice(0, MAX_HISTORY) }));
  }, []);

  /** Animates an upload-style progress bar for simulated services. */
  const simulateTransfer = useCallback(
    async (jobId: string, stage: string, bytes: number, from: number, to: number) => {
      const steps = 8;
      const total = Math.min(2200, 700 + bytes / 40);
      updateJob(jobId, { stage });
      for (let i = 1; i <= steps; i++) {
        await sleep(total / steps);
        updateJob(jobId, { progress: Math.round(from + ((to - from) * i) / steps) });
      }
    },
    [updateJob],
  );

  const deliver = useCallback(
    async ({ templateId, destination, trigger = "manual", recipients = [], message }: DeliverRequest): Promise<HistoryEntry> => {
      const template = TEMPLATES[templateId];
      const dest = DESTINATIONS[destination];
      const connection = stateRef.current.connections[destination];
      const jobId = generateId();
      const fpAtStart = fingerprint(expensesRef.current);
      setJobs((prev) => [
        { id: jobId, title: `${template.name} → ${dest.name}`, destination, stage: "Rendering", progress: 5, status: "running" as const, startedAt: Date.now() },
        ...prev,
      ].slice(0, 8));

      const base = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        templateId,
        title: template.name,
        destination,
        trigger,
        link: null,
      };

      try {
        if (dest.requiresConnection && !connection) throw new Error(`${dest.name} isn't connected.`);
        const now = new Date();
        const records = template.select(expensesRef.current, { now });
        const file = template.render(records, { now });
        const bytes = byteLength(file.content);
        await sleep(250);
        updateJob(jobId, { progress: 20 });

        let detail: string;
        switch (destination) {
          case "download":
            downloadText(file.content, file.filename, file.mimeType);
            detail = "Saved to Downloads";
            break;
          case "email":
            if (recipients.length === 0) throw new Error("Add at least one recipient.");
            await simulateTransfer(jobId, `Sending to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`, bytes, 20, 95);
            detail = `Sent to ${recipients.join(", ")}${message ? ` · “${message.slice(0, 60)}”` : ""}`;
            break;
          case "webhook": {
            updateJob(jobId, { stage: "POST to endpoint", progress: 40 });
            const res = await fetch(connection!.target, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "spendwise.export",
                template: templateId,
                generatedAt: now.toISOString(),
                filename: file.filename,
                mimeType: file.mimeType,
                records: file.records,
                content: file.content,
              }),
            });
            if (!res.ok) throw new Error(`Endpoint responded ${res.status} ${res.statusText}`.trim());
            detail = `HTTP ${res.status} from ${new URL(connection!.target).host}`;
            break;
          }
          case "google-sheets":
            await simulateTransfer(jobId, `Writing ${records.length} rows`, bytes, 20, 95);
            detail = `Updated sheet “${connection!.target}”`;
            break;
          case "slack":
            await simulateTransfer(jobId, `Posting to ${connection!.target}`, bytes, 20, 95);
            detail = `Posted to ${connection!.target}`;
            break;
          default:
            await simulateTransfer(jobId, `Uploading to ${dest.name}`, bytes, 20, 95);
            detail = `${connection!.target}/${file.filename}`;
        }

        updateJob(jobId, { stage: "Done", progress: 100, status: "success" });
        const entry: HistoryEntry = {
          ...base,
          status: "success",
          records: file.records,
          bytes,
          filename: file.filename,
          mimeType: file.mimeType,
          content: bytes <= MAX_STORED_BYTES ? file.content : null,
          detail,
        };
        addHistory(entry);
        if (connection) {
          setState((s) => {
            const c = s.connections[destination];
            if (!c) return s;
            return {
              ...s,
              connections: {
                ...s.connections,
                [destination]: {
                  ...c,
                  lastSyncAt: entry.createdAt,
                  lastSyncFingerprint: templateId === "full-backup" ? fpAtStart : c.lastSyncFingerprint,
                },
              },
            };
          });
        }
        return entry;
      } catch (err) {
        const msg =
          err instanceof TypeError && destination === "webhook"
            ? "Network error — the endpoint may be offline or may not allow requests from browsers (CORS)."
            : err instanceof Error
              ? err.message
              : "Export failed.";
        updateJob(jobId, { stage: msg, status: "failed" });
        const entry: HistoryEntry = { ...base, status: "failed", records: 0, bytes: 0, filename: null, mimeType: null, content: null, detail: msg };
        addHistory(entry);
        return entry;
      }
    },
    [addHistory, simulateTransfer, updateJob],
  );

  const connect = useCallback(async (id: DestinationId, account: string, target?: string) => {
    if (!DESTINATIONS[id].simulated) await sleep(300);
    else await sleep(1200); // simulated OAuth round-trip
    setState((s) => ({
      ...s,
      connections: {
        ...s.connections,
        [id]: {
          id,
          account,
          target: target?.trim() || DEFAULT_TARGETS[id] || "",
          connectedAt: new Date().toISOString(),
          autoSync: false,
          lastSyncAt: null,
          lastSyncFingerprint: null,
        },
      },
    }));
  }, []);

  const disconnect = useCallback((id: DestinationId) => {
    setState((s) => {
      const connections = { ...s.connections };
      delete connections[id];
      // Schedules that targeted this service are paused rather than deleted.
      return { ...s, connections, schedules: s.schedules.map((x) => (x.destination === id ? { ...x, enabled: false } : x)) };
    });
  }, []);

  const setAutoSync = useCallback((id: DestinationId, enabled: boolean) => {
    setState((s) => {
      const c = s.connections[id];
      return c ? { ...s, connections: { ...s.connections, [id]: { ...c, autoSync: enabled } } } : s;
    });
  }, []);

  const connectionStatus = useCallback(
    (id: DestinationId): ConnectionStatus => {
      const c = state.connections[id];
      if (!DESTINATIONS[id].requiresConnection) return jobs.some((j) => j.destination === id && j.status === "running") ? "syncing" : "ready";
      if (!c) return "disconnected";
      if (jobs.some((j) => j.destination === id && j.status === "running")) return "syncing";
      if (!c.autoSync) return "connected";
      return c.lastSyncFingerprint === dataFingerprint ? "synced" : "pending";
    },
    [state.connections, jobs, dataFingerprint],
  );

  const overallSync: OverallSync = useMemo(() => {
    if (jobs.some((j) => j.status === "running")) return "syncing";
    const auto = Object.values(state.connections).filter((c) => c?.autoSync);
    if (auto.length === 0) return "local";
    return auto.every((c) => c!.lastSyncFingerprint === dataFingerprint) ? "synced" : "pending";
  }, [jobs, state.connections, dataFingerprint]);

  // ── Background auto-sync: push a full backup to each auto-sync service after edits settle.
  const syncing = useRef(new Set<DestinationId>());
  useEffect(() => {
    if (!hydrated || expensesStatus !== "ready") return;
    const stale = Object.values(state.connections).filter(
      (c): c is Connection => !!c && c.autoSync && c.lastSyncFingerprint !== dataFingerprint && !syncing.current.has(c.id),
    );
    if (stale.length === 0) return;
    const t = setTimeout(() => {
      for (const c of stale) {
        syncing.current.add(c.id);
        void deliver({ templateId: "full-backup", destination: c.id, trigger: "auto-sync" }).finally(() => syncing.current.delete(c.id));
      }
    }, AUTO_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [hydrated, expensesStatus, state.connections, dataFingerprint, deliver]);

  // ── Scheduler: runs due schedules while the app is open (no server in this demo).
  const runningSchedules = useRef(new Set<string>());
  const runSchedule = useCallback(
    async (schedule: Schedule) => {
      if (runningSchedules.current.has(schedule.id)) return;
      runningSchedules.current.add(schedule.id);
      try {
        await deliver({ templateId: schedule.templateId, destination: schedule.destination, trigger: "schedule", recipients: schedule.recipients });
        const now = new Date();
        setState((s) => ({
          ...s,
          schedules: s.schedules.map((x) =>
            x.id === schedule.id ? { ...x, lastRunAt: now.toISOString(), nextRunAt: computeNextRun(x, now).toISOString() } : x,
          ),
        }));
      } finally {
        runningSchedules.current.delete(schedule.id);
      }
    },
    [deliver],
  );

  useEffect(() => {
    if (!hydrated || expensesStatus !== "ready") return;
    const tick = () => {
      const now = Date.now();
      // Missed runs (app was closed) collapse into a single catch-up run.
      stateRef.current.schedules.filter((s) => s.enabled && new Date(s.nextRunAt).getTime() <= now).forEach((s) => void runSchedule(s));
    };
    tick();
    const id = setInterval(tick, SCHEDULER_TICK_MS);
    return () => clearInterval(id);
  }, [hydrated, expensesStatus, runSchedule]);

  const saveSchedule = useCallback<CloudContextValue["saveSchedule"]>((input) => {
    const now = new Date();
    const existing = input.id ? stateRef.current.schedules.find((s) => s.id === input.id) : undefined;
    const schedule: Schedule = {
      ...input,
      id: existing?.id ?? generateId(),
      createdAt: existing?.createdAt ?? now.toISOString(),
      lastRunAt: existing?.lastRunAt ?? null,
      nextRunAt: computeNextRun(input, now).toISOString(),
    };
    setState((s) => ({
      ...s,
      schedules: existing ? s.schedules.map((x) => (x.id === schedule.id ? schedule : x)) : [...s.schedules, schedule],
    }));
    return schedule;
  }, []);

  const deleteSchedule = useCallback((id: string) => setState((s) => ({ ...s, schedules: s.schedules.filter((x) => x.id !== id) })), []);

  const toggleSchedule = useCallback((id: string, enabled: boolean) => {
    const now = new Date();
    setState((s) => ({
      ...s,
      schedules: s.schedules.map((x) => (x.id === id ? { ...x, enabled, nextRunAt: enabled ? computeNextRun(x, now).toISOString() : x.nextRunAt } : x)),
    }));
  }, []);

  const runScheduleNow = useCallback(
    async (id: string) => {
      const s = stateRef.current.schedules.find((x) => x.id === id);
      if (s) await runSchedule(s);
    },
    [runSchedule],
  );

  const recordShare = useCallback<CloudContextValue["recordShare"]>(
    ({ title, link, records }) => {
      addHistory({
        id: generateId(),
        createdAt: new Date().toISOString(),
        templateId: "share-link",
        title,
        destination: "download",
        trigger: "share",
        status: "success",
        records,
        bytes: byteLength(link),
        filename: null,
        mimeType: null,
        content: null,
        link,
        detail: "Share link created",
      });
    },
    [addHistory],
  );

  const removeHistory = useCallback((id: string) => setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) })), []);
  const clearHistory = useCallback(() => setState((s) => ({ ...s, history: [] })), []);

  const value: CloudContextValue = {
    ...state,
    hydrated,
    jobs,
    dataFingerprint,
    deliver,
    connect,
    disconnect,
    setAutoSync,
    connectionStatus,
    overallSync,
    saveSchedule,
    deleteSchedule,
    toggleSchedule,
    runScheduleNow,
    recordShare,
    removeHistory,
    clearHistory,
    dismissJob,
  };

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error("useCloud must be used within a CloudProvider");
  return ctx;
}

/** Re-renders periodically so relative timestamps stay fresh. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
