# SIH Live Demo Runbook — Sponsor-First Final Flow

## Pre-demo acceptance checklist

Use the actual presentation laptop/projector where possible.

1. Confirm current `main` and latest `tests`, `final-mvp` and `deploy-oceantwin-pages` are green for the same HEAD.
2. Open the public Explore URL once on the judging network.
3. Verify Geographic View → Water Column 3D works.
4. Verify globe zoom in/out and camera presets.
5. Verify INCOIS multi-time source and timestamp/play controls.
6. Select one real Glider/CTD/BGC marker and open its profile inspector.
7. Open Argo model-vs-observation comparison.
8. Check light and dark contrast on the actual display.
9. Check 1366×768 or the projector's native resolution at normal browser zoom.
10. Keep `START_OCEANTWIN.cmd` and the Streamlit fallback ready locally.
11. Test one first-load/slow-network scenario; the static scientific evidence path must remain usable.
12. Do not alter data, fabricate timestamps or improvise unsupported claims during judging.

## 90-second sponsor-first flow

- **0–12 s — Problem + numerical field:** “OceanTwin integrates numerical ocean-model fields and in-situ observations in one browser-native 3D explorer.” Show the verified Indian Ocean GLORYS field.
- **12–28 s — Depth + 3D:** change depth, enter Water Column 3D, briefly show the actual-depth structure and one rendering control/isosurface.
- **28–42 s — Genuine time:** switch to INCOIS multi-time and move the real timestamp or press playback. Explicitly distinguish this from the truthful single-time GLORYS comparison baseline.
- **42–57 s — In-situ observation:** return to geographic view and inspect a real Glider, CTD or BGC profile. Point to position, time, depth, variable, QC/source and profile shape.
- **57–76 s — Model ↔ observation:** open the Argo comparison. Explain nearest valid model-cell collocation, vertical interpolation, Model − Observation bias, MAE/RMSE and the diagnostic-not-independent-validation limitation.
- **76–90 s — Trust + scale:** show provenance/source evidence and state that the MVP proves the architecture with bounded verified windows; production scale uses scheduled acquisition/validation/cache refresh around the same adapters.

## 2–3 minute extension

Add:
- salinity and full-water-column horizontal currents;
- customizable palette/min/max and valid log/linear scaling;
- Data Lab temporary observation layer ingestion;
- NetCDF browser ingestion;
- OPeNDAP/WMS/WCS interoperability;
- anomaly/telemetry **after** the required 3D + in-situ + comparison story.

## Judge-safe wording

Use:
- “verified SIH MVP”
- “genuine provider observations”
- “diagnostic model–observation comparison”
- “horizontal `uo/vo` currents at genuine depths”
- “surface-only satellite chlorophyll”
- “build-time verified source acquisition and cached public evidence”

Avoid:
- “24/7 national operational digital twin”
- “independent model validation”
- “vertical current” unless a genuine `w` component is available
- “ML anomaly detection”
- any wording that implies synthetic/fabricated BGC measurements

## Recovery

### Public page interaction issue
Use the explicit visualization-mode buttons rather than relying on a gesture, then continue. If the page remains unreliable, switch to the local React build.

### React/Cesium failure
Use the already prepared Streamlit fallback and continue with the verified GLORYS–Argo diagnostic.

### Network failure
Use the local build/static cached evidence. Explain that scientific evidence is deliberately cached for deterministic judging.

### Projector/readability issue
Use presentation workspace or browser fullscreen. Keep browser zoom at a stable normal value unless the display requires a one-time adjustment before judging.

## Final human visual QA

This cannot be fully automated because projector brightness, OS scaling, GPU/WebGL behavior and venue networking are machine-specific. The team must physically verify the actual presentation machine before the judging session.
