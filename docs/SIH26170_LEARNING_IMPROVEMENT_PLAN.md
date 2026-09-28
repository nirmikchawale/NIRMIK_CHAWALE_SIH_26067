# SIH26067 — Learning from SIH26170: Improvement Plan

## Purpose

SIH26170 is being used as a benchmark for **clarity, judge flow, visible outcomes, explainability and presentation discipline**. This is not a visual copy exercise and does not change OceanTwin's scientific scope.

OceanTwin's main weakness is no longer lack of capability. It is that the product can expose more technical depth than a judge can absorb quickly.

The required narrative is:

**Ocean question → 3D model field → depth → time → real observation → model/observation difference → provenance/trust**

Every major screen should reinforce that chain.

---

## What SIH26170 does better

1. **One immediately understandable problem.**
   A judge quickly understands: detect abnormal components, forecast late drift, combine evidence, explain the decision.

2. **Every module has a visible role.**
   Module A detects, Module B forecasts, fusion decides. There is little ambiguity about why a view exists.

3. **Outputs are outcome-oriented.**
   PASS / MONITOR / REJECT and reason codes make the final result obvious.

4. **Explainability is built into the workflow.**
   The question "why did the system say this?" has a direct visual answer.

5. **The demo can be explained linearly.**
   Input → evidence → model output → fused outcome.

6. **Evaluation metrics are close to the user-visible decision.**
   False negatives, MAE and explainability connect directly to the problem statement.

---

## Where OceanTwin still lacks relative clarity

### A. Too many capabilities compete for attention

OceanTwin contains 3D globe rendering, water-column rendering, time playback, observations, comparison, telemetry, anomalies, ingestion, provenance and interoperability.

**Risk:** the judge sees many impressive tools but misses the single scientific workflow connecting them.

### B. Navigation is feature-oriented rather than question-oriented

Labels such as Telemetry, Data Lab and Science & System are technically valid but do not automatically tell a first-time judge *why to click them*.

### C. The primary outcome is less obvious

OceanTwin should not fabricate a PASS/FAIL ocean verdict. However, it still needs a concise outcome at each step:

- What field is active?
- What changed with depth/time?
- What did the sensor observe?
- How much did model and observation differ?
- What is the evidence source and limitation?

### D. Model–observation comparison needs an executive takeaway

The detailed charts are strong, but a judge should be able to understand the comparison in five seconds before reading charts.

### E. Provenance is powerful but currently feels like supporting information

For this problem, provenance should be part of the main value proposition: real source, real time/depth coordinates, real sensor evidence, explicit limitations.

### F. Advanced controls can obscure the required SIH story

Palette, range, log scale, opacity, isosurface, camera and workspace controls are important sponsor requirements, but they should not dominate the default judge path.

### G. The app has more failure surface than SIH26170

Cesium/WebGL, multiple data sources, multiple renderers and remote evidence increase demonstration risk. The judge path must be more deterministic than the general exploratory workflow.

---

# Sequential implementation plan

## Phase 1 — Judge narrative clarity
**Goal:** make the complete OceanTwin story understandable in under 30 seconds.

Changes:
- Reword primary navigation around scientific questions.
- Reframe the app subtitle around model + observations across space, depth and time.
- Convert the demo guide into six judge questions with explicit evidence to show.
- Rename generic "ocean intelligence" language to an evidence-chain concept.

Acceptance:
- A first-time user can state what OceanTwin does after reading only the header, navigation and six-step demo guide.
- No scientific capability is removed.
- No unsupported claim is added.

**Status: IMPLEMENTED on branch `clarity-pass-sih26170`.**

---

## Phase 2 — Make the first screen answer "why this exists"
**Goal:** match SIH26170's immediate problem comprehension.

Planned:
- Add a compact, dismissible mission strip on Explore:
  **"Understand one ocean state across space, depth and time, then test it against real observations."**
- Show a three-part evidence summary:
  **MODEL FIELD · OBSERVATION · COMPARISON**
- Keep the globe visually dominant.

Acceptance:
- No modal or large marketing hero blocks the science.
- At 1366×768 the actual 3D field remains the dominant visual object.
- Mission strip disappears or collapses in focus/presentation modes.

---

## Phase 3 — Outcome-first comparison
**Goal:** give Model vs Observation the same clarity that SIH26170 gets from its fused decision.

