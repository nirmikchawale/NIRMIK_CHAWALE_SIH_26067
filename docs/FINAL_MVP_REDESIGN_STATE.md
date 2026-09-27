# OceanTwin Final MVP Redesign State

PROJECT: SIH26067 OceanTwin 3D
BRANCH: final-mvp-ui-pass
BASELINE_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
CURRENT_HEAD: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
ROLLBACK_COMMIT: 6d2f40059b3f9be1abe57ea332ddcf36d1400652
ACTIVE_PHASE: Phase 1 — Camera interaction and persistent visualization state
ACTIVE_SLICE: camera-controls-and-presets
STATUS: CHECKPOINTED
LAST_COMPLETED_ACTION: Established redesign checkpoint from the last CI-green draft PR head.
FILES_CHANGED: docs/FINAL_MVP_REDESIGN_STATE.md
VALIDATIONS_PASSED: Baseline GitHub Actions tests run 371; final-mvp run 156.
VALIDATIONS_NOT_RUN: Browser-rendered visual QA for the redesign has not yet been run.
KNOWN_ISSUES: Desktop globe navigation is too tedious; current reset control returns to a regional view and does not distinguish Earth view from Fit Study Region.
SCIENTIFIC_INVARIANTS: One genuine model timestamp only; no fake time animation; no invented observations; no vertical currents; Water Column 3D scalar-only; vertical exaggeration is display geometry only; model-vs-observation remains diagnostic, not independent validation.
NEXT_EXACT_ACTION: Implement explicit Earth View and Fit Study Region camera presets, improve desktop camera button ergonomics, and preserve all scientific data behavior.
DO_NOT_TOUCH: Scientific transformation logic, API schemas, verified data values, Streamlit fallback.
PR_NUMBER: 39
LAST_UPDATED: 2026-09-27
