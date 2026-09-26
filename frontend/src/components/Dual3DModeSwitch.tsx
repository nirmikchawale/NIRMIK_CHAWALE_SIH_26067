import type { VisualizationMode } from "../types";

interface Props {
  activeMode: VisualizationMode;
  scalarAvailable: boolean;
  onChange: (mode: VisualizationMode) => void;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" />
      <path d="M3.9 12h16.2M12 3.75c2.25 2.4 3.4 5.15 3.4 8.25S14.25 17.85 12 20.25M12 3.75C9.75 6.15 8.6 8.9 8.6 12s1.15 5.85 3.4 8.25" />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.25 12 2l7 3.25v13.5L12 22l-7-3.25V5.25Z" />
      <path d="m5 5.25 7 3.25 7-3.25M12 8.5V22M5 11.8l7 3.2 7-3.2M5 15.9l7 3.15 7-3.15" />
    </svg>
  );
}

export function Dual3DModeSwitch({ activeMode, scalarAvailable, onChange }: Props) {
  return (
    <div className="dual-mode-dock globe-overlay" aria-label="Dual 3D visualization modes">
      <div className="dual-mode-heading">
        <span>DUAL 3D VISUALIZATION</span>
        <small>Two scientific views · one verified data state</small>
      </div>
      <div className="dual-mode-buttons">
        <button
          type="button"
          className={activeMode === "globe" ? "active" : ""}
          aria-pressed={activeMode === "globe"}
          onClick={() => onChange("globe")}
        >
          <span className="dual-mode-icon"><GlobeIcon /></span>
          <span><strong>Cesium Globe</strong><small>Geospatial context</small></span>
        </button>
        <button
          type="button"
          className={activeMode === "water-column" ? "active" : ""}
          aria-pressed={activeMode === "water-column"}
          disabled={!scalarAvailable}
          title={scalarAvailable ? "Open scientific water-column 3D" : "Water-column mode requires a scalar field"}
          onClick={() => onChange("water-column")}
        >
          <span className="dual-mode-icon"><ColumnIcon /></span>
          <span><strong>Water-Column 3D</strong><small>Lon · lat · positive-down depth</small></span>
        </button>
      </div>
    </div>
  );
}
