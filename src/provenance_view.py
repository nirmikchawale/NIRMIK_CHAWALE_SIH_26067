"""Scientific provenance, limitations and evidence downloads."""
from __future__ import annotations

import html
from pathlib import Path

import streamlit as st

from config import (
    ARGO_DOI,
    ARGO_PROVIDER,
    DATASET_ID,
    DEMO_DATE,
    DEMO_REGION,
    DISCLAIMER,
    MODEL_DOI,
    MODEL_LABEL,
    PRODUCT_LABEL,
)
from .comparison_loader import evidence_files, load_optional_metadata


def _prov_item(label: str, value: str) -> str:
    return (
        '<div class="prov-item">'
        f'<div class="prov-label">{html.escape(label)}</div>'
        f'<div class="prov-value">{html.escape(value)}</div>'
        '</div>'
    )


def provenance_panel(comparison_dir: Path, config: dict, provenance: dict, summary: dict, model: dict | None):
    metadata = load_optional_metadata(comparison_dir)
    model_meta = metadata.get("model_inspection", {})
    model_prov = metadata.get("model_provenance", {})
    argo_meta = metadata.get("argo_summary", {})

    depth_text = "Unavailable"
    if model is not None:
        depth_text = f"{model['depth'][0]:.3f}–{model['depth'][-1]:.3f} m · {len(model['depth'])} levels"
    elif model_meta.get("coordinates", {}).get("depth"):
        d = model_meta["coordinates"]["depth"]
        depth_text = f"{d.get('minimum', '—')}–{d.get('maximum', '—')} m"

    time_policy = config.get("time_policy", {})
    temperature_policy = config.get("temperature_policy", {})
    source_dois = provenance.get("source_dois", {})

    direction = "descending" if str(summary.get("direction", "")).upper() == "D" else "ascending"
    observation = (
        f"Profile {summary['profile_id']} · float {summary['platform_id']} · cycle {summary['cycle']} {direction} · "
        f"{summary['observation_time_utc']} · {float(summary['observation_latitude']):.5f}°N, "
        f"{float(summary['observation_longitude']):.5f}°E"
    )
    model_grid = (
        f"{float(summary['model_cell_latitude']):.5f}°N, {float(summary['model_cell_longitude']):.5f}°E · "
        f"{float(summary['spatial_distance_km']):.3f} km from observation"
    )
    data_source = (
        "Delayed-mode (D) profiles enforced by the verified comparison engine; adjusted fields used: "
        f"{temperature_policy.get('in_situ_temperature', temperature_policy.get('observed_in_situ', 'TEMP_ADJUSTED'))}, "
        f"{temperature_policy.get('pressure', 'PRES_ADJUSTED')}, "
        f"{temperature_policy.get('salinity_auxiliary_only', 'PSAL_ADJUSTED')}."
    )
    daily_semantics = (
        f"Daily mean support {summary.get('model_time_support_start_utc', '—')} to "
        f"{summary.get('model_time_support_end_exclusive_utc', '—')} · midpoint "
        f"{summary.get('model_daily_mean_midpoint_utc', time_policy.get('representative_midpoint_utc', '—'))}."
    )

    rows = [
        ("Model", f"{MODEL_LABEL} · {PRODUCT_LABEL}"),
        ("Dataset", f"{DATASET_ID} · DOI {model_prov.get('dataset_doi', source_dois.get('model', MODEL_DOI))}"),
        ("Observation", observation),
        ("Argo source", f"{ARGO_PROVIDER} · DOI {source_dois.get('argo', ARGO_DOI)}"),
        ("Variable", f"thetao · sea-water potential temperature · {summary.get('temperature_units', 'degree_Celsius')}"),
        ("Observation value source", data_source),
        ("QC policy", str(summary.get("qc_policy", "Provider QC policy recorded in comparison evidence"))),
        ("Model date / time semantics", f"{DEMO_DATE} · {daily_semantics}"),
        ("Geographic subset", DEMO_REGION),
        ("Model depth coverage", depth_text),
        ("Model grid location", model_grid),
        ("Spatial matching", f"Nearest valid model water cell · configured cap {config.get('max_cell_distance_km', '—')} km"),
        ("Vertical matching", "Linear interpolation only between adjacent valid model levels · no extrapolation"),
        ("Matched evidence", f"{int(summary['matched_level_count'])} accepted levels · {float(summary['shallowest_matched_depth_m']):.1f}–{float(summary['deepest_matched_depth_m']):.1f} m"),
        ("Temperature basis", str(summary.get("temperature_basis", "Potential temperature referenced to 0 dbar"))),
        ("Offline/cache", "All runtime scientific inputs are local files; no live scientific-data download is performed."),
        ("Raw source integrity", "Unchanged in the verified comparison run" if provenance.get("raw_unchanged") is True else "UNVERIFIED in bundled provenance"),
    ]
    if argo_meta.get("profiles") is not None:
        rows.insert(4, ("Original Argo ingestion", f"{argo_meta['profiles']} profiles · {argo_meta.get('unique_floats', '—')} floats"))

    st.markdown('<div class="prov-grid">' + ''.join(_prov_item(k, v) for k, v in rows) + '</div>', unsafe_allow_html=True)

    n = int(summary["matched_level_count"])
    st.markdown("**Metric definitions**")
    st.caption(
        f"Bias = Model − Observation. MAE = mean(|bias|). RMSE = √mean(bias²). "
        f"Displayed MAE/RMSE use the same {n} finite matched levels plotted for this profile; no depth-thickness weighting is applied."
    )
    st.warning(DISCLAIMER, icon="⚠️")
    st.caption(
        "Temporal limitation: the Argo observation is an instantaneous profile while the Copernicus field is a daily mean. "
        "Thermodynamic limitation: the workflow aligns both sides to potential temperature referenced to 0 dbar, while the supplied model evidence does not fully establish equation-of-state implementation equivalence."
    )


def source_footer(provenance: dict) -> None:
    source_dois = provenance.get("source_dois", {})
    model_doi = source_dois.get("model", MODEL_DOI)
    argo_doi = source_dois.get("argo", ARGO_DOI)
    st.markdown(
        f'<div class="source-footer"><b>Scientific sources:</b> Copernicus Marine {html.escape(PRODUCT_LABEL)} · '
        f'DOI {html.escape(str(model_doi))} &nbsp;|&nbsp; {html.escape(ARGO_PROVIDER)} · '
        f'Argo GDAC DOI {html.escape(str(argo_doi))}. Runtime uses the bundled local evidence only.</div>',
        unsafe_allow_html=True,
    )


def downloads(summary: dict, comparison_dir: Path):
    paths = evidence_files(summary, comparison_dir)
    specs = [
        ("profile_csv", "Profile CSV", "text/csv"),
        ("profile_json", "Profile JSON", "application/json"),
        ("comparison_summary", "Comparison summary", "text/markdown"),
        ("comparison_config", "Method config", "application/json"),
        ("comparison_provenance", "Provenance", "application/json"),
        ("verification_results", "Verification results", "application/json"),
    ]
    for row_start in range(0, len(specs), 3):
        cols = st.columns(3)
        for col, (key, label, mime) in zip(cols, specs[row_start:row_start + 3]):
            path = paths[key]
            if path.is_file() and path.stat().st_size > 0:
                col.download_button(
                    f"Download {label}",
                    data=path.read_bytes(),
                    file_name=path.name,
                    mime=mime,
                    use_container_width=True,
                )
            else:
                col.info(f"{label} unavailable")
