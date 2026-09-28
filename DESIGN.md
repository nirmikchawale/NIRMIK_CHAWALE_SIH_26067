# Design System: OceanTwin / Ocean intelligence

## 1. Visual Theme & Atmosphere
A calm scientific observatory, grounded in the Arabian Sea. Density 6, variance 4, motion 5. The ocean is the primary visual. An asymmetric controls/canvas/inspector layout helps visitors move from geography to evidence. Preserve Explorer and Analysis workspace modes and exclusive inspectors; the six-step Guided demo in the header replaces the former Presentation mode. Human language explains the science without invented stories or impact claims.

## 2. Color Palette & Roles
- Deep Water (#0D1C26): primary dark canvas.
- Ocean Slate (#142833): panels and drawers.
- Raised Slate (#1E3542): selected surfaces.
- Chart Boundary (#36505F): structural lines.
- Warm Paper (#F2EEE4): primary dark-mode text.
- Mist (#ACBFCA): secondary explanations.
- Cool Blue (#A9D5E5): single interface accent, active states and focus.
- Light mode: Paper (#F7F5EF), Pale Stone (#EAE7DF), Ink (#182B43), deep teal accent (#076B80).
Pinterest's Cool Blue and coastal blue/cream references inform this custom adaptation. Scientific scalar palettes, observation colours and QC statuses retain their own data semantics; never recolour measurements to match branding.

## 3. Typography Rules
Use the existing locally available Segoe UI sans-serif stack; no font-loading dependency during a judge demonstration. Headings 24–30px, medium weight and tight tracking; controls/body 14px with 1.5 line-height. Tabular numerals for readings; existing monospace stack for coordinates and timestamps. Narrative headings use the same sans-serif family as the dashboard. Avoid decorative serif, giant slogans and dense uppercase paragraphs.

## 4. Component Stylings
Use dividers for field notes rather than another grid of cards. One primary field-entry action, secondary map-inspection toggle. Flat surfaces, 1px boundaries, restrained 6–10px corner radii. Visible focus rings; new controls target 44px touch height. Loading/error/empty states must state the real condition. No fake online badges. Explanatory disclosure opens with native keyboard behavior. Existing inspector controls govern narrow-screen access.

## 5. Layout Principles
Keep the latest canvas-first layout and its clearance rules. New journey controls occupy a reserved strip; never cover existing imagery, depth, source, zoom or instrument controls. Drawers remain exclusive. On mobile, use one canvas with accessible drawers rather than squeezed side columns. Verify at 390px, 1280px and wide desktop. No horizontal page overflow. Keep all six routes and actual source capability gating.

## 6. Motion & Interaction
Earth → India → field uses the actual Cesium camera, approximately six seconds total, once per session; replay and skip remain available. Starting the Guided demo replays orientation. Any camera interaction interrupts the journey; reduced motion lands directly at the field. No autonomous measurement/time animation. Use opacity/transform for UI transitions, clean up animations on unmount, avoid perpetual decorative activity competing with scientific motion. Pinch, wheel, keyboard and visible buttons operate the same bounded camera/3D zoom state. Field-click entry is repeatable; map inspection and observation markers stay accessible. Chlorophyll remains surface-only.

## 7. Anti-Patterns
No neon glows, gradient slogans, fake metrics, invented forecasts, generic avatar testimonials, decorative loading loops, overlapping HUDs, hidden zoom, or replacement mock renderers. No claim of independent validation. Design-service output is a visual reference until its controls, accessibility, performance and real-data bindings are verified.

## Stitch generation brief
Generate desktop and mobile OceanTwin Explorer screens following this document and docs/OCEAN_JOURNEY_MASTER_PROMPT.md. Use the current deployed app as baseline. Show the field overview, context inspector closed/open, journey stages and surface-only source state. Preserve actual product labels, source switches and measurement semantics. Export a reviewable screen and HTML; do not replace the Cesium/scientific data layer.
