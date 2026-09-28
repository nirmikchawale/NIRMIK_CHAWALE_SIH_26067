# SIH26067 — Final Live Demo Runbook

## Pre-demo release check

Use the current `main` commit only after:

- `tests` — PASS
- `final-mvp` — PASS
- `deploy-oceantwin-pages` — PASS including live Chromium judge-flow acceptance
- `docs/VISUAL_DEMO_CHECKLIST.md` — completed on the actual presentation laptop/projector

Primary URL:

`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`

Keep `START_OCEANTWIN.cmd` and the Streamlit fallback ready locally.

## 90-second sponsor-first flow

**0–15 s — Numerical ocean model**

Open Geographic View on GLORYS temperature.

Say: “OceanTwin brings numerical ocean-model fields and in-situ observations into one browser-native 3D workspace. This field is genuine GLORYS model data over our verified Indian Ocean window.”

**15–30 s — Depth and 3D**

Change depth and enter Water Column 3D.

Say: “These are genuine model depth coordinates. Vertical exaggeration changes only display geometry. We can inspect temperature, salinity and horizontal currents through depth, with configurable rendering and genuine scalar isosurfaces.”

**30–43 s — Genuine time**

Switch to INCOIS multi-time.

Say: “The GLORYS comparison baseline has one genuine timestamp, so we do not fake animation. For temporal exploration we use a separately verified INCOIS product with real timestamps.”

**43–58 s — In-situ observation**

Open one Glider, CTD or BGC marker/profile.

Say: “This is a real in-situ profile using the same canonical observation contract: geographic position, UTC time, depth, variable, units, QC/source provenance and profile values.”

**58–78 s — Model ↔ observation**

Open the Argo comparison.

Say: “For Argo we go beyond overlay. We collocate the observation with the nearest valid model cell, vertically match model values without extrapolation, and expose Model minus Observation bias, MAE and RMSE. We call this diagnostic comparison, not independent validation.”

**78–90 s — Trust and scale**

Open Sources/QC or Science & System.

Say: “Every source and limitation is traceable. This is a bounded, verified SIH MVP. In production the same adapters would run through scheduled acquisition, validated caches and monitoring for continuous operations.”

## What to show only after the required story

- telemetry;
- anomaly screening;
- Data Lab ingestion;
- WMS/WCS/OPeNDAP details;
- additional camera/workspace modes.

These are strengths, but they must not obscure the sponsor’s central model + 3D + time + in-situ integration story.

## Judge questions to be ready for

### “Are your in-situ observations actually integrated?”

Yes. Argo, Glider, CTD and BGC observations enter the same browser Explorer through a canonical geospatial profile contract. Argo additionally has full model-collocation and error diagnostics.

### “Why not animate GLORYS?”

The bundled GLORYS comparison evidence has one genuine timestamp. OceanTwin refuses to duplicate it under fake dates. Genuine playback is demonstrated using the verified INCOIS multi-time source.

### “Is this operational?”

It is an operational-style, reproducible SIH MVP rather than a 24/7 national service. Production scaling means scheduled provider acquisition, validation/QC, cache/version management, monitoring and the same source-adapter/API contracts.

### “Are the currents 3D?”

They are genuine horizontal `uo/vo` vectors placed at their scientific depths across the water column. No unsupported vertical-current component is fabricated.

### “Is BGC synthetic?”

No fabricated BGC measurements are used in the verified observation pack. The UI/source registry uses “BGC-Argo biogeochemical profiles” wording to avoid confusing the Argo technical term “synthetic profile” with synthetic/fake data.

## Recovery order

1. Explicit mode buttons instead of gesture/canvas entry.
2. Local React/FastAPI build using `START_OCEANTWIN.cmd`.
3. Streamlit scientific fallback → **Reset to verified demo**.

The fallback is a resilience path, not the primary presentation.

## Final rule

Do not overclaim:
- no fake timestamps;
- no fabricated vertical current;
- no fabricated chlorophyll depth;
- no independent/global validation claim;
- no ML-event-detection claim for anomaly screening;
- no 24/7 national digital-twin claim.
