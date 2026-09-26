# OceanTwin 3D — Professional Final Handover

## 1. What changed

OceanTwin 3D has been reorganised from a largely single-file Streamlit prototype into a professional application hierarchy while keeping the validated scientific core intact.

The root `app.py` is now a thin Streamlit entry point. Product orchestration lives in `oceantwin/application.py`; reset/session logic is isolated in `oceantwin/state.py`; reusable design tokens, CSS components and Plotly presentation live in `oceantwin/ui/`; judge-facing dashboard/evidence composition lives in `oceantwin/views/`. The existing `src/` scientific loaders and figure builders remain the scientific core.

## 2. Final primary dashboard flow

The judge-facing application now follows this direct hierarchy rather than hiding the main scientific evidence in separate tabs:

1. Compact product header, scope and local/offline-ready status.
2. Selected-profile identity.
3. Six data-driven evidence metric cards.
4. Genuine 3D/2D Copernicus model context beside the enlarged collocation map.
5. Argo-vs-Copernicus temperature profile beside Model − Observation bias-by-depth.
6. Compact method/provenance, visible limitations and real evidence downloads.
7. Scientific source footer.

## 3. Scientific consistency

Preserved without methodological change:

- Copernicus Marine `GLOBAL_MULTIYEAR_PHY_001_030` / GLORYS12V1.
- Cached `thetao` model subset, 31 × 25 × 37.
- Two eligible Argo comparison profiles and 99 valid matched levels.
- Verified default: `20240102_indian_ocean_prof:23`, float 5907092, cycle 13 descending, 50 matched levels.
- Nearest valid model water-cell spatial collocation.
- Linear vertical interpolation between adjacent valid model levels.
- Provider QC-preserved matched evidence.
- Bias = Model − Observation.
- Existing profile CSV/JSON/config/provenance/verification evidence.

No raw Copernicus/Argo data or validated scientific calculations were altered.

## 4. Professional application hierarchy

```text
app.py
.streamlit/config.toml
oceantwin/
├── application.py
├── state.py
├── ui/
│   ├── tokens.py
│   ├── theme.py
│   ├── components.py
│   └── plotly_theme.py
└── views/
    ├── dashboard.py
    └── evidence.py
src/                         # preserved scientific core
data/                        # verified scientific evidence
tests/
docs/
```

## 5. UI/product finalisation implemented

The implementation consolidates the 12-feature finalisation plan and all five chunks of the 250-feature UI/product backlog into maintainable reusable layers.

Implemented product areas include:

- versioned semantic design tokens;
- native Streamlit dark theme;
- deep-ocean background and restrained marine glow;
- offline system fonts;
- responsive wide shell;
- premium compact header;
- local/offline and scientific-scope badges;
- selected-profile identity chip;
- responsive data-driven metrics;
- grouped sidebar controls;
- Temperature-only active-variable state;
- explicit roadmap-only labels;
- reset-to-verified-demo recovery;
- friendly judge-facing errors;
- gated developer diagnostics;
- reusable Plotly presentation theme;
- cyan Copernicus and amber Argo semantics;
- zero-centred bias presentation;
- enlarged real collocation context;
- real 3D thetao context and controlled 2D fallback;
- profile/bias evidence in the primary flow;
- compact provenance/method inspection;
- visible scientific limitations;
- profile-correct readable evidence download filenames;
- UI design-system documentation;
- visual demo checklist;
- automated product-contract tests;
- CI compilation and Streamlit startup health checks.

See `docs/BACKLOG_IMPLEMENTATION_MATRIX.md` for the mapping.

## 6. Regression result

Latest verified feature-branch CI:

- `python -m pytest -q` → **36-test suite completed successfully**
- `python -m compileall -q app.py config.py oceantwin src tests` → **PASS**
- headless Streamlit startup + `/_stcore/health` → **PASS**

The preserved comparison-engine artefact separately records **25 passed** historical scientific-engine tests.

## 7. Offline safety

Scientific loaders use the bundled local model/evidence files. Existing automated tests block network connection while loading the scientific evidence and still pass.

The app does not synthesize replacement observations when evidence is missing.

## 8. Error-safety rule

Raw Python tracebacks and absolute system paths are not intended for judges. Developer diagnostics are disabled by default and are available only when:

```text
OCEANTWIN_DEV_DIAGNOSTICS=1
```

## 9. Startup

Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Expected local URL:

```text
http://localhost:8501
```

## 10. Presentation-laptop release check

Before presentation freeze, run the checklist in `docs/VISUAL_DEMO_CHECKLIST.md`, including 1366×768 and 1920×1080 review, reset recovery, second-profile selection, 2D fallback, evidence downloads and Wi-Fi-off refresh.

## 11. Explicitly deferred

No salinity comparison, current validation, glider comparison, bilinear sensitivity analysis, Docker, FastAPI, React, Cesium, authentication, database, ML, real-time monitoring, hazard prediction or operational forecasting was added.

## 12. Scientific framing

> This is a model–observation diagnostic comparison, not independent validation. The reanalysis may assimilate in-situ observations.

This limitation remains a visible part of the judge-facing product.
