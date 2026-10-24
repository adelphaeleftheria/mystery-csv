import { it, expect } from "vitest";
import { analyze } from "../src/lib/analysis/clueGenerator";
import { parseCSV } from "../src/lib/csv";
for (const count of [1000, 10000, 50000, 100000])
  it(`parses and analyzes ${count.toLocaleString()} rows`, () => {
    const start = performance.now();
    const csv =
      "date,group,value,related\n" +
      Array.from(
        { length: count },
        (_, i) =>
          `2025-03-${String((i % 28) + 1).padStart(2, "0")},${["North", "South", "East", "West"][i % 4]},${i === 123 ? 100000 : 10 + (i % 40)},${20 + (i % 40) * 2}`,
      ).join("\n");
    const p = parseCSV(csv),
      a = analyze(p.rows, p.columns);
    expect(a.rowCount).toBe(count);
    expect(a.clues.length).toBeGreaterThan(0);
    expect(a.clues.every((c) => c.rowIds.every((id) => id < count))).toBe(true);
    console.info(`${count} rows: ${Math.round(performance.now() - start)}ms`);
  }, 30000);
