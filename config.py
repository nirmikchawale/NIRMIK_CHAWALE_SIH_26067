"""Portable configuration for the offline OceanTwin 3D MVP."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"

COMPARISON_DIR = Path(
    os.environ.get("OCEANTWIN_COMPARISON_DIR", DATA_DIR / "comparison")
).expanduser()
MODEL_FILE = Path(
    os.environ.get(
        "OCEANTWIN_MODEL_FILE",
        DATA_DIR / "glorys12_20240102_67E70E_12N14N_0m500m.nc",
    )
).expanduser()

MODEL_LABEL = "Copernicus Marine · GLORYS12V1"
PRODUCT_LABEL = "GLOBAL_MULTIYEAR_PHY_001_030 · version 202311"
DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1D-m"
MODEL_DOI = "10.48670/moi-00021"
ARGO_DOI = "10.17882/42182"
ARGO_PROVIDER = "Ifremer Argo GDAC"
DEMO_DATE = "2 January 2024"
DEMO_REGION = "67–70°E, 12–14°N"
DISCLAIMER = (
    "This is a model–observation diagnostic comparison, not independent validation. "
    "The reanalysis may assimilate in-situ observations. This prototype covers one region, "
    "one day and a small set of profiles, and is not a complete Digital Twin Ocean or "
    "operational forecasting system."
)

MODEL_COLOR = "#7B82FF"
ARGO_COLOR = "#35E0CF"
ZERO_COLOR = "#F2F6FC"
PAGE_BG = "#06111F"
PANEL_BG = "#0B1D31"
TEXT = "#F2F7FF"
MUTED = "#B1C3D6"

TEMP_COLORSCALE = [
    [0.00, "#111B4C"],
    [0.25, "#253C7A"],
    [0.50, "#386F9C"],
    [0.75, "#3DA7AC"],
    [1.00, "#D7C98C"],
]
BIAS_COLORSCALE = [
    [0.00, "#2878B5"],
    [0.50, "#EDF3F8"],
    [1.00, "#D97732"],
]
