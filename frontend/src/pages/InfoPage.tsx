import type { Catalog, ProvenanceResponse } from "../types";

interface Props {
  catalog: Catalog;
  provenance: ProvenanceResponse | null;
}

function Icon({ name }: { name: "problem" | "globe" | "column" | "evidence" | "screen" | "shield" | "pipeline" }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true } as const;
  if (name === "problem") return <svg {...common}><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4.8M12 17h.01" /></svg>;
  if (name === "globe") return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4M12 3.5c2.3 2.2 3.6 5 3.6 8.5S14.3 18.3 12 20.5M12 3.5c-2.3 2.2-3.6 5-3.6 8.5s1.3 6.3 3.6 8.5" /></svg>;
  if (name === "column") return <svg {...common}><path d="M5 5.5 12 3l7 2.5-7 2.5-7-2.5Z" /><path d="M5 5.5v13L12 21l7-2.5v-13M12 8v13M5 12.1l7 2.5 7-2.5" /></svg>;
  if (name === "evidence") return <svg {...common}><path d="M4 19V7m0 12h16" /><path d="m6.5 15 3.2-4 3.1 2.3 4.7-6" /><circle cx="17.5" cy="7.3" r="1.2" /></svg>;
  if (name === "screen") return <svg {...common}><path d="M4 5h16v11H4zM8 20h8M12 16v4" /><path d="m8 12 2.3-3 2.4 2 3.3-4" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 19 6v5.2c0 4.5-2.9 7.9-7 9.8-4.1-1.9-7-5.3-7-9.8V6l7-3Z" /><path d="m8.7 12 2.1 2.1 4.6-5" /></svg>;
  return <svg {...common}><path d="M4 6h5v4H4zM15 4h5v4h-5zM15 16h5v4h-5zM4 16h5v4H4z" /><path d="M9 8h3v10h3M12 8l3-2M12 18l3 0" /></svg>;
}

