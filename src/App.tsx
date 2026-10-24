import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Upload,
  Plus,
  House,
  Files,
  Compass,
  Table2,
  Bookmark,
  ChartNoAxesCombined,
  Settings2,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Search,
  Command,
  Check,
  CheckCheck,
  X,
  FolderOpen,
  MoreHorizontal,
  FileSpreadsheet,
  Download,
  Trash2,
  Copy,
  Pencil,
  Sun,
  Moon,
  Monitor,
  Clock,
  Database,
  Zap,
  Sparkles,
  Link2,
  CheckCircle2,
  Activity,
  LockKeyhole,
  ArrowLeft,
  Eye,
  Lightbulb,
  Play,
  CalendarDays,
  Target,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Case, Dataset, Settings, Clue, ColumnType } from "./types";
import { defaults } from "./types";
import { samples, sampleCSV } from "./lib/samples";
import { storage, download, validateBackup } from "./lib/storage";
import { toCSV } from "./lib/csv";
import { fmt } from "./lib/analysis/statistics";
import {
  discover,
  evaluateHypothesis,
  scoreCase,
  completeCase,
} from "./lib/investigation";
const LazyClueChart = lazy(() =>
  import("./components/ClueChart").then((m) => ({ default: m.ClueChart })),
);
function ClueChart(props: React.ComponentProps<typeof LazyClueChart>) {
  return (
    <Suspense
      fallback={
        <div className="chart-loading" role="status">
          Preparing the visualization…
        </div>
      }
    >
      <LazyClueChart {...props} />
    </Suspense>
  );
}
import { DataExplorer } from "./components/DataExplorer";
import { Dialog } from "./components/Dialog";
type Page =
  "Home" | "Cases" | "Explore" | "Data" | "Saved" | "Statistics" | "Settings";
