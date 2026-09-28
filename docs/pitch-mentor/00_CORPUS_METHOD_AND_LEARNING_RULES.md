# SIH Winning-Deck Mentor Corpus — Method, Evidence Rules, and Learning Contract

## 1. Purpose

This folder is a mentor/reference system for preparing the six-slide Smart India Hackathon 2026 submission deck for **SIH26067 — OceanTwin 3D**.

It is not a gallery of attractive slides and it is not a claim that every public file carrying the word "winner" is authentic. The goal is to learn repeatable presentation behaviours from the strongest publicly recoverable SIH winners and confirmed Grand Finale finalists, then apply those behaviours to OceanTwin without copying content, visual identity, unsupported claims, or another team's solution.

The working research target is deliberately larger than the final learning set:

- **Discovery universe:** 250+ candidate SIH presentations / presentation-bearing finalist records / team-authored deck links across public web, GitHub, LinkedIn, institutional pages, government archives, SlideShare/Scribd mirrors, and team repositories.
- **Deep-learning set:** only decks with sufficiently strong winner/finalist identity evidence and useful accessible slide content.
- **Priority:** national / Grand Finale winners first, placed or joint winners second, confirmed Grand Finale finalists third.
- **Excluded from learning statistics:** internal-college-only winners, generic SIH templates, "winning strategy" guides, unrelated hackathons, AI-generated mock decks, unverified winner filenames, and duplicates.

The corpus must stay **winner-heavy rather than quantity-heavy**.

---

## 2. Qualification hierarchy

### Tier A — National / Grand Finale Winner

Use as the strongest mentor evidence when all practical identity keys align:

1. SIH year;
2. problem statement ID or exact problem title;
3. team name;
4. institution / team-member linkage;
5. winner evidence from official SIH, government, institution, or clearly attributable first-party team material;
6. actual public presentation or presentation-bearing project repository.

**Learning weight: 4×**

### Tier A2 — Placed / Joint Winner

First, second, third, consolation, or joint-winner status explicitly documented at the Grand Finale.

**Learning weight: 4×**

### Tier B — Confirmed Grand Finale Finalist

A public presentation plus credible evidence that the exact team reached the national Grand Finale.

**Learning weight: 1×**

### Tier C — Discovery Lead Only

Examples:

- file says "winner" but result not corroborated;
- internal hackathon winner only;
- correct PS but wrong team;
- project repository with no national-finalist evidence;
- template or playbook rather than a competition deck.

Tier C items may help discover links, but **must not influence winner-pattern conclusions until promoted**.

---

## 3. Deduplication rules

A deck mirrored across five GitHub repositories is **one deck**, not five observations.

Different versions from the same team may be studied separately only when they are genuinely different stages, for example:

- initial six-slide SIH submission;
- Grand Finale technical deck;
- post-finale public case-study deck.

Even then, the team receives only one primary statistical weight when extracting common winner patterns.

Use the strongest / latest competition-relevant version as the main reference and the earlier version only to learn evolution.

---

## 4. High-value source families already identified

### 4.1 Government / official finalist archives

The **NHIDCL / Ministry of Road Transport & Highways SIH 2017 finalist page** is unusually valuable because it publishes a large finalist table with team, title, institution, final position and, for most rows, a "Presentation" link. It includes placed winners such as Pi-oneer, TechnoMinds and MYSTIC plus a broad Grand Finale cohort.

Reference:
https://www.nhidcl.com/en/smart-india-hackathon-2017-finalist

Learning use:
- durable problem→solution framing patterns;
- how early SIH finalists handled government operational problems;
- contrast with current visual and technical expectations.

Do **not** copy 2017 density or styling into a 2026 deck merely because it is official.

### 4.2 Official winner/result rosters

Official / government result records for 2019 onward are the preferred identity cross-check before trusting a public presentation.

Examples already used during research:
- official SIH / AICTE winner lists;
- official Grand Finale result pages;
- institutional winner announcements that name exact PS/team.

Learning use:
- verify status;
- verify correct team for a PS;
- reject misleading public decks from non-winning teams.

### 4.3 Winner / finalist team repositories

High-value examples include public repositories or first-party pages that expose both the project and the deck:

- **KisanSeva — SIH 2020 winner**: public repository plus Google Slides deck.
- **VoCo — SIH 2022 winner**: public proposal / winning presentation artifacts.
- **KnitKraft — SIH 2023 winner**: public team repository and deck variants.
- **BroCoders — SIH 2023 winning submission**: public repository with deck.
- **Solar Masters — SIH 2024 winner**: public deck / institutional narrative / demo evidence.
- **GritForce / AquaRoot — SIH 2025 winner**: strong end-to-end software artifact.
- **SIH 2025 winner posts and team-authored decks** such as SmartScheduler, Bit-Storm and other official-result-matched teams.

Learning use:
- relate slide claims to what was actually built;
- distinguish "architecture art" from deployable workflow;
- see how winners connect prototype evidence to the pitch.

### 4.4 Curated deck archives

Useful discovery sources include:

- JoysonBeera/sih-winning-presentations
- p3iyanshu/SIH-ppt
- edusatyaki/SIH-Winners-PPT
- Krishna-Techstar/SIH-Resources-and-Winning-PPTs

These contain dozens of PPT/PDF files, but they are **discovery indexes, not authorities**. Their labels must be reconciled with official or first-party evidence. Large overlap exists between repositories.

### 4.5 Deep winner-artifact research

The public repository **harshgounder/sih-2026** contains extensive winner archaeology, official-result extracts and artifact-matching notes. It is useful as a research map, particularly because it explicitly rejects PS-only false positives.

Key lessons supported by its artifact audits:

- arrive at the finale with a functioning vertical slice; use the 36-hour event for hardening, judge-driven changes and validation;
- a working end-to-end ministry workflow matters more than naming many technologies;
- hardware winners pair physical proof with simulation / telemetry;
- real deployment evidence, APKs, hosted routes or reproducible demos are stronger than stack lists;
- generic "AI" is not novelty by itself;
- winner identity should be matched using team + PS + institution/member linkage, not PS number alone;
- public repository polish is inconsistent among winners, so GitHub stars / CI / commit count are not reliable judging proxies.

---

## 5. What is being learned from the corpus

For each qualified deck, extract evidence under these fields.

### Identity

- year;
- PS ID;
- problem title;
- ministry / organisation;
- team;
- institution;
- winner/finalist status;
- deck stage;
- verification source;
- public deck source.

### Slide architecture

- slide count;
- slide order;
- first-slide value proposition;
- problem framing;
- proposed solution;
- novelty;
- system architecture;
- workflow;
- feasibility;
- prototype proof;
- validation / metrics;
- impact;
- scalability;
- references.

### Visual architecture

- dominant visual per slide;
- approximate text density;
- paragraph vs diagram ratio;
- use of cards;
- use of screenshots;
- architecture diagram complexity;
- number of charts;
- hierarchy;
- whitespace;
- source / citation placement;
- use of quantified callouts.

### Judge strategy

- what can be understood in 15 seconds;
- what makes the team different;
- what is already built;
- what evidence reduces sponsor risk;
- what measurable result appears;
- how failure modes are acknowledged;
- how deployment is made credible;
- whether the deck naturally hands off to a live demo.

---

## 6. Cross-deck mentor findings

### Principle 1 — Problem truth before technology

Winning decks tend to explain the operational pain or unmet need before showing a stack. A technology name is not the problem statement.

For OceanTwin:
> The problem is fragmented ocean understanding across model fields, depth, time and in-situ observations — not "we need Cesium."

### Principle 2 — One sentence must carry the full idea

A judge should be able to repeat the solution after one reading.

OceanTwin candidate:
> **OceanTwin 3D unifies numerical ocean-model fields and real in-situ observations in one browser-native 3D workspace across space, depth and time.**

### Principle 3 — Architecture must reveal the user journey

The best technical diagrams make the path from source → processing → evidence → user decision obvious.

For OceanTwin:
> **Ocean sources → adapters / QC → scientific API → 3D water column + observations → comparison / analysis → provenance.**

### Principle 4 — Demonstrated proof beats stack density

A six-slide deck should prioritize:

- actual data sources;
- actual prototype states;
- actual matched profile metrics;
- actual screenshots / rendered field;
- current build status;
- known limitation;

over a cloud of logos.

### Principle 5 — Feasibility includes weaknesses

