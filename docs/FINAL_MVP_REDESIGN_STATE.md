# OceanTwin Final MVP Redesign State

PROJECT: SIH26067 OceanTwin 3D
BRANCH: final-mvp-ui-pass
BASELINE_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
CURRENT_HEAD: 08eea7d3a89f44d310f6b0f910a78767edc79d76
ROLLBACK_COMMIT: 08eea7d3a89f44d310f6b0f910a78767edc79d76
ACTIVE_PHASE: Phase 5 — Desktop visual hierarchy and readability
ACTIVE_SLICE: explore-readability-and-density
STATUS: VALIDATED
LAST_COMPLETED_ACTION: Collapsed rendering-specific controls into explicit View settings; made the desktop observation inspector selection-driven with Close/Escape behavior; kept mobile observation close state consistent.
FILES_CHANGED: frontend/src/App.tsx; frontend/src/components/ControlPanel.tsx; frontend/src/components/ProfilePanel.tsx; frontend/src/feature-upgrades.css; docs/FINAL_MVP_REDESIGN_STATE.md
VALIDATIONS_PASSED: tests run 408 passed; final-mvp run 174 passed, including React/Cesium typecheck, production build, live-browser acceptance, science/API/fallback, and static-host smoke.
VALIDATIONS_NOT_RUN: Manual human screenshot review at 1440/1366/1024/768/390/320 remains pending.
KNOWN_ISSUES: Explore still contains legacy microtype below comfortable desktop reading size in several overlays/controls; broader desktop hierarchy and spacing have not yet been normalized.
SCIENTIFIC_INVARIANTS: One genuine model timestamp only; no fake time animation; no invented observations; no vertical currents; Water Column 3D scalar-only; vertical exaggeration is display geometry only; model-vs-observation remains diagnostic, not independent validation.
NEXT_EXACT_ACTION: Improve Explore desktop typography, spacing, and control hierarchy with additive CSS only, preserving visualization dominance and all validated interaction/science behavior.
DO_NOT_TOUCH: Scientific transformation logic, API schemas, verified data values, Streamlit fallback.
PR_NUMBER: 39
LAST_UPDATED: 2026-09-27
