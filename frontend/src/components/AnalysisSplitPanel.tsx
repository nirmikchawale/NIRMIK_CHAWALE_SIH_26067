import type { Catalog, ProfileDetail, VariableCard } from "../types";

interface Props {
  catalog: Catalog;
  variable: VariableCard | undefined;
  depthM: number;
  time: string;
  detail: ProfileDetail | null;
}

function profilePolyline(
  detail: ProfileDetail,
  accessor: (level: ProfileDetail["levels"][number]) => number,
  xMin: number,
  xMax: number
) {
  const width = 360;
  const height = 250;
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m), 1);
  return detail.levels
    .map((level) => {
      const x = 18 + ((accessor(level) - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 36);
      const y = 18 + (level.observation_depth_m / maxDepth) * (height - 36);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AnalysisSplitPanel({ catalog, variable, depthM, time, detail }: Props) {
  const temperatures = detail
    ? detail.levels.flatMap((level) => [level.observed_temperature, level.model_temperature_interpolated])
    : [];
  const xMin = temperatures.length ? Math.min(...temperatures) : 0;
  const xMax = temperatures.length ? Math.max(...temperatures) : 1;
  const observed = detail
    ? profilePolyline(detail, (level) => level.observed_temperature, xMin, xMax)
    : "";
  const model = detail
    ? profilePolyline(detail, (level) => level.model_temperature_interpolated, xMin, xMax)
    : "";
  const maxDepth = detail
    ? Math.max(...detail.levels.map((level) => level.observation_depth_m), 0)
    : 0;

  return (
    <aside className="analysis-split-panel" aria-label="Analysis Split workspace">
      <div className="analysis-split-heading">
        <span className="eyebrow">Workspace mode</span>
        <h2>Analysis Split</h2>
        <p>3D context and analytical evidence share the workspace without changing source values.</p>
      </div>

      <div className="analysis-context-grid">
        <div>
          <span>Active field</span>
          <strong>{variable?.label ?? "Ocean field"}</strong>
          <small>{variable?.units ?? ""}</small>
        </div>
        <div>
          <span>Selected depth</span>
          <strong>{catalog.capabilities.surface_only ? "Surface" : `${depthM.toFixed(2)} m`}</strong>
          <small>{catalog.capabilities.surface_only ? "No model depth axis" : "Depth positive down"}</small>
        </div>
        <div>
          <span>Verified time</span>
          <strong>{time.replace("T00:00:00Z", "")}</strong>
          <small>Source timestamp</small>
        </div>
        <div>
          <span>Source</span>
          <strong>{catalog.dataset.product}</strong>
          <small>{catalog.dataset.source}</small>
        </div>
      </div>

      {detail ? (
        <section className="analysis-profile-card">
          <div className="analysis-profile-title">
            <div>
              <span className="eyebrow">Model ↔ observation</span>
              <h3>Argo {detail.summary.platform_id}</h3>
            </div>
            <span className="snapshot-badge">Diagnostic comparison</span>
          </div>

          <div className="analysis-metrics">
            <div><span>MAE</span><strong>{detail.summary.mae_celsius.toFixed(3)} °C</strong></div>
            <div><span>RMSE</span><strong>{detail.summary.rmse_celsius.toFixed(3)} °C</strong></div>
            <div><span>Matched</span><strong>{detail.summary.matched_level_count}</strong></div>
          </div>

          <div className="analysis-profile-chart">
            <div className="analysis-chart-header">
              <span>Temperature vs depth</span>
              <span>{xMin.toFixed(1)}–{xMax.toFixed(1)} °C · 0–{maxDepth.toFixed(0)} m</span>
            </div>
            <svg viewBox="0 0 360 250" role="img" aria-label="Static model and Argo temperature profile preview">
              <line x1="18" x2="342" y1="18" y2="18" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="125" y2="125" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="232" y2="232" className="analysis-grid-line" />
              <polyline points={model} className="analysis-model-line" />
              <polyline points={observed} className="analysis-observation-line" />
            </svg>
            <div className="analysis-chart-legend">
              <span><i className="model" /> Copernicus model</span>
              <span><i className="observation" /> Argo observation</span>
            </div>
          </div>

          <p className="analysis-limit-note">Diagnostic model–observation consistency, not independent validation.</p>
        </section>
      ) : (
        <section className="analysis-profile-card empty">
          <span className="eyebrow">Model ↔ observation</span>
          <h3>Comparison unavailable for this source</h3>
          <p>Only verified source-specific analytical context is shown. No observation curve is inferred.</p>
        </section>
      )}
    </aside>
  );
}