const navigation: { name: Page; icon: LucideIcon }[] = [
  { name: "Home", icon: House },
  { name: "Cases", icon: Files },
  { name: "Explore", icon: Compass },
  { name: "Data", icon: Table2 },
  { name: "Saved", icon: Bookmark },
  { name: "Statistics", icon: ChartNoAxesCombined },
];
const icons: Record<string, LucideIcon> = {
  outlier: Target,
  change: Activity,
  trend: ChartNoAxesCombined,
  correlation: Link2,
  category: Files,
  distribution: ChartNoAxesCombined,
  duplicate: Copy,
  "missing-data": Search,
  "rare-pattern": Sparkles,
};
const typeOptions: ColumnType[] = [
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
const caseNumber = (c: Case) =>
  c.id.replace(/\D/g, "").slice(-5).padStart(5, "0");
const dateLabel = (n: number) =>
  new Date(n).toLocaleDateString("en", { month: "short", day: "numeric" });
function Logo() {
  return (
    <div className="logo-symbol">
      <svg width="25" height="25" viewBox="0 0 32 32" fill="none">
        <path
          d="M5 23V9l11 10L27 9v14M16 19v9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="5" cy="7" r="2" fill="currentColor" />
        <circle cx="27" cy="7" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}
function HeroBoard() {
  return (
    <div className="hero-board" aria-label="Illustrative investigation board">
      <div className="board-grid" />
      <div className="board-top">
        <span className="live-dot" /> A LITTLE CURIOSITY GOES A LONG WAY{" "}
        <span>↗</span>
      </div>
      <svg className="board-lines" viewBox="0 0 560 330">
        <path
          d="M130 90 C250 80 230 210 360 190 M170 270 C260 310 330 120 460 130"
          fill="none"
          stroke="#8c9a82"
          strokeDasharray="4 6"
        />
        <circle cx="130" cy="90" r="5" fill="#a4bd73" />
        <circle cx="460" cy="130" r="5" fill="#a4bd73" />
      </svg>
      <div className="float-card mini-file">
        <div className="file-icon">
          <FileSpreadsheet size={23} />
        </div>
        <div>
          <b>the_usual_data.csv</b>
          <span>720 rows. A few secrets.</span>
        </div>
        <CheckCircle2 size={17} />
      </div>
      <div className="float-card mini-chart">
        <div className="mini-chart-head">
          <span>DAILY ACTIVITY</span>
          <MoreHorizontal size={16} />
        </div>
        <div className="chart-number">
          One day stands out.<span>Interesting, isn’t it?</span>
        </div>
        <svg
          viewBox="0 0 290 100"
          role="img"
          aria-label="Illustrative spike in activity"
        >
          <defs>
            <linearGradient id="mini" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#a4bc73" stopOpacity=".4" />
              <stop offset="1" stopColor="#a4bc73" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 80L17 72 32 77 48 69 66 74 82 63 99 72 116 67 133 74 149 66 165 20 181 66 198 60 214 68 231 59 248 69 266 58 290 64V100H0Z"
            fill="url(#mini)"
          />
          <path
            d="M0 80L17 72 32 77 48 69 66 74 82 63 99 72 116 67 133 74 149 66 165 20 181 66 198 60 214 68 231 59 248 69 266 58 290 64"
            fill="none"
            stroke="#789254"
            strokeWidth="2"
          />
          <path d="M165 14V99" stroke="#789254" strokeDasharray="3 4" />
          <circle
            cx="165"
            cy="20"
            r="5"
            fill="#d3e891"
            stroke="#68834d"
            strokeWidth="2"
          />
        </svg>
        <div className="mini-chart-axis">
          <span>MAR 01</span>
          <span>MAR 17</span>
          <span>MAR 30</span>
        </div>
      </div>
      <div className="float-card mini-clue">
        <div className="clue-symbol">
          <Sparkles size={17} />
        </div>
        <div>
          <span className="tiny-label">A CLUE, NOT A COINCIDENCE?</span>
          <b>Something breaks the pattern.</b>
          <p>There’s a story in these numbers.</p>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <span className="board-caption">
        REAL DATA. REAL EVIDENCE. YOUR DISCOVERY.
      </span>
      <span className="illustration-label">ILLUSTRATIVE PREVIEW</span>
    </div>
  );
}
export default function App() {
  const [page, setPage] = useState<Page>("Home"),
    [cases, setCases] = useState<Case[]>([]),
    [activeId, setActiveId] = useState<string | null>(null),
    [settings, setSettings] = useState<Settings>(defaults),
    [ready, setReady] = useState(false),
    [upload, setUpload] = useState(false),
    [pending, setPending] = useState<Dataset | null>(null),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [clueIndex, setClueIndex] = useState(0),
    [evidence, setEvidence] = useState<Clue | null>(null),
    [evidenceIds, setEvidenceIds] = useState<number[] | null>(null),
    [modal, setModal] = useState<
      "hypothesis" | "summary" | "health" | "correlations" | null
    >(null),
    [confirm, setConfirm] = useState<{
      title: string;
      description: string;
      action: () => void;
    } | null>(null),
    [rename, setRename] = useState<Case | null>(null),
    [renameText, setRenameText] = useState(""),
    [restoreData, setRestoreData] = useState<{
      version: 1;
      cases: Case[];
      settings: Settings;
    } | null>(null),
    [dragging, setDragging] = useState(false),
    [caseSearch, setCaseSearch] = useState(""),
    [ask, setAsk] = useState(""),
    [answer, setAnswer] = useState("");
  const fileInput = useRef<HTMLInputElement>(null),
    restoreInput = useRef<HTMLInputElement>(null),
    workerRef = useRef<Worker | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = cases.find((c) => c.id === activeId) || null;
  const clues = active?.dataset.analysis.clues || [];
  const selected = clues[Math.min(clueIndex, clues.length - 1)];
  const notify = (s: string) => {
    setToast(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4000);
  };
  useEffect(() => {
    Promise.all([storage.cases(), storage.settings()])
      .then(([c, s]) => {
        setCases(c);
        if (s) setSettings({ ...defaults, ...s });
        setActiveId(c[0]?.id || null);
      })
      .catch(() =>
        setError(
          "Browser storage is unavailable. Enable site storage to save your investigations.",
        ),
      )
      .finally(() => setReady(true));
    return () => workerRef.current?.terminate();
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : settings.theme);
    apply();
    media.addEventListener("change", apply);
    document.documentElement.dataset.compact = String(settings.compact);
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduced"
      : "normal";
    if (ready)
      storage
        .saveSettings(settings)
        .catch(() =>
          notify(
            "Preferences could not be saved. Browser storage may be full.",
          ),
        );
    return () => media.removeEventListener("change", apply);
  }, [settings, ready]);
  const updateCase = (next: Case) => {
    setCases((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    storage
      .save(next)
      .catch(() =>
        notify(
          "This change could not be saved. Export a backup before leaving.",
        ),
      );
  };
  const addCase = async (c: Case) => {
    try {
      await storage.save(c);
      setCases((prev) => [c, ...prev.filter((k) => k.id !== c.id)]);
      setActiveId(c.id);
      setClueIndex(0);
      setEvidenceIds(null);
      setPage("Explore");
    } catch {
      setError(
        "There isn’t enough browser storage for this case. Export a backup and remove an older case.",
      );
    }
  };
  const openCase = (c: Case) => {
    setActiveId(c.id);
    setClueIndex(0);
    setEvidenceIds(null);
    setPage("Explore");
    setAnswer("");
  };
  const cancelUpload = () => {
    workerRef.current?.terminate();
    setBusy("");
    setPending(null);
    setUpload(false);
    setError("");
  };
  const runAnalysis = (
    input: object,
    name: string,
    bytes: number,
    id: string = crypto.randomUUID(),
  ) => {
    workerRef.current?.terminate();
    setBusy("Reading the records…");
    setError("");
    setUpload(true);
    const worker = new Worker(
      new URL("./workers/analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    worker.onmessage = (e) => {
      if (e.data.stage) setBusy(e.data.stage);
      else if (e.data.error) {
        setBusy("");
        setError(e.data.error);
        worker.terminate();
      } else {
        setPending({
          id,
          name,
          bytes,
          rows: e.data.result.rows,
          columns: e.data.result.columns,
          analysis: e.data.result.analysis,
        });
        setBusy("");
        worker.terminate();
      }
    };
    worker.onerror = () => {
      setBusy("");
      setError(
        "The analysis stopped unexpectedly. Try a smaller file or reload this page.",
      );
      worker.terminate();
    };
    worker.postMessage(input);
  };
  const readFile = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError("Choose a CSV smaller than 100 MB.");
      setUpload(true);
      return;
    }
    setUpload(true);
    setPending(null);
    try {
      runAnalysis({ text: await file.text() }, file.name, file.size);
    } catch {
      setError("We couldn’t read this file. Try choosing it again.");
    }
  };
  const loadSample = (id: string, seed?: number) => {
    const text = sampleCSV(id, seed);
    runAnalysis(
      { text },
      `${id === "mystery" ? "The midnight anomaly" : samples.find((s) => s.id === id)?.name}.csv`,
      new Blob([text]).size,
    );
  };
  const begin = async () => {
    if (!pending) return;
    const limits: Record<string, number> = {
      Easy: 5,
      Medium: 8,
      Hard: 10,
      Expert: 12,
    };
    const limit = Math.min(
      settings.clueCount,
      limits[settings.difficulty] || 8,
    );
    const c: Case = {
      id: crypto.randomUUID(),
      dataset: {
        ...pending,
        analysis: {
          ...pending.analysis,
          clues: pending.analysis.clues.slice(0, limit),
        },
      },
      title: pending.name.replace(/\.csv$/i, ""),
      createdAt: Date.now(),
      discovered: [],
      bookmarks: [],
      notes: {},
      hypothesis: "",
      hypothesisClues: [],
      status: "open",
      duration: 0,
      difficulty: settings.difficulty,
      mode: settings.mode,
    };
    await addCase(c);
    setPending(null);
    setUpload(false);
    notify("Case opened. Follow your curiosity.");
  };
  const mark = (clue: Clue) => {
    if (!active) return;
    updateCase(discover(active, clue.id));
  };
  const inspect = (clue: Clue) => {
    mark(clue);
    setEvidence(clue);
  };
  const bookmark = (c: Clue) => {
    if (!active) return;
    const saved = active.bookmarks.includes(c.id);
    updateCase({
      ...active,
      bookmarks: saved
        ? active.bookmarks.filter((id) => id !== c.id)
        : [...active.bookmarks, c.id],
    });
    notify(saved ? "Finding removed from saved." : "Finding saved.");
  };
  const openRows = (c: Clue) => {
    setEvidenceIds(c.rowIds);
    setPage("Data");
    setEvidence(null);
  };
  const follow = (c: Clue) => {
    mark(c);
    openRows(c);
    notify(
      `Following ${c.follow?.value || "the supporting records"}. ${c.rowIds.length} rows in focus.`,
    );
  };
  const exportCase = (c: Case) =>
    download(
      JSON.stringify({ version: 1, cases: [c], settings }, null, 2),
      `${c.title}.mystery`,
      "application/json",
    );
  const exportReport = (c: Case) =>
    download(
      `# ${c.title}\n\nMystery CSV investigation · ${new Date(c.createdAt).toLocaleDateString()}\n${c.dataset.rows.length} rows · ${c.dataset.columns.length} columns\n${c.discovered.length} / ${c.dataset.analysis.clues.length} clues discovered\n\n${c.dataset.analysis.clues
        .map(
          (k) =>
            `## ${k.title}\n${k.description}\n\n${k.evidence.map((e) => `${e.label}: ${e.value}`).join("\n")}\n\nMethod: ${k.calculation}\nSupporting row numbers: ${k.rowIds
              .slice(0, 100)
              .map((i) => i + 1)
              .join(
                ", ",
              )}${k.rowIds.length > 100 ? " (first 100; complete IDs in case export)" : ""}\nNote: ${c.notes[k.id] || "—"}`,
        )
        .join(
          "\n\n",
        )}\n\n## Working hypothesis\n${c.hypothesis || "No hypothesis recorded."}\n\n${evaluateHypothesis(c).explanation}`,
      `${c.title}-report.md`,
      "text/markdown",
    );
  const restore = async (file: File) => {
    try {
      if (file.size > 150 * 1024 * 1024) throw new Error();
      const value = JSON.parse(await file.text());
      if (!validateBackup(value)) throw new Error();
      setRestoreData(value);
    } catch {
      notify(
        "This isn’t a valid Mystery CSV backup. Choose a .json or .mystery export.",
      );
    }
  };
  const applyRestore = async (replace: boolean) => {
    if (!restoreData) return;
    try {
      await storage.restore(
        restoreData.cases,
        { ...defaults, ...restoreData.settings },
        replace,
      );
      setCases(await storage.cases());
      setSettings({ ...defaults, ...restoreData.settings });
      setActiveId(restoreData.cases[0]?.id || null);
      setRestoreData(null);
      setPage("Cases");
      notify("Your cases and preferences have been restored.");
    } catch {
      notify("Restore failed. Your browser may not have enough storage.");
    }
  };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          "input,textarea,select,[contenteditable]",
        ) ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        document.querySelector("dialog[open]")
      )
        return;
      switch (e.key.toLowerCase()) {
        case "u":
        case "n":
          setUpload(true);
          break;
        case "d":
          if (active) setPage("Data");
          break;
        case "c":
          setClueIndex((i) => Math.min(i + 1, clues.length - 1));
          break;
        case "e":
          if (selected) inspect(selected);
          break;
        case "s":
          if (selected) bookmark(selected);
          break;
        case "f":
          e.preventDefault();
          if (active) {
            setPage("Data");
            setTimeout(
              () => document.getElementById("dataset-search")?.focus(),
              50,
            );
          }
          break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  useEffect(() => {
    if (page !== "Explore" || !active || active.status === "solved") return;
    const interval = setInterval(() => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== active.id) return c;
          const next = { ...c, duration: c.duration + 10 };
          storage.save(next).catch(() => {});
          return next;
        }),
      );
    }, 10000);
    return () => clearInterval(interval);
  }, [page, activeId, active?.status]);
  const askData = () => {
    if (!active) return;
    const q = ask.toLowerCase(),
      ds = active.dataset;
    const col =
      ds.analysis.profiles.find(
        (p) => q.includes(p.name.toLowerCase()) && p.stats,
      ) || ds.analysis.profiles.find((p) => p.stats);
    if (/biggest|maximum|highest|largest/.test(q) && col?.stats) {
      setAnswer(
        `The largest ${col.name} is ${fmt(col.stats.max)} across ${col.stats.count.toLocaleString()} valid numeric records. Open Unusual Records to examine the outliers.`,
      );
    } else if (/average|mean/.test(q) && col?.stats)
      setAnswer(
        `The average ${col.name} is ${fmt(col.stats.mean)}. The median is ${fmt(col.stats.median)} (${col.stats.count} valid records).`,
      );
    else if (/common|often|frequent/.test(q)) {
      const cat =
        ds.analysis.profiles.find(
          (p) => q.includes(p.name.toLowerCase()) && !p.stats,
        ) || ds.analysis.profiles.find((p) => p.type === "categorical");
      setAnswer(
        cat?.frequencies[0]
          ? `${cat.frequencies[0][0]} is the most frequent ${cat.name}: ${cat.frequencies[0][1]} records.`
          : "No matching categorical column was found.",
      );
    } else if (/missing|empty/.test(q))
      setAnswer(
        `${ds.analysis.missing.toLocaleString()} empty cells across ${ds.rows.length * ds.columns.length} cells. Empty means blank or whitespace.`,
      );
    else
      setAnswer(
        "Try “highest [numeric column]”, “average [numeric column]”, “most common [category]”, or “how many missing values?”. These are local calculation templates.",
      );
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setPage("Home")}
          aria-label="Mystery CSV home"
        >
          <Logo />
          <span>
            Mystery CSV<span className="brand-dot">.</span>
          </span>
        </button>
        <button className="new-case" onClick={() => setUpload(true)}>
          <Plus size={17} /> New investigation<span>U</span>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Cases" && cases.length > 0 && (
                <small>{cases.length}</small>
              )}
              {name === "Saved" &&
                cases.some((c) => c.bookmarks.length > 0) && (
                  <span className="nav-dot" />
                )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label recent-label">
          RECENT CASES{" "}
          <button
            className="icon-button"
            aria-label="View all cases"
            onClick={() => setPage("Cases")}
          >
            <Plus size={13} />
          </button>
        </div>
        {cases.slice(0, 3).map((c) => (
          <button
            key={c.id}
            className={`recent-link ${activeId === c.id && page === "Explore" ? "current" : ""}`}
            onClick={() => openCase(c)}
          >
            <span
              className={`status-dot ${c.status === "solved" ? "solved" : ""}`}
            />
            <span>{c.title}</span>
          </button>
        ))}
        {!cases.length && (
          <div className="sidebar-empty">
            Every dataset has a story.
            <br />
            Start your first case.
          </div>
        )}
        <div className="sidebar-bottom">
          <div className="private-card">
            <ShieldCheck size={19} />
            <div>
              <b>For your eyes only.</b>
              <p>Your data stays in your browser.</p>
            </div>
            <span className="privacy-pulse" />
          </div>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => setPage("Settings")}
          >
            <Settings2 size={18} />
            <span>Settings & help</span>
          </button>
          <div className="profile">
            <div className="avatar">Y</div>
            <div>
              <b>Your workspace</b>
              <span>Local. Private. Yours.</span>
            </div>
            <span className="local-badge">LOCAL</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{page === "Explore" && active ? "Investigation" : page}</b>
          </div>
          <div className="topbar-right">
            <span className="local-status">
              <span className="status-dot solved" /> All data stays on this
              device
            </span>
            <button
              className="icon-button"
              title="Toggle color theme"
              aria-label="Toggle color theme"
              onClick={() =>
                setSettings({
                  ...settings,
                  theme:
                    document.documentElement.dataset.theme === "dark"
                      ? "light"
                      : "dark",
                })
              }
            >
              {document.documentElement.dataset.theme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>
            <div className="avatar small">Y</div>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {page === "Home" && (
            <>
              <div className="home-intro">
                <div>
                  <span className="eyebrow greeting">
                    A LITTLE DATA. A LOT TO DISCOVER.
                  </span>
                  <h1>
                    Welcome, detective<span className="heading-dot">.</span>
                  </h1>
                  <p>Your next discovery is closer than you think.</p>
                </div>
                <span className="date-pill">
                  <CalendarDays size={14} />
                  {new Date().toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="hero-kicker">
                    <span /> EVERY DATASET HAS A STORY
                  </span>
                  <h2>
                    Your data is
                    <br />
                    hiding <em>something.</em>
                  </h2>
                  <p>
                    Drop in a CSV. We’ll find the clues.
                    <br />
                    You follow the evidence.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="button primary"
                      onClick={() => setUpload(true)}
                    >
                      <Upload size={17} /> Upload a CSV{" "}
                      <ArrowUpRight size={17} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => loadSample("mystery")}
                    >
                      Try a mystery <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="hero-trust">
                    <ShieldCheck size={14} />
                    <span>100% private</span>
                    <i />
                    No account needed
                    <i />
                    No AI guesswork
                  </div>
                </div>
                <HeroBoard />
              </section>
              <div className="workflow-strip">
                <div>
                  <span>01</span>
                  <b>Bring your data</b>
                  <small>Any CSV. Any story.</small>
                </div>
                <ChevronRight size={14} />
                <div>
                  <span>02</span>
                  <b>Follow the clues</b>
                  <small>Real patterns. Clear evidence.</small>
                </div>
                <ChevronRight size={14} />
                <div>
                  <span>03</span>
                  <b>Connect the dots</b>
                  <small>Your very own aha! moment.</small>
                </div>
                <Sparkles className="workflow-sparkle" size={20} />
              </div>
              <section className="sample-section">
                <div className="section-title">
                  <div>
                    <h2>
                      A good place to start{" "}
                      <span className="small-tag">SAMPLE CASES</span>
                    </h2>
                    <p>No CSV handy? There’s a mystery waiting for you.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() =>
                      loadSample(
                        "mystery",
                        Number(
                          new Date()
                            .toISOString()
                            .slice(0, 10)
                            .replaceAll("-", ""),
                        ),
                      )
                    }
                  >
                    Today’s mystery <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="sample-grid">
                  {samples.map((s, i) => {
                    const Icon = [Activity, Files, Compass, Search][i];
                    return (
                      <button
                        className={`sample-card ${s.color}`}
                        key={s.id}
                        onClick={() => loadSample(s.id)}
                      >
                        <div className="sample-card-top">
                          <span className="sample-icon">
                            <Icon size={20} />
                          </span>
                          <ArrowUpRight size={18} />
                        </div>
                        <span className="tiny-label">{s.kind}</span>
                        <h3>{s.name}</h3>
                        <p>{s.description}</p>
                        <div className="sample-footer">
                          <span>
                            <Table2 size={12} />
                            {s.rows} rows
                          </span>
                          <span>
                            <span
                              className={`difficulty-bars ${s.level.toLowerCase()}`}
                            >
                              <i />
                              <i />
                              <i />
                            </span>
                            {s.level}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="recent-section">
                <div className="section-title">
                  <div>
                    <h2>
                      Your case files{" "}
                      <span className="count-tag">{cases.length}</span>
                    </h2>
                    <p>A little unfinished business?</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("Cases")}
                  >
                    All cases <ArrowRight size={15} />
                  </button>
                </div>
                {!cases.length ? (
                  <div className="empty-case">
                    <div className="empty-folder">
                      <FolderOpen size={25} />
                    </div>
                    <div>
                      <b>A clean slate. An open mind.</b>
                      <p>
                        Your investigations will live here. Let’s find your
                        first clue.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setUpload(true)}
                    >
                      Open a case <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="recent-table">
                    {cases.slice(0, 3).map((c) => (
                      <button key={c.id} onClick={() => openCase(c)}>
                        <span className="case-file-icon">
                          <Files size={19} />
                        </span>
                        <div>
                          <b>{c.title}</b>
                          <small>
                            {c.dataset.rows.length.toLocaleString()} rows ·{" "}
                            {c.dataset.analysis.clues.length} clues
                          </small>
                        </div>
                        <span className={`status-pill ${c.status}`}>
                          {c.status === "solved" ? "Complete" : "In progress"}
                        </span>
                        <span>{dateLabel(c.createdAt)}</span>
                        <ArrowUpRight size={17} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <footer className="home-footer">
                <span>
                  <Logo /> Made for curious minds.
                </span>
                <span>
                  Your CSV never leaves this browser. <LockKeyhole size={12} />
                </span>
              </footer>
            </>
          )}
          {page === "Cases" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR INVESTIGATION LIBRARY</span>
                  <h1>
                    Every case has a story<span className="heading-dot">.</span>
                  </h1>
                  <p>Pick up a thread. Connect another dot.</p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setUpload(true)}
                >
                  <Plus size={17} /> New investigation
                </button>
              </div>
              <div className="table-tools">
                <label className="search">
                  <Search size={16} />
                  <input
                    placeholder="Find a case…"
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                  />
                </label>
                <button
                  className="button secondary"
                  onClick={() => restoreInput.current?.click()}
                >
                  <Upload size={16} /> Import a case
                </button>
              </div>
              {!cases.length ? (
                <div className="big-empty">
                  <FolderOpen size={40} />
                  <h2>Your first mystery is waiting.</h2>
                  <p>Upload your data or explore a sample case.</p>
                  <button
                    className="button primary"
                    onClick={() => loadSample("mystery")}
                  >
                    Try the midnight anomaly <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="case-grid">
                  {cases
                    .filter((c) =>
                      c.title.toLowerCase().includes(caseSearch.toLowerCase()),
                    )
                    .map((c) => (
                      <article className="case-card" key={c.id}>
                        <div className="case-card-top">
                          <span className="case-file-icon">
                            <Files size={22} />
                          </span>
                          <span className={`status-pill ${c.status}`}>
                            {c.status === "solved" ? "Complete" : "Open case"}
                          </span>
                        </div>
                        <button
                          className="case-title"
                          onClick={() => openCase(c)}
                        >
                          {c.title}
                          <ArrowUpRight size={18} />
                        </button>
                        <p>
                          {c.dataset.rows.length.toLocaleString()} rows ·{" "}
                          {c.dataset.columns.length} columns · {c.difficulty}
                        </p>
                        <div className="progress-bar">
                          <span
                            style={{
                              width: `${c.dataset.analysis.clues.length ? (100 * c.discovered.length) / c.dataset.analysis.clues.length : 0}%`,
                            }}
                          />
                        </div>
                        <div className="case-meta">
                          <span>
                            {c.discovered.length} /{" "}
                            {c.dataset.analysis.clues.length} clues
                          </span>
                          <span>{dateLabel(c.createdAt)}</span>
                        </div>
                        <div className="case-actions">
                          <button
                            title="Rename case"
                            aria-label={`Rename ${c.title}`}
                            onClick={() => {
                              setRename(c);
                              setRenameText(c.title);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            title="Duplicate case"
                            aria-label={`Duplicate ${c.title}`}
                            onClick={async () => {
                              const copy = {
                                ...c,
                                id: crypto.randomUUID(),
                                title: `${c.title} (copy)`,
                                createdAt: Date.now(),
                              };
                              await addCase(copy);
                              notify("Case duplicated.");
                            }}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            title="Export case"
                            aria-label={`Export ${c.title}`}
                            onClick={() => exportCase(c)}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            title="Delete case"
                            aria-label={`Delete ${c.title}`}
                            onClick={() =>
                              setConfirm({
                                title: "Delete this case?",
                                description:
                                  "The dataset, notes, and findings in this case will be removed from this browser. Export it first if you want to keep a copy.",
                                action: () => {
                                  storage
                                    .remove(c.id)
                                    .then(() => {
                                      setCases((prev) =>
                                        prev.filter((k) => k.id !== c.id),
                                      );
                                      if (activeId === c.id) setActiveId(null);
                                      notify("Case deleted.");
                                    })
                                    .catch(() =>
                                      notify("This case could not be deleted."),
                                    );
                                },
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            className="open-case"
                            onClick={() => openCase(c)}
                          >
                            Continue <ArrowRight size={14} />
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </>
          )}
          {(page === "Explore" || page === "Data") && !active && (
            <div className="big-empty">
              <Compass size={42} />
              <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
              <h1>It starts with a little data.</h1>
              <p>Choose a case or drop in a CSV to begin.</p>
              <button
                className="button primary"
                onClick={() => setUpload(true)}
              >
                <Upload size={17} /> Upload a CSV
              </button>
              <button
                className="text-button"
                onClick={() => loadSample("mystery")}
              >
                Or try a mystery dataset <ArrowRight size={15} />
              </button>
            </div>
          )}
          {page === "Explore" && active && (
            <>
              <div className="investigation-heading">
                <div>
                  <button
                    className="back-link"
                    onClick={() => setPage("Cases")}
                  >
                    <ArrowLeft size={14} /> Case files
                  </button>
                  <div className="case-heading-line">
                    <span className="eyebrow">CASE #{caseNumber(active)}</span>
                    <span className={`status-pill ${active.status}`}>
                      {active.status === "solved"
                        ? "Complete"
                        : "Investigation open"}
                    </span>
                    <span className="tiny-label">
                      {active.difficulty} · {active.mode}
                    </span>
                  </div>
                  <h1>{active.title}</h1>
                  <p>
                    {active.dataset.rows.length.toLocaleString()} records.{" "}
                    {clues.length} leads. Follow the evidence.
                  </p>
                </div>
                <div className="investigation-actions">
                  <button
                    className="button secondary"
                    onClick={() => setModal("health")}
                  >
                    <Activity size={16} /> Data health
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => setModal("correlations")}
                  >
                    <Link2 size={16} /> Relationships
                  </button>
                  <button
                    className="button primary"
                    onClick={() =>
                      setModal(
                        active.status === "solved" ? "summary" : "hypothesis",
                      )
                    }
                  >
                    <Lightbulb size={16} />
                    {active.status === "solved"
                      ? "View summary"
                      : "Your hypothesis"}
                  </button>
                </div>
              </div>
              <div className="investigation-progress">
                <span>
                  <Compass size={15} /> FOLLOW THE EVIDENCE
                </span>
                <div className="progress-bar">
                  <span
                    style={{
                      width: `${clues.length ? (active.discovered.length / clues.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <b>
                  {active.discovered.length} / {clues.length} discovered
                </b>
              </div>
              {!clues.length ? (
                <div className="big-empty">
                  <CheckCircle2 size={36} />
                  <h2>No strong leads. That’s a finding, too.</h2>
                  <p>
                    We found no patterns that meet our screening thresholds.
                    Explore the data or review its health. We won’t invent a
                    mystery.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setPage("Data")}
                  >
                    Explore the dataset <ArrowRight size={16} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setModal("hypothesis")}
                  >
                    Record your observations
                  </button>
                </div>
              ) : (
                <div className="investigation-layout">
                  <section className="clue-canvas">
                    <div className="clue-canvas-top">
                      <span className="clue-tag">
                        <Sparkles size={14} /> CLUE{" "}
                        {String(clueIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="tiny-label">
                        {selected.type.replace("-", " ").toUpperCase()}
                      </span>
                      <button
                        aria-label="Bookmark clue"
                        aria-pressed={active.bookmarks.includes(selected.id)}
                        className={`icon-button ${active.bookmarks.includes(selected.id) ? "bookmarked" : ""}`}
                        onClick={() => bookmark(selected)}
                      >
                        <Bookmark
                          size={18}
                          fill={
                            active.bookmarks.includes(selected.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    <h2>
                      {active.mode === "mystery" &&
                      !active.discovered.includes(selected.id)
                        ? `A new ${selected.type.replace("-", " ")} lead is hiding here.`
                        : selected.title}
                    </h2>
                    {active.mode === "mystery" &&
                    !active.discovered.includes(selected.id) ? (
                      <div className="hidden-clue">
                        <div className="hidden-clue-art">
                          <span />
                          <span />
                          <span />
                          <span />
                          <Search size={32} />
                        </div>
                        <p>Something deserves a closer look.</p>
                        <span>{selected.columns.join(" + ")}</span>
                        <button
                          className="button primary"
                          onClick={() => {
                            mark(selected);
                            notify("Clue discovered. You found a pattern.");
                          }}
                        >
                          <Eye size={16} /> Reveal this clue
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="clue-description">
                          {selected.description}
                        </p>
                        <ClueChart
                          clue={selected}
                          onSelect={() => inspect(selected)}
                        />
                        <div className="evidence-metrics">
                          {selected.evidence.map((e) => (
                            <div key={e.label}>
                              <span>{e.label}</span>
                              <b>{e.value}</b>
                            </div>
                          ))}
                        </div>
                        <div className="clue-main-actions">
                          <button
                            className="button primary"
                            onClick={() => inspect(selected)}
                          >
                            <Search size={16} /> Inspect evidence{" "}
                            <ArrowUpRight size={15} />
                          </button>
                          <button
                            className="text-button"
                            onClick={() => follow(selected)}
                          >
                            Follow {selected.follow?.value || "the trail"}{" "}
                            <ArrowRight size={15} />
                          </button>
                        </div>
                        {settings.showCalculations && (
                          <details open className="calculation">
                            <summary>Show calculation</summary>
                            <p>{selected.calculation}</p>
                          </details>
                        )}
                      </>
                    )}
                    <div className="clue-pagination">
                      <button
                        className="text-button"
                        disabled={clueIndex === 0}
                        onClick={() => setClueIndex((i) => i - 1)}
                      >
                        <ArrowLeft size={15} /> Previous
                      </button>
                      <div className="clue-dots">
                        {clues.map((c, i) => (
                          <button
                            key={c.id}
                            aria-label={`Go to clue ${i + 1}`}
                            className={`${i === clueIndex ? "current" : ""} ${active.discovered.includes(c.id) ? "found" : ""}`}
                            onClick={() => setClueIndex(i)}
                          />
                        ))}
                      </div>
                      <button
                        className="text-button"
                        onClick={() =>
                          clueIndex < clues.length - 1
                            ? setClueIndex((i) => i + 1)
                            : setModal("hypothesis")
                        }
                      >
                        {clueIndex < clues.length - 1
                          ? "Next clue"
                          : "Connect the dots"}{" "}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </section>
                  <aside className="evidence-sidebar">
                    <div className="evidence-sidebar-head">
                      <h3>Your leads</h3>
                      <span>{clues.length}</span>
                    </div>
                    <p>Every finding has a paper trail.</p>
                    <div className="lead-list">
                      {clues.map((c, i) => {
                        const Icon = icons[c.type] || Search;
                        const found = active.discovered.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            className={`lead ${i === clueIndex ? "selected" : ""}`}
                            onClick={() => setClueIndex(i)}
                          >
                            <span
                              className={`lead-icon ${found ? "found" : ""}`}
                            >
                              {found ? <Check size={17} /> : <Icon size={17} />}
                            </span>
                            <div>
                              <span>
                                CLUE {String(i + 1).padStart(2, "0")} ·{" "}
                                {c.type.replace("-", " ")}
                              </span>
                              <b>
                                {active.mode === "mystery" && !found
                                  ? "A new thread to follow"
                                  : c.title}
                              </b>
                            </div>
                            <ChevronRight size={14} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="investigator-note">
                      <Pencil size={15} />
                      <label htmlFor="case-note">Your field notes</label>
                      <textarea
                        id="case-note"
                        placeholder="What are you noticing?"
                        value={active.notes.case || ""}
                        onChange={(e) =>
                          updateCase({
                            ...active,
                            notes: { ...active.notes, case: e.target.value },
                          })
                        }
                      />
                      <small>Saved on this device.</small>
                    </div>
                    <div className="trust-note">
                      <ShieldCheck size={16} />
                      <p>
                        Patterns are computed, never invented. A clue suggests
                        where to look, not what caused it.
                      </p>
                    </div>
                  </aside>
                </div>
              )}
              <section className="ask-data">
                <div>
                  <Sparkles size={20} />
                  <div>
                    <h3>Ask the records</h3>
                    <p>Simple questions. Computed answers. No AI.</p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    askData();
                  }}
                >
                  <input
                    aria-label="Ask the dataset"
                    placeholder={`Try “highest ${active.dataset.analysis.profiles.find((p) => p.stats)?.name || "value"}”`}
                    value={ask}
                    onChange={(e) => setAsk(e.target.value)}
                  />
                  <button
                    className="icon-button"
                    aria-label="Ask question"
                    type="submit"
                  >
                    <ArrowRight size={18} />
                  </button>
                </form>
                {answer && (
                  <p className="query-answer" role="status">
                    {answer}
                  </p>
                )}
              </section>
            </>
          )}
          {page === "Data" && active && (
            <DataExplorer
              key={active.id}
              dataset={active.dataset}
              notes={active.notes}
              onNote={(key, value) =>
                updateCase({
                  ...active,
                  notes: { ...active.notes, [key]: value },
                })
              }
              evidenceIds={evidenceIds}
              onClearEvidence={() => setEvidenceIds(null)}
            />
          )}
          {page === "Saved" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">KEEP THE INTERESTING BITS</span>
                  <h1>
                    Saved findings<span className="heading-dot">.</span>
                  </h1>
                  <p>Connections worth coming back to.</p>
                </div>
              </div>
              {!cases.some((c) => c.bookmarks.length) ? (
                <div className="big-empty">
                  <Bookmark size={38} />
                  <h2>A place for your aha! moments.</h2>
                  <p>
                    Bookmark a clue during an investigation to keep it here.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setPage("Cases")}
                  >
                    Open your cases <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="saved-grid">
                  {cases.flatMap((c) =>
                    c.dataset.analysis.clues
                      .filter((k) => c.bookmarks.includes(k.id))
                      .map((k) => (
                        <article key={c.id + k.id} className="saved-card">
                          <span className="eyebrow">{c.title}</span>
                          <h2>{k.title}</h2>
                          <p>{k.description}</p>
                          <button
                            className="text-button"
                            onClick={() => {
                              openCase(c);
                              setClueIndex(
                                c.dataset.analysis.clues.findIndex(
                                  (x) => x.id === k.id,
                                ),
                              );
                            }}
                          >
                            Follow the evidence <ArrowUpRight size={16} />
                          </button>
                        </article>
                      )),
                  )}
                </div>
              )}
            </>
          )}
          {page === "Statistics" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CURIOSITY, BY THE NUMBERS</span>
                  <h1>
                    Your detective record<span className="heading-dot">.</span>
                  </h1>
                  <p>Every discovery starts with a question.</p>
                </div>
              </div>
              <div className="stats-grid">
                {[
                  {
                    label: "Cases investigated",
                    value: cases.length,
                    icon: Files,
                  },
                  {
                    label: "Cases completed",
                    value: cases.filter((c) => c.status === "solved").length,
                    icon: CheckCheck,
                  },
                  {
                    label: "Clues discovered",
                    value: cases.reduce((s, c) => s + c.discovered.length, 0),
                    icon: Sparkles,
                  },
                  {
                    label: "Average active time",
                    value: cases.some((c) => c.status === "solved")
                      ? `${Math.round(cases.filter((c) => c.status === "solved").reduce((s, c) => s + c.duration, 0) / cases.filter((c) => c.status === "solved").length / 60)}m`
                      : "—",
                    icon: Clock,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <article className="stat-card" key={label}>
                    <Icon size={20} />
                    <b>{value}</b>
                    <span>{label}</span>
                  </article>
                ))}
              </div>
              <section className="panel activity-panel">
                <div className="section-title">
                  <div>
                    <h2>A habit of discovery</h2>
                    <p>Your case activity over the last 12 weeks.</p>
                  </div>
                  <span className="tiny-label">LESS ░ ▒ ▓ MORE</span>
                </div>
                <div className="heatmap">
                  {Array.from({ length: 84 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - 83 + i);
                    const date = d.toDateString(),
                      n = cases.filter(
                        (c) => new Date(c.createdAt).toDateString() === date,
                      ).length;
                    return (
                      <span
                        key={i}
                        title={`${date}: ${n} cases`}
                        style={{
                          background: n
                            ? `color-mix(in srgb, #8fae65 ${Math.min(100, 30 + n * 20)}%, var(--hover))`
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="activity-legend">
                  <span>12 weeks ago</span>
                  <span>Today</span>
                </div>
              </section>
              <div className="panel stats-explanation">
                <ShieldCheck size={23} />
                <div>
                  <h3>Evidence over artificial accuracy.</h3>
                  <p>
                    We track progress and attached evidence. We don’t assign a
                    “hypothesis accuracy” percentage: a CSV alone cannot prove a
                    real-world explanation.
                  </p>
                </div>
              </div>
            </>
          )}
          {page === "Settings" && (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MAKE YOURSELF AT HOME</span>
                  <h1>
                    Your workspace, your way
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>A few preferences. Everything stays local.</p>
                </div>
              </div>
              <div className="settings-workspace-links">
                <button
                  className="button secondary"
                  onClick={() => setPage("Saved")}
                >
                  <Bookmark size={16} /> Saved findings
                </button>
                <button
                  className="button secondary"
                  onClick={() => setPage("Statistics")}
                >
                  <ChartNoAxesCombined size={16} /> Your statistics
                </button>
              </div>
              <div className="settings-layout">
                <section className="panel settings-panel">
                  <h2>Appearance</h2>
                  <p>A comfortable place to connect the dots.</p>
                  <div className="theme-options">
                    {(
                      [
                        { value: "light", icon: Sun },
                        { value: "dark", icon: Moon },
                        { value: "system", icon: Monitor },
                      ] as const
                    ).map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        className={settings.theme === value ? "selected" : ""}
                        onClick={() =>
                          setSettings({ ...settings, theme: value })
                        }
                      >
                        <Icon size={22} />
                        {value}
                        <span>
                          {settings.theme === value && <Check size={14} />}
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="setting-row">
                    <span>
                      <b>Compact layout</b>
                      <small>A little more data, a little less space.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.compact}
                      onChange={(e) =>
                        setSettings({ ...settings, compact: e.target.checked })
                      }
                    />
                  </label>
                  <label className="setting-row">
                    <span>
                      <b>Reduce motion</b>
                      <small>
                        Keep things still. System preferences are also
                        respected.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.reducedMotion}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          reducedMotion: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <h2 className="settings-subheading">Investigation</h2>
                  <label className="setting-row">
                    <span>
                      <b>Default mode</b>
                      <small>
                        Mystery reveals clues gradually. Explore shows findings
                        upfront.
                      </small>
                    </span>
                    <select
                      value={settings.mode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          mode: e.target.value as Settings["mode"],
                        })
                      }
                    >
                      <option value="mystery">Mystery</option>
                      <option value="explore">Explore</option>
                    </select>
                  </label>
                  <label className="setting-row">
                    <span>
                      <b>Difficulty</b>
                      <small>
                        Controls clue count and guidance, never the data.
                      </small>
                    </span>
                    <select
                      value={settings.difficulty}
                      onChange={(e) =>
                        setSettings({ ...settings, difficulty: e.target.value })
                      }
                    >
                      {["Easy", "Medium", "Hard", "Expert"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="setting-row">
                    <span>
                      <b>Maximum clues</b>
                      <small>Only qualifying findings are included.</small>
                    </span>
                    <select
                      value={settings.clueCount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          clueCount: Number(e.target.value),
                        })
                      }
                    >
                      {[5, 8, 10, 12].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <label className="setting-row">
                    <span>
                      <b>Show calculations</b>
                      <small>
                        Keep methods open alongside every discovered clue.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showCalculations}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          showCalculations: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="setting-row">
                    <span>
                      <b>Advance after evidence</b>
                      <small>
                        Move to the next clue when closing the evidence panel.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.autoAdvance}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoAdvance: e.target.checked,
                        })
                      }
                    />
                  </label>
                </section>
                <div>
                  <section className="panel settings-panel">
                    <h2>Your data</h2>
                    <p>
                      Backups include all raw datasets, cases, notes, bookmarks,
                      progress, and preferences. Keep them somewhere safe.
                    </p>
                    <button
                      className="button secondary full"
                      onClick={() =>
                        download(
                          JSON.stringify({ version: 1, cases, settings }),
                          `mystery-csv-backup-${new Date().toISOString().slice(0, 10)}.json`,
                          "application/json",
                        )
                      }
                    >
                      <Download size={16} /> Download backup
                    </button>
                    <button
                      className="button secondary full"
                      onClick={() => restoreInput.current?.click()}
                    >
                      <Upload size={16} /> Restore or import
                    </button>
                    <button
                      className="button danger full"
                      onClick={() =>
                        setConfirm({
                          title: "Clear all local data?",
                          description:
                            "All datasets, cases, notes, bookmarks and settings will be permanently removed from this browser. Download a backup first.",
                          action: () => {
                            storage
                              .clear()
                              .then(() => {
                                setCases([]);
                                setActiveId(null);
                                setSettings(defaults);
                                notify("Local workspace cleared.");
                              })
                              .catch(() =>
                                notify("Local data could not be cleared."),
                              );
                          },
                        })
                      }
                    >
                      <Trash2 size={16} /> Clear local data
                    </button>
                  </section>
                  <section className="privacy-panel">
                    <ShieldCheck size={26} />
                    <h3>For your eyes only.</h3>
                    <p>
                      Your CSV never leaves this browser. No account, no
                      tracking, no analytics, no AI API. Data lives in IndexedDB
                      on this device. Clearing browser data removes it.
                    </p>
                  </section>
                  <section className="panel shortcut-panel">
                    <h3>
                      <Command size={17} /> Keyboard shortcuts
                    </h3>
                    {[
                      ["U / N", "New investigation"],
                      ["F", "Search dataset"],
                      ["C", "Next clue"],
                      ["E", "Inspect evidence"],
                      ["D", "Open dataset"],
                      ["S", "Save finding"],
                      ["Esc", "Close dialog"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <span>{label}</span>
                        <kbd>{key}</kbd>
                      </div>
                    ))}
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          navigation[0],
          navigation[1],
          navigation[2],
          navigation[3],
          { name: "Settings" as Page, icon: Settings2 },
        ].map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={page === name ? "active" : ""}
            onClick={() => setPage(name)}
          >
            <Icon size={19} />
            <span>{name}</span>
          </button>
        ))}
        <button
          onClick={() => setUpload(true)}
          aria-label="New CSV investigation"
        >
          <Plus size={22} />
          <span>New</span>
        </button>
      </nav>
      <input
        ref={fileInput}
        className="hidden-input"
        type="file"
        accept=".csv,.tsv,.txt,text/csv"
        aria-label="Choose CSV file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={restoreInput}
        className="hidden-input"
        type="file"
        accept=".json,.mystery"
        aria-label="Choose backup file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) restore(f);
          e.target.value = "";
        }}
      />
      {upload && (
        <Dialog
          title={pending ? "The scene is set." : "A new mystery starts here."}
          onClose={cancelUpload}
          wide={!!pending}
        >
          {busy ? (
            <div className="analysis-loading" role="status">
              <div className="analysis-orbit">
                <Search size={30} />
              </div>
              <h2>{busy}</h2>
              <p>Looking for the unexpected. Your data stays right here.</p>
              <div className="loading-track">
                <span />
              </div>
              <button className="text-button" onClick={cancelUpload}>
                Cancel analysis
              </button>
            </div>
          ) : pending ? (
            <>
              <div className="upload-success">
                <span>
                  <CheckCircle2 size={19} /> DATASET LOADED
                </span>
                <h3>{pending.name}</h3>
                <p>We’ve inspected the records. Here’s what we found.</p>
              </div>
              <div className="preview-stats">
                <div>
                  <b>{pending.rows.length.toLocaleString()}</b>
                  <span>rows</span>
                </div>
                <div>
                  <b>{pending.columns.length}</b>
                  <span>columns</span>
                </div>
                <div>
                  <b>
                    {pending.analysis.profiles.filter((p) => p.stats).length}
                  </b>
                  <span>numeric</span>
                </div>
                <div>
                  <b>
                    {(
                      (pending.analysis.missing /
                        (pending.rows.length * pending.columns.length)) *
                      100
                    ).toFixed(1)}
                    %
                  </b>
                  <span>missing values</span>
                </div>
              </div>
              {pending.analysis.profiles.find((p) => p.earliest) && (
                <p className="preview-date">
                  <CalendarDays size={15} />{" "}
                  {pending.analysis.profiles
                    .find((p) => p.earliest)!
                    .earliest!.slice(0, 10)}{" "}
                  —{" "}
                  {pending.analysis.profiles
                    .find((p) => p.latest)!
                    .latest!.slice(0, 10)}
                </p>
              )}
              {pending.analysis.warnings.map((w) => (
                <div key={w} className="notice warning">
                  {w}
                </div>
              ))}
              <div className="preview-columns">
                <h3>
                  The cast of columns{" "}
                  <span className="muted">Correct a type if needed.</span>
                </h3>
                {pending.analysis.profiles.map((p) => (
                  <div key={p.name}>
                    <div>
                      <b>{p.name}</b>
                      <span>
                        {p.unique.toLocaleString()} unique ·{" "}
                        {p.missing.toLocaleString()} empty
                      </span>
                    </div>
                    <select
                      aria-label={`Type for ${p.name}`}
                      value={p.type}
                      onChange={(e) => {
                        const overrides = Object.fromEntries(
                          pending.analysis.profiles.map((p) => [
                            p.name,
                            p.type,
                          ]),
                        );
                        runAnalysis(
                          {
                            rows: pending.rows,
                            columns: pending.columns,
                            warnings: pending.analysis.warnings,
                            overrides: {
                              ...overrides,
                              [p.name]: e.target.value,
                            },
                          },
                          pending.name,
                          pending.bytes,
                          pending.id,
                        );
                      }}
                    >
                      {typeOptions.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="case-config">
                <label>
                  Mode
                  <select
                    value={settings.mode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mode: e.target.value as Settings["mode"],
                      })
                    }
                  >
                    <option value="mystery">Mystery · reveal as you go</option>
                    <option value="explore">Explore · see every finding</option>
                  </select>
                </label>
                <label>
                  Difficulty
                  <select
                    value={settings.difficulty}
                    onChange={(e) =>
                      setSettings({ ...settings, difficulty: e.target.value })
                    }
                  >
                    {["Easy", "Medium", "Hard", "Expert"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="preview-ready">
                <Sparkles size={18} />
                <span>
                  <b>
                    {Math.min(
                      pending.analysis.clues.length,
                      settings.clueCount,
                      (
                        { Easy: 5, Medium: 8, Hard: 10, Expert: 12 } as Record<
                          string,
                          number
                        >
                      )[settings.difficulty] || 8,
                    )}{" "}
                    leads worth following.
                  </b>{" "}
                  The evidence is waiting.
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  className="text-button"
                  onClick={() => {
                    setPending(null);
                    setError("");
                  }}
                >
                  Choose another CSV
                </button>
                <button className="button primary" onClick={begin}>
                  Begin investigation <ArrowRight size={17} />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="dialog-intro">
                A spreadsheet is just a story you haven’t read yet.
              </p>
              <button
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) readFile(f);
                }}
              >
                <div className="upload-circle">
                  <Upload size={26} />
                </div>
                <h3>Drop your CSV here</h3>
                <p>
                  or <span>browse files</span>
                </p>
                <small>CSV, TSV · up to 100 MB · 200,000 rows</small>
              </button>
              {error && (
                <div className="notice warning" role="alert">
                  {error}
                </div>
              )}
              <div className="upload-privacy">
                <ShieldCheck size={17} />
                <div>
                  <b>Your data stays in your browser.</b>
                  <p>No uploads. No account. Just you and the evidence.</p>
                </div>
              </div>
              <div className="or-divider">
                <span /> OR START WITH A SAMPLE <span />
              </div>
              <div className="upload-samples">
                {samples.map((s) => (
                  <button key={s.id} onClick={() => loadSample(s.id)}>
                    <FileSpreadsheet size={16} />
                    <span>{s.name}</span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </>
          )}
        </Dialog>
      )}
      {evidence && active && (
        <Dialog
          title="Follow the evidence"
          wide
          onClose={() => {
            setEvidence(null);
            if (settings.autoAdvance)
              setClueIndex((i) => Math.min(i + 1, clues.length - 1));
          }}
        >
          <div className="evidence-modal-title">
            <span className="clue-tag">
              {evidence.type.replace("-", " ").toUpperCase()}
            </span>
            <h2>{evidence.title}</h2>
            <p>{evidence.description}</p>
          </div>
          <ClueChart clue={evidence} />
          <div className="evidence-metrics">
            {evidence.evidence.map((e) => (
              <div key={e.label}>
                <span>{e.label}</span>
                <b>{e.value}</b>
              </div>
            ))}
          </div>
          <details className="calculation" open>
            <summary>Show calculation · how we know</summary>
            <p>{evidence.calculation}</p>
            <small>
              Ranking uses magnitude, sample size and finding diversity.
              Reliability is a screening heuristic, not a probability or a
              formal significance test.
            </small>
          </details>
          <div className="supporting-heading">
            <h3>
              Supporting records{" "}
              <span className="count-tag">{evidence.rowIds.length}</span>
            </h3>
            <button className="text-button" onClick={() => openRows(evidence)}>
              Open in dataset <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="table-container supporting-table">
            <table>
              <thead>
                <tr>
                  <th>ROW</th>
                  {evidence.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evidence.rowIds.slice(0, 8).map((i) => (
                  <tr key={i}>
                    <td>#{i + 1}</td>
                    {evidence.columns.map((c) => (
                      <td key={c}>{active.dataset.rows[i]?.[c] || "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {evidence.rowIds.length > 8 && (
            <p className="table-note">
              Showing 8 of {evidence.rowIds.length} records. Open the dataset
              for all supporting rows.
            </p>
          )}
          <label className="note-label">
            Your note
            <textarea
              placeholder="A connection worth remembering…"
              value={active.notes[evidence.id] || ""}
              onChange={(e) =>
                updateCase({
                  ...active,
                  notes: { ...active.notes, [evidence.id]: e.target.value },
                })
              }
            />
          </label>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => bookmark(evidence)}
            >
              <Bookmark size={16} />
              {active.bookmarks.includes(evidence.id)
                ? "Saved finding"
                : "Save finding"}
            </button>
            <button className="button primary" onClick={() => follow(evidence)}>
              Follow {evidence.follow?.value || "these records"}{" "}
              <ArrowRight size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {modal === "hypothesis" && active && (
        <Dialog title="Connect the dots." onClose={() => setModal(null)}>
          <span className="eyebrow">YOUR WORKING HYPOTHESIS</span>
          <p className="dialog-intro">
            What do you think the records suggest? Keep observations separate
            from explanations.
          </p>
          <label className="note-label">
            Your hypothesis
            <textarea
              autoFocus
              placeholder="I noticed… The evidence suggests…"
              value={active.hypothesis}
              onChange={(e) =>
                updateCase({ ...active, hypothesis: e.target.value })
              }
            />
          </label>
          <h3>Attach the evidence</h3>
          <p className="muted">
            Choose discovered clues that support your thinking.
          </p>
          <div className="hypothesis-clues">
            {clues.map((c) => (
              <label key={c.id}>
                <input
                  type="checkbox"
                  disabled={!active.discovered.includes(c.id)}
                  checked={active.hypothesisClues.includes(c.id)}
                  onChange={(e) =>
                    updateCase({
                      ...active,
                      hypothesisClues: e.target.checked
                        ? [...active.hypothesisClues, c.id]
                        : active.hypothesisClues.filter((id) => id !== c.id),
                    })
                  }
                />
                <span>
                  {active.discovered.includes(c.id)
                    ? c.title
                    : "Undiscovered clue — inspect it first"}
                </span>
              </label>
            ))}
          </div>
          <div className="notice">
            <ShieldCheck size={18} />
            <span>
              <b>{evaluateHypothesis(active).label}.</b>{" "}
              {evaluateHypothesis(active).explanation}
            </span>
          </div>
          <div className="dialog-actions">
            <button className="text-button" onClick={() => setModal(null)}>
              Keep investigating
            </button>
            <button
              className="button primary"
              onClick={() => {
                updateCase(completeCase(active));
                setModal("summary");
                notify("Case complete. Curiosity rewarded.");
              }}
            >
              <CheckCheck size={16} /> Complete case
            </button>
          </div>
        </Dialog>
      )}
      {modal === "summary" && active && (
        <Dialog title="Case complete." onClose={() => setModal(null)} wide>
          <div className="completion">
            <div className="completion-symbol">
              <CheckCheck size={31} />
            </div>
            <span className="eyebrow">YOU FOLLOWED THE EVIDENCE.</span>
            <h2>
              A little less mystery.
              <br />A lot more understanding.
            </h2>
            <p>
              These records reveal patterns, but cannot establish a definitive
              real-world cause.
            </p>
            <div className="preview-stats">
              <div>
                <b>{scoreCase(active).toLocaleString()}</b>
                <span>curiosity points</span>
              </div>
              <div>
                <b>
                  {active.discovered.length}/{clues.length}
                </b>
                <span>clues discovered</span>
              </div>
              <div>
                <b>{active.hypothesisClues.length}</b>
                <span>evidence attached</span>
              </div>
            </div>
          </div>
          <h3>Best-supported findings</h3>
          {clues
            .filter((c) => active.discovered.includes(c.id))
            .slice(0, 3)
            .map((c) => (
              <div className="summary-finding" key={c.id}>
                <CheckCircle2 size={18} />
                <div>
                  <b>{c.title}</b>
                  <p>{c.description}</p>
                </div>
              </div>
            ))}
          {!active.discovered.length && (
            <p className="muted">
              No clues inspected yet. Reopen the investigation to examine the
              evidence.
            </p>
          )}
          <div className="hypothesis-summary">
            <span className="tiny-label">YOUR HYPOTHESIS</span>
            <p>{active.hypothesis || "No hypothesis recorded."}</p>
            <small>
              {evaluateHypothesis(active).label}.{" "}
              {evaluateHypothesis(active).explanation}
            </small>
          </div>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => exportReport(active)}
            >
              <Download size={16} /> Export report
            </button>
            <button
              className="button primary"
              onClick={() => {
                setModal(null);
                setUpload(true);
              }}
            >
              Start another case <Plus size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {modal === "health" && active && (
        <Dialog title="Data health" onClose={() => setModal(null)} wide>
          <p className="dialog-intro">
            A clear picture of what’s present, what’s missing, and what needs
            care.
          </p>
          <div className="preview-stats">
            <div>
              <b>{fmt(active.dataset.rows.length)}</b>
              <span>rows</span>
            </div>
            <div>
              <b>{fmt(active.dataset.analysis.missing)}</b>
              <span>empty cells</span>
            </div>
            <div>
              <b>{fmt(active.dataset.analysis.duplicates)}</b>
              <span>repeated rows</span>
            </div>
          </div>
          <div className="health-list">
            {active.dataset.analysis.profiles.map((p) => (
              <div key={p.name}>
                <div>
                  <b>{p.name}</b>
                  <span>
                    {p.type} · {p.unique} unique values
                  </span>
                </div>
                <div>
                  {p.missing} empty{" "}
                  <span className="health-bar">
                    <i
                      style={{
                        width: `${100 * (1 - p.missing / active.dataset.rows.length)}%`,
                      }}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
          <details className="calculation">
            <summary>Numeric profiles & date coverage</summary>
            {active.dataset.analysis.profiles.map((p) => (
              <div className="profile-detail" key={p.name}>
                <b>{p.name}</b>
                {p.stats ? (
                  <p>
                    Min {fmt(p.stats.min)} · Max {fmt(p.stats.max)} · Mean{" "}
                    {fmt(p.stats.mean)} · Median {fmt(p.stats.median)} · SD{" "}
                    {fmt(p.stats.sd)} · Q1 {fmt(p.stats.p25)} · Q3{" "}
                    {fmt(p.stats.p75)} · IQR {fmt(p.stats.iqr)} · P05{" "}
                    {fmt(p.stats.p05)} · P95 {fmt(p.stats.p95)}
                  </p>
                ) : p.earliest ? (
                  <p>
                    {p.earliest.slice(0, 10)} — {p.latest?.slice(0, 10)} ·{" "}
                    {p.gaps} missing calendar days (gaps may be expected).
                  </p>
                ) : (
                  <p>
                    {p.frequencies
                      .slice(0, 8)
                      .map(([v, n]) => `${v}: ${n}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </details>
          <button
            className="button secondary full"
            onClick={() => {
              setEvidenceIds(
                active.dataset.analysis.clues
                  .filter((c) => c.type === "outlier")
                  .flatMap((c) => c.rowIds),
              );
              setModal(null);
              setPage("Data");
            }}
          >
            View unusual records <ArrowUpRight size={16} />
          </button>
          <button
            className="text-button"
            onClick={() =>
              download(
                toCSV(active.dataset.rows, active.dataset.columns),
                active.dataset.name,
                "text/csv",
              )
            }
          >
            <Download size={15} /> Export full CSV
          </button>
        </Dialog>
      )}
      {modal === "correlations" && active && (
        <Dialog
          title="How the numbers move together"
          wide
          onClose={() => setModal(null)}
        >
          <p className="dialog-intro">
            Pearson correlations using complete numeric pairs. A shared pattern
            does not establish a cause. At least three pairs and nonzero
            variance are needed.
          </p>
          <div className="table-container">
            <table className="correlation-table">
              <thead>
                <tr>
                  <th>r</th>
                  {active.dataset.analysis.profiles
                    .filter((p) => p.stats)
                    .slice(0, 12)
                    .map((p) => (
                      <th key={p.name}>{p.name}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {active.dataset.analysis.profiles
                  .filter((p) => p.stats)
                  .slice(0, 12)
                  .map((a) => (
                    <tr key={a.name}>
                      <th>{a.name}</th>
                      {active.dataset.analysis.profiles
                        .filter((p) => p.stats)
                        .slice(0, 12)
                        .map((b) => {
                          const pair =
                            active.dataset.analysis.correlations?.find(
                              (p) =>
                                (p.a === a.name && p.b === b.name) ||
                                (p.a === b.name && p.b === a.name),
                            );
                          const r = pair?.r || 0,
                            count = pair?.count || 0;
                          return (
                            <td
                              key={b.name}
                              title={`${count} pairs; ${Math.abs(r) > 0.7 ? "strong" : Math.abs(r) > 0.4 ? "moderate" : "weak"} ${r < 0 ? "negative" : "positive"} relationship`}
                              style={{
                                background:
                                  a.name !== b.name
                                    ? `color-mix(in srgb, ${r < 0 ? "#ba9ec9" : "#90ae6c"} ${Math.abs(r) * 45}%, transparent)`
                                    : undefined,
                              }}
                            >
                              {a.name === b.name
                                ? "—"
                                : count < 3
                                  ? "n/a"
                                  : r.toFixed(2)}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="table-note">
            −1 = opposite directions · 0 = no linear relationship · +1 = same
            direction. Up to 12 numeric columns shown. Constant columns have r =
            0 by convention.
          </p>
        </Dialog>
      )}
      {confirm && (
        <Dialog title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="dialog-intro">{confirm.description}</p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Confirm deletion <Trash2 size={15} />
            </button>
          </div>
        </Dialog>
      )}
      {rename && (
        <Dialog title="Rename your case" onClose={() => setRename(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renameText.trim()) {
                updateCase({ ...rename, title: renameText.trim() });
                setRename(null);
              }
            }}
          >
            <label className="note-label">
              Case title
              <input
                autoFocus
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                maxLength={150}
              />
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setRename(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={!renameText.trim()}
                type="submit"
              >
                Save title <Check size={15} />
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {restoreData && (
        <Dialog
          title="Bring your cases back."
          onClose={() => setRestoreData(null)}
        >
          <p className="dialog-intro">
            This backup contains {restoreData.cases.length} cases, including raw
            datasets, findings, notes, and progress. Preferences will be
            restored too.
          </p>
          <button
            className="button primary full"
            onClick={() => applyRestore(false)}
          >
            Merge with this workspace <Plus size={16} />
          </button>
          <button
            className="button danger full"
            onClick={() =>
              setConfirm({
                title: "Replace the workspace?",
                description:
                  "All current cases will be replaced by the backup. This cannot be undone unless you have exported your current workspace.",
                action: () => {
                  applyRestore(true);
                },
              })
            }
          >
            Replace existing data
          </button>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {!ready && (
        <div className="initial-loading" role="status">
          Opening your workspace…
        </div>
      )}
    </div>
  );
}
