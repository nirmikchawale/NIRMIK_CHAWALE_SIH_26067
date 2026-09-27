# SIH26067 Full Compliance Upgrade State

PROJECT: OceanTwin 3D
BRANCH: sih26067-full-compliance-upgrade
BASE_MAIN: 0da2ebb49297811ce5a75b7f6bd19ca03aad44f2
STATUS: ACTIVE
MERGE_POLICY: Never merge until every active slice is green and final public verification is green.

## Objective
Raise every explicit SIH26067 requirement from partial/missing to demonstrable working support without synthetic scientific evidence or misleading claims.

## Sponsor requirements locked
1. Browser-native 3D volumetric ocean rendering.
2. Temperature, salinity and current fields through the water column.
3. Depth slices.
4. Isosurface extraction.
5. Genuine time-step animation when genuine multi-time evidence is present.
6. Geospatial Argo, Glider, CTD and BGC overlays.
7. Clickable depth-vs-variable profiles with timestamps.
8. Automated NetCDF ingestion.
9. Delimited-text ingestion.
10. Modular variable/source adapters.
11. Dynamic colorbar: palette, min/max, linear/log scale.
12. Layer opacity.
13. Vertical exaggeration.
14. Modern web frontend plus REST/OPeNDAP-capable backend.
15. Plugin-style future sensor/model extension.
16. CF-aware NetCDF handling.
17. OGC WMS/WCS interoperability surface.
18. INCOIS-native evidence/service integration.
19. Operational/public-outreach usability.

## Non-negotiable scientific guardrails
- No duplicated/fabricated timestamps.
- No fabricated Glider/CTD/BGC measurements.
- No invented vertical current.
- Every external-source sample must carry provider, endpoint/DOI, retrieval/source metadata and variable units.
- Display transformations must never mutate scientific values.
- Model-observation comparison remains diagnostic unless independent evidence supports stronger wording.

## Execution slices
S0. Repair public browser verification selector and checkpoint deployment.
S1. Dynamic colorbar editor + scale/palette/range applied to all scalar renderers.
S2. Isosurface mode over genuine scalar cube.
S3. Generic observation plugin contract + Argo/Glider/CTD/BGC UI layer model.
S4. INCOIS ERDDAP/OPeNDAP source adapter + sponsor-native source registry.
S5. NetCDF + CSV/TSV ingestion pipeline and Data Lab -> Explore integration.
S6. OGC/CF interoperability endpoints and machine-readable capabilities.
S7. Genuine multi-time model adapter and animation only after verified multi-time source exists.
S8. Operational breadth: additional genuine observation/source packs, chlorophyll/BGC, source switching.
S9. Full responsive/browser/science regression + public deployment verification.

## Recovery rule
At any restart: read this file, inspect branch HEAD, PR state and exact CI runs. Repository evidence overrides stale chat memory. Continue only the first unfinished slice.

CURRENT_SLICE: S3 — generic multi-sensor observation integration
LAST_GREEN_SHA: 1a85541dc2724a717b862915f503b8e36e85166c
LAST_COMPLETED_ACTION: Validated generic Glider/CTD/BGC/Argo sensor plugin registry and Data Lab -> 3D Explorer profile path. tests #566 PASS; final-mvp #231 PASS.\nNEXT_EXACT_ACTION: merge validated sensor-plugin slice, verify public deployment, then add genuine provider-sourced Glider/BGC/CTD evidence packs and real standards capability probes.
