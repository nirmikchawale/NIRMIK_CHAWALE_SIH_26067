# OceanTwin 3D — Final Audit

## Repository inspection

- Entry point: `app.py`.
- Runtime: Python + Streamlit + Plotly; scientific loaders use pandas, NumPy and h5py.
- Local model: `data/glorys12_20240102_67E70E_12N14N_0m500m.nc`.
- Processed comparison evidence: `data/comparison/`.
- Tests: `tests/` plus the preserved original comparison-engine test artefacts in `data/comparison/`.
- No runtime scientific-data network call is used.

## Scientific data audit

### Copernicus subset

- Product ID: `GLOBAL_MULTIYEAR_PHY_001_030`.
- Dataset ID: `cmems_mod_glo_phy_my_0.083deg_P1D-m`.
- Dataset version recorded in provenance: `202311`.
- DOI recorded in provenance: `10.48670/moi-00021`.
- Variable: `thetao`, NetCDF `standard_name=sea_water_potential_temperature`, units `degrees_C`.
- Cached dimensions used by the app: 31 depth × 25 latitude × 37 longitude, one time step.
- Depth: metres, positive down, 0.494025–453.937714 m.
- Encoded model timestamp: 2024-01-02 00:00 UTC.
- Comparison configuration documents daily support 00:00–24:00 UTC, centred at noon.

### Argo comparison evidence

- Curated ingestion summary: 26 profiles, 23 unique floats.
- Two selected comparison profiles are from float 5907092.
- Both selected profiles are documented as delayed mode (`DATA_MODE=D`) in `comparison_summary.md`.
- Comparison uses `TEMP_ADJUSTED`, `PRES_ADJUSTED`, and auxiliary `PSAL_ADJUSTED` with provider QC flag 1.
- Cycle 13 descending: 50 displayed matched levels.
- Cycle 12 ascending: 49 displayed matched levels.
- Total displayed matched levels: 99.

## Default demo evidence

Profile `20240102_indian_ocean_prof:23` / float 5907092 / cycle 13 descending:

- 50 matched levels.
- 1.3919–447.0245 m matched range.
- 3.8513 km nearest-cell separation.
- +14.7667 h observation minus encoded model timestamp.
- +2.7667 h from documented daily-mean midpoint.
- MAE 0.2253829 °C.
- RMSE 0.3188158 °C.
- Bias definition: model − observation.

## Pre-change baseline

- Hardened MVP tests: 12 passed.
- Preserved original comparison-engine evidence: 25 passed, one recorded binary-compatibility warning in the historical test log.

## Risk register

| Level | Issue | Final treatment |
|---|---|---|
| BLOCKER | None found in the bundled comparison evidence | No blocker |
| MUST FIX | Judge-facing evidence downloads did not expose provenance/config/verification | Added real-file downloads |
| MUST FIX | Missing final handover documentation requested by the execution brief | Added `docs/` set |
| SHOULD FIX | Header did not state the scientific scope explicitly enough | Added concise subtitle/scope line |
| SHOULD FIX | Sidebar lacked a compact methodology reminder | Added “About this comparison” expander |
| SHOULD FIX | Browser Plotly container could reveal a light/default render surface | Strengthened dark render-container CSS; final browser behaviour still requires local visual check |
| DO NOT TOUCH | Nearest valid water-cell collocation | Preserved |
| DO NOT TOUCH | Linear vertical interpolation | Preserved |
| DO NOT TOUCH | Existing scientific CSV/JSON/NetCDF evidence | Hash-verified unchanged |
| DO NOT TOUCH | Temperature-only scientific scope | Preserved |

## Known verification boundary

The supplied scientific artefacts establish the comparison pipeline and provenance. The final package does not bundle the original raw Argo NetCDF/curated level store, so the application relies on the preserved comparison outputs and provenance for the selected profiles rather than re-running Argo ingestion at runtime.
