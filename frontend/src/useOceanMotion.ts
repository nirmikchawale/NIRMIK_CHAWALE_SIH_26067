import { useEffect } from "react";

/** Progressive enhancement: content and scientific interaction never depend on motion. */
export function useOceanMotion() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const seen = new Set<Element>();
    const selector = ".source-workbench, .scientific-colorbar-hud, .evidence-rail, .profile-panel, .analysis-split-panel, main[data-page] > section, .science-footer";
    const discover = () => {
      root.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (!preference.matches && observer) observer.observe(element);
      });
    };
    const configure = () => {
      observer?.disconnect();
      seen.clear();
      root.dataset.motion = preference.matches ? "reduced" : "full";
      if (preference.matches) root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      observer = !preference.matches && "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            target.animate?.([{ opacity: 0.65 }, { opacity: 1 }], { duration: 550, easing: "cubic-bezier(.22,1,.36,1)" });
            observer?.unobserve(target);
          });
        }, { threshold: 0.12 }) : undefined;
      discover();
    };
    configure();
    const changes = new MutationObserver(discover);
    changes.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      changes.disconnect();
      preference.removeEventListener("change", configure);
      delete root.dataset.motion;
    };
  }, []);
}
