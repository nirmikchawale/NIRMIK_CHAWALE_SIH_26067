import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Catalog, ProfileDetail, VariableCard } from "../types";

interface Props {
  catalog: Catalog;
  variable: VariableCard | undefined;
  depthM: number;
  time: string;
  detail: ProfileDetail | null;
  onHoverDepth: (depthM: number | null) => void;
}

interface PlotPoint {
  x: number;
  y: number;
  depth: number;
  value: number;
  index: number;
}

const CHART_WIDTH = 360;
const CHART_HEIGHT = 250;
const CHART_PAD = 18;

function profilePoints(
  detail: ProfileDetail,
  accessor: (level: ProfileDetail["levels"][number]) => number,
  xMin: number,
  xMax: number
): PlotPoint[] {
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m), 1);
  return detail.levels.map((level, index) => {
    const value = accessor(level);
    return {
      x: CHART_PAD + ((value - xMin) / Math.max(xMax - xMin, 1e-9)) * (CHART_WIDTH - CHART_PAD * 2),
      y: CHART_PAD + (level.observation_depth_m / maxDepth) * (CHART_HEIGHT - CHART_PAD * 2),
      depth: level.observation_depth_m,
      value,
      index
    };
  });
}

function smoothPath(points: PlotPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export function AnalysisSplitPanel({ catalog, variable, depthM, time, detail, onHoverDepth }: Props) {
  const [hoveredLevelIndex, setHoveredLevelIndex] = useState<number | null>(null);

  useEffect(() => {
    setHoveredLevelIndex(null);
    onHoverDepth(null);
  }, [detail?.summary.profile_id, onHoverDepth]);

  const temperatures = detail
    ? detail.levels.flatMap((level) => [level.observed_temperature, level.model_temperature_interpolated])
    : [];
  const xMin = temperatures.length ? Math.min(...temperatures) : 0;
  const xMax = temperatures.length ? Math.max(...temperatures) : 1;
  const observed = detail
    ? profilePoints(detail, (level) => level.observed_temperature, xMin, xMax)
    : [];
  const model = detail
    ? profilePoints(detail, (level) => level.model_temperature_interpolated, xMin, xMax)
    : [];
  const maxDepth = detail
    ? Math.max(...detail.levels.map((level) => level.observation_depth_m), 0)
    : 0;
  const hoveredLevel =
    detail && hoveredLevelIndex != null ? detail.levels[hoveredLevelIndex] ?? null : null;
  const hoveredObserved = hoveredLevelIndex != null ? observed[hoveredLevelIndex] ?? null : null;
  const hoveredModel = hoveredLevelIndex != null ? model[hoveredLevelIndex] ?? null : null;

  const setHoveredLevel = (index: number | null) => {
    setHoveredLevelIndex(index);
    if (index == null || !detail) {
      onHoverDepth(null);
      return;
    }
    const level = detail.levels[index];
    onHoverDepth(level?.observation_depth_m ?? null);
  };

  const selectNearestDepthFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!detail || detail.levels.length === 0 || maxDepth <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const chartY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * CHART_HEIGHT;
    const depth = Math.max(
      0,
      Math.min(
        maxDepth,
        ((chartY - CHART_PAD) / Math.max(CHART_HEIGHT - CHART_PAD * 2, 1)) * maxDepth
      )
    );
    const nearest = detail.levels.reduce((bestIndex, level, index) => {
      const best = detail.levels[bestIndex];
      return Math.abs(level.observation_depth_m - depth) < Math.abs(best.observation_depth_m - depth)
        ? index
        : bestIndex;
    }, 0);
    setHoveredLevel(nearest);
  };

  const handleChartKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!detail || detail.levels.length === 0) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const current = hoveredLevelIndex ?? 0;
    const delta = event.key === "ArrowDown" ? 1 : -1;
    setHoveredLevel(Math.max(0, Math.min(detail.levels.length - 1, current + delta)));
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

          <div className="analysis-profile-chart interactive-tz-chart">
            <div className="analysis-chart-header">
              <span>T–Z · temperature vs depth</span>
              <span>{xMin.toFixed(1)}–{xMax.toFixed(1)} °C · 0–{maxDepth.toFixed(0)} m</span>
            </div>
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="application"
              tabIndex={0}
              aria-label="Interactive model and Argo temperature profile by depth"
              onPointerMove={selectNearestDepthFromPointer}
              onPointerLeave={() => setHoveredLevel(null)}
              onBlur={() => setHoveredLevel(null)}
              onKeyDown={handleChartKey}
            >
              <line x1={CHART_PAD} x2={CHART_WIDTH - CHART_PAD} y1={CHART_PAD} y2={CHART_PAD} className="analysis-grid-line" />
              <line x1={CHART_PAD} x2={CHART_WIDTH - CHART_PAD} y1={CHART_HEIGHT / 2} y2={CHART_HEIGHT / 2} className="analysis-grid-line" />
              <line x1={CHART_PAD} x2={CHART_WIDTH - CHART_PAD} y1={CHART_HEIGHT - CHART_PAD} y2={CHART_HEIGHT - CHART_PAD} className="analysis-grid-line" />
              <path d={smoothPath(model)} className="analysis-model-smooth-line" />
              {observed.map((point) => (
                <rect
                  key={point.index}
                  className="analysis-observation-diamond"
                  x={point.x - 3.5}
                  y={point.y - 3.5}
                  width="7"
                  height="7"
                  transform={`rotate(45 ${point.x.toFixed(1)} ${point.y.toFixed(1)})`}
                />
              ))}
              {hoveredLevel && hoveredObserved && hoveredModel && (
                <g className="analysis-hover-crosshair">
                  <line x1={CHART_PAD} x2={CHART_WIDTH - CHART_PAD} y1={hoveredObserved.y} y2={hoveredObserved.y} />
                  <circle cx={hoveredModel.x} cy={hoveredModel.y} r="5" className="analysis-hover-model" />
                  <rect
                    x={hoveredObserved.x - 5}
                    y={hoveredObserved.y - 5}
                    width="10"
                    height="10"
                    transform={`rotate(45 ${hoveredObserved.x.toFixed(1)} ${hoveredObserved.y.toFixed(1)})`}
                    className="analysis-hover-observation"
                  />
                </g>
              )}
            </svg>
            <div className="analysis-chart-legend">
              <span><i className="model" /> Copernicus model interpolation</span>
              <span><i className="observation" /> Argo observed levels</span>
            </div>
            {hoveredLevel ? (
              <div className="analysis-profile-hover-readout" aria-live="polite">
                <div><span>Depth</span><strong>{hoveredLevel.observation_depth_m.toFixed(2)} m</strong></div>
                <div><span>Argo</span><strong>{hoveredLevel.observed_temperature.toFixed(3)} °C</strong></div>
                <div><span>Model</span><strong>{hoveredLevel.model_temperature_interpolated.toFixed(3)} °C</strong></div>
                <div>
                  <span>Bias M−O</span>
                  <strong>{hoveredLevel.signed_bias_celsius >= 0 ? "+" : ""}{hoveredLevel.signed_bias_celsius.toFixed(3)} °C</strong>
                </div>
              </div>
            ) : (
              <p className="analysis-chart-hover-hint">
                Hover the profile or use ↑ / ↓ while focused to project that exact observation depth into the 3D scene.
              </p>
            )}
          </div>

          <p className="analysis-limit-note">
            The amber cross-highlight plane is a visual guide at the exact observed depth; it does not invent a model value between verified model levels.
          </p>
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
