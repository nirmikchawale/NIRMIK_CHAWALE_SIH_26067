# OceanTwin 3D — Explainable Water-Column Explorer

**SIH26067 · The Optimizers**

A local, offline-capable Streamlit + Plotly scientific diagnostic MVP that connects a cached Copernicus Marine model subset with QC-screened Argo profile evidence. It is designed for a reliable SIH live demonstration, not as a complete Digital Twin Ocean, forecast system or independent validation platform.

> **Scientific framing:** This is a model–observation diagnostic comparison, not independent validation. The reanalysis may assimilate in-situ observations. This prototype covers one region, one day and a small set of profiles, and is not a complete Digital Twin Ocean or operational forecasting system.

## Verified scope

- Copernicus Marine `GLOBAL_MULTIYEAR_PHY_001_030` / GLORYS12V1.
- Cached dataset `cmems_mod_glo_phy_my_0.083deg_P1D-m`, version `202311`.
- 2 January 2024, 67–70°E and 12–14°N.
- Actual `thetao` cube: 31 depths × 25 latitudes × 37 longitudes; ~0.49–454 m.
- 26 Argo profiles represented in ingestion provenance; 2 eligible comparison profiles.
- 99 valid matched temperature levels total.
- Default demo: profile `20240102_indian_ocean_prof:23`, float 5907092, cycle 13 descending, 50 levels, 3.851 km, MAE 0.2254 °C, RMSE 0.3188 °C.
- Spatial collocation: nearest valid model water cell.
- Vertical matching: linear interpolation between adjacent valid model depths, no extrapolation.
- Bias: Model − Observation.

Roadmap only: salinity comparison, current-vector validation, glider comparison, bilinear spatial sensitivity, wider Indian EEZ coverage, scheduled refresh and cloud deployment.

## Features

- Resettable judge-ready default state.
- Genuine Plotly 3D model-temperature point cloud from the cached `thetao` array.
- Actual 2D model depth-slice fallback.
- Offline collocation map with domain, Argo point, model cell and separation.
- Argo-vs-model temperature profile and Model − Observation bias-by-depth.
- Evidence-driven KPI cards using the same selected matched-level record as the plots.
- Compact provenance/QC/method/limitations panels.
- Downloads for real profile CSV/JSON, comparison summary, method configuration, provenance and verification results.
- No required runtime scientific-data network request.

## Windows PowerShell setup

Open PowerShell in this project directory.

If `.venv` already exists, skip environment creation. Otherwise use an installed Python interpreter:

```powershell
& "C:\path\to\python.exe" -m venv .venv
```

Install dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run the final MVP tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Expected final package result: **25 passed**.

The preserved original comparison-engine artefact separately records **25 passed** tests for the scientific comparison engine. To re-run that historical engine suite in a fresh environment, install the optional extras in `requirements-test.txt`; they are not required by the Streamlit runtime.

Run the app:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Expected browser URL:

```text
http://localhost:8501
```

## Offline demo

The scientific loaders use only bundled local files. Before judging, start the app, disconnect Wi-Fi, refresh once, press **Reset to verified demo**, and verify the default profile metrics. If browser/GPU WebGL 3D is unreliable, enable **Use 2D compatibility fallback**; it uses the same actual model array at the selected depth.

## Project tree

```text
oceantwin_mvp_final/
├── app.py
├── config.py
├── requirements.txt
├── pytest.ini
├── data_manifest.json
├── BUILD_VALIDATION.txt
├── SIH_DEMO_AND_PPT_GUIDE.md
├── data/
│   ├── glorys12_20240102_67E70E_12N14N_0m500m.nc
│   └── comparison/
├── src/
├── tests/
└── docs/
    ├── FINAL_AUDIT.md
    ├── SCIENTIFIC_METHOD.md
    ├── DATA_DICTIONARY.md
    ├── DEMO_RUNBOOK.md
    ├── TROUBLESHOOTING.md
    └── PPT_CONTENT.md
```

## Documentation

- `docs/FINAL_AUDIT.md` — repository/scientific audit and risk register.
- `docs/SCIENTIFIC_METHOD.md` — exact comparison method and limitations.
- `docs/DATA_DICTIONARY.md` — model and matched-evidence variables.
- `docs/DEMO_RUNBOOK.md` — pre-demo checklist and 90 s / 2 min / 3 min flows.
- `docs/TROUBLESHOOTING.md` — Windows/runtime recovery steps.
- `docs/PPT_CONTENT.md` — 10-slide text/native-visual plan and 20 judge Q&A items; no Streamlit screenshots.

## Sources

- Copernicus Marine Global Ocean Physics Reanalysis: https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description
- Copernicus DOI: https://doi.org/10.48670/moi-00021
- Argo data-use/QC guidance: https://argo.ucsd.edu/data/how-to-use-argo-files/
- Argo acknowledgement and DOI guidance: https://argo.ucsd.edu/data/acknowledging-argo/
- Argo DOI: https://doi.org/10.17882/42182

## Presentation rule

Do **not** place Streamlit UI screenshots in the SIH PPT. Use native diagrams, architecture/methodology flowcharts, tables, metric callouts and scientific charts recreated directly from the verified evidence where permitted. Demonstrate the application live on localhost.
