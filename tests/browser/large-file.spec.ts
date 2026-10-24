import { test, expect } from "@playwright/test";
test("100,000 rows analyze in a worker while the interface remains responsive", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".initial-loading")).toHaveCount(0);
  const csv =
    "date,group,value,related\n" +
    Array.from(
      { length: 100000 },
      (_, i) =>
        `2025-03-${String((i % 28) + 1).padStart(2, "0")},${["North", "South", "East", "West"][i % 4]},${i === 123 ? 100000 : 10 + (i % 40)},${20 + (i % 40) * 2}`,
    ).join("\n");
  await page.getByRole("button", { name: "Upload a CSV", exact: true }).click();
  await page.evaluate(() => {
    (window as unknown as { analysisFrames: number }).analysisFrames = 0;
    const tick = () => {
      if (document.querySelector(".analysis-loading"))
        (window as unknown as { analysisFrames: number }).analysisFrames++;
      if (!document.querySelector(".upload-success"))
        requestAnimationFrame(tick);
    };
    setTimeout(tick, 20);
  });
  await page.getByLabel("Choose CSV file").setInputFiles({
    name: "large.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await expect(page.getByText("100,000", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Begin investigation" }).click();
  await expect(
    page.getByRole("heading", { name: "large", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Data", exact: true }).first().click();
  await expect(page.locator("tbody tr")).toHaveCount(50);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByLabel("Select row 51", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { analysisFrames: number }).analysisFrames,
    ),
  ).toBeGreaterThan(2);
});
