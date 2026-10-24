import { openDB } from "idb";
import type { Case, Settings } from "../types";
const db = () =>
  openDB("mystery-csv", 1, {
    upgrade(db) {
      db.createObjectStore("cases", { keyPath: "id" });
      db.createObjectStore("settings");
    },
  });
export const storage = {
  async cases(): Promise<Case[]> {
    return (await (await db()).getAll("cases")).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },
  async save(c: Case) {
    await (await db()).put("cases", c);
  },
  async remove(id: string) {
    await (await db()).delete("cases", id);
  },
  async settings(): Promise<Settings | undefined> {
    return (await db()).get("settings", "preferences");
  },
  async saveSettings(s: Settings) {
    await (await db()).put("settings", s, "preferences");
  },
  async clear() {
    const d = await db();
    const tx = d.transaction(["cases", "settings"], "readwrite");
    await Promise.all([
      tx.objectStore("cases").clear(),
      tx.objectStore("settings").clear(),
    ]);
    await tx.done;
  },
  async restore(cases: Case[], settings: Settings, replace = false) {
    const d = await db();
    const tx = d.transaction(["cases", "settings"], "readwrite");
    if (replace) await tx.objectStore("cases").clear();
    for (const c of cases) await tx.objectStore("cases").put(c);
    await tx.objectStore("settings").put(settings, "preferences");
    await tx.done;
  },
};
export function download(content: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function validateBackup(
  value: unknown,
): value is { version: 1; cases: Case[]; settings: Settings } {
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const text = (v: unknown): v is string => typeof v === "string";
  const finite = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  const strings = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every(text);
  const choice = (v: unknown, a: string[]) => text(v) && a.includes(v);
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.cases) ||
    value.cases.length > 500 ||
    !object(value.settings)
  )
    return false;
  const s = value.settings;
  if (
    !choice(s.theme, ["light", "dark", "system"]) ||
    !choice(s.mode, ["mystery", "explore"]) ||
    !choice(s.difficulty, ["Easy", "Medium", "Hard", "Expert"]) ||
    !finite(s.clueCount) ||
    ![5, 8, 10, 12].includes(s.clueCount) ||
    !["compact", "reducedMotion", "autoAdvance", "showCalculations"].every(
      (k) => typeof s[k] === "boolean",
    )
  )
    return false;
  const columnTypes = [
    "number",
    "currency",
    "percentage",
    "date",
    "datetime",
    "boolean",
    "categorical",
    "text",
    "identifier",
  ];
  const stats = (v: unknown) =>
    object(v) &&
    [
      "min",
      "max",
      "mean",
      "median",
      "sd",
      "p25",
      "p75",
      "p05",
      "p95",
      "iqr",
      "count",
    ].every((k) => finite(v[k]));
  return value.cases.every((c) => {
    if (
      !object(c) ||
      !text(c.id) ||
      !text(c.title) ||
      !finite(c.createdAt) ||
      !finite(c.duration) ||
      c.duration < 0 ||
      !choice(c.status, ["open", "solved"]) ||
      !choice(c.mode, ["mystery", "explore"]) ||
      !choice(c.difficulty, ["Easy", "Medium", "Hard", "Expert"]) ||
      !strings(c.discovered) ||
      !strings(c.bookmarks) ||
      !strings(c.hypothesisClues) ||
      !text(c.hypothesis) ||
      !object(c.notes) ||
      !Object.values(c.notes).every(text) ||
      !object(c.dataset)
    )
      return false;
    const d = c.dataset;
    if (
      !text(d.id) ||
      !text(d.name) ||
      !finite(d.bytes) ||
      !strings(d.columns) ||
      !d.columns.length ||
      d.columns.length > 150 ||
      new Set(d.columns).size !== d.columns.length ||
      !Array.isArray(d.rows) ||
      !d.rows.length ||
      d.rows.length > 200000 ||
      !object(d.analysis)
    )
      return false;
    const columns = d.columns,
      rows = d.rows;
    if (!rows.every((r) => object(r) && columns.every((k) => text(r[k]))))
      return false;
    const a = d.analysis;
    if (
      !Array.isArray(a.profiles) ||
      a.profiles.length !== columns.length ||
      !Array.isArray(a.clues) ||
      a.clues.length > 12 ||
      !finite(a.missing) ||
      !finite(a.duplicates) ||
      a.rowCount !== rows.length ||
      a.columnCount !== columns.length ||
      !strings(a.warnings)
    )
      return false;
    if (
      !a.profiles.every(
        (p) =>
          object(p) &&
          text(p.name) &&
          columns.includes(p.name) &&
          choice(p.type, columnTypes) &&
          finite(p.missing) &&
          finite(p.unique) &&
          Array.isArray(p.frequencies) &&
          p.frequencies.every(
            (f) => Array.isArray(f) && text(f[0]) && finite(f[1]),
          ) &&
          (p.stats === undefined || stats(p.stats)) &&
          (p.earliest === undefined || text(p.earliest)) &&
          (p.latest === undefined || text(p.latest)),
      )
    )
      return false;
    if (
      !a.clues.every((k) => {
        if (
          !object(k) ||
          !text(k.id) ||
          !text(k.type) ||
          !text(k.title) ||
          !text(k.description) ||
          !text(k.calculation) ||
          !finite(k.importance) ||
          !finite(k.confidence) ||
          !strings(k.columns) ||
          !k.columns.every((n) => columns.includes(n)) ||
          !Array.isArray(k.rowIds) ||
          !k.rowIds.every(
            (i) =>
              finite(i) && Number.isInteger(i) && i >= 0 && i < rows.length,
          ) ||
          !Array.isArray(k.evidence) ||
          !k.evidence.every((e) => object(e) && text(e.label) && text(e.value))
        )
          return false;
        if (
          k.follow !== undefined &&
          (!object(k.follow) || !text(k.follow.column) || !text(k.follow.value))
        )
          return false;
        if (k.chart !== undefined) {
          const v = k.chart;
          if (
            !object(v) ||
            !choice(v.type, ["bar", "line", "scatter"]) ||
            !text(v.xLabel) ||
            !text(v.yLabel) ||
            !Array.isArray(v.data) ||
            v.data.length > 10000 ||
            !v.data.every(
              (p) =>
                object(p) &&
                text(p.name) &&
                finite(p.value) &&
                (p.x === undefined || finite(p.x)),
            )
          )
            return false;
        }
        return true;
      })
    )
      return false;
    const ids = a.clues.map((k) => k.id);
    if (
      new Set(ids).size !== ids.length ||
      ![...c.discovered, ...c.bookmarks, ...c.hypothesisClues].every((id) =>
        ids.includes(id),
      )
    )
      return false;
    if (
      a.correlations !== undefined &&
      (!Array.isArray(a.correlations) ||
        !a.correlations.every(
          (p) =>
            object(p) &&
            text(p.a) &&
            text(p.b) &&
            finite(p.r) &&
            finite(p.count),
        ))
    )
      return false;
    return true;
  });
}
