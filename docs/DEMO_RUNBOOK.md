# SIH Live Demo Runbook

## Pre-demo checklist

1. Plug in laptop power and close unnecessary apps.
2. Confirm the project folder and `.venv` are available locally.
3. Turn Wi-Fi off for the offline check.
4. Run tests once before judging.
5. Start Streamlit and open `http://localhost:8501`.
6. Press **Reset to verified demo**.
7. Confirm profile `20240102_indian_ocean_prof:23` is selected.
8. Confirm 50 matched levels, 3.851 km, MAE 0.2254 °C and RMSE 0.3188 °C appear.
9. Confirm the 3D view; if GPU/WebGL is unreliable, enable **Use 2D compatibility fallback**.
10. Keep a second browser tab closed; avoid unnecessary refreshes during judging.

## Startup

```powershell
cd "<path-to-project>"
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m streamlit run app.py
```

Expected URL: `http://localhost:8501`

## 90-second flow

- **0–15 s:** Title + offline status. “This is a local, reproducible temperature diagnostic using cached Copernicus and QC-screened Argo evidence.”
- **15–35 s:** Metric row. Identify float 5907092 cycle 13, 50 matched levels, 3.851 km collocation, MAE/RMSE.
- **35–55 s:** Explore tab. Show actual `thetao` 3D subset and collocation map; change depth once if smooth.
- **55–75 s:** Compare tab. Point to Argo vs model profile, then Model − Observation bias and zero line.
- **75–90 s:** Evidence tab. Show QC/method/provenance and state: “This is diagnostic, not independent validation.”

## 2-minute flow

Use the 90-second sequence plus:

- explain the daily-mean vs instantaneous-profile timing;
- show the second eligible profile selector briefly;
- mention salinity/currents as source-data roadmap, not implemented comparisons.

## 3-minute flow

Use the 2-minute sequence plus:

- explain nearest-valid-cell and linear-depth interpolation;
- open real evidence downloads;
- explain why the app is offline for reproducibility and judging reliability.

## Fallbacks

### 3D slow or broken
Enable **Use 2D compatibility fallback**. State: “The fallback uses the same real model array at the selected depth; only the rendering mode changes.”

### Browser not fullscreen
Press `F11` or browser fullscreen before judging; do not alter browser zoom unless necessary.

### File path failure
Use the packaged `data/` directory. Do not point the app at unverified files during judging.

### Port 8501 occupied
Run:

```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py --server.port 8502
```

### Reset
Use **Reset to verified demo** in the sidebar before restarting the explanation.

## Shutdown / backup

Stop Streamlit with `Ctrl+C`. Keep one read-only ZIP backup of the final frozen folder on the laptop and one external drive/USB if available.
