# OceanTwin FastAPI backend

This backend is an additive facade over the repository's verified local scientific evidence.

It does **not** replace the frozen Streamlit reference. It reads the same bundled Copernicus
NetCDF and Argo comparison evidence and exposes read-only endpoints for the React/Cesium MVP.

## Run

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## Scientific rules

- Copernicus GLORYS12V1 remains labelled as reanalysis/cached verified data.
- Temperature comparison remains diagnostic consistency, not independent validation.
- Scientific depth stays metres positive downward.
- Browser vertical exaggeration never changes scientific values.
- Current glyphs may be projected to the visible surface for readability, but values are from the selected depth.
- No synthetic salinity/current field is generated.
- The current bundled model contains one genuine time step; the API is multi-time capable and reports animation unavailable until additional verified time steps are bundled.
