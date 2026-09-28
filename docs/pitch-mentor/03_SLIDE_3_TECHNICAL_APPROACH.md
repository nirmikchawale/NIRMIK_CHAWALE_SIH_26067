# Slide 3 Mentor Guide — Technical Approach

## Role of this slide

Slide 3 must prove that the idea is technically coherent and has a credible implementation path.

The strongest technical slides do not try to display every service, library or class. They make the end-to-end system understandable:

**Source → ingestion → scientific processing → API → visualization / analysis → user evidence**

---

## What strong SIH winner decks teach us

Winner artifacts repeatedly show a useful distinction:

- a large technology stack is not proof;
- an end-to-end working path is proof.

Projects such as AquaRoot are compelling not because they name React, FastAPI, MongoDB and ML libraries, but because the stack clearly supports a ministry-facing workflow from real data to usable maps / analytics.

Hardware winners similarly connect sensing, control, physical actuation, simulation and telemetry into one visible system.

For OceanTwin, Slide 3 should therefore show **the scientific data journey**, not a logo collage.

---

## Judge question to answer

> **Can this system actually ingest scientific ocean data, preserve its meaning, and turn it into a usable 3D analysis workflow?**

---

## Recommended OceanTwin architecture

Use five horizontal layers.

### Layer 1 — Scientific sources

Show source families, not dozens of files:

**Numerical model**
- Copernicus GLORYS12V1

**Sponsor / operational**
- INCOIS data pathways

**In-situ observations**
- Argo
- Glider
- CTD
- BGC

**Extensible input**
- CF-aware NetCDF
- delimited tabular observations

### Layer 2 — Data adapters and scientific normalization

Core concepts:

- source adapter / registry;
- NetCDF and tabular parsing;
- variable + units mapping;
- coordinate and time normalization;
- QC / metadata checks;
- provenance capture.

This layer is strategically important because it proves OceanTwin is not merely hard-coded visualization.

### Layer 3 — Scientific services

Show only the operations that matter:

- field / depth-slice extraction;
- volume / full-water-column extraction;
- horizontal currents;
- profile services;
- collocation;
- vertical interpolation;
- comparison metrics;
- statistical anomaly diagnostics;
- provenance.

### Layer 4 — API

**FastAPI / REST scientific service**

Optional standards/pathways may be shown as a side branch only if status is accurate:

- OPeNDAP pathway;
- WMS / WCS interoperability;
- CF conventions;
- plugin-style extensibility.

Do not imply completed external certification if only compatibility architecture exists.

### Layer 5 — Browser workspaces

**React + TypeScript + CesiumJS**

Outputs:

- Geographic 3D Explorer
- Water Column 3D
- Depth & Time analytics
- Model vs Observation
- Explainable anomaly screening
- Data Lab / ingestion
- Provenance / QC

---

## Include one real scientific method callout

Architecture alone can feel generic. Add one small box showing a verified analytical method:

### Argo ↔ model diagnostic comparison

**Horizontal:** nearest valid model water cell  
**Vertical:** linear interpolation between adjacent valid model depths  
**No extrapolation**  
**Bias:** Model − Observation

This gives the judge evidence that the team understands scientific matching rather than merely web development.

---

## Include one real evidence callout

Use one concise verified result:

**Default matched Argo profile**
- Float 5907092 · Cycle 13
- 50 matched levels
- 3.851 km spatial separation
- +14.767 h temporal offset
- MAE 0.2254 °C
- RMSE 0.3188 °C

Label:
**Diagnostic consistency — not independent validation**

This turns Slide 3 from architecture art into technical proof.

---

## Required visual logic

The architecture should be readable in this order:

**DATA**  
↓  
**SCIENTIFIC NORMALIZATION**  
↓  
**SERVICES / METHODS**  
↓  
**API**  
↓  
**3D + ANALYSIS WORKSPACES**

Use arrows only for real flow.

Do not create crossing connector spaghetti.

---

## Technology stack placement

Technology names should live beneath the functional layer they enable.

Recommended:

- Python · xarray · NumPy · Pandas → scientific processing
- FastAPI → service layer
- React · TypeScript → application shell
- CesiumJS → geographic 3D
- browser-native scientific renderer / existing water-column implementation → full-depth 3D

Do not use a separate “Tech Stack” cloud unless official template space forces it.

---

## Required SIH26067 coverage signals

Where visually possible, small capability tags should show that the architecture was built with the PS requirements in mind:

- full water column;
- depth slices;
- isosurfaces;
- genuine time exploration;
- multiple observation types;
- NetCDF + delimited text;
- palette / range / scale / opacity / vertical exaggeration;
- REST;
- OPeNDAP pathway;
- CF metadata;
- WMS / WCS pathway;
- plugins / new source adapters.

These should not overwhelm the primary flow.

---

## What not to do

Do not:

- put 20 framework logos in the center;
- show databases/services that do not exist;
- call every adapter “live”;
- call a single timestamp time animation;
- imply a vertical current component if the dataset only provides horizontal u/v;
- show chlorophyll as a 3D depth volume if the source is surface-only;
- present roadmap standards as already production-certified.

---

## Speaker intent

Explain the architecture from left to right in less than one minute.

Suggested logic:

> “Every source enters through an adapter so coordinates, units, variables, QC and provenance are normalized first. Scientific services then expose slices, full-depth fields, currents, profiles and comparisons through a lightweight API. The browser uses those normalized services for geographic 3D, water-column exploration and model-observation analysis. That separation is what lets us add new datasets or sensors without rewriting the entire frontend.”

Then point to the real Argo comparison as proof.

---

## Acceptance criteria

Slide 3 passes only if:

- the architecture can be followed without narration;
- every layer has a clear job;
- data provenance/QC appears before visualization;
- real scientific processing is visible;
- at least one verified metric proves implementation;
- stack names support functions rather than replace them;
- implementation status is not overstated;
- the diagram still works if logos are removed.

---

## Fail-safe rule

If a standards feature or source adapter is not fully verified:

- move it to a clearly marked **interoperability / extension pathway**;
- do not place it in the core completed pipeline;
- never sacrifice scientific truth to make the architecture appear more complete.

---

## Final mentor test

Ask:

> “Could an INCOIS scientist point to this diagram and understand where their dataset enters, what happens to it, and what the browser receives?”

If not, simplify and redraw.
