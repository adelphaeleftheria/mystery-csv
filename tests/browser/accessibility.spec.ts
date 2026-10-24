import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("accessible home, import, investigation, evidence and settings", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".initial-loading")).toHaveCount(0);
  async function audit(name: string) {
    const a = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violations = a.violations.map((v) => ({
      id: v.id,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }));
    if (violations.length) console.log(name, JSON.stringify(violations));
    expect(violations, `${name} accessibility`).toEqual([]);
  }
  await audit("home");
  await page
    .getByRole("button", { name: "Try a mystery", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Begin investigation" }),
  ).toBeVisible();
  await audit("import");
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await page.getByRole("button", { name: "Reveal this clue" }).click();
  await audit("investigation");
  await page
    .getByRole("button", { name: "Inspect evidence", exact: true })
    .click();
  await audit("evidence");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await audit("dark investigation");
});
