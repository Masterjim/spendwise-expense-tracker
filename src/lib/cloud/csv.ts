export function csvCell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function csvRows(rows: Array<Array<string | number>>): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Tab-separated text: pastes into Google Sheets / Excel as a grid. */
export function tsvRows(rows: Array<Array<string | number>>): string {
  return rows.map((r) => r.map((c) => String(c).replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}
