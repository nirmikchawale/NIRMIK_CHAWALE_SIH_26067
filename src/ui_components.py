"""Reusable Streamlit visual components."""
from __future__ import annotations

import html

import streamlit as st

from config import ARGO_COLOR, MODEL_COLOR, MUTED, PAGE_BG, PANEL_BG, TEXT


def style():
    st.markdown(
        f"""
<style>
:root {{ color-scheme: dark; }}
html, body, [class*="css"] {{ color:{TEXT}; }}
.stApp {{ background: radial-gradient(circle at 80% 0%, #102A46 0%, {PAGE_BG} 37%, #040C16 100%); color:{TEXT}; }}
[data-testid="stSidebar"] {{ background: #071524; border-right: 1px solid rgba(145,169,194,.14); }}
[data-testid="stSidebar"] p, [data-testid="stSidebar"] label, [data-testid="stSidebar"] span {{ color:{TEXT}; }}
.block-container {{ max-width: 1500px; padding-top: 1.45rem; padding-bottom: 2.2rem; }}
h1, h2, h3, h4 {{ letter-spacing: -0.025em; color:{TEXT} !important; }}
h1 {{ font-size: clamp(2rem, 4vw, 3.35rem) !important; line-height: 1.02 !important; }}
p, li, label, [data-testid="stCaptionContainer"], [data-testid="stWidgetLabel"] p {{ color:{TEXT} !important; }}
[data-testid="stCaptionContainer"] {{ opacity:.82; }}
[data-testid="stExpander"] {{ border:1px solid rgba(145,169,194,.16); border-radius:12px; background:rgba(11,29,49,.50); }}
[data-testid="stExpander"] summary, [data-testid="stExpander"] summary p {{ color:{TEXT} !important; font-weight:700; }}
[data-testid="stPlotlyChart"] {{ background:{PANEL_BG} !important; border-radius:14px; overflow:hidden; min-height:2rem; }}
[data-testid="stPlotlyChart"] > div {{ background:{PANEL_BG} !important; }}
[data-baseweb="tab-list"] button p {{ color:{TEXT} !important; font-weight:700; }}
.eyebrow {{ color:{ARGO_COLOR}; font-size:.76rem; letter-spacing:.18em; font-weight:800; margin-bottom:.55rem; }}
.product-subtitle {{ color:{TEXT}; font-size:1.02rem; line-height:1.5; max-width:980px; margin:.15rem 0 .35rem; }}
.scope-line {{ color:{MUTED}; font-size:.82rem; letter-spacing:.025em; margin-bottom:.55rem; }}
.status {{ background:linear-gradient(90deg, rgba(50,214,197,.13), rgba(109,114,246,.10)); border:1px solid rgba(50,214,197,.28); border-radius:12px; padding:.72rem 1rem; color:{TEXT}; margin:.6rem 0 1.05rem; }}
.status span {{ float:right; color:{ARGO_COLOR}; font-size:.76rem; font-weight:800; letter-spacing:.12em; }}
.section-kicker {{ color:{MUTED}; text-transform:uppercase; letter-spacing:.14em; font-size:.72rem; font-weight:800; margin-bottom:.1rem; }}
.panel-note {{ color:{MUTED}; font-size:.86rem; margin-top:-.30rem; margin-bottom:.60rem; }}
.panel-note code {{ color:{ARGO_COLOR}; background:rgba(50,214,197,.08); padding:.08rem .28rem; border-radius:5px; }}
.metric-grid {{ display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.60rem; margin:.50rem 0 1.0rem; }}
.metric-card {{ background:linear-gradient(180deg,rgba(17,42,69,.96),rgba(9,27,46,.98)); border:1px solid rgba(145,169,194,.18); border-radius:14px; padding:.72rem .85rem; min-height:76px; }}
.metric-label {{ color:{MUTED}; font-size:.67rem; text-transform:uppercase; letter-spacing:.09em; margin-bottom:.32rem; }}
.metric-value {{ color:{TEXT}; font-size:1.00rem; font-weight:750; line-height:1.15; overflow-wrap:anywhere; }}
.model-dot {{ color:{MODEL_COLOR}; }}
.argo-dot {{ color:{ARGO_COLOR}; }}
.roadmap {{ background:rgba(145,169,194,.07); border:1px dashed rgba(145,169,194,.25); border-radius:12px; padding:.70rem .85rem; color:{MUTED}; }}
.prov-grid {{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.55rem .70rem; margin:.25rem 0 .75rem; }}
.prov-item {{ background:rgba(9,27,46,.72); border:1px solid rgba(145,169,194,.14); border-radius:10px; padding:.62rem .72rem; }}
.prov-label {{ color:{MUTED}; font-size:.66rem; text-transform:uppercase; letter-spacing:.08em; margin-bottom:.18rem; }}
.prov-value {{ color:{TEXT}; font-size:.88rem; line-height:1.35; overflow-wrap:anywhere; }}
.source-footer {{ margin-top:1.1rem; padding-top:.65rem; border-top:1px solid rgba(145,169,194,.15); color:{MUTED}; font-size:.76rem; line-height:1.45; }}
[data-testid="stMetric"] {{ background:{PANEL_BG}; border:1px solid rgba(145,169,194,.15); padding:.55rem .8rem; border-radius:12px; }}
.stDownloadButton button, .stButton button {{ width:100%; border-radius:10px; }}
@media (max-width: 1000px) {{ .metric-grid, .prov-grid {{ grid-template-columns:repeat(2,minmax(0,1fr)); }} .status span {{ float:none; display:block; margin-top:.3rem; }} }}
@media (max-width: 650px) {{ .metric-grid, .prov-grid {{ grid-template-columns:1fr; }} }}
</style>
""",
        unsafe_allow_html=True,
    )


def _card(label: str, value: str) -> str:
    return (
        '<div class="metric-card">'
        f'<div class="metric-label">{html.escape(label)}</div>'
        f'<div class="metric-value">{html.escape(value)}</div>'
        '</div>'
    )


def metrics(summary: dict):
    direction = "descending" if str(summary.get("direction", "")).upper() == "D" else "ascending"
    items = [
        ("Profile ID", str(summary["profile_id"])),
        ("Float", str(summary["platform_id"])),
        ("Cycle", f"{summary['cycle']} · {direction}"),
        ("Matched levels", f"{int(summary['matched_level_count'])}"),
        ("Spatial separation", f"{float(summary['spatial_distance_km']):.3f} km"),
        ("Obs − model time", f"{float(summary['time_offset_hours']):+.3f} h"),
        ("Daily-midpoint offset", f"{float(summary['time_offset_from_daily_midpoint_hours']):+.3f} h"),
        ("MAE", f"{float(summary['mae_celsius']):.4f} °C"),
        ("RMSE", f"{float(summary['rmse_celsius']):.4f} °C"),
        (
            "Matched depth",
            f"{float(summary['shallowest_matched_depth_m']):.1f}–{float(summary['deepest_matched_depth_m']):.1f} m",
        ),
    ]
    st.markdown('<div class="metric-grid">' + ''.join(_card(k, v) for k, v in items) + '</div>', unsafe_allow_html=True)


def chart(fig, key: str):
    st.plotly_chart(
        fig,
        use_container_width=True,
        key=key,
        config={"displaylogo": False, "scrollZoom": True, "responsive": True},
    )
