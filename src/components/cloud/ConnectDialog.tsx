"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ExpenseFormDialog";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { DESTINATIONS, DEFAULT_TARGETS } from "@/lib/cloud/destinations";
import type { DestinationId, DestinationKind } from "@/lib/cloud/types";
import { ServiceIcon, SimulatedBadge } from "./ui";

const PERMISSIONS: Record<DestinationKind, string[]> = {
  local: [],
  storage: ["Create and update files in one app folder", "Read files Spendwise created", "No access to your other files"],
  spreadsheet: ["Create spreadsheets", "Edit spreadsheets Spendwise created", "No access to your other spreadsheets"],
  messaging: ["Post messages to one channel you choose", "No access to message history"],
  automation: ["Send JSON payloads to the URL you provide"],
};

const TARGET_LABEL: Partial<Record<DestinationKind, string>> = {
  storage: "Folder",
  spreadsheet: "Spreadsheet name",
  messaging: "Channel",
  automation: "Endpoint URL",
};

function validWebhookUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname));
  } catch {
    return false;
  }
}

export default function ConnectDialog({ id, onClose, onConnected }: { id: DestinationId; onClose: () => void; onConnected?: () => void }) {
  const d = DESTINATIONS[id];
  const { connect } = useCloud();
  const { toast } = useToast();
  const isWebhook = id === "webhook";
  const [account, setAccount] = useState(isWebhook ? "Automation" : "");
  const [target, setTarget] = useState(DEFAULT_TARGETS[id] ?? "");
  const [phase, setPhase] = useState<"form" | "authorizing">("form");
  const [testing, setTesting] = useState<"idle" | "sending" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const accountError = !account.trim() ? "Enter an account name or email." : null;
  const targetError = isWebhook ? (validWebhookUrl(target) ? null : "Enter an https:// URL (http://localhost is OK for testing).") : !target.trim() ? "Required." : null;

  const submit = async () => {
    setSubmitted(true);
    if (accountError || targetError) return;
    setPhase("authorizing");
    await connect(id, account.trim(), target.trim());
    toast(`${d.name} connected`);
    onConnected?.();
    onClose();
  };

  const sendTest = async () => {
    setSubmitted(true);
    if (targetError) return;
    setTesting("sending");
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "spendwise.test", sentAt: new Date().toISOString() }),
      });
      setTesting(res.ok ? "ok" : "fail");
      setTestMsg(res.ok ? `Endpoint replied ${res.status}` : `Endpoint replied ${res.status}`);
    } catch {
      setTesting("fail");
      setTestMsg("Couldn't reach the endpoint. Check the URL and that it accepts browser (CORS) requests.");
    }
  };

  return (
    <Modal title={`Connect ${d.name}`} onClose={phase === "authorizing" ? () => {} : onClose} size="sm">
      {phase === "authorizing" ? (
        <div className="flex flex-col items-center py-8 text-center" role="status">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">$</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </span>
            <ServiceIcon id={id} size="lg" />
          </div>
          <p className="mt-5 text-sm font-medium text-slate-900">{d.simulated ? `Authorizing with ${d.name}…` : "Saving connection…"}</p>
          <p className="mt-1 text-xs text-slate-500">{d.simulated ? "Simulated sign-in — nothing leaves your browser." : "Almost done."}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <ServiceIcon id={id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {d.name} <SimulatedBadge simulated={d.simulated} />
              </p>
              <p className="text-xs text-slate-500">{d.tagline}</p>
            </div>
          </div>

          {PERMISSIONS[d.kind].length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Spendwise will be able to</p>
              <ul className="space-y-1.5">
                {PERMISSIONS[d.kind].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className={p.startsWith("No ") ? "text-slate-400" : "text-emerald-500"}>{p.startsWith("No ") ? "✕" : "✓"}</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isWebhook && (
            <label className="block text-sm font-medium text-slate-700">
              Account
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="you@example.com"
                className={`input mt-1 ${submitted && accountError ? "input-error" : ""}`}
                autoFocus
              />
              {submitted && accountError && <span className="mt-1 block text-xs text-rose-600">{accountError}</span>}
            </label>
          )}

          <label className="block text-sm font-medium text-slate-700">
            {TARGET_LABEL[d.kind]}
            <input
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setTesting("idle");
              }}
              placeholder={isWebhook ? "https://hooks.zapier.com/hooks/catch/…" : undefined}
              className={`input mt-1 ${isWebhook ? "font-mono text-xs" : ""} ${submitted && targetError ? "input-error" : ""}`}
              autoFocus={isWebhook}
              spellCheck={false}
            />
            {submitted && targetError && <span className="mt-1 block text-xs text-rose-600">{targetError}</span>}
          </label>

          {isWebhook && (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={sendTest} disabled={testing === "sending"} className="btn-secondary py-1.5 text-xs">
                {testing === "sending" ? <Spinner className="h-3 w-3" /> : "⚡"} Send test event
              </button>
              {testing === "ok" && <span className="text-xs font-medium text-emerald-600">✓ {testMsg}</span>}
              {testing === "fail" && <span className="text-xs text-rose-600">{testMsg}</span>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={submit} className="btn-primary">
              {d.simulated ? `Authorize ${d.name}` : "Save connection"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
