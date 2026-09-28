# First-open ocean experience

Original requirement: create a distinctive first-open loading screen and preserve a reliable rollback.

## Implementation
The HTML response paints an original SVG contour stack and sounding probe before the React/Cesium bundle downloads. Its status switches from preparing the workspace to opening scientific evidence when React starts. It leaves when the catalog is available, or yields to the existing retry/error screen. There is no fabricated percentage, forced minimum delay, video download, added package or remote font. The illustration is decorative, not measured bathymetry.

Reduced-motion disables the animation and transition. Loading help includes pause/resume and reload. The background application stays inert until startup resolves. Focus moves into the application only when the visitor was using a loading control. Three browser checks cover pre-bundle first paint, failed catalog recovery and a 320px reduced-motion viewport.

## References and boundaries
The supplied SIH26067_build_deploy_no_pitch_prompt.md is reference material. Its emphasis on original implementation, evidence and no unsupported scientific claims is retained. This change does not initiate its separate full competitor-parity programme or create pitch/submission materials.
The four supplied YouTube pages are accessible in the browser; observations and access limits are recorded separately. No competitor artwork, video, code or branded loading sequence is embedded.

## Rollback
- Before the broader redesign: tag ui-before-ocean-journey-20260928, commit d5c33b9. Later unrelated features must be preserved when reverting.
- Before this loading-screen follow-up: tag mvp-before-loading-screen-20260928, commit 5f4cae1 (latest upstream incorporated when work started).
- Revert the merge of PR96 using its first parent to remove this follow-up while keeping the UI/features that preceded that merge. If later changes touch these files, resolve only the overlap and preserve them. Never reset or force-push main.
- A source tag is not a copy of runtime scientific snapshots. The Pages workflow regenerates evidence and can restore the last deployed data if providers fail. Recheck the data contracts and public browser flow after any rollback.

## Recovery after interruption
Read current Git status and fetch origin. Inspect PR96 and its exact head checks before merging or retrying deployment. Once merged, inspect the Pages workflow for that merge, not an older successful run. Build, deploy and verify-public must all succeed. Source and scientific timestamps remain separate from deployment time.
