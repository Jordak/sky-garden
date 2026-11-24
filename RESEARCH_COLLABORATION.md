# Sky Garden — Research Collaboration & Pilot Evaluation Brief

Sky Garden is an experimental **Zooniverse Custom Front End** exploring a falsifiable volunteer-motivation hypothesis for **Galaxy Zoo**: paired with real astronomical workflows, creative self-expression and sky curation can deepen repeat classification and volunteer return rates **without** adding speed pressure, streak multipliers, or answer-biased rewards.

> **Status:** Early functional browser prototype (`Sky Garden v0.1`, MIT-licensed) seeking an institutional Galaxy Zoo / astronomy research team collaborator. Live offline demo: **[https://jordak.github.io/sky-garden/](https://jordak.github.io/sky-garden/)** · Source: **[github.com/Jordak/sky-garden](https://github.com/Jordak/sky-garden)**

---

## 1. Collaboration Role Split (Mapping to Zooniverse Launch Requirements)

Sky Garden is built specifically to serve as an alternate front end for an **existing research team's Zooniverse workflow** rather than a standalone science study:

| Zooniverse Requirement | Partner Research Team Owns | Sky Garden Front End Provides |
| :--- | :--- | :--- |
| **Affiliation & Oversight** | Institutional sponsorship, IRB/ethics oversight, scientific stewardship of volunteer effort | Clean separation between research workflow UI and cozy sky studio; zero behavioral manipulation or dark patterns |
| **Research Team Capacity** | Subject sets, retirement rules, consensus aggregation, and downstream science analysis on Panoptes JSON | Standard Panoptes classification schema (`annotations: [{ task, value }]`) tagged cleanly with `metadata.client` |
| **Track Record & Dissemination** | Scientific publications, survey data releases, conference talks, and science updates to volunteers | In-app `SURVEY SOURCE ↗`, `GALAXY ZOO TALK ↗` ("Done & Talk"), and institutional credit on exported observatory postcards |
| **Identified End Users** | Astronomy researchers, survey pipelines, and ML active-learning consumers (e.g., *Zoobot*) | Explicit per-workflow AI/ML disclosure badges aligned with the [Zooniverse AI Ethics Framework](https://www.zooniverse.org/about/ai-ethics) |
| **Appropriate Methodology** | Morphology decision tree design (`workflow_id`), calibration gold sets, and validation criteria | Panoptes-compatible branching engine, zero pre-selected defaults, terminal-step submit lock, and completely ungated zoom/pan/contrast tools |

---

## 2. Scientific Data Quality Guardrails Already Implemented

Every mechanic in the prototype was checked against citizen-science bias risks:

1. **Zero Gating on Optical Inspection Tools:** `1×`/`2×`/`4×` zoom, clamped drag-panning, Negative Plate (`Invert`), real-time brightness/contrast stretch (`Standard`, `Faint Shells`, `Bright Core`), and dynamic `arcmin` reticle scaling are available from second zero—never sold or locked behind progression.
2. **Flat, Label-Agnostic Progression:** Completing a unique subject awards a flat `+3 ✦ Stardust` whether you classify a grand-design barred spiral, a smooth elliptical, or a single-step `Star or Artifact`. There are **zero** countdown timers, **zero** combo streaks, **zero** accuracy quizzes mid-workflow, and **zero** duplicate-submission farming rewards.
3. **Strict Client-Side Immutability of Scientific Records:** Source cutout pixels, verified `ICRS (J2000)` coordinates, and omitted/unverified astrometry (`unavailable` / `unverified`) live strictly on immutable `SourceGalaxy` records. Player transforms (`x`, `y`, `scale`, `rotationDeg`, `screen` blending) mutate only separate `PlacedObject` references in browser `localStorage`.
4. **AI Ethics & ML Disclosure:** Surfacing explicit workflow ML provenance (`OFFLINE CALIBRATION · NO ML IN LOOP` vs. future ML-prioritized workflows), Talk & survey provenance links, and instant client-side JSON export / local wipe controls.

---

## 3. Proposed Custom Front End Pilot & Evaluation Plan

If paired with a live or sandboxed **Galaxy Zoo** workflow through Zooniverse's Custom Front End infrastructure:

### Routing & Instrumentation
- Serve identical Panoptes subjects and the exact same active workflow decision tree as standard `zooniverse.org/projects/zookeeper/galaxy-zoo`.
- Submit standard Panoptes classification JSON tagged with `metadata.client = "sky-garden-cfe"` so researchers can compare cohorts directly inside standard data exports (with clean opt-in / A-B cohort assignment).

### Evaluation Metrics (Quality Non-Inferiority + Retention)
1. **Classification Quality & Agreement (Primary Safety Check):**
   - Per-subject consensus distribution divergence vs. control Zooniverse classifications on the same subject batch.
   - Branching path entropy & short-path selection rate (verifying volunteers do not rush `Star or Artifact` or shallow branches for flat Stardust rewards).
   - Inter-rater agreement with expert gold-standard plates (e.g., ellipticals, edge-on bulges, bars, mergers, artifacts).
2. **Dwell Time & Optical Tool Usage:**
   - Time spent per classification (`finished_at - started_at`) vs. standard UI—testing whether unlocking a subject for one's observatory increases thoughtful inspection rather than rushing.
3. **Volunteer Engagement & Return Rate:**
   - Classifications per session, voluntary 7-day / 30-day return rate among newly onboarded vs. veteran volunteers, and click-through rate to Galaxy Zoo Talk boards.

---

## 4. Technical Architecture Readiness & Minimal Live Integration Delta

- **Already Decoupled:** The UI runs on a generic `PanoptesWorkflow` single-choice tree engine ([`src/data/galaxyZooWorkflow.ts`](./src/data/galaxyZooWorkflow.ts)), includes a read-only Panoptes adapter ([`src/services/panoptesWorkflowAdapter.ts`](./src/services/panoptesWorkflowAdapter.ts)) supporting `/api/workflows/:id` + `/api/field_guides`, and already models live submission records via `FutureContributionRecord` (`idempotencyKey`, `projectSlug`, `workflowId`, `workflowVersion`, `subjectId`, `annotations`) in [`src/types/skyGarden.ts`](./src/types/skyGarden.ts).
- **Minimal Delta for Live Pilot:**
  1. Connect Zooniverse Panoptes OAuth client ID + PKCE sign-in flow (`panoptes-javascript-client` or thin REST wrapper).
  2. Queue & `POST /api/classifications` with exponential-backoff offline outbox using `FutureContributionRecord.idempotencyKey`.
  3. Pull live queued subjects via `GET /api/subjects/queued?workflow_id=...` while preserving the bundled 10-subject set as an optional offline Calibration Onramp.
