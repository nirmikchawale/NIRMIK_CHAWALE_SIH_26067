import { useEffect, useState } from "react";
import type {
  ComparisonLevel,
  ProfileDetail,
  ProfileSummary,
  ProvenanceResponse
} from "../types";

interface Props {
  profiles: ProfileSummary[];
  selectedProfileId: string;
  detail: ProfileDetail | null;
  loading: boolean;
  provenance: ProvenanceResponse | null;
  onProfileChange: (profileId: string) => void;
}

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
  const summary = detail.summary;
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
    summary.profile_id,
    summary.platform_id,
    summary.cycle,
    summary.direction,
    summary.observation_time_utc,
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
    `OceanTwin_Argo_${summary.platform_id}_cycle_${summary.cycle}_comparison.csv`,
    csv,
    "text/csv;charset=utf-8"
  );
}

function downloadEvidenceJson(detail: ProfileDetail, provenance: ProvenanceResponse) {
  const summary = detail.summary;
  downloadTextFile(
    `OceanTwin_Argo_${summary.platform_id}_cycle_${summary.cycle}_evidence.json`,
    JSON.stringify(
      {
        exported_by: "OceanTwin 3D · SIH26067",
        evidence_type: "diagnostic model-observation consistency",
        comparison: detail,
        provenance
      },
      null,
      2
    ),
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
      const x = 22 + ((accessor(level) - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 44);
      const y = 18 + (level.observation_depth_m / Math.max(maxDepth, 1e-9)) * (height - 36);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function ComparisonProfileChart({ detail, selectedIndex }: { detail: ProfileDetail; selectedIndex: number }) {
  const width = 560;
  const height = 360;
  const temperatures = detail.levels.flatMap((level) => [
    level.observed_temperature,
    level.model_temperature_interpolated
  ]);
  const xMin = Math.min(...temperatures);
  const xMax = Math.max(...temperatures);
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));
  const selected = detail.levels[Math.min(selectedIndex, detail.levels.length - 1)];
  const selectedY = selected
    ? 18 + (selected.observation_depth_m / Math.max(maxDepth, 1e-9)) * (height - 36)
    : null;
  const selectedObservedX = selected
    ? 22 + ((selected.observed_temperature - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 44)
    : null;
  const selectedModelX = selected
    ? 22 + ((selected.model_temperature_interpolated - xMin) / Math.max(xMax - xMin, 1e-9)) * (width - 44)
    : null;

  const observed = linePoints(
    detail.levels,
    (level) => level.observed_temperature,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );
  const model = linePoints(
    detail.levels,
    (level) => level.model_temperature_interpolated,
    width,
    height,
    xMin,
    xMax,
    maxDepth
  );

  return (
    <section className="comparison-chart-card comparison-profile-card">
      <div className="comparison-card-heading">
        <div>
          <span>PROFILE EVIDENCE</span>
          <h3>Observed vs interpolated model temperature</h3>
        </div>
        <strong>{xMin.toFixed(2)}–{xMax.toFixed(2)} °C</strong>
      </div>
      <svg
        className="comparison-profile-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Argo observed and Copernicus model temperature profiles by depth"
      >
        <line x1="22" x2={width - 22} y1="18" y2="18" className="grid-line" />
        <line x1="22" x2={width - 22} y1={height / 2} y2={height / 2} className="grid-line" />
        <line x1="22" x2={width - 22} y1={height - 18} y2={height - 18} className="grid-line" />
        <polyline points={model} className="profile-line model-line comparison-line" />
        <polyline points={observed} className="profile-line observation-line comparison-line" />
        {selectedY != null && selectedObservedX != null && selectedModelX != null && (
          <>
            <line x1="22" x2={width - 22} y1={selectedY} y2={selectedY} className="comparison-selected-depth-line" />
            <circle cx={selectedObservedX} cy={selectedY} r="5" className="comparison-selected-point observation-point" />
            <circle cx={selectedModelX} cy={selectedY} r="5" className="comparison-selected-point model-point" />
          </>
        )}
      </svg>
      <div className="comparison-chart-legend">
        <span><i className="legend-dot model-dot" /> Copernicus interpolated model</span>
        <span><i className="legend-dot observation-dot" /> Argo observation</span>
        <span>Depth increases downward · max {maxDepth.toFixed(0)} m</span>
      </div>
    </section>
  );
}

function ComparisonBiasChart({ detail, selectedIndex }: { detail: ProfileDetail; selectedIndex: number }) {
  const width = 560;
  const height = 300;
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));
  const maxAbsBias = Math.max(0.05, ...detail.levels.map((level) => Math.abs(level.signed_bias_celsius)));
  const selected = detail.levels[Math.min(selectedIndex, detail.levels.length - 1)];
  const selectedY = selected
    ? 18 + (selected.observation_depth_m / Math.max(maxDepth, 1e-9)) * (height - 36)
    : null;
  const selectedX = selected
    ? 22 + ((selected.signed_bias_celsius + maxAbsBias) / (2 * maxAbsBias)) * (width - 44)
    : null;
  const points = linePoints(
    detail.levels,
    (level) => level.signed_bias_celsius,
    width,
    height,
    -maxAbsBias,
    maxAbsBias,
    maxDepth
  );

  return (
    <section className="comparison-chart-card comparison-bias-card">
      <div className="comparison-card-heading">
        <div>
          <span>BIAS DIAGNOSTIC</span>
          <h3>Model − Observation by depth</h3>
        </div>
        <strong>±{maxAbsBias.toFixed(3)} °C</strong>
      </div>
      <svg
        className="comparison-bias-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Signed model minus observation temperature bias by depth"
      >
        <line x1={width / 2} x2={width / 2} y1="18" y2={height - 18} className="bias-zero-line" />
        <line x1="22" x2={width - 22} y1="18" y2="18" className="grid-line" />
        <line x1="22" x2={width - 22} y1={height - 18} y2={height - 18} className="grid-line" />
        <polyline points={points} className="profile-line bias-line comparison-line" />
        {selectedY != null && selectedX != null && (
          <>
            <line x1="22" x2={width - 22} y1={selectedY} y2={selectedY} className="comparison-selected-depth-line" />
            <circle cx={selectedX} cy={selectedY} r="5" className="comparison-selected-point bias-point" />
          </>
        )}
      </svg>
      <div className="comparison-chart-legend">
        <span>Negative = model cooler</span>
        <span>Positive = model warmer</span>
        <span>Zero line = exact temperature agreement at a matched depth</span>
      </div>
    </section>
  );
}

