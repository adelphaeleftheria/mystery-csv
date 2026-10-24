import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
test("complete investigation, persistence, export, clear and restore", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome, detective." }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Try a mystery", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The scene is set." }),
  ).toBeVisible();
  await expect(page.getByText("720", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await expect(
    page.getByRole("heading", { name: "The midnight anomaly", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal this clue" }).click();
  await page
    .getByRole("button", { name: "Inspect evidence", exact: true })
    .click();
  await expect(page.getByText("Show calculation · how we know")).toBeVisible();
  await expect(page.locator("dialog tbody tr")).toHaveCount(8);
  await page
    .locator("dialog")
    .getByPlaceholder("A connection worth remembering…")
    .fill("Investigate this date.");
  await page.getByRole("button", { name: "Save finding", exact: true }).click();
  await page.screenshot({
    path: `test-results/evidence-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open in dataset" }).click();
  await expect(
    page.getByRole("heading", { name: "The dataset." }),
  ).toBeVisible();
  await page.getByPlaceholder("Search any value…").fill("West");
  await expect(page.locator("tbody tr")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Add filter" }).click();
  await page.getByLabel("Filter column").selectOption("revenue");
  await page.getByLabel("Filter operator").selectOption(">");
  await page.getByLabel("Filter value").fill("1000");
  await expect(page.locator("tbody tr")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Visualize filtered records" })
    .click();
  await expect(page.locator(".filtered-chart")).toContainText(
    "6 matching rows",
  );
  await page
    .getByRole("button", { name: /Inspect row / })
    .first()
    .click();
  await page
    .getByPlaceholder("What stands out about this record?")
    .fill("A large order worth reviewing.");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Export filtered CSV" }).click();
  await page
    .getByRole("navigation")
    .filter({ has: page.getByRole("button", { name: "Explore", exact: true }) })
    .first()
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await page.getByRole("button", { name: "Your hypothesis" }).click();
  await page
    .getByPlaceholder("I noticed… The evidence suggests…")
    .fill(
      "The peak day includes unusually large orders. The cause is not established.",
    );
  await page.locator(".hypothesis-clues input:not([disabled])").first().check();
  await page
    .getByRole("button", { name: "Complete case", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Case complete.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  if (testInfo.project.name === "desktop")
    await page.getByRole("button", { name: "Settings & help" }).click();
  else
    await page.getByRole("button", { name: "Settings", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup" }).click();
  const downloaded = await downloadPromise;
  const path = testInfo.outputPath("backup.json");
  await downloaded.saveAs(path);
  const backup = JSON.parse(await fs.readFile(path, "utf8"));
  expect(backup.cases).toHaveLength(1);
  expect(backup.cases[0].status).toBe("solved");
  expect(backup.cases[0].notes).toMatchObject({
    [backup.cases[0].discovered[0]]: "Investigate this date.",
  });
  await page.getByRole("button", { name: "Clear local data" }).click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await page.getByLabel("Choose backup file").setInputFiles(path);
  await page.getByRole("button", { name: "Merge with this workspace" }).click();
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: "The midnight anomaly", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Cases", exact: true })
    .first()
    .click();
  await expect(page.getByText("Complete", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("uploads quoted Unicode CSV and changes a column type", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Upload a CSV", exact: true }).click();
  await page.getByLabel("Choose CSV file").setInputFiles({
    name: "unicode.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      'name,amount,note\n"Zoë, 李",42,"A quoted, comma"\nAna,100,"<img src=x onerror=alert(1)>"\nMax,,empty',
    ),
  });
  await expect(
    page.getByRole("heading", { name: "unicode.csv" }),
  ).toBeVisible();
  await page.getByLabel("Type for amount").selectOption("currency");
  await expect(page.getByLabel("Type for amount")).toHaveValue("currency");
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await expect(
    page.getByRole("heading", { name: "unicode", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Data", exact: true }).first().click();
  await expect(page.getByText("Zoë, 李", { exact: true })).toBeVisible();
  await expect(
    page.getByText("<img src=x onerror=alert(1)>", { exact: true }),
  ).toBeVisible();
  expect(await page.locator("tbody img").count()).toBe(0);
});
test("dialog keyboard focus and theme", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".initial-loading")).toHaveCount(0);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.keyboard.press("u");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: `test-results/dark-${info.project.name}.png`,
    fullPage: true,
  });
});
