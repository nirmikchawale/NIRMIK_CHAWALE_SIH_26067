# OceanTwin React + Cesium frontend

Judge-facing final MVP interface for SIH26067.

## Prerequisites

- Node.js 22.12+ (Vite requirement)
- FastAPI backend running at `http://localhost:8000`

## Run locally

```powershell
cd frontend
npm install
npm run typecheck
npm run dev
```

Open `http://localhost:5173`.

For a production build:

```powershell
npm run build
npm run preview
```

## Cesium design

The frontend uses CesiumJS without requiring a Cesium ion token for the core demo.
The default globe uses Cesium's bundled grid imagery and ellipsoid terrain so the judge
experience does not depend on a third-party basemap request.

- Scalar depth slices render actual Copernicus grid values at the selected scientific depth.
- 3D field mode renders sampled values across actual model depths.
- Visual vertical exaggeration changes only rendering height.
- Current vectors use the real `uo` / `vo` values at the selected depth and are projected
  above the globe for readability.
- Argo markers are clickable and open the verified temperature comparison evidence.

The frozen Streamlit reference remains separately runnable from the repository root.
