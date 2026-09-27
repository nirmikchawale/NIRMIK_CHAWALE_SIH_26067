import { useEffect, useMemo, useState } from "react";

import {
  loadObservationNetwork,
  OBSERVATION_PLUGINS,
  type ObservationProfile
} from "../observationPlugins";

interface LoadedSource {
  plugin: (typeof OBSERVATION_PLUGINS)[number];
  profile: ObservationProfile | null;
  error: string;
}

const SENSOR_CLASS: Record<string, string> = {
  Argo: "argo",
  Glider: "glider",
  CTD: "ctd",
  BGC: "bgc"
};

function mapX(longitude: number): number {
  return ((longitude + 180) / 360) * 1000;
}

function mapY(latitude: number): number {
  return ((90 - latitude) / 180) * 460;
}

function compactTime(value: string): string {
  return value === "unknown" ? value : value.replace("T", " ").replace("Z", " UTC");
}

export function ObservationsPage() {
  const [sources, setSources] = useState<LoadedSource[]>(() =>
    OBSERVATION_PLUGINS.map((plugin) => ({ plugin, profile: null, error: "" }))
  );
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [variableId, setVariableId] = useState("");

  const load = async () => {
    setLoading(true);
    const next = await loadObservationNetwork();
    setSources(next);
    const first = next.find((item) => item.profile)?.profile ?? null;
    if (first) {
      setSelectedId((current) =>
        next.some((item) => item.profile?.id === current) ? current : first.id
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const loadedProfiles = useMemo(
    () => sources.flatMap((item) => (item.profile ? [item.profile] : [])),
    [sources]
  );
  const selected = loadedProfiles.find((profile) => profile.id === selectedId) ?? loadedProfiles[0] ?? null;

  useEffect(() => {
    if (!selected) {
      setVariableId("");
      return;
    }
    if (!selected.variables.some((variable) => variable.id === variableId)) {
      setVariableId(selected.variables[0]?.id ?? "");
    }
  }, [selected, variableId]);

  const variable = selected?.variables.find((item) => item.id === variableId) ?? selected?.variables[0] ?? null;
  const plotPoints = useMemo(() => {
    if (!selected || !variable) return [];
    return selected.samples.flatMap((sample) => {
      const value = sample.values[variable.id];
      return value == null || !Number.isFinite(value)
        ? []
        : [{ vertical: sample.vertical, value }];
    });
  }, [selected, variable]);

  const chart = useMemo(() => {
    if (!plotPoints.length) return null;
    const width = 620;
    const height = 330;
    const pad = { left: 62, right: 24, top: 22, bottom: 42 };
    const values = plotPoints.map((point) => point.value);
    const vertical = plotPoints.map((point) => point.vertical);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const minVertical = Math.min(...vertical);
    const maxVertical = Math.max(...vertical);
    const x = (value: number) =>
      pad.left + ((value - minValue) / Math.max(maxValue - minValue, 1e-12)) * (width - pad.left - pad.right);
    const y = (value: number) =>
      pad.top + ((value - minVertical) / Math.max(maxVertical - minVertical, 1e-12)) * (height - pad.top - pad.bottom);
    const path = plotPoints.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.value).toFixed(2)},${y(point.vertical).toFixed(2)}`).join(" ");
    return { width, height, pad, minValue, maxValue, minVertical, maxVertical, path, x, y };
  }, [plotPoints]);

  return (
    <main className="feature-page observations-page">
      <section className="feature-page-hero observations-hero">
        <div className="section-kicker">Operational observations · plugin architecture</div>
        <h2>One profile contract. Four instrument families.</h2>
        <p>
          Argo, autonomous Glider, ship CTD and BGC profiles are normalized into the same
          geospatial/vertical contract. Every marker preserves its provider coordinates,
          timestamp, variables and access protocol; sources are never relocated to manufacture
          model co-location.
        </p>
        <div className="observation-network-metrics">
          <div><span>ADAPTERS</span><strong>{OBSERVATION_PLUGINS.length}</strong></div>
          <div><span>LOADED</span><strong>{loadedProfiles.length}</strong></div>
          <div><span>LIVE STANDARD</span><strong>ERDDAP / OPeNDAP</strong></div>
          <div><span>LOCAL FAIL-SAFE</span><strong>Argo verified</strong></div>
        </div>
      </section>

      <section className="observation-source-grid" aria-label="Observation source adapters">
        {sources.map(({ plugin, profile, error }) => (
          <button
            type="button"
            key={plugin.id}
            className={`observation-source-card ${profile && selected?.id === profile.id ? "active" : ""}`}
            data-source-status={profile ? "ready" : error ? "error" : "loading"}
            onClick={() => profile && setSelectedId(profile.id)}
            disabled={!profile}
          >
            <div className="observation-source-heading">
              <span className={`sensor-badge ${SENSOR_CLASS[plugin.sensor]}`}>{plugin.sensor}</span>
              <span className={`source-health ${profile ? "ready" : error ? "error" : "loading"}`}>
                {profile ? "● READY" : error ? "▲ UNAVAILABLE" : "● CONNECTING"}
              </span>
            </div>
            <strong>{plugin.provider}</strong>
            <p>{plugin.description}</p>
            <small>{plugin.protocol}</small>
            {profile && <em>{profile.samples.length} profile samples · {compactTime(profile.time)}</em>}
            {error && <em className="source-error">{error}</em>}
          </button>
        ))}
      </section>

      <div className="observations-actions">
        <button type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing source adapters…" : "Reload live observation adapters"}
        </button>
        <span>
          External adapters fail closed. A failed service is shown as unavailable; no sample values are invented.
        </span>
      </div>

      <section className="observation-workbench">
        <article className="observation-map-card">
          <div className="observation-card-heading">
            <div>
              <span>GEOSPATIAL OVERLAY</span>
              <strong>Source-native observation positions</strong>
            </div>
            <small>World view · EPSG:4326 positions</small>
          </div>
          <svg className="observation-world-map" viewBox="0 0 1000 460" role="img" aria-label="Global observation instrument map">
            <rect x="0" y="0" width="1000" height="460" className="observation-map-ocean" />
            {[-120, -60, 0, 60, 120].map((longitude) => (
              <line key={`lon-${longitude}`} x1={mapX(longitude)} y1="0" x2={mapX(longitude)} y2="460" className="observation-map-grid" />
            ))}
            {[-60, -30, 0, 30, 60].map((latitude) => (
              <line key={`lat-${latitude}`} x1="0" y1={mapY(latitude)} x2="1000" y2={mapY(latitude)} className="observation-map-grid" />
            ))}
            <rect
              x={mapX(67)}
              y={mapY(14)}
              width={mapX(70) - mapX(67)}
              height={mapY(12) - mapY(14)}
              className="observation-study-window"
            />
            {loadedProfiles.map((profile) => (
              <g
                key={profile.id}
                className={`observation-map-marker ${SENSOR_CLASS[profile.sensor]} ${selected?.id === profile.id ? "active" : ""}`}
                transform={`translate(${mapX(profile.longitude)} ${mapY(profile.latitude)})`}
                onClick={() => setSelectedId(profile.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedId(profile.id);
                }}
              >
                <circle r={selected?.id === profile.id ? 10 : 7} />
                <text x="13" y="-10">{profile.sensor}</text>
              </g>
            ))}
            <text x={mapX(68.5)} y={mapY(14) - 8} className="observation-study-label">OceanTwin verified window</text>
          </svg>
          <div className="observation-map-legend">
            {OBSERVATION_PLUGINS.map((plugin) => (
              <span key={plugin.id}><i className={SENSOR_CLASS[plugin.sensor]} />{plugin.sensor}</span>
            ))}
          </div>
        </article>

        <article className="observation-profile-card">
          {selected && variable && chart ? (
            <>
              <div className="observation-card-heading">
                <div>
                  <span>{selected.sensor.toUpperCase()} PROFILE</span>
                  <strong>{selected.platform}</strong>
                </div>
                <small>{compactTime(selected.time)}</small>
              </div>
              <div className="observation-variable-tabs" role="tablist" aria-label="Observation profile variables">
                {selected.variables.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={variable.id === item.id ? "active" : ""}
                    onClick={() => setVariableId(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <svg
                className="observation-profile-chart"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                aria-label={`${selected.sensor} ${variable.label} vertical profile`}
              >
                <line x1={chart.pad.left} y1={chart.pad.top} x2={chart.pad.left} y2={chart.height - chart.pad.bottom} className="profile-axis" />
                <line x1={chart.pad.left} y1={chart.height - chart.pad.bottom} x2={chart.width - chart.pad.right} y2={chart.height - chart.pad.bottom} className="profile-axis" />
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                  const y = chart.pad.top + fraction * (chart.height - chart.pad.top - chart.pad.bottom);
                  const value = chart.minVertical + fraction * (chart.maxVertical - chart.minVertical);
                  return (
                    <g key={fraction}>
                      <line x1={chart.pad.left} y1={y} x2={chart.width - chart.pad.right} y2={y} className="profile-grid-line" />
                      <text x={chart.pad.left - 8} y={y + 4} textAnchor="end" className="profile-axis-label">{value.toFixed(0)}</text>
                    </g>
                  );
                })}
                <path d={chart.path} className={`observation-profile-line ${SENSOR_CLASS[selected.sensor]}`} />
                <text x={chart.width / 2} y={chart.height - 9} textAnchor="middle" className="profile-axis-title">
                  {variable.label} ({variable.units})
                </text>
                <text transform={`translate(15 ${chart.height / 2}) rotate(-90)`} textAnchor="middle" className="profile-axis-title">
                  {selected.verticalLabel} ({selected.verticalUnits}) ↓
                </text>
                <text x={chart.pad.left} y={chart.pad.top - 7} className="profile-range-label">
                  {chart.minValue.toFixed(3)}–{chart.maxValue.toFixed(3)} {variable.units}
                </text>
              </svg>
              <div className="observation-profile-meta">
                <div><span>POSITION</span><strong>{selected.latitude.toFixed(4)}°, {selected.longitude.toFixed(4)}°</strong></div>
                <div><span>SAMPLES</span><strong>{selected.samples.length}</strong></div>
                <div><span>PROTOCOL</span><strong>{selected.protocol}</strong></div>
                <div><span>PROVIDER</span><strong>{selected.provider}</strong></div>
              </div>
              <p className="observation-provenance">{selected.provenance}</p>
            </>
          ) : (
            <div className="observation-empty">
              <strong>No observation profile loaded yet</strong>
              <span>Live adapters remain explicit about source failure; retry when network access is available.</span>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