export function InfoPage({ catalog, provenance }: Props) {
  const lon = catalog.coordinates.longitude;
  const lat = catalog.coordinates.latitude;
  const depths = catalog.coordinates.depth;
  const timestamps = catalog.coordinates.time;
  const modelDoi = provenance?.model.doi ?? catalog.dataset.doi;
  const argoDoi = provenance?.observations.doi ?? "Source DOI unavailable";
  const matchedProfiles = provenance?.quality_control.matched_profiles ?? 0;

  return (
    <main className="info-page" data-page="about" data-info-status="implemented">
      <section className="info-hero">
        <div>
          <div className="section-kicker">SIH26067 · SCIENCE & SYSTEM</div>
          <h2>From ocean data to an explainable 3D digital-twin workspace.</h2>
          <p>
            OceanTwin turns a verified ocean-model extract and matched Argo observations into an
            interactive water-column explorer. The goal is not to decorate a globe: it is to make
            depth-dependent ocean structure, currents, model–observation differences and unusual
            values inspectable without hiding provenance or inventing missing evidence.
          </p>
        </div>
        <aside className="info-mission-card">
          <span>CORE QUESTION</span>
          <strong>What is happening in this ocean water column, at what depth, and how well does the model agree with observations?</strong>
          <small>Every judge-facing view is tied back to the same canonical evidence bundle.</small>
        </aside>
      </section>

      <section className="info-problem-grid">
        <article className="info-problem-card">
          <span className="info-icon"><Icon name="problem" /></span>
          <div>
            <small>THE PROBLEM</small>
            <h3>Ocean data is multidimensional and difficult to inspect quickly.</h3>
            <p>
              Longitude, latitude, depth, time, model variables and in-situ observations arrive in
              different structures. Flat maps can hide vertical behaviour; isolated profiles can
              lose geographic context; raw files are difficult to communicate during operational
              analysis or evaluation.
            </p>
          </div>
        </article>
        <article className="info-problem-card">
          <span className="info-icon"><Icon name="pipeline" /></span>
          <div>
            <small>OUR RESPONSE</small>
            <h3>One traceable evidence pipeline, several coordinated views.</h3>
            <p>
              OceanTwin keeps the scientific values canonical, then exposes them through 3D,
              telemetry, comparison and diagnostic-screening views. Presentation controls such as
              vertical exaggeration or imagery never alter the underlying measurements.
            </p>
          </div>
        </article>
      </section>

      <section className="info-section-heading">
        <div>
          <span>SYSTEM CAPABILITIES</span>
          <h3>What the final MVP actually does</h3>
        </div>
        <p>Capabilities below are implemented against the verified bundled evidence, not future promises.</p>
      </section>

      <section className="info-capability-grid">
        <article>
          <span className="info-icon"><Icon name="globe" /></span>
          <strong>Cesium Globe</strong>
          <p>Geospatial context, exact selected depth, scalar fields, Argo positions and horizontal currents.</p>
          <em>MODE 1 · ONLINE HD + OFFLINE FALLBACK</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="column" /></span>
          <strong>Water-Column 3D</strong>
          <p>Actual lon/lat/depth/value points with positive-down depth, orbit, zoom, opacity and cosmetic vertical exaggeration.</p>
          <em>MODE 2 · SCIENTIFIC 3D</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="screen" /></span>
          <strong>Depth & telemetry</strong>
          <p>Full-grid finite-cell depth statistics, selected-depth distributions and horizontal-current summaries.</p>
          <em>{depths.length} VERIFIED DEPTH LEVELS</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="evidence" /></span>
          <strong>Model vs Observation</strong>
          <p>Matched Argo temperature profiles versus vertically interpolated GLORYS12V1 values, including residuals and metrics.</p>
          <em>{matchedProfiles || "VERIFIED"} MATCHED PROFILE{matchedProfiles === 1 ? "" : "S"}</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="problem" /></span>
          <strong>Anomaly screening</strong>
          <p>Explainable robust statistical screening of exact-depth model cells and Argo model-minus-observation residuals.</p>
          <em>DIAGNOSTIC · NOT EVENT DETECTION</em>
        </article>
        <article>
          <span className="info-icon"><Icon name="shield" /></span>
          <strong>Guarded Data Lab</strong>
          <p>Local CSV/JSON validation for coordinates, depth convention, timestamps, units, provenance, duplicates and missingness.</p>
          <em>FAIL-CLOSED VALIDATION</em>
        </article>
      </section>

      <section className="info-section-heading">
        <div>
          <span>END-TO-END ARCHITECTURE</span>
          <h3>Evidence moves forward; provenance stays attached.</h3>
        </div>
      </section>

      <section className="info-pipeline" aria-label="OceanTwin system pipeline">
        <article>
          <span>01</span>
          <strong>Verified sources</strong>
          <p>Copernicus Marine GLORYS12V1 model evidence + Argo in-situ comparison evidence.</p>
        </article>
        <i>→</i>
        <article>
          <span>02</span>
          <strong>Scientific core</strong>
          <p>Python/FastAPI contracts expose fields, volumes, currents, telemetry, comparisons, anomalies and provenance.</p>
        </article>
        <i>→</i>
        <article>
          <span>03</span>
          <strong>Static fail-safe</strong>
          <p>Canonical API outputs are exported as immutable JSON so the hosted MVP still works without a runtime science server.</p>
        </article>
        <i>→</i>
        <article>
          <span>04</span>
          <strong>Interactive React UI</strong>
          <p>React + Cesium present the same evidence across 3D, telemetry, comparison, screening and data-validation workspaces.</p>
        </article>
      </section>

      <section className="info-evidence-grid">
        <article className="info-evidence-card">
          <div>
            <span>MODEL EVIDENCE</span>
            <strong>{catalog.dataset.label}</strong>
          </div>
          <dl>
            <div><dt>Product</dt><dd>{catalog.dataset.product}</dd></div>
            <div><dt>Dataset ID</dt><dd>{catalog.dataset.dataset_id}</dd></div>
            <div><dt>Window</dt><dd>{lon[0].toFixed(2)}–{lon.at(-1)?.toFixed(2)}°E · {lat[0].toFixed(2)}–{lat.at(-1)?.toFixed(2)}°N</dd></div>
            <div><dt>Depth</dt><dd>{depths[0].toFixed(2)}–{depths.at(-1)?.toFixed(2)} m · positive down</dd></div>
            <div><dt>Genuine time steps</dt><dd>{timestamps.length}</dd></div>
            <div><dt>DOI</dt><dd>{modelDoi}</dd></div>
          </dl>
        </article>

        <article className="info-evidence-card">
          <div>
            <span>OBSERVATION EVIDENCE</span>
            <strong>{provenance?.observations.provider ?? "Argo"}</strong>
          </div>
          <dl>
            <div><dt>Matched profiles</dt><dd>{matchedProfiles || "Bundled verified profiles"}</dd></div>
            <div><dt>Provider QC</dt><dd>{provenance?.quality_control.accepted_provider_qc?.join(", ") || "Verified comparison bundle"}</dd></div>
            <div><dt>No extrapolation</dt><dd>{provenance?.quality_control.no_extrapolation === true ? "Yes" : "Recorded in evidence contract"}</dd></div>
            <div><dt>DOI</dt><dd>{argoDoi}</dd></div>
          </dl>
        </article>
      </section>

      <section className="info-integrity">
        <div>
          <span className="info-icon"><Icon name="shield" /></span>
          <div>
            <small>SCIENTIFIC INTEGRITY CONTRACT</small>
            <h3>What OceanTwin deliberately refuses to fake</h3>
          </div>
        </div>
        <div className="info-integrity-grid">
          <article><strong>No synthetic timestamps</strong><p>Only {timestamps.length} genuine bundled model timestamp{timestamps.length === 1 ? "" : "s"} exist, so temporal trend/anomaly views remain locked when evidence is insufficient.</p></article>
          <article><strong>No depth sign ambiguity</strong><p>Scientific depth is metres positive downward. Visual exaggeration changes screen geometry only.</p></article>
          <article><strong>No black-box anomaly claim</strong><p>Flags are statistical extremes using an explicit robust rule; they do not prove an ocean event, sensor fault or forecast failure.</p></article>
          <article><strong>No hidden validation claim</strong><p>Argo comparisons are diagnostic collocations for this evidence window, not a global or independent validation of the model.</p></article>
        </div>
      </section>

      <section className="info-judge-flow">
        <div>
          <span>RECOMMENDED DEMO FLOW</span>
          <h3>Show the science in five moves.</h3>
        </div>
        <ol>
          <li><strong>Explore</strong><span>Switch Cesium Globe ↔ Water-Column 3D; change depth and inspect actual values.</span></li>
          <li><strong>Telemetry</strong><span>Show how temperature/salinity structure changes through the verified depth levels.</span></li>
          <li><strong>Compare</strong><span>Open an Argo profile and explain model − observation residuals and collocation metrics.</span></li>
          <li><strong>Screen</strong><span>Use explainable anomaly flags and point out that temporal screening is guarded by evidence availability.</span></li>
          <li><strong>Verify</strong><span>Open provenance/Data Lab to show traceability, offline fail-safe and validation rules.</span></li>
        </ol>
      </section>

      <section className="info-limit-note">
        <strong>Current evidence boundary</strong>
        <p>{catalog.scientific_disclaimer}</p>
      </section>
    </main>
  );
}
