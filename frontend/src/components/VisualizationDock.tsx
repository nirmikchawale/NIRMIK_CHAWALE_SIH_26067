import type { VisualizationMode } from "../types";

interface Props {
  mode: VisualizationMode;
  scalarAvailable: boolean;
  variableLabel: string;
  depthM: number;
  timeLabel: string;
  regionLabel: string;
  modelLabel: string;
  observationLabel: string;
  onChange: (mode: VisualizationMode) => void;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.3 2.2 3.6 5 3.6 8.5S14.3 18.3 12 20.5M12 3.5c-2.3 2.2-3.6 5-3.6 8.5s1.3 6.3 3.6 8.5" />
    </svg>
  );
}

function ColumnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.5 12 3l7 2.5-7 2.5-7-2.5Z" />
      <path d="M5 5.5v13L12 21l7-2.5v-13M12 8v13" />
      <path d="m5 12.1 7 2.5 7-2.5" />
    </svg>
  );
}

function compactUtc(value: string): string {
  return value.replace("T", " ").replace("Z", " UTC");
}

export function VisualizationDock({
  mode,
  scalarAvailable,
  variableLabel,
  depthM,
  timeLabel,
  regionLabel,
  modelLabel,
  observationLabel,
  onChange
}: Props) {
  return (
    <section
      className="visualization-dock"
      aria-label="Scientific context and dual 3D visualization modes"
      data-visualization-mode={mode}
    >
      <div className="visualization-dock-copy">
        <span>DUAL 3D VISUALIZATION</span>
        <strong>Choose geographic or water-column context</strong>
        <small>{variableLabel} · {depthM.toFixed(2)} m · depth positive down</small>
      </div>

      <div className="visualization-dock-modes">
        <button
          type="button"
          className={mode === "globe" ? "active" : ""}
          aria-pressed={mode === "globe"}
          onClick={() => onChange("globe")}
        >
          <span className="mode-number">MODE 1</span>
          <span className="mode-icon"><GlobeIcon /></span>
          <span className="mode-label">
            <strong>Cesium Globe</strong>
            <small>geospatial context · depth-aware field</small>
          </span>
        </button>
        <button
          type="button"
          className={mode === "water-column" ? "active" : ""}
          aria-pressed={mode === "water-column"}
          disabled={!scalarAvailable}
          title={scalarAvailable ? "Open scientific water-column 3D" : "Water-column 3D requires a scalar field"}
          onClick={() => onChange("water-column")}
        >
          <span className="mode-number">MODE 2</span>
          <span className="mode-icon"><ColumnIcon /></span>
          <span className="mode-label">
            <strong>Water-Column 3D</strong>
            <small>{scalarAvailable ? "actual lon · lat · positive-down depth" : "scalar fields only"}</small>
          </span>
        </button>
      </div>

      <div className="visualization-context-row" aria-label="Current scientific context">
        <div>
          <span>UTC TIME</span>
          <strong>{compactUtc(timeLabel)}</strong>
        </div>
        <div>
          <span>REGION</span>
          <strong title={regionLabel}>{regionLabel}</strong>
        </div>
        <div>
          <span>MODEL / PRODUCT</span>
          <strong title={modelLabel}>{modelLabel}</strong>
        </div>
        <div>
          <span>OBSERVATION</span>
          <strong title={observationLabel}>{observationLabel}</strong>
        </div>
      </div>
    </section>
  );
}
