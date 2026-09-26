from __future__ import annotations

from pathlib import Path

import streamlit as st

from config import COMPARISON_DIR, DEMO_DATE, DISCLAIMER, MODEL_FILE, MODEL_LABEL, PRODUCT_LABEL
from src.comparison_loader import (
    EvidenceError,
    load_bundle,
    load_optional_metadata,
    select_profile,
)
from src.data_loader import load_model
from src.map_view import map_figure
from src.profile_charts import bias_figure, profile_figure
from src.provenance_view import downloads, provenance_panel, source_footer
from src.ui_components import chart, metrics, style
from src.volume_view import slice_figure, volume_figure

st.set_page_config(
    page_title="OceanTwin 3D | The Optimizers",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)
style()


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


st.markdown('<div class="eyebrow">THE OPTIMIZERS · SIH26067 · LOCAL SCIENTIFIC DEMO</div>', unsafe_allow_html=True)
st.title("OceanTwin 3D — Explainable Water-Column Explorer")
st.markdown(
    '<div class="product-subtitle">Interactive, traceable water-column diagnostics from a cached Copernicus model subset and QC-screened Argo profiles.</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="scope-line">Temperature diagnostic · Copernicus model subset vs QC-screened Argo profile · historical reproducible evidence</div>',
    unsafe_allow_html=True,
)
st.markdown(
    '<div class="status">● Historical curated demo data — Copernicus 2 Jan 2024 + Argo observations '
    '<span>LOCAL CACHE · OFFLINE-CAPABLE</span></div>',
    unsafe_allow_html=True,
)

try:
    comparison_config, provenance, profiles = cached_bundle(
        str(COMPARISON_DIR), directory_stamp(COMPARISON_DIR)
    )
except EvidenceError as exc:
    st.error(str(exc))
    st.info("Restore the verified local comparison package. OceanTwin will not synthesize replacement measurements.")
    st.stop()

if not profiles:
    st.error("No eligible comparison profile is available in the local evidence package.")
    st.stop()

model = None
model_error = None
try:
    stamp = (MODEL_FILE.stat().st_mtime_ns, MODEL_FILE.stat().st_size) if MODEL_FILE.is_file() else None
    model = cached_model(str(MODEL_FILE), stamp, comparison_config)
except EvidenceError as exc:
    model_error = str(exc)

profile_ids = [p["profile_id"] for p in profiles]
default_profile_id = profiles[0]["profile_id"]
default_depth_index = min(18, len(model["depth"]) - 1) if model is not None else 0

# Stable widget state makes the judged demo resettable in one click.
def _default_state():
    return {
        "selected_profile_id": default_profile_id,
        "show_metadata": True,
        "model_depth_index": default_depth_index,
        "vertical_exaggeration": 5.0,
        "point_opacity": 0.50,
        "force_2d": False,
    }

for key, value in _default_state().items():
    if key not in st.session_state:
        st.session_state[key] = value
if st.session_state["selected_profile_id"] not in profile_ids:
    st.session_state["selected_profile_id"] = default_profile_id
if model is not None and st.session_state["model_depth_index"] not in range(len(model["depth"])):
    st.session_state["model_depth_index"] = default_depth_index


def reset_demo():
    for key, value in _default_state().items():
        st.session_state[key] = value


