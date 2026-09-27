# OceanTwin Final MVP Redesign State

PROJECT: SIH26067 OceanTwin 3D
BRANCH: final-mvp-ui-pass
BASELINE_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
CURRENT_HEAD: 97eaa3057181b8894c9fa91b5b29bb1c616abed5
ROLLBACK_COMMIT: 97eaa3057181b8894c9fa91b5b29bb1c616abed5
ACTIVE_PHASE: Phase 8 — Motion and interaction polish
ACTIVE_SLICE: first-entry-region-click-priority
STATUS: VALIDATED
LAST_COMPLETED_ACTION: Grouped the existing routes into Explore / Analysis / Evidence and removed duplicate Data Lab / Science actions from the right rail; URLs and capabilities remain unchanged.
FILES_CHANGED: frontend/src/App.tsx; frontend/src/components/ControlPanel.tsx; frontend/src/components/ProfilePanel.tsx; frontend/src/feature-upgrades.css; docs/FINAL_MVP_REDESIGN_STATE.md
VALIDATIONS_PASSED: tests run 425 passed; final-mvp run 182 passed, including React/Cesium typecheck, production build, live-browser acceptance, science/API/fallback, and static-host smoke.
VALIDATIONS_NOT_RUN: Manual human screenshot review at 1440/1366/1024/768/390/320 remains pending.
KNOWN_ISSUES: During the first-entry region prompt, clicking a rendered scientific primitive inside the model footprint can prioritize inspection instead of the intended one-time transition into Water Column 3D.
SCIENTIFIC_INVARIANTS: One genuine model timestamp only; no fake time animation; no invented observations; no vertical currents; Water Column 3D scalar-only; vertical exaggeration is display geometry only; model-vs-observation remains diagnostic, not independent validation.
NEXT_EXACT_ACTION: Arm the verified study footprint only for the first-entry prompt so the first footprint click reliably enters Water Column 3D, then restore normal scientific inspection behavior on later Geographic View use.
DO_NOT_TOUCH: Scientific transformation logic, API schemas, verified data values, Streamlit fallback.
PR_NUMBER: 39
LAST_UPDATED: 2026-09-27
