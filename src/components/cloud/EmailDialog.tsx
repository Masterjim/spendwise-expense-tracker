"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ExpenseFormDialog";
import { useCloud } from "@/hooks/useCloud";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/useToast";
import { TEMPLATES, TEMPLATE_LIST } from "@/lib/cloud/templates";
import type { TemplateId } from "@/lib/cloud/types";
import { EMAIL_RE, byteLength, formatBytes } from "@/lib/cloud/util";
import { formatCurrency } from "@/lib/format";
import { SimulatedBadge } from "./ui";

export default function EmailDialog({ onClose, initialTemplate = "monthly-summary" }: { onClose: () => void; initialTemplate?: TemplateId }) {
  const { deliver } = useCloud();
  const { expenses } = useExpenses();
  const { toast } = useToast();
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplate);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState(`Spendwise: ${TEMPLATES[initialTemplate].name}`);
  const [message, setMessage] = useState("Hi! Here's my latest expense report from Spendwise.");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = TEMPLATES[templateId];
  const file = useMemo(() => {
    const now = new Date();
    const records = template.select(expenses, { now });
    return { ...template.render(records, { now }), total: records.reduce((a, e) => a + e.amount, 0) };
  }, [template, expenses]);

  const addDraft = () => {
    const parts = draft.split(/[\s,;]+/).filter(Boolean);
    if (parts.length === 0) return true;
    const bad = parts.find((p) => !EMAIL_RE.test(p));
    if (bad) {
      setError(`“${bad}” isn't a valid email address.`);
      return false;
    }
    setRecipients((r) => [...new Set([...r, ...parts.map((p) => p.toLowerCase())])].slice(0, 10));
    setDraft("");
    setError(null);
    return true;
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " ", "Tab"].includes(e.key) && draft.trim()) {
      if (e.key !== "Tab") e.preventDefault();
      addDraft();
    } else if (e.key === "Backspace" && !draft && recipients.length) {
      setRecipients((r) => r.slice(0, -1));
    }
  };

  const send = async () => {
    if (!addDraft()) return;
    const list = [...new Set([...recipients, ...draft.split(/[\s,;]+/).filter((p) => EMAIL_RE.test(p))])];
    if (list.length === 0) {
      setError("Add at least one recipient.");
      return;
    }
    setSending(true);
    const entry = await deliver({ templateId, destination: "email", recipients: list, message });
    setSending(false);
    if (entry.status === "success") {
      toast(`Report sent to ${list.length} recipient${list.length > 1 ? "s" : ""} (simulated)`);
      onClose();
    } else {
      setError(entry.detail);
    }
  };

  const mailto = useMemo(() => {
    const body = `${message}\n\n${template.name} (${template.scope({ now: new Date() })})\nTotal: ${formatCurrency(file.total)} across ${file.records} expenses.\n\n(Attach ${file.filename}, downloaded from Spendwise.)`;
    return `mailto:${recipients.join(",")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [recipients, subject, message, template, file]);

  return (
    <Modal title="Email a report" description="Send a template as an attachment to one or more people." onClose={sending ? () => {} : onClose} size="xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="email-to" className="text-sm font-medium text-slate-700">
              To
            </label>
            <div
              className={`mt-1 flex min-h-[2.6rem] flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-sm focus-within:ring-2 ${
                error ? "border-rose-400 focus-within:ring-rose-200" : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-200"
              }`}
            >
              {recipients.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {r}
                  <button type="button" onClick={() => setRecipients((x) => x.filter((y) => y !== r))} aria-label={`Remove ${r}`} className="text-brand-400 hover:text-brand-700">
                    ×
                  </button>
                </span>
              ))}
              <input
                id="email-to"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onKeyDown={onKey}
                onBlur={() => draft.trim() && addDraft()}
                placeholder={recipients.length ? "" : "name@example.com, press Enter"}
                className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none"
                autoFocus
              />
            </div>
            {error && (
              <p role="alert" className="mt-1 text-xs text-rose-600">
                {error}
              </p>
            )}
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Report
            <select
              value={templateId}
              onChange={(e) => {
                const id = e.target.value as TemplateId;
                setTemplateId(id);
                setSubject(`Spendwise: ${TEMPLATES[id].name}`);
              }}
              className="input mt-1"
            >
              {TEMPLATE_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name} · {t.formatLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input mt-1" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="input mt-1 resize-none" />
          </label>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            Preview <SimulatedBadge simulated />
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-1 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <p>
                <span className="inline-block w-14 text-slate-400">From</span> Spendwise Reports
              </p>
              <p className="truncate">
                <span className="inline-block w-14 text-slate-400">To</span> {recipients.join(", ") || "—"}
              </p>
              <p className="truncate font-medium text-slate-800">
                <span className="inline-block w-14 font-normal text-slate-400">Subject</span> {subject}
              </p>
            </div>
            <div className="space-y-4 px-4 py-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{message}</p>
              <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white">
                <p className="text-xs opacity-80">
                  {template.icon} {template.name} · {template.scope({ now: new Date() })}
                </p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(file.total)}</p>
                <p className="text-xs opacity-80">{file.records} expenses</p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
                  {template.formatLabel.slice(0, 4).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800">{file.filename}</p>
                  <p className="text-[11px] text-slate-500">{formatBytes(byteLength(file.content))}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Demo: Spendwise has no mail server, so <b>Send</b> simulates delivery and logs it to history. <b>Open in mail app</b> really opens your email
            client with the summary filled in.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={sending} className="btn-secondary">
          Cancel
        </button>
        <a href={mailto} className="btn-secondary">
          Open in mail app
        </a>
        <button type="button" onClick={send} disabled={sending} className="btn-primary sm:min-w-[9rem]">
          {sending ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            "Send report"
          )}
        </button>
      </div>
    </Modal>
  );
}
