# OceanTwin 3D — Backlog Implementation Matrix

This file records where the two planning documents are implemented. The scientific contract remains unchanged.

## Macro finalisation plan

| Macro feature | Implementation |
|---|---|
| 1. Final dashboard layout | `oceantwin/application.py`, `oceantwin/views/dashboard.py` |
| 2. High-contrast visual system | `oceantwin/ui/tokens.py`, `theme.py`, `plotly_theme.py`, `.streamlit/config.toml` |
| 3. Better metric cards | `oceantwin/ui/components.py::build_metric_items/metric_cards` |
| 4. Improved collocation map | existing real `src/map_view.py` + themed enlarged dashboard placement |
| 5. Profile chart upgrade | existing real `src/profile_charts.py` + themed comparison card |
| 6. Bias chart upgrade | existing signed bias chart + zero-centred semantic presentation |
| 7. Compact provenance | `oceantwin/views/evidence.py::provenance_rows` |
| 8. Strong limitation panel | `oceantwin/ui/components.py::limitations_panel` |
| 9. Improve 3D safely | existing real `src/volume_view.py` + themed card, stable fallback and friendly failure state |
| 10. Evidence download experience | `oceantwin/views/evidence.py::render_downloads` |
| 11. Reset and failure states | `oceantwin/state.py`, friendly UI states, gated developer diagnostics |
| 12. Test, document, freeze | existing scientific tests + product-contract tests + CI startup gate + docs |

## 250-feature product backlog

### Chunk 1 — Features 1–50: foundation and application shell

Implemented through versioned tokens, native Streamlit theme, deep-ocean gradient/radial glow, safe dark surfaces, semantic colours, offline system fonts, type scales, 4 px spacing, card variants, restrained borders/shadows, responsive wide shell, compact header, scope/status badges, reusable section/card/helper/badge/divider/error/loading patterns, and the visual checklist.

Primary files: `oceantwin/ui/*`, `.streamlit/config.toml`, `docs/UI_DESIGN_SYSTEM.md`, `docs/VISUAL_DEMO_CHECKLIST.md`.

### Chunk 2 — Features 51–100: navigation, controls and evidence metrics

Implemented through grouped sidebar controls, real profile selector, selected-profile identity chip, Temperature-only active state, explicit roadmap-only variables, actual model depth selector, explanatory visual controls, reset-to-verified-demo state, compact method explanation, local-files/no-network labels, stable failure states, responsive metric row, and metrics sourced from the processed selected profile.

Primary files: `oceantwin/application.py`, `oceantwin/state.py`, `oceantwin/ui/components.py`.

### Chunk 3 — Features 101–150: scientific visualisation

Implemented through the reusable Plotly presentation layer, dark paper/plot backgrounds, high-contrast typography, subtle gridlines, hover styling, safe margins, actual thetao 3D preservation, stable camera inherited from the validated figure builder, actual-depth 2D fallback, enlarged collocation placement, real boundary/Argo/model-cell/line/separation evidence, coordinate labels, selected-profile context, profile title, cyan model and amber Argo semantics, inverted depth, and verified °C units.

Primary files: `oceantwin/ui/plotly_theme.py`, `oceantwin/views/dashboard.py`, existing validated `src/map_view.py`, `src/profile_charts.py`, `src/volume_view.py`.

### Chunk 4 — Features 151–200: interpretability, provenance and scientific trust

Implemented through profile/bias card subtitles, same-record binding, no-comparison states, explicit Model − Observation language, preserved/inverted bias depth axis, zero line from validated builder, cooler/warmer semantics, zero-centred bias colours, concise MAE/RMSE/separation/time helper text, mandatory diagnostic framing, assimilation/daily-mean/limited-scope/no-real-time/no-forecast boundaries, and compact locally verified provenance fields.

Primary files: `oceantwin/ui/components.py`, `oceantwin/views/evidence.py`, existing validated comparison outputs.

### Chunk 5 — Features 201–250: evidence, resilience, documentation and release

Implemented through time/coordinate/method/QC/matched-level/cache provenance, safe source identities, selected-profile evidence downloads with readable names, non-empty checks, no secret/path exposure, attribution footer, local-ready status, friendly missing-data states, gated developer diagnostics, existing raw-file immutability/hash tests, default-profile/data consistency/bias/download/2D/network tests, UI design documentation, visual checklist, existing demo runbook/scientific method/data dictionary/troubleshooting documentation, and CI regression/startup gates.

Primary files: `oceantwin/views/evidence.py`, `tests/*`, `docs/*`, `.github/workflows/tests.yml`.

## Explicitly not implemented

The planning documents prohibit adding new scientific scope. Therefore this finalisation does **not** implement salinity comparison, current validation, glider comparison, bilinear sensitivity analysis, Docker, FastAPI, React, Cesium, authentication, a database, ML, operational forecasting or hazard prediction.
