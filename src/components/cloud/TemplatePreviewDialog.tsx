"use client";

import { useMemo } from "react";
import Modal from "@/components/Modal";
import { useExpenses } from "@/hooks/useExpenses";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { TEMPLATES } from "@/lib/cloud/templates";
import type { TemplateId } from "@/lib/cloud/types";
import { byteLength, formatBytes } from "@/lib/cloud/util";

const MAX_LINES = 120;

export default function TemplatePreviewDialog({ id, onClose }: { id: TemplateId; onClose: () => void }) {
  const { expenses } = useExpenses();
  const { deliver } = useCloud();
  const { toast } = useToast();
  const t = TEMPLATES[id];
  const file = useMemo(() => {
    const now = new Date();
    return t.render(t.select(expenses, { now }), { now });
  }, [t, expenses]);
  const content = file.content.replace(/^﻿/, "");
  const lines = content.split(/\r?\n/);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast(t.formatLabel === "Markdown" ? "Copied — paste into Notion, Obsidian or a GitHub issue" : "Copied to clipboard");
    } catch {
      toast("Clipboard unavailable.", { variant: "error" });
    }
  };

  return (
    <Modal title={`${t.icon} ${t.name}`} description={`${t.scope({ now: new Date() })} · ${file.records} expenses · ${formatBytes(byteLength(file.content))}`} onClose={onClose} size="xl">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
          <span className="font-mono text-xs text-slate-600">{file.filename}</span>
          <span className="text-xs text-slate-400">{lines.length > MAX_LINES ? `First ${MAX_LINES} of ${lines.length} lines` : `${lines.length} lines`}</span>
        </div>
        <pre className="max-h-[55vh] overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-700">{lines.slice(0, MAX_LINES).join("\n")}</pre>
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={copy} className="btn-secondary">
          {t.formatLabel === "Markdown" ? "Copy Markdown (for Notion)" : "Copy contents"}
        </button>
        <button
          type="button"
          onClick={() => {
            void deliver({ templateId: id, destination: "download" });
            onClose();
          }}
          className="btn-primary"
        >
          Download {t.formatLabel}
        </button>
      </div>
    </Modal>
  );
}
