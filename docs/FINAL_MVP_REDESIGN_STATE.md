# OceanTwin Final MVP Redesign State

PROJECT: SIH26067 OceanTwin 3D
BRANCH: final-mvp-ui-pass
BASELINE_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
CURRENT_HEAD: 8bb3c80e8f27fa7ffbfffe2e748c8abb1fe0f68e
ROLLBACK_COMMIT: 8bb3c80e8f27fa7ffbfffe2e748c8abb1fe0f68e
ACTIVE_PHASE: Phase 4 — Explore de-cluttering and progressive disclosure
ACTIVE_SLICE: advanced-controls-and-contextual-observation-panel
STATUS: VALIDATED
LAST_COMPLETED_ACTION: Added a once-per-session Earth-to-region orientation, reduced-motion bypass, interruptible camera flight, direct verified-region click entry, and an explicit Enter Water Column 3D action.
FILES_CHANGED: frontend/src/components/OceanGlobe.tsx; frontend/src/feature-upgrades.css; docs/FINAL_MVP_REDESIGN_STATE.md
VALIDATIONS_PASSED: tests run 393 passed; final-mvp run 167 passed, including React/Cesium typecheck, production build, live-browser acceptance, science/API/fallback, and static-host smoke.
VALIDATIONS_NOT_RUN: Manual human visual QA on desktop/tablet/mobile screenshots is still pending.
KNOWN_ISSUES: Explore still exposes too many rendering controls simultaneously, and the right observation inspector is populated from the default selected profile even before the user makes a meaningful selection.
SCIENTIFIC_INVARIANTS: One genuine model timestamp only; no fake time animation; no invented observations; no vertical currents; Water Column 3D scalar-only; vertical exaggeration is display geometry only; model-vs-observation remains diagnostic, not independent validation.
NEXT_EXACT_ACTION: Collapse advanced rendering controls behind explicit View settings and keep the desktop observation inspector closed until the user selects an Argo profile or opens observation details.
DO_NOT_TOUCH: Scientific transformation logic, API schemas, verified data values, Streamlit fallback.
PR_NUMBER: 39
LAST_UPDATED: 2026-09-27
