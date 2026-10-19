"use client";

import { useCloud, useNow } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATION_LIST } from "@/lib/cloud/destinations";
import type { DestinationDefinition, DestinationKind } from "@/lib/cloud/types";
import { relativeTime } from "@/lib/cloud/util";
import type { OpenDialog } from "../dialogs";
import { SectionHeader, ServiceIcon, SimulatedBadge, StatusPill, Toggle } from "../ui";

const GROUPS: Array<{ kind: DestinationKind[]; title: string; description: string }> = [
  { kind: ["storage"], title: "Cloud storage", description: "Continuous backups. Turn on auto-sync and every change is pushed within seconds." },
  { kind: ["spreadsheet", "messaging"], title: "Apps", description: "Put your numbers where you already work." },
  { kind: ["automation"], title: "Developer", description: "Trigger your own workflows with real HTTP requests." },
];

export default function IntegrationsTab({ open }: { open: OpenDialog }) {
  return (
    <div className="space-y-8">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <SectionHeader title={g.title} description={g.description} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DESTINATION_LIST.filter((d) => g.kind.includes(d.kind)).map((d) => (
              <IntegrationCard key={d.id} d={d} open={open} />
            ))}
          </div>
        </section>
      ))}
      <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
        <b>Simulated</b> integrations walk through the real flow (authorize, choose a folder, sync, history) but don&apos;t contact the service, because this demo has
        no backend. Share links, webhooks, Sheets paste, Markdown copy and calendar files work for real.
      </p>
    </div>
  );
}

function IntegrationCard({ d, open }: { d: DestinationDefinition; open: OpenDialog }) {
  const { connections, connectionStatus, setAutoSync, disconnect, deliver } = useCloud();
  const { toast } = useToast();
  useNow();
  const c = connections[d.id];
  const status = connectionStatus(d.id);

  const syncNow = async () => {
    const entry = await deliver({ templateId: d.kind === "messaging" ? "monthly-summary" : "full-backup", destination: d.id });
    toast(entry.status === "success" ? `${d.name}: ${entry.detail}` : entry.detail ?? "Failed", { variant: entry.status === "success" ? "success" : "error" });
  };

  return (
    <article className={`card flex flex-col p-5 transition ${c ? "ring-1 ring-emerald-200" : ""}`} data-testid={`integration-${d.id}`}>
      <div className="flex items-start gap-3">
        <ServiceIcon id={d.id} />
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
            {d.name} <SimulatedBadge simulated={d.simulated} />
          </h3>
          <StatusPill status={status} />
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-slate-600">{d.tagline}</p>

      {c ? (
        <div className="mt-4 space-y-3">
          <dl className="space-y-1 rounded-lg bg-slate-50 p-3 text-xs">
            {d.id !== "webhook" && (
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Account</dt>
                <dd className="truncate font-medium text-slate-700">{c.account}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">{d.id === "webhook" ? "URL" : "Target"}</dt>
              <dd className="truncate font-medium text-slate-700" title={c.target}>
                {c.target}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Last sync</dt>
              <dd className="font-medium text-slate-700">{c.lastSyncAt ? relativeTime(c.lastSyncAt) : "Never"}</dd>
            </div>
          </dl>
          {d.supportsAutoSync && (
            <label className="flex items-center justify-between text-sm text-slate-700">
              Auto-sync backups
              <Toggle checked={c.autoSync} onChange={(v) => setAutoSync(d.id, v)} label={`Auto-sync ${d.name}`} />
            </label>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={syncNow} disabled={status === "syncing"} className="btn-secondary flex-1 py-1.5 text-xs">
              {d.kind === "messaging" ? "Post summary" : d.id === "webhook" ? "Send backup" : "Sync now"}
            </button>
            <button type="button" onClick={() => disconnect(d.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
              Disconnect
            </button>
          </div>
        </div>
      ) : !d.requiresConnection ? (
        <button type="button" onClick={() => open({ type: "email" })} className="btn-secondary mt-4 w-full">
          Compose email
        </button>
      ) : (
        <button type="button" onClick={() => open(d.id === "google-sheets" ? { type: "sheets" } : { type: "connect", id: d.id })} className="btn-secondary mt-4 w-full">
          Connect
        </button>
      )}
    </article>
  );
}
