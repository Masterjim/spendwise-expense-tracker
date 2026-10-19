"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ExpenseFormDialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useCloud } from "@/hooks/useCloud";
import { useToast } from "@/hooks/useToast";
import { buildSnapshot, encodeSnapshot, shareUrl, QR_MAX_LENGTH, type ShareOptions, type ShareScope } from "@/lib/cloud/share";
import { formatCurrency, toISODate } from "@/lib/format";
import { Toggle } from "./ui";

type RangeId = "month" | "3m" | "ytd" | "all";
const RANGES: Array<{ id: RangeId; label: string }> = [
  { id: "month", label: "This month" },
  { id: "3m", label: "Last 3 months" },
  { id: "ytd", label: "Year to date" },
  { id: "all", label: "All time" },
];

function rangeDates(id: RangeId, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const end = toISODate(now);
  if (id === "month") return { startDate: toISODate(new Date(y, m, 1)), endDate: end };
  if (id === "3m") return { startDate: toISODate(new Date(y, m - 2, 1)), endDate: end };
  if (id === "ytd") return { startDate: `${y}-01-01`, endDate: end };
  return { startDate: "", endDate: "" };
}

const EXPIRY = [
  { v: null, label: "Never" },
  { v: 1, label: "1 day" },
  { v: 7, label: "7 days" },
  { v: 30, label: "30 days" },
] as const;

export default function ShareDialog({ onClose }: { onClose: () => void }) {
  const { expenses } = useExpenses();
  const { recordShare } = useCloud();
  const { toast } = useToast();

  const [scope, setScope] = useState<ShareScope>("summary");
  const [range, setRange] = useState<RangeId>("month");
  const [title, setTitle] = useState("My spending");
  const [by, setBy] = useState("");
  const [includeDescriptions, setIncludeDescriptions] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
  const [url, setUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string | null>(null);

  const options: ShareOptions = useMemo(
    () => ({ scope, title, by, includeDescriptions, expiresInDays, ...rangeDates(range) }),
    [scope, title, by, includeDescriptions, expiresInDays, range],
  );
  const snapshot = useMemo(() => buildSnapshot(expenses, options), [expenses, options]);

  // Re-encode (async, compressed) whenever options change.
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    const t = setTimeout(async () => {
      const payload = await encodeSnapshot(snapshot);
      if (cancelled) return;
      const link = shareUrl(window.location.origin, payload);
      setUrl(link);
      setQr(link.length <= QR_MAX_LENGTH ? await QRCode.toDataURL(link, { errorCorrectionLevel: "L", margin: 1, width: 360, color: { dark: "#0f172a" } }) : null);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [snapshot]);

  const remember = () => {
    if (url && recorded !== url) {
      recordShare({ title: snapshot.title, link: url, records: snapshot.count });
      setRecorded(url);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
      remember();
    } catch {
      toast("Couldn't access the clipboard — select the link and copy it manually.", { variant: "error" });
    }
  };

  const nativeShare = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: snapshot.title, text: `${snapshot.title} — ${formatCurrency(snapshot.total)}`, url });
      remember();
    } catch {
      /* user cancelled */
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const capacity = url ? Math.min(100, Math.round((url.length / QR_MAX_LENGTH) * 100)) : 0;

  return (
    <Modal title="Share a live snapshot" description="Create a read-only link anyone can open — no account needed." onClose={onClose} size="xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">What to share</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Share scope">
              {(
                [
                  { id: "summary", title: "Summary", desc: "Totals, categories and trend. No individual expenses." },
                  { id: "full", title: "Full data", desc: "Every expense in range. Recipient can import it." },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={scope === o.id}
                  onClick={() => setScope(o.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    scope === o.id ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-200" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Period</p>
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={range === r.id}
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    range === r.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} className="input mt-1" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Shared by <span className="font-normal text-slate-400">(optional)</span>
              <input value={by} onChange={(e) => setBy(e.target.value.slice(0, 40))} placeholder="Your name" className="input mt-1" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Expires
              <select
                value={expiresInDays ?? "never"}
                onChange={(e) => setExpiresInDays(e.target.value === "never" ? null : Number(e.target.value))}
                className="input w-auto py-1.5"
              >
                {EXPIRY.map((x) => (
                  <option key={x.label} value={x.v ?? "never"}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            {scope === "full" && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Toggle checked={includeDescriptions} onChange={setIncludeDescriptions} label="Include descriptions" />
                Include descriptions
              </label>
            )}
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
            <p className="font-semibold">🔒 Private by design</p>
            <p className="mt-0.5">
              The snapshot is compressed into the link itself, after the <code className="rounded bg-white/70 px-1">#</code>. Nothing is uploaded, and the part after{" "}
              <code className="rounded bg-white/70 px-1">#</code> is never sent to a server. Anyone with the link can view it, so share it like you would a document.
              Expiry is enforced by the viewer page.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">{snapshot.title}</p>
            <p className="text-xs text-slate-500">
              {snapshot.count} expenses · {formatCurrency(snapshot.total)}
            </p>
          </div>
          <div className="flex aspect-square w-48 items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
            {!url ? (
              <Spinner className="h-6 w-6 text-slate-300" />
            ) : qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code for the share link" className="h-full w-full" />
            ) : (
              <p className="px-3 text-center text-xs text-slate-500">
                Too much data for a scannable QR code. Choose <b>Summary</b> or a shorter period — the link still works.
              </p>
            )}
          </div>
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>QR capacity</span>
              <span>{url ? `${url.length.toLocaleString()} / ${QR_MAX_LENGTH.toLocaleString()} chars` : "…"}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${capacity >= 100 ? "bg-rose-500" : capacity > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${capacity}%` }}
              />
            </div>
          </div>
          <input
            readOnly
            value={url ?? "Generating…"}
            onFocus={(e) => e.target.select()}
            aria-label="Share link"
            className="input w-full truncate font-mono text-[11px]"
          />
          <div className="grid w-full grid-cols-2 gap-2">
            <button type="button" onClick={copy} disabled={!url} className="btn-primary col-span-2">
              Copy link
            </button>
            <a
              href={url ?? undefined}
              target="_blank"
              rel="noreferrer"
              onClick={remember}
              aria-disabled={!url}
              className="btn-secondary py-1.5 text-xs"
            >
              Open preview
            </a>
            {qr ? (
              <a href={qr} download={`${snapshot.title.replace(/[^\w-]+/g, "-").toLowerCase() || "spendwise"}-qr.png`} onClick={remember} className="btn-secondary py-1.5 text-xs">
                Save QR
              </a>
            ) : (
              <button type="button" disabled className="btn-secondary py-1.5 text-xs">
                Save QR
              </button>
            )}
            {canNativeShare && (
              <button type="button" onClick={nativeShare} disabled={!url} className="btn-secondary col-span-2 py-1.5 text-xs">
                Share via…
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
