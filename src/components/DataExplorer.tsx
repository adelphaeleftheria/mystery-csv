import { useMemo, useState, lazy, Suspense } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ArrowDownUp,
} from "lucide-react";
import { Dialog } from "./Dialog";
const ClueChart = lazy(() =>
  import("./ClueChart").then((m) => ({ default: m.ClueChart })),
);
import type { Dataset, Clue } from "../types";
import { download } from "../lib/storage";
import { toCSV } from "../lib/csv";
import { numberValue, dateValue } from "../lib/analysis/statistics";
type Filter = { column: string; operator: string; value: string };
export function DataExplorer({
  dataset,
  evidenceIds,
  onClearEvidence,
  notes,
  onNote,
}: {
  dataset: Dataset;
  evidenceIds: number[] | null;
  onClearEvidence: () => void;
  notes: Record<string, string>;
  onNote: (key: string, value: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [sort, setSort] = useState({ column: "", asc: true }),
    [page, setPage] = useState(0),
    [filters, setFilters] = useState<Filter[]>([]),
    [showColumns, setShowColumns] = useState(false),
    [hidden, setHidden] = useState<string[]>([]),
    [selected, setSelected] = useState<number[]>([]),
    [onlyUnusual, setOnlyUnusual] = useState(false);
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [showVisual, setShowVisual] = useState(false);
  const [groupColumn, setGroupColumn] = useState(
    dataset.analysis.profiles.find((p) =>
      ["categorical", "date", "datetime"].includes(p.type),
    )?.name || dataset.columns[0],
  );
  const [valueColumn, setValueColumn] = useState(
    dataset.analysis.profiles.find((p) => p.stats)?.name || "",
  );
  const unusual = useMemo(
    () =>
      new Set(
        dataset.analysis.clues
          .filter((c) => c.type === "outlier")
          .flatMap((c) => c.rowIds),
      ),
    [dataset],
  );
  const ids = useMemo(() => {
    const evidence = evidenceIds ? new Set(evidenceIds) : null;
    let a = dataset.rows
      .map((_, i) => i)
      .filter((i) => {
        const r = dataset.rows[i];
        return (
          (!evidence || evidence.has(i)) &&
          (!onlyUnusual || unusual.has(i)) &&
          (!search ||
            dataset.columns.some((c) =>
              r[c].toLowerCase().includes(search.toLowerCase()),
            )) &&
          filters.every((f) => {
            const v = r[f.column] || "";
            if (f.operator === "contains")
              return v.toLowerCase().includes(f.value.toLowerCase());
            if (f.operator === "is") return v === f.value;
            if (f.operator === "empty") return !v.trim();
            const n = numberValue(v) ?? dateValue(v),
              target = numberValue(f.value) ?? dateValue(f.value);
            return (
              n !== null &&
              target !== null &&
              (f.operator === ">" ? n > target : n < target)
            );
          })
        );
      });
    if (sort.column) {
      const numeric = dataset.analysis.profiles.find(
        (p) => p.name === sort.column,
      )?.stats;
      a = a.sort((a, b) => {
        const x = dataset.rows[a][sort.column],
          y = dataset.rows[b][sort.column];
        const n = numeric
          ? (numberValue(x) ?? -Infinity) - (numberValue(y) ?? -Infinity)
          : x.localeCompare(y, undefined, { numeric: true });
        return sort.asc ? n : -n;
      });
    }
    return a;
  }, [dataset, evidenceIds, search, sort, filters, onlyUnusual, unusual]);
  const overview = useMemo<Clue | null>(() => {
    if (!showVisual) return null;
    const groups = new Map<string, number>();
    for (const i of ids) {
      const row = dataset.rows[i],
        key = row[groupColumn] || "(empty)";
      const value = valueColumn ? numberValue(row[valueColumn]) : 1;
      if (value !== null) groups.set(key, (groups.get(key) || 0) + value);
    }
    const isDate = ["date", "datetime"].includes(
      dataset.analysis.profiles.find((p) => p.name === groupColumn)?.type || "",
    );
    const data = [...groups]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) =>
        isDate ? a.name.localeCompare(b.name) : b.value - a.value,
      )
      .slice(0, isDate ? 365 : 20);
    return {
      id: "filtered-overview",
      type: "overview",
      title: "Filtered records",
      description: `${ids.length} matching rows, grouped by ${groupColumn}. ${valueColumn ? `Values are sums of ${valueColumn}.` : "Values are record counts."} Showing ${isDate ? "up to 365 dates" : "the top 20 groups"}.`,
      importance: 0,
      confidence: 1,
      columns: [groupColumn, valueColumn].filter(Boolean),
      rowIds: ids,
      evidence: [],
      calculation:
        "Group and sum the currently filtered records. No anomaly claim is made.",
      chart: {
        type: isDate ? "line" : "bar",
        xLabel: groupColumn,
        yLabel: valueColumn ? `Total ${valueColumn}` : "Records",
        data,
      },
    };
  }, [showVisual, ids, dataset, groupColumn, valueColumn]);
  const pages = Math.max(1, Math.ceil(ids.length / 50)),
    current = Math.min(page, pages - 1),
    visible = dataset.columns.filter((c) => !hidden.includes(c));
  const reset = () => setPage(0);
  return (
    <div className="explorer">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE SOURCE OF TRUTH</span>
          <h1>
            The dataset<span className="heading-dot">.</span>
          </h1>
          <p>
            {dataset.name} · {dataset.rows.length.toLocaleString()} rows ·{" "}
            {dataset.columns.length} columns
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            download(
              toCSV(
                ids.map((i) => dataset.rows[i]),
                dataset.columns,
              ),
              "filtered-data.csv",
              "text/csv",
            )
          }
        >
          <Download size={16} /> Export filtered CSV
        </button>
      </div>
      {evidenceIds && (
        <div className="notice">
          Following the evidence · {evidenceIds.length} supporting records
          <button onClick={onClearEvidence}>
            Show all rows <X size={14} />
          </button>
        </div>
      )}
      <div className="table-tools">
        <label className="search">
          <Search size={16} />
          <input
            id="dataset-search"
            placeholder="Search any value…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              reset();
            }}
          />
        </label>
        <button
          className="button secondary"
          onClick={() => {
            setFilters([
              ...filters,
              { column: dataset.columns[0], operator: "contains", value: "" },
            ]);
            reset();
          }}
        >
          <Plus size={15} /> Add filter
        </button>
        <button
          className="button secondary"
          onClick={() => setShowColumns(!showColumns)}
        >
          <SlidersHorizontal size={15} /> Columns
        </button>
        <label className="check">
          <input
            type="checkbox"
            checked={onlyUnusual}
            onChange={(e) => {
              setOnlyUnusual(e.target.checked);
              reset();
            }}
          />{" "}
          Unusual only
        </label>
      </div>
      {showColumns && (
        <div className="column-menu">
          {dataset.columns.map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={!hidden.includes(c)}
                onChange={() =>
                  setHidden(
                    hidden.includes(c)
                      ? hidden.filter((h) => h !== c)
                      : [...hidden, c],
                  )
                }
              />
              {c}
            </label>
          ))}
        </div>
      )}
      {filters.map((f, i) => (
        <div className="filter-row" key={i}>
          <span>{i ? "AND" : "WHERE"}</span>
          <select
            aria-label="Filter column"
            value={f.column}
            onChange={(e) => {
              setFilters(
                filters.map((f, j) =>
                  j === i ? { ...f, column: e.target.value } : f,
                ),
              );
              reset();
            }}
          >
            {dataset.columns.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Filter operator"
            value={f.operator}
            onChange={(e) => {
              setFilters(
                filters.map((f, j) =>
                  j === i ? { ...f, operator: e.target.value } : f,
                ),
              );
              reset();
            }}
          >
            <option value="contains">contains</option>
            <option value="is">equals</option>
            <option value=">">greater / after</option>
            <option value="<">less / before</option>
            <option value="empty">is empty</option>
          </select>
          {f.operator !== "empty" && (
            <input
              aria-label="Filter value"
              placeholder="Value or YYYY-MM-DD"
              value={f.value}
              onChange={(e) => {
                setFilters(
                  filters.map((f, j) =>
                    j === i ? { ...f, value: e.target.value } : f,
                  ),
                );
                reset();
              }}
            />
          )}
          <button
            className="icon-button"
            aria-label="Remove filter"
            onClick={() => {
              setFilters(filters.filter((_, j) => j !== i));
              reset();
            }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
      <button
        className="button secondary visualize-toggle"
        aria-expanded={showVisual}
        onClick={() => setShowVisual(!showVisual)}
      >
        {showVisual ? "Hide visualization" : "Visualize filtered records"}
      </button>
      {overview && (
        <section className="panel filtered-chart">
          <div className="filtered-chart-controls">
            <label>
              Group by{" "}
              <select
                value={groupColumn}
                onChange={(e) => setGroupColumn(e.target.value)}
              >
                {dataset.columns.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Measure{" "}
              <select
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
              >
                <option value="">Record count</option>
                {dataset.analysis.profiles
                  .filter((p) => p.stats)
                  .map((p) => (
                    <option key={p.name} value={p.name}>
                      Sum of {p.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <p>{overview.description}</p>
          <Suspense
            fallback={
              <div className="chart-loading">Preparing the visualization…</div>
            }
          >
            <ClueChart clue={overview} />
          </Suspense>
        </section>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ROW</th>
              {visible.map((c) => (
                <th key={c}>
                  <button
                    onClick={() =>
                      setSort({
                        column: c,
                        asc: sort.column === c ? !sort.asc : true,
                      })
                    }
                  >
                    {c}
                    <ArrowDownUp size={12} />
                    {sort.column === c ? (sort.asc ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.slice(current * 50, current * 50 + 50).map((i) => (
              <tr
                key={i}
                className={`${unusual.has(i) ? "anomaly-row" : ""} ${selected.includes(i) ? "selected-row" : ""}`}
              >
                <td>
                  <div className="row-control">
                    <input
                      aria-label={`Select row ${i + 1}`}
                      type="checkbox"
                      checked={selected.includes(i)}
                      onChange={() =>
                        setSelected(
                          selected.includes(i)
                            ? selected.filter((s) => s !== i)
                            : [...selected, i],
                        )
                      }
                    />
                    <button
                      className="row-number"
                      aria-label={`Inspect row ${i + 1}`}
                      onClick={() => setInspecting(i)}
                    >
                      #{i + 1}
                      {unusual.has(i) ? " ◈" : ""}
                    </button>
                  </div>
                </td>
                {visible.map((c) => (
                  <td key={c}>
                    {dataset.rows[i][c] || <span className="muted">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!ids.length && (
          <div className="empty">
            <Search />
            <h3>No matching records</h3>
            <p>Try another value or remove a filter.</p>
          </div>
        )}
      </div>
      <div className="pagination">
        <span>
          {ids.length.toLocaleString()} matching rows · {selected.length}{" "}
          selected · 50 per page
        </span>
        <div>
          <button
            aria-label="Previous page"
            className="icon-button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            aria-label="Next page"
            className="icon-button"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {inspecting !== null && (
        <Dialog
          title={`Record #${inspecting + 1}`}
          onClose={() => setInspecting(null)}
        >
          <span className="eyebrow">THE ORIGINAL EVIDENCE</span>
          <div className="row-details">
            {dataset.columns.map((c) => (
              <div key={c}>
                <b>{c}</b>
                <span>{dataset.rows[inspecting][c] || "—"}</span>
              </div>
            ))}
          </div>
          <label className="note-label">
            Record note
            <textarea
              placeholder="What stands out about this record?"
              value={notes[`row-${inspecting}`] || ""}
              onChange={(e) => onNote(`row-${inspecting}`, e.target.value)}
            />
          </label>
          <p className="table-note">
            Saved with this case. The original CSV values are preserved.
          </p>
        </Dialog>
      )}
    </div>
  );
}
