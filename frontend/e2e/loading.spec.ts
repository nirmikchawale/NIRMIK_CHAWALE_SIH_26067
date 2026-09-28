import { expect, test } from "@playwright/test";
const liveUrl = process.env.OCEANTWIN_LIVE_URL;

test("first paint shows the ocean loader before the application bundle", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/assets/index-*.js", async route => { await gate; await route.continue(); });
  try {
    await page.goto(liveUrl, { waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: "A deeper view of our ocean." })).toBeVisible();
    await expect(page.locator("#ocean-launch")).toHaveAttribute("aria-busy", "true");
    await page.getByText("Loading help", { exact: true }).click();
    await page.getByRole("button", { name: "Pause animation", exact: true }).click();
    await expect(page.locator("#ocean-launch")).toHaveAttribute("data-paused", "true");
    await expect(page.getByRole("link", { name: "Reload", exact: true })).toBeVisible();
  } finally { release(); }
  await expect(page.locator("#ocean-launch")).toHaveCount(0, { timeout: 45_000 });
  await expect(page.getByRole("button", { name: "Geographic View", exact: true })).toBeVisible();
  await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
});

test("failed startup removes the loader and exposes recovery", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.route("**/science-static/catalog.json", route => route.fulfill({ status: 503, body: "Test: catalog unavailable" }));
  await page.goto(liveUrl);
  await expect(page.getByText("Scientific API unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry connection" })).toBeEnabled();
  await expect(page.locator("#ocean-launch")).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");
});

test("mobile loading respects reduced motion and fits the viewport", async ({ page }) => {
  if (!liveUrl) throw new Error("OCEANTWIN_LIVE_URL is required");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/assets/index-*.js", async route => { await gate; await route.continue(); });
  try {
    await page.goto(liveUrl, { waitUntil: "commit" });
    await expect(page.locator(".launch-probe")).toHaveCSS("animation-name", "none");
    await expect(page.getByText("Loading help", { exact: true })).toBeVisible();
    expect(await page.locator("#ocean-launch").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  } finally { release(); }
});
