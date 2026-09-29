import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`document routes retain full usable page height at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(process.env.OCEANTWIN_LIVE_URL!);
    for (const [label, route] of [
      ["Telemetry", "telemetry"],
      ["Model vs Observation", "compare"],
      ["Anomaly Screening", "anomaly"],
      ["Data Lab", "data-lab"],
      ["Science & System", "about"],
    ]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      const content = page.locator(`main[data-page="${route}"]`);
      await expect(content).toBeVisible();
      const geometry = await content.evaluate(element => {
        const parent = element.parentElement!;
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          parentHeight: parent.getBoundingClientRect().height,
          position: getComputedStyle(element).position,
          clipped: element.scrollHeight > element.clientHeight + 2,
          width: rect.width,
          viewport: document.documentElement.clientWidth,
        };
      });
      expect(geometry.position).not.toBe("absolute");
      expect(geometry.height).toBeGreaterThan(600);
      expect(geometry.parentHeight).toBeGreaterThanOrEqual(geometry.height - 2);
      expect(geometry.clipped).toBe(false);
      expect(geometry.width).toBeLessThanOrEqual(geometry.viewport + 1);
      const footer = page.locator('.science-footer');
      await footer.scrollIntoViewIfNeeded();
      await expect(footer).toBeInViewport();
    }
  });
}
