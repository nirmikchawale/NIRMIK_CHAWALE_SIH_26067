# OceanTwin SIH26067 — Optimized Fail-Safe and Rollback Master Prompt

## 0. Mission

You are improving the six-slide Smart India Hackathon 2026 submission for **SIH26067 / OceanTwin 3D** using a winner-heavy corpus of public SIH national-winner and confirmed Grand Finale-finalist presentations as mentor/reference material.

Your job is **not** to imitate another team.

Your job is to:

1. extract repeatable winning communication patterns;
2. apply them to OceanTwin's real strengths;
3. preserve scientific truth;
4. improve judge comprehension;
5. avoid regressions;
6. make every change reversible;
7. verify before claiming completion.

Operate in the sequence:

**UNDERSTAND → EVIDENCE → PLAN → CHANGE → VALIDATE → COMPARE → COMMIT → DEPLOY ONLY IF AUTHORIZED → VERIFY**

---

# I. Authority hierarchy

When sources disagree, obey this order:

1. **Current official SIH 2026 template / guidelines**
2. **Exact SIH26067 problem statement**
3. **Verified OceanTwin repository and scientific evidence**
4. **Authoritative data-provider documentation**
5. **Verified SIH winner / finalist deck patterns**
6. **Institutional / first-party team accounts**
7. **Community guides / mirrors**
8. **Aesthetic preference**

Never violate an official requirement because a past winner used a different format.

---

# II. Immutable scientific truth

Do not alter verified evidence merely to make a stronger pitch.

## Verified baseline

- GLORYS / Copernicus model date: 2 January 2024.
- Study region: approximately 67–70°E, 12–14°N.
- Temperature cube: 31 depths × 25 latitudes × 37 longitudes.
- Approximate depth range: 0.49–454 m.
- Model variables represented: temperature, salinity, eastward and northward current components.
- Argo profiles ingested: 26.
- Eligible comparison profiles: 2.
- Valid matched temperature levels: 99.
- Default profile: float 5907092, cycle 13, descending.
- Default matched levels: 50.
- Spatial separation: 3.851 km.
- Temporal offset: +14.767 h.
- MAE: 0.2254 °C.
- RMSE: 0.3188 °C.
- Horizontal matching: nearest valid model water cell.
- Vertical matching: linear interpolation between adjacent valid model depths.
- No extrapolation.
- Bias: Model − Observation.

## Mandatory interpretation boundary

The comparison is a **diagnostic model–observation consistency comparison**, not automatically independent validation.

---

# III. Forbidden claim transformations

Never convert:

- cached → real-time;
- multi-time → forecasting;
- timestamp selection → animation unless playback exists;
- depth slice → isosurface;
- Copernicus → INCOIS;
- diagnostic comparison → independent validation;
- statistical rule → AI/ML;
- experimental adapter → production integration;
- bounded regional evidence → global operational coverage;
- architecture pathway → implemented certification;
- internal winner → national winner;
- finalist → winner.

When evidence is weaker than desired, weaken the sentence — never strengthen the evidence.

---

# IV. Winner-corpus intake gate

Before learning from a deck, classify it.

## Tier A

National / Grand Finale winner with public deck and corroborated identity.

## Tier A2

Placed / joint winner with corroborated status.

## Tier B

Confirmed Grand Finale finalist with public deck.

## Tier C

Anything else.

Only A, A2 and B may inform “winning pattern” conclusions.

For every deck record:

- year;
- PS ID;
- team;
- institution;
- ministry;
- status;
- deck link;
- result-verification link;
- stage;
- notes;
- duplicate group.

Deduplicate before counting.

---

# V. Six-slide build order

Do not design all six slides simultaneously.

Proceed sequentially.

## Slide 1 — Title

Goal:
**recognition**

Judge must understand:
- official PS;
- OceanTwin name;
- model + observation;
- space + depth + time.

Gate:
- official fields exact;
- one-line value proposition;
- one dominant product visual;
- no technology clutter.

## Slide 2 — Proposed Solution

Goal:
**comprehension**

Judge must understand:
**fragmented ocean data → one explainable workspace**

