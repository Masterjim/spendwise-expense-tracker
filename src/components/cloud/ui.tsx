"use client";

import type { ReactNode } from "react";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import type { DestinationId } from "@/lib/cloud/types";
import type { ConnectionStatus } from "@/hooks/useCloud";

export function ServiceIcon({ id, size = "md" }: { id: DestinationId; size?: "sm" | "md" | "lg" }) {
  const d = DESTINATIONS[id];
  const dims = { sm: "h-7 w-7 text-[10px] rounded-lg", md: "h-10 w-10 text-xs rounded-xl", lg: "h-14 w-14 text-base rounded-2xl" }[size];
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold text-white shadow-sm ${dims}`}
      style={{ background: `linear-gradient(135deg, ${d.color}, ${d.color}cc)` }}
      aria-hidden
    >
      {d.monogram}
    </span>
  );
}

export function SimulatedBadge({ simulated }: { simulated: boolean }) {
  return simulated ? (
    <span
      className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 ring-1 ring-inset ring-slate-200"
      title="Demo integration: the flow is real, but no data is sent to this service."
    >
      Simulated
    </span>
  ) : (
    <span
      className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200"
      title="This works for real."
    >
      Live
    </span>
  );
}

const STATUS: Record<ConnectionStatus, { label: string; dot: string; text: string; pulse?: boolean }> = {
  disconnected: { label: "Not connected", dot: "bg-slate-300", text: "text-slate-500" },
  ready: { label: "Ready, no setup needed", dot: "bg-emerald-500", text: "text-emerald-700" },
  connected: { label: "Connected", dot: "bg-emerald-500", text: "text-emerald-700" },
  synced: { label: "Up to date", dot: "bg-emerald-500", text: "text-emerald-700" },
  pending: { label: "Changes pending", dot: "bg-amber-500", text: "text-amber-700" },
  syncing: { label: "Syncing…", dot: "bg-brand-500", text: "text-brand-700", pulse: true },
};

export function StatusPill({ status }: { status: ConnectionStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className="relative flex h-2 w-2">
        {s.pulse && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${s.dot}`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      {s.label}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        checked ? "bg-brand-600" : "bg-slate-300"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CloudIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
    </svg>
  );
}
