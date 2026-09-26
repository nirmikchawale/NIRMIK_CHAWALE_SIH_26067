# OceanTwin 3D — Final MVP Local Runbook

## 1. Python environment

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install -r backend\requirements.txt
```

## 2. Validate the frozen scientific reference

```powershell
python -m pytest -q tests
```

Expected result: the existing Streamlit regression suite passes unchanged.

## 3. Validate the FastAPI layer

```powershell
python -m pytest -q backend\tests
python -m uvicorn backend.app.main:app --reload --port 8000
```

Check:

- `http://localhost:8000/api/health`
- `http://localhost:8000/api/catalog`
- `http://localhost:8000/docs`

Leave this terminal running.

## 4. Start the React + Cesium final MVP

Open a second terminal:

```powershell
cd frontend
npm install
npm run typecheck
npm run dev
```

Open:

```text
http://localhost:5173
```

The default frontend expects the API at `http://localhost:8000`.

## 5. Production frontend check

```powershell
cd frontend
npm run build
npm run preview
```

## 6. Emergency Streamlit fallback

In another terminal from the repository root:

```powershell
python -m streamlit run app.py
```

Open:

```text
http://localhost:8501
```

The fallback remains scientifically independent of the React UI and does not require FastAPI.

## Demo recovery rule

If the React/Cesium application fails during judging:

1. Do not troubleshoot in front of the judge for an extended period.
2. Open the already-started Streamlit fallback.
3. Press **Reset to verified demo**.
4. Continue with the verified temperature/Argo comparison.
5. Explain that the fallback reads the same bundled scientific evidence.

## Current time limitation

The model file currently contains one genuine model time:
`2024-01-02T00:00:00Z`.

The UI intentionally disables playback until additional verified time steps are added.
Do not change this by duplicating the same field under fake timestamps.
