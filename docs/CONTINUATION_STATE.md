# OceanTwin Continuation State

- Last fully verified baseline before current work: `5441ad1b19ae2ef419a614d7f1d3348eb010f1a8`
- Public MVP: https://nirmikchawale.github.io/NIRMIK_CHAWALE_SIH_26067/
- Active branch: `feature/dual-3d-ux-v2`
- Active feature: Feature 3 UX v2 — prominent dual 3D visualization + independent smooth zoom
- Current status: implementation in progress; not yet merged or production-verified
- Do not start Feature 4 until Feature 3 UX v2 is green on the exact merged SHA.

## Recovery checklist
1. Fetch latest main and active branch.
2. Compare active branch against baseline above.
3. Run/inspect branch tests.
4. Open/refresh PR only after branch regression gate passes.
5. Require tests + final-mvp before merge.
6. After merge, require tests + final-mvp + deploy-oceantwin-pages on the exact merge SHA.
7. Confirm verify-public HTTPS step and live Chromium judge-flow pass.
8. Update this file with the new verified SHA and next feature.
