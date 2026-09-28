import { useMemo, type CSSProperties } from "react";
import type { ColorPalette, ColorScaleMode } from "../types";
import { displayUnits } from "../units";

interface Props {
  label: string;
  units: string;
  palette: ColorPalette;
  scale: ColorScaleMode;
  minimum: number;
  maximum: number;
  domainMinimum: number;
  domainMaximum: number;
  values: number[];
  onPaletteChange: (value: ColorPalette) => void;
  onScaleChange: (value: ColorScaleMode) => void;
  onMinimumChange: (value: number) => void;
  onMaximumChange: (value: number) => void;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function ScientificColorbarHud({
  label,
  units,
  palette,
  scale,
  minimum,
  maximum,
  domainMinimum,
  domainMaximum,
  values,
  onPaletteChange,
  onScaleChange,
  onMinimumChange,
  onMaximumChange
}: Props) {
  const span = Math.max(domainMaximum - domainMinimum, 1e-9);
  const step = Math.max(span / 500, 0.000001);
  const safeMinimum = clamp(minimum, domainMinimum, domainMaximum);
  const safeMaximum = clamp(maximum, domainMinimum, domainMaximum);
  const lower = Math.min(safeMinimum, safeMaximum - step);
  const upper = Math.max(safeMaximum, safeMinimum + step);
  const histogram = useMemo(() => {
    const bins = Array.from({ length: 24 }, () => 0);
    for (const value of values) {
      if (!Number.isFinite(value)) continue;
      const t = clamp((value - domainMinimum) / span, 0, 0.999999);
      bins[Math.floor(t * bins.length)] += 1;
    }
    const peak = Math.max(1, ...bins);
    return bins.map((count) => count / peak);
  }, [values, domainMinimum, span]);
  const lowerPct = ((lower - domainMinimum) / span) * 100;
  const upperPct = ((upper - domainMinimum) / span) * 100;
  const logAvailable = lower > 0 && upper > 0;

  return (
    <section className="scientific-colorbar-hud" aria-label="Interactive scientific colorbar">
      <div className="colorbar-hud-heading">
        <div>
          <span>DISPLAY RANGE</span>
          <strong>{label}</strong>
        </div>
        <div className="colorbar-hud-actions">
          <button
            type="button"
            aria-label="Toggle linear logarithmic color scale"
            aria-pressed={scale === "log"}
            disabled={!logAvailable}
            onClick={() => onScaleChange(scale === "linear" ? "log" : "linear")}
            title={!logAvailable ? "Log scale requires a positive selected range" : "Toggle linear/log color mapping"}
          >
            {scale === "linear" ? "LIN" : "LOG"}
          </button>
          <select
            aria-label="Color palette"
            value={palette}
            onChange={(event) => onPaletteChange(event.target.value as ColorPalette)}
          >
            <option value="thermal">Thermal</option>
            <option value="viridis">Viridis</option>
            <option value="icefire">Ice–Fire</option>
          </select>
        </div>
      </div>

      <div
        className="colorbar-interactive-track"
        data-palette={palette}
        style={{ "--range-start": `${lowerPct}%`, "--range-end": `${upperPct}%` } as CSSProperties}
      >
        <svg className="colorbar-histogram" viewBox="0 0 240 44" preserveAspectRatio="none" aria-hidden="true">
          {histogram.map((height, index) => (
            <rect
              key={index}
              x={index * 10 + 1}
              y={44 - height * 38}
              width="8"
              height={height * 38}
              rx="1"
            />
          ))}
        </svg>
        <div className="colorbar-range-mask" aria-hidden="true" />
        <input
          className="colorbar-handle colorbar-handle-min"
          type="range"
          aria-label="Color minimum threshold"
          min={domainMinimum}
          max={domainMaximum}
          step={step}
          value={lower}
          onChange={(event) => onMinimumChange(Math.min(Number(event.target.value), upper - step))}
        />
        <input
          className="colorbar-handle colorbar-handle-max"
          type="range"
          aria-label="Color maximum threshold"
          min={domainMinimum}
          max={domainMaximum}
          step={step}
          value={upper}
          onChange={(event) => onMaximumChange(Math.max(Number(event.target.value), lower + step))}
        />
      </div>

      <div className="colorbar-hud-values">
        <strong>{lower.toFixed(3)}</strong>
        <span>{displayUnits(units)} · {values.length.toLocaleString()} rendered samples</span>
        <strong>{upper.toFixed(3)}</strong>
      </div>
    </section>
  );
}
