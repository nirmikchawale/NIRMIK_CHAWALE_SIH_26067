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
  const descriptions = {
    thetao: ["Follow the warmth below the surface.", "Temperature helps reveal how heat is distributed through the ocean. Change depth to compare layers from the same source and time."],
    so: ["Read the ocean’s salt signature.", "Salinity describes dissolved salt. Together with temperature it helps explain seawater density; this view does not calculate density."],
    currents: ["See where the water is moving.", "Arrows show horizontal direction and speed. Explore depth to compare flow layers; vertical velocity is not available in this dataset."],
    chlorophyll: ["A surface view of ocean colour.", "Satellite chlorophyll estimates describe the surface pigment field. Clouds and missing retrievals leave gaps; no underwater structure is inferred."]
  };
  const story = descriptions[variable?.id ?? "thetao"];
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
    <section className="field-story"><span className="field-chapter">FIELD NOTES / {variable?.label ?? "Ocean"}</span><h3>{story[0]}</h3><p>{story[1]}</p></section>
    <section className="evidence-readout">
      <span>{surfaceOnly ? "Vertical context" : "Selected depth"}</span>
      <strong>{surfaceOnly ? "SURFACE" : depth.toFixed(2)}{!surfaceOnly && <small> m</small>}</strong>
      <p>{variable?.label ?? "Ocean field"} · {surfaceOnly ? "satellite surface field · no depth axis" : "depth positive down"}</p>
    </section>
    <details className="field-reading"><summary>How to read this field</summary><p>{surfaceOnly ? "Each coloured cell is a surface retrieval. Use the legend to interpret concentration and select a genuine product timestamp." : "Each coloured sample belongs to a geographic position and depth. The legend maps colour to the selected variable. Vertical exaggeration changes the display, never the recorded depths."}</p><p>{catalog.coordinates.time.length === 1 ? "This source contains one timestamp. It describes a snapshot, not a forecast." : `This source contains ${catalog.coordinates.time.length} timestamps. Use the time controls to compare genuine records.`}</p></details>
    <dl className="evidence-facts"><div><dt>{surfaceOnly ? "Product time · UTC" : "Model time · UTC"}</dt><dd>{time.replace("T", " ").replace("Z", "")}</dd></div><div><dt>Study region</dt><dd>{catalog.dataset.region}</dd></div><div><dt>Vertical coverage</dt><dd>{surfaceOnly ? "Surface-only ocean colour" : `${catalog.coordinates.depth.length} actual depth levels`}</dd></div><div><dt>Source</dt><dd>{catalog.dataset.source}</dd></div></dl>
    <section className="evidence-comparison"><span className="eyebrow">Model ↔ observation</span><h3>{profile ? `Argo ${profile.platform_id}` : "No eligible profile"}</h3>{profile ? <><p>Cycle {profile.cycle} {profile.direction} · temperature comparison</p><div className="evidence-metrics"><div><strong>{profile.mae_celsius.toFixed(3)}<small> °C</small></strong><span>Mean absolute error</span></div><div><strong>{profile.matched_level_count}</strong><span>Matched levels</span></div></div><button type="button" onClick={onInspect}>Inspect profile <span aria-hidden="true">↗</span></button><button type="button" onClick={onCompare}>Open comparison <span aria-hidden="true">→</span></button></> : <p>Comparison evidence is unavailable for this dataset.</p>}</section>
    <div className="evidence-footnote"><p>{surfaceOnly ? "Surface satellite product; no depth structure inferred." : "Diagnostic comparison, not independent validation."}</p><button type="button" onClick={onSources}>Sources & methodology ↗</button></div>
  </aside>;
}
