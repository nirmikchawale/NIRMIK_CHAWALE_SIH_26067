"""Primary scientific dashboard rows built from existing validated figure builders."""
from __future__ import annotations

import streamlit as st

from src.comparison_loader import EvidenceError
from src.map_view import map_figure
from src.profile_charts import bias_figure, profile_figure
from src.volume_view import slice_figure, volume_figure

from oceantwin.ui.components import (
    card_header,
    chart,
    developer_details,
    empty_state,
    error_state,
    helper_text,
    section_title,
)


def render_model_context_row(
    model: dict | None,
    selected: dict,
    *,
    depth_index: int,
    vertical_exaggeration: float,
    opacity: float,
    force_2d: bool,
    model_error: str | None = None,
) -> None:
    section_title(
        "Water-column & collocation context",
        "Actual Copernicus thetao context beside the spatial match used for the selected Argo profile.",
        kicker="Explore",
    )

    left, right = st.columns([1.04, 1.0], gap="medium")

    with left:
        card_header(
            "Model water-column context",
            "Real cached thetao values · depth positive downward · visual exaggeration affects display only",
        )
        if model is None:
            error_state("Cached Copernicus model context is unavailable. Profile comparison evidence remains usable.")
            if model_error:
                helper_text("Restore the verified cached model file to re-enable the model context view.")
        elif force_2d:
            helper_text(f"2D compatibility mode · selected actual model depth {float(model['depth'][depth_index]):.2f} m")
            try:
                chart(
                    slice_figure(model, depth_index),
                    "model_context_2d",
                    kind="slice",
                    title=f"Copernicus temperature slice · {float(model['depth'][depth_index]):.2f} m",
                )
            except EvidenceError as exc:
                error_state("The selected model depth cannot be rendered from the cached model.")
                developer_details(exc)
        else:
            try:
                chart(
                    volume_figure(model, depth_index, vertical_exaggeration, opacity),
                    "model_context_3d",
                    kind="model",
                    title="Copernicus temperature · 3D model context",
                )
            except Exception as exc:
                error_state("3D rendering is unavailable in this browser. Showing the verified 2D depth slice instead.")
                developer_details(exc)
                try:
                    chart(
                        slice_figure(model, depth_index),
                        "model_context_auto_2d",
                        kind="slice",
                        title=f"Copernicus temperature slice · {float(model['depth'][depth_index]):.2f} m",
                    )
                except EvidenceError as fallback_exc:
                    error_state("Neither model view can be rendered from the cached model file.")
                    developer_details(fallback_exc)

    with right:
        card_header(
            "Spatial collocation",
            f"Selected profile: {selected.get('profile_id', 'Not available')}",
        )
        if model is None:
            empty_state("The collocation map needs the cached model grid coordinates.")
        else:
            try:
                chart(
                    map_figure(model, selected),
                    "collocation_map",
                    kind="map",
                    title="Argo position → nearest valid Copernicus water cell",
                )
                helper_text(
                    f"Argo {float(selected['observation_latitude']):.5f}°N, "
                    f"{float(selected['observation_longitude']):.5f}°E · model cell "
                    f"{float(selected['model_cell_latitude']):.5f}°N, "
                    f"{float(selected['model_cell_longitude']):.5f}°E · "
                    f"{float(selected['spatial_distance_km']):.3f} km separation"
                )
            except Exception as exc:
                error_state("The offline collocation map could not be rendered.")
                developer_details(exc)

    if model is not None:
        with st.expander(
            f"Inspect selected model depth slice · {float(model['depth'][depth_index]):.2f} m",
            expanded=False,
        ):
            helper_text("Actual Copernicus temperature values at the selected model depth; no synthetic field is drawn.")
            try:
                chart(
                    slice_figure(model, depth_index),
                    "selected_depth_slice",
                    kind="slice",
                    title=f"Temperature at {float(model['depth'][depth_index]):.2f} m",
                )
            except EvidenceError as exc:
                error_state("No finite model temperature is available at this selected depth.")
                developer_details(exc)


def render_comparison_row(selected: dict) -> None:
    count = int(selected.get("matched_level_count", len(selected["_table"])))
    profile_id = str(selected.get("profile_id", "Not available"))

    section_title(
        "Depth-resolved model–observation comparison",
        "Both charts use the same QC-accepted matched-level table that supplies the metrics and selected-profile downloads.",
        kicker="Compare",
    )

    left, right = st.columns(2, gap="medium")

    with left:
        card_header(
            "Temperature profile comparison — Argo vs Copernicus",
            f"Selected profile: {profile_id} · {count} matched QC-accepted levels",
        )
        chart(
            profile_figure(selected["_table"]),
            "profile_comparison",
            kind="profile",
            title="Temperature profile comparison — Argo vs Copernicus",
        )

    with right:
        card_header(
            "Temperature difference by depth",
            "ΔT = Tmodel − Tobservation · left/negative = model cooler · right/positive = model warmer",
        )
        chart(
            bias_figure(selected["_table"]),
            "bias_by_depth",
            kind="bias",
            title="Model − observation temperature difference",
        )
