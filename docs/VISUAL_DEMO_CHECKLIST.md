# OceanTwin 3D — Final Judge Visual & Presentation-Machine Checklist

Use this checklist on the **actual laptop/projector/network used for judging**. Automated CI proves application contracts and browser flows; this checklist covers display, GPU, venue-network and human-presentation conditions that CI cannot reproduce.

## Release prerequisite

Before presentation, confirm all three workflow families are green for the same current `main` HEAD:

- `tests` — PASS
- `final-mvp` — PASS
- `deploy-oceantwin-pages` — PASS, including live Chromium judge-flow acceptance

Public URL:

`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`

Keep the local React/FastAPI launch and Streamlit scientific fallback ready before the session.

## Actual presentation machine

- Connect the exact projector/monitor that will be used if available.
- Keep OS display scaling at a stable value; verify browser zoom at 100% unless the venue requires a deliberate adjustment.
- Test normal presentation resolution (especially 1366×768 and 1920×1080 where applicable).
- Confirm hardware acceleration/WebGL works and no Cesium renderer warning appears.
- Confirm mouse/trackpad wheel zoom, click entry, keyboard controls and touch/pinch if the device supports touch.
- Confirm browser fullscreen/presentation mode does not hide critical controls.
- Plug in power, disable unnecessary background apps and prevent sleep/notification interruptions.

## Sponsor-first judge flow

Run the exact final story in this order:

1. **Numerical field:** open the verified GLORYS temperature/salinity geographic 3D field.
2. **Depth + Water Column 3D:** change depth, enter Water Column 3D, show actual depth coordinates and one rendering control/isosurface.
3. **Genuine time:** switch to the INCOIS multi-time source and move the timestamp or play genuine time steps.
4. **In-situ observation:** inspect one real Glider, CTD or BGC profile and verify position, time, depth, variable, source/QC and profile shape.
5. **Model ↔ observation:** open the Argo comparison and verify collocation, Model − Observation bias, MAE/RMSE and diagnostic-not-independent-validation wording.
6. **Trust + scale:** open provenance/source evidence and explain bounded verified windows plus scheduled acquisition/cache scaling.

Show anomaly/telemetry only **after** this required story.

## Geographic View checks

- Earth → India → study-field journey is readable and skippable.
- **Replay journey** and **Skip journey** work.
- Geographic View ↔ Water Column 3D buttons remain visible and unambiguous.
- Clicking the framed study field enters Water Column 3D when field-entry mode is armed.
- Returning to Geographic View and entering again works repeatedly.
- Globe zoom in/out visibly changes camera height.
- Nadir, perspective, cross-section, basin and north camera controls respond.
- Argo, Glider, CTD and BGC markers remain distinguishable.
- Online imagery failure falls back without losing scientific overlays.

## Water Column 3D checks

- Temperature and salinity render through genuine model depth levels.
- Full-water-column horizontal `uo/vo` currents are visibly depth-resolved.
- No vertical `w` component is claimed or implied.
- Depth labels remain positive down.
- Vertical exaggeration changes display geometry only.
- Opacity control works.
- Palette and min/max controls work.
- Linear/log control is enabled only where scientifically valid.
- Isosurface mode produces genuine scalar threshold geometry.
- Reset/zoom/orbit interactions remain usable with the projector attached.

## Time/source checks

- GLORYS clearly remains a single verified timestamp/static comparison baseline.
- INCOIS physical source exposes multiple genuine timestamps.
- INCOIS playback/time selection visibly changes the selected genuine record.
- INCOIS chlorophyll is labelled surface-only and does not expose fabricated depth controls.
- No duplicate/fabricated timestamps appear.

## In-situ observation checks

- Open at least one **Glider** profile.
- Open at least one **CTD** profile.
- Open at least one **BGC** profile.
- Verify platform ID, timestamp, position, source/dataset and variables are readable.
- Verify variable-vs-depth profile chart renders.
- Verify UI does not describe genuine provider measurements as fabricated/synthetic data.
- Verify Argo remains the deeper model-collocation/error-analysis workflow.

## Model–observation comparison checks

- Selected Argo profile loads.
- Observation and model profiles are distinguishable.
- Bias convention is visibly **Model − Observation**.
- Bias zero line is clear.
- MAE/RMSE and matched-level counts are readable.
- Nearest model cell/collocation context is understandable.
- Diagnostic-not-independent-validation wording is visible.

## Light/dark and accessibility

- Check both light and dark themes on the actual display.
- Text, legends, selected controls and disabled controls remain readable.
- Focus states are visible.
- No essential information relies only on colour.
- Evidence/profile drawers can be closed with visible controls and Escape where supported.
- Reduced-motion mode still reaches the final study region without requiring animation.

## Network and recovery

### Normal judging network
- Open the public URL from a fresh browser tab.
- Confirm first load completes without stale-cache confusion.
- Run the sponsor-first flow once end to end.

### Slow/failed network
- Verify the cached/static scientific path remains usable after the application has been prepared.
- Keep `START_OCEANTWIN.cmd` ready for the local React/FastAPI path.
- Keep the Streamlit fallback ready as the final scientific recovery path.

### Recovery order
1. Use explicit Geographic/Water Column buttons instead of gestures if needed.
2. Switch to the local React/FastAPI build.
3. Use Streamlit **Reset to verified demo** only if the React/Cesium surface is unusable.

Do not troubleshoot at length in front of judges.

## Final evidence/safety checks

- Provenance and source information open successfully.
- Evidence downloads are non-empty where offered.
- No traceback, local absolute path, credential, secret or developer-only error is visible.
- No UI text claims a 24/7 national operational digital twin.
- No UI text claims independent model validation.
- No UI text describes anomaly screening as ML event detection.
- No UI text implies a fabricated vertical current.
- No outdated “roadmap-only” wording remains for already implemented salinity, currents, Glider, CTD, BGC, time playback, color controls or isosurfaces.

## Sign-off

The repository can be frozen for judging only after:

- CI release gates are green for one current `main` HEAD;
- this checklist has been run on the actual presentation machine;
- the sponsor-first flow succeeds once without intervention;
- the local recovery path is confirmed.
