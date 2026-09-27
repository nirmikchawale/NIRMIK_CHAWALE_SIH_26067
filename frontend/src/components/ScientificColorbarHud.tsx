import { useMemo } from "react";
import type { ColorPalette, ColorScaleMode } from "../types";
import { displayUnits } from "../units";

interface Props {
  label: string;
  units: string;
  values: number[];
  domainMinimum: number;
  domainMaximum: number;
  minimum: number;
  maximum: number;
  palette: ColorPalette;
  scale: ColorScaleMode;
  onMinimumChange: (value: number) => void;
  onMaximumChange: (value: number) => void;
  onPaletteChange: (value: ColorPalette) => void;
  onScaleChange: (value: ColorScaleMode) => void;
}

const BIN_COUNT = 28;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function ScientificColorbarHud({
  label,
  units,
  values,
  domainMinimum,
  domainMaximum,
  minimum,
  maximum,
  palette,
  scale,
  onMinimumChange,
  onMaximumChange,
  onPaletteChange,
  onScaleChange
}: Props) {
  const safeDomainMinimum = Number.isFinite(domainMinimum) ? domainMinimum : 0;
  const safeDomainMaximum =
    Number.isFinite(domainMaximum) && domainMaximum > safeDomainMinimum
      ? domainMaximum
      : safeDomainMinimum + 1;
  const step = Math.max((safeDomainMaximum - safeDomainMinimum) / 300, 0.000001);
  const safeMinimum = clamp(Number.isFinite(minimum) ? minimum : safeDomainMinimum, safeDomainMinimum, safeDomainMaximum);
  const safeMaximum = clamp(Number.isFinite(maximum) ? maximum : safeDomainMaximum, safeDomainMinimum, safeDomainMaximum);

  const histogram = useMemo(() => {
    const bins = Array.from({ length: BIN_COUNT }, () => 0);
    const span = safeDomainMaximum - safeDomainMinimum;
    for (const value of values) {
      if (!Number.isFinite(value)) continue;
      const normalized = clamp((value - safeDomainMinimum) / span, 0, 0.999999);
      bins[Math.floor(normalized * BIN_COUNT)] += 1;
    }
    const peak = Math.max(1, ...bins);
    return bins.map((count) => count / peak);
  }, [values, safeDomainMinimum, safeDomainMaximum]);

  const displayedUnits = displayUnits(units);
  const logAvailable = safeMinimum > 0 && safeMaximum > 0;

  const updateMinimum = (next: number) => {
    const bounded = Math.min(next, safeMaximum - step);
    onMinimumChange(clamp(bounded, safeDomainMinimum, safeDomainMaximum));
  };

  const updateMaximum = (next: number) => {
    const bounded = Math.max(next, safeMinimum + step);
    onMaximumChange(clamp(bounded, safeDomainMinimum, safeDomainMaximum));
  };

  return (
    <aside
      className="scientific-colorbar-hud"
      aria-label="Persistent scientific colorbar"
      data-palette={palette}
      data-scale={scale}
      data-histogram-count={values.length}
    >
      <div className="colorbar-hud-heading">
        <div>
          <span>VISIBLE RANGE</span>
          <strong>{label}</strong>
        </div>
        <div className="colorbar-hud-controls">
          <div className="colorbar-scale-toggle" aria-label="Persistent color scale">
            <button
              type="button"
              className={scale === "linear" ? "active" : ""}
              aria-pressed={scale === "linear"}
              onClick={() => onScaleChange("linear")}
            >
              Linear
            </button>
            <button
              type="button"
              className={scale === "log" ? "active" : ""}
              aria-pressed={scale === "log"}
              disabled={!logAvailable}
              title={logAvailable ? "Use logarithmic colour mapping" : "Log scale requires a positive visible range"}
              onClick={() => onScaleChange("log")}
            >
              Log
            </button>
          </div>
          <label className="colorbar-palette-select">
            <span>Palette</span>
            <select
              aria-label="Persistent color palette"
              value={palette}
              onChange={(event) => onPaletteChange(event.target.value as ColorPalette)}
            >
              <option value="thermal">Thermal</option>
              <option value="viridis">Viridis</option>
              <option value="icefire">Ice–Fire</option>
            </select>
          </label>
        </div>
      </div>

      <div className="interactive-colorbar-track" data-palette={palette}>
        <div className="colorbar-histogram" aria-hidden="true">
          {histogram.map((height, index) => (
            <i key={index} style={{ height: `${Math.max(4, height * 100)}%` }} />
          ))}
        </div>
        <input
          className="colorbar-range colorbar-range-min"
          type="range"
          aria-label="Colorbar minimum threshold"
          min={safeDomainMinimum}
          max={safeDomainMaximum}
          step={step}
          value={safeMinimum}
          onChange={(event) => updateMinimum(Number(event.target.value))}
        />
        <input
          className="colorbar-range colorbar-range-max"
          type="range"
          aria-label="Colorbar maximum threshold"
          min={safeDomainMinimum}
          max={safeDomainMaximum}
          step={step}
          value={safeMaximum}
          onChange={(event) => updateMaximum(Number(event.target.value))}
        />
      </div>

      <div className="colorbar-hud-values">
        <strong>{safeMinimum.toFixed(3)} <small>{displayedUnits}</small></strong>
        <span>{values.length > 0 ? `${values.length.toLocaleString()} visible samples` : "Awaiting field samples"}</span>
        <strong>{safeMaximum.toFixed(3)} <small>{displayedUnits}</small></strong>
      </div>
    </aside>
  );
}
