import { parseCSV } from "../lib/csv";
import { analyze } from "../lib/analysis/clueGenerator";
self.onmessage = (e) => {
  try {
    self.postMessage({ stage: "Reading the records…" });
    const parsed = e.data.text !== undefined ? parseCSV(e.data.text) : e.data;
    self.postMessage({ stage: "Connecting the evidence…" });
    const analysis = analyze(
      parsed.rows,
      parsed.columns,
      parsed.warnings || [],
      e.data.overrides,
    );
    self.postMessage({ result: { ...parsed, analysis } });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "This dataset could not be analyzed.",
    });
  }
};
