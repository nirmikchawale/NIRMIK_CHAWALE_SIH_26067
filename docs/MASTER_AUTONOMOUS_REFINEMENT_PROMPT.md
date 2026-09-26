# OceanTwin Final MVP — Autonomous Refinement Master Prompt

## Mission
Transform OceanTwin into a judge-ready, scientifically truthful, highly interactive SIH26067 final MVP while preserving offline operation, verified evidence, reproducibility and fail-safe deployment.

## Non-negotiable scientific rules
1. Never invent scientific observations, model values, timestamps, depths, currents, profiles, provenance, anomaly events, forecasts or validation claims.
2. Use only canonical verified evidence already exposed by the repository's scientific API/static export unless a later feature explicitly adds a verified official source.
3. Preserve longitude, latitude, depth and variable units exactly. Depth remains metres positive downward.
4. Visual vertical exaggeration, opacity, camera motion and rendering effects are cosmetic only.
5. Never synthesize additional time steps to make a chart look richer.
6. Currents remain horizontal u/v unless a verified vertical component exists.
7. Model-vs-observation is diagnostic evidence, not independent validation.
8. Anomaly flags are explainable statistical diagnostics, not automatic proof of an ocean event or sensor fault.

## Delivery discipline
Work one feature at a time:
branch -> smallest coherent change -> tests -> final-mvp -> PR -> merge -> exact merged SHA tests -> Pages deploy -> public HTTPS check -> live Chromium judge flow.
Do not begin the next feature until the current feature is fully green on the exact merged SHA.

## Current priority sequence
### Feature 3 UX v2 — Dual 3D visualization
Make the two modes impossible to miss:
- [Cesium Globe]
- [Water-Column 3D]
Recreate the scientific Streamlit/Plotly-style lon/lat/depth box in React.
Preserve actual coordinates, positive-down depth, actual values, selected depth, opacity, cosmetic vertical exaggeration and orbit/zoom.
Add independent eased zoom controls to both renderers.
Both views must coexist.

### Feature 4 UX v2 — Higher-quality ocean/map visuals
Preferred architecture:
- high-resolution online imagery when reachable
- automatic offline Natural Earth II fallback
- grid fallback if imagery fails completely
No online scientific-data dependency.
Expose current imagery mode/status and verify fallback behavior.

### Info / About redesign
Replace placeholder/lame content with:
- SIH26067 problem statement
- stakeholder/problem context
- OceanTwin solution architecture
- model + Argo evidence chain
- dual 3D explanation
- telemetry, comparison, anomaly and Data Lab workflow
- scientific limitations and provenance
- judge-friendly “how to use the demo” sequence

### Data Lab v2
Add official dataset quick-start cards for the official sources used by the project.
Present them as recommended official ocean-data starting points.
Provide source, variables, expected format, provenance and safe import guidance.
Do not imply that external files have already been downloaded when they have not.
Keep local validation fail-closed and browser-local unless upload/persistence is explicitly implemented.

### Anomaly Screening v2
Upgrade the anomaly workspace with stronger PS-specific diagnostics:
- robust spatial anomaly map/table
- per-profile residual anomaly context
- threshold explanation
- depth context
- severity categories based only on deterministic thresholds
- distribution/context panels where supported
- temporal screening remains locked without enough genuine timestamps
- downloads/evidence provenance where useful

### Model vs Observation v2
Bring back useful scientific interaction patterns from the Streamlit reference:
- stronger depth-linked observed/model profile view
- synchronized bias context
- selected-depth cursor/context
- collocation explanation
- evidence/provenance visibility
- interactive profile switching and judge-readable metric interpretation

### Depth & Telemetry v2
Improve depth exploration and telemetry:
- depth profile context
- selected-depth synchronization with Explorer where appropriate
- genuine timestamp limitations
- current vector summaries
- compact scientific dashboard patterns inspired by the Streamlit reference

### Visual identity and interaction
Improve meaningful icons/logos, micro-interactions, hover/focus states, responsive behavior and judge-flow clarity without decorative clutter.

## Optional later increments
After all requested features are fully verified, autonomously add only high-value improvements such as:
- guided judge tour
- keyboard shortcuts/help
- permalink/share state
- side-by-side mode comparison
- evidence export bundle
- performance/quality selector
- accessibility improvements
- provenance timeline
- scientific glossary
- error recovery UX
Each remains a separate verified feature.

## Acceptance standard
A feature is complete only when:
- implementation is visible and usable in the public MVP
- desktop and reasonable responsive behavior work
- light and dark modes remain functional
- no scientific guardrail is weakened
- TypeScript/build/tests pass
- static hosted fail-safe passes
- GitHub Pages deployment passes
- public HTTPS evidence checks pass
- live Chromium judge flow passes
- CONTINUATION_STATE.md is updated to the exact verified merged SHA

## Interruption recovery protocol
If execution is interrupted, never assume the last feature succeeded.
1. Read docs/CONTINUATION_STATE.md.
2. Verify the stated exact SHA still matches main.
3. Inspect tests, final-mvp and deploy-oceantwin-pages for that SHA.
4. If a gate failed, fix only that feature.
5. Resume the next listed feature only after all gates are green.
