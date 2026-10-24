import type { Row, Profile, ColumnType } from "../../types";
import { detectType } from "./typeDetection";
import { statistics, numberValue, dateValue } from "./statistics";
export function profile(
  rows: Row[],
  columns: string[],
  overrides: Record<string, ColumnType> = {},
) {
  let missing = 0;
  const signatures = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const s = JSON.stringify(columns.map((c) => row[c]));
    if (signatures.has(s)) duplicates++;
    else signatures.add(s);
  }
  const profiles: Profile[] = columns.map((name) => {
    const values = rows.map((r) => r[name]),
      valid = values.filter((v) => v.trim());
    const count = values.length - valid.length;
    missing += count;
    const frequencies = new Map<string, number>();
    valid.forEach((v) => frequencies.set(v, (frequencies.get(v) || 0) + 1));
    const type = overrides[name] || detectType(valid, name);
    const p: Profile = {
      name,
      type,
      missing: count,
      unique: frequencies.size,
      frequencies: [...frequencies].sort((a, b) => b[1] - a[1]).slice(0, 50),
    };
    if (["number", "currency", "percentage"].includes(type))
      p.stats = statistics(
        valid.map(numberValue).filter((v): v is number => v !== null),
      );
    if (type === "date" || type === "datetime") {
      const dates = valid
        .map(dateValue)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b);
      if (dates.length) {
        p.earliest = new Date(dates[0]).toISOString();
        p.latest = new Date(dates[dates.length - 1]).toISOString();
        const days = [...new Set(dates.map((d) => Math.floor(d / 86400000)))];
        p.gaps = days
          .slice(1)
          .reduce((s, d, i) => s + Math.max(0, d - days[i] - 1), 0);
      }
    }
    return p;
  });
  return { profiles, missing, duplicates };
}