function CollocationDiagram({ summary }: { summary: ProfileSummary }) {
  const lonMinRaw = Math.min(summary.observation_longitude, summary.model_cell_longitude);
  const lonMaxRaw = Math.max(summary.observation_longitude, summary.model_cell_longitude);
  const latMinRaw = Math.min(summary.observation_latitude, summary.model_cell_latitude);
  const latMaxRaw = Math.max(summary.observation_latitude, summary.model_cell_latitude);
  const lonPad = Math.max((lonMaxRaw - lonMinRaw) * .45, .03);
  const latPad = Math.max((latMaxRaw - latMinRaw) * .45, .03);
  const lonMin = lonMinRaw - lonPad, lonMax = lonMaxRaw + lonPad;
  const latMin = latMinRaw - latPad, latMax = latMaxRaw + latPad;
  const mapX = (lon: number) => 24 + ((lon - lonMin) / Math.max(lonMax - lonMin, 1e-9)) * 312;
  const mapY = (lat: number) => 196 - ((lat - latMin) / Math.max(latMax - latMin, 1e-9)) * 160;
  const ox = mapX(summary.observation_longitude), oy = mapY(summary.observation_latitude);
  const mx = mapX(summary.model_cell_longitude), my = mapY(summary.model_cell_latitude);

  return (
    <article className="comparison-collocation-visual">
      <div className="comparison-card-heading">
        <div><span>SPATIAL COLLOCATION</span><h3>Argo observation ↔ selected model cell</h3></div>
        <strong>{summary.spatial_distance_km.toFixed(2)} km apart</strong>
      </div>
      <svg viewBox="0 0 360 220" role="img" aria-label="Actual Argo observation and model cell collocation geometry">
        <rect x="18" y="22" width="324" height="180" rx="9" className="collocation-frame" />
        <path d={`M${ox.toFixed(1)} ${oy.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)}`} className="collocation-link" />
        <circle cx={ox} cy={oy} r="7" className="collocation-argo" />
        <rect x={mx - 6} y={my - 6} width="12" height="12" rx="2" className="collocation-model" />
        <text x={ox + 10} y={oy - 9} className="collocation-label">ARGO</text>
        <text x={mx + 10} y={my + 14} className="collocation-label">MODEL CELL</text>
      </svg>
      <div className="comparison-collocation-coordinates">
        <span>Argo {summary.observation_latitude.toFixed(4)}°N · {summary.observation_longitude.toFixed(4)}°E</span>
        <span>Model {summary.model_cell_latitude.toFixed(4)}°N · {summary.model_cell_longitude.toFixed(4)}°E</span>
      </div>
      <small>Local frame is scaled for legibility; marker labels preserve the actual collocation coordinates and reported distance.</small>
    </article>
  );
}

