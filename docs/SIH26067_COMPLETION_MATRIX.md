# SIH26067 Completion Matrix

Purpose: convert the final prototype from a bounded scientific demonstrator into a sponsor-aligned SIH26067 platform without fabricating evidence.

Status vocabulary:
- STRONG: implemented, demonstrable, tested, and truthfully evidenced.
- PARTIAL: working subset exists but official requirement breadth is not fully demonstrated.
- BLOCKED: requires genuine external evidence/protocol compliance not yet connected.

## Official completion targets

| Requirement | Acceptance criterion | Current baseline | Target |
|---|---|---|---|
| Browser-native 3D | Public browser app, no specialist client | STRONG | STRONG |
| Temperature | Real depth-aware model field | STRONG | STRONG |
| Salinity | Real depth-aware model field | STRONG | STRONG |
| Currents | Real horizontal vectors with depth | STRONG | STRONG |
| Depth slices | Interactive genuine depth navigation | STRONG | STRONG |
| Isosurface extraction | User threshold creates geometry from genuine scalar field | MISSING | STRONG |
| Time animation | >=2 genuine timestamps with selectable/animated state | BLOCKED: one bundled time | STRONG |
| Dynamic colorbar | palette + manual/auto min/max + linear/log where valid | MISSING | STRONG |
| Opacity | interactive scalar opacity | STRONG | STRONG |
| Vertical exaggeration | interactive visual-only exaggeration | STRONG | STRONG |
| Argo overlay | geospatial marker + profile chart + timestamp | STRONG | STRONG |
| Glider overlay | genuine sourced glider profile + provenance | MISSING | STRONG |
| CTD overlay | genuine sourced CTD profile + provenance | MISSING | STRONG |
| BGC overlay | genuine sourced biogeochemical profile + provenance | MISSING | STRONG |
| NetCDF ingestion | generic CF-aware NetCDF adapter, not only one fixed file | PARTIAL | STRONG |
| Delimited ingestion | CSV/ASCII parser feeding temporary visual layer | PARTIAL | STRONG |
| New source modularity | source adapter registry/config contract | MISSING | STRONG |
| New variable modularity | catalog-driven rendering without hard-coded UI rewrite | PARTIAL | STRONG |
| REST backend | documented API | STRONG | STRONG |
| OPeNDAP interoperability | real adapter/client to standards endpoint with validation | MISSING | STRONG |
| OGC WMS/WCS | real standards adapter with GetCapabilities support | MISSING | STRONG |
| CF conventions | validate coordinate/units/positive/dependency metadata | PARTIAL | STRONG |
| Plugin design | sensor/model plugin contract + discoverable registry | MISSING | STRONG |
| INCOIS-native pathway | at least one genuine INCOIS-hosted source/adapter demonstrated | PARTIAL | STRONG |
| Operational breadth | multi-source, multi-time, inspectable workflow | PARTIAL | STRONG |
| Public outreach | judge/non-specialist explainability | STRONG | STRONG |

## Non-negotiable truth rules

1. Never duplicate one field under fake timestamps.
2. Never invent a vertical current component.
3. Never label reanalysis as live observation.
4. Never claim OPeNDAP/WMS/WCS compliance from a placeholder endpoint.
5. Never fabricate Glider/CTD/BGC measurements.
6. Every external sample must carry provider, source URL/identifier, acquisition date, variable units, time, coordinates, and provenance.
7. If a public service is unavailable, fail closed and keep the previous validated baseline deployable.

## Delivery phases

0. Protect baseline; checkpoint branch; repair public-deployment acceptance test.
1. Dynamic color system and real isosurface extraction.
2. Generic data/source plugin architecture and CF-aware ingestion contracts.
3. Genuine multi-time model evidence and time animation.
4. Genuine Glider/CTD/BGC observation adapters and overlays.
5. INCOIS-native data/service pathway.
6. OPeNDAP + OGC WMS/WCS interoperability adapters.
7. Data Lab -> temporary visualization integration.
8. Performance, accessibility, responsive and failure-mode audit.
9. Public deployment verification and final SIH requirement contract.

Each phase must pass tests + final-mvp + public deployment verification before the next phase can be marked STRONG.
