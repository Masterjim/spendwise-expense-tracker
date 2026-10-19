"use client";

import { useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/States";
import { useCloud } from "@/hooks/useCloud";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import type { DestinationId, Trigger } from "@/lib/cloud/types";
import HistoryList from "../HistoryList";
import { SectionHeader } from "../ui";

export default function HistoryTab() {
  const { history, clearHistory } = useCloud();
  const [status, setStatus] = useState<"all" | "success" | "failed">("all");
  const [trigger, setTrigger] = useState<Trigger | "all">("all");
  const [destination, setDestination] = useState<DestinationId | "all">("all");
  const [confirm, setConfirm] = useState(false);

  const filtered = useMemo(
    () =>
      history.filter(
        (h) =>
          (status === "all" || h.status === status) &&
          (trigger === "all" || h.trigger === trigger) &&
          (destination === "all" || (h.trigger !== "share" && h.destination === destination)),
      ),
    [history, status, trigger, destination],
  );
  const usedDestinations = [...new Set(history.filter((h) => h.trigger !== "share").map((h) => h.destination))];
  const failures = history.filter((h) => h.status === "failed").length;

  return (
    <div>
      <SectionHeader
        title="Export history"
        description={`${history.length} events${failures ? ` · ${failures} failed` : ""}. Small files are kept so you can download the exact version again.`}
        action={
          history.length > 0 && (
            <button type="button" onClick={() => setConfirm(true)} className="btn-secondary text-rose-600">
              Clear history
            </button>
          )
        }
      />
      {history.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input w-auto py-1.5" aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
          </select>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as typeof trigger)} className="input w-auto py-1.5" aria-label="Filter by trigger">
            <option value="all">All triggers</option>
            <option value="manual">Manual</option>
            <option value="schedule">Scheduled</option>
            <option value="auto-sync">Auto-sync</option>
            <option value="share">Share links</option>
          </select>
          <select value={destination} onChange={(e) => setDestination(e.target.value as typeof destination)} className="input w-auto py-1.5" aria-label="Filter by destination">
            <option value="all">All destinations</option>
            {usedDestinations.map((d) => (
              <option key={d} value={d}>
                {DESTINATIONS[d].name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="card overflow-hidden">
        {history.length === 0 ? (
          <EmptyState icon="🕘" title="No exports yet" description="Every download, sync, email and share link will be logged here with a timestamp." />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Nothing matches these filters.</p>
        ) : (
          <HistoryList entries={filtered} />
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          title="Clear export history?"
          message="This removes the log and stored files. Your expenses and schedules aren't affected."
          confirmLabel="Clear"
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            clearHistory();
            setConfirm(false);
          }}
        />
      )}
    </div>
  );
}
