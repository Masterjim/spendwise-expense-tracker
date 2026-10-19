"use client";

import { useCallback, useEffect, useState } from "react";
import { useCloud } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import type { DialogRequest } from "./dialogs";
import OverviewTab from "./tabs/OverviewTab";
import TemplatesTab from "./tabs/TemplatesTab";
import IntegrationsTab from "./tabs/IntegrationsTab";
import SchedulesTab from "./tabs/SchedulesTab";
import HistoryTab from "./tabs/HistoryTab";
import ShareDialog from "./ShareDialog";
import EmailDialog from "./EmailDialog";
import SheetsDialog from "./SheetsDialog";
import ConnectDialog from "./ConnectDialog";
import ScheduleDialog from "./ScheduleDialog";
import TemplatePreviewDialog from "./TemplatePreviewDialog";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "templates", label: "Templates" },
  { id: "integrations", label: "Integrations" },
  { id: "schedules", label: "Schedules" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ExportCenter() {
  const { schedules, history, connections } = useCloud();
  const { expenses } = useExpenses();
  const [tab, setTab] = useState<TabId>("overview");
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  // Tabs are deep-linkable via the URL hash (e.g. /export#history).
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1) as TabId;
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const goTo = useCallback((id: string) => {
    setTab(id as TabId);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  const counts: Partial<Record<TabId, number>> = {
    integrations: Object.keys(connections).length,
    schedules: schedules.length,
    history: history.length,
  };
  const close = () => setDialog(null);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Share &amp; Export</h1>
          <p className="mt-1 text-sm text-slate-500">Connect your tools, automate reports and share snapshots of {expenses.length} expenses.</p>
        </div>
        <button type="button" onClick={() => setDialog({ type: "share" })} disabled={expenses.length === 0} className="btn-primary">
          🔗 Share snapshot
        </button>
      </div>

      <div role="tablist" aria-label="Export center" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => goTo(t.id)}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {counts[t.id] ? <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "overview" && <OverviewTab open={setDialog} goTo={goTo} />}
        {tab === "templates" && <TemplatesTab open={setDialog} />}
        {tab === "integrations" && <IntegrationsTab open={setDialog} />}
        {tab === "schedules" && <SchedulesTab open={setDialog} />}
        {tab === "history" && <HistoryTab />}
      </div>

      {dialog?.type === "share" && <ShareDialog onClose={close} />}
      {dialog?.type === "email" && <EmailDialog onClose={close} initialTemplate={dialog.templateId} />}
      {dialog?.type === "sheets" && <SheetsDialog onClose={close} />}
      {dialog?.type === "connect" && <ConnectDialog id={dialog.id} onClose={close} />}
      {dialog?.type === "schedule" && <ScheduleDialog initial={dialog.initial} onClose={close} />}
      {dialog?.type === "preview" && <TemplatePreviewDialog id={dialog.id} onClose={close} />}
    </>
  );
}
