# SIH26067 Full-Compliance Expansion State

PROJECT: OceanTwin 3D
BRANCH: sih26067-full-compliance
BASE: main @ 65c871ac666597f8d5e950b74cb38afc60857c30
TARGET: Close every explicit SIH26067 functional gap without fabricating data or weakening scientific semantics.

## Non-negotiable truth rules
- Never duplicate a field under fake timestamps.
- Never invent Glider/CTD/BGC measurements.
- Never invent vertical current where only u/v exist.
- Keep model-vs-observation framing diagnostic unless independence is demonstrated.
- Every external operational source must expose provider, endpoint/protocol, timestamp/freshness and fallback state.
- The public GitHub Pages build must remain demonstrably usable even when live external services are unavailable.

## Official requirement closure matrix
- [x] Browser-native modern web application
- [x] Temperature / salinity / horizontal currents
- [x] Full water-column scalar rendering
- [x] Depth slices
- [ ] Isosurface extraction
- [ ] Genuine multi-time animation path
- [x] Argo overlay + profile inspection
- [ ] Glider overlay + profile inspection
- [ ] CTD overlay + profile inspection
- [ ] BGC overlay + profile inspection
- [ ] General NetCDF ingestion adapter
- [x] Delimited CSV/JSON validation
- [ ] Validated-ingestion -> temporary visualization layer
- [ ] Dynamic color palette
- [ ] User min/max range
- [ ] Linear/log color scale
- [x] Opacity
- [x] Vertical exaggeration
- [x] REST backend
- [ ] OPeNDAP interoperability path
- [ ] WMS interoperability path
- [ ] WCS interoperability path
- [ ] Plugin-style source/sensor registry
- [ ] CF-convention inspection/validation
- [ ] INCOIS-native operational evidence/service integration
- [ ] Public deployment verification selector regression fixed

## Execution order
1. Public verification + fail-safe baseline.
2. Transfer-function editor + isosurface.
3. INCOIS service registry + genuine time-capable operational source.
4. Observation plugin registry + Glider/CTD/BGC operational overlays.
5. NetCDF/ASCII/CSV/JSON ingestion adapters + temporary overlay.
6. OPeNDAP/WMS/WCS/CF interoperability console.
7. Operational breadth + provenance UX.
8. Tests, docs, final public deployment and live verification.

STATUS: ACTIVE
NEXT_EXACT_ACTION: Fix public browser selector regression and add transfer-function contracts.
