"use client";

import { useEffect, useRef, useState } from "react";
import { useCloud } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { TEMPLATE_LIST } from "@/lib/cloud/templates";
import type { DestinationId, TemplateId } from "@/lib/cloud/types";
import type { OpenDialog } from "../dialogs";
import { SectionHeader, ServiceIcon } from "../ui";

export default function TemplatesTab({ open }: { open: OpenDialog }) {
  const { expenses } = useExpenses();
  const now = new Date();
  return (
    <div>
      <SectionHeader title="Export templates" description="Purpose-built exports. Preview, download, or send anywhere you're connected." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TEMPLATE_LIST.map((t) => {
          const count = t.select(expenses, { now }).length;
          return (
            <article key={t.id} className="card flex flex-col overflow-hidden" data-testid={`template-${t.id}`}>
              <div className="h-1.5" style={{ background: t.accent }} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${t.accent}1a` }} aria-hidden>
                    {t.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.audience}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">{t.formatLabel}</span>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600">{t.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {t.scope({ now })} · <span className="font-medium text-slate-700">{count} expenses</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => open({ type: "preview", id: t.id })} className="btn-secondary py-1.5 text-xs">
                    Preview
                  </button>
                  <SendMenu templateId={t.id} open={open} />
                  <button
                    type="button"
                    onClick={() => open({ type: "schedule", initial: { templateId: t.id } })}
                    className="py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    ⏱ Automate
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SendMenu({ templateId, open }: { templateId: TemplateId; open: OpenDialog }) {
  const { connections, deliver } = useCloud();
  const { toast } = useToast();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const targets: DestinationId[] = ["download", "email", ...(Object.keys(connections) as DestinationId[])];

  const send = async (id: DestinationId) => {
    setMenu(false);
    if (id === "email") return open({ type: "email", templateId });
    const entry = await deliver({ templateId, destination: id });
    if (id !== "download") {
      toast(entry.status === "success" ? `Sent to ${DESTINATIONS[id].name}` : entry.detail ?? "Failed", { variant: entry.status === "success" ? "success" : "error" });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="btn-primary py-1.5 text-xs">
        Export to… ▾
      </button>
      {menu && (
        <div role="menu" className="absolute left-0 z-20 mt-1 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {targets.map((id) => (
            <button key={id} type="button" role="menuitem" onClick={() => send(id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
              <ServiceIcon id={id} size="sm" />
              {DESTINATIONS[id].name}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenu(false);
              open({ type: "share" });
            }}
            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
          >
            <span className="flex h-7 w-7 items-center justify-center">🔗</span> Share link instead…
          </button>
        </div>
      )}
    </div>
  );
}
