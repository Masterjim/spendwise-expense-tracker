import { todayISO } from "@/lib/format";

// Characters that are invalid in filenames on Windows, macOS or Linux.
// eslint-disable-next-line no-control-regex
const INVALID = /[<>:"/\\|?*\u0000-\u001f]/g;
const RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;
export const MAX_FILENAME_LENGTH = 80;

export function defaultFilename(): string {
  return `spendwise-expenses-${todayISO()}`;
}

/** Returns an error message, or null if the filename is usable. */
export function validateFilename(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a filename.";
  if (INVALID.test(trimmed)) return 'Remove these characters: < > : " / \\ | ? *';
  if (RESERVED.test(trimmed)) return "That name is reserved by the operating system.";
  if (trimmed.startsWith(".")) return "Filename can't start with a dot.";
  if (trimmed.length > MAX_FILENAME_LENGTH) return `Keep it under ${MAX_FILENAME_LENGTH} characters.`;
  return null;
}

/** Strips a trailing extension the user may have typed, e.g. "report.csv" → "report". */
export function stripExtension(name: string, extension: string): string {
  const suffix = `.${extension}`;
  return name.toLowerCase().endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}
