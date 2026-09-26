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

function ComparisonProfileChart({ detail }: { detail: ProfileDetail }) {
  const width = 560;
  const height = 360;
  const temperatures = detail.levels.flatMap((level) => [
    level.observed_temperature,
    level.model_temperature_interpolated
  ]);
  const xMin = Math.min(...temperatures);
  const xMax = Math.max(...temperatures);
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));

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
      </svg>
      <div className="comparison-chart-legend">
        <span><i className="legend-dot model-dot" /> Copernicus interpolated model</span>
        <span><i className="legend-dot observation-dot" /> Argo observation</span>
        <span>Depth increases downward · max {maxDepth.toFixed(0)} m</span>
      </div>
    </section>
  );
}

function ComparisonBiasChart({ detail }: { detail: ProfileDetail }) {
  const width = 560;
  const height = 300;
  const maxDepth = Math.max(...detail.levels.map((level) => level.observation_depth_m));
  const maxAbsBias = Math.max(0.05, ...detail.levels.map((level) => Math.abs(level.signed_bias_celsius)));
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
      </svg>
      <div className="comparison-chart-legend">
        <span>Negative = model cooler</span>
        <span>Positive = model warmer</span>
        <span>Zero line = exact temperature agreement at a matched depth</span>
      </div>
    </section>
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

          <div className="comparison-chart-grid">
            <ComparisonProfileChart detail={detail} />
            <ComparisonBiasChart detail={detail} />
          </div>

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