with st.sidebar:
    st.markdown("## OceanTwin **3D**")
    st.caption("EXPLAINABLE WATER-COLUMN EXPLORER")
    st.button("↺ Reset to verified demo", on_click=reset_demo, use_container_width=True)
    st.divider()
    st.markdown(f"**{MODEL_LABEL}**")
    st.caption(PRODUCT_LABEL)
    st.caption(f"Historical field · {DEMO_DATE}")
    st.divider()
    st.selectbox("Enabled variable", ["Temperature"], index=0, disabled=True)
    st.markdown(
        '<div class="roadmap"><b>Available context / not enabled for comparison</b><br>Salinity<br>Current vectors</div>',
        unsafe_allow_html=True,
    )
    st.divider()

    def profile_label(pid: str) -> str:
        p = select_profile(profiles, pid)
        direction = "descending" if str(p["direction"]).upper() == "D" else "ascending"
        return f"Float {p['platform_id']} · cycle {p['cycle']} {direction}"

    selected_id = st.selectbox(
        "Selected observation profile",
        profile_ids,
        format_func=profile_label,
        key="selected_profile_id",
    )
    show_metadata = st.toggle("Show comparison metadata", key="show_metadata")

    depth_index = 0
    vertical_exaggeration = 5.0
    opacity = 0.50
    force_2d = False
    if model is not None:
        depth_index = st.select_slider(
            "Model depth",
            options=list(range(len(model["depth"]))),
            format_func=lambda i: f"{model['depth'][i]:.2f} m",
            key="model_depth_index",
        )
        vertical_exaggeration = st.slider(
            "Visual vertical exaggeration",
            min_value=1.0,
            max_value=10.0,
            step=0.5,
            help="Changes only display geometry; scientific depth values remain metres.",
            key="vertical_exaggeration",
        )
        opacity = st.slider("3D point opacity", min_value=0.15, max_value=1.0, step=0.05, key="point_opacity")
        force_2d = st.toggle(
            "Use 2D compatibility fallback",
            help="Use this if browser/GPU WebGL 3D is unreliable.",
            key="force_2d",
        )
    st.divider()
    with st.expander("About this comparison", expanded=False):
        st.caption(
            "Nearest valid Copernicus water cell + linear vertical interpolation to accepted Argo depths. "
            "Bias is Model − Observation. This is a diagnostic comparison, not independent validation."
        )
    st.caption("Read-only evidence · Local cache · No runtime scientific-data downloads")

try:
    selected = select_profile(profiles, selected_id)
except EvidenceError as exc:
    st.error(str(exc))
    st.stop()

# Reference numbers are discrepancy detectors only. Loaded evidence remains authoritative.
if selected["profile_id"] == "20240102_indian_ocean_prof:23":
    reference = {
        "matched_level_count": 50,
        "spatial_distance_km": 3.851344566390636,
        "time_offset_hours": 14.766666666666667,
        "time_offset_from_daily_midpoint_hours": 2.7666666666666666,
        "mae_celsius": 0.22538286668411817,
        "rmse_celsius": 0.3188158440179983,
    }
    mismatched = [
        key
        for key, expected in reference.items()
        if abs(float(selected[key]) - float(expected)) > 1e-9
    ]
    if mismatched:
        st.error(
            "Loaded evidence differs from the verified demonstration reference for: "
            + ", ".join(mismatched)
            + ". Loaded evidence is shown; investigate before presenting."
        )

st.markdown('<div class="section-kicker">Selected-profile evidence</div>', unsafe_allow_html=True)
metrics(selected)

explore_tab, compare_tab, evidence_tab = st.tabs(
    ["01 · Explore water column", "02 · Compare profile", "03 · Evidence & limitations"]
)

