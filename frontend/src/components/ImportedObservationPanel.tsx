import { useEffect, useMemo, useState } from "react";

import type { ImportedObservationProfile } from "../types";

interface Props {
  profile: ImportedObservationProfile | null;
  open: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

const SENSOR_LABELS = {
  argo: "Argo",
  glider: "Glider",
  ctd: "CTD / XCTD",
  bgc: "BGC",
  other: "Observation"
} as const;

export function ImportedObservationPanel({ profile, open, mobileOpen, onClose }: Props) {
  const [variable, setVariable] = useState("");

  useEffect(() => {
    setVariable(profile?.variables[0] ?? "");
  }, [profile?.id]);

  const records = useMemo(
    () => profile?.records.filter((row) => row.variable === variable).sort((a, b) => a.depth_m - b.depth_m) ?? [],
    [profile, variable]
  );

  const chart = useMemo(() => {
    if (records.length === 0) return null;
    const width = 280;
    const height = 240;
    const values = records.map((row) => row.value);
    const depths = records.map((row) => row.depth_m);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const x = (value: number) => 36 + ((value - minValue) / Math.max(maxValue - minValue, 1e-12)) * (width - 56);
    const y = (depth: number) => 18 + ((depth - minDepth) / Math.max(maxDepth - minDepth, 1e-12)) * (height - 42);
    return {
      width,
      height,
      minValue,
      maxValue,
      minDepth,
      maxDepth,
      points: records.map((row) => `${x(row.value).toFixed(2)},${y(row.depth_m).toFixed(2)}`).join(" ")
    };
  }, [records]);

  if (!open) return null;

  return (
    <aside
      className={`profile-panel imported-profile-panel ${mobileOpen ? "mobile-open" : ""}`}
      data-context-open="true"
      data-sensor-type={profile?.sensor_type ?? "none"}
      aria-label="Imported instrument profile"
    >
      <div className="profile-heading">
        <div>
          <span className="section-kicker">INSTRUMENT PLUGIN</span>
          <h2>{profile ? SENSOR_LABELS[profile.sensor_type] : "Observation"}</h2>
          <p>{profile?.platform_id ?? "No imported profile selected"}</p>
        </div>
        <button type="button" className="panel-close-button" aria-label="Close observation inspector" onClick={onClose}>×</button>
      </div>

      {!profile ? (
        <div className="panel-placeholder">Select an imported instrument marker on the globe.</div>
      ) : (
        <>
          <div className="imported-observation-proof">
            <span>{SENSOR_LABELS[profile.sensor_type].toUpperCase()}</span>
            <strong>{profile.records.length} validated measurements</strong>
            <small>browser-session layer · source values unchanged</small>
          </div>

          <div className="observation-meta">
            <div><span>Timestamp</span><strong>{profile.timestamp.replace("T", " ").replace("Z", " UTC")}</strong></div>
            <div><span>Position</span><strong>{profile.latitude.toFixed(4)}°, {profile.longitude.toFixed(4)}°</strong></div>
            <div><span>Source</span><strong>{profile.source}</strong></div>
            {profile.dataset_id && <div><span>Dataset</span><strong>{profile.dataset_id}</strong></div>}
          </div>

          <div className="imported-variable-tabs" aria-label="Imported profile variable">
            {profile.variables.map((item) => (
              <button
                key={item}
                type="button"
                className={item === variable ? "active" : ""}
                aria-pressed={item === variable}
                onClick={() => setVariable(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="profile-chart-wrap imported-profile-chart-wrap">
            <div className="chart-title-row">
              <span>{variable || "Variable"} vs depth</span>
              <span>{records[0]?.units ?? ""}</span>
            </div>
            {chart ? (
              <svg className="profile-chart imported-profile-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`${variable} depth profile`}>
                <line x1="36" x2="36" y1="18" y2={chart.height - 24} className="grid-line" />
                <line x1="36" x2={chart.width - 20} y1={chart.height - 24} y2={chart.height - 24} className="grid-line" />
                <polyline points={chart.points} className="profile-line imported-profile-line" />
                {records.map((row, index) => {
                  const [cx, cy] = chart.points.split(" ")[index].split(",");
                  return <circle key={`${row.depth_m}-${row.value}-${index}`} cx={cx} cy={cy} r="3.2" className="imported-profile-point" />;
                })}
                <text x="4" y="24" className="imported-axis-label">{chart.minDepth.toFixed(1)} m</text>
                <text x="4" y={chart.height - 26} className="imported-axis-label">{chart.maxDepth.toFixed(1)} m</text>
                <text x="36" y={chart.height - 6} className="imported-axis-label">{chart.minValue.toFixed(3)}</text>
                <text x={chart.width - 58} y={chart.height - 6} className="imported-axis-label">{chart.maxValue.toFixed(3)}</text>
              </svg>
            ) : (
              <div className="panel-placeholder">No valid rows for this variable.</div>
            )}
          </div>

          <div className="method-card">
            <strong>Plugin-path evidence</strong>
            <p>
              This profile entered through the canonical observation contract. The explorer did not
              require sensor-specific rendering code, so Argo, Glider, CTD and BGC profiles share one
              geospatial overlay and depth-profile inspection path.
            </p>
          </div>

          <p className="diagnostic-note">
            Imported observations are visualised as supplied after validation. They are not automatically
            treated as model validation or converted between units.
          </p>
        </>
      )}
    </aside>
  );
}
