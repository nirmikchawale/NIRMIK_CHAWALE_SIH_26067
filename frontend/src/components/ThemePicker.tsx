import { useEffect, useMemo, useRef, useState } from "react";

import { GLASS_THEMES, getGlassTheme, type GlassThemeId } from "../theme";

interface Props {
  theme: GlassThemeId;
  onThemeChange: (theme: GlassThemeId) => void;
}

type ThemeFilter = "all" | "dark" | "light";

export function ThemePicker({ theme, onThemeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<ThemeFilter>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTheme = getGlassTheme(theme);
  const visibleThemes = useMemo(
    () => GLASS_THEMES.filter((item) => filter === "all" || item.scheme === filter),
    [filter]
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-picker" ref={rootRef} data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="theme-toggle theme-picker-trigger"
        aria-label={`Appearance: ${activeTheme.label}. Open glass theme gallery`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Choose glass appearance"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="theme-toggle-dot theme-preview-dot" aria-hidden="true">
          {activeTheme.swatches.map((swatch) => (
            <i key={swatch} style={{ background: swatch }} />
          ))}
        </span>
        <span className="theme-trigger-copy">
          <small>GLASS</small>
          <strong>{activeTheme.shortLabel}</strong>
        </span>
        <span aria-hidden="true" className="theme-trigger-chevron">⌄</span>
      </button>

      {open && (
        <section className="theme-gallery" role="dialog" aria-label="Glass appearance gallery">
          <div className="theme-gallery-heading">
            <div>
              <span>APPEARANCE LAB</span>
              <strong>Glassmorphism themes</strong>
              <p>Change the interface atmosphere without changing scientific colour scales or data.</p>
            </div>
            <button type="button" className="theme-gallery-close" onClick={() => setOpen(false)} aria-label="Close appearance gallery">×</button>
          </div>

          <div className="theme-filter" role="group" aria-label="Filter appearance themes">
            {(["all", "dark", "light"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "active" : ""}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All 16" : value === "dark" ? "Dark glass" : "Light glass"}
              </button>
            ))}
          </div>

          <div className="theme-gallery-grid" role="list">
            {visibleThemes.map((item) => {
              const selected = item.id === theme;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  className={`theme-option ${selected ? "selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => {
                    onThemeChange(item.id);
                    setOpen(false);
                  }}
                >
                  <span className="theme-option-preview" aria-hidden="true" data-preview-theme={item.id}>
                    <i className="preview-orb preview-orb-one" />
                    <i className="preview-orb preview-orb-two" />
                    <i className="preview-glass-card" />
                    <i className="preview-glass-line" />
                  </span>
                  <span className="theme-option-copy">
                    <span className="theme-option-title-row">
                      <strong>{item.label}</strong>
                      <small>{item.scheme}</small>
                    </span>
                    <span>{item.description}</span>
                    <span className="theme-option-swatches" aria-hidden="true">
                      {item.swatches.map((swatch) => <i key={swatch} style={{ background: swatch }} />)}
                    </span>
                  </span>
                  {selected && <span className="theme-selected-mark" aria-label="Selected">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="theme-gallery-footnote">
            <span>16 presets · persisted on this device</span>
            <span>Scientific renderer palettes remain independent</span>
          </div>
        </section>
      )}
    </div>
  );
}
