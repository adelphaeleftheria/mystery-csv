import type { Case } from "../types";
export function discover(c: Case, id: string): Case {
  return c.discovered.includes(id)
    ? c
    : { ...c, discovered: [...c.discovered, id] };
}
export function evaluateHypothesis(c: Case) {
  const evidence = c.hypothesisClues.filter(
    (id) =>
      c.discovered.includes(id) &&
      c.dataset.analysis.clues.some((k) => k.id === id),
  );
  return {
    evidence,
    coverage: c.dataset.analysis.clues.length
      ? evidence.length / c.dataset.analysis.clues.length
      : 0,
    label:
      evidence.length >= 3
        ? "Well documented"
        : evidence.length
          ? "Some evidence attached"
          : "No evidence attached",
    explanation:
      "This measures documentation coverage, not whether your explanation is true. These records cannot establish causation.",
  };
}
export function scoreCase(c: Case) {
  return (
    c.discovered.length * 100 +
    evaluateHypothesis(c).evidence.length * 50 +
    (c.hypothesis.trim() ? 100 : 0)
  );
}
export function completeCase(c: Case): Case {
  return { ...c, status: "solved" };
}
