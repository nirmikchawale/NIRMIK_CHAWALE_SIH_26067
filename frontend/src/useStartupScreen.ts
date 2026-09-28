import { useEffect } from "react";

/** The tiny HTML shell paints before the scientific application bundle arrives. */
export function useStartupScreen(ready: boolean, failed: boolean) {
  useEffect(() => {
    const launch = document.getElementById("ocean-launch");
    const root = document.getElementById("root");
    if (!launch || !root) return;
    if (!ready && !failed) {
      root.inert = true;
      root.setAttribute("aria-hidden", "true");
      const status = document.getElementById("launch-status-text");
      if (status) status.textContent = "Opening verified scientific evidence";
      return;
    }
    root.inert = false;
    root.removeAttribute("aria-hidden");
    const restoreFocus = launch.contains(document.activeElement);
    launch.dataset.state = "complete";
    launch.setAttribute("aria-busy", "false");
    launch.setAttribute("aria-hidden", "true");
    launch.inert = true;
    if (restoreFocus) {
      const target = root.querySelector<HTMLElement>("h1, button");
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 380;
    const timer = window.setTimeout(() => launch.remove(), delay);
    return () => window.clearTimeout(timer);
  }, [ready, failed]);
}
