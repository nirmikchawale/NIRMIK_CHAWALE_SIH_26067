import type { Catalog, ProfileSummary, VariableCard } from "../types";

interface Props {
  catalog: Catalog;
  variable: VariableCard | undefined;
  depth: number;
  time: string;
  profile: ProfileSummary | null;
  loading: boolean;
  error: string;
  open: boolean;
  onClose: () => void;
  onInspect: () => void;
  onCompare: () => void;
  onSources: () => void;
}

export function EvidenceRail({
  catalog,
  variable,
  depth,
  time,
  profile,
  loading,
  error,
  open,
  onClose,
  onInspect,
  onCompare,
  onSources
}: Props) {
  const surfaceOnly = catalog.capabilities.surface_only === true;
  return <aside
    className="evidence-rail"
    aria-label="Ocean data telemetry"
    aria-hidden={!open}
    data-open={open ? "true" : "false"}
  >
    <div className="evidence-inspector-bar">
      <span>CONTEXT INSPECTOR</span>
      <button type="button" onClick={onClose} aria-label="Close evidence inspector">Close</button>
    </div>
    <div className="evidence-heading"><span className="eyebrow">Ocean intelligence</span><h2>Field overview</h2><span className="snapshot-badge">{error ? "Field unavailable" : loading ? "Updating field…" : "Verified snapshot"}</span></div>
    <section className="evidence-readout">
      <span>{surfaceOnly ? "Vertical context" : "Selected depth"}</span>
      <strong>{surfaceOnly ? "SURFACE" : depth.toFixed(2)}{!surfaceOnly && <small> m</small>}</strong>
      <p>{variable?.label ?? "Ocean field"} · {surfaceOnly ? "satellite surface field · no depth axis" : "depth positive down"}</p>
    </section>
    <dl className="evidence-facts"><div><dt>{surfaceOnly ? "Product time · UTC" : "Model time · UTC"}</dt><dd>{time.replace("T", " ").replace("Z", "")}</dd></div><div><dt>Study region</dt><dd>{catalog.dataset.region}</dd></div><div><dt>Vertical coverage</dt><dd>{surfaceOnly ? "Surface-only ocean colour" : `${catalog.coordinates.depth.length} actual depth levels`}</dd></div><div><dt>Source</dt><dd>{catalog.dataset.source}</dd></div></dl>
    <section className="evidence-comparison"><span className="eyebrow">Model ↔ observation</span><h3>{profile ? `Argo ${profile.platform_id}` : "No eligible profile"}</h3>{profile ? <><p>Cycle {profile.cycle} {profile.direction} · temperature comparison</p><div className="evidence-metrics"><div><strong>{profile.mae_celsius.toFixed(3)}<small> °C</small></strong><span>Mean absolute error</span></div><div><strong>{profile.matched_level_count}</strong><span>Matched levels</span></div></div><button type="button" onClick={onInspect}>Inspect profile <span aria-hidden="true">↗</span></button><button type="button" onClick={onCompare}>Open comparison <span aria-hidden="true">→</span></button></> : <p>Comparison evidence is unavailable for this dataset.</p>}</section>
    <div className="evidence-footnote"><p>{surfaceOnly ? "Surface satellite product; no depth structure inferred." : "Diagnostic comparison, not independent validation."}</p><button type="button" onClick={onSources}>Sources & methodology ↗</button></div>
  </aside>;
}
