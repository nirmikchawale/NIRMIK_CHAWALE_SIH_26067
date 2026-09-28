# Slide 4 Mentor Guide — Feasibility and Viability

## Role of this slide

Slide 4 answers the question most ambitious SIH projects eventually face:

> **Can this actually work outside the presentation?**

For OceanTwin, feasibility is not proved by saying the technologies are open source or that a prototype exists. The slide must show technical feasibility, operational feasibility, deployment feasibility, risk awareness and a realistic path from the verified MVP to broader INCOIS use.

---

## What strong SIH winner decks teach us

The better winner decks do not hide weaknesses. They often become more credible by showing:

- what is already built;
- what remains bounded;
- what could fail;
- how the team mitigates that failure;
- what scale-up requires.

Recent winner material is especially useful here. Strong decks separate **technical**, **economic** and **operational** feasibility instead of treating feasibility as a paragraph.

The important mentor lesson is:

> **Trust increases when risk is named beside mitigation.**

---

## Judge question to answer

> **Why should the sponsor believe this can survive real data, real users, imperfect networks and future expansion?**

---

## Recommended three-column structure

### 1. Technical feasibility

Evidence already available:

- React + TypeScript multi-page frontend;
- CesiumJS geographic 3D;
- FastAPI scientific backend;
- Python scientific stack using xarray / NumPy / Pandas;
- verified GLORYS model cube;
- INCOIS multi-time pathway;
- Argo comparison;
- Glider / CTD / BGC evidence path;
- full-depth water-column renderer;
- scientific controls and anomaly diagnostics;
- provenance / QC views.

Do not write “100% complete.”  
State the verified implementation state.

### 2. Operational feasibility

Show how the product can work in a sponsor environment:

- browser-native user interface;
- API separation from scientific file complexity;
- source-adapter design;
- local / cached verified fallback for demo resilience;
- incremental addition of new variables and sensors;
- bounded data windows today, scalable acquisition/cache services later;
- explicit provenance and scientific guardrails.

### 3. Economic / deployment viability

Do not invent a business valuation.

The useful argument is:

- largely open-source software stack;
- no special desktop scientific software required for the viewer;
- modular backend can run on standard server/cloud infrastructure;
- browser client lowers installation friction;
- data acquisition and compute scale according to operational coverage;
- integration can be phased by source / variable / geographic window.

If infrastructure costs are not measured, say **cost-efficient architecture** rather than quoting unsupported rupee savings.

---

## Risk → mitigation matrix

Use four concise rows.

### Risk 1 — Remote scientific source unavailable

**Impact:** selected live/remote layer may fail during demonstration or operation.  
**Mitigation:** verified cached snapshots + graceful degraded mode + explicit source status.

### Risk 2 — Heavy 3D rendering / WebGL constraints

**Impact:** low-end hardware may struggle with dense rendering.  
**Mitigation:** bounded payloads, point reduction / sampling strategies, depth-slice fallback, focus modes and simpler analytical views.

### Risk 3 — Heterogeneous scientific formats

**Impact:** variable names, units, dimensions, QC conventions and coordinate structures differ.  
**Mitigation:** source adapters, validation, variable mapping, metadata normalization and provenance capture.

### Risk 4 — Model and observation are not perfectly collocated

**Impact:** naive comparison can mislead.  
**Mitigation:** explicit spatial separation, time offset, nearest-valid-cell rule, vertical interpolation method, no extrapolation and diagnostic-not-validation wording.

This matrix is one of the most valuable trust-building elements in the deck.

---

## Fail-safe architecture strip

Show the demo / operational fallback path:

**Remote source works**  
→ use selected source

**Remote source unavailable**  
→ verified cached scientific snapshot

**3D renderer constrained**  
→ depth slice / analytical chart

**Observation unavailable**  
→ state absence; never fabricate marker

**Optional module fails**  
→ core field exploration continues

This demonstrates engineering maturity.

---

## Readiness ladder

A useful winner-inspired pattern is to distinguish current proof from scale-up.

### VERIFIED NOW

- browser application;
- verified model field;
- full-water-column exploration;
- multi-time INCOIS evidence path;
- real observation profiles;
- Argo diagnostic comparison;
- provenance / QC;
- ingestion and interoperability architecture.

### NEXT OPERATIONALIZATION

- broader automated acquisition;
- persistent operational cache;
- additional verified source adapters;
- larger geographic / temporal coverage;
- sponsor-environment deployment testing;
- performance tuning and monitoring.

This is more credible than calling the current MVP “production-ready.”

---

## What not to do

Avoid:

- “zero cost”;
- “works on every device”;
- “real-time” without measured latency/source cadence;
- “fully scalable” without a scaling design;
- fake cloud-cost tables;
- invented INCOIS deployment approval;
- treating a successful local demo as production operations.

---

## Speaker intent

The speaker should sound like an engineering team that understands risk.

Suggested logic:

> “We have already proved the difficult vertical slice: scientific data enters a normalized backend and reaches browser-native geographic and water-column analysis with real observations and provenance. The remaining challenge is operational breadth, not invention of the core workflow. We therefore designed explicit fallbacks for remote-source failure, WebGL constraints and heterogeneous formats, and we separate verified current capability from the scale-up path.”

---

## Acceptance criteria

Slide 4 passes only if:

- current build and future scale-up are visually distinct;
- at least three concrete risks have mitigations;
- feasibility includes technical + operational + deployment dimensions;
- no unsupported cost or production claim is made;
- the slide shows a credible fallback path;
- the judge can see why the MVP can be extended rather than rebuilt.

---

## Fail-safe rule

If a feature is unstable, do not hide that fact behind “future scope.”

Classify it:

- **validated core**;
- **degraded but recoverable**;
- **experimental**;
- **planned**.

Only validated core belongs in the main feasibility proof.

---

## Final mentor test

Ask:

> “If I were the sponsor's technical evaluator, what is the first way I would try to break this system?”

The slide should already contain the answer and mitigation.
