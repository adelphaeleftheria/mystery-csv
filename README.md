# Mystery CSV

**Your data is hiding something.** Drop in a CSV. Follow the evidence.

Mystery CSV is a browser-only data investigation studio built with React, TypeScript, Vite, Papa Parse, Recharts, Web Workers, and IndexedDB. No account, backend, API key, tracking, or AI service is required. All fonts ship with the application; uploaded data is never transmitted.

## Develop

Use Node.js 22 or newer (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

In restricted cloud workspaces where the default npm cache is unwritable:

```sh
npm ci --cache /workspace/.npm-cache
```

The dev server listens on port 5173. `npm run build` type-checks and creates `dist/`. `npm run preview` serves the production build.

## The investigation loop

1. Upload a CSV or choose one of four built-in cases. The daily mystery uses a date-based deterministic seed.
2. Inspect the dataset profile and correct column types. Choose Mystery mode to reveal findings progressively or Explore mode to see them immediately.
3. Open a case, reveal a clue, and inspect its chart, exact supporting records, and calculation.
4. Follow the trail into the dataset. Search, sort, combine filters, hide columns, select rows, and export the filtered CSV. Numeric and ISO date comparisons are supported.
5. Bookmark clues, write field notes, and attach evidence to a working hypothesis.
6. Complete the case for a summary and curiosity score. Export a Markdown report, an individual `.mystery` case, or a complete JSON backup.
7. Reopen cases after a refresh. Restore a backup by merging cases by ID or explicitly confirming replacement.

History, case duplication, renaming, deletion, activity statistics, appearance preferences, reduced motion, and keyboard shortcuts are available in the workspace. On mobile, Saved and Statistics are accessible from the workspace menu in Settings. Cases are local to the current browser and origin; export a backup before clearing browser storage or switching devices. Backups include raw data and should be treated as private files.

## Analysis that shows its work

The analysis runs in a dedicated worker, including parsing and profiling. UI charts load lazily. Tables render at most 50 records per page, including for large files.

- **Types:** numbers, explicitly formatted currencies/percentages, ISO and common delimited dates, datetimes, booleans, categories, identifiers, text. Column names alone do not turn numbers into currencies. Percentages are analyzed in percentage points; currency symbols are stripped for arithmetic without currency conversion. Mixed currencies require cleaning first. Invalid/non-numeric values are excluded from numeric statistics; raw values remain unchanged.
- **Profiles:** row/column counts, empty cells, distinct counts, exact duplicates, top frequencies (50 values retained), date coverage and calendar gaps. Numeric min/max, mean, median, population standard deviation, interpolated percentiles, quartiles and IQR are available under Data Health.
- **Outliers:** Tukey fences, `Q1 − 1.5 IQR` and `Q3 + 1.5 IQR`. Zero-IQR series use distance from median greater than three population standard deviations. At least 8 observations; flags affecting 20% or more of rows are suppressed.
- **Spikes:** sum by observed UTC day; peak must exceed 1.8 times the median day and the upper Tukey fence. At least seven observed days. Missing days are excluded, not imputed as zero. Record volume can explain changes.
- **Trends:** compare mean daily totals in chronological halves; absolute relative difference above 60%. Descriptive, without seasonal adjustment.
- **Correlations:** Pearson's r using complete numeric pairs; clue threshold `|r| ≥ 0.7` and at least 12 pairs. Matrix values are computed in the worker. Constant columns use zero by convention. Scatter plots show at most 500 evenly sampled pairs; the statistic uses every valid pair.
- **Categories:** compare a group's arithmetic mean with the pooled mean of other groups; minimum five records per eligible group, ratio at least 1.7, positive comparison mean. Concentration clues require at least 65% of nonempty category records.
- **Quality:** exact repeated rows, blank/whitespace cells, disproportionate missingness by category, and rare categorical pairs. Empty means blank, not strings such as `N/A`.

Candidates are ranked with transparent screening weights for magnitude and sample-size reliability, with at most two clues per type and twelve total. These are **heuristics, not p-values or causal probabilities**. Numeric pair screening is limited to the first 16 numeric columns, group comparisons to eight categorical and six numeric columns, and time analysis to one date and six numeric columns. A dataset may yield fewer than five clues, or none. Mystery difficulty limits the clue count; it never alters the records. Easy is capped at five, Medium at eight, Hard at ten, and Expert at twelve, further limited by the user's setting.

Hypothesis feedback measures how much discovered evidence the user attached. It does **not** score a natural-language explanation as factually correct. Curiosity points reward discovery and documentation, never speed or unsupported certainty. “Complete” means the investigation was concluded, not that a cause was proven.

Supported question templates include `highest [numeric column]`, `average [numeric column]`, `most common [category]`, and `how many missing values?`. Unsupported questions receive guidance, not an invented answer. The parser, analysis, and case-state modules are independent of React and can support a future explainer adapter.

## Input and security

UTF-8, Unicode, quoted fields, escaped quotes, commas inside fields, common delimiters, missing values, and duplicate/blank header names are handled. Inconsistent field counts are reported. Missing trailing fields become empty; extra fields are explicitly reported and omitted. A header row is expected. A fully headerless file should be given headers before import. Empty headers receive stable generated names. ISO dates are recommended; ambiguous slash dates follow JavaScript's date interpretation.

Limits are 100 MB per CSV, 200,000 records, and 150 columns. These are safety limits, not a guarantee of performance on every device. Very wide files, high-cardinality strings, and large backup files may use substantial browser memory. Backups are validated and limited to 150 MB on import. Dataset search and sorting run locally; analysis runs off the main thread.

CSV values are rendered as text through React. Nothing from a dataset is evaluated as code or HTML. CSV exports prefix formula-like text to reduce spreadsheet formula injection; raw saved values remain unchanged. Reports list the first 100 supporting row numbers per clue; `.mystery` exports retain the complete evidence list and raw dataset.

## Tests

```sh
npm test                 # parser, inference, stats, clues, case state, backup validation, 1k–100k benchmarks
npm run build            # strict TypeScript and production build
npm run test:e2e         # desktop/mobile journeys and axe accessibility audits
```

Browser tests use Chromium at `/usr/bin/chromium` by default. For another installed browser:

```sh
CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

On a machine without Chromium, install Playwright's browser with `npx playwright install chromium`, the test configuration will automatically use it when system Chromium is unavailable. Browser tests cover upload, type correction, unsafe text rendering, clue discovery, charts and evidence, dataset filters, notes, hypotheses, completion, refresh persistence, backup, clearing, restoration, light/dark modes, and dialog keyboard behavior. Axe covers core screens in both themes; automated checks complement manual keyboard and responsive inspection rather than establishing complete WCAG conformance.

## GitHub Pages

The included `.github/workflows/deploy.yml` builds on pushes to `main` and manual workflow dispatches. It tests, builds, and deploys with GitHub's official Pages actions.

1. Push this project to a GitHub repository.
2. Open **Repository Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Push to `main` or run **Actions → Deploy Mystery CSV → Run workflow**.
4. After the workflow succeeds, Pages provides `https://USERNAME.github.io/REPOSITORY/`.

The workflow sets `VITE_BASE_PATH` to `/<repository-name>/`. Local builds default to relative asset URLs (`./`) and also support nested hosting paths. For a custom deployment:

```sh
VITE_BASE_PATH=/your-subpath/ npm run build
```

Navigation uses local UI state, so there are no server-side routes or GitHub Pages refresh 404s. A custom domain hosted at the root can build with `VITE_BASE_PATH=/`. Publishing and remote deployment are separate from a local successful build; this project does not push or publish itself.

## Project layout

```
src/
  App.tsx                   Workspace and journey orchestration
  components/               Accessible dialog, lazy charts, bounded data explorer
  lib/
    analysis/               Type detection, profiler, statistics, clue generation
    csv.ts                  Parsing and safe CSV export
    samples.ts              Seeded sample generators
    investigation.ts        Discovery, evidence coverage, score, completion
    storage.ts              IndexedDB and backup validation
  workers/                  Off-main-thread CSV analysis pipeline
  types/                    Shared domain models
  styles.css                Responsive design system, light/dark themes
```

Optional graph visualization, chart image export, PDF generation, and semantic natural-language analysis are intentionally outside this first version. All primary actions shown in the product are implemented.
