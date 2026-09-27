# Major Redesign Overlay — read before execution

This original final-MVP prompt remains the scientific and product baseline. For the current major visual-redesign pass, also treat these repository files as mandatory execution inputs:

- `docs/FINAL_MVP_MAJOR_VISUAL_REDESIGN_GUIDE.md` — camera, Earth→region intro, connected Geographic/Water Column architecture, progressive disclosure, responsive redesign and phase order.
- `docs/FINAL_MVP_REDESIGN_STATE.md` — authoritative live checkpoint, rollback commit, validation state and NEXT_EXACT_ACTION.

Before every new implementation session, reconcile those files against Git branch HEAD, PR state and current CI. Repository evidence wins if the checkpoint is stale. Work in atomic validated slices and never merge to main without explicit user approval.

New interaction contract:
- first-session Explore may use one short, interruptible Earth→verified-region orientation flight;
- reduced motion skips the flight;
- desktop camera must expose explicit Earth, Fit Study Region, zoom and selected-observation focus actions;
- Geographic View and Water Column 3D are connected states of one workspace;
- preserve Cesium camera context across the view switch;
- keep rendering-only controls behind explicit View settings;
- keep the right observation inspector selection-driven rather than permanently occupying space.

Do not interpret the opening camera flight as permission for decorative autoplay elsewhere. Normal data changes preserve camera and remain fast.

---

# OceanTwin 3D — Final MVP UI Master Prompt

## Role
Act as the lead product designer, senior React/TypeScript frontend engineer, Cesium scientific-visualization engineer, responsive/mobile UX designer, accessibility auditor, performance engineer, and scientific-integrity reviewer for SIH26067.

## Authoritative inputs
Treat these as the implementation contract, in this priority order:
1. The working repository and verified scientific behavior.
2. The official SIH26067 problem statement and project science documentation.
3. Nirmik_SIH26067_Ocean_UI_Master_Prompt.md.
4. SIH26067_motion_and_responsive_upgrade_playbook.md.
5. The deployed GitHub Pages UI only as evidence of what currently renders.

Never replace verified science with decorative mock behavior. Never invent timestamps, observations, currents, anomalies, accuracy, forecasting, or real-time status.

## Current repository baseline
Repository: nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL
Frontend: React 19 + TypeScript + Vite + CesiumJS.
Backend/science: FastAPI + preserved validated Python scientific core.
Routes already present:
- #/explore — 3D Explorer
- #/telemetry — depth/time/ocean telemetry analytics
- #/compare — model vs observation
- #/anomaly — explainable anomaly screening
- #/data-lab — local data validation/provenance
- #/about — science, sources, limits and system

Existing important features to preserve:
- persistent dark/light theme;
- Cesium globe;
- alternative scientific Water-Column 3D view;
- depth control and vertical exaggeration;
- real bundled thetao, so, uo and vo model fields;
- Argo comparison profiles;
- model-vs-observation bias and provenance;
- explicit loading/error/degraded states;
- verified-data language and diagnostic-not-validation caveat;
- offline/local scientific path and Streamlit fallback.

Critical scientific constraint:
The bundled model evidence currently has one genuine timestamp. Keep time playback disabled unless multiple verified time steps are actually connected. Do not create synthetic temporal animation.

## Product story
The UI must let an evaluator understand this sequence without verbal rescue:
1. Where and when am I looking?
2. Which variable, depth, model and source are active?
3. What is happening through the water column?
4. Where is the real observation?
5. How does the model compare with that observation?
6. What is unusual, uncertain, missing or unavailable?
7. Where did the data come from and how was it processed?

## Visual direction
Use an original “oceanographic instrument desk” aesthetic:
- dark navy/graphite scientific viewport;
- clean light reading surfaces in light mode;
- precise cyan/teal selection accent;
- amber for Argo observation series;
- scientifically appropriate continuous scales for scalar variables;
- zero-centred diverging presentation for signed bias;
- restrained borders, shadows and depth;
- no generic glowing dashboard-card wall, fake waves, random particles, fake satellite imagery or decorative scientific-looking meshes.

Keep the Cesium/ocean visualization visually dominant. UI panels should support the data, not compete with it.

## Design tokens
Create or consolidate semantic tokens for:
- surface/base/raised/viewport;
- text/secondary/muted;
- border/focus/selection;
- warning/error/success;
- model series/observation series/bias;
- spacing/radius;
- motion.

Motion baseline:
- instant: 80 ms;
- fast: 140–160 ms;
- standard: 200–240 ms;
- emphasis: 280–340 ms;
- explicit playback only: 450–700 ms;
- standard easing: cubic-bezier(.2,.8,.2,1).

Prefer transform and opacity. Respect prefers-reduced-motion and render final states immediately when requested.

## Desktop Explore target
Use a three-zone scientific workspace:
- compact top header with product identity, active field/model state, status and theme toggle;
- central Cesium/Water-Column visualization as the largest region;
- compact left scientific controls and right contextual observation/comparison panel.

Keep region, variable, depth, time, units, model product and selected observation discoverable above the fold.
Panels may collapse/focus, but the primary scientific action must never be hidden behind mystery icons.

## Mobile Explore target
Do not compress the desktop layout vertically.

The map/3D scene remains primary.
Use:
- compact header;
- horizontally scrollable labelled action tray;
- temporary bottom-sheet controls;
- temporary observation/details sheet;
- explicit open/close controls, not gesture-only behavior;
- at least 44×44 CSS-pixel touch targets;
- high-contrast selected observation;
- no horizontal page overflow at 320 px.

Primary mobile actions:
- Controls / Layer
- Time
- Depth
- Observation
- Compare

It is acceptable to group Layer/Time/Depth in one controls sheet if the current architecture makes that the smallest safe change, but the selected values must remain visible and the user must reach them in one tap.

## Scientific interaction rules
- Changing variable must preserve camera.
- Depth changes update the visible layer without implying nonexistent values.
- Time controls must report actual verified time availability.
- Vertical exaggeration changes display geometry only.
- Current visualization must use real bundled u/v data only.
- Water-column 3D must remain scalar-only unless scientifically valid vector-volume data is added.
- A selected Argo marker/profile must keep platform id, cycle, location, timestamp and comparison method linked.
- Model vs observation must state nearest-cell/interpolation semantics, distance and time offset where available.
- Never silently mix units, times or depth conventions.

## Telemetry
Improve clarity of:
- selected variable;
- selected depth;
- water-column distribution/profile;
- local neighborhood statistics;
- current vector summary;
- actual time availability.

If only one timestamp exists, present a clear locked single-time state rather than a fake trend.

## Model vs Observation
Prioritize:
- one shared depth axis;
- Copernicus vs Argo distinction;
- selected-depth inspector;
- signed bias;
- MAE/RMSE/collocation/time-offset context;
- method pipeline and provenance;
- explicit diagnostic-not-independent-validation caveat.

## Anomaly Screening
Keep anomaly detection explainable.
Show:
- exact measured/model quantity being screened;
- threshold or z-score logic;
- sign/direction;
- location/depth context;
- why flagged;
- limitations.

Do not imply hazard prediction or ML unless implemented and verified.

## Loading, empty and error states
Every async surface needs an explicit state:
- Loading: stable layout + meaningful text.
- Empty: explain why and offer a recovery action.
- Error: plain-language failure + retry where possible.
- Disabled: explain the missing prerequisite.
- Degraded: show what still works.
Avoid spinner-only feedback.

## Accessibility
- keyboard-accessible controls;
- visible focus;
- semantic labels/buttons;
- chart role/description and data meaning available without color alone;
- no essential information conveyed only by animation;
- reduced-motion support;
- touch targets about 44×44 px on mobile;
- sensible focus return when a modal/sheet closes;
- Escape closes dismissible sheets/drawers.

## Performance
- do not add a dependency unless it clearly simplifies the existing architecture;
- prefer CSS motion;
- preserve Cesium camera when swapping data;
- cancel stale requests;
- throttle expensive slider/network updates where needed;
- avoid layout animation on width/height/top/left where possible;
- avoid continuous idle animation;
- keep the existing scientific backend/data separation.

## Implementation method
Work incrementally and preserve the verified baseline.

Phase 1 — audit and foundation
- inventory routes/components/states;
- confirm actual data/time capability;
- consolidate design/motion tokens;
- reduced-motion, focus and explicit states.

Phase 2 — Explore continuity
- make region/variable/depth/time/model/observation context obvious;
- keep visualization dominant;
- mobile action tray + bottom-sheet controls/details;
- selected marker/profile synchronization;
- no camera jump on variable changes.

Phase 3 — analytical pages
- refine Telemetry;
- refine Model vs Observation;
- refine Anomaly;
- improve Data Lab and Science/System readability.

Phase 4 — final polish
- consistent spacing/type hierarchy;
- restrained hover/selection transitions;
- desktop/tablet/mobile QA;
- WebGL fallback;
- performance review.

## Change discipline
Before editing:
1. inspect the existing component and CSS structure;
2. make the smallest safe change;
3. avoid touching scientific transformation code unless required;
4. preserve existing routes and API contracts;
5. do not overwrite unrelated code;
6. prefer additive/refinement CSS where possible.

For each implementation slice:
- list files changed;
- state user-visible behavior changed;
- state scientific behavior unchanged or explicitly changed;
- run typecheck/build/tests available in CI;
- visually verify desktop/tablet/mobile if browser tooling is available;
- report anything not validated.

## Acceptance criteria
Do not call the final MVP ready until:
1. evaluator can identify region, variable, depth, time, units, model and source without guidance;
2. Cesium and Water-Column 3D remain functional;
3. depth changes alter the actual visible field;
4. one verified observation opens a profile and sourced model comparison;
5. comparison semantics, distance and time offset are clear;
6. single-timestamp limitation is explicit and playback remains disabled;
7. anomaly page does not overclaim;
8. loading/empty/error/degraded states are understandable;
9. keyboard focus and reduced-motion behavior work;
10. desktop, tablet and mobile layouts are usable;
11. mobile keeps the visualization primary and uses temporary control/detail surfaces;
12. dark/light theme remains consistent;
13. production frontend build succeeds;
14. no advertised control is fake;
15. no scientific or operational claim exceeds verified evidence.

## Execution command
Proceed autonomously through the phases. Do not stop at planning. Make reversible changes on a dedicated branch, validate each slice before the next, and keep the scientific semantics intact.
