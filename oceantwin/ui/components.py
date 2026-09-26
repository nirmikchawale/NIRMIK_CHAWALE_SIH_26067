"""Reusable judge-facing UI components."""
from __future__ import annotations

import html
import os

import streamlit as st

from config import DISCLAIMER
from .plotly_theme import apply_plotly_theme


def _esc(value) -> str:
    return html.escape(str(value))


def _number(value, formatter) -> str:
    try:
        if value is None:
            return "Not available"
        return formatter(float(value))
    except (TypeError, ValueError):
        return "Not available"


def badge(label: str, *, tone: str = "default") -> str:
    suffix = {
        "offline": " ot-badge--offline",
        "science": " ot-badge--science",
    }.get(tone, "")
    return f'<span class="ot-badge{suffix}">{_esc(label)}</span>'


def product_header() -> None:
    st.markdown(
        """
<div class="ot-header">
  <div class="ot-brand-row">
    <div class="ot-eyebrow">THE OPTIMIZERS · SIH26067 · VERIFIED LOCAL DEMO</div>
    <div class="ot-badges">
      <span class="ot-badge ot-badge--offline">● Local cache · offline-ready</span>
      <span class="ot-badge ot-badge--science">Temperature diagnostic</span>
    </div>
  </div>
  <div class="ot-title">OceanTwin 3D — Explainable Water-Column Explorer</div>
  <div class="ot-subtitle">Trace a real Copernicus temperature field to a QC-screened Argo profile, inspect where the two were collocated, and examine their depth-resolved agreement.</div>
  <div class="ot-scope">Historical reproducible evidence · 2 January 2024 · 67–70°E, 12–14°N · local scientific files only</div>
</div>
""",
        unsafe_allow_html=True,
    )


def profile_identity(summary: dict) -> None:
    direction = "descending" if str(summary.get("direction", "")).upper() == "D" else "ascending"
    st.markdown(
        '<div class="ot-profile-chip">'
        f'<strong>Selected profile:</strong> {_esc(summary.get("profile_id", "Not available"))}'
        f'<span>Float {_esc(summary.get("platform_id", "Not available"))}</span>'
        f'<span>Cycle {_esc(summary.get("cycle", "Not available"))}</span>'
        f'<span>{_esc(direction)}</span>'
        '</div>',
        unsafe_allow_html=True,
    )


def build_metric_items(summary: dict) -> list[tuple[str, str, str]]:
    depth = "Not available"
    try:
        if summary.get("shallowest_matched_depth_m") is not None and summary.get("deepest_matched_depth_m") is not None:
            depth = (
                f"{float(summary['shallowest_matched_depth_m']):.1f}–"
                f"{float(summary['deepest_matched_depth_m']):.1f} m"
            )
    except (TypeError, ValueError):
        depth = "Not available"

    matched = "Not available"
    try:
        if summary.get("matched_level_count") is not None:
            matched = str(int(summary["matched_level_count"]))
    except (TypeError, ValueError):
        pass

    return [
        ("Matched levels", matched, "QC-accepted depths compared after interpolation"),
        ("Matched depth", depth, "Depth range represented by the valid matched levels"),
        (
            "Spatial separation",
            _number(summary.get("spatial_distance_km"), lambda x: f"{x:.3f} km"),
            "Argo position to nearest valid model cell",
        ),
        (
            "Obs − model time",
            _number(summary.get("time_offset_hours"), lambda x: f"{x:+.3f} h"),
            "Argo observation time relative to model field",
        ),
        (
            "MAE",
            _number(summary.get("mae_celsius"), lambda x: f"{x:.4f} °C"),
            "Average absolute model–observation temperature difference",
        ),
        (
            "RMSE",
            _number(summary.get("rmse_celsius"), lambda x: f"{x:.4f} °C"),
            "Outlier-sensitive temperature difference metric",
        ),
    ]


def metric_cards(summary: dict) -> None:
    cards = []
    for label, value, helper in build_metric_items(summary):
        cards.append(
            '<div class="ot-metric" title="' + _esc(helper) + '">'
            f'<div class="ot-metric-label">{_esc(label)}</div>'
            f'<div class="ot-metric-value">{_esc(value)}</div>'
            f'<div class="ot-metric-help">{_esc(helper)}</div>'
            '</div>'
        )
    st.markdown('<div class="ot-metric-grid">' + "".join(cards) + "</div>", unsafe_allow_html=True)


def section_title(title: str, subtitle: str | None = None, kicker: str | None = None) -> None:
    kicker_html = f'<div class="ot-kicker">{_esc(kicker)}</div>' if kicker else ""
    subtitle_html = f'<div class="ot-section-subtitle">{_esc(subtitle)}</div>' if subtitle else ""
    st.markdown(
        '<div class="ot-section"><div class="ot-section-copy">'
        f'{kicker_html}<div class="ot-section-title">{_esc(title)}</div>{subtitle_html}'
        "</div></div>",
        unsafe_allow_html=True,
    )


def card_header(title: str, subtitle: str | None = None) -> None:
    sub = f'<div class="ot-card-subtitle">{_esc(subtitle)}</div>' if subtitle else ""
    st.markdown(
        f'<div class="ot-card-head"><div><div class="ot-card-title">{_esc(title)}</div>{sub}</div></div>',
        unsafe_allow_html=True,
    )


def helper_text(text: str) -> None:
    st.markdown(f'<div class="ot-helper">{_esc(text)}</div>', unsafe_allow_html=True)


def divider() -> None:
    st.markdown('<div class="ot-divider"></div>', unsafe_allow_html=True)


def empty_state(message: str) -> None:
    st.markdown(f'<div class="ot-state">{_esc(message)}</div>', unsafe_allow_html=True)


def error_state(message: str) -> None:
    st.markdown(f'<div class="ot-state ot-state--error">{_esc(message)}</div>', unsafe_allow_html=True)


def loading_state(message: str) -> None:
    st.markdown(f'<div class="ot-state ot-state--loading">{_esc(message)}</div>', unsafe_allow_html=True)


def developer_details(exc: Exception) -> None:
    if os.environ.get("OCEANTWIN_DEV_DIAGNOSTICS", "").strip() == "1":
        with st.expander("Developer diagnostics", expanded=False):
            st.code(str(exc))


def chart(fig, key: str, *, kind: str | None = None, title: str | None = None) -> None:
    themed = apply_plotly_theme(fig, kind=kind, title=title)
    st.plotly_chart(
        themed,
        use_container_width=True,
        key=key,
        config={
            "displaylogo": False,
            "responsive": True,
            "scrollZoom": True,
            "showTips": False,
        },
    )


def limitations_panel() -> None:
    exact = (
        "This is a model–observation diagnostic comparison, not independent validation. "
        "The reanalysis may assimilate in-situ observations."
    )
    st.markdown(
        '<div class="ot-limitations">'
        f'<strong>Scientific limitation:</strong> {_esc(exact)}'
        '<ul>'
        '<li>Daily-mean model field is compared with an instantaneous Argo profile.</li>'
        '<li>Nearest-cell spatial collocation introduces representativeness differences.</li>'
        '<li>Linear depth interpolation is used only between adjacent valid model levels.</li>'
        '<li>The prototype covers one region, one date and two eligible comparison profiles.</li>'
        '<li>No real-time prediction, hazard alerting or operational forecasting is performed.</li>'
        '</ul></div>',
        unsafe_allow_html=True,
    )
    # Keep the full configured disclaimer reachable by assistive/readout tooling.
    st.caption(DISCLAIMER)


def roadmap_panel() -> None:
    st.markdown(
        '<div class="ot-roadmap"><strong>Roadmap only — not active scientific comparisons:</strong> '
        'salinity · current vectors · gliders · bilinear sensitivity · wider-area coverage. '
        'The current release remains temperature-only.</div>',
        unsafe_allow_html=True,
    )
