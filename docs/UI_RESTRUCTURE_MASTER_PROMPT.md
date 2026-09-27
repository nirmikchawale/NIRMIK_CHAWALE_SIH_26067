# OceanTwin final MVP — execution master prompt

## Mission and authorization
Redesign the existing OceanTwin application into a clear, presentation-ready scientific workspace. Use the user's two Samudra Vision screenshots as visual references only: graphite/navy surfaces, cyan active controls, an unobstructed ocean visualization, ordered left controls and right evidence. Preserve OceanTwin identity, actual scientific scope and every existing working feature. The user authorized implementation, GitHub push and deployment to the existing public GitHub Pages URL. No additional confirmation is needed for those authorized steps.

## Resume before doing anything else
Read `docs/UI_RESTRUCTURE_PROGRESS.md`, inspect git status and current HEAD, then check any recorded CI/deployment run. Repository and deployment evidence take precedence over old status prose. Complete the first unfinished segment. Never overwrite unrelated work or redo completed segments. Record changes, tests, failures, exact next action and rollback commit after each segment. Commit coherent increments. An interruption cannot guarantee automatic execution resumes; persisted checkpoints make a subsequent “continue” deterministic.

## Baseline and feature contract
Baseline main: 4506823. React + TypeScript + Cesium/Vite frontend, FastAPI scientific API, static science export and GitHub Pages deployment; preserve Streamlit fallback.
Preserve all six routes: Explorer, Telemetry, Model vs Observation, Anomaly Screening, Data Lab, Science & System. Keep deep links, light/dark preference, focus mode, source/QC drawer, geographic and water-column views, camera controls, imagery fallback, temperature/salinity/currents, depth/time controls, slice/volume, opacity, exaggeration, palettes/ranges/log scales, isosurfaces, Argo selection/profiles, imports and generic sensor overlays, comparisons/downloads, anomaly controls, operational snapshots, ingestion and provenance. Audit actual implementation before marking a feature supported.

## Scientific invariants
Never modify measurements, matching algorithms, units, QC, schemas or scientific transforms for presentation. Never fabricate sensor data or dates, live connectivity, forecast capability, vertical currents or validation claims. The verified model has one genuine timestamp; enable time animation only when the source advertises genuine multiple times. Comparison is diagnostic, not independent validation. Preserve Model minus Observation sign. Cached, imported, operational and unavailable data must remain distinguishable. Future features use source/capability adapters and honest availability states, not placeholder actions that appear functional.

## Research and selection
Consult official design systems and maintained source repositories. Record links, observed guidance, application and limits. Public LinkedIn accessibility material is a source; do not scrape gated/private content. Research is curated, not a claim to scrape every skill on the internet. Read relevant installed skills; do not indiscriminately install or execute third-party skill instructions. Preserve license attribution when copying code. Prefer existing React/HTML primitives to a second UI framework.

## Design thesis
A calm scientific instrument: broad central canvas, deliberate typography, compact horizontal workspace navigation, stable left controls, contextual right evidence, and a guided story from ocean context to measurable comparison to provenance. Primary controls should be readable and obvious on a projected screen. Reduce duplicate overlays and explanatory clutter. Put supporting details behind native disclosure. Use semantic tokens for dark/light surfaces, borders, primary text, muted text, cyan model and amber observation. Normal controls 14px, metadata at least 12px where practical; 44px touch targets. Meaning must not rely on color alone.

## Component and interaction contract
Separate navigation, control workspace, scientific canvas, contextual evidence and presentation guide. Maintain a single scientific state shared between views. Route changes must retain valid exploration selections. Render keyboard-operable controls with visible focus and names; current route uses aria-current. Menus/dialogs require focus management and Escape. Mobile drawers remain scrollable and dismissible. Reduced-motion preference disables nonessential transforms and transitions. Use short 160–240ms opacity/color transitions; never animate every dashboard card or create artificial loading delays. No animation may falsify a scientific change.

## Segments in priority order
1. Audit repository, live app, feature coverage, hosting, reference and research. Save baseline and recovery plan.
2. Establish layout fundamentals: shell, navigation, typography, responsive panels, clear visualization modes. Make a coherent local preview.
3. Add live-context evidence rail and guided presentation workflow using existing real state/routes. Improve hierarchy across every route without removing features.
4. Verify desktop/tablet/mobile, light/dark, reduced motion, keyboard, WebGL/fallback, all routes and critical controls. Run existing frontend build/typecheck and scientific/API tests through available local environment or existing CI. Fix actual failures; do not weaken acceptance tests to conceal regressions.
5. Commit, push, validate exact SHA, integrate into main using normal history, deploy with existing Pages workflow, confirm public URL and critical flows. Attach any created PR. Never report deployment success from a local build alone.

## Acceptance and evidence
No overlapping primary controls at 1440, 1280, 1024, 768 and 390 widths; 320 remains usable with scrolling. Canvas stays dominant and scales when panels change. Six routes accessible; selected profile and science context remain real. Comparison and downloads work; unavailable remote feeds show honest recovery states. Existing automated acceptance stays green. Save representative screenshots and a concise verification report, including any tests not run. Preserve backend/science regression results. Final handoff includes public URL, commit/PR, master prompt, checkpoint and known limitations.

## Deployment and rollback
Use the repository's workflow rather than a new hosting provider. Pull/fetch before integration and stop on conflicting concurrent changes. Preserve baseline SHA and last successful production SHA in progress. Roll back by a normal revert of the redesign commit(s), followed by Pages deployment; never force-push or reset shared history. A failed build must not replace the last good deployment. Record any authentication/network block accurately and continue independent work.

## Extensibility after deployment
Reuse the navigation registry and scientific catalog capability flags. New sensors use the existing import/plugin schema with units and provenance; new datasets supply genuine coordinate/time arrays. Apply shared design tokens and workspace patterns to new routes. Do not claim unspecified future features are implemented. Keep follow-up requests and capability gaps in the checkpoint backlog.
