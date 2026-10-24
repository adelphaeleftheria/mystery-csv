import Papa from "papaparse";
import type { Row } from "../types";
export function parseCSV(text: string) {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), {
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", "\t", ";", "|"],
  });
  if (parsed.errors.some((e) => e.code === "MissingQuotes"))
    throw new Error(
      "An opening quote has no closing quote. Check the quoted fields and try again.",
    );
  if (parsed.data.length < 2)
    throw new Error("Add a header row and at least one data row to your CSV.");
  const warnings: string[] = [];
  const used = new Set<string>();
  const columns = parsed.data[0].map((v, i) => {
    let s = v.trim() || `Column ${i + 1}`;
    if (!v.trim()) warnings.push(`Header ${i + 1} was empty; named ${s}.`);
    const base = s;
    let n = 2;
    while (used.has(s)) s = `${base} (${n++})`;
    if (s !== base) warnings.push(`Repeated header ${base} was renamed ${s}.`);
    used.add(s);
    return s;
  });
  if (columns.length > 150)
    throw new Error(
      "This file has more than 150 columns. Select a smaller set of columns first.",
    );
  if (parsed.data.length > 200001)
    throw new Error(
      "This file has more than 200,000 rows. Split it into smaller files to keep the investigation responsive.",
    );
  let uneven = 0;
  const rows: Row[] = parsed.data.slice(1).map((cells) => {
    if (cells.length !== columns.length) uneven++;
    const r: Row = Object.create(null);
    columns.forEach((c, i) => (r[c] = cells[i] ?? ""));
    return r;
  });
  if (uneven)
    warnings.push(
      `${uneven} rows had a different field count. Missing fields are empty; extra fields were omitted.`,
    );
  return { rows, columns, warnings };
}
// Spreadsheet formula protection applies to exported text cells, never to stored data.
export function toCSV(rows: Row[], columns: string[]) {
  return Papa.unparse({
    fields: columns,
    data: rows.map((r) =>
      columns.map((c) =>
        /^[=+@\t\r]/.test(r[c]) || /^-[^\d.]/.test(r[c]) ? `'${r[c]}` : r[c],
      ),
    ),
  });
}
