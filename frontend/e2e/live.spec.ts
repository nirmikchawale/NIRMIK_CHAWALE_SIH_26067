import { expect, test } from "@playwright/test";

const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("live OceanTwin judge flow renders and core interactions work", async ({ page }) => {
  if (!liveUrl) {
    throw new Error("OCEANTWIN_LIVE_URL is required for live browser verification.");
  }

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(liveUrl, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /OceanTwin/i })).toBeVisible();

  await page.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  await expect(page.locator('.feature-page[data-page="telemetry"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Telemetry workspace" })).toBeVisible();

  await page.getByRole("button", { name: "3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);
  await expect(page.locator(".judge-summary")).toContainText("INDIAN OCEAN");
  await expect(page.locator(".judge-summary")).toContainText("Argo comparison profiles");
  await expect(page.locator(".profile-panel")).toContainText("Argo");
  await expect(page.locator(".profile-panel")).toContainText("Matched levels");
  await expect(page.locator(".profile-panel")).toContainText("Bias by depth");
  await expect(page.getByText("Diagnostic model–observation consistency, not independent validation.")).toBeVisible();

  const playButton = page.locator(".play-button");
  await expect(playButton).toBeDisabled();
  await expect(
    page.getByText("Playback is intentionally disabled—no synthetic second timestamp is created.")
  ).toBeVisible();

  await page.getByRole("button", { name: /Salinity/i }).click();
  await expect(page.locator(".legend-card")).toContainText("Salinity");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: /Currents/i }).click();
  await expect(page.locator(".current-note")).toContainText("HORIZONTAL u/v FLOW");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: /Temperature/i }).click();
  await page.getByRole("button", { name: "3D field" }).click();
  await expect(page.locator(".volume-note")).toContainText("3D WATER COLUMN");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: "Depth slice" }).click();
  const depthIndicator = page.locator(".depth-indicator");
  const initialDepth = await depthIndicator.textContent();
  const depthSlider = page
    .locator(".control-panel section")
    .filter({ hasText: "Water column" })
    .locator('input[type="range"]')
    .first();

  await depthSlider.focus();
  await depthSlider.press("Home");
  await expect(depthIndicator).not.toHaveText(initialDepth ?? "");

  const profileSelect = page.locator(".control-panel select");
  const initialProfile = await page.locator(".profile-heading p").textContent();
  await profileSelect.selectOption({ index: 1 });
  await expect(page.locator(".profile-heading p")).not.toHaveText(initialProfile ?? "");
  await expect(page.locator(".qc-pill")).toHaveText("QC ACCEPTED");

  await page.getByRole("button", { name: "Sources & QC" }).click();
  await expect(page.locator(".provenance-drawer")).toBeVisible();
  await expect(page.locator(".provenance-drawer")).toContainText("Copernicus");
  await expect(page.locator(".provenance-drawer")).toContainText("Ifremer Argo GDAC");
  await page.locator(".drawer-heading button").click();
  await expect(page.locator(".provenance-drawer")).toHaveCount(0);

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/^OceanTwin_Argo_.*_comparison\.csv$/);

  await page.getByRole("button", { name: "Focus 3D" }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/focus-mode/);
  await expect(page.getByRole("button", { name: "Show panels" })).toBeVisible();
  await page.getByRole("button", { name: "Show panels" }).click();
  await expect(page.locator(".app-shell")).not.toHaveClass(/focus-mode/);

  expect(pageErrors).toEqual([]);
});
