# OceanTwin 3D — Final MVP Architecture Lock

## Decision

The final SIH26067 MVP uses:

- **React + TypeScript + CesiumJS** for the judge-facing browser application.
- **FastAPI** as a read-only scientific data/API boundary.
- The existing **Python scientific core and verified evidence** as the source of truth.
- The existing **Streamlit application unchanged as the scientific reference and emergency fallback**.

This is an additive migration. The verified Streamlit path is not replaced.

## Architecture

```text
Browser
  |
  +-- React controls / evidence panels
  |
  +-- CesiumJS 3D globe
          |
          v
      FastAPI
          |
          +-- canonical Copernicus adapter
          |      thetao / so / uo / vo
          |
          +-- existing Argo comparison loader
          |      QC / collocation / matched levels / MAE / RMSE
          |
          +-- provenance
                 |
                 v
        bundled verified local data

Emergency fallback:
app.py -> existing Streamlit application -> same evidence
```

## Scientific MVP coverage

### Implemented from the bundled Copernicus file

- Potential temperature: `thetao`
- Salinity: `so`
- Eastward current: `uo`
- Northward current: `vo`
- 31 verified depth levels
- 25 × 37 regional grid
- One verified model time step: 2024-01-02T00:00:00Z

### Observation evidence

- Verified Argo profile summaries and matched-level tables.
- Existing nearest-valid-cell horizontal collocation.
- Existing linear vertical interpolation.
- Existing Model − Observation bias convention.
- Existing MAE/RMSE checks.
- Existing provider-QC acceptance rules.

## Explicit truthfulness constraints

1. GLORYS12V1 is shown as **reanalysis**, not live data.
2. Runtime uses **cached verified** scientific files.
3. The current repository contains only **one genuine model timestamp**.
4. The React time control is multi-time capable but playback stays disabled while only one verified timestamp exists.
5. No synthetic second day is generated.
6. Current vectors are the actual selected-depth `uo` and `vo` values.
7. Current glyph geometry may be projected above the globe for readability; the UI states this.
8. Visual vertical exaggeration never changes scientific depth values.
9. Argo-vs-model comparison is **diagnostic consistency, not independent validation**.
10. The Streamlit fallback remains operational and independently regression-tested.

## API surface

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/field?variable=thetao|so&time_index=&depth_index=&stride=`
- `GET /api/volume?variable=thetao|so&time_index=&horizontal_stride=&depth_stride=`
- `GET /api/currents?time_index=&depth_index=&stride=`
- `GET /api/profiles`
- `GET /api/profiles/{profile_id}`
- `GET /api/provenance`

## Judge-facing interaction

1. Open the Cesium globe centered on the verified Indian Ocean subset.
2. Switch **Temperature / Salinity / Currents**.
3. Move through genuine Copernicus model depths.
4. Switch scalar views between **Depth slice** and **3D field**.
5. Inspect current vectors at the selected depth.
6. Click an Argo marker.
7. Review matched-level count, MAE, RMSE, collocation distance and the model-vs-Argo profile.
8. Show reanalysis/cached provenance and the diagnostic-not-validation caveat.
9. If browser/WebGL/network conditions fail, launch the frozen Streamlit fallback.

## Not in final MVP scope

- ML or forecasting
- authentication
- databases
- Redis
- arbitrary unvalidated uploads
- fake live streaming
- particle-current advection
- full global archive serving
- synthetic timestamps
