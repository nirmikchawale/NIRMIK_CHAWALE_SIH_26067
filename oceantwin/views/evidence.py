"""Compact evidence, provenance, limitations and profile-correct downloads."""
from __future__ import annotations

import html
from pathlib import Path

import streamlit as st

from config import (
    ARGO_PROVIDER,
    DATASET_ID,
    DEMO_DATE,
    DEMO_REGION,
    MODEL_LABEL,
    PRODUCT_LABEL,
)
from src.comparison_loader import evidence_files

from oceantwin.ui.components import (
    card_header,
    helper_text,
    limitations_panel,
    roadmap_panel,
    section_title,
)


def _esc(value) -> str:
    return html.escape(str(value))


def _item(label: str, value) -> str:
    return (
        '<div class="prov-item">'
        f'<div class="prov-label">{_esc(label)}</div>'
        f'<div class="prov-value">{_esc(value)}</div>'
        '</div>'
    )


def provenance_rows(config: dict, selected: dict, model: dict | None) -> list[tuple[str, str]]:
    direction = "Descending" if str(selected.get("direction", "")).upper() == "D" else "Ascending"
    qc_policy = selected.get("qc_policy") or "Not available"
    temperature_units = selected.get("temperature_units") or "degree_Celsius"

    rows = [
        ("Model source", f"{MODEL_LABEL} · {PRODUCT_LABEL}"),
        ("Dataset", DATASET_ID),
        ("Variable", f"thetao · potential temperature · {temperature_units}"),
        ("Subset date / region", f"{DEMO_DATE} · {DEMO_REGION}"),
        ("Profile", selected.get("profile_id", "Not available")),
        ("Float / cycle / direction", f"{selected.get('platform_id', '—')} / {selected.get('cycle', '—')} / {direction}"),
        ("Argo source", ARGO_PROVIDER),
        ("Observation time", selected.get("observation_time_utc", "Not available")),
        (
            "Argo coordinates",
            f"{float(selected['observation_latitude']):.5f}°N, {float(selected['observation_longitude']):.5f}°E",
        ),
        (
            "Model-cell coordinates",
            f"{float(selected['model_cell_latitude']):.5f}°N, {float(selected['model_cell_longitude']):.5f}°E",
        ),
        ("Spatial method", "Nearest valid model water cell"),
        ("Spatial distance", f"{float(selected['spatial_distance_km']):.3f} km"),
        ("Vertical method", "Linear interpolation between adjacent valid model levels; no extrapolation"),
        ("Bias convention", "Model − Observation"),
        ("QC policy", str(qc_policy)),
        (
            "Matched evidence",
            f"{int(selected['matched_level_count'])} levels · "
            f"{float(selected['shallowest_matched_depth_m']):.1f}–"
            f"{float(selected['deepest_matched_depth_m']):.1f} m",
        ),
        ("Time offset", f"{float(selected['time_offset_hours']):+.3f} h observation − model"),
        ("Cache status", "Verified local files · no runtime scientific-data download"),
    ]
    if model is not None:
        rows.insert(
            4,
            (
                "Model depth coverage",
                f"{float(model['depth'][0]):.2f}–{float(model['depth'][-1]):.2f} m · {len(model['depth'])} levels",
            ),
        )
    return rows


def _safe_profile_stem(selected: dict) -> str:
    platform = str(selected.get("platform_id", "profile")).replace("/", "-")
    cycle = str(selected.get("cycle", "unknown")).replace("/", "-")
    direction = str(selected.get("direction", "")).upper()
    suffix = f"_{direction.lower()}" if direction else ""
    return f"oceantwin_float_{platform}_cycle_{cycle}{suffix}"


def download_specs(selected: dict, comparison_dir: Path):
    paths = evidence_files(selected, comparison_dir)
    stem = _safe_profile_stem(selected)
    return [
        ("Profile comparison CSV", paths["profile_csv"], f"{stem}_comparison.csv", "text/csv"),
        ("Profile summary JSON", paths["profile_json"], f"{stem}_summary.json", "application/json"),
        ("Methodology summary", paths["comparison_summary"], "oceantwin_comparison_methodology.md", "text/markdown"),
        ("Method configuration", paths["comparison_config"], "oceantwin_comparison_config.json", "application/json"),
        ("Provenance", paths["comparison_provenance"], "oceantwin_provenance.json", "application/json"),
        ("Verification results", paths["verification_results"], "oceantwin_verification_results.json", "application/json"),
    ]


def render_downloads(selected: dict, comparison_dir: Path) -> None:
    specs = download_specs(selected, comparison_dir)
    for start in range(0, len(specs), 2):
        cols = st.columns(2, gap="small")
        for col, (label, path, filename, mime) in zip(cols, specs[start : start + 2]):
            if path.is_file() and path.stat().st_size > 0:
                col.download_button(
                    label,
                    data=path.read_bytes(),
                    file_name=filename,
                    mime=mime,
                    use_container_width=True,
                )
            else:
                col.info(f"{label} unavailable")


def render_evidence_row(
    comparison_dir: Path,
    config: dict,
    provenance: dict,
    selected: dict,
    model: dict | None,
) -> None:
    section_title(
        "Evidence, method & scientific boundaries",
        "Compact, inspectable provenance and real selected-profile evidence.",
        kicker="Trust",
    )
    left, right = st.columns([1.06, 0.94], gap="medium")

    with left:
        card_header("Method & provenance", "Every displayed value below is local, selected-profile specific, or project-configured.")
        with st.expander("How the comparison is constructed", expanded=False):
            st.markdown(
                """
- Argo adjusted pressure/temperature fields are filtered by the locally verified provider-QC policy.
- Observation pressure is converted to positive-down depth and aligned to potential temperature.
- The model profile is selected from the nearest valid Copernicus water cell.
- Model temperature is linearly interpolated only between adjacent valid model levels.
- No spatial, vertical or temporal extrapolation is performed.
- Bias is **Model − Observation**; positive means model warmer, negative means model cooler.
"""
            )
        with st.expander("Inspect provenance fields", expanded=False):
            rows = provenance_rows(config, selected, model)
            st.markdown(
                '<div class="prov-grid">' + "".join(_item(k, v) for k, v in rows) + "</div>",
                unsafe_allow_html=True,
            )
            if provenance.get("raw_unchanged") is True:
                helper_text("Raw source integrity: bundled provenance records source inputs as unchanged.")
            else:
                helper_text("Raw source integrity status is not asserted beyond the bundled provenance record.")

    with right:
        card_header("Limitations & evidence downloads", "Scientific honesty and reproducibility are part of the product.")
        limitations_panel()
        with st.expander("Download verified evidence", expanded=False):
            helper_text("Files are existing local outputs. Selected-profile CSV/JSON buttons always follow the active profile.")
            render_downloads(selected, comparison_dir)

    with st.expander("Roadmap boundaries", expanded=False):
        roadmap_panel()