Do **not** introduce PASS/MONITOR/REJECT because that would imply a scientific validation decision OceanTwin cannot support.

Instead add an evidence summary with:
- matched levels;
- spatial separation;
- temporal offset;
- MAE;
- RMSE;
- mean signed bias;
- depth of maximum mismatch;
- concise interpretation:
  **"Diagnostic consistency only — not independent validation."**

Acceptance:
- Judge understands the key result before studying charts.
- Every number is computed from the currently selected verified profile.
- No arbitrary "good/bad" threshold is invented.

---

## Phase 4 — Turn every page into Question → Evidence → Takeaway
**Goal:** make each module's role as explicit as SIH26170's Module A/B/fusion roles.

Page contracts:

### Explore Ocean
Question: What is the ocean state here?
Evidence: real field + space/depth/time.
Takeaway: selected variable, depth, timestamp and source.

### Depth & Time
Question: How does the state change vertically and temporally?
Evidence: depth/time analytics.
Takeaway: strongest observed changes, without causal claims.

### Model vs Observation
Question: Does the numerical field resemble the measured profile?
Evidence: collocation + bias + MAE/RMSE.
Takeaway: quantified diagnostic agreement/disagreement.

### Explain Flags
Question: Why was this point statistically unusual?
Evidence: robust-z inputs and threshold.
Takeaway: unusual relative to available evidence, not proof of an event or sensor failure.

### Ingest Data
Question: Can a new compatible source enter the same workflow?
Evidence: schema validation and temporary Explorer layer.
Takeaway: accepted/rejected fields and exact reason.

### Trust & Architecture
Question: Where did this result come from and how is the platform extended?
Evidence: provenance, QC, adapters and standards.
Takeaway: source-to-visual traceability.

---

## Phase 5 — Progressive disclosure
**Goal:** retain OceanTwin's breadth without overwhelming the judge.

Default view:
- source;
- variable;
- depth;
- time;
- key visualization mode.

Secondary/advanced:
- palette;
- min/max;
- log/linear;
- opacity;
- vertical exaggeration;
- isosurface;
- detailed source metadata.

Acceptance:
- Sponsor-required controls remain available.
- Default judge view is visually simpler.
- Advanced controls require at most one additional click.

---

## Phase 6 — Explainability parity
**Goal:** make "why am I seeing this?" answerable everywhere.

Add consistent evidence language:
- **Source**
- **Transformation**
- **Current selection**
- **Interpretation**
- **Limitation**

Examples:
- Current vector: horizontal `uo/vo`; no fabricated vertical component.
- Chlorophyll: satellite surface product; no fabricated depth axis.
- Argo comparison: nearest valid water cell + vertical interpolation; diagnostic only.
- Anomaly flag: robust statistical departure; not event classification.

Acceptance:
- Every high-impact analytic result has a nearby explanation.
- No page requires the judge to open documentation to understand the basic method.

---

## Phase 7 — Deterministic judge mode
**Goal:** reduce the larger failure surface of OceanTwin.

Create a deliberate six-step state machine for the demo:
1. GLORYS geographic field.
2. GLORYS water column.
3. INCOIS multi-time.
4. real Glider/CTD/BGC profile.
5. Argo model-observation comparison.
6. provenance + extensibility.

Each step should:
- reset incompatible state;
- select known verified data;
- avoid stale selections;
- expose a recovery action if optional evidence is unavailable.

Acceptance:
- Repeated complete judge-flow runs produce the same states.
- Browser refresh returns to a safe baseline.
- No step depends on a hidden prior interaction.

---

## Phase 8 — Final comparison against SIH26170's strongest qualities

Final review questions:

1. Can the problem be understood in 15–30 seconds?
2. Does every page have one obvious job?
3. Is the main result visible before detailed charts?
4. Can the system explain why every important result appears?
5. Does the judge path tell one continuous story?
6. Are metrics connected to the user-visible evidence?
7. Are failure/recovery states obvious?
8. Is the technical depth discoverable without overwhelming the first view?

Target:
- Keep OceanTwin's advantages in real data, 3D, scientific provenance and architecture.
- Match SIH26170's advantages in clarity, linear flow and explainability.
- Do not import SIH26170's PASS/FAIL decision framing where it would be scientifically misleading.