Strong teams increase trust by naming:

- dependency risk;
- network risk;
- model/data limitation;
- operational constraint;
- mitigation / fallback.

For OceanTwin, this is especially important because browser 3D, remote scientific services and multiple data formats increase failure surface.

### Principle 6 — Impact must name the stakeholder workflow

"Helps scientists" is weak.

Better:
- INCOIS analyst compares a model water column with an in-situ profile;
- researcher explores depth/time anomalies;
- student or policymaker sees interpretable 3D ocean structure with provenance;
- future sensor adapter enters the same normalized workflow.

### Principle 7 — References are part of credibility, not decoration

Winner-quality technical decks make it possible to answer:

- Where did the data come from?
- What is the exact product?
- What method was used?
- Which standard is supported?
- Which metric was calculated?
- What is still not proven?

---

## 7. OceanTwin immutable scientific facts for the six-slide deck

Do not improve, round aggressively, or replace these values unless the underlying verified data change.

### Verified GLORYS / Argo baseline

- Copernicus family: **GLOBAL_MULTIYEAR_PHY_001_030 / GLORYS12V1**.
- Cached model dataset: **cmems_mod_glo_phy_my_0.083deg_P1D-m**, version **202311**.
- Model date: **2 January 2024**.
- Study region: approximately **67–70°E, 12–14°N**.
- Temperature cube: **31 depths × 25 latitudes × 37 longitudes**.
- Depth range: approximately **0.49–454 m**.
- Model variables represented: **thetao, so, uo, vo**.

### Argo comparison evidence

- 26 profiles ingested.
- 2 profiles eligible for the verified comparison window.
- 99 valid matched temperature levels in the evidence set.
- Default demonstration profile:
  - float **5907092**;
  - cycle **13**;
  - descending;
  - **50 matched levels**;
  - spatial separation **3.851 km**;
  - temporal offset **+14.767 h**;
  - MAE **0.2254 °C**;
  - RMSE **0.3188 °C**.
- Horizontal collocation: nearest valid model water cell.
- Vertical matching: linear interpolation between adjacent valid model depths; no extrapolation.
- Bias convention: **Model − Observation**.

### Interpretation guardrail

The Argo comparison is a **diagnostic model–observation consistency comparison**, not automatically independent validation, because reanalysis systems may assimilate observations.

---

## 8. Claims OceanTwin must never make without new evidence

Do not call:

- a depth slice an isosurface;
- timestamp selection "time animation";
- a hard-coded NetCDF file generalized ingestion;
- Argo alone full observation breadth;
- cached data real-time;
- Copernicus data INCOIS data;
- diagnostic comparison independent validation;
- synthetic values real observations;
- statistical anomaly rules AI/ML;
- a prototype operational production deployment;
- one bounded Indian Ocean study window global operational coverage.

If a required proof is missing, **downgrade the wording instead of inventing evidence**.

---

## 9. How to use the six mentor files

Read in sequence:

1. **01_SLIDE_1_TITLE_PAGE.md**
2. **02_SLIDE_2_IDEA_AND_PROPOSED_SOLUTION.md**
3. **03_SLIDE_3_TECHNICAL_APPROACH.md**
4. **04_SLIDE_4_FEASIBILITY_AND_VIABILITY.md**
5. **05_SLIDE_5_IMPACT_AND_BENEFITS.md**
6. **06_SLIDE_6_RESEARCH_AND_REFERENCES.md**

Then execute changes only under:

7. **07_MASTER_PROMPT_FAILSAFE_ROLLBACK.md**

The six slide files define **what the deck should communicate**. The master prompt defines **how to build or revise it safely**.

---

## 10. Research status vocabulary

Use only these statuses:

- **DISCOVERED** — link or candidate located;
- **IDENTITY VERIFIED** — winner/finalist identity corroborated;
- **DECK ACCESSIBLE** — actual slides available;
- **SLIDE-CODED** — slide content / structure extracted;
- **PATTERN INCLUDED** — evidence admitted to mentor conclusions;
- **CREATED** — OceanTwin artifact created;
- **VALIDATED** — artifact checked against requirements;
- **PUBLICLY VERIFIED** — deployed public artifact actually inspected.

Never upgrade a status because it "probably" passed.
