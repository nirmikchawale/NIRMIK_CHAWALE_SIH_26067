import { useEffect, useMemo, useState } from "react";

import { fetchIncoisOperational } from "../api";
import type { IncoisOperationalSnapshot } from "../types";
import { displayUnits } from "../units";

type OperationalVariable = "temperature" | "salinity";

function finiteMean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

export function IncoisOperationalPanel() {
  const [snapshot, setSnapshot] = useState<IncoisOperationalSnapshot | null>(null);
  const [variable, setVariable] = useState<OperationalVariable>("temperature");
  const [timeIndex, setTimeIndex] = useState(0);
  const [depthIndex, setDepthIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchIncoisOperational()
      .then((payload) => {
        if (cancelled) return;
        if (payload.integrity.synthetic_timestamps || payload.integrity.source_values_modified) {
          throw new Error("INCOIS snapshot failed integrity policy.");
        }
        if (payload.coverage.times.length < 2 || payload.coverage.depths_m.length < 2) {
          throw new Error("INCOIS snapshot lacks genuine multi-time/depth coverage.");
        }
        setSnapshot(payload);
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!snapshot || !playing || snapshot.coverage.times.length < 2) return;
    const timer = window.setInterval(() => {
      setTimeIndex((current) => (current + 1) % snapshot.coverage.times.length);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [snapshot, playing]);

  useEffect(() => {
    if (!snapshot) return;
    setTimeIndex((current) => Math.min(current, snapshot.coverage.times.length - 1));
    setDepthIndex((current) => Math.min(current, snapshot.coverage.depths_m.length - 1));
  }, [snapshot]);

  const selected = useMemo(() => {
    if (!snapshot) return [];
    const time = snapshot.coverage.times[timeIndex];
    const depth = snapshot.coverage.depths_m[depthIndex];
    return snapshot.records.filter(
      (row) => row.time === time && Math.abs(row.depth_m - depth) < 1e-9
    );
  }, [snapshot, timeIndex, depthIndex]);

  const stats = useMemo(() => {
    if (!snapshot || selected.length === 0) return null;
    const values = selected.map((row) => row[variable]);
    return {
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      mean: finiteMean(values),
      count: values.length,
      units: snapshot.variables[variable].units
    };
  }, [snapshot, selected, variable]);

  const timeSeries = useMemo(() => {
    if (!snapshot) return [];
    const depth = snapshot.coverage.depths_m[depthIndex];
    return snapshot.coverage.times.map((time) => {
      const rows = snapshot.records.filter(
        (row) => row.time === time && Math.abs(row.depth_m - depth) < 1e-9
      );
      const values = rows.map((row) => row[variable]);
      return {
        time,
        mean: values.length ? finiteMean(values) : Number.NaN
      };
    }).filter((item) => Number.isFinite(item.mean));
  }, [snapshot, depthIndex, variable]);

  if (error) {
    return (
      <section className="incois-operational-panel unavailable" data-incois-status="unavailable">
        <div className="telemetry-card-heading">
          <div>
            <span>INCOIS OPERATIONAL SOURCE</span>
            <h3>Verified multi-time snapshot unavailable</h3>
          </div>
        </div>
        <p>{error}</p>
        <small>The deterministic GLORYS/Argo baseline remains unaffected.</small>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="incois-operational-panel" data-incois-status="loading">
        <strong>Loading build-verified INCOIS operational evidence…</strong>
      </section>
    );
  }

  const time = snapshot.coverage.times[timeIndex];
  const depth = snapshot.coverage.depths_m[depthIndex];
  const seriesMin = Math.min(...timeSeries.map((item) => item.mean));
  const seriesMax = Math.max(...timeSeries.map((item) => item.mean));
  const width = 620;
  const height = 180;
  const points = timeSeries.map((item, index) => {
    const x = timeSeries.length === 1
      ? width / 2
      : 38 + (index / Math.max(timeSeries.length - 1, 1)) * (width - 76);
    const y = 20 + ((seriesMax - item.mean) / Math.max(seriesMax - seriesMin, 1e-12)) * (height - 52);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <section
      className="incois-operational-panel"
      data-incois-status="verified"
      data-time-count={snapshot.integrity.genuine_time_count}
      data-depth-count={snapshot.integrity.genuine_depth_count}
      data-selected-time={time}
      data-selected-depth={depth}
      data-variable={variable}
    >
      <div className="incois-operational-heading">
        <div className="incois-operational-title">
          <div className="section-kicker">INCOIS · OPERATIONAL BREADTH</div>
          <h3>Genuine multi-time Indian Ocean analysis</h3>
          <p>{snapshot.source.title}</p>
          <p className="incois-operational-lede">
            This is the temporal-breadth layer of Ocean Canvas: verified INCOIS analysis snapshots
            add real time and depth variation beyond the single-time GLORYS comparison baseline.
            Move the controls below to inspect what genuinely changes—without duplicated dates or
            altered provider values.
          </p>
        </div>
        <div className="incois-proof">
          <span>BUILD-VERIFIED</span>
          <strong>{snapshot.integrity.genuine_time_count} times · {snapshot.integrity.genuine_depth_count} depths</strong>
          <small>no synthetic timestamps · source values unchanged</small>
        </div>
      </div>

      <div className="incois-operational-contrast" aria-label="Why INCOIS operational breadth complements the GLORYS baseline">
        <article>
          <span>REPRODUCIBLE BASELINE</span>
          <strong>GLORYS12V1</strong>
          <p>One immutable verified model timestamp anchors depth-resolved comparison with Argo. Ocean Canvas keeps it static instead of manufacturing a trend.</p>
        </article>
        <div className="incois-contrast-arrow" aria-hidden="true">→</div>
        <article className="active">
          <span>GENUINE TEMPORAL BREADTH</span>
          <strong>INCOIS multi-time</strong>
          <p>Real provider timestamps and real depth coordinates extend the same workspace into temporal exploration without changing source values.</p>
        </article>
      </div>

      <div className="incois-operational-proof-grid" aria-label="INCOIS integrity proof">
        <article>
          <span>GENUINE TIME</span>
          <strong>{snapshot.integrity.genuine_time_count}</strong>
          <small>verified timestamps available for temporal exploration</small>
        </article>
        <article>
          <span>GENUINE DEPTH</span>
          <strong>{snapshot.integrity.genuine_depth_count}</strong>
          <small>verified depth coordinates in this build snapshot</small>
        </article>
        <article>
          <span>SYNTHETIC TIME</span>
          <strong>0</strong>
          <small>Ocean Canvas never duplicates a field under fabricated dates</small>
        </article>
        <article>
          <span>VALUE POLICY</span>
          <strong>UNCHANGED</strong>
          <small>provider values are preserved through this presentation layer</small>
        </article>
      </div>

      <div className="incois-operational-controls">
        <div className="telemetry-variable-switcher" aria-label="INCOIS operational variable">
          <button
            type="button"
            className={variable === "temperature" ? "active" : ""}
            aria-pressed={variable === "temperature"}
            onClick={() => setVariable("temperature")}
          >
            Temperature
          </button>
          <button
            type="button"
            className={variable === "salinity" ? "active" : ""}
            aria-pressed={variable === "salinity"}
            onClick={() => setVariable("salinity")}
          >
            Salinity
          </button>
        </div>

        <div className="incois-playback">
          <button
            type="button"
            className="incois-play-button"
            aria-label={playing ? "Pause genuine INCOIS time playback" : "Play genuine INCOIS time playback"}
            aria-pressed={playing}
            onClick={() => setPlaying((current) => !current)}
          >
            {playing ? "■" : "▶"}
          </button>
          <label>
            <span>Time <strong>{time.replace("T00:00:00Z", "")}</strong></span>
            <input
              aria-label="INCOIS genuine timestamp"
              type="range"
              min={0}
              max={snapshot.coverage.times.length - 1}
              value={timeIndex}
              onChange={(event) => {
                setPlaying(false);
                setTimeIndex(Number(event.target.value));
              }}
            />
          </label>
        </div>

        <label>
          <span>Depth <strong>{depth.toFixed(1)} m</strong></span>
          <input
            aria-label="INCOIS operational depth"
            type="range"
            min={0}
            max={snapshot.coverage.depths_m.length - 1}
            value={depthIndex}
            onChange={(event) => setDepthIndex(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="incois-operational-explainer" aria-label="How to read INCOIS operational breadth">
        <article>
          <span>01 · WHY IT MATTERS</span>
          <strong>Time is evidence, not animation.</strong>
          <p>Each selectable date is a genuine provider timestamp. The changing line therefore represents verified temporal breadth rather than a repeated static field.</p>
        </article>
        <article>
          <span>02 · WHAT TO CHANGE</span>
          <strong>Read time and depth together.</strong>
          <p>Select Temperature or Salinity, move the timestamp, then change depth. The charts and cell summaries update from the same verified snapshot contract.</p>
        </article>
        <article>
          <span>03 · WHAT STAYS FIXED</span>
          <strong>Scientific integrity remains visible.</strong>
          <p>Source values, units and timestamps are preserved. The deterministic build keeps the demo reproducible even when provider services are unavailable at runtime.</p>
        </article>
      </div>

      <div className="incois-operational-grid">
        <article className="incois-time-chart">
          <div className="telemetry-card-heading compact">
            <div>
              <span>GENUINE TIME SERIES</span>
              <h3>Spatial mean at {depth.toFixed(1)} m</h3>
            </div>
            <strong>{timeSeries.length} timestamps</strong>
          </div>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="INCOIS operational genuine time series">
            <line x1="38" x2={width - 38} y1={height - 28} y2={height - 28} className="grid-line" />
            {points && <polyline points={points} className="telemetry-time-line" />}
            {timeSeries.map((item, index) => {
              const [x, y] = points.split(" ")[index].split(",").map(Number);
              return (
                <circle
                  key={item.time}
                  cx={x}
                  cy={y}
                  r={index === timeIndex ? 6 : 4}
                  className={index === timeIndex ? "telemetry-time-point selected" : "telemetry-time-point"}
                />
              );
            })}
          </svg>
          <div className="incois-time-labels">
            <span>{timeSeries[0]?.time.replace("T00:00:00Z", "")}</span>
            <strong>{stats ? `${stats.mean.toFixed(3)} ${displayUnits(stats.units)}` : "—"}</strong>
            <span>{timeSeries.at(-1)?.time.replace("T00:00:00Z", "")}</span>
          </div>
        </article>

        <article className="incois-spatial-card">
          <div className="telemetry-card-heading compact">
            <div>
              <span>SELECTED INCOIS FIELD</span>
              <h3>{variable === "temperature" ? "TEMP" : "SAL"} · {depth.toFixed(1)} m</h3>
            </div>
            <strong>{selected.length} cells</strong>
          </div>
          {stats && (
            <div className="incois-stat-grid">
              <div><span>Mean</span><strong>{stats.mean.toFixed(3)} {displayUnits(stats.units)}</strong></div>
              <div><span>Min</span><strong>{stats.minimum.toFixed(3)}</strong></div>
              <div><span>Max</span><strong>{stats.maximum.toFixed(3)}</strong></div>
              <div><span>Timestamp</span><strong>{time.replace("T00:00:00Z", "")}</strong></div>
            </div>
          )}
          <div className="incois-cell-grid">
            {selected.map((row) => (
              <div key={`${row.latitude}-${row.longitude}`} title={`${row.latitude}°, ${row.longitude}°`}>
                <span>{row.latitude.toFixed(1)}°N · {row.longitude.toFixed(1)}°E</span>
                <strong>{row[variable].toFixed(3)}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="incois-provenance-bar">
        <div>
          <span>SOURCE</span>
          <strong>{snapshot.source.provider} · {snapshot.source.dataset_id}</strong>
        </div>
        <div>
          <span>SERVICE</span>
          <strong>{snapshot.source.service}</strong>
        </div>
        <div>
          <span>STANDARDS</span>
          <strong>{snapshot.source.conventions.join(" · ")}</strong>
        </div>
        <a href={snapshot.source.official_metadata} target="_blank" rel="noreferrer">Official metadata ↗</a>
      </div>
      <p className="incois-runtime-note">{snapshot.source.runtime_policy}</p>
    </section>
  );
}