with explore_tab:
    st.subheader("Spatial + depth context")
    if model is None:
        st.warning(model_error or "3D model file unavailable.")
        st.info("The verified matched-profile charts remain usable. Restore the cached NetCDF to enable model views.")
    else:
        left, right = st.columns([1.35, 1.0], gap="large")
        with left:
            st.markdown("### True depth-aware model view")
            st.markdown(
                '<div class="panel-note">Plotly 3D point cloud generated from the actual Copernicus '
                '<code>thetao</code> array. The highlighted layer follows the selected real model depth.</div>',
                unsafe_allow_html=True,
            )
            if force_2d:
                st.info("2D compatibility mode is enabled. Showing the actual selected-depth slice.")
                try:
                    chart(slice_figure(model, depth_index), "forced_slice")
                except EvidenceError as exc:
                    st.warning(str(exc))
            else:
                try:
                    chart(volume_figure(model, depth_index, vertical_exaggeration, opacity), "temperature_3d")
                except Exception as exc:
                    st.warning("3D rendering is unavailable. Falling back to the actual selected-depth slice.")
                    st.caption(str(exc))
                    try:
                        chart(slice_figure(model, depth_index), "auto_slice")
                    except EvidenceError as fallback_exc:
                        st.error(str(fallback_exc))
        with right:
            st.markdown("### Collocation context")
            st.markdown(
                '<div class="panel-note">Offline coordinate map showing the model domain, Argo profile, nearest model cell and separation.</div>',
                unsafe_allow_html=True,
            )
            chart(map_figure(model, selected), "map_context")
            st.caption(
                f"Argo observation: {selected['observation_time_utc']} · model daily field: {DEMO_DATE} · "
                f"separation: {float(selected['spatial_distance_km']):.3f} km"
            )

        with st.expander(f"Selected model depth slice · {model['depth'][depth_index]:.2f} m", expanded=False):
            st.caption("Actual Copernicus temperature values at this model depth; the full-volume temperature scale is retained.")
            try:
                chart(slice_figure(model, depth_index), "depth_slice")
            except EvidenceError as exc:
                st.info(str(exc))

with compare_tab:
    st.subheader("Selected Argo profile vs collocated Copernicus model")
    a, b = st.columns(2, gap="large")
    with a:
        st.markdown("### Temperature profile")
        st.caption("Potential temperature · °C · depth increases downward")
        chart(profile_figure(selected["_table"]), "profile_comparison")
    with b:
        st.markdown("### Difference by depth")
        st.caption("Model − Observation · negative = model cooler · positive = model warmer")
        chart(bias_figure(selected["_table"]), "bias_by_depth")
    st.warning(DISCLAIMER, icon="⚠️")

with evidence_tab:
    st.subheader("Evidence, provenance & limitations")
    with st.expander("How this comparison was made", expanded=True):
        st.write(
            "The two configured Argo profiles use provider-QC-1 adjusted pressure, temperature and auxiliary salinity. "
            "Observation pressure is converted to positive-down depth; observation temperature is converted to potential "
            "temperature referenced to 0 dbar. The model profile comes from the nearest valid water cell, then model "
            "temperature is linearly interpolated only between adjacent valid model levels. No spatial, vertical or temporal extrapolation is performed."
        )
        st.caption(
            "For the displayed profile, every KPI and both comparison charts are validated against the same matched-level CSV subset."
        )

    with st.expander("Data provenance and limitations", expanded=show_metadata):
        provenance_panel(COMPARISON_DIR, comparison_config, provenance, selected, model)

    with st.expander("About this MVP · built now & roadmap", expanded=False):
        optional = load_optional_metadata(COMPARISON_DIR)
        argo_summary = optional.get("argo_summary", {})
        st.markdown("**Built now**")
        st.write(
            f"Temperature diagnostic · {len(profiles)} eligible QC-preserved Argo profiles · "
            f"{sum(int(p['matched_level_count']) for p in profiles)} matched levels · local historical cached data."
        )
        if model is not None:
            st.write(
                f"Copernicus depth coverage in this cached subset: {model['depth'][0]:.2f}–{model['depth'][-1]:.2f} m "
                f"across {len(model['depth'])} levels."
            )
        if argo_summary.get("profiles") is not None:
            st.write(f"Original Argo ingestion represented in provenance: {argo_summary['profiles']} profiles.")
        st.markdown("**Roadmap / not enabled**")
        st.write(
            "Salinity comparison · Current-vector comparison · Glider layer after provider-QC handling · "
            "Bilinear spatial sensitivity analysis · Wider Indian EEZ coverage · Scheduled source refresh"
        )

    st.markdown("### Download real evidence")
    st.caption("These buttons expose existing verified files; OceanTwin does not fabricate scientific reports.")
    downloads(selected, COMPARISON_DIR)

source_footer(provenance)
st.caption("OceanTwin 3D · The Optimizers · SIH26067 | Explainable evidence, from surface to depth.")
