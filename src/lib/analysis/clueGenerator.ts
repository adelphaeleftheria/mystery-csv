import type { Row, Profile, Clue, Analysis, ColumnType } from "../../types";
import { profile } from "./profiler";
import {
  numberValue,
  dateValue,
  correlation,
  fmt,
  statistics,
} from "./statistics";
export function analyze(
  rows: Row[],
  columns: string[],
  warnings: string[] = [],
  overrides: Record<string, ColumnType> = {},
): Analysis {
  const { profiles, missing, duplicates } = profile(rows, columns, overrides);
  const clues: Clue[] = [];
  const correlations: { a: string; b: string; r: number; count: number }[] = [];
  const add = (c: Omit<Clue, "id">) =>
    clues.push({ ...c, id: `${c.type}-${clues.length}` });
  const nums = profiles
      .filter((p) => p.stats && p.stats.count >= 3)
      .slice(0, 16),
    cats = profiles
      .filter(
        (p) =>
          ["categorical", "boolean"].includes(p.type) &&
          p.unique > 1 &&
          p.unique <= 50,
      )
      .slice(0, 8);
  const dates = profiles.filter((p) => p.earliest);
  for (const p of nums) {
    const s = p.stats!;
    if (s.count < 8 || !s.sd) continue;
    const low = s.p25 - 1.5 * s.iqr,
      high = s.p75 + 1.5 * s.iqr;
    const ids: number[] = [];
    rows.forEach((r, i) => {
      const n = numberValue(r[p.name]);
      if (
        n !== null &&
        (s.iqr ? n < low || n > high : Math.abs(n - s.median) > 3 * s.sd)
      )
        ids.push(i);
    });
    if (ids.length && ids.length / rows.length < 0.2) {
      const extreme = ids.reduce((a, b) =>
        Math.abs(numberValue(rows[a][p.name])! - s.median) >
        Math.abs(numberValue(rows[b][p.name])! - s.median)
          ? a
          : b,
      );
      const v = numberValue(rows[extreme][p.name])!;
      const bins = Array.from({ length: 16 }, (_, i) => ({
        name: fmt(s.min + ((s.max - s.min) * i) / 16),
        value: 0,
      }));
      rows.forEach((r) => {
        const n = numberValue(r[p.name]);
        if (n !== null)
          bins[Math.min(15, Math.floor(((n - s.min) / (s.max - s.min)) * 16))]
            .value++;
      });
      add({
        type: "outlier",
        title: `${p.name} breaks the pattern`,
        description: `${ids.length} records sit outside the typical range. The most unusual value is ${fmt(v)}, compared with a median of ${fmt(s.median)}.`,
        importance: 80 + Math.min(15, Math.abs(v - s.mean) / s.sd),
        confidence: s.count >= 30 ? 0.95 : 0.75,
        columns: [p.name],
        rowIds: ids,
        evidence: [
          { label: "Unusual records", value: fmt(ids.length) },
          { label: "Median", value: fmt(s.median) },
          { label: "Observed extreme", value: fmt(v) },
          { label: "Typical range", value: `${fmt(low)} – ${fmt(high)}` },
        ],
        calculation: `Tukey's fences: Q1 (${fmt(s.p25)}) − 1.5 × IQR (${fmt(s.iqr)}) to Q3 (${fmt(s.p75)}) + 1.5 × IQR. ${s.iqr ? "Values outside these fences are flagged." : "IQR is zero; values more than 3 population standard deviations from the median are flagged instead."} Mean: ${fmt(s.mean)}. Population standard deviation: ${fmt(s.sd)}. Outliers are unusual, not necessarily errors. Valid numeric observations: ${s.count}.`,
        chart: { type: "bar", xLabel: p.name, yLabel: "Records", data: bins },
      });
    }
  }
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++) {
      const a = nums[i].name,
        b = nums[j].name;
      const pairs: [number, number][] = [],
        ids: number[] = [];
      rows.forEach((r, k) => {
        const x = numberValue(r[a]),
          y = numberValue(r[b]);
        if (x !== null && y !== null) {
          pairs.push([x, y]);
          ids.push(k);
        }
      });
      const r = correlation(pairs);
      correlations.push({ a, b, r, count: pairs.length });
      if (pairs.length >= 12 && Math.abs(r) >= 0.7)
        add({
          type: "correlation",
          title: `${a} and ${b} move ${r > 0 ? "together" : "in opposite directions"}`,
          description: `A ${Math.abs(r) > 0.9 ? "very strong" : "strong"} ${r > 0 ? "positive" : "negative"} relationship appears across ${fmt(pairs.length)} records. A connection, not proof of a cause.`,
          importance: 65 + Math.abs(r) * 10,
          confidence: pairs.length >= 30 ? 0.9 : 0.7,
          columns: [a, b],
          rowIds: ids,
          evidence: [
            { label: "Pearson r", value: r.toFixed(3) },
            { label: "Paired records", value: fmt(pairs.length) },
          ],
          calculation: `Pearson's r = Σ((x − mean x)(y − mean y)) / √(Σ(x − mean x)² × Σ(y − mean y)²). Only complete numeric pairs are included. Values range from −1 to +1. Shared trends, mathematical relationships and confounding variables can explain correlation. No causation is established.`,
          chart: {
            type: "scatter",
            xLabel: a,
            yLabel: b,
            data: pairs
              .filter(
                (_, k) => k % Math.max(1, Math.ceil(pairs.length / 500)) === 0,
              )
              .map(([x, y]) => ({ name: fmt(x), x, value: y })),
          },
        });
    }
  for (const c of cats) {
    const top = c.frequencies[0];
    if (top && top[1] / (rows.length - c.missing) >= 0.65 && top[1] >= 8)
      add({
        type: "distribution",
        title: `${top[0]} dominates ${c.name}`,
        description: `${((100 * top[1]) / (rows.length - c.missing)).toFixed(1)}% of non-empty ${c.name} records belong to one group.`,
        importance: 62,
        confidence: 0.9,
        columns: [c.name],
        rowIds: rows.flatMap((r, i) => (r[c.name] === top[0] ? [i] : [])),
        evidence: [
          { label: "Largest group", value: top[0] },
          { label: "Records", value: fmt(top[1]) },
        ],
        calculation: `Group frequency divided by the ${rows.length - c.missing} non-empty values. A 65% concentration threshold is used for screening; concentration may be expected in this dataset.`,
        follow: { column: c.name, value: top[0] },
        chart: {
          type: "bar",
          xLabel: c.name,
          yLabel: "Records",
          data: c.frequencies
            .slice(0, 12)
            .map(([name, value]) => ({ name, value })),
        },
      });
    for (const p of nums.slice(0, 6)) {
      const groups = new Map<string, number[]>();
      rows.forEach((r) => {
        const n = numberValue(r[p.name]);
        if (n !== null && r[c.name].trim()) {
          const a = groups.get(r[c.name]) || [];
          a.push(n);
          groups.set(r[c.name], a);
        }
      });
      const entries = [...groups].filter(([, a]) => a.length >= 5);
      if (entries.length < 2) continue;
      const sorted = entries
        .map(([name, a]) => ({
          name,
          value: a.reduce((s, v) => s + v, 0) / a.length,
          count: a.length,
        }))
        .sort((a, b) => b.value - a.value);
      const t = sorted[0],
        rest = entries
          .filter(([name]) => name !== t.name)
          .flatMap(([, a]) => a);
      const other = statistics(rest);
      if (other.mean <= 0 || t.value < other.mean * 1.7) continue;
      add({
        type: "category",
        title: `${t.name} plays by different rules`,
        description: `Average ${p.name} for ${t.name} is ${fmt(t.value / other.mean)}× the average of the other ${c.name} groups.`,
        importance: 78,
        confidence: t.count >= 20 ? 0.9 : 0.7,
        columns: [c.name, p.name],
        rowIds: rows.flatMap((r, i) =>
          r[c.name] === t.name && numberValue(r[p.name]) !== null ? [i] : [],
        ),
        evidence: [
          { label: t.name + " average", value: fmt(t.value) },
          { label: "Other groups average", value: fmt(other.mean) },
          { label: "Group records", value: fmt(t.count) },
        ],
        calculation: `Arithmetic mean of ${p.name} in ${c.name} = ${t.name} (${t.count} valid records), divided by the pooled arithmetic mean of all other groups (${rest.length} valid records). Groups require at least 5 observations. This is a descriptive comparison, not a significance test.`,
        follow: { column: c.name, value: t.name },
        chart: {
          type: "bar",
          xLabel: c.name,
          yLabel: `Average ${p.name}`,
          data: sorted.slice(0, 12),
        },
      });
    }
  }
  for (const d of dates.slice(0, 1))
    for (const p of nums.slice(0, 6)) {
      const m = new Map<string, { sum: number; ids: number[] }>();
      rows.forEach((r, i) => {
        const date = dateValue(r[d.name]),
          n = numberValue(r[p.name]);
        if (date !== null && n !== null) {
          const key = new Date(date).toISOString().slice(0, 10),
            a = m.get(key) || { sum: 0, ids: [] };
          a.sum += n;
          a.ids.push(i);
          m.set(key, a);
        }
      });
      const daily = [...m].sort((a, b) => a[0].localeCompare(b[0]));
      if (daily.length < 7) continue;
      const s = statistics(daily.map(([, v]) => v.sum));
      if (s.median <= 0) continue;
      const peak = daily.reduce((a, b) => (b[1].sum > a[1].sum ? b : a));
      if (peak[1].sum > s.median * 1.8 && peak[1].sum > s.p75 + 1.5 * s.iqr)
        add({
          type: "change",
          title: `Something happened on ${peak[0]}`,
          description: `Daily ${p.name} reached ${fmt(peak[1].sum)}, ${fmt(peak[1].sum / s.median)}× the median daily total. Follow the records to see what contributed.`,
          importance: 97,
          confidence: daily.length >= 20 ? 0.95 : 0.75,
          columns: [d.name, p.name],
          rowIds: peak[1].ids,
          evidence: [
            { label: "Peak day", value: peak[0] },
            { label: "Daily total", value: fmt(peak[1].sum) },
            { label: "Median day", value: fmt(s.median) },
            { label: "Supporting records", value: fmt(peak[1].ids.length) },
          ],
          calculation: `Sum ${p.name} by UTC calendar day using ${d.name}. Compare the largest observed daily total against the median of ${daily.length} observed days. Flag only totals above 1.8× median and Q3 + 1.5× IQR. Missing days are excluded, not treated as zero. Differences in record counts can explain total changes.`,
          chart: {
            type: "line",
            xLabel: d.name,
            yLabel: `Total ${p.name}`,
            data: daily
              .filter(
                (_, i) =>
                  daily.length < 400 ||
                  i % Math.ceil(daily.length / 400) === 0 ||
                  daily[i][0] === peak[0],
              )
              .map(([name, v]) => ({ name, value: v.sum })),
          },
        });
      const middle = Math.floor(daily.length / 2),
        before = daily.slice(0, middle),
        after = daily.slice(middle);
      const avg = (a: typeof daily) =>
        a.reduce((s, v) => s + v[1].sum, 0) / a.length;
      const b = avg(before),
        a = avg(after);
      if (b > 0 && Math.abs(a / b - 1) > 0.6)
        add({
          type: "trend",
          title: `${p.name} shifts in the second half`,
          description: `The average daily total is ${fmt(Math.abs(a / b - 1) * 100)}% ${a > b ? "higher" : "lower"} in the later half of observed dates.`,
          importance: 76,
          confidence: daily.length >= 20 ? 0.85 : 0.65,
          columns: [d.name, p.name],
          rowIds: after.flatMap(([, v]) => v.ids),
          evidence: [
            { label: "Earlier daily mean", value: fmt(b) },
            { label: "Later daily mean", value: fmt(a) },
          ],
          calculation: `Chronologically split ${daily.length} observed UTC days at ${daily[middle][0]}. Compare mean daily totals: (later / earlier − 1) × 100. Missing calendar days excluded. This descriptive screen does not control for seasonality or record volume.`,
          chart: {
            type: "line",
            xLabel: d.name,
            yLabel: `Total ${p.name}`,
            data: daily
              .filter(
                (_, i) => i % Math.max(1, Math.ceil(daily.length / 400)) === 0,
              )
              .map(([name, v]) => ({ name, value: v.sum })),
          },
        });
    }
  if (duplicates) {
    const seen = new Set<string>(),
      ids: number[] = [];
    rows.forEach((r, i) => {
      const key = JSON.stringify(columns.map((c) => r[c]));
      if (seen.has(key)) ids.push(i);
      else seen.add(key);
    });
    add({
      type: "duplicate",
      title: "Some records have a double",
      description: `${fmt(duplicates)} records exactly repeat an earlier row. These may be legitimate repeats or a data quality issue.`,
      importance: 74,
      confidence: 1,
      columns: columns.slice(0, 5),
      rowIds: ids,
      evidence: [
        { label: "Repeated rows", value: fmt(duplicates) },
        {
          label: "Share of dataset",
          value: `${((100 * duplicates) / rows.length).toFixed(1)}%`,
        },
      ],
      calculation:
        "Compare all column values as exact strings. Each occurrence after the first identical row counts as a duplicate. No rows are removed.",
    });
  }
  const mp = profiles
    .filter((p) => p.missing)
    .sort((a, b) => b.missing - a.missing)[0];
  if (mp) {
    const ids = rows.flatMap((r, i) => (!r[mp.name].trim() ? [i] : []));
    add({
      type: "missing-data",
      title: `There are gaps in ${mp.name}`,
      description: `${fmt(mp.missing)} records (${((mp.missing / rows.length) * 100).toFixed(1)}%) have no ${mp.name} value. Missing information may change the picture.`,
      importance: 60 + Math.min(20, (mp.missing / rows.length) * 40),
      confidence: 1,
      columns: [mp.name],
      rowIds: ids,
      evidence: [
        { label: "Missing values", value: fmt(mp.missing) },
        { label: "Total records", value: fmt(rows.length) },
      ],
      calculation:
        "Count cells that are empty or contain only whitespace. Text such as N/A or null is retained as text; it is not silently removed.",
    });
    for (const c of cats.slice(0, 2)) {
      const groups = new Map<string, number>();
      ids.forEach((i) =>
        groups.set(rows[i][c.name], (groups.get(rows[i][c.name]) || 0) + 1),
      );
      const top = [...groups].sort((a, b) => b[1] - a[1])[0];
      if (top && top[0] && top[1] >= 5 && top[1] / ids.length > 0.65) {
        const base =
          rows.filter((r) => r[c.name] === top[0]).length / rows.length;
        if (top[1] / ids.length > base * 1.5)
          add({
            type: "missing-data",
            title: `Missing ${mp.name} clusters in ${top[0]}`,
            description: `${((top[1] / ids.length) * 100).toFixed(1)}% of missing ${mp.name} values belong to ${top[0]}, which represents ${(base * 100).toFixed(1)}% of all rows.`,
            importance: 88,
            confidence: 0.85,
            columns: [mp.name, c.name],
            rowIds: ids.filter((i) => rows[i][c.name] === top[0]),
            evidence: [
              { label: "Missing in group", value: fmt(top[1]) },
              { label: "All missing", value: fmt(ids.length) },
            ],
            calculation: `Compare the group's share of missing values with its share of all rows. Screen requires ≥5 missing records and a concentration at least 1.5× baseline. This is descriptive and does not explain why data is absent.`,
            follow: { column: c.name, value: top[0] },
          });
      }
    }
  }
  if (cats.length >= 2 && rows.length >= 30) {
    const [a, b] = cats;
    const counts = new Map<string, { ids: number[]; av: string; bv: string }>();
    rows.forEach((r, i) => {
      if (!r[a.name] || !r[b.name]) return;
      const key = JSON.stringify([r[a.name], r[b.name]]),
        g = counts.get(key) || { ids: [], av: r[a.name], bv: r[b.name] };
      g.ids.push(i);
      counts.set(key, g);
    });
    const rare = [...counts.values()]
      .filter((g) => g.ids.length <= 3 && g.ids.length / rows.length < 0.01)
      .sort((a, b) => a.ids.length - b.ids.length)[0];
    if (rare)
      add({
        type: "rare-pattern",
        title: "An uncommon pairing deserves a look",
        description: `${a.name}: ${rare.av} and ${b.name}: ${rare.bv} occur together in only ${rare.ids.length} records.`,
        importance: 61,
        confidence: 0.75,
        columns: [a.name, b.name],
        rowIds: rare.ids,
        evidence: [
          { label: "Combination frequency", value: fmt(rare.ids.length) },
          {
            label: "Dataset share",
            value: `${((rare.ids.length / rows.length) * 100).toFixed(2)}%`,
          },
        ],
        calculation:
          "Count exact pairs of two categorical columns. Flag a pair appearing ≤3 times and in <1% of rows. Rarity alone does not imply statistical surprise or a problem.",
        follow: { column: a.name, value: rare.av },
      });
  }
  // Ranking is a screening heuristic, not a statistical significance or causal probability.
  const ranked = clues.sort(
    (a, b) => b.importance * b.confidence - a.importance * a.confidence,
  );
  const selected: Clue[] = [];
  const typeCounts = new Map<string, number>();
  for (const c of ranked) {
    if ((typeCounts.get(c.type) || 0) >= 2) continue;
    selected.push(c);
    typeCounts.set(c.type, (typeCounts.get(c.type) || 0) + 1);
    if (selected.length === 12) break;
  }
  return {
    profiles,
    clues: selected,
    missing,
    duplicates,
    rowCount: rows.length,
    columnCount: columns.length,
    warnings,
    correlations,
  };
}
