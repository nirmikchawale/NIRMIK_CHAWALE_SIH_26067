# OceanTwin 3D — Visual Demo Checklist

## Before presentation

- Start from a fresh terminal.
- Run `python -m pytest -q`.
- Run `python -m streamlit run app.py`.
- Confirm the default selected profile loads automatically.
- Press **Reset to verified demo** once.
- Confirm Temperature is the only active variable.
- Confirm salinity/current/glider items are visibly roadmap-only.
- Disconnect Wi-Fi and refresh.
- Confirm the local/offline-ready badge remains correct.

## 1366 × 768

- Header, selected-profile identity and compact metric row are immediately visible.
- Model/map row is visible without decorative whitespace.
- Beginning of the profile/bias row appears in the primary flow.
- No clipped titles, colourbars or legends.
- Map is comparable in prominence to the 3D view.

## 1920 × 1080

- Six metric cards remain a single compact row.
- Model/map row and comparison row use balanced columns.
- Provenance/limitations row does not create large blank areas.

## Scientific visual checks

- Copernicus series is cyan.
- Argo series is amber.
- Profile and bias depth axes increase downward.
- Bias zero line is obvious.
- Negative bias is identified as model cooler.
- Positive bias is identified as model warmer.
- Selected map markers have different shapes/colours.
- Separation line and distance are visible.
- 3D uses actual thetao values.
- 2D fallback uses the actual selected model depth.

## Evidence checks

- Selected-profile CSV download follows the current profile.
- Selected-profile JSON download follows the current profile.
- Config/provenance/verification downloads are non-empty.
- Mandatory diagnostic-not-validation wording is visible.
- No traceback, local absolute path, credential or secret is visible.

## Recovery

- Change profile and model depth, then press reset.
- Confirm the verified default profile, depth, opacity, exaggeration and 3D/2D state return.
- Force the 2D compatibility fallback and confirm it renders.
