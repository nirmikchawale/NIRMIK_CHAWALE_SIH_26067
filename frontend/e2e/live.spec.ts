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

  const documentRoot = page.locator("html");
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-theme"))).toBe("light");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /OceanTwin/i })).toBeVisible();
  await expect(documentRoot).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Telemetry" }).click();
  await expect(page).toHaveURL(/#\/telemetry$/);
  const telemetryPage = page.locator('.telemetry-page[data-page="telemetry"]');
  await expect(telemetryPage).toBeVisible();
  await expect(telemetryPage).toContainText("Depth & telemetry workspace");
  await expect(telemetryPage).toHaveAttribute("data-depth-count", "31");
  await expect(telemetryPage).toHaveAttribute("data-time-count", "1");
  await expect(telemetryPage).toContainText("31");
  await expect(telemetryPage).toContainText("genuine model depths");
  await expect(telemetryPage).toContainText("1");
  await expect(telemetryPage).toContainText("genuine timestamps");
  await expect(telemetryPage).toContainText("TIME SERIES LOCKED");
  await expect(telemetryPage.locator(".telemetry-current-card")).toContainText("Mean speed");

  const telemetryInitialDepth = await telemetryPage.getAttribute("data-selected-depth");
  const telemetryDepth = telemetryPage.getByLabel("Telemetry depth");
  await telemetryDepth.focus();
  await telemetryDepth.press("Home");
  await expect(telemetryPage).not.toHaveAttribute("data-selected-depth", telemetryInitialDepth ?? "");

  await telemetryPage.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(telemetryPage).toHaveAttribute("data-variable", "so");
  await expect(telemetryPage.locator(".telemetry-depth-card")).toContainText("Salinity");

  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);
  const dataLabPage = page.locator('.data-lab-page[data-page="data-lab"]');
  await expect(dataLabPage).toBeVisible();
  await expect(dataLabPage).toContainText("Additional dataset lab");
  await expect(dataLabPage).toContainText("Data stays in this browser session");

  const validCsv = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source",
    "68.10,13.10,10,2020-07-01T00:00:00Z,temperature,28.2,degree_Celsius,judge_sample",
    "68.20,13.20,50,2020-07-01T00:00:00Z,temperature,25.4,degree_Celsius,judge_sample",
    "68.10,13.10,10,2020-07-01T00:00:00Z,salinity,35.1,1e-3,judge_sample",
    "68.20,13.20,50,2020-07-01T00:00:00Z,salinity,35.0,1e-3,judge_sample"
  ].join("\n");

  await dataLabPage.getByLabel("Ocean dataset file").setInputFiles({
    name: "judge_valid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(validCsv)
  });
  await expect(dataLabPage.locator(".data-lab-status.valid")).toContainText("VALIDATED");
  await expect(dataLabPage).toHaveAttribute("data-row-count", "4");
  await expect(dataLabPage).toContainText("Only one genuine timestamp is present");
  await expect(dataLabPage.locator(".data-lab-variable-grid article")).toHaveCount(2);
  await expect(dataLabPage.getByRole("button", { name: "Download validation report" })).toBeEnabled();

  const invalidCsv = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source",
    "68.10,95,10,2020-07-01T00:00:00Z,temperature,28.2,,judge_sample"
  ].join("\n");
  await dataLabPage.getByLabel("Ocean dataset file").setInputFiles({
    name: "judge_invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(invalidCsv)
  });
  await expect(dataLabPage.locator(".data-lab-status.invalid")).toContainText("REJECTED");
  await expect(dataLabPage).toContainText("Latitude must be between -90 and 90 degrees.");
  await expect(dataLabPage).toContainText("Units are required.");

  await page.getByRole("button", { name: "Model vs Observation" }).click();
  await expect(page).toHaveURL(/#\/compare$/);
  const comparisonPage = page.locator('.comparison-page[data-page="compare"]');
  await expect(comparisonPage).toBeVisible();
  await expect(comparisonPage).toContainText("Argo–GLORYS12V1 profile comparison");
  await expect(comparisonPage).toContainText("Matched levels");
  await expect(comparisonPage).toContainText("Observed vs interpolated model temperature");
  await expect(comparisonPage).toContainText("Model − Observation by depth");
  await expect(comparisonPage).toContainText("Depth-by-depth evidence table");
  await expect(comparisonPage).toContainText("not independent validation");

  const comparisonSelect = comparisonPage.locator("select");
  const initialComparisonProfile = await comparisonPage.locator(".comparison-selector-meta strong").textContent();
  await comparisonSelect.selectOption({ index: 1 });
  await expect(comparisonPage.locator(".comparison-selector-meta strong")).not.toHaveText(initialComparisonProfile ?? "");
  expect(await comparisonPage.locator(".comparison-table-wrap tbody tr").count()).toBeGreaterThan(0);
  await expect(comparisonPage.getByRole("button", { name: "Download comparison CSV" })).toBeEnabled();
  await expect(comparisonPage.getByRole("button", { name: "Download evidence JSON" })).toBeEnabled();

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
  await expect(page.getByRole("button", { name: "Water-column 3D" })).toBeDisabled();

  await page.getByRole("button", { name: /Temperature/i }).click();
  const waterColumnButton = page.getByRole("button", { name: "Water-column 3D" });
  await expect(waterColumnButton).toBeEnabled();
  await waterColumnButton.click();

  const waterColumnShell = page.locator(".water-column-shell");
  await expect(waterColumnShell).toBeVisible();
  await expect(page.locator(".water-column-canvas")).toBeVisible();
  await expect(waterColumnShell).toHaveAttribute("data-depth-count", "31");
  await expect(page.locator(".water-column-selected")).toContainText("Depth (m, positive down)");
  await expect(page.locator(".water-column-selected")).toContainText("SELECTED LAYER");

  const opacitySlider = page.getByLabel("Point opacity");
  await opacitySlider.focus();
  await opacitySlider.press("End");
  await expect(waterColumnShell).toHaveAttribute("data-opacity", "0.95");

  const waterColumnCanvas = page.locator(".water-column-canvas");
  const initialYaw = await waterColumnShell.getAttribute("data-yaw");
  await waterColumnCanvas.focus();
  await waterColumnCanvas.press("ArrowLeft");
  await expect(waterColumnShell).not.toHaveAttribute("data-yaw", initialYaw ?? "");

  const selectedLayer = page.locator(".water-column-selected");
  const initialSelectedLayer = await selectedLayer.textContent();
  const waterColumnDepthSlider = page
    .locator(".control-panel section")
    .filter({ hasText: "Water column" })
    .locator('input[type="range"]')
    .first();
  await waterColumnDepthSlider.focus();
  await waterColumnDepthSlider.press("Home");
  await expect(selectedLayer).not.toHaveText(initialSelectedLayer ?? "");

  await page.getByRole("button", { name: "Cesium Globe" }).click();
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

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
  await depthSlider.press("End");
  await expect(depthIndicator).not.toHaveText(initialDepth ?? "");

  const profileSelect = page.locator(".control-panel select");
  const initialProfile = await page.locator(".profile-heading p").textContent();
  await profileSelect.selectOption({ index: 0 });
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

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("oceantwin-theme"))).toBe("dark");

  expect(pageErrors).toEqual([]);
});