export function ComparisonPage({
  profiles,
  selectedProfileId,
  detail,
  loading,
  provenance,
  onProfileChange
}: Props) {
  const summary = detail?.summary;
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);

  useEffect(() => {
    setSelectedLevelIndex(0);
  }, [selectedProfileId]);

  const selectedLevel = detail?.levels[Math.min(selectedLevelIndex, Math.max(0, detail.levels.length - 1))] ?? null;

  return (
    <main className="comparison-page" data-page="compare">
      <header className="comparison-hero">
        <div>
          <span className="section-kicker">EVIDENCE · MODEL VS OBSERVATION</span>
          <h2>Argo–GLORYS12V1 profile comparison</h2>
          <p>
            Matched-depth diagnostic evidence using the existing verified collocation pipeline.
            Model values are interpolated to observation depths; this page does not create new
            measurements, timestamps or independent validation claims.
          </p>
        </div>

        <div className="comparison-selector-card">
          <label>
            Verified Argo profile
            <select
              value={selectedProfileId}
              disabled={profiles.length === 0}
              onChange={(event) => onProfileChange(event.target.value)}
            >
              {profiles.length === 0 && <option value="">No verified profile available</option>}
              {profiles.map((profile) => (
                <option key={profile.profile_id} value={profile.profile_id}>
                  {profile.platform_id} · cycle {profile.cycle} {profile.direction}
                </option>
              ))}
            </select>
          </label>
          <div className="comparison-selector-meta">
            <span>{profiles.length} verified comparison profile{profiles.length === 1 ? "" : "s"}</span>
            <strong>{summary ? `Argo ${summary.platform_id} · cycle ${summary.cycle}` : "Awaiting profile"}</strong>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="comparison-state-card">Loading verified matched-depth evidence…</div>
      ) : !detail || !summary ? (
        <div className="comparison-state-card">Select a verified Argo comparison profile.</div>
      ) : (
        <>
          <section className="comparison-metrics" aria-label="Comparison summary metrics">
            <article>
              <span>Matched levels</span>
              <strong>{summary.matched_level_count}</strong>
              <small>provider-QC accepted matched depths</small>
            </article>
            <article>
              <span>MAE</span>
              <strong>{summary.mae_celsius.toFixed(3)} °C</strong>
              <small>mean absolute temperature error</small>
            </article>
            <article>
              <span>RMSE</span>
              <strong>{summary.rmse_celsius.toFixed(3)} °C</strong>
              <small>root mean squared temperature error</small>
            </article>
            <article>
              <span>Cell distance</span>
              <strong>{summary.spatial_distance_km.toFixed(2)} km</strong>
              <small>observation to selected model cell</small>
            </article>
            <article>
              <span>Time offset</span>
              <strong>{summary.time_offset_hours.toFixed(2)} h</strong>
              <small>observation vs cached model timestamp</small>
            </article>
            <article>
              <span>Matched depth</span>
              <strong>
                {summary.shallowest_matched_depth_m.toFixed(0)}–{summary.deepest_matched_depth_m.toFixed(0)} m
              </strong>
              <small>no extrapolation beyond matched evidence</small>
            </article>
          </section>

          {selectedLevel && (
            <section className="comparison-depth-inspector" data-selected-depth={selectedLevel.observation_depth_m.toFixed(2)}>
              <div className="comparison-depth-control">
                <div>
                  <span>LINKED DEPTH INSPECTOR</span>
                  <strong>{selectedLevel.observation_depth_m.toFixed(2)} m</strong>
                  <small>Move through provider-QC accepted matched levels only.</small>
                </div>
                <input
                  aria-label="Comparison matched depth"
                  type="range"
                  min={0}
                  max={Math.max(0, detail.levels.length - 1)}
                  value={Math.min(selectedLevelIndex, Math.max(0, detail.levels.length - 1))}
                  onChange={(event) => setSelectedLevelIndex(Number(event.target.value))}
                />
              </div>
              <div className="comparison-depth-values">
                <article><span>Argo observation</span><strong>{selectedLevel.observed_temperature.toFixed(4)} °C</strong></article>
                <article><span>Interpolated model</span><strong>{selectedLevel.model_temperature_interpolated.toFixed(4)} °C</strong></article>
                <article><span>Signed bias M−O</span><strong>{selectedLevel.signed_bias_celsius >= 0 ? "+" : ""}{selectedLevel.signed_bias_celsius.toFixed(4)} °C</strong></article>
                <article><span>Absolute error</span><strong>{selectedLevel.absolute_error_celsius.toFixed(4)} °C</strong></article>
              </div>
            </section>
          )}

          <div className="comparison-chart-grid">
            <ComparisonProfileChart detail={detail} selectedIndex={selectedLevelIndex} />
            <ComparisonBiasChart detail={detail} selectedIndex={selectedLevelIndex} />
          </div>

          <section className="comparison-spatial-workspace">
            <CollocationDiagram summary={summary} />
            <article className="comparison-interpretation-card">
              <div className="comparison-card-heading">
                <div><span>READ THE EVIDENCE</span><h3>What the metrics mean here</h3></div>
              </div>
              <dl>
                <div><dt>MAE</dt><dd>Average absolute temperature difference across this profile&apos;s matched levels.</dd></div>
                <div><dt>RMSE</dt><dd>Also weights larger departures more strongly because errors are squared before averaging.</dd></div>
                <div><dt>Signed bias</dt><dd>Positive means model warmer; negative means model cooler at that matched depth.</dd></div>
                <div><dt>Scope</dt><dd>These metrics describe this verified collocated profile only, not global model skill.</dd></div>
              </dl>
            </article>
          </section>

          <section className="comparison-evidence-grid">
            <article className="comparison-method-card">
              <div className="comparison-card-heading">
                <div>
                  <span>METHOD</span>
                  <h3>How this comparison is constructed</h3>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Horizontal</dt>
                  <dd>{detail.comparison_semantics.horizontal}</dd>
                </div>
                <div>
                  <dt>Vertical</dt>
                  <dd>{detail.comparison_semantics.vertical}</dd>
                </div>
                <div>
                  <dt>Bias</dt>
                  <dd>{detail.comparison_semantics.bias}</dd>
                </div>
                <div>
                  <dt>Interpretation</dt>
                  <dd>{detail.comparison_semantics.interpretation}</dd>
                </div>
              </dl>
            </article>

            <article className="comparison-location-card">
              <div className="comparison-card-heading">
                <div>
                  <span>COLLOCATION</span>
                  <h3>Observation and model-cell context</h3>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Argo observation</dt>
                  <dd>{summary.observation_latitude.toFixed(4)}°N · {summary.observation_longitude.toFixed(4)}°E</dd>
                </div>
                <div>
                  <dt>Model cell</dt>
                  <dd>{summary.model_cell_latitude.toFixed(4)}°N · {summary.model_cell_longitude.toFixed(4)}°E</dd>
                </div>
                <div>
                  <dt>Observation time</dt>
                  <dd>{summary.observation_time_utc.replace("T", " ").replace("Z", " UTC")}</dd>
                </div>
                <div>
                  <dt>QC status</dt>
                  <dd>Accepted provider QC · no depth extrapolation</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className="comparison-levels-card">
            <div className="comparison-card-heading">
              <div>
                <span>MATCHED LEVELS</span>
                <h3>Depth-by-depth evidence table</h3>
              </div>
              <strong>{detail.levels.length} rows</strong>
            </div>
            <div className="comparison-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Depth (m)</th>
                    <th>Argo (°C)</th>
                    <th>Model (°C)</th>
                    <th>Bias M−O (°C)</th>
                    <th>|Error| (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.levels.map((level) => (
                    <tr key={level.observation_depth_m}>
                      <td>{level.observation_depth_m.toFixed(2)}</td>
                      <td>{level.observed_temperature.toFixed(4)}</td>
                      <td>{level.model_temperature_interpolated.toFixed(4)}</td>
                      <td className={level.signed_bias_celsius >= 0 ? "positive-bias" : "negative-bias"}>
                        {level.signed_bias_celsius >= 0 ? "+" : ""}{level.signed_bias_celsius.toFixed(4)}
                      </td>
                      <td>{level.absolute_error_celsius.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="comparison-provenance-card">
            <div>
              <span>MODEL SOURCE</span>
              <strong>{provenance?.model.product ?? "Copernicus GLORYS12V1"}</strong>
              <small>{provenance?.model.dataset_id ?? "Verified cached reanalysis"}</small>
            </div>
            <div>
              <span>OBSERVATION SOURCE</span>
              <strong>{provenance?.observations.provider ?? "Ifremer Argo GDAC"}</strong>
              <small>{provenance?.observations.doi ?? "Verified comparison evidence"}</small>
            </div>
            <div className="comparison-downloads">
              <button
                disabled={!provenance}
                onClick={() => provenance && downloadComparisonCsv(detail, provenance)}
              >
                Download comparison CSV
              </button>
              <button
                disabled={!provenance}
                onClick={() => provenance && downloadEvidenceJson(detail, provenance)}
              >
                Download evidence JSON
              </button>
            </div>
          </section>

          <p className="comparison-diagnostic-note">
            Diagnostic model–observation consistency, not independent validation. MAE, RMSE and
            signed bias describe this verified collocated sample only; they are not a claim of
            global model accuracy.
          </p>
        </>
      )}
    </main>
  );
}