Gate:
- clear gap;
- coherent solution;
- 3–4 concrete differentiators;
- proof of current build;
- roadmap separated.

## Slide 3 — Technical Approach

Goal:
**credibility**

Required flow:
**sources → adapters/QC → scientific services → API → 3D/analysis**

Gate:
- one real method;
- one real metric;
- no fake stack components;
- standards status accurate.

## Slide 4 — Feasibility

Goal:
**trust**

Required:
- technical feasibility;
- operational feasibility;
- deployment/economic viability;
- risk → mitigation;
- fail-safe path;
- current vs next.

Gate:
- at least three real risks;
- no invented costs;
- no production claim.

## Slide 5 — Impact

Goal:
**sponsor value**

Required:
- stakeholder;
- current friction;
- OceanTwin action;
- benefit;
- verified prototype evidence;
- realistic scaling pathway.

Gate:
- no fake percentage savings;
- no generic “helps society” language.

## Slide 6 — Research / References

Goal:
**traceability**

Required:
- official PS;
- INCOIS;
- Copernicus;
- Argo/Ifremer;
- exact observation sources;
- methods;
- relevant standards;
- limitations.

Gate:
- every key claim traceable;
- links tested;
- unresolved source removed or caveated.

---

# VI. Visual system rules

Use one coherent visual language across all slides.

## Hierarchy

Each slide must contain:

1. one dominant takeaway;
2. one primary diagram / visual;
3. supporting evidence;
4. minimal source / status annotation.

## Density

Prefer:
- diagrams;
- data cards;
- short labels;
- quantified evidence;
- real prototype screenshots.

Avoid:
- paragraphs;
- logo clouds;
- decorative icons without information;
- tiny architecture text;
- more than one major story per slide.

## Consistency

Keep:
- same typography;
- same grid;
- same data-color semantics;
- same status language;
- same card radius / stroke conventions;
- same source/citation style.

Do not redesign each slide independently.

---

# VII. Implementation protocol

## Step 1 — Inspect

Before modifying any file:

- inspect current main;
- inspect relevant existing deck/artifact;
- inspect official template constraint;
- inspect current branch divergence.

Do not assume previous chat state equals current repository state.

## Step 2 — Create a rollback point

For repository work:

- create a new branch from current main;
- record base commit SHA;
- never start a major change on a stale branch;
- never overwrite main directly for exploratory design work.

## Step 3 — Make one logical change

Examples:

- Slide 1 only;
- Slide 2 only;
- mentor docs only;
- citation cleanup only.

Do not bundle unrelated UI, scientific and PPT changes into one commit.

## Step 4 — Validate locally / structurally

Check:

- official headings preserved;
- slide count;
- file opens;
- text fits;
- no clipping;
- no overlap;
- no missing asset;
- citation readability;
- scientific values exact.

## Step 5 — Visual validation

Render slides to images where possible.

Inspect at:
- full-screen;
- projector-like scale;
- thumbnail / slide sorter scale.

If the slide only works when zoomed in, it fails.

## Step 6 — Scientific validation

For every number:

- identify source;
- reproduce calculation or locate verified source record;
- confirm unit;
- confirm sign convention;
- confirm time/depth context.

## Step 7 — Commit

Use a specific commit message.

Examples:
- “pitch: simplify Slide 2 problem-to-solution flow”
- “pitch: add verified Argo metrics to Slide 3”
- “docs: add Slide 4 feasibility mentor guide”

## Step 8 — Compare against base

Inspect changed files.

Reject:
- accidental deletion;
- unrelated formatting churn;
- dependency drift;
- scientific-data changes;
- generated binaries that should not be tracked.

---

# VIII. Validation gates

A change cannot move forward until the previous gate passes.

## Gate A — Content truth

PASS only if:
- all claims are supported;
- current vs future is clear;
- winner references are qualified.

## Gate B — Official template

PASS only if:
- six-slide structure is respected;
- required headings / fields remain;
- submission format constraints are satisfied.

## Gate C — Visual quality

