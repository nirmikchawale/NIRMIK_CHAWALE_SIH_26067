import { useState, type MouseEvent } from "react";
import type { Catalog, ProfileDetail, VariableCard } from "../types";

interface Props {
  catalog: Catalog;
  variable: VariableCard | undefined;
  depthM: number;
  time: string;
  detail: ProfileDetail | null;
  onHoverDepth: (depthM: number) => void;
}

const CHART_WIDTH = 360;
const CHART_HEIGHT = 250;
const CHART_PAD = 18;

function chartPoint(
  level: ProfileDetail["levels"][number],
  accessor: (level: ProfileDetail["levels"][number]) => number,
  xMin: number,
  xMax: number,
  maxDepth: number
) {
  return {
    x: CHART_PAD + ((accessor(level) - xMin) / Math.max(xMax - xMin, 1e-9)) * (CHART_WIDTH - CHART_PAD * 2),
    y: CHART_PAD + (level.observation_depth_m / Math.max(maxDepth, 1e-9)) * (CHART_HEIGHT - CHART_PAD * 2)
  };
}

function smoothModelPath(
  detail: ProfileDetail,
  xMin: number,
  xMax: number,
  maxDepth: number
) {
  const points = detail.levels.map((level) =>
    chartPoint(level, (item) => item.model_temperature_interpolated, xMin, xMax, maxDepth)
  );
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const midY = (previous.y + current.y) / 2;
    path += ` C ${previous.x.toFixed(1)} ${midY.toFixed(1)}, ${current.x.toFixed(1)} ${midY.toFixed(1)}, ${current.x.toFixed(1)} ${current.y.toFixed(1)}`;
  }
  return path;
}

export function AnalysisSplitPanel({ catalog, variable, depthM, time, detail, onHoverDepth }: Props) {
  const temperatures = detail
    ? detail.levels.flatMap((level) => [level.observed_temperature, level.model_temperature_interpolated])
    : [];
  const xMin = temperatures.length ? Math.min(...temperatures) : 0;
  const xMax = temperatures.length ? Math.max(...temperatures) : 1;
  const maxDepth = detail
    ? Math.max(...detail.levels.map((level) => level.observation_depth_m), 0)
    : 0;
  const modelPath = detail ? smoothModelPath(detail, xMin, xMax, maxDepth) : "";
  const observedPoints = detail
    ? detail.levels.map((level) => chartPoint(level, (item) => item.observed_temperature, xMin, xMax, maxDepth))
    : [];
  const modelPoints = detail
    ? detail.levels.map((level) => chartPoint(level, (item) => item.model_temperature_interpolated, xMin, xMax, maxDepth))
    : [];
  const [hoveredLevelIndex, setHoveredLevelIndex] = useState<number | null>(null);
  const hoveredLevel =
    detail && hoveredLevelIndex != null
      ? detail.levels[Math.min(hoveredLevelIndex, detail.levels.length - 1)]
      : null;
  const hoveredObservedPoint =
    hoveredLevelIndex != null ? observedPoints[hoveredLevelIndex] : undefined;
  const hoveredModelPoint =
    hoveredLevelIndex != null ? modelPoints[hoveredLevelIndex] : undefined;

  const handleChartMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!detail || detail.levels.length === 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.height <= 0) return;
    const y = ((event.clientY - bounds.top) / bounds.height) * CHART_HEIGHT;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    observedPoints.forEach((point, index) => {
      const distance = Math.abs(point.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setHoveredLevelIndex(nearestIndex);
    onHoverDepth(detail.levels[nearestIndex].observation_depth_m);
  };

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

          <div
            className="analysis-profile-chart analysis-profile-chart-interactive"
            data-hover-depth={hoveredLevel ? hoveredLevel.observation_depth_m.toFixed(2) : ""}
          >
            <div className="analysis-chart-header">
              <span>Temperature vs depth · interactive T–Z</span>
              <span>{xMin.toFixed(1)}–{xMax.toFixed(1)} °C · 0–{maxDepth.toFixed(0)} m</span>
            </div>
            <svg
              viewBox="0 0 360 250"
              role="img"
              aria-label="Interactive synchronized Argo observation and Copernicus model temperature profile by depth"
              onMouseMove={handleChartMove}
              onMouseLeave={() => setHoveredLevelIndex(null)}
            >
              <line x1="18" x2="342" y1="18" y2="18" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="125" y2="125" className="analysis-grid-line" />
              <line x1="18" x2="342" y1="232" y2="232" className="analysis-grid-line" />
              <path d={modelPath} className="analysis-model-line analysis-model-smooth" />
              {observedPoints.map((point, index) => (
                <rect
                  key={`obs-${index}`}
                  className="analysis-observation-diamond"
                  x={point.x - 3.5}
                  y={point.y - 3.5}
                  width="7"
                  height="7"
                  transform={`rotate(45 ${point.x} ${point.y})`}
                />
              ))}
              {hoveredLevel && hoveredObservedPoint && hoveredModelPoint && (
                <g className="analysis-cross-highlight" aria-hidden="true">
                  <line x1="18" x2="342" y1={hoveredObservedPoint.y} y2={hoveredObservedPoint.y} className="analysis-depth-crosshair" />
                  <circle cx={hoveredModelPoint.x} cy={hoveredModelPoint.y} r="5" className="analysis-hover-model" />
                  <rect
                    x={hoveredObservedPoint.x - 5}
                    y={hoveredObservedPoint.y - 5}
                    width="10"
                    height="10"
                    transform={`rotate(45 ${hoveredObservedPoint.x} ${hoveredObservedPoint.y})`}
                    className="analysis-hover-observation"
                  />
                </g>
              )}
            </svg>
            <div className="analysis-chart-legend">
              <span><i className="model" /> Copernicus interpolated model</span>
              <span><i className="observation diamond" /> Argo observed points</span>
              <span>Depth increases downward</span>
            </div>
            {hoveredLevel && (
              <div className="analysis-chart-hover-readout" aria-live="polite">
                <strong>{hoveredLevel.observation_depth_m.toFixed(1)} m</strong>
                <span>Argo {hoveredLevel.observed_temperature.toFixed(3)} °C</span>
                <span>Model {hoveredLevel.model_temperature_interpolated.toFixed(3)} °C</span>
                <span>Bias {hoveredLevel.signed_bias_celsius >= 0 ? "+" : ""}{hoveredLevel.signed_bias_celsius.toFixed(3)} °C</span>
                <small>3D view synchronized to the nearest verified model depth slice; no 3D field value is fabricated between source levels.</small>
              </div>
            )}
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
