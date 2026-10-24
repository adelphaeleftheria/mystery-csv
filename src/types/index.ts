export type ColumnType =
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "boolean"
  | "categorical"
  | "text"
  | "identifier";
export type Row = Record<string, string>;
export type NumericStats = {
  min: number;
  max: number;
  mean: number;
  median: number;
  sd: number;
  p25: number;
  p75: number;
  p05: number;
  p95: number;
  iqr: number;
  count: number;
};
export type Profile = {
  name: string;
  type: ColumnType;
  missing: number;
  unique: number;
  frequencies: [string, number][];
  stats?: NumericStats;
  earliest?: string;
  latest?: string;
  gaps?: number;
};
export type Clue = {
  id: string;
  type: string;
  title: string;
  description: string;
  importance: number;
  confidence: number;
  columns: string[];
  rowIds: number[];
  evidence: { label: string; value: string }[];
  calculation: string;
  chart?: {
    type: "bar" | "line" | "scatter";
    xLabel: string;
    yLabel: string;
    data: { name: string; x?: number; value: number }[];
  };
  follow?: { column: string; value: string };
};
export type Analysis = {
  profiles: Profile[];
  clues: Clue[];
  missing: number;
  duplicates: number;
  rowCount: number;
  columnCount: number;
  warnings: string[];
  correlations?: { a: string; b: string; r: number; count: number }[];
};
export type Dataset = {
  id: string;
  name: string;
  rows: Row[];
  columns: string[];
  bytes: number;
  analysis: Analysis;
};
export type Case = {
  id: string;
  dataset: Dataset;
  createdAt: number;
  title: string;
  discovered: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  hypothesis: string;
  hypothesisClues: string[];
  status: "open" | "solved";
  duration: number;
  difficulty: string;
  mode: "mystery" | "explore";
};
export type Settings = {
  theme: "light" | "dark" | "system";
  difficulty: string;
  mode: "mystery" | "explore";
  compact: boolean;
  reducedMotion: boolean;
  autoAdvance: boolean;
  showCalculations: boolean;
  clueCount: number;
};
export const defaults: Settings = {
  theme: "light",
  difficulty: "Medium",
  mode: "mystery",
  compact: false,
  reducedMotion: false,
  autoAdvance: false,
  showCalculations: false,
  clueCount: 8,
};
