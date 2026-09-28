# OceanTwin 3D — Final MVP Runbook

## 1. Preferred local launch

From the repository root, use:

```text
START_OCEANTWIN.cmd
```

This launches the FastAPI scientific API and the React + Cesium judge-facing application. Keep the Streamlit app as the emergency scientific fallback.

## 2. Manual validation

### Python/scientific layer

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r backend\requirements.txt
python -m pytest -q tests
python -m pytest -q backend\tests
```

### React/Cesium layer

```powershell
cd frontend
npm install
npm run typecheck
npm run build
```

### Local services

Terminal 1:

```powershell
python -m uvicorn backend.app.main:app --port 8000
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## 3. Public release gate

Before calling the MVP frozen, confirm the latest runs for the same current `main` HEAD:

- `tests` — PASS
- `final-mvp` — PASS
- `deploy-oceantwin-pages` — PASS, including live Chromium judge-flow acceptance

Then manually open:

`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`

and verify Geographic View → Water Column 3D, globe zoom, INCOIS time controls, one in-situ profile and the Argo comparison.

## 4. Time semantics

Two truthful time behaviors coexist:

- **GLORYS comparison baseline:** one genuine model timestamp, `2024-01-02T00:00:00Z`; it remains a static snapshot.
- **INCOIS operational source:** multiple genuine timestamps; the primary Explorer exposes real time selection/playback.

Never duplicate the GLORYS field under fake dates.

## 5. Operational-scope wording

OceanTwin demonstrates an operational-style architecture through verified build-time acquisition, source adapters, static caching, OPeNDAP/WMS checks and a reproducible public deployment.

It does **not** claim a continuously running 24/7 national service. A production deployment would schedule adapter acquisition, validation and cache refresh jobs, retain the same canonical contracts, and expose the resulting validated windows through the existing web/API surfaces.

## 6. Emergency Streamlit fallback

If React/Cesium becomes unusable during judging:

```powershell
python -m streamlit run app.py
```

Open `http://localhost:8501`, press **Reset to verified demo**, and continue with the verified GLORYS–Argo diagnostic story. Explain that the fallback reads the same bundled scientific evidence.
