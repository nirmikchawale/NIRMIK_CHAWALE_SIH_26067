"""Local, offline-safe visual system for OceanTwin 3D."""
from __future__ import annotations

import streamlit as st

from .tokens import (
    ARGO_AMBER,
    BORDER,
    BORDER_STRONG,
    CARD_RADIUS,
    CARD_SHADOW,
    ERROR_RED,
    LIMITATION_GOLD,
    MODEL_CYAN,
    OFFLINE_TEAL,
    PAGE_BG,
    PAGE_BG_DEEP,
    POSITIVE_CORAL,
    SURFACE,
    SURFACE_ALT,
    SURFACE_SELECTED,
    SYSTEM_FONT_STACK,
    TEXT_MUTED,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
)


def apply_theme() -> None:
    st.markdown(
        f"""
<style>
:root {{
  color-scheme: dark;
  --ot-bg: {PAGE_BG};
  --ot-bg-deep: {PAGE_BG_DEEP};
  --ot-surface: {SURFACE};
  --ot-surface-alt: {SURFACE_ALT};
  --ot-surface-selected: {SURFACE_SELECTED};
  --ot-border: {BORDER};
  --ot-border-strong: {BORDER_STRONG};
  --ot-text: {TEXT_PRIMARY};
  --ot-text-secondary: {TEXT_SECONDARY};
  --ot-muted: {TEXT_MUTED};
  --ot-model: {MODEL_CYAN};
  --ot-argo: {ARGO_AMBER};
  --ot-offline: {OFFLINE_TEAL};
  --ot-limit: {LIMITATION_GOLD};
  --ot-error: {ERROR_RED};
  --ot-positive: {POSITIVE_CORAL};
  --ot-radius: {CARD_RADIUS};
}}

html, body, [class*="css"], [data-testid="stAppViewContainer"] {{
  font-family: {SYSTEM_FONT_STACK};
}}

.stApp {{
  background:
    radial-gradient(circle at 78% -8%, rgba(34, 142, 180, .18) 0%, rgba(4,17,29,0) 32%),
    radial-gradient(circle at 18% 14%, rgba(45, 212, 191, .07) 0%, rgba(4,17,29,0) 24%),
    linear-gradient(180deg, {PAGE_BG} 0%, {PAGE_BG_DEEP} 100%);
  color: var(--ot-text);
}}

[data-testid="stHeader"] {{
  background: transparent;
}}

#MainMenu, footer {{
  visibility: hidden;
}}

.block-container {{
  max-width: 1680px;
  padding-top: .55rem;
  padding-bottom: 2rem;
  padding-left: clamp(.85rem, 2vw, 1.7rem);
  padding-right: clamp(.85rem, 2vw, 1.7rem);
}}

[data-testid="stSidebar"] {{
  background: rgba(5, 18, 30, .98);
  border-right: 1px solid var(--ot-border);
}}

[data-testid="stSidebar"] * {{
  color: var(--ot-text);
}}

h1, h2, h3, h4 {{
  color: var(--ot-text) !important;
  letter-spacing: -.025em;
}}

h1 {{
  font-size: clamp(1.95rem, 3.5vw, 3.1rem) !important;
  line-height: 1.02 !important;
  margin-bottom: .25rem !important;
}}

p, li, label, [data-testid="stCaptionContainer"], [data-testid="stWidgetLabel"] p {{
  color: var(--ot-text-secondary) !important;
}}

[data-testid="stCaptionContainer"] {{
  opacity: .92;
}}

[data-testid="stExpander"] {{
  background: rgba(10, 27, 42, .78);
  border: 1px solid var(--ot-border);
  border-radius: var(--ot-radius);
  overflow: hidden;
}}

[data-testid="stExpander"] summary,
[data-testid="stExpander"] summary p {{
  color: var(--ot-text) !important;
  font-weight: 700;
}}

[data-testid="stPlotlyChart"] {{
  background: var(--ot-surface) !important;
  border: 1px solid var(--ot-border);
  border-radius: var(--ot-radius);
  overflow: hidden;
  box-shadow: {CARD_SHADOW};
}}

[data-testid="stPlotlyChart"] > div {{
  background: var(--ot-surface) !important;
}}

.stButton button, .stDownloadButton button {{
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--ot-border-strong);
  background: var(--ot-surface-alt);
  color: var(--ot-text);
  min-height: 2.45rem;
  font-weight: 650;
}}

.stButton button:hover, .stDownloadButton button:hover {{
  border-color: rgba(57, 198, 232, .58);
  color: var(--ot-text);
}}

[data-baseweb="select"] > div,
[data-baseweb="input"] > div,
[data-testid="stSelectbox"] div[role="button"] {{
  background: var(--ot-surface-alt) !important;
  border-color: var(--ot-border) !important;
}}

hr {{
  border-color: var(--ot-border) !important;
}}

.ot-header {{
  padding: .2rem 0 .55rem;
}}

.ot-brand-row {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .8rem;
  flex-wrap: wrap;
}}

.ot-eyebrow {{
  color: var(--ot-model);
  font-size: .70rem;
  font-weight: 850;
  letter-spacing: .17em;
  text-transform: uppercase;
}}

.ot-title {{
  color: var(--ot-text);
  font-size: clamp(1.95rem, 3.5vw, 3.1rem);
  font-weight: 780;
  letter-spacing: -.035em;
  line-height: 1.04;
  margin: .18rem 0 .28rem;
}}

.ot-subtitle {{
  color: var(--ot-text-secondary);
  font-size: .96rem;
  max-width: 1060px;
  line-height: 1.45;
}}

.ot-scope {{
  color: var(--ot-muted);
  font-size: .78rem;
  margin-top: .30rem;
}}

.ot-badges {{
  display: flex;
  gap: .42rem;
  flex-wrap: wrap;
}}

.ot-badge {{
  display: inline-flex;
  align-items: center;
  gap: .30rem;
  padding: .28rem .52rem;
  border-radius: 999px;
  border: 1px solid var(--ot-border);
  background: rgba(10, 27, 42, .78);
  color: var(--ot-text-secondary);
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .055em;
  text-transform: uppercase;
}}

.ot-badge--offline {{
  border-color: rgba(45, 212, 191, .35);
  color: var(--ot-offline);
}}

.ot-badge--science {{
  border-color: rgba(57, 198, 232, .32);
  color: var(--ot-model);
}}

.ot-profile-chip {{
  display: flex;
  align-items: center;
  gap: .55rem;
  flex-wrap: wrap;
  background: rgba(16, 44, 64, .72);
  border: 1px solid rgba(57, 198, 232, .25);
  border-radius: 11px;
  padding: .48rem .68rem;
  margin: .2rem 0 .55rem;
  color: var(--ot-text-secondary);
  font-size: .78rem;
}}

.ot-profile-chip strong {{
  color: var(--ot-text);
}}

.ot-section {{
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: .75rem;
  margin: .55rem 0 .40rem;
}}

.ot-section-copy {{
  min-width: 0;
}}

.ot-kicker {{
  color: var(--ot-muted);
  text-transform: uppercase;
  letter-spacing: .13em;
  font-size: .64rem;
  font-weight: 850;
  margin-bottom: .10rem;
}}

.ot-section-title {{
  color: var(--ot-text);
  font-size: 1.03rem;
  line-height: 1.25;
  font-weight: 760;
}}

.ot-section-subtitle {{
  color: var(--ot-muted);
  font-size: .75rem;
  line-height: 1.35;
  margin-top: .12rem;
}}

.ot-card {{
  background: rgba(10, 27, 42, .80);
  border: 1px solid var(--ot-border);
  border-radius: var(--ot-radius);
  padding: .75rem;
  box-shadow: {CARD_SHADOW};
}}

.ot-card--nested {{
  background: rgba(13, 35, 53, .66);
  box-shadow: none;
}}

.ot-card--selected {{
  background: rgba(16, 44, 64, .88);
  border-color: rgba(57, 198, 232, .34);
}}

.ot-card-head {{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .6rem;
  margin-bottom: .35rem;
}}

.ot-card-title {{
  color: var(--ot-text);
  font-weight: 750;
  font-size: .90rem;
}}

.ot-card-subtitle, .ot-helper {{
  color: var(--ot-muted);
  font-size: .72rem;
  line-height: 1.38;
}}

.ot-divider {{
  height: 1px;
  background: var(--ot-border);
  margin: .65rem 0;
}}

.ot-metric-grid {{
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: .48rem;
  margin: .35rem 0 .72rem;
}}

.ot-metric {{
  position: relative;
  min-height: 74px;
  background: rgba(10, 27, 42, .86);
  border: 1px solid var(--ot-border);
  border-radius: 12px;
  padding: .60rem .67rem;
}}

.ot-metric-label {{
  color: var(--ot-muted);
  font-size: .60rem;
  text-transform: uppercase;
  letter-spacing: .075em;
  margin-bottom: .28rem;
  font-weight: 780;
}}

.ot-metric-value {{
  color: var(--ot-text);
  font-size: 1.00rem;
  line-height: 1.10;
  font-weight: 770;
  overflow-wrap: anywhere;
}}

.ot-metric-help {{
  color: var(--ot-muted);
  font-size: .61rem;
  line-height: 1.23;
  margin-top: .28rem;
}}

.ot-state {{
  border-radius: 12px;
  padding: .70rem .80rem;
  border: 1px solid var(--ot-border);
  background: rgba(10,27,42,.78);
  color: var(--ot-text-secondary);
  font-size: .80rem;
}}

.ot-state--error {{
  border-color: rgba(255, 93, 115, .42);
}}

.ot-state--loading {{
  border-color: rgba(57, 198, 232, .30);
}}

.ot-limitations {{
  border: 1px solid rgba(232, 180, 79, .30);
  background: rgba(232, 180, 79, .055);
  border-radius: 12px;
  padding: .70rem .80rem;
}}

.ot-limitations strong {{
  color: #F6D899;
}}

.ot-limitations ul {{
  margin: .42rem 0 0 1rem;
  padding: 0;
}}

.ot-limitations li {{
  color: var(--ot-text-secondary) !important;
  font-size: .73rem;
  margin: .15rem 0;
}}

.ot-roadmap {{
  background: rgba(143, 168, 189, .055);
  border: 1px dashed rgba(143, 168, 189, .25);
  border-radius: 11px;
  padding: .65rem .72rem;
  color: var(--ot-muted);
  font-size: .72rem;
  line-height: 1.45;
}}

.prov-grid {{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .45rem;
}}

.prov-item {{
  background: rgba(13, 35, 53, .65);
  border: 1px solid var(--ot-border);
  border-radius: 10px;
  padding: .54rem .60rem;
}}

.prov-label {{
  color: var(--ot-muted);
  font-size: .58rem;
  text-transform: uppercase;
  letter-spacing: .07em;
  margin-bottom: .15rem;
}}

.prov-value {{
  color: var(--ot-text-secondary);
  font-size: .72rem;
  line-height: 1.32;
  overflow-wrap: anywhere;
}}

.source-footer {{
  margin-top: .85rem;
  padding-top: .58rem;
  border-top: 1px solid var(--ot-border);
  color: var(--ot-muted);
  font-size: .70rem;
  line-height: 1.42;
}}

@media (max-width: 1200px) {{
  .ot-metric-grid {{
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }}
}}

@media (max-width: 780px) {{
  .block-container {{
    padding-top: .35rem;
  }}
  .ot-metric-grid, .prov-grid {{
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }}
  .ot-title {{
    font-size: 2rem;
  }}
}}

@media (max-width: 520px) {{
  .ot-metric-grid, .prov-grid {{
    grid-template-columns: 1fr;
  }}
}}
</style>
""",
        unsafe_allow_html=True,
    )
