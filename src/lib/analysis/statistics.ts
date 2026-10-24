import type { NumericStats } from "../../types";
export const quantile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p,
    lo = Math.floor(i);
  return sorted[lo] + (sorted[Math.ceil(i)] - sorted[lo]) * (i - lo);
};
export function statistics(values: number[]): NumericStats {
  const a = [...values].sort((a, b) => a - b),
    count = a.length;
  const mean = count ? a.reduce((s, v) => s + v, 0) / count : 0;
  const sd = count
    ? Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / count)
    : 0;
  const p25 = quantile(a, 0.25),
    p75 = quantile(a, 0.75);
  return {
    count,
    min: a[0] ?? 0,
    max: a[count - 1] ?? 0,
    mean,
    median: quantile(a, 0.5),
    sd,
    p25,
    p75,
    iqr: p75 - p25,
    p05: quantile(a, 0.05),
    p95: quantile(a, 0.95),
  };
}
export function correlation(pairs: [number, number][]) {
  if (pairs.length < 3) return 0;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length,
    my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  let xy = 0,
    xx = 0,
    yy = 0;
  for (const [x, y] of pairs) {
    xy += (x - mx) * (y - my);
    xx += (x - mx) ** 2;
    yy += (y - my) ** 2;
  }
  return xx && yy ? xy / Math.sqrt(xx * yy) : 0;
}
export function numberValue(raw: string): number | null {
  let s = raw?.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s
    .replace(/^[$€£¥]\s*/, "")
    .replace(/%$/, "")
    .replace(/,/g, "");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s) * (negative ? -1 : 1);
  return Number.isFinite(n) ? n : null;
}
export function dateValue(s: string): number | null {
  if (
    !/^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[T\s].*)?$/.test(s) &&
    !/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(s)
  )
    return null;
  const n = Date.parse(s);
  if (!Number.isFinite(n)) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso && new Date(n).toISOString().slice(0, 10) !== s) return null;
  return n;
}
export const fmt = (n: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n);
