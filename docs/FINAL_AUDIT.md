# OceanTwin 3D — Final SIH26067 Audit

This document records the current final MVP audit. Earlier Streamlit-only audit language has been retired because the primary judge-facing product is now the React + TypeScript + CesiumJS web application; Streamlit remains the offline scientific reference and emergency fallback.

## Final product architecture

- **Frontend:** React + TypeScript + CesiumJS multi-page application.
- **Scientific API:** FastAPI contracts for catalog, fields, volumes, currents, observations, telemetry, anomaly screening, provenance and source capabilities.
- **Static/public path:** GitHub Pages science exports and verified public artifacts.
- **Fallback:** preserved Streamlit + Plotly scientific reference.
- **Source architecture:** discoverable source registry and model/sensor adapter contracts.
- **Ingestion:** browser-native CF-aware NetCDF4 plus CSV/TSV/ASCII/JSON validation.

## Verified scientific capability

- Genuine GLORYS12V1 temperature and salinity water-column fields.
- Genuine horizontal `uo/vo` currents at selected depth and across all 31 model depths.
- No fabricated vertical-current component.
- Genuine scalar isosurface extraction.
- Genuine INCOIS multi-time Explore playback.
- Genuine INCOIS IRS P4 OCM chlorophyll as a first-class surface-only source with mg/m³ units.
- Argo, Glider, CTD and BGC observation pathways through the canonical plugin profile model.
- Model–observation diagnostics with explicit non-independent-validation wording.
- Descriptive anomaly screening with explicit statistical limitations.
- OPeNDAP DAP2 endpoint verification, INCOIS WMS pathway metadata, and OceanTwin WMS/WCS compatibility services.
- CF-style coordinate, units and positive-down depth validation.

## Public interaction audit

The live acceptance suite verifies the deployed judge path, including:

- geographic and Water Column 3D views;
- high-resolution/offline imagery behavior;
- light/dark theme persistence;
- telemetry depth interactions;
- anomaly screening interactions and evidence download;
- Data Lab ingestion and temporary Explorer layers;
- browser-native NetCDF ingestion;
- model-vs-observation comparison;
- Science & System page;
- genuine INCOIS time playback;
- 31-depth Water Column 3D controls;
- depth, opacity, zoom and camera interactions;
- Argo profile inspection;
- provenance drawer;
- CSV evidence download;
- focus/recovery interactions;
- absence of page errors.

## Final CI/deployment state

The following is the final validation snapshot recorded before the documentation-only synchronization. For the current commit, GitHub Actions and the Pages deployment are authoritative.

Validated snapshot:

- tests #772 — PASS;
- final-mvp #289 — PASS:
  - `react-cesium` — PASS;
  - `static-hosted-failsafe` — PASS;
  - `science-api-and-fallback` — PASS;
- deploy-oceantwin-pages #75 — PASS:
  - build — PASS;
  - deploy — PASS;
  - verify-public — PASS;
  - live Chromium judge-flow acceptance — PASS.

Public application:

`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/`

## Scientific boundaries

These are deliberate boundaries, not gaps to "fix" with synthetic evidence:

1. The bundled GLORYS comparison baseline has one genuine timestamp.
2. Genuine time playback comes from the separately verified INCOIS source.
3. Currents are horizontal `uo/vo`; no vertical `w` is invented.
4. INCOIS chlorophyll is surface-only.
5. GLORYS–Argo comparison is diagnostic, not independent/global validation.
6. Anomaly screening is descriptive statistical screening, not ML event detection.
7. External source availability can fail; acquisition/interoperability checks fail closed.
8. OceanTwin is a verified SIH MVP, not a 24/7 national operational forecasting service.

## Final status

**COMPLETE — VERIFIED SIH26067 MVP BASELINE**

The authoritative requirement-by-requirement evidence remains in `docs/SIH26067_COMPLETION_MATRIX.md`, and the recovery/baseline record remains in `docs/SIH26067_COMPLETION_STATE.md`.
