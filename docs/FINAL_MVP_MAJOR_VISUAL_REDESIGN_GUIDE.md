# OceanTwin 3D — Major Visual Redesign Execution Guide

## Purpose
Turn the feature-rich OceanTwin MVP into a clear, judge-friendly scientific product without deleting working capability or weakening scientific traceability.

Core experience:
**Earth → verified Indian Ocean study region → model field → Water Column 3D → actual Argo observation → model comparison → provenance.**

The UI should feel simple before interaction and reveal depth progressively.

## Non-negotiable science
- One genuine bundled model timestamp only. Never simulate temporal playback.
- Region: verified model window 67–70°E, 12–14°N.
- Water Column 3D remains scalar-only unless scientifically valid vector-volume evidence is added.
- Currents use bundled horizontal u/v only; never invent vertical current.
- Vertical exaggeration changes display geometry only.
- Bias is Model − Observation.
- Model-vs-observation is diagnostic consistency, not independent validation.
- Preserve FastAPI/scientific-core contracts and Streamlit fallback.

## Experience architecture
### Geographic View
Cesium is the geographic orientation layer: Earth, Indian Ocean context, verified study footprint, depth-aware overlays and Argo locations.

### Water Column 3D
The scientific inspection layer: vertical structure, genuine model depth levels, selected depth, opacity and vertical exaggeration.

The two are connected states of one workspace. Switching views must preserve scientific context; returning to Geographic View must preserve the user's Cesium camera.

## Opening sequence
First Explore entry in a browser session:
1. show Earth;
2. fly quickly toward the verified study region;
3. settle on the real dataset footprint;
4. expose the normal workspace;
5. allow explicit or geographic entry into Water Column 3D.

Rules:
- short and orienting, not cinematic;
- interruptible by user input;
- once per session;
- reduced-motion users jump directly to the regional state;
- camera motion never implies temporal/scientific change;
- no fake stars, waves, satellites, particles or fabricated imagery.

## Desktop camera contract
Users must never need repeated tedious dragging for routine navigation.

Always provide:
- Zoom in;
- Zoom out;
- Fit Study Region;
- Earth / Global View;
- Focus selected Argo observation when available.

Wheel zoom and drag/orbit remain available. Camera limits prevent unusable distances. Variable/depth/panel changes must not reset the camera.

## Progressive disclosure
### Always visible
- active variable and units;
- depth;
- verified timestamp;
- source/model;
- active visualization.

### Primary actions
- Variable;
- Depth;
- Observation;
- Geographic View / Water Column;
- Compare.

### Advanced / View settings
- slice vs 3D-field rendering;
- opacity;
- vertical exaggeration;
- other rendering-only controls.

Advanced capability stays available but does not dominate first glance.

## Contextual inspector
The right observation panel is closed by default. It opens after a meaningful Argo selection or explicit observation action, can be closed explicitly or with Escape, and must not move/reset the globe camera.

## Mobile contract
Mobile is map-first, not compressed desktop:
- compact header;
- full scientific viewport;
- labelled quick tray;
- bottom-sheet controls/details;
- floating camera controls;
- explicit Close actions;
- ~44px touch targets;
- no horizontal page overflow at 320px.

## Motion tokens
- instant: 80ms
- fast: 140–160ms
- standard: 200–240ms
- emphasis: 280–340ms
- camera focus: 350–600ms
- first-entry geographic flight: about 650–950ms

Prefer transform and opacity. One dominant motion event at a time. Respect prefers-reduced-motion.

## Execution phases
0. Baseline protection and persistent checkpointing.
1. Camera usability and presets.
2. Connected Geographic ↔ Water Column stage with camera preservation.
3. First-session Earth → study-region orientation and region entry.
4. Explore decluttering/progressive disclosure.
5. Desktop hierarchy, typography and spacing.
6. Tablet/mobile completion.
7. Telemetry, Compare, Anomaly, Data Lab and Science/System refinement.
8. Motion polish and consistency.
9. Final responsive/accessibility/performance/scientific QA.

Phases 1–4 are implemented on the redesign branch; consult the state file for the latest validation status rather than trusting this paragraph if it becomes stale.

## Fail-safe continuation
Authoritative file: `docs/FINAL_MVP_REDESIGN_STATE.md`.

At the start of every session:
1. read this guide;
2. read the original master prompt;
3. read the state file;
4. inspect branch HEAD and PR state;
5. inspect the latest relevant CI;
6. reconcile state file against repository reality;
7. repository evidence wins on disagreement;
8. execute only `NEXT_EXACT_ACTION`.

After every atomic slice:
1. run relevant automated checks;
2. do not stack another risky slice before the current gate is green;
3. update the state file;
4. record the validated commit as rollback point;
5. record the exact next action.

Never infer implementation progress from chat memory when Git evidence exists.

## Atomic-change rule
Each slice should produce one reviewable outcome, for example:
- camera presets;
- camera persistence;
- Earth-to-region intro;
- region-to-water-column entry;
- Explore declutter;
- desktop readability;
- mobile layout.

Do not combine unrelated science, navigation, typography and mobile changes into one unreviewable commit.

## Regression rule
If a slice breaks validated behavior, stop. Repair or revert that slice. The last validated commit remains the rollback point.

## Source-control rule
- work only on the dedicated redesign branch;
- keep PR draft during redesign;
- do not force-push;
- do not remove validated science for aesthetics;
- do not merge to main without explicit user authorization.

## Reference-app rule
External applications may inspire hierarchy, density, spacing, navigation and progressive disclosure. Do not copy branding, protected visual assets, exact layouts or scientific content. If a reference cannot actually be inspected, record that limitation instead of inventing details.

## Definition of final-MVP success
A first-time evaluator can answer without verbal rescue:
- Where am I?
- What variable am I seeing?
- At what depth and verified time?
- Which model/source?
- How do I enter the water column?
- Where is the real observation?
- How does the model compare?
- Where did the evidence come from?

The desired impression is not “many features.” It is “I understand it immediately, then discover how much it can do.”
