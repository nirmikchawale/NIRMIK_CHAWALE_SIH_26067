"""OceanTwin 3D Streamlit application orchestration.

The scientific loaders and figure builders remain in the validated src/ core.
This module owns only application state, layout, error presentation and composition.
"""
from __future__ import annotations

from pathlib import Path

import streamlit as st

from config import COMPARISON_DIR, DEMO_DATE, MODEL_FILE, MODEL_LABEL, PRODUCT_LABEL
from src.comparison_loader import EvidenceError, load_bundle, select_profile
from src.data_loader import load_model
from src.provenance_view import source_footer

from oceantwin.state import default_state, normalize_state, profile_label, restore_verified_demo
from oceantwin.ui.components import (
    developer_details,
    error_state,
    helper_text,
    metric_cards,
    product_header,
    profile_identity,
)
from oceantwin.ui.theme import apply_theme
from oceantwin.views.dashboard import render_comparison_row, render_model_context_row
from oceantwin.views.evidence import render_evidence_row


@st.cache_data(show_spinner="Loading verified comparison evidence…")
def cached_bundle(directory: str, stamp: tuple):
    return load_bundle(Path(directory))


@st.cache_data(show_spinner="Loading cached Copernicus subset…")
def cached_model(path: str, stamp: tuple | None, comparison_config: dict):
    return load_model(Path(path), comparison_config)


def directory_stamp(directory: Path) -> tuple:
    if not directory.is_dir():
        return ()
    return tuple(
        (str(p.relative_to(directory)), p.stat().st_mtime_ns, p.stat().st_size)
        for p in sorted(directory.rglob("*"))
        if p.is_file() and "__pycache__" not in p.parts
    )


def _load_science():
    try:
        comparison_config, provenance, profiles = cached_bundle(
            str(COMPARISON_DIR), directory_stamp(COMPARISON_DIR)
        )
    except EvidenceError as exc:
        error_state("Verified comparison evidence is unavailable. Restore the bundled local evidence package.")
        developer_details(exc)
        st.stop()

    if not profiles:
        error_state("No eligible QC-accepted comparison profile is available in the local evidence package.")
        st.stop()

    model = None
    model_error = None
    try:
        stamp = (MODEL_FILE.stat().st_mtime_ns, MODEL_FILE.stat().st_size) if MODEL_FILE.is_file() else None
        model = cached_model(str(MODEL_FILE), stamp, comparison_config)
    except EvidenceError as exc:
        model_error = "Cached Copernicus model context is unavailable."
        developer_details(exc)

    return comparison_config, provenance, profiles, model, model_error


def _render_sidebar(profiles: list[dict], model: dict | None, defaults: dict) -> tuple:
    profile_ids = [p["profile_id"] for p in profiles]

    with st.sidebar:
        st.markdown("## OceanTwin **3D**")
        st.caption("EXPLAINABLE WATER-COLUMN EXPLORER")

        st.button(
            "↺ Reset to verified demo",
            on_click=restore_verified_demo,
            args=(st.session_state, defaults),
            use_container_width=True,
        )

        st.markdown("### Explore")

        def label_for(pid: str) -> str:
            return profile_label(select_profile(profiles, pid))

        selected_id = st.selectbox(
            "Selected observation profile",
            profile_ids,
            format_func=label_for,
            key="selected_profile_id",
            help="Choose one of the locally verified eligible Argo profiles.",
        )

        st.selectbox(
            "Active variable",
            ["Temperature"],
            key="enabled_variable",
            disabled=True,
            help="Temperature is the only enabled scientific comparison in this release.",
        )
        st.caption("Roadmap only: salinity and current vectors are not enabled comparisons.")

        st.markdown("### Model view")
        depth_index = 0
        vertical_exaggeration = 5.0
        opacity = 0.50
        force_2d = False

        if model is not None:
            depth_index = st.select_slider(
                "Model depth",
                options=list(range(len(model["depth"]))),
                format_func=lambda i: f"{float(model['depth'][i]):.2f} m",
                key="model_depth_index",
                help="Only actual cached Copernicus model depths are selectable.",
            )
            vertical_exaggeration = st.slider(
                "Visual vertical exaggeration",
                1.0,
                10.0,
                step=0.5,
                key="vertical_exaggeration",
                help="Changes display geometry only; scientific depths remain metres.",
            )
            opacity = st.slider(
                "3D point opacity",
                0.15,
                1.0,
                step=0.05,
                key="point_opacity",
                help="Display-only control for the real thetao point cloud.",
            )
            force_2d = st.toggle(
                "Use 2D compatibility fallback",
                key="force_2d",
                help="Use the actual selected-depth slice when WebGL 3D is unreliable.",
            )
        else:
            st.caption("Model-view controls become available when the cached model file is present.")

        st.markdown("### Method")
        with st.expander("Comparison method", expanded=False):
            st.caption(
                "Nearest valid Copernicus water cell · linear vertical interpolation between adjacent valid "
                "model levels · Model − Observation bias · no extrapolation."
            )
        st.caption(f"{MODEL_LABEL}")
        st.caption(PRODUCT_LABEL)
        st.caption(f"Historical field · {DEMO_DATE}")
        st.caption("Local files only · no runtime scientific-data downloads")

    return selected_id, depth_index, vertical_exaggeration, opacity, force_2d


def main() -> None:
    apply_theme()
    product_header()

    comparison_config, provenance, profiles, model, model_error = _load_science()
    profile_ids = [p["profile_id"] for p in profiles]
    default_profile_id = profile_ids[0]
    default_depth_index = min(18, len(model["depth"]) - 1) if model is not None else 0
    defaults = default_state(default_profile_id, default_depth_index)

    normalize_state(
        st.session_state,
        defaults,
        profile_ids,
        len(model["depth"]) if model is not None else None,
    )

    if st.session_state.get("reset_confirmation"):
        st.toast("Verified demo state restored.", icon="✅")
        st.session_state["reset_confirmation"] = False

    selected_id, depth_index, vertical_exaggeration, opacity, force_2d = _render_sidebar(
        profiles, model, defaults
    )

    try:
        selected = select_profile(profiles, selected_id)
    except EvidenceError as exc:
        error_state("The selected profile is not available in the verified evidence package.")
        developer_details(exc)
        st.stop()

    profile_identity(selected)
    metric_cards(selected)

    render_model_context_row(
        model,
        selected,
        depth_index=depth_index,
        vertical_exaggeration=vertical_exaggeration,
        opacity=opacity,
        force_2d=force_2d,
        model_error=model_error,
    )
    render_comparison_row(selected)
    render_evidence_row(COMPARISON_DIR, comparison_config, provenance, selected, model)

    source_footer(provenance)
    helper_text("OceanTwin 3D · The Optimizers · SIH26067 · Explainable evidence from surface to depth.")