PASS only if:
- slide is readable at normal projection;
- hierarchy is obvious;
- no clipping / overflow;
- diagrams are interpretable.

## Gate D — Narrative continuity

PASS only if the six slides form:

**Identity → Idea → How → Can it work? → Why it matters → Why trust it?**

## Gate E — Demo alignment

PASS only if every major prototype claim in the PPT can be demonstrated or explicitly identified as future architecture.

---

# IX. Fail-safe modes

## Scientific source unavailable

Use:
**verified cached scientific evidence**

Show:
**degraded source status**

Never:
fabricate data.

## 3D demo failure

Fallback:
- depth slice;
- analytical profile;
- comparison chart;
- verified screenshot / recording if allowed by judging rules.

## Observation layer unavailable

State:
**observation unavailable**

Never:
place a synthetic observation marker without explicit synthetic labeling.

## Remote deployment unavailable

Fallback:
- local application;
- verified static export where available;
- emergency scientific reference build.

## Presentation asset failure

Fallback:
- vector diagram;
- verified screenshot;
- text-first simplified layout.

Do not delay the entire deck for one decorative asset.

---

# X. Rollback strategy

## Level 0 — No-op

If evidence is insufficient, make no change.

“Not enough evidence” is preferable to a polished false statement.

## Level 1 — File rollback

If one file regresses:

- restore only that file from the last known-good commit;
- retain unrelated validated changes.

## Level 2 — Commit rollback

If one logical slice fails validation:

- revert that commit;
- preserve earlier passing commits.

## Level 3 — Branch reset

If the branch becomes structurally confused:

- abandon the branch;
- create a new branch from current main;
- cherry-pick only independently validated commits.

Do not spend hours repairing a polluted experimental branch.

## Level 4 — Deployment rollback

If a merged/deployed version regresses the public app:

- identify last publicly verified commit;
- revert to that commit;
- verify deployment;
- only then debug the failed change on a separate branch.

## Level 5 — Scientific rollback

If a new dataset or calculation conflicts with the verified baseline:

- quarantine the new evidence;
- restore the last verified values;
- investigate provenance / units / coordinate/time assumptions;
- do not silently “average” conflicting results.

---

# XI. Destructive-action policy

Never without explicit approval:

- delete scientific evidence;
- delete provenance artifacts;
- rewrite Git history;
- force-push;
- remove working fallback paths;
- replace the public deployment with an unvalidated branch;
- overwrite a final PPT/PDF without keeping a recoverable prior version.

For cleanup decisions, verify irrelevance twice.

---

# XII. Status vocabulary

Use exact statuses:

- **RESEARCHED**
- **DISCOVERED**
- **IDENTITY VERIFIED**
- **DECK ACCESSIBLE**
- **SLIDE-CODED**
- **PLANNED**
- **CREATED**
- **IMPLEMENTED**
- **VALIDATED**
- **DEPLOYED**
- **PUBLICLY VERIFIED**
- **DEGRADED**
- **ROLLED BACK**

Never say “done” when the actual status is only “created.”

---

# XIII. Completion criteria

The six-slide mentor/build task is complete only when:

1. all six slides obey the official template;
2. every major claim is evidence-backed;
3. Slide 2 explains OceanTwin in under 30 seconds;
4. Slide 3 proves an end-to-end technical path;
5. Slide 4 acknowledges and mitigates real risks;
6. Slide 5 maps features to stakeholder outcomes;
7. Slide 6 makes core scientific claims traceable;
8. current vs future capability is explicit;
9. winner research influences structure, not copied content;
10. the presentation and live prototype tell the same story;
11. a rollback point exists;
12. validation is recorded before deployment.

---

# XIV. Execution command

When this prompt is invoked, do not begin by redesigning.

First produce a short state table:

**Artifact | Current status | Evidence | Risk | Next action**

Then execute only the highest-value unblocked change.

After each logical slice:

**inspect → validate → compare → commit → report status**

Continue sequentially until the requested scope is complete or a validation gate fails.

If a gate fails:

**stop expansion → isolate failure → rollback smallest affected scope → re-validate → continue only when stable.**
