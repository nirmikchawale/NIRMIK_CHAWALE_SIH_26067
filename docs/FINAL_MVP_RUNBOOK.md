# OceanTwin 3D — Final MVP Local Runbook

## Release gate

Before judging, use one current `main` HEAD and require all three workflow families to pass:

- `tests`
- `final-mvp`
- `deploy-oceantwin-pages`, including live Chromium judge-flow verification

Public judge URL:

`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`

Do not freeze the repository while any of these gates is red.

## One-click local recovery

After one-time dependency setup, use:

- `START_OCEANTWIN.cmd` — starts FastAPI on port 8000 and React/Cesium on port 5173.
- `STOP_OCEANTWIN.cmd` — stops both services.

Local judge URL:

`http://localhost:5173`

The preserved Streamlit application remains the final scientific fallback at `http://localhost:8501`.

## Manual validation

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r backend\requirements.txt
python -m pytest -q tests
python -m pytest -q backend\tests
```

Then:

```powershell
cd frontend
npm install
npm run typecheck
npm run build
```

## Sponsor-first live demo order

1. **Numerical model field** — GLORYS temperature/salinity in Geographic View.
2. **Depth + Water Column 3D** — change depth and show actual positive-down coordinates; demonstrate one required control such as opacity, dynamic color range or isosurface.
3. **Genuine time** — switch to INCOIS multi-time physical data and change/play real timestamps.
4. **In-situ observations** — inspect a real Glider, CTD or BGC profile with location, UTC time, depth, variable, source/QC and profile shape.
5. **Model ↔ observation** — open the Argo comparison; explain collocation, vertical matching, Model − Observation bias and MAE/RMSE.
6. **Trust + scale** — show provenance/source evidence and explain the bounded verified MVP scope.

Only after this sequence should anomaly screening or telemetry be shown.

## Scientific boundaries

- GLORYS comparison evidence contains one genuine bundled timestamp; it is never duplicated to fake animation.
- Genuine time playback is provided through the separately verified INCOIS multi-time source.
- Currents are horizontal `uo/vo`; no vertical `w` is invented.
- INCOIS chlorophyll is satellite surface-only; no depth axis is fabricated.
- GLORYS–Argo comparison is diagnostic, not independent/global validation.
- Anomaly screening is descriptive statistics, not ML event detection or proof of failure.
- OceanTwin is a verified SIH MVP, not a claim of continuous 24/7 national operations.

## Operational-scaling answer

If asked how the bounded MVP becomes operational, explain:

```text
official provider services
        ↓
scheduled acquisition jobs
        ↓
validation / QC / CF normalization
        ↓
versioned cache + provenance
        ↓
OceanTwin adapters / API
        ↓
browser 3D + observation workflows
```

The current build-time acquisition proves the adapter and validation path reproducibly. A production deployment would schedule those acquisition/cache jobs and add monitoring/retry policies rather than asking every browser to depend directly on provider uptime.

## Demo recovery

If a visible interaction is unreliable:

1. use explicit Geographic View / Water Column 3D buttons rather than gestures;
2. switch to the prepared local React/FastAPI application;
3. if WebGL/browser rendering is unusable, use the Streamlit scientific fallback and **Reset to verified demo**.

Do not debug at length in front of judges.

## Presentation-machine QA

Run `docs/VISUAL_DEMO_CHECKLIST.md` on the exact laptop/projector before the session. Verify 100% browser zoom, light/dark readability, first-load network behavior, WebGL, mouse/trackpad controls, repeated Geographic → Water Column entry, local recovery and the Streamlit fallback.
