# OceanTwin 3D — Explainable Water-Column Explorer

**SIH26067 · The Optimizers**

OceanTwin 3D is a React + TypeScript + CesiumJS judge-facing scientific web application backed by FastAPI and static hosted science exports, using bundled Copernicus Marine model evidence and QC-screened Argo comparison profiles. The earlier Streamlit + Plotly application remains preserved as the offline scientific reference and emergency fallback.

> **Scientific framing:** This is a model–observation diagnostic comparison, not independent validation. The reanalysis may assimilate in-situ observations. The bundled GLORYS diagnostic baseline covers one region and one day; the current MVP also includes separately verified INCOIS multi-time physical analysis, INCOIS surface chlorophyll, and Argo/Glider/CTD/BGC observation pathways. It remains a bounded SIH MVP rather than a 24/7 national operational forecasting system.

## Current verified SIH26067 state

The primary judge-facing application is now the **React + TypeScript + CesiumJS** web MVP deployed on GitHub Pages. The preserved Streamlit application is the offline scientific reference and emergency fallback.

Current verified capabilities include:

- genuine GLORYS12V1 temperature, salinity and horizontal current fields across 31 model depths;
- full-water-column `uo/vo` current vectors without inventing a vertical component;
- genuine INCOIS multi-time playback in Explore;
- genuine INCOIS IRS P4 OCM chlorophyll as a first-class **surface-only** Explore source in mg/m³;
- Argo, Glider, CTD and BGC observation pathways through the canonical sensor plugin contract;
- browser-native CF-aware NetCDF4 ingestion plus CSV/TSV/ASCII/JSON ingestion into temporary Explorer layers;
- model-vs-observation diagnostics, anomaly screening, telemetry, provenance and evidence downloads;
- source/plugin registry, verified INCOIS OPeNDAP DAP2 and WMS pathways, plus OceanTwin WMS/WCS compatibility services;
- automated public deployment verification with live Chromium judge-flow acceptance.

See `docs/SIH26067_COMPLETION_MATRIX.md` and `docs/SIH26067_COMPLETION_STATE.md` for the authoritative final requirement state.

## Verified scientific scope

- Copernicus Marine `GLOBAL_MULTIYEAR_PHY_001_030` / GLORYS12V1.
- Cached dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m`, version `202311`.
- 2 January 2024, 67–70°E and 12–14°N.
- Actual `thetao` cube: 31 depths × 25 latitudes × 37 longitudes; ~0.49–454 m.
- 26 Argo profiles represented in ingestion provenance; 2 eligible comparison profiles.
- 99 valid matched temperature levels total.
- Verified default demo: `20240102_indian_ocean_prof:23`, float 5907092, cycle 13 descending, 50 matched levels.
- Spatial collocation: nearest valid model water cell.
- Vertical matching: linear interpolation between adjacent valid model depths; no extrapolation.
- Bias convention: Model − Observation.

## Judge-facing product experience

- Compact product header with explicit local/offline status.
- Selected-profile identity chip and six responsive evidence metrics.
- Genuine Plotly 3D `thetao` model context with actual-depth 2D fallback.
- Enlarged offline collocation map showing Argo position, nearest valid model cell, connecting line and distance.
- Argo-vs-Copernicus temperature profile directly in the primary dashboard flow.
- Model − Observation bias-by-depth directly beside the profile chart.
- Cyan Copernicus / amber Argo semantic series colours.
- Zero-centred cool-to-warm bias presentation.
- Compact provenance and method inspection.
- Visible diagnostic-not-validation limitations.
- Readable selected-profile CSV/JSON and provenance/config/verification downloads.
- One-click **Reset to verified demo** recovery.
- Friendly failure states; raw Python diagnostics are hidden unless explicitly enabled.
- No required runtime scientific-data network request.

## Preserved scientific fallback hierarchy

```text
NIRMIK_CHAWALE_SIH_PERSONAL/
├── app.py                         # thin Streamlit entry point
├── config.py                      # scientific/runtime constants + chart presentation tokens
├── .streamlit/
│   └── config.toml                # native Streamlit theme
├── oceantwin/
│   ├── __init__.py
│   ├── application.py             # orchestration and sidebar composition
│   ├── state.py                   # verified demo state/reset logic
│   ├── ui/
│   │   ├── tokens.py              # versioned semantic UI tokens
│   │   ├── theme.py               # offline CSS design system
│   │   ├── components.py          # reusable product UI components
│   │   └── plotly_theme.py        # presentation-only Plotly normalization
│   └── views/
│       ├── dashboard.py           # model/map + profile/bias rows
│       └── evidence.py            # provenance, limitations and downloads
├── src/                           # preserved validated scientific core
│   ├── comparison_loader.py
│   ├── data_loader.py
│   ├── map_view.py
│   ├── profile_charts.py
│   ├── provenance_view.py
│   └── volume_view.py
├── data/                          # bundled verified scientific evidence
├── tests/
│   ├── test_comparison_loader.py
│   ├── test_data_loader.py
│   ├── test_visuals_and_evidence.py
│   └── test_ui_product_contract.py
└── docs/
    ├── BACKLOG_IMPLEMENTATION_MATRIX.md
    ├── UI_DESIGN_SYSTEM.md
    ├── VISUAL_DEMO_CHECKLIST.md
    ├── FINAL_AUDIT.md
    ├── SCIENTIFIC_METHOD.md
    ├── DATA_DICTIONARY.md
    ├── DEMO_RUNBOOK.md
    ├── TROUBLESHOOTING.md
    └── PPT_CONTENT.md
