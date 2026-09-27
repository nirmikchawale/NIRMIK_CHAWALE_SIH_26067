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
  const imageryGlobeShell = page.locator(".globe-shell").first();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "auto");
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-failsafe", "online-hd+offline-natural-earth");
  await expect(page.getByRole("button", { name: "High-res auto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Offline", exact: true })).toBeVisible();
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(online|offline|grid)$/);

  await page.getByRole("button", { name: "Offline", exact: true }).click();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "offline");
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(offline|grid)$/);

  await page.getByRole("button", { name: "High-res auto" }).click();
  await expect(imageryGlobeShell).toHaveAttribute("data-imagery-preference", "auto");
  await expect.poll(async () => (await imageryGlobeShell.getAttribute("data-imagery-status")) ?? "")
    .toMatch(/^(online|offline|grid)$/);


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
  const depthLadder = telemetryPage.locator(".telemetry-depth-ladder");
  await expect(depthLadder).toBeVisible();
  await expect(depthLadder).toContainText("Jump to any verified model depth");
  await expect(depthLadder.locator("button")).toHaveCount(31);
  const depthNeighborhood = telemetryPage.locator(".telemetry-neighborhood-card");
  await expect(depthNeighborhood).toBeVisible();
  await expect(depthNeighborhood).toContainText("Local mean gradient");
  await expect(depthNeighborhood).toContainText("Selected P10–P90 span");
  await expect(depthNeighborhood).toContainText("descriptive vertical-change diagnostic");

  const telemetryInitialDepth = await telemetryPage.getAttribute("data-selected-depth");
  const telemetryDepth = telemetryPage.getByRole("slider", { name: "Telemetry depth", exact: true });
  await telemetryDepth.focus();
  await telemetryDepth.press("Home");
  await expect(telemetryPage).not.toHaveAttribute("data-selected-depth", telemetryInitialDepth ?? "");

  const firstDepthFromSlider = await telemetryPage.getAttribute("data-selected-depth");
  await depthLadder.getByRole("button", { name: /Select telemetry depth/ }).nth(10).click();
  await expect(telemetryPage).not.toHaveAttribute("data-selected-depth", firstDepthFromSlider ?? "");
  await expect(depthNeighborhood.locator("tbody tr.selected")).toHaveCount(1);

  await telemetryPage.getByRole("button", { name: "Salinity telemetry" }).click();
  await expect(telemetryPage).toHaveAttribute("data-variable", "so");
  await expect(telemetryPage.locator(".telemetry-depth-card")).toContainText("Salinity");

  await page.getByRole("button", { name: "Anomaly Screening" }).click();
  await expect(page).toHaveURL(/#\/anomaly$/);
  const anomalyPage = page.locator('.anomaly-page[data-page="anomaly"]');
  await expect(anomalyPage).toBeVisible();
  await expect(anomalyPage).toContainText("Anomaly screening");
  await expect(anomalyPage).toContainText("|robust z| ≥ 3.5");
  await expect(anomalyPage).toContainText("TEMPORAL SCREEN LOCKED");
  await expect(anomalyPage).toContainText("not proof of an ocean event");
  await expect(anomalyPage.locator(".anomaly-residual-table tbody tr").first()).toBeVisible();
  const anomalyInspector = anomalyPage.locator(".anomaly-explainable-workspace");
  await expect(anomalyInspector).toBeVisible();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "spatial");
  await expect(anomalyInspector).toContainText("Why is this point flagged?");
  await expect(anomalyInspector).toContainText("Magnitude bands describe statistical departure only");
  await expect(anomalyPage.getByRole("button", { name: "Download screening evidence" })).toBeEnabled();
  await expect(anomalyPage.locator(".anomaly-flag-map svg")).toBeVisible();
  await anomalyPage.getByRole("button", { name: "Argo residual" }).click();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "residual");
  await expect(anomalyInspector).toContainText("Residual flags by depth");
  await expect(anomalyPage.locator(".anomaly-residual-ranks")).toBeVisible();
  await anomalyPage.getByRole("button", { name: "Model cell" }).click();
  await expect(anomalyInspector).toHaveAttribute("data-focus-screen", "spatial");

  const anomalyInitialDepth = await anomalyPage.getAttribute("data-depth-index");
  const anomalyDepth = anomalyPage.getByLabel("Anomaly depth");
  await anomalyDepth.focus();
  await anomalyDepth.press("Home");
  await expect(anomalyPage).not.toHaveAttribute("data-depth-index", anomalyInitialDepth ?? "");

  await anomalyPage.getByRole("button", { name: "Salinity" }).click();
  await expect(anomalyPage).toHaveAttribute("data-variable", "so");
  await expect(anomalyPage).toContainText("Salinity spatial statistical extremes");

  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);
  const dataLabPage = page.locator('.data-lab-page[data-page="data-lab"]');
  await expect(dataLabPage).toBeVisible();
  await expect(dataLabPage).toContainText("Additional dataset lab");
  await expect(dataLabPage).toContainText("Data stays in this browser session");
  await expect(dataLabPage).toContainText("Official data launchpad");
  await expect(dataLabPage.locator(".data-source-card")).toHaveCount(3);
  await expect(dataLabPage).toContainText("GLORYS12V1 global ocean physics reanalysis");
  await expect(dataLabPage).toContainText("Argo global profiling-float observations");
  await expect(dataLabPage).toContainText("Indian Ocean official data access portal");
  await expect(dataLabPage).toContainText("Reshape to OceanTwin schema");
  const officialLinks = dataLabPage.locator(".data-source-actions a");
  await expect(officialLinks).toHaveCount(3);
  await expect(officialLinks.nth(0)).toHaveAttribute("href", /data\.marine\.copernicus\.eu/);
  await expect(officialLinks.nth(1)).toHaveAttribute("href", /data-argo\.ifremer\.fr/);
  await expect(officialLinks.nth(2)).toHaveAttribute("href", /las\.incois\.gov\.in/);
  await expect(officialLinks.nth(0)).toHaveAttribute("target", "_blank");

  const validCsv = [
    "longitude,latitude,depth_m,timestamp,variable,value,units,source,platform_id,sensor_type",
    "68.10,13.10,10,2020-07-01T00:00:00Z,temperature,28.2,degree_Celsius,judge_sample,glider_demo_01,glider",
    "68.10,13.10,50,2020-07-01T00:00:00Z,temperature,25.4,degree_Celsius,judge_sample,glider_demo_01,glider",
    "68.10,13.10,10,2020-07-01T00:00:00Z,salinity,35.1,1e-3,judge_sample,glider_demo_01,glider",
    "68.10,13.10,50,2020-07-01T00:00:00Z,salinity,35.0,1e-3,judge_sample,glider_demo_01,glider"
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
  await expect(dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" })).toBeEnabled();
  await dataLabPage.getByRole("button", { name: "Load validated profiles into 3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  const importedGlobeShell = page.locator(".globe-shell:not(.water-column-shell)");
  await expect.poll(async () => Number(await importedGlobeShell.getAttribute("data-imported-profile-count"))).toBeGreaterThanOrEqual(4);
  await expect(page.locator(".judge-summary")).toContainText("sensor plugin profiles");
  const importedSelector = page.locator(".imported-observation-chips");
  await expect(importedSelector).toContainText("GLIDER");
  await expect(importedSelector).toContainText("CTD");
  await expect(importedSelector).toContainText("BGC");
  await importedSelector.getByRole("button", { name: /GLIDER.*glider_demo_01/i }).click();
  await expect(page.locator(".imported-profile-panel")).toBeVisible();
  await expect(page.locator(".imported-profile-panel")).toContainText("Glider");
  await expect(page.locator(".imported-profile-panel")).toContainText("temperature vs depth");
  await page.getByRole("button", { name: "Data Lab", exact: true }).click();
  await expect(page).toHaveURL(/#\/data-lab$/);

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
  const comparisonInspector = comparisonPage.locator(".comparison-depth-inspector");
  await expect(comparisonInspector).toBeVisible();
  await expect(comparisonInspector).toContainText("Depth-resolved inspector");
  await expect(comparisonPage.locator(".comparison-diagnostic-summary")).toContainText("Warm / cool split");
  await expect(comparisonPage.locator(".comparison-collocation-map svg")).toBeVisible();
  await expect(comparisonPage.locator(".comparison-method-pipeline")).toContainText("Provider QC");
  await expect(comparisonPage.locator(".comparison-method-pipeline")).toContainText("No extrapolation");

  const comparisonDepth = comparisonPage.getByLabel("Matched comparison depth");
  const initialInspectedDepth = await comparisonInspector.locator(".comparison-card-heading > strong").textContent();
  await comparisonDepth.focus();
  await comparisonDepth.press("End");
  await expect(comparisonInspector.locator(".comparison-card-heading > strong")).not.toHaveText(initialInspectedDepth ?? "");
  await expect(comparisonInspector).toContainText("Argo observed");
  await expect(comparisonInspector).toContainText("Model interpolated");
  await expect(comparisonInspector).toContainText("Bias M−O");

  const comparisonSelect = comparisonPage.locator("select");
  const initialComparisonProfile = await comparisonPage.locator(".comparison-selector-meta strong").textContent();
  await comparisonSelect.selectOption({ index: 1 });
  await expect(comparisonPage.locator(".comparison-selector-meta strong")).not.toHaveText(initialComparisonProfile ?? "");
  expect(await comparisonPage.locator(".comparison-table-wrap tbody tr").count()).toBeGreaterThan(0);
  await expect(comparisonPage.getByRole("button", { name: "Download comparison CSV" })).toBeEnabled();
  await expect(comparisonPage.getByRole("button", { name: "Download evidence JSON" })).toBeEnabled();

  await page.getByRole("button", { name: "Science & System", exact: true }).first().click();
  await expect(page).toHaveURL(/#\/about$/);
  const infoPage = page.locator('.info-page[data-page="about"]');
  await expect(infoPage).toBeVisible();
  await expect(infoPage).toHaveAttribute("data-info-status", "implemented");
  await expect(infoPage).toContainText("SIH26067");
  await expect(infoPage).toContainText("What the final MVP actually does");
  await expect(infoPage).toContainText("Water-Column 3D");
  await expect(infoPage).toContainText("No synthetic timestamps");
  await expect(infoPage).toContainText("RECOMMENDED DEMO FLOW");

  await page.getByRole("button", { name: "3D Explorer" }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);
  const globeShell = page.locator(".globe-shell:not(.water-column-shell)");
  await expect(globeShell).toHaveAttribute("data-render-quality", "high");
  await expect.poll(async () => Number(await globeShell.getAttribute("data-render-scale"))).toBeGreaterThanOrEqual(1.5);
  await expect(globeShell).toHaveAttribute("data-antialiasing", /MSAA|FXAA/);
  await expect(page.locator(".render-quality-line")).toContainText("HD canvas");
  await expect(page.locator(".judge-summary")).toContainText("INDIAN OCEAN");
  await expect(page.locator(".judge-summary")).toContainText("Argo comparison profiles");
  await expect(page.locator(".profile-panel")).toHaveCount(0);

  const modeDock = page.locator('.visualization-dock[data-visualization-mode="globe"]');
  await expect(modeDock).toBeVisible();
  await expect(modeDock).toContainText("DUAL 3D VISUALIZATION");
  await expect(modeDock.getByRole("button", { name: /Geographic View/ })).toBeVisible();
  await expect(modeDock.getByRole("button", { name: /Water Column 3D/ })).toBeVisible();

  const initialGlobeHeight = Number(await globeShell.getAttribute("data-camera-height"));
  await page.getByRole("button", { name: "Zoom in Ocean Globe" }).click();
  await expect.poll(async () => Number(await globeShell.getAttribute("data-camera-height"))).toBeLessThan(initialGlobeHeight);

  await expect(page.locator(".play-button")).toHaveCount(0);
  await expect(page.locator(".static-time-row")).toContainText("2024-01-02");
  await expect(page.locator(".static-time-row")).toContainText("Verified model timestamp · static snapshot");

  await page.getByRole("button", { name: /Salinity/i }).click();
  await expect(page.locator(".legend-card")).toContainText("Salinity");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: /Currents/i }).click();
  await expect(page.locator(".current-note")).toContainText("HORIZONTAL u/v FLOW");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Water Column 3D/ })).toBeDisabled();

  await page.getByRole("button", { name: /Temperature/i }).click();
  const waterColumnButton = page.getByRole("button", { name: /Water Column 3D/ });
  await expect(waterColumnButton).toBeEnabled();
  await waterColumnButton.click();

  const waterColumnShell = page.locator(".water-column-shell");
  await expect(waterColumnShell).toBeVisible();
  await expect(page.locator(".water-column-canvas")).toBeVisible();
  await expect(waterColumnShell).toHaveAttribute("data-depth-count", "31");
  await expect(page.locator(".water-column-selected")).toContainText("Depth (m, positive down)");
  await expect(page.locator(".water-column-selected")).toContainText("SELECTED LAYER");
  await expect(page.locator(".water-column-axis-key")).toContainText("Depth m ↓");
  await expect(page.locator(".water-column-smooth-zoom")).toBeVisible();

  const initialWaterZoom = Number(await waterColumnShell.getAttribute("data-zoom"));
  await page.getByRole("button", { name: "Zoom in Water-Column 3D" }).click();
  await expect.poll(async () => Number(await waterColumnShell.getAttribute("data-zoom"))).toBeGreaterThan(initialWaterZoom);

  const viewSettings = page.locator(".advanced-control-group");
  if (!(await viewSettings.getAttribute("open"))) {
    await viewSettings.locator("summary").click();
  }
  const opacitySlider = page.getByLabel("Point opacity");
  await expect(opacitySlider).toBeVisible();
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
  const waterColumnDepthSlider = page.getByLabel("Model depth");
  await expect(waterColumnDepthSlider).toBeVisible();
  await waterColumnDepthSlider.focus();
  await waterColumnDepthSlider.press("Home");
  await expect(selectedLayer).not.toHaveText(initialSelectedLayer ?? "");

  await page.getByRole("button", { name: /Geographic View/ }).click();
  await expect(page.locator(".cesium-host canvas")).toBeVisible();
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: "3D field" }).click();
  await expect(page.locator(".volume-note")).toContainText("3D WATER COLUMN");
  await expect(page.locator(".renderer-fallback-card")).toHaveCount(0);

  await page.getByRole("button", { name: "Depth slice" }).click();
  const depthIndicator = page.locator(".depth-indicator");
  const initialDepth = await depthIndicator.textContent();
  const depthSlider = page.getByLabel("Model depth");
  await expect(depthSlider).toBeVisible();

  await depthSlider.focus();
  await depthSlider.press("End");
  await expect(depthIndicator).not.toHaveText(initialDepth ?? "");

  const profileSelect = page.getByLabel("Argo profile");
  await expect(profileSelect).toBeVisible();
  await profileSelect.selectOption({ index: 1 });
  await expect(page.locator(".profile-panel")).toBeVisible();
  await expect(page.locator(".profile-panel")).toContainText("Argo");
  await expect(page.locator(".profile-panel")).toContainText("Matched levels");
  await expect(page.locator(".profile-panel")).toContainText("Bias by depth");
  await expect(page.getByText("Diagnostic model–observation consistency, not independent validation.")).toBeVisible();
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
