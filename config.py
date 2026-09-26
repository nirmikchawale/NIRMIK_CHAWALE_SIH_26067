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

# Scientific-series semantic colours. Values only affect presentation.
MODEL_COLOR = "#39C6E8"
ARGO_COLOR = "#F5B544"
ZERO_COLOR = "#F4F8FC"
PAGE_BG = "#04111D"
PANEL_BG = "#0A1B2A"
TEXT = "#F6FAFF"
MUTED = "#8FA8BD"

TEMP_COLORSCALE = [
    [0.00, "#102A56"],
    [0.22, "#1F5F8E"],
    [0.48, "#238EAD"],
    [0.72, "#39C6C8"],
    [1.00, "#F4D98E"],
]
BIAS_COLORSCALE = [
    [0.00, "#4C8DFF"],
    [0.50, "#F4F8FC"],
    [1.00, "#FF7A6B"],
]
