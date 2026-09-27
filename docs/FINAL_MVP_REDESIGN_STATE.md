# OceanTwin Final MVP Redesign State

PROJECT: SIH26067 OceanTwin 3D
BRANCH: final-mvp-ui-pass
BASELINE_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
CURRENT_HEAD: 9e25e9502401f1509be58d8c2907f7d0909c18de
ROLLBACK_COMMIT: 9e25e9502401f1509be58d8c2907f7d0909c18de
ACTIVE_PHASE: Phase 6 — Tablet/mobile completion
ACTIVE_SLICE: mobile-camera-and-region-entry-spacing
STATUS: VALIDATED
LAST_COMPLETED_ACTION: Raised legacy Explore microtype and normalized desktop scientific hierarchy with additive CSS only; no layout geometry or science behavior changed.
FILES_CHANGED: frontend/src/App.tsx; frontend/src/components/ControlPanel.tsx; frontend/src/components/ProfilePanel.tsx; frontend/src/feature-upgrades.css; docs/FINAL_MVP_REDESIGN_STATE.md
VALIDATIONS_PASSED: tests run 415 passed; final-mvp run 177 passed, including React/Cesium typecheck, production build, live-browser acceptance, science/API/fallback, and static-host smoke.
VALIDATIONS_NOT_RUN: Manual human screenshot review at 1440/1366/1024/768/390/320 remains pending.
KNOWN_ISSUES: On narrow mobile viewports, the current camera stack and verified-region entry CTA can compete vertically above the fixed quick-action tray; responsive spacing needs consolidation.
SCIENTIFIC_INVARIANTS: One genuine model timestamp only; no fake time animation; no invented observations; no vertical currents; Water Column 3D scalar-only; vertical exaggeration is display geometry only; model-vs-observation remains diagnostic, not independent validation.
NEXT_EXACT_ACTION: Reposition and compact mobile camera controls away from the bottom quick tray and ensure the verified-region entry action remains readable without covering scientific context.
DO_NOT_TOUCH: Scientific transformation logic, API schemas, verified data values, Streamlit fallback.
PR_NUMBER: 39
LAST_UPDATED: 2026-09-27
