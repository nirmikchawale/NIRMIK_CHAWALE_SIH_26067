# OceanTwin 3D — Final Audit

## Repository architecture audit

The final application has a clear separation of responsibilities:

- `app.py` — thin Streamlit entry point.
- `oceantwin/application.py` — product orchestration and controls.
- `oceantwin/state.py` — deterministic verified-demo/reset state.
- `oceantwin/ui/` — versioned tokens, theme, components and Plotly presentation.
- `oceantwin/views/` — dashboard and evidence composition.
- `src/` — preserved scientific loaders and figure builders.
- `data/` — bundled verified scientific evidence.
- `tests/` — scientific/application regression and product-contract tests.
- `docs/` — method, data dictionary, runbook, troubleshooting, UI system and release checklists.

## Scientific data audit

### Copernicus subset

- Product family: `GLOBAL_MULTIYEAR_PHY_001_030`.
- Dataset: `cmems_mod_glo_phy_my_0.083deg_P1D-m`.
- Product label: GLORYS12V1.
- Variable: `thetao`, sea-water potential temperature.
- Cached dimensions: 31 depth × 25 latitude × 37 longitude.
- Cached depth coverage: approximately 0.49–454 m.
- Historical subset date: 2 January 2024.
- Region: 67–70°E, 12–14°N.

### Argo comparison evidence

- 26 profiles represented in ingestion provenance.
- 2 eligible comparison profiles.
- 99 valid matched temperature levels total.
- Verified default profile: `20240102_indian_ocean_prof:23`.
- Float: 5907092.
- Cycle: 13.
- Direction: descending.
- Default matched levels: 50.

### Method

- Spatial collocation: nearest valid model water cell.
- Vertical matching: linear interpolation between adjacent valid model levels.
- No spatial, vertical or temporal extrapolation is introduced by the UI.
- Bias: Model − Observation.
- Provider QC handling remains the locally verified baseline.
- Metrics, charts and selected-profile downloads are sourced from the processed comparison evidence.

## UI/product audit

The two supplied planning documents are implemented as two planning layers:

- the 12-feature finalisation plan defines the macro judge-facing end state;
- the 250-feature backlog defines detailed shell, control, visualisation, trust and release work.

The implementation matrix is stored in `docs/BACKLOG_IMPLEMENTATION_MATRIX.md`.

The final primary layout places the model/map and profile/bias evidence in the main vertical flow instead of requiring judges to discover core evidence through tabs.

## Test audit

Latest verified feature-branch GitHub Actions result:

- 36-test regression/product-contract suite: PASS.
- Python compile check: PASS.
- Headless Streamlit startup health check: PASS.

Existing tests continue to protect:

- verified default profile;
- both eligible profiles and matched-level counts;
- exact Model − Observation sign/value;
- provider QC policy;
- real model dimensions/units/depth semantics;
- local data-loader immutability;
- no-network scientific loading;
- profile/bias source rows;
- real map coordinates;
- real 3D/2D figure construction;
- evidence download existence and profile selection;
- inverted depth axes;
- scientific data-manifest integrity;
- original provenance record of unchanged raw inputs.

New product-contract tests protect:

- professional folder hierarchy;
- thin entry point;
- versioned semantic tokens;
- data-derived reset defaults;
- data-driven metrics and safe missing values;
- provenance method wording;
- readable selected-profile download names;
- Plotly styling without scientific-value mutation;
- mandatory disclaimer;
- prohibited architecture/ML claims.

## Cross-platform checksum note

The NetCDF binary checksum remains exact.

For tracked text evidence, Git can represent identical text with LF or CRLF depending on checkout rules. The integrity test accepts only these line-ending variants of the same bytes; it does not accept arbitrary content changes.

## Risk register

| Level | Item | Final treatment |
|---|---|---|
| BLOCKER | Scientific method regression | None detected; regression suite green |
| MUST FIX | Main science hidden behind tabs | Core rows moved into direct dashboard flow |
| MUST FIX | Monolithic application layout | Product UI reorganised into `oceantwin/` hierarchy |
| MUST FIX | Weak release/startup verification | CI now runs pytest, compile and Streamlit health check |
| MUST FIX | Raw tracebacks potentially judge-facing | Friendly states + gated diagnostics |
| SHOULD FIX | Inconsistent semantic colours | Cyan model, amber Argo, centred cool/warm bias system |
| SHOULD FIX | Dense provenance | Compact inspectable evidence layout |
| SHOULD FIX | Download naming | Profile-correct readable filenames |
| MANUAL CHECK | Presentation-laptop visual rendering | Use `docs/VISUAL_DEMO_CHECKLIST.md` |
| DO NOT TOUCH | QC/collocation/interpolation/bias | Preserved |
| DO NOT TOUCH | Raw scientific files | Preserved |
| DO NOT TOUCH | Temperature-only scientific scope | Preserved |

## Known scientific boundaries

- daily-mean model field vs instantaneous Argo profile;
- nearest-cell representativeness difference;
- vertical interpolation between model levels;
- one historical region/date and two eligible comparison profiles;
- reanalysis may assimilate in-situ observations;
- not independent validation;
- no operational forecast, real-time monitoring or hazard prediction.

## Mandatory framing

> This is a model–observation diagnostic comparison, not independent validation. The reanalysis may assimilate in-situ observations.
