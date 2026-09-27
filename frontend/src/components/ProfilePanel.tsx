import type { ComparisonLevel, ProfileDetail, ProvenanceResponse } from "../types";

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadComparisonCsv(detail: ProfileDetail, provenance: ProvenanceResponse) {
  const s = detail.summary;
  const header = [
    "profile_id",
    "platform_id",
    "cycle",
    "direction",
    "observation_time_utc",
    "model_dataset_id",
    "model_doi",
    "argo_doi",
    "observation_depth_m",
    "observed_temperature_c",
    "model_temperature_interpolated_c",
    "signed_bias_model_minus_observation_c",
    "absolute_error_c"
  ];
  const rows = detail.levels.map((level) => [
    s.profile_id,
    s.platform_id,
    s.cycle,
    s.direction,
    s.observation_time_utc,
    provenance.model.dataset_id,
    provenance.model.doi,
    provenance.observations.doi,
    level.observation_depth_m,
    level.observed_temperature,
    level.model_temperature_interpolated,
    level.signed_bias_celsius,
    level.absolute_error_celsius
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadTextFile(
    `OceanTwin_Argo_${s.platform_id}_cycle_${s.cycle}_comparison.csv`,
    csv,
    "text/csv;charset=utf-8"
  );
}

function downloadEvidenceJson(detail: ProfileDetail, provenance: ProvenanceResponse) {
  const s = detail.summary;
  const payload = {
    exported_by: "OceanTwin 3D · SIH26067",
    evidence_type: "diagnostic model-observation consistency",
    comparison: detail,
    provenance
  };
  downloadTextFile(
    `OceanTwin_Argo_${s.platform_id}_cycle_${s.cycle}_evidence.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
}

function linePoints(
  levels: ComparisonLevel[],
  accessor: (level: ComparisonLevel) => number,
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  maxDepth: number
) {
  return levels
    .map((level) => {
      const x = 12 + ((accessor(level) - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 24);
      const y = 12 + (level.observation_depth_m / Math.max(maxDepth, 1e-9)) * (height - 24);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function BiasChart({ detail }: { detail: ProfileDetail }) {
  const width = 300;
  const height = 170;
  const levels = detail.levels;
  const maxDepth = Math.max(...levels.map((level) => level.observation_depth_m));
  const maxAbsBias = Math.max(
    0.05,
    ...levels.map((level) => Math.abs(level.signed_bias_celsius))
  );
  const xMin = -maxAbsBias;
  const xMax = maxAbsBias;
  const zeroX = width / 2;

  const points = linePoints(
    levels,
    (level) => level.signed_bias_celsius,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );

  return (
    <div className="profile-chart-wrap bias-chart-wrap">
      <div className="chart-title-row">
        <span>Bias by depth · Model − Observation</span>
        <span>±{maxAbsBias.toFixed(2)} °C</span>
      </div>
      <svg className="bias-chart" viewBox={`0 0 ${width} ${height}`} role="img">
        <line x1={zeroX} x2={zeroX} y1="12" y2={height - 12} className="bias-zero-line" />
        <line x1="12" x2={width - 12} y1="12" y2="12" className="grid-line" />
        <line x1="12" x2={width - 12} y1={height - 12} y2={height - 12} className="grid-line" />
        <polyline points={points} className="profile-line bias-line" />
      </svg>
      <div className="chart-legend">
        <span>Negative = model cooler</span>
        <span>Positive = model warmer</span>
        <span>Depth ↓ {maxDepth.toFixed(0)} m</span>
      </div>
    </div>
  );
}

function ProfileChart({ detail }: { detail: ProfileDetail }) {
  const width = 300;
  const height = 260;
  const levels = detail.levels;
  const temperatures = levels.flatMap((level) => [
    level.observed_temperature,
    level.model_temperature_interpolated
  ]);
  const xMin = Math.min(...temperatures);
  const xMax = Math.max(...temperatures);
  const maxDepth = Math.max(...levels.map((level) => level.observation_depth_m));

  const observed = linePoints(
    levels,
    (level) => level.observed_temperature,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );
  const model = linePoints(
    levels,
    (level) => level.model_temperature_interpolated,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );

  return (
    <div className="profile-chart-wrap">
      <div className="chart-title-row">
        <span>Temperature profile</span>
        <span>{xMin.toFixed(1)}–{xMax.toFixed(1)} °C</span>
      </div>
      <svg className="profile-chart" viewBox={`0 0 ${width} ${height}`} role="img">
        <line x1="12" x2={width - 12} y1="12" y2="12" className="grid-line" />
        <line
          x1="12"
          x2={width - 12}
          y1={height / 2}
          y2={height / 2}
          className="grid-line"
        />
        <line
          x1="12"
          x2={width - 12}
          y1={height - 12}
          y2={height - 12}
          className="grid-line"
        />
        <polyline points={model} className="profile-line model-line" />
        <polyline points={observed} className="profile-line observation-line" />
      </svg>
      <div className="chart-legend">
        <span><i className="legend-dot model-dot" /> Copernicus</span>
        <span><i className="legend-dot observation-dot" /> Argo</span>
        <span>Depth ↓ {maxDepth.toFixed(0)} m</span>
      </div>
    </div>
  );
}

export function ProfilePanel({
  detail,
  loading,
  provenance,
  open,
  mobileOpen,
  onClose
}: {
  detail: ProfileDetail | null;
  loading: boolean;
  provenance: ProvenanceResponse | null;
  open: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const mobileHeader = (
    <div className="mobile-sheet-header">
      <div>
        <span>SELECTED OBSERVATION</span>
        <strong>Argo profile · model comparison</strong>
      </div>
      <button type="button" onClick={onClose} aria-label="Close observation details">
        Close
      </button>
    </div>
  );

  if (loading) {
    return (
      <aside
        className="profile-panel panel-placeholder"
        data-context-open={open ? "true" : "false"}
        data-context-open={open ? "true" : "false"}
        data-mobile-open={mobileOpen ? "true" : "false"}
        aria-label="Observation details"
      >
        {mobileHeader}
        <span>Loading verified profile…</span>
      </aside>
    );
  }

  if (!detail) {
    return (
      <aside
        className="profile-panel panel-placeholder"
        data-mobile-open={mobileOpen ? "true" : "false"}
        aria-label="Observation details"
      >
        {mobileHeader}
        <span>Select an Argo profile.</span>
      </aside>
    );
  }

  const { summary } = detail;

  return (
    <aside
      className="profile-panel"
      data-context-open={open ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
      aria-label="Observation details"
    >
      {mobileHeader}
      <button
        type="button"
        className="desktop-profile-close"
        onClick={onClose}
        aria-label="Close observation inspector"
        title="Close observation inspector"
      >
        ×
      </button>
      <div className="section-kicker">Selected observation</div>
      <div className="profile-heading">
        <div>
          <h2>Argo {summary.platform_id}</h2>
          <p>Cycle {summary.cycle} · {summary.direction}</p>
        </div>
        <span className="qc-pill">QC ACCEPTED</span>
      </div>

      <div className="metric-grid">
        <div><span>Matched levels</span><strong>{summary.matched_level_count}</strong></div>
        <div><span>MAE</span><strong>{summary.mae_celsius.toFixed(3)} °C</strong></div>
        <div><span>RMSE</span><strong>{summary.rmse_celsius.toFixed(3)} °C</strong></div>
        <div><span>Cell distance</span><strong>{summary.spatial_distance_km.toFixed(2)} km</strong></div>
        <div><span>Time offset</span><strong>{summary.time_offset_hours.toFixed(2)} h</strong></div>
        <div>
          <span>Matched depth</span>
          <strong>{summary.shallowest_matched_depth_m.toFixed(0)}–{summary.deepest_matched_depth_m.toFixed(0)} m</strong>
        </div>
      </div>

      <ProfileChart detail={detail} />
      <BiasChart detail={detail} />

      <div className="method-card">
        <strong>Comparison method</strong>
        <p>{detail.comparison_semantics.horizontal}</p>
        <p>{detail.comparison_semantics.vertical}</p>
        <p className="accent">{detail.comparison_semantics.bias}</p>
      </div>

      <div className="evidence-actions">
        <button
          disabled={!provenance}
          onClick={() => provenance && downloadComparisonCsv(detail, provenance)}
          title={provenance ? "Download matched-level comparison CSV" : "Waiting for provenance metadata"}
        >
          Download CSV
        </button>
        <button
          disabled={!provenance}
          onClick={() => provenance && downloadEvidenceJson(detail, provenance)}
          title={provenance ? "Download full comparison + provenance JSON" : "Waiting for provenance metadata"}
        >
          Download evidence JSON
        </button>
      </div>

      <div className="observation-meta">
        <div>
          <span>Observation</span>
          <strong>
            {summary.observation_latitude.toFixed(4)}°N · {summary.observation_longitude.toFixed(4)}°E
          </strong>
        </div>
        <div>
          <span>Time</span>
          <strong>{summary.observation_time_utc.replace("T", " ").replace("Z", " UTC")}</strong>
        </div>
      </div>

      <p className="diagnostic-note">
        Diagnostic model–observation consistency, not independent validation.
      </p>
    </aside>
  );
}
