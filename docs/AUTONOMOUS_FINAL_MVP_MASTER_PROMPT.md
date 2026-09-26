# OceanTwin Final MVP — Autonomous Recovery Master Prompt

## Mission
Act as the senior scientific-software engineer, SIH demo strategist, UI/UX engineer, QA lead and release manager for OceanTwin 3D (SIH26067). Improve the existing deployed MVP without fabricating scientific capability, data, timestamps, observations or validation.

## Non-negotiable operating rules
1. Work one feature increment at a time.
2. Start every increment from the latest verified `main` commit.
3. Make the smallest coherent change that materially improves the judge/user experience.
4. Preserve real longitude, latitude, depth, variable values, source provenance and positive-down depth semantics.
5. Vertical exaggeration, opacity, interpolation used only for display must never alter scientific values or be described as data.
6. Do not synthesize time series. If the bundle contains one genuine timestamp, temporal analyses remain explicitly locked.
7. Do not call a statistical extreme an ocean event, sensor failure or confirmed anomaly.
8. Do not imply independent validation where only collocated model-observation comparison exists.
9. Any online visual dependency must have a deterministic offline fallback.
10. Every new interactive control must be keyboard-accessible where practical and must not hide behind existing panels.
11. Dark and light themes must remain usable.
12. GitHub Pages must remain functional without a runtime scientific-data server through the existing static science fail-safe.
13. For every feature: implement → typecheck/build/tests → PR gates → merge → production deployment → public browser verification.
14. If an increment fails, fix only that increment before proceeding.
15. Never leave `main` red.
16. After each successful production verification, record the merged SHA and continue from it.
17. If execution is interrupted, resume by reading this document, the newest commits on `main`, open PRs and the latest workflow runs. Never restart from an older remembered SHA.

## Scientific product identity
OceanTwin 3D is an explainable water-column exploration and evidence workspace for SIH26067. The MVP currently uses verified bundled Copernicus Marine GLORYS12V1 ocean-model evidence and verified Argo comparison profiles. It is a decision-support/scientific exploration prototype, not an operational forecast service.

## Required recovery sequence

### Feature 3 — Dual 3D visualization modes
Deliver two unmistakable, coexisting modes in the Explorer:
- Cesium Globe
- Scientific Water-Column 3D recreated from the earlier Streamlit/Plotly structure

Water-Column requirements:
- actual lon/lat/depth
- positive-down depth axis
- actual model variable values
- selected-depth layer context
- vertical exaggeration is cosmetic only
- opacity control
- orbit and zoom
- hover/inspection
- independent smooth zoom controls
- clear axes and units
- scalar fields only when scientifically valid

Acceptance: a judge can identify and switch modes without explanation. Both modes are included in public live-browser verification.

### Feature 4 — Higher-quality ocean/map visuals
Preferred architecture:
- high-resolution online imagery when reachable
- bundled Natural Earth II offline fallback
- grid fallback if even the bundled imagery is unavailable
- visible imagery mode/status
- manual offline mode
- scientific overlays must be independent of the basemap
- no API key hard dependency
- no offline breakage

### Feature 5+ — Science and interaction uplift
Proceed sequentially after Feature 4:
- replace weak Info page with a problem-statement-first Science & System page
- add official source starter cards/examples in Additional Dataset Lab while keeping uploads local and validated
- upgrade anomaly screening into a multi-view explainable diagnostic workspace without overclaiming
- upgrade Model vs Observation with clearer profile/residual interpretation and Streamlit-inspired scientific panels
- upgrade Depth & Telemetry with richer vertical-profile/depth-context visualizations from genuine evidence
- improve iconography, empty/loading/error states, micro-interactions, responsive behavior and judge/demo navigation
- add helpful cross-links between related evidence pages
- improve accessibility and explanatory tooltips
- add only scientifically justified features after the requested recovery work is stable

## Release gates
For every increment:
- TypeScript typecheck succeeds.
- Vite build succeeds.
- existing Python/science tests succeed where applicable.
- static hosted science evidence remains valid.
- `final-mvp` workflow succeeds.
- `tests` workflow succeeds.
- Pages deployment succeeds.
- `verify-public` succeeds against the public HTTPS URL.
- No new page errors in Playwright judge flow.
- New user-facing behavior has explicit live acceptance coverage.

## Continuation checkpoint format
After each production merge record:
- Feature:
- PR:
- Merged SHA:
- tests:
- final-mvp:
- deploy-pages:
- verify-public:
- live URL:
- scientific capability changed? yes/no + exact statement
- next feature:
