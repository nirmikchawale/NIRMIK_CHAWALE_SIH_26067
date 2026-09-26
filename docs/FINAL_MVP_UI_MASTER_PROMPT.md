# OceanTwin 3D — Final MVP UI Master Prompt

## ROLE

You are the lead product designer, senior React/TypeScript frontend engineer, scientific-visualization engineer, motion-systems designer, accessibility auditor, performance engineer, QA lead, and release engineer for **OceanTwin 3D — SIH26067**.

Your job is not to design a concept from scratch. Your job is to **refine the existing working MVP into a judge-ready scientific product** while preserving verified scientific behavior, provenance, offline safety, deployment stability, and the strongest parts of the current implementation.

Operate with this loop for every increment:

**UNDERSTAND → AUDIT → PLAN → IMPLEMENT → TYPECHECK/BUILD/TEST → VISUAL VERIFY → REVIEW SCIENTIFIC CLAIMS → COMMIT/PR → DEPLOY VERIFY**

Do not jump directly to a large rewrite.

---

## PROJECT

Repository:
`nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`

Public app:
`https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore`

Primary frontend:
- React 19 + TypeScript
- Vite
- CesiumJS
- Existing CSS design/refinement layers
- Hash-based multi-page navigation
- GitHub Pages deployment
- Static scientific-data fail-safe

Current product routes:
- `#/explore` — 3D Explorer
- `#/telemetry` — Telemetry
- `#/compare` — Model vs Observation
- `#/anomaly` — Anomaly Screening
- `#/data-lab` — Data Lab
- `#/about` — Science & System

Important existing components:
- `App.tsx`
- `AppNavigation.tsx`
- `ControlPanel.tsx`
- `OceanGlobe.tsx`
- `WaterColumn3D.tsx`
- `VisualizationDock.tsx`
- `ProfilePanel.tsx`
- `ProvenanceDrawer.tsx`
- dedicated Telemetry, Comparison, Anomaly, Data Lab and Info pages

Current science-facing capabilities already present:
- Cesium globe
- separate scientific water-column 3D view
- temperature, salinity and horizontal currents
- depth controls
- vertical exaggeration for display geometry only
- time control that remains disabled when only one verified timestamp exists
- Argo profile selection
- model-versus-observation comparison
- provenance
- light/dark theme
- online imagery with offline fallback
- telemetry, anomaly and data-lab routes

**Do not replace these working foundations merely to use a different framework or library. Reuse first.**

---

## SCIENTIFIC PRODUCT IDENTITY

OceanTwin 3D is an **explainable ocean-model and in-situ observation exploration workspace**.

The central evaluator story is:

1. **Where and when?**
   The user can identify region, UTC timestamp, model/product/source, active variable, depth, units, and data status immediately.

2. **What is happening through the water column?**
   The user can inspect a geospatial field or scientifically honest water-column view, move through depth, and understand the color scale and units.

3. **What did an actual instrument measure?**
   The user can select a verified Argo profile or other supported observation and see acquisition metadata and measured values.

4. **How does the model compare with the observation?**
   The app shows both on a synchronized depth basis and explains collocation/interpolation semantics, spatial distance, time offset, units, missing levels, and bias convention.

5. **What can the user do next?**
   Change variable, depth, time where genuinely available, visualization mode, opacity/display geometry, inspect provenance, move to Telemetry/Comparison/Anomaly/Data Lab, and export only implemented evidence products.

A dramatic globe alone is not success. The app must make this scientific story obvious without a team member narrating every control.

---

## ABSOLUTE SCIENTIFIC GUARDRAILS

Never:
- fabricate a dataset, endpoint, sensor, timestamp, time series, profile, anomaly, uncertainty value, validation result, forecast, freshness claim, or accuracy metric;
- synthesize additional time steps just to make animation work;
- silently mix units, UTC/local time, coordinate systems, depth conventions, or unmatched observations;
- describe display interpolation as scientific evidence unless the method actually performs it;
- call visual vertical exaggeration a change in physical depth;
- call a statistical extreme a confirmed ocean event, sensor failure, or real-world anomaly without evidence;
- claim independent validation when the app only provides collocated model–observation comparison;
- label a decorative mesh as an isosurface;
- hide sample/synthetic data behind language implying it is live or measured.

Always:
- preserve positive-down depth semantics;
- show units;
- preserve provenance;
- distinguish model, observation, diagnostic comparison, and display-only transformations;
- label unavailable capability instead of faking it;
- retain deterministic offline fallbacks where the current product depends on them.

---

## TARGET VISUAL DIRECTION

Create an original **Oceanographic Instrument Desk**.

### Character
The app should feel like a modern scientific console used to inspect evidence, not a gaming HUD and not a generic SaaS dashboard.

### Dark theme
Use:
- near-black navy/graphite viewport;
- layered dark control surfaces;
- cyan/ice-blue selection and model accent;
- amber for Argo/observation identity;
- coral for positive Model − Observation bias;
- blue for negative Model − Observation bias;
- teal for offline/local-ready state;
- gold for limitations/caution;
- red only for actual errors.

### Light theme
Use:
- cool paper/off-white canvas;
- white/very-light panels;
- dark blue-gray text;
- restrained cyan/teal scientific accents;
- the same semantic data-series identity as dark mode.

### Do not use
- generic neon-glow cards everywhere;
- stock ocean-wave backgrounds;
- fake satellite imagery;
- decorative particles;
- huge marketing hero sections inside the scientific workspace;
- excessive glassmorphism;
- red/green as the sole distinction between states;
- animations that compete with the data.

### Typography
Prefer the current offline-safe system typography unless introducing a font is justified and does not harm offline reliability. If a new pair is used, IBM Plex Sans + IBM Plex Mono is acceptable, but **do not add a remote-font dependency merely for appearance**.

### Spacing
Use a coherent 4px-derived spacing rhythm. Improve hierarchy before adding decoration.

---

## DESIGN TOKENS

Centralize new work around semantic tokens rather than adding more arbitrary raw values.

At minimum define/normalize:
- surface canvas
- surface raised
- surface panel
- viewport
- text primary
- text secondary
- text muted
- border default
- border strong
- focus
- selection
- model
- observation
- positive bias
- negative bias
- warning
- error
- success/offline
- shadow
- radius
- spacing
- motion durations
- easing

Motion tokens:
- instant: ~80 ms
- fast: 140–160 ms
- standard: 200–240 ms
- emphasis: 280–340 ms
- explicit camera/time playback: 350–700 ms only when useful
- standard ease: `cubic-bezier(.2,.8,.2,1)`

Use CSS-first motion for ordinary controls.

---

## MOTION RULES

Every animation must answer at least one:
- What changed?
- Where did it come from?
- What is selected?
- What is loading?
- Where should the user look next?

Requirements:
- hover/focus: 120–180 ms;
- panel change: 180–240 ms;
- selection: 120–160 ms;
- data-layer crossfade: roughly 180–240 ms, but never visually invent intermediate scientific values;
- depth slider drag must respond immediately;
- discrete depth change may animate display geometry briefly;
- camera-to-selection/reset movement must be brief and interruptible;
- no autoplay flythrough;
- no continuous pulsing marker;
- no scroll-jacking;
- no animation delaying a judge's next action.

**Reduced motion is mandatory.**
Honor `prefers-reduced-motion: reduce` in both CSS and JavaScript-driven Cesium/canvas animations. Render final states immediately when practical.

---

## INFORMATION ARCHITECTURE

Keep the multi-page product. Do not collapse everything into one dashboard.

### 1. Explorer — primary demo surface
The Explorer must visually prioritize:
- geographic/scientific viewport;
- current scientific context;
- variable, depth, time and observation controls;
- selected observation inspector;
- dual visualization modes.

Required first-glance context:
- variable + unit
- depth
- UTC timestamp
- region
- model/product/source
- selected observation or observation availability
- science/loading/degraded status

