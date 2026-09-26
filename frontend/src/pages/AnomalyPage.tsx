import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { AnomalyResponse, Catalog } from "../types";

interface Props { catalog: Catalog; }

export function AnomalyPage({ catalog }: Props) {
  const [variable, setVariable] = useState<"thetao" | "so">("thetao");
  const [depthIndex, setDepthIndex] = useState(Math.min(18, catalog.coordinates.depth.length - 1));
  const [payload, setPayload] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api.anomalies(variable, 0, depthIndex)
      .then((value) => { if (!cancelled) setPayload(value); })
      .catch((reason: Error) => { if (!cancelled) { setPayload(null); setError(reason.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [variable, depthIndex]);

  const depth = catalog.coordinates.depth[depthIndex] ?? 0;
  const spatial = useMemo(() => payload?.spatial_screen.flags.slice(0, 12) ?? [], [payload]);
  const residual = useMemo(() => payload?.residual_screen.flags.slice(0, 16) ?? [], [payload]);

  return (
    <main className="anomaly-page" data-page="anomaly" data-variable={variable}
      data-depth-index={depthIndex} data-residual-flags={payload?.residual_screen.flagged_count ?? 0}>
      <header className="anomaly-hero">
        <div>
          <span className="section-kicker">DIAGNOSTIC · EXPLAINABLE SCREENING</span>
          <h2>Anomaly screening</h2>
          <p>Robust statistical flags over verified model cells and matched Argo temperature residuals.
            A flag means unusual relative to available evidence—not proof of an ocean event, sensor fault,
            forecast anomaly or independent validation result.</p>
        </div>
        <aside className="anomaly-method-chip">
          <span>FIXED METHOD</span><strong>|robust z| ≥ 3.5</strong>
          <small>Median / MAD · two-sided · deterministic</small>
        </aside>
      </header>

      <section className="anomaly-toolbar">
        <div>
          <span>Scalar field</span>
          <div className="anomaly-variable-switcher">
            <button className={variable === "thetao" ? "active" : ""} onClick={() => setVariable("thetao")}>Temperature</button>
            <button className={variable === "so" ? "active" : ""} onClick={() => setVariable("so")}>Salinity</button>
          </div>
        </div>
        <label><span>Exact model depth</span><strong>{depth.toFixed(2)} m</strong>
          <input aria-label="Anomaly depth" type="range" min={0} max={catalog.coordinates.depth.length - 1}
            value={depthIndex} onChange={(event) => setDepthIndex(Number(event.target.value))} />
        </label>
        <div className="anomaly-time-control"><span>Timestamp</span>
          <strong>{catalog.coordinates.time[0]?.replace("T00:00:00Z", "") ?? "Unavailable"}</strong>
          <small>{catalog.coordinates.time.length} genuine timestamp(s)</small>
        </div>
      </section>

      {loading ? <div className="anomaly-state-card">Screening canonical verified evidence…</div> :
       error || !payload ? <div className="anomaly-state-card error">{error || "Screen unavailable."}</div> : <>
        <section className="anomaly-overview">
          <article><span>Spatial flags</span><strong>{payload.spatial_screen.flagged_count}</strong>
            <small>of {payload.spatial_screen.sample_count} finite model cells</small></article>
          <article><span>Residual flags</span><strong>{payload.residual_screen.flagged_count}</strong>
            <small>of {payload.residual_screen.sample_count} matched Argo levels</small></article>
          <article><span>Profiles screened</span><strong>{payload.residual_screen.profiles_screened}</strong>
            <small>temperature residuals, profile-wise</small></article>
          <article className="locked"><span>Temporal screen</span><strong>LOCKED</strong>
            <small>{payload.temporal_screen.genuine_time_count} genuine timestamp(s)</small></article>
        </section>

        <section className="anomaly-grid">
          <article className="anomaly-card">
            <div className="anomaly-card-heading"><div><span>MODEL SPACE</span>
              <h3>{payload.label} spatial statistical extremes</h3></div><strong>{payload.depth_m.toFixed(2)} m</strong></div>
            <p className="anomaly-scope">{payload.spatial_screen.scope}</p>
            <div className="anomaly-baseline"><span>Median <strong>{payload.spatial_screen.median.toFixed(4)} {payload.units}</strong></span>
              <span>MAD <strong>{payload.spatial_screen.mad.toFixed(4)} {payload.units}</strong></span></div>
            {spatial.length === 0 ? <div className="anomaly-empty">No model cell crosses the fixed |robust z| ≥ 3.5 threshold here.</div> :
              <div className="anomaly-table-wrap"><table className="anomaly-spatial-table"><thead><tr>
                <th>Lon</th><th>Lat</th><th>Value</th><th>Robust z</th></tr></thead><tbody>
                {spatial.map((flag, i) => <tr key={i}><td>{flag.longitude.toFixed(3)}°E</td>
                  <td>{flag.latitude.toFixed(3)}°N</td><td>{flag.value.toFixed(4)} {payload.units}</td>
                  <td className={flag.robust_z >= 0 ? "positive" : "negative"}>{flag.robust_z.toFixed(2)}</td></tr>)}
              </tbody></table></div>}
          </article>

          <article className="anomaly-card">
            <div className="anomaly-card-heading"><div><span>OBSERVATION RESIDUALS</span>
              <h3>Argo model–observation residual outliers</h3></div><strong>Model − Observation</strong></div>
            <p className="anomaly-scope">{payload.residual_screen.scope}. Temperature-only because that is the bundled verified Argo comparison evidence.</p>
            <div className="anomaly-profile-stats">
              {payload.residual_screen.profile_statistics.map((p) => <div key={p.profile_id}>
                <span>Argo {p.platform_id} · cycle {p.cycle}</span><strong>{p.flagged_count} flag(s)</strong>
                <small>median {p.median_bias_celsius.toFixed(3)} °C · MAD {p.mad_bias_celsius.toFixed(3)} °C</small></div>)}
            </div>
            <div className="anomaly-table-wrap"><table className="anomaly-residual-table"><thead><tr>
              <th>Profile</th><th>Depth</th><th>Bias</th><th>|error|</th><th>Robust z</th></tr></thead><tbody>
              {residual.map((flag, i) => <tr key={i}><td>{flag.platform_id} / {flag.cycle}</td>
                <td>{flag.observation_depth_m.toFixed(1)} m</td><td>{flag.signed_bias_celsius.toFixed(3)} °C</td>
                <td>{flag.absolute_error_celsius.toFixed(3)} °C</td>
                <td className={flag.robust_z >= 0 ? "positive" : "negative"}>{flag.robust_z.toFixed(2)}</td></tr>)}
            </tbody></table></div>
          </article>
        </section>

        <section className="anomaly-method-grid">
          <article className="anomaly-card anomaly-method-card"><span>METHOD & THRESHOLD</span>
            <h3>{payload.method.name}</h3><code>{payload.method.formula}</code>
            <p>Two-sided flag rule: |robust z| ≥ {payload.method.absolute_threshold}. {payload.method.zero_mad_policy}.</p></article>
          <article className="anomaly-card anomaly-temporal-card"><span>TEMPORAL SCREEN LOCKED</span>
            <h3>No synthetic time-series anomaly detection</h3><p>{payload.temporal_screen.reason}</p></article>
          <article className="anomaly-card anomaly-limit-card"><span>INTERPRETATION</span>
            <h3>Diagnostic flag, not event claim</h3><p>{payload.interpretation}</p>
            <small>{payload.provenance.product} · {payload.provenance.argo_provider}</small></article>
        </section>
      </>}
    </main>
  );
}
