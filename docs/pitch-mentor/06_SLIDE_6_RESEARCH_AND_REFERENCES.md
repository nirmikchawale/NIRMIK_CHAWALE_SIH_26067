# Slide 6 Mentor Guide — Research and References

## Role of this slide

Slide 6 is the credibility closure.

It should prove that OceanTwin is grounded in:

- the official problem requirements;
- authoritative scientific data;
- established ocean-data methods;
- interoperability standards;
- real implementation evidence.

This is not a bibliography dump.

---

## What strong SIH winner decks teach us

Research slides are strongest when they answer the judge's natural follow-up questions:

- Is the problem real?
- Are the datasets authoritative?
- Did the team understand the domain?
- Are the methods defensible?
- Which standards matter for adoption?
- Which claims are from the prototype and which are future architecture?

A long list of 20 tiny URLs has low value if the connection between each source and a design decision is unclear.

---

## Judge question to answer

> **What evidence did this team rely on, and can I trace the important claims?**

---

## Recommended four evidence groups

### A. Problem / sponsor requirements

Use the official SIH26067 source.

Purpose:
- validates the requirement families;
- anchors why 3D, observations, ingestion, controls and standards are present.

Display:
**SIH26067 · Ministry of Earth Sciences / INCOIS**

Use the exact official title and URL/QR only after verifying the current official page.

### B. Numerical ocean model

**Copernicus Marine — GLOBAL_MULTIYEAR_PHY_001_030 / GLORYS12V1**

Purpose:
- model temperature / salinity / current evidence;
- real depth coordinates;
- model timestamp and spatial domain.

### C. In-situ observations

**Argo / Ifremer Global Data Repository**

Purpose:
- real profiling-float evidence;
- model–observation diagnostic comparison.

Also list verified observation source families where used:
- glider;
- CTD;
- BGC.

Do not combine sources if the exact provider/licence is not confirmed.

### D. Sponsor / operational source

**INCOIS Live Access / verified INCOIS evidence pathways**

Purpose:
- sponsor-native data alignment;
- genuine multi-time and ocean-colour evidence where implemented.

State exact product/source name if known in the final deck.

---

## Methods box

Use a small “Methods we implemented” panel rather than burying method names in references.

### Model–observation matching

- nearest valid model water cell;
- linear interpolation between adjacent model depths;
- no extrapolation;
- Model − Observation signed bias;
- MAE / RMSE diagnostics.

### Statistical screening

- deterministic robust statistical diagnostics where used;
- do not call it ML unless a trained ML model is actually present.

---

## Standards / interoperability box

The SIH26067 problem explicitly values interoperability and extensibility.

Relevant concepts:

- CF Conventions;
- NetCDF;
- OPeNDAP;
- OGC WMS;
- OGC WCS;
- REST;
- modular source/plugin architecture.

Important distinction:

**implemented / verified** and **supported pathway / planned interoperability** must be visually distinguishable.

Do not mark a standard as “compliant” unless the implementation was actually tested against it.

---

## Winner research acknowledgement

The final slide does not need a list of 250 SIH decks.

However, one small line can truthfully state:

> **Presentation strategy benchmarked against a winner-heavy corpus of public SIH national-winner and Grand-Finale-finalist decks; unverified/internal-only decks excluded from pattern conclusions.**

Do not state a precise “250 verified winning decks” unless the corpus ledger reaches that exact verified status.

---

## Suggested visual layout

### Left 60%

Six authoritative source cards:

1. SIH26067 official PS
2. INCOIS
3. Copernicus Marine
4. Argo / Ifremer
5. CF / NetCDF standards
6. OGC / OPeNDAP interoperability

Each card:
**Source → what it informed**

### Right 40%

Three compact panels:

**METHOD**
model ↔ observation matching

**VALIDATION BOUNDARY**
diagnostic comparison, not independent validation

**REPRODUCIBILITY**
source → variable → time → depth → processing → limitation

---

## Citation discipline

Use readable references.

Prefer:

**[1] Organisation — Product / document — year/version**

rather than raw 90-character URLs in the body.

Place QR code or shortened official links only if they resolve correctly.

For every numerical claim in the final deck, keep an internal evidence ledger containing:

- claim;
- source file;
- exact calculation;
- date/version;
- owner;
- verification status.

---

## Required OceanTwin scientific references

At minimum, the final reference set should cover:

- official SIH26067 problem statement;
- INCOIS data access/product page used;
- Copernicus Marine GLORYS product;
- Argo / Ifremer repository;
- exact glider/CTD/BGC sources used in the build;
- CF Conventions;
- OPeNDAP / OGC references where those pathways are claimed.

Do not invent the unresolved “collection of in-situ data” source. Confirm provider and licence first.

---

## What not to do

Avoid:

- Wikipedia as the main authority;
- blog posts for scientific product definitions when an official source exists;
- tiny unreadable URLs;
- references unrelated to slide claims;
- claiming literature validation that was not performed;
- hiding synthetic / cached / diagnostic boundaries;
- listing standards solely for prestige.

---

## Speaker intent

The close should reinforce trust:

> “Every visual claim in OceanTwin is intended to be traceable from the rendered field back to source, variable, units, location, time, processing and limitation. We use real model and observation evidence, and where the current MVP is bounded we say so explicitly.”

Then transition to the live demo.

---

## Acceptance criteria

Slide 6 passes only if:

- every source is authoritative or clearly first-party;
- sources are grouped by what they informed;
- methods are explicit;
- limitations are visible;
- standards status is accurate;
- URLs / QR codes are tested;
- no unresolved source is presented as confirmed;
- a judge can independently trace the core scientific claims.

---

## Fail-safe rule

If an exact source, licence, version, DOI or product identifier cannot be confirmed before submission:

- remove the precise claim;
- replace with a bounded description;
- add the item to an internal verification backlog;
- never fabricate bibliographic completeness.

---

## Final mentor test

Ask:

> “Could another technical team reproduce our central demonstration from these sources and methods?”

If not, the reference slide needs stronger evidence mapping.
