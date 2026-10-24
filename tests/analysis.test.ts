import { describe, it, expect } from "vitest";
import { parseCSV, toCSV } from "../src/lib/csv";
import { detectType } from "../src/lib/analysis/typeDetection";
import {
  statistics,
  quantile,
  correlation,
  numberValue,
  dateValue,
} from "../src/lib/analysis/statistics";
import { analyze } from "../src/lib/analysis/clueGenerator";
import { sampleCSV } from "../src/lib/samples";
import {
  discover,
  completeCase,
  evaluateHypothesis,
  scoreCase,
} from "../src/lib/investigation";
import { defaults } from "../src/types";
import type { Case, Row } from "../src/types";
import { validateBackup } from "../src/lib/storage";
describe("CSV parsing", () => {
  it("handles quoted commas, escaped quotes, unicode, BOM and empty fields", () => {
    const p = parseCSV(
      '\uFEFFname,note,amount\n"Zoë, 李","said ""hello""",\nAna,ok,42',
    );
    expect(p.rows[0]).toEqual({
      name: "Zoë, 李",
      note: 'said "hello"',
      amount: "",
    });
    expect(p.rows).toHaveLength(2);
  });
  it("detects semicolon and tab delimiters", () => {
    expect(parseCSV("name;amount\nAna;42").columns).toEqual(["name", "amount"]);
    expect(parseCSV("name\tamount\nAna\t42").rows[0].amount).toBe("42");
  });
  it("repairs empty and duplicate headers without losing columns", () => {
    const p = parseCSV(",name,name\na,b,c");
    expect(p.columns).toEqual(["Column 1", "name", "name (2)"]);
    expect(p.rows[0]["name (2)"]).toBe("c");
    expect(p.warnings).toHaveLength(2);
  });
  it("rejects empty, header-only, and broken quotes", () => {
    expect(() => parseCSV("")).toThrow();
    expect(() => parseCSV("x,y")).toThrow();
    expect(() => parseCSV('x,y\n"abc,3')).toThrow();
  });
  it("warns about inconsistent rows", () => {
    expect(parseCSV("x,y\na,b,c\nd").warnings.join()).toContain("2 rows");
  });
  it("roundtrips values and neutralizes spreadsheet formulas on export", () => {
    const rows = [{ a: '=HYPERLINK("evil")', b: "-12.4", c: "hello, world" }];
    const p = parseCSV(toCSV(rows, ["a", "b", "c"]));
    expect(p.rows[0].a).toBe('\'=HYPERLINK("evil")');
    expect(p.rows[0].b).toBe("-12.4");
    expect(p.rows[0].c).toBe("hello, world");
  });
  it("treats dangerous property names as ordinary fields", () => {
    const p = parseCSV("__proto__,constructor\nx,y");
    expect(p.rows[0]["__proto__"]).toBe("x");
    expect(p.rows[0].constructor).toBe("y");
  });
});
describe("type inference", () => {
  it.each([
    [["1", "2", "3"], "x", "number"],
    [["$1,000", "$24"], "total", "currency"],
    [["10%", "12%"], "ratio", "percentage"],
    [["2025-03-17", "2025-03-18"], "day", "date"],
    [["2025-03-17T10:00:00Z"], "timestamp", "datetime"],
    [["yes", "no"], "flag", "boolean"],
    [["a", "b", "a"], "group", "categorical"],
    [["00123", "00456"], "code", "identifier"],
    [["123", "456"], "customer_id", "identifier"],
    [["12", "34"], "price", "number"],
  ])("detects %j as %s", (values, name, expected) => {
    expect(detectType(values as string[], name as string)).toBe(expected);
  });
  it("rejects invalid dates and parses currencies and negatives", () => {
    expect(dateValue("2025-02-30")).toBeNull();
    expect(numberValue("($1,200)")).toBe(-1200);
    expect(numberValue("abc")).toBeNull();
    expect(numberValue("12%")).toBe(12);
  });
});
describe("statistics", () => {
  it("computes mean, median, population sd, percentiles and IQR", () => {
    const s = statistics([1, 2, 3, 4, 5]);
    expect(s.mean).toBe(3);
    expect(s.median).toBe(3);
    expect(s.sd).toBeCloseTo(Math.sqrt(2));
    expect(s.p25).toBe(2);
    expect(s.p75).toBe(4);
    expect(s.iqr).toBe(2);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.p95).toBeCloseTo(4.8);
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
  });
  it("handles empty and constant series", () => {
    expect(statistics([]).mean).toBe(0);
    expect(statistics([2, 2, 2]).sd).toBe(0);
    expect(
      correlation([
        [1, 2],
        [1, 3],
        [1, 4],
      ]),
    ).toBe(0);
  });
  it("computes positive and negative Pearson correlation", () => {
    expect(
      correlation([
        [1, 2],
        [2, 4],
        [3, 6],
      ]),
    ).toBeCloseTo(1);
    expect(
      correlation([
        [1, 6],
        [2, 4],
        [3, 2],
      ]),
    ).toBeCloseTo(-1);
  });
});
describe("clue generation", () => {
  it("finds the planted March 17 spike and uses actual supporting rows", () => {
    const p = parseCSV(sampleCSV("mystery"));
    const a = analyze(p.rows, p.columns);
    const spike = a.clues.find(
      (c) => c.type === "change" && c.columns.includes("revenue"),
    );
    expect(spike).toBeDefined();
    expect(spike!.rowIds.every((i) => p.rows[i].date === "2025-03-17")).toBe(
      true,
    );
    expect(spike!.evidence.find((e) => e.label === "Daily total")?.value).toBe(
      new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(
        spike!.rowIds.reduce((s, i) => s + Number(p.rows[i].revenue), 0),
      ),
    );
    expect(a.clues.some((c) => c.type === "outlier")).toBe(true);
    expect(a.clues.some((c) => c.type === "category")).toBe(true);
    expect(a.clues.length).toBeLessThanOrEqual(12);
    expect(
      a.clues.every((c) => c.calculation.length > 30 && c.rowIds.length > 0),
    ).toBe(true);
  });
  it("finds trends, duplicates and missing cells", () => {
    const rows: Row[] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      value: String(i < 15 ? 10 : 40),
      category: i % 2 ? "A" : "B",
    }));
    rows.push({ ...rows[0] });
    rows[4].category = "";
    const a = analyze(rows, ["date", "value", "category"]);
    expect(a.clues.some((c) => c.type === "trend")).toBe(true);
    expect(a.clues.some((c) => c.type === "duplicate")).toBe(true);
    expect(a.clues.some((c) => c.type === "missing-data")).toBe(true);
    expect(a.duplicates).toBe(1);
    expect(a.missing).toBe(1);
  });
  it("finds concentrated missingness", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      group: i < 20 ? "West" : "East",
      value: i < 15 ? "" : String(i),
    }));
    const a = analyze(rows, ["group", "value"]);
    expect(a.clues.some((c) => c.title.includes("clusters in West"))).toBe(
      true,
    );
  });
  it("does not invent anomalies for smooth, non-repeated numeric data", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({ value: String(i) }));
    expect(analyze(rows, ["value"]).clues).toHaveLength(0);
  });
  it("honors corrected types", () => {
    const p = parseCSV("value\n$1\n$2\n$3\n$4\n$5\n$6\n$7\n$1000");
    expect(
      analyze(p.rows, p.columns, [], { value: "identifier" }).profiles[0].stats,
    ).toBeUndefined();
  });
  it("is deterministic", () => {
    expect(sampleCSV("mystery", 42)).toBe(sampleCSV("mystery", 42));
    expect(sampleCSV("mystery", 42)).not.toBe(sampleCSV("mystery", 43));
  });
});
const parsed = parseCSV(sampleCSV("expenses")),
  analysis = analyze(parsed.rows, parsed.columns);
