# Ocean journey redesign checkpoint
Updated: 2026-09-28
Branch: design/ocean-journey-v2
PR: https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL/pull/93
State: final polish and verification; not merged or deployed.
Latest upstream incorporated: d5c33b9 (camera HUD clearance), including workspace modes, compass presets, depth controller, chlorophyll, multi-time, NetCDF and sensor additions.
Completed: Earth/India/field journey, replay/skip/reduced motion, pointer pinch/wheel, field overview and real depth coverage adapted from Magic Patterns. Production build and 53 science/API tests passed. GitHub tests and final-mvp (including 2 new gesture tests) passed on d84fcae.
Final follow-up: repeat field-click fixed and manually verified twice; real depth coverage and keyboard handling added; desktop and 390px phone overlay clearance inspected. Regression now checks two actual canvas entries. Next: push, require passing CI, merge and verify deployment. User may choose the older UI; preserve rollback rather than reset history.
Magic Patterns: https://www.magicpatterns.com/c/wxzzmj3qrpf1froxrz6ao8 . User explicitly approved prototype upload; generation completed artifact 0fc92738-d985-4bbb-a1ac-5dd41a18c92b. Implementation uses selected design concepts with real application data, no prototype dependencies/data copied.
Stitch: DESIGN.md created with installed Stitch design skill; native generation needs signed-in access. Flowstep researched; native design unavailable pending access.
Rollback: pre-redesign main d5c33b9; prior delivered UI 74d1f78a9d029148b34112c56c230598f40a6941 (PR54). Preserve GitHub feature updates when reverting design: revert PR93's merge relative to its first parent rather than resetting main. Do not force-push.
Generated frontend/public and tsbuildinfo remain untracked. They contain runtime evidence and build output, not source changes.

PR93 deployed at 558c156. Public data checks and four browser flows passed, but camera initialization and concurrent software-rendered test timing failed. Follow-up branch fix/ocean-journey-readiness initializes/synchronizes camera height, waits for settled orientation in zoom acceptance, serializes WebGL tests and runs all six before deployment. Rollback remains PR93 merge plus any follow-up fix, preserving other commits.
