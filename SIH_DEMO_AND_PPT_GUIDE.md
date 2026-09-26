# OceanTwin 3D — SIH Quick Guide

The final detailed handover is in `docs/`.

## Live demo

1. Start the app locally and verify Wi-Fi can be disconnected.
2. Press **Reset to verified demo**.
3. Confirm profile `20240102_indian_ocean_prof:23` and the verified KPI row.
4. Show actual `thetao` 3D context plus the 3.851 km collocation map.
5. Open **Compare profile** and explain Argo vs Copernicus and Model − Observation bias.
6. Open **Evidence & limitations** and state that the comparison is diagnostic, not independent validation.
7. If 3D is slow, immediately use the 2D compatibility fallback.

See `docs/DEMO_RUNBOOK.md` for 90-second, 2-minute and 3-minute flows.

## PPT rule

No Streamlit UI screenshots. Use native architecture/methodology diagrams, tables, metric callouts and evidence-derived scientific charts where allowed. See `docs/PPT_CONTENT.md`.

## Safe claims

- Working local/offline scientific diagnostic prototype.
- Copernicus `GLOBAL_MULTIYEAR_PHY_001_030` / GLORYS12V1 cached subset.
- Two eligible profiles under the current configured workflow, 99 matched levels total.
- Default profile: 50 matched levels, 3.851 km, MAE 0.2254 °C, RMSE 0.3188 °C.
- Nearest-valid-water-cell spatial collocation and linear vertical interpolation.
- Bias = Model − Observation.

## Claims to avoid

Do not claim independent validation, full Digital Twin Ocean, real-time monitoring, forecasting, AI/ML, global/Indian-EEZ operational coverage, or completion of salinity/current/glider/bilinear roadmap work.