```

## Windows PowerShell setup

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run regression tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Run the application:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Expected local URL:

```text
http://localhost:8501
```

## CI quality gates

GitHub Actions now runs:

1. full pytest regression suite;
2. Python compilation for `app.py`, `config.py`, `oceantwin/`, `src/` and `tests/`;
3. headless Streamlit startup health check.

Current scientific and product validation is enforced by the repository's active pytest, frontend typecheck/build, static-hosted, and live-browser workflows.

## Offline demonstration

Before judging:

1. start from a fresh terminal;
2. run the regression suite;
3. start Streamlit;
4. press **Reset to verified demo**;
5. disconnect Wi-Fi;
6. refresh once;
7. verify the default profile, metrics, model/map row, profile/bias row and evidence downloads;
8. if WebGL 3D is unreliable, enable the 2D compatibility fallback.

The runtime scientific data path is local. The 2D fallback uses the same actual model array at the selected depth.

## Planning implementation

- `docs/BACKLOG_IMPLEMENTATION_MATRIX.md` maps the 12 macro finalisation features and all five chunks of the 250-feature backlog to the application files.
- `docs/UI_DESIGN_SYSTEM.md` documents semantic colours, typography, spacing, responsive behaviour and judge-safe error rules.
- `docs/VISUAL_DEMO_CHECKLIST.md` provides 1366×768 and 1920×1080 manual verification.

## Current deliberate boundaries

The following remain intentionally bounded and must not be overstated:

- the bundled GLORYS comparison baseline has one genuine timestamp;
- currents are horizontal `uo/vo` only; no vertical-current component is fabricated;
- INCOIS chlorophyll is a satellite surface product and does not have a fabricated depth axis;
- GLORYS–Argo results are diagnostic, not independent/global validation;
- anomaly screening is descriptive statistical screening, not ML event detection or proof of sensor/model failure;
- OceanTwin is a verified SIH MVP, not a 24/7 national operational digital twin or hazard-forecasting system.

## Scientific sources

- Copernicus Marine Global Ocean Physics Reanalysis — `GLOBAL_MULTIYEAR_PHY_001_030`
- Copernicus DOI — `10.48670/moi-00021`
- Ifremer Argo GDAC
- Argo DOI — `10.17882/42182`

## Presentation rule

Do not place Streamlit UI screenshots in the SIH PPT. Use native diagrams, architecture/methodology flowcharts, tables, metric callouts and scientific charts recreated directly from verified evidence where permitted. Demonstrate the application live.


## Final MVP web architecture

The final SIH26067 judge-facing MVP is implemented additively on top of the verified prototype:

```text
React + CesiumJS
       |
     FastAPI
       |
validated Python scientific core
       |
bundled Copernicus + Argo evidence
```

The existing Streamlit application remains the **frozen scientific reference and emergency
demo fallback**. It is not replaced or rewritten.

The bundled Copernicus subset contains verified `thetao`, `so`, `uo`, and `vo` fields, so the web MVP exposes real temperature, salinity, and current data from the same file. That GLORYS baseline contains one genuine model timestamp and remains honestly static; genuine time playback is provided separately through the verified INCOIS multi-time source.

See:

- `docs/FINAL_MVP_ARCHITECTURE.md`
- `docs/FINAL_MVP_RUNBOOK.md`
- `backend/README.md`
- `frontend/README.md`


## One-click local launch

For Windows demo machines, after the one-time Python/Node setup is complete:

- Double-click `START_OCEANTWIN.cmd` at the repository root.
- It launches the FastAPI scientific API on port 8000 and the React + Cesium frontend on port 5173.
- The browser opens automatically at `http://localhost:5173`.
- Double-click `STOP_OCEANTWIN.cmd` to stop both local services.

This is the preferred local judge/demo workflow; manual PowerShell startup is only a troubleshooting fallback.