const c: Case = {
  id: "test",
  dataset: {
    id: "ds",
    name: "test.csv",
    bytes: 200,
    rows: parsed.rows,
    columns: parsed.columns,
    analysis,
  },
  title: "Test case",
  createdAt: 1,
  discovered: [],
  bookmarks: [],
  notes: {},
  hypothesis: "An unusual expense",
  hypothesisClues: [],
  status: "open",
  duration: 0,
  difficulty: "Medium",
  mode: "mystery",
};
describe("investigation state", () => {
  it("discovers each clue once and only counts discovered attached evidence", () => {
    const id = analysis.clues[0].id;
    const found = discover(discover(c, id), id);
    expect(found.discovered).toEqual([id]);
    const draft = { ...found, hypothesisClues: [id, "fake"] };
    expect(evaluateHypothesis(draft).evidence).toEqual([id]);
    expect(scoreCase(draft)).toBe(250);
    expect(completeCase(draft).status).toBe("solved");
  });
  it("validates backups and rejects malformed or unsafe row references", () => {
    expect(validateBackup({ version: 1, cases: [c], settings: defaults })).toBe(
      true,
    );
    expect(validateBackup({ version: 2, cases: [c], settings: defaults })).toBe(
      false,
    );
    expect(
      validateBackup({
        version: 1,
        cases: [{ ...c, dataset: { ...c.dataset, rows: [null] } }],
        settings: defaults,
      }),
    ).toBe(false);
    expect(
      validateBackup({
        version: 1,
        cases: [
          {
            ...c,
            dataset: {
              ...c.dataset,
              analysis: {
                ...analysis,
                clues: [{ ...analysis.clues[0], rowIds: [999999] }],
              },
            },
          },
        ],
        settings: defaults,
      }),
    ).toBe(false);
  });
});
