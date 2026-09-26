# OceanTwin Autonomous Final-MVP Master Prompt

## Mission
Own the SIH26067 OceanTwin MVP end-to-end. Improve the judge-facing React/Cesium application without weakening the verified scientific core, offline operation, provenance, or fallback paths.

## Non-negotiable scientific rules
1. Never fabricate measurements, timestamps, depth levels, profiles, currents, anomalies, validation claims, or source provenance.
2. Preserve canonical longitude, latitude, depth in metres positive downward, time, units, variable values, dataset identifiers, and source metadata.
3. Any vertical exaggeration, point size, opacity, colour, interpolation for display, camera motion, or other visual transform must be explicitly cosmetic and must not mutate scientific values.
4. Model-vs-observation is diagnostic collocation evidence, not independent validation. Preserve accepted provider QC and no-extrapolation semantics.
5. Temporal analysis stays locked unless multiple genuine timestamps are actually available.
6. Anomaly outputs are explainable statistical diagnostics, not proof of an ocean event, sensor fault, or forecast failure.

## Delivery rules
1. Start from the latest verified main SHA.
2. Implement one isolated feature increment at a time on a branch.
3. Typecheck/build/test before PR.
4. Open a PR with exact scientific/UX scope and fail-safe notes.
5. Merge only after required checks pass.
6. Verify the exact merged SHA with tests, final-MVP workflow, GitHub Pages deployment, public HTTPS evidence, and Chromium judge flow.
7. Only then begin the next feature.
8. Never claim localhost was updated unless it was actually run on the user's machine.
9. If interrupted, leave a durable checkpoint in this file or the active PR/issue with: stable SHA, active branch, completed edits, failing check if any, and exact next action.

## Priority sequence
### Feature 3 — Dual 3D visualization modes
Make two first-class, unmistakable, coexisting explorer modes:
- Cesium Globe
- Scientific Water-Column 3D

Water-column requirements:
- actual lon/lat/depth/value tuples
- positive-down depth semantics
- selected-depth context
- cosmetic-only vertical exaggeration
- opacity control
- orbit, drag, wheel and keyboard navigation
- smooth dedicated zoom controls
- inspectable scientific coordinates and values

Cesium requirements:
- current verified scalar/current/profile layers
- smooth dedicated zoom controls
- explicit mode switch always visible
- preserve inspection and scientific overlays

### Feature 4 — Higher-quality ocean/map visuals
Preferred rendering architecture:
- high-resolution online imagery when reachable
- bundled Natural Earth II fallback when offline/unavailable
- final grid fallback only if bundled imagery itself is missing/corrupt
- visible imagery-source state and manual offline-safe switch
- never make online imagery a scientific-data dependency

### Science workspace upgrades
- Replace the weak Info placeholder with a useful problem/solution/system/science page tied to SIH26067.
- Upgrade Data Lab with official OceanTwin source cards and safe sample/schema pathways, while keeping upload validation local and fail-closed.
- Upgrade anomaly screening with clearer multi-layer diagnostics, ranking/context, depth navigation and explicit interpretation guardrails without inventing temporal evidence.
- Upgrade Model vs Observation with richer profile diagnostics, residual summaries and selected-profile context.
- Upgrade Depth & Telemetry with more Streamlit-like water-column readability and cross-depth context.
- Reuse the best visual/interaction ideas from the preserved Streamlit reference where scientifically equivalent.
- Improve icons/logos with lightweight inline SVG or local assets; avoid fragile remote decorative dependencies.

## UX rules
- Judges must understand the problem, data, method and evidence in seconds.
- Core controls must be obvious without hunting through panels.
- Prefer direct manipulation, meaningful hover/inspection, compact metric cards and linked context.
- Maintain dark/light themes, keyboard accessibility, responsive layout and focus mode.
- Do not overload the screen; progressive disclosure is preferred.

## Fail-safe hierarchy
Scientific data:
1. verified API/static evidence
2. static hosted evidence
3. preserved Streamlit scientific fallback

Globe imagery:
1. online high-resolution imagery
2. bundled Natural Earth II
3. Cesium grid fallback

Code/deploy:
- never stack unverified feature increments
- if a workflow fails, fix only that increment and rerun
- preserve last known-good main SHA at all times

## Definition of done for every feature
A feature is complete only when:
- source change exists on main
- scientific claims are accurate
- typecheck/build/tests pass
- required CI passes
- Pages deploy is green
- public live test is green
- the user-facing behavior is visible and discoverable
