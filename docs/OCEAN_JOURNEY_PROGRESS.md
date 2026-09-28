# Ocean Journey Redesign — Final State

Updated: 2026-09-28  
Branch: `main`  
Original redesign PR: #93

## State

The redesign is merged into `main`; this is no longer an active feature-branch checkpoint.

Implemented:

- Earth → India → verified study-field orientation;
- replay / skip / reduced-motion handling;
- Geographic View ↔ Water Column 3D navigation;
- repeated field entry;
- responsive desktop/mobile layout;
- wheel, button, keyboard and pinch interaction paths;
- real depth coverage and field overview;
- Analysis Split and Presentation workspaces;
- source-aware Explorer with GLORYS, INCOIS multi-time and INCOIS chlorophyll;
- Argo/Glider/CTD/BGC observation integration;
- camera/depth/render controls.

## Current acceptance rule

Do not use this file to infer deployment health.

For every session, inspect the current `main` HEAD and the current `tests`, `final-mvp` and `deploy-oceantwin-pages` workflows. The Pages workflow must include a passing live Chromium judge flow.

## Rollback

Use Git history / tags and revert commits or merged PRs when necessary. Do not force-push or reset `main` to an old redesign commit.

## Next action

No feature continuation is implied by this file. Remaining work, if any, is determined by current-head CI, explicit user requests and the presentation-machine checklist.
