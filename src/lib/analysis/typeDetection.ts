import type { ColumnType } from "../../types";
import { numberValue, dateValue } from "./statistics";
export function detectType(values: string[], name = ""): ColumnType {
  const a = values.filter((v) => v.trim());
  if (!a.length) return "text";
  const ratio = (fn: (s: string) => boolean) => a.filter(fn).length / a.length;
  if (ratio((s) => /^(true|false|yes|no)$/i.test(s)) === 1) return "boolean";
  if (ratio((s) => dateValue(s) !== null) > 0.95)
    return a.some((s) => /[T:]\d/.test(s)) ? "datetime" : "date";
  if (
    /(^id$|_id$|^id_|identifier|^zip$|^postcode$)/i.test(name) &&
    new Set(a).size / a.length > 0.8
  )
    return "identifier";
  if (ratio((s) => numberValue(s) !== null) > 0.95) {
    if (a.some((s) => /^0\d{2,}$/.test(s))) return "identifier";
    if (ratio((s) => /^[$€£¥]|^\([$€£¥]/.test(s)) > 0.8) return "currency";
    if (ratio((s) => /%$/.test(s)) > 0.8) return "percentage";
    return "number";
  }
  const unique = new Set(a).size;
  return unique <= Math.max(20, Math.min(100, a.length * 0.1))
    ? "categorical"
    : "text";
}
