import type { ProvenanceResponse } from "../types";

export function ProvenanceDrawer({
  open,
  provenance,
  onClose
}: {
  open: boolean;
  provenance: ProvenanceResponse | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <aside className="provenance-drawer" aria-label="Scientific provenance and quality control">
      <div className="drawer-heading">
        <div>
          <div className="section-kicker">Evidence trace</div>
          <h2>Sources · QC · Provenance</h2>
        </div>
        <button onClick={onClose} aria-label="Close provenance drawer">×</button>
      </div>

      {!provenance ? (
        <p className="drawer-muted">Provenance metadata is unavailable. Core scientific layers remain usable.</p>
      ) : (
        <>
          <section>
            <h3>Model source</h3>
            <strong>{provenance.model.label}</strong>
            <p>{provenance.model.product}</p>
            <dl>
              <dt>Dataset</dt><dd>{provenance.model.dataset_id}</dd>
              <dt>DOI</dt><dd>{provenance.model.doi}</dd>
              <dt>Runtime</dt><dd>{provenance.model.runtime_mode}</dd>
              <dt>Freshness</dt><dd>{provenance.model.freshness_class}</dd>
            </dl>
          </section>

          <section>
            <h3>Observation source</h3>
            <strong>{provenance.observations.provider}</strong>
            <dl>
              <dt>DOI</dt><dd>{provenance.observations.doi}</dd>
              <dt>Matched profiles</dt><dd>{provenance.quality_control.matched_profiles}</dd>
              <dt>Accepted provider QC</dt><dd>{provenance.quality_control.accepted_provider_qc.join(", ") || "—"}</dd>
              <dt>Cell-distance cap</dt><dd>{provenance.quality_control.max_cell_distance_km ?? "—"} km</dd>
              <dt>Vertical extrapolation</dt><dd>{provenance.quality_control.no_extrapolation ? "Disabled" : "Not specified"}</dd>
            </dl>
          </section>

          <section>
            <h3>Comparison method</h3>
            <p>{provenance.methodology.horizontal}</p>
            <p>{provenance.methodology.depth}</p>
            <p>{provenance.quality_control.metrics_weighting}</p>
          </section>

          <section>
            <h3>Integrity</h3>
            <div className="drawer-badges">
              <span className={provenance.integrity.source_checksums_unchanged ? "badge success" : "badge"}>
                CHECKSUMS {provenance.integrity.source_checksums_unchanged ? "UNCHANGED" : "UNKNOWN"}
              </span>
              <span className={provenance.integrity.no_synthetic_measurements_in_outputs ? "badge success" : "badge"}>
                NO SYNTHETIC MEASUREMENTS
              </span>
            </div>
            <small>Config SHA · {provenance.integrity.configuration_sha256?.slice(0, 16) ?? "—"}…</small>
            <small>Engine SHA · {provenance.integrity.engine_sha256?.slice(0, 16) ?? "—"}…</small>
          </section>

          <p className="diagnostic-note">{provenance.scientific_disclaimer}</p>
        </>
      )}
    </aside>
  );
}
