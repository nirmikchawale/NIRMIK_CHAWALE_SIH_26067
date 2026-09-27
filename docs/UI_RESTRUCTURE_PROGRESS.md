# UI restructure checkpoint

Updated: 2026-09-27
Status: ACTIVE — segment 4 verification
Branch: ui/ocean-workspace-restructure
Baseline / rollback: 4506823
Public URL: https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_PERSONAL/#/explore

## Completed
- Cloned main and inspected six routes, feature registry, rendering controls and deployment workflow.
- Inspected live app in browser: confirmed overlapping center dock/context/basemap overlays and undersized text at 1280x720.
- Reviewed reference screenshots. Preserve reference composition, not mock measurement/timeline claims.
- Created master prompt and curated source research.

## Active
PR #54: https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/pull/54
Implemented horizontal navigation, dedicated canvas, readable controls, evidence rail and four-step demo guide. Merged concurrent main selector fixes (through 2a8a402) into this branch without conflict. Local head e36fed4; final mobile panel layering and guide Escape changes pending commit.

## Verification
- Production build/typecheck passed, including resumed mobile fixes.
- 39 preserved scientific/UI tests passed; 13 backend/API tests passed.
- 226 canonical static science payloads exported; INCOIS snapshot verified: 54 records, 3 times, 3 depths.
- GitHub tests and final-mvp checks passed for 006b594; must verify final pushed head again.
- Desktop 1280x720 and mobile 390x844 visual review performed. Fixed inherited overlay positioning, canvas fit, and mobile backdrop intercepting panel clicks; recheck latter before deployment.
- Local Windows compiler requires GOMAXPROCS=2 and RAYON_NUM_THREADS=1 to avoid memory allocation failures. Production preview served from frontend/dist at port 5173.

## Next exact action
Finish mobile interaction verification, route/theme/demo-guide checks and representative responsive screenshots. Commit final changes, push PR #54, confirm final SHA checks, merge and verify Pages deployment/public URL. Copy master prompt/checkpoint/report to outputs.

## Recovery
Read this file + UI_RESTRUCTURE_MASTER_PROMPT.md; inspect current git diff/status; resume first unfinished action. Check ongoing install/server sessions before starting duplicates. No automatic wakeup is promised after an internet outage or app closure.
