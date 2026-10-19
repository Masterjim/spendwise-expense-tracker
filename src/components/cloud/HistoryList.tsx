"use client";

import { useCloud, useNow } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { TEMPLATES } from "@/lib/cloud/templates";
import type { HistoryEntry, Trigger } from "@/lib/cloud/types";
import { absoluteTime, downloadText, formatBytes, relativeTime } from "@/lib/cloud/util";
import { ServiceIcon } from "./ui";

const TRIGGER: Record<Trigger, { label: string; cls: string }> = {
  manual: { label: "Manual", cls: "bg-slate-100 text-slate-600" },
  schedule: { label: "Scheduled", cls: "bg-violet-50 text-violet-700" },
  "auto-sync": { label: "Auto-sync", cls: "bg-sky-50 text-sky-700" },
  share: { label: "Share link", cls: "bg-pink-50 text-pink-700" },
};

export default function HistoryList({ entries, compact = false }: { entries: HistoryEntry[]; compact?: boolean }) {
  const { removeHistory } = useCloud();
  const { toast } = useToast();
  const now = useNow();

  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((h) => {
        const icon = h.templateId === "share-link" ? "🔗" : TEMPLATES[h.templateId].icon;
        return (
          <li key={h.id} className="flex items-center gap-3 px-4 py-3 sm:px-5" data-testid="history-row">
            {h.trigger === "share" ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-lg" aria-hidden>
                {icon}
              </span>
            ) : (
              <ServiceIcon id={h.destination} />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-slate-900">
                <span className="truncate">
                  {h.trigger !== "share" && <span aria-hidden>{icon} </span>}
                  {h.title}
                  {h.trigger !== "share" && <span className="font-normal text-slate-500"> → {DESTINATIONS[h.destination].name}</span>}
                </span>
                {!compact && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TRIGGER[h.trigger].cls}`}>{TRIGGER[h.trigger].label}</span>}
              </p>
              <p className={`truncate text-xs ${h.status === "failed" ? "text-rose-600" : "text-slate-500"}`} title={h.detail ?? undefined}>
                <time dateTime={h.createdAt} title={absoluteTime(h.createdAt)}>
                  {relativeTime(h.createdAt, now)}
                </time>
                {h.status === "success" ? ` · ${h.records} records · ${formatBytes(h.bytes)}` : ""}
                {h.detail ? ` · ${h.detail}` : ""}
              </p>
            </div>
            {h.status === "failed" ? (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">Failed</span>
            ) : (
              !compact && (
                <div className="flex shrink-0 gap-1">
                  {h.content && h.filename && h.mimeType && (
                    <button
                      type="button"
                      onClick={() => downloadText(h.content!, h.filename!, h.mimeType!)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                      title={`Download the exact file from ${absoluteTime(h.createdAt)}`}
                    >
                      Download
                    </button>
                  )}
                  {h.link && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(h.link!).then(() => toast("Link copied"))}
                      className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      Copy link
                    </button>
                  )}
                  <button type="button" onClick={() => removeHistory(h.id)} aria-label="Remove from history" className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    ×
                  </button>
                </div>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
