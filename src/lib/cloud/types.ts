import type { Expense } from "@/types/expense";

export type TemplateId = "full-backup" | "monthly-summary" | "tax-report" | "category-analysis";

export type DestinationId =
  | "download"
  | "email"
  | "google-drive"
  | "google-sheets"
  | "dropbox"
  | "onedrive"
  | "slack"
  | "webhook";

export type DestinationKind = "local" | "storage" | "spreadsheet" | "messaging" | "automation";

export interface DestinationDefinition {
  id: DestinationId;
  name: string;
  kind: DestinationKind;
  /** Two-letter monogram and brand-neutral color for the service tile. */
  monogram: string;
  color: string;
  tagline: string;
  /** True when we only simulate the integration (no real network call). */
  simulated: boolean;
  /** Needs a connection before it can be used. */
  requiresConnection: boolean;
  /** Supports background auto-sync of a full backup on every change. */
  supportsAutoSync: boolean;
}

export interface RenderedFile {
  filename: string;
  mimeType: string;
  content: string;
  records: number;
}

export interface TemplateContext {
  now: Date;
}

export interface ExportTemplate {
  id: TemplateId;
  name: string;
  description: string;
  /** Who/what this template is for, shown on the card. */
  audience: string;
  icon: string;
  accent: string;
  formatLabel: string;
  /** Human readable scope, e.g. "Jan 1 – Oct 19, 2026". */
  scope: (ctx: TemplateContext) => string;
  select: (expenses: Expense[], ctx: TemplateContext) => Expense[];
  render: (records: Expense[], ctx: TemplateContext) => RenderedFile;
}

export interface Connection {
  id: DestinationId;
  account: string;
  connectedAt: string;
  /** Folder, channel, spreadsheet name or webhook URL depending on service. */
  target: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  /** Data fingerprint at last successful sync; used for "out of date" status. */
  lastSyncFingerprint: string | null;
}

export type Frequency = "daily" | "weekly" | "monthly";

export interface Schedule {
  id: string;
  name: string;
  templateId: TemplateId;
  destination: DestinationId;
  frequency: Frequency;
  /** 0 = Sunday … 6 = Saturday, used when weekly. */
  weekday: number;
  /** 1–28, used when monthly. */
  dayOfMonth: number;
  /** "HH:MM", local time. */
  time: string;
  /** Email recipients, when destination is email. */
  recipients: string[];
  enabled: boolean;
  createdAt: string;
  lastRunAt: string | null;
  nextRunAt: string;
}

export type Trigger = "manual" | "schedule" | "auto-sync" | "share";

export interface HistoryEntry {
  id: string;
  createdAt: string;
  templateId: TemplateId | "share-link";
  title: string;
  destination: DestinationId;
  trigger: Trigger;
  status: "success" | "failed";
  records: number;
  bytes: number;
  filename: string | null;
  mimeType: string | null;
  /** File content kept for re-download when small enough. */
  content: string | null;
  /** Share URL for share entries. */
  link: string | null;
  detail: string | null;
}

export interface Job {
  id: string;
  title: string;
  destination: DestinationId;
  stage: string;
  progress: number;
  status: "running" | "success" | "failed";
  startedAt: number;
}