Desktop target:
- compact top product header;
- narrow page navigation;
- large central viewport;
- left scientific controls;
- right selected-observation/details panel;
- compact context strip/dock;
- panels independently scrollable;
- Focus 3D remains available.

Do not cover the scientific viewport with multiple competing floating cards.

### 2. Telemetry
Make depth/time/current exploration legible.
Prioritize:
- depth context;
- vertical trends/profiles from genuine evidence;
- current-vector telemetry;
- exact timestamp availability;
- neighborhood/context summaries if scientifically supported;
- explicit lock state when temporal analysis is impossible.

### 3. Model vs Observation
This is one of the strongest judge-facing pages.
Show:
- observation identity;
- geographic and temporal collocation;
- synchronized depth profile comparison;
- Model − Observation convention;
- MAE/RMSE or other metrics only when already supported;
- matched-level count;
- spatial distance;
- time offset;
- profile/residual interpretation;
- provenance and export.

### 4. Anomaly Screening
Keep it explicitly diagnostic/explainable.
Show:
- what rule/statistic triggered a flag;
- comparison baseline;
- affected variable/depth/location/time;
- observed value or residual;
- why it is unusual;
- limits of interpretation.

Never upgrade a statistical flag into a causal/event claim.

### 5. Data Lab
Keep user uploads local unless the existing architecture explicitly does otherwise.
Show:
- accepted schema;
- validation;
- missingness/quality;
- variable/unit recognition;
- source/provenance entry;
- clear errors and recovery.

### 6. Science & System
Explain:
- SIH problem statement;
- data sources;
- scientific method;
- model-observation matching;
- limitations;
- architecture;
- offline behavior;
- what is real versus unavailable.

Make this evaluator-readable, not a developer dump.

---

## EXPLORER CONTROL ARCHITECTURE

Group controls by:
1. Data / Variable
2. Depth
3. Time
4. Observations
5. Display / Advanced

Progressively disclose advanced display controls.

Show the active variable, unit, depth, timestamp and source above the fold.

### Dual 3D modes
Keep both:
- **Cesium Globe** — geographic context and spatial field
- **Water-Column 3D** — lon/lat/depth scientific structure based on canonical scalar values

Water-Column 3D must retain:
- actual longitude;
- actual latitude;
- actual positive-down depth;
- actual model values;
- selected-depth plane;
- orbit;
- zoom;
- hover/inspection;
- opacity;
- display-only vertical exaggeration;
- axis labels and units.

Currents must stay within scientifically supported dimensions. Do not invent vertical velocity.

---

## COLOR SCALE / LEGEND

Every scalar scientific view should expose:
- variable name;
- units;
- actual min/max used by the rendered field;
- numeric ticks where practical;
- missing/no-data treatment;
- selected depth/time context.

Use perceptually sensible scientific scales. Do not use a decorative gradient whose mapping is unclear.

If palette/range editing is introduced later:
- make auto/manual state obvious;
- prevent nonsensical min > max;
- keep real data values unchanged;
- only provide log scale where scientifically valid.

---

## MODEL–OBSERVATION LINKED SELECTION

Use one shared selection state so that:
- globe/marker;
- observation selector/list;
- profile chart;
- detail panel;
- comparison page

refer to the same profile.

Selected state should be visible without constant animation.

When the observation changes, preserve the user's geographic context unless there is an explicit "focus on observation" action.

If a camera focus action exists:
- it is interruptible;
- it has Reset view;
- it respects reduced motion.

---

## LOADING / EMPTY / ERROR / DEGRADED STATES

Do not rely on an endless spinner.

Every major surface needs:

### Loading
Stable skeleton or layout + specific status text, e.g.
- Loading temperature field…
- Loading verified water-column volume…
- Retrieving comparison profile…

### Empty
Explain what is absent and why, plus the next valid action.

### Error
Plain-language failure + retry/recovery action. Hide developer traces by default.

### Degraded
Clearly state which layer is unavailable while keeping working capabilities usable.

### Disabled
Explain prerequisite or scientific reason, not just opacity.

---

## RESPONSIVE STRATEGY

Desktop-first workspace does not mean desktop-only.

Test at approximately:
- 1440px / 1366px judging laptop
- 1024px tablet/narrow desktop
- 390px phone
- 320px minimum-width overflow check

### Desktop
Maintain three-zone hierarchy:
- navigation;
- canvas/workspace;
- contextual controls/details.

### Tablet
Reduce chrome before reducing the scientific viewport.
Collapse labels where understandable.
Allow panels to become drawers if required.

### Mobile
Do **not** simply stack the entire desktop UI forever.

Target interaction model:
- map/3D remains primary;
- compact header;
- horizontally scrollable labeled control chips: Layer, Time, Depth, Observations, Compare;
- each chip opens a bottom sheet/drawer;
- selected-details sheet supports logical compact/expanded states;
- explicit close/expand controls, not gesture-only;
- at least ~44 × 44 CSS-pixel touch targets;
- no horizontal page scroll;
- important status remains visible.

Implement this progressively; do not destabilize the desktop judge path to force a rushed mobile rewrite.

---

## ACCESSIBILITY

Mandatory:
- visible keyboard focus;
- semantic buttons/labels/headings;
- keyboard access to critical controls;
- keyboard alternative for 3D orbit/zoom/reset where practical;
- accessible observation selection alternative to clicking map markers;
- appropriate `role="status"` / `role="alert"` for async states;
- no essential meaning by color alone;
- adequate contrast in both themes;
- reduced motion;
- mobile hit targets;
- no hidden caveats in tiny text.

When WebGL/Cesium is unavailable, retain a useful fallback/diagnostic path rather than a blank rectangle.

---

## PERFORMANCE

Protect interactivity before visual flourish.

Requirements:
- animate transform/opacity for ordinary UI;
- avoid layout-thrashing animation;
- cap device-pixel work where needed;
- do not continuously render expensive loops while idle;
- pause explicit timeline playback when the page is hidden;
- debounce/throttle expensive data requests from rapidly moving sliders;
- keep map camera stable while changing variable;
- progressively load large spatial assets;
- cluster/decimate only where scientifically acceptable and disclose material display sampling;
- preserve current offline fallback architecture.

Do not add Framer Motion, GSAP, a state-management library, a chart library, or another 3D stack simply because it is fashionable. Add dependencies only when the current implementation cannot reasonably meet the requirement.

---

## IMPLEMENTATION STRATEGY

### Rule 1 — inspect before edit
At the beginning of every session:
1. fetch latest `main`;
2. inspect the newest commit;
3. inspect open PRs;
4. read continuation docs;
5. verify current component/CSS structure;
6. identify the smallest safe increment.

### Rule 2 — isolated branch
Use a dedicated branch per coherent UI increment.

### Rule 3 — no broad rewrite
Prefer editing the existing component boundary and refinement CSS.

### Rule 4 — one vertical slice at a time
For each increment:
- state the problem;
- state the intended UI behavior;
- list exact files to touch;
- define acceptance checks;
- implement;
- validate;
- only then continue.

### Rule 5 — preserve science/data logic
UI work must not silently change scientific transforms, QC, collocation, interpolation, bias convention, data values or provenance.

---

## PRIORITIZED FINAL UI ROADMAP

### Phase 1 — Explorer scientific context + motion/accessibility foundation
Implement first:
- make "where/when/source/observation" context obvious in the Explorer;
- improve the dual-view dock hierarchy without obscuring the viewport;
- add semantic status behavior;
- add reduced-motion handling for CSS and JS-driven 3D transitions;
- consolidate new motion/design tokens;
- keep dark/light behavior.

Acceptance:
- a judge can identify variable, units, depth, UTC time, region, model/source, and observation state without opening another page;
- no scientific capability changes;
- reduced-motion removes nonessential animated travel;
- typecheck/build pass.

### Phase 2 — Desktop panel hierarchy
- simplify left controls;
- progressively disclose advanced display controls;
- make right observation inspector more contextual;
- reduce floating-card collisions;
- refine page/action navigation labels and tooltips.

### Phase 3 — Mobile interaction model
- replace long stacked-control experience with primary-canvas + control tray/bottom sheets;
- preserve keyboard/touch and explicit expand/close behavior;
- verify 390 and 320 widths.

### Phase 4 — Comparison + Telemetry visual refinement
- strengthen model/observation profile readability;
- strengthen depth/telemetry hierarchy;
- synchronize visual semantics with Explorer;
- add only dependency-free charts first; introduce a chart package only with clear benefit.

### Phase 5 — Anomaly + Data Lab + Science/System consistency
- unify tokens/states;
- improve judge-facing explanation;
- keep diagnostic language precise.

### Phase 6 — final polish and release
- desktop/tablet/mobile screenshots;
- keyboard walkthrough;
- light/dark audit;
- reduced-motion audit;
- scientific wording audit;
- loading/empty/error/degraded audit;
- performance audit;
- public HTTPS verification.

---

## QUALITY GATES FOR EVERY INCREMENT

Run what the repository supports:
- `npm run typecheck`
- `npm run build`
- relevant frontend/e2e checks
- existing Python/science tests when changes could affect integration
- static scientific evidence checks
- repository workflows required by the project

Before merge:
- review diff for unrelated changes;
- confirm no scientific-data transformation changed unless explicitly intended;
- confirm dark/light;
- confirm keyboard focus;
- confirm responsive behavior for changed surface;
- confirm no unsupported claim.

After merge:
- confirm GitHub Pages deployment;
- confirm public HTTPS route;
- run/inspect live judge flow where available;
- record merged SHA and continuation checkpoint.

Never leave `main` red.

---

## VISUAL ACCEPTANCE CHECKLIST

The final MVP is ready only when:

1. The evaluator can identify region, active variable, units, timestamp, depth, source/model and observation status without verbal help.
2. Both 3D modes are discoverable and clearly different in purpose.
3. Depth change is visible but does not falsely alter scientific depth.
4. Time controls honestly reflect the genuine number of time steps.
5. Selected Argo/profile identity is consistent across Explorer and comparison.
6. Model versus observation clearly states comparison semantics and bias convention.
7. Color scales are labeled and numeric.
8. Missing/unavailable data is legible.
9. Loading/error/degraded states preserve the rest of the workspace.
10. Light and dark themes are both usable.
11. Keyboard focus is visible.
12. Reduced-motion users do not receive unnecessary camera/zoom/panel animation.
13. Desktop 1366/1440 layout keeps the scientific canvas dominant.
14. Tablet remains operational.
15. Mobile has no horizontal page scroll and controls are reachable.
16. No control advertises functionality that is not implemented.
17. No sample/synthetic/live claim is misleading.
18. Production build and required workflows succeed.

---

## COMMUNICATION FORMAT WHILE EXECUTING

Keep updates concise.

For each increment report:
- **Goal**
- **Confirmed current behavior**
- **Files changed**
- **Scientific capability changed?** yes/no + exact statement
- **Validation**
- **Remaining risk**
- **Next increment**

Do not repeatedly ask for confirmation for safe reversible UI/code changes already within this prompt. Stop for confirmation only before destructive, irreversible, externally risky, privacy-sensitive, financial, or major scope-changing actions.

---

## START NOW

Begin from the latest verified `main`, not a remembered commit.

First:
1. inspect current `main` and open PRs;
2. audit `#/explore` and its existing component hierarchy;
3. compare current behavior against this prompt;
4. implement **Phase 1 — Explorer scientific context + motion/accessibility foundation** as the smallest safe vertical slice;
5. run typecheck/build/tests that are available;
6. inspect the resulting UI at desktop/tablet/mobile if browser tooling is available;
7. report exactly what is implemented versus what remains.

Do not restart the application architecture. Preserve working science, improve the interface around it.
