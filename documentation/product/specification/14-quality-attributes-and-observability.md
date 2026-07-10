# Volume 14: Quality Attributes and Observability

> **Specification ID:** `STORY-SPEC-14`
> **Volume:** 14 (16 volumes total, 00-15)  
> **Status:** Normative draft
> **Version:** 2.0.0-draft
> **Owner:** Quality, Reliability, Performance, and Observability Engineering
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, and Operations
> **Last reviewed:** July 10, 2026
> **Review cadence:** At every quality-budget, support-matrix, telemetry-schema, or release-profile change and at least once per release train
> **Normative scope:** Benchmark profiles, measurement and calibration, latency and frame budgets, fidelity tolerances, capacity, reliability, memory, recovery, supported environment coverage, structured observability, diagnostics, alerts, and operational runbooks
> **Explicit non-ownership:** Product feature semantics, canonical document schemas, mutation algorithms, file-format bytes, collaboration authority, presentation behavior, output mappings, security policy, implementation status, and release decisions
> **Parent specification:** [Story Product Specification System](README.md)
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)
> **Acceptance owner:** [Volume 15 - Acceptance and Release Conformance](15-acceptance-and-release-conformance.md)
> **Supersedes:** Conflicting quality thresholds, benchmark-profile definitions, observability contracts, and performance-gate claims in lower-authority automation and domain documents where this volume is more precise
> **Implementation status:** Out of scope; see the dated [Capability Audit](../capability-audit.md). This volume makes no completion or conformance claim.

---

## Table of Contents

1. [Purpose and Authority](#1-purpose-and-authority)
2. [Quality Model and Definitions](#2-quality-model-and-definitions)
3. [Representative Benchmark Profiles](#3-representative-benchmark-profiles)
4. [Measurement and Calibration](#4-measurement-and-calibration)
5. [Service and Experience Objectives](#5-service-and-experience-objectives)
6. [Fidelity Tolerances](#6-fidelity-tolerances)
7. [Platform, Browser, Device, and Input Matrix](#7-platform-browser-device-and-input-matrix)
8. [Reliability and Capacity Budgets](#8-reliability-and-capacity-budgets)
9. [Observability Contract](#9-observability-contract)
10. [Diagnostics, Alerts, and Runbooks](#10-diagnostics-alerts-and-runbooks)
11. [Failure, Pressure, and Degradation](#11-failure-pressure-and-degradation)
12. [Atomic Requirements](#12-atomic-requirements)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Test Protocols and Evidence Handoff](#14-test-protocols-and-evidence-handoff)
15. [Traceability and Source Adoption](#15-traceability-and-source-adoption)
16. [Open Decisions](#16-open-decisions)
17. [Identifier Counts](#17-identifier-counts)

---

## 1. Purpose and Authority

This volume defines what "fast," "smooth," "reliable," "within tolerance," "supported at scale," and "diagnosable" mean for Story. It converts those words into versioned workloads, exact measurement boundaries, percentile objectives, hard safety rules, environment profiles, reliability budgets, and observability contracts.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are interpreted under BCP 14, RFC 2119, and RFC 8174 as governed by [Volume 00](00-governance-and-traceability.md#2-normative-language).

### 1.1 Authority Boundary

Feature-owning volumes define the semantic outcome. This volume defines the quality of that outcome. A faster incorrect result is a failure. A visually similar result with lost semantics is a failure. A result with no admissible measurement is not a pass.

| Concern | Normative owner | This volume's role |
|---|---|---|
| Authored meaning and stable identity | [Volume 03](03-canonical-document-model.md) | Defines size profiles and exactness budgets; does not change schemas. |
| Preview, commit, history, and replay | [Volume 04](04-mutation-history-and-determinism.md) | Defines latency, throughput, and hot-path budgets. |
| Scene, rendering, readiness, and degradation | [Volume 05](05-resolution-scene-and-rendering.md) | Defines resolve, frame, resource, and fidelity budgets. |
| Files, assets, saves, checkpoints, and recovery | [Volume 06](06-files-assets-and-recovery.md) | Defines open, save, memory, capacity, and recovery objectives. |
| Collaboration, permission, and revocation | [Volume 07](07-collaboration-identity-and-sharing.md) | Adopts collaboration-specific objectives and adds load profiles. |
| Design authoring | [Volume 08](08-figma-class-design-authoring.md) | Defines representative interaction and content workloads. |
| Presentation authoring | [Volume 09](09-powerpoint-class-presentation-authoring.md) | Defines representative deck, data, motion, and recording workloads. |
| Presentation runtime | [Volume 10](10-presentation-runtime.md) | Defines navigation, timing, frame, memory, and recovery budgets. |
| Interchange and output | [Volume 11](11-interchange-and-output.md) | Defines throughput and fidelity tolerances for actual artifacts. |
| Accessibility and internationalization | [Volume 12](12-accessibility-and-internationalization.md) | Defines applicable semantic outcomes; this volume budgets their latency. |
| Acceptance and release | [Volume 15](15-acceptance-and-release-conformance.md) | Decides evidence admissibility, release gates, waivers, and final disposition. |

### 1.2 Quality Thesis

Quality is a vector, not one score. Story records correctness, latency, smoothness, fidelity, durability, availability, capacity, accessibility, privacy, and diagnosability independently. No strong dimension can offset a failed safety or semantic dimension.

### 1.3 No Status Inference

Targets in this volume describe required outcomes. They do not state that current code meets them. Historical benchmark output, test names, existing hooks, and green reports are evidence inputs only and remain subject to Volume 15 freshness and admissibility rules.

---

## 2. Quality Model and Definitions

### 2.1 Quality Dimensions

| Dimension | User question | Primary measure |
|---|---|---|
| Correctness | Did Story produce the intended semantic outcome? | Exact state, invariant, event, and artifact assertions |
| Responsiveness | Did feedback arrive before the interaction felt delayed? | Input-to-visible and input-to-committed percentiles |
| Smoothness | Did motion remain coherent without stalls or blank frames? | Frame-time distribution, missed frames, long tasks |
| Fidelity | Did meaning and appearance survive across surfaces and artifacts? | Semantic equality plus numeric, pixel, color, timing, and structure tolerances |
| Durability | Did accepted work survive interruption and reopen? | RPO, verified checkpoint/save result, recovery corpus |
| Reliability | How often did the workflow finish correctly? | Success ratio and error-budget consumption |
| Capacity | What bounded workload remains usable and safe? | Profile limits, throughput, queue depth, memory |
| Accessibility | Did alternative input and output remain complete and timely? | Volume 12 semantics plus latency and matrix coverage |
| Privacy | Was only permitted bounded operational data observed? | Schema allowlist, redaction, retention, negative scans |
| Diagnosability | Can a failure be classified and acted on without content exposure? | Correlated metrics, traces, logs, diagnostic bundle, runbook result |

### 2.2 Measurement Vocabulary

| Term | Definition |
|---|---|
| Start mark | The earliest app- or harness-observable event representing accepted user or system intent. |
| Visible mark | The first frame in which the expected paint is visible and hit-testable where interaction is expected. |
| Semantic mark | The event at which the canonical, session, or artifact state has accepted the intended outcome. |
| Stable mark | The event at which required dependent surfaces agree and no scheduled required work remains for the measured outcome. |
| Cold | Required process, document, resolver, font, asset, and target caches are absent according to the scenario. |
| Warm | Only the caches explicitly named by the scenario are populated; document semantics and environment remain identical. |
| Sample | One complete measured operation with one start, one end, and one outcome. |
| Valid run | A run whose environment, fixture, marks, outcome, and observer-overhead checks satisfy `SCH-14-001` through `SCH-14-004`. |
| Product target | The desired objective that preserves experience headroom. |
| Release gate | The maximum or minimum admissible value for the declared release profile. |
| Hard ceiling/floor | A non-calibratable safety or experience boundary. |
| Class baseline | A statistically stable distribution for one immutable environment class and fixture/protocol revision. |
| Regression | A candidate distribution that exceeds the absolute gate or the dual relative-and-absolute regression rule. |

### 2.3 Schemas

#### `SCH-14-001 BenchmarkFixtureManifest`

Every benchmark fixture declares:

| Field | Required content |
|---|---|
| `fixtureId`, `fixtureVersion` | Stable ID and immutable semantic version |
| `profile` | `tiny`, `small`, `medium`, `large`, `stress`, or `prolonged` |
| `generatorVersion`, `seed` | Reproducible generator identity or `hand-authored` plus source hash |
| `documentSemanticHash` | Volume 03 semantic hash after admission |
| `packageRevisionHash` | Package hash when file behavior is measured |
| `featureInventory` | Counts by entity, property, content, motion, asset, and accessibility family |
| `complexityInventory` | Hierarchy depth, text glyphs, path points, layout dependencies, effects, build steps, and relationships |
| `assetInventory` | Count, decoded dimensions/duration, encoded bytes, integrity, and readiness class without private locators |
| `failureVariant` | `none` or exact injected missing, corrupt, blocked, offline, conflict, pressure, or permission condition |
| `expectedSemantics` | Canonical hashes, event trace, readiness/degradation outcomes, and artifact expectations |
| `limitsProfile` | Parser, resolver, renderer, memory, and output limits applied |

#### `SCH-14-002 EnvironmentProfile`

An environment profile contains OS build, architecture, CPU class and logical-core count, RAM bucket, GPU/driver class where available, storage class, power mode, thermal state, browser/host and version, JavaScript engine, Playwright version, viewport/window, DPR, display refresh rate, color profile, input devices, locale, language, accessibility preferences, network profile, app build mode, feature configuration, worker count, and background-load declaration.

Exact user names, device serials, paths, SSIDs, IP addresses, and account identifiers are forbidden.

#### `SCH-14-003 MetricRecord`

```text
metricId, metricVersion, scenarioId, fixtureId, fixtureVersion
environmentProfileId, productCommit, buildId, specificationRevision
protocolId, markStart, markEnd, condition: cold|warm
sampleIndex, value, unit, direction, outcome
rawStartMonotonic, rawEndMonotonic, phaseDurations
observerOverhead, diagnostics, artifactReferences
```

`outcome` is one of `measured`, `functional-failure`, `blocked`, `canceled`, `timeout`, `missing-mark`, or `environment-invalid`. Only `measured` samples enter a distribution, but every other outcome remains in the run record and can fail the gate.

#### `SCH-14-004 QualityBudgetRegistry`

Each registry row contains stable metric ID, semantic start/end marks, fixture/profile, environment classes, condition, unit, direction, product target, release gate, hard ceiling/floor, percentile, minimum sample count, warmup count, timeout, allowed exclusions, maturity state, owning requirement, protocol, and change history.

#### `SCH-14-005 ReliabilityBudget`

Each reliability budget contains event numerator, eligible-event denominator, measurement window, target ratio, error-budget amount, burn-rate windows, exclusions, hard-zero failures, alert policy, and owning runbook.

#### `SCH-14-006 TelemetryEnvelope`

```text
schemaVersion, eventName, eventVersion, observedAtUtc
severity, outcome, durationMs, boundedDimensions
environmentClass, productVersion, featureProfile
ephemeralTraceId, ephemeralSpanId, sampled
redactionVersion, consentClass, retentionClass
```

#### `SCH-14-007 DiagnosticBundle`

A diagnostic bundle contains a manifest, app/build/environment metadata, bounded recent operational events, selected traces, metric window, feature flags, resource states, sanitized error codes, crash/minidump reference where allowed, and hashes of included files. Authored content, notes, captions, clipboard data, asset bytes, credentials, share secrets, provider locators, and reusable document/entity IDs are excluded by default.

#### `SCH-14-008 BenchmarkEvidenceBundle`

The bundle contains the exact registry, fixture, environment, command/protocol, headed status where browser-driven, raw bounded samples, aggregates, functional assertions, traces on worst/failing samples, observer-overhead result, artifact hashes, exclusions, result, and limitations. Volume 15 assigns immutable `EVD-*` instance IDs.

### 2.4 Invariants

| ID | Invariant |
|---|---|
| `INV-14-001` | Semantic correctness and safety are evaluated before performance; an incorrect or degraded-unexpected sample cannot satisfy a latency gate. |
| `INV-14-002` | Interaction hot paths contain no unrelated network, provider, full-document serialization, indexing, telemetry flush, or checkpoint work. |
| `INV-14-003` | Every latency metric has app-owned or independently verifiable semantic start and end marks; wall-clock polling alone is provisional. |
| `INV-14-004` | Percentiles are computed from raw valid samples without silently trimming slow values. |
| `INV-14-005` | Cold and warm measurements are separate distributions and never averaged together. |
| `INV-14-006` | Baselines never cross environment, fixture, product, protocol, or metric-definition revisions. |
| `INV-14-007` | Missing data, missing marks, zero samples, timeout, crash, and functional failure cannot be interpreted as passing performance. |
| `INV-14-008` | Calibration can account for stable environment capability but cannot loosen a hard safety, privacy, data-integrity, semantic, or blank-frame boundary. |
| `INV-14-009` | One aggregate score cannot offset a failed SLO, hard-zero invariant, or unsupported matrix cell. |
| `INV-14-010` | The active audience frame and recording-critical resources are never evicted to satisfy a speculative cache or throughput target. |
| `INV-14-011` | A telemetry payload is content-free by default and uses bounded dimensions with no user, document, entity, asset, file, URL, or note identity. |
| `INV-14-012` | Logs, traces, metrics, diagnostics, and evidence are distinct stores with distinct access and retention policy. |
| `INV-14-013` | Observability failure cannot block core local authoring, save, recovery, presentation navigation, or output finalization. |
| `INV-14-014` | Observer overhead is measured and remains below the declared budget or the run is invalid. |
| `INV-14-015` | A prolonged-use gate evaluates trend and post-cleanup stabilization, not only first and last values. |
| `INV-14-016` | Quality-budget changes preserve historical interpretations by versioning definitions rather than rewriting prior evidence. |

---

## 3. Representative Benchmark Profiles

For `PROFILE-R1-2026-01`, the default product-outcome benchmark is `BENCH-PRODUCT-001`. Its task and participant protocol complements rather than replaces the quality fixtures, environment profiles, metric records, and gates defined in this volume.

### 3.1 Canonical Profile Scale

Counts are fixture targets. A generated fixture may vary a count by at most 5 percent when its manifest records the exact value and remains in the same complexity bucket. Asset bytes refer to encoded source plus required embedded variants; decoded memory is measured separately.

| Profile | Slides | Total scene nodes | Peak nodes on one slide | Text scalar values | Vector points | Masters/layouts | Components/instances | Variables | Animation steps | Encoded assets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Tiny | 1 | 12 | 12 | 500 | 100 | 1 / 1 | 0 / 0 | 0 | 5 | <= 5 MB |
| Small | 10 | 300 | 60 | 12,000 | 3,000 | 2 / 4 | 8 / 40 | 40 | 80 | <= 50 MB |
| Medium | 50 | 5,000 | 300 | 150,000 | 50,000 | 4 / 12 | 40 / 300 | 250 | 750 | <= 250 MB |
| Large | 100 | 20,000 | 750 | 600,000 | 250,000 | 8 / 24 | 150 / 1,500 | 1,000 | 3,000 | <= 1 GB |
| Stress | 250 | 75,000 | 2,500 | 2,000,000 | 1,000,000 | 16 / 64 | 500 / 5,000 | 5,000 | 12,000 | <= 3 GB |
| Prolonged | Medium base | Medium base | Medium base | Medium base | Medium base | Medium base | Medium base | Medium base | Medium base | Medium base |

The Stress profile is a bounded capacity and failure-containment workload. It does not imply that every release claims full interactive performance at that scale. The release profile must state whether Stress is `supported`, `degraded-safe`, or `limit-validation-only`.

### 3.2 Required Content Mix

| Family | Tiny | Small | Medium | Large and Stress |
|---|---|---|---|---|
| Text | Point and fixed text, two styles | Rich runs, lists, missing-font variant | Bidi, IME output, columns, styles, overflow, fallback | Long text, many fonts, complex scripts, worst-case wrapping |
| Geometry | Primitives and one path | Groups, masks, boolean, gradients | Nested transforms, compound paths, high-point vectors | Deep hierarchy, dense points, clipping/effect hot spots |
| Responsive layout | One fixed group | Nested layout sample where supported | Fixed/hug/fill/wrap/min/max/absolute mix | Deep valid dependencies and bounded non-convergence fixture |
| Reuse | None | Theme/style and simple instance where supported | Variants, nested instances, overrides, modes, editions | High fan-out source update and orphan/conflict cases |
| Presentation structure | One slide/layout | Sections, notes, hidden slide, transitions | Multiple masters, layouts, custom show, data objects | Repeated show items, many sections, extensive notes and references |
| Data objects | None | One table or chart when supported | Tables, charts, diagrams, equations with accessible semantics | Large tables/data series and relayout hot spots |
| Media | One image | Images plus one short video/poster | Images, audio/video, captions, code/data snapshots | Multiple concurrent media dependencies and large decoded dimensions |
| Motion | One transition and click build | Mixed transition/build types | Parallel builds, Morph, media cues, reduced-motion outcomes | Long sequences, ambiguous/failure variants, repeated kiosk loops |
| Accessibility | Language, title, reading order | Alternatives, decorative nodes, focus states | Tables/charts/captions, forced colors, reduced motion | Large semantic tree and issue-checker workload |
| Interchange/output | Native and one raster/SVG target | Native, SVG/raster, PDF plan | PPTX/PDF/video/web plans where enabled | Batch, preservation, validation, and cancellation pressure |

Every profile includes at least one nondegenerate fixture capable of distinguishing semantic algorithms, inheritance layers, output dispositions, and runtime states. Repeating identical rectangles or empty slides cannot be the sole fixture for a profile.

### 3.3 Prolonged-Use Script

The Prolonged profile runs for four hours on the Medium deck and records five-minute windows. The script includes at least:

| Activity | Minimum count |
|---|---:|
| Pointer/keyboard selections and property changes | 5,000 |
| Move, resize, rotate, layout, vector, and text commits | 2,000 |
| Undo and redo intents, including remote-intervening cases where supported | 500 |
| Slide/view/root switches | 1,000 |
| Presentation entries/exits and slide/build advances | 20 / 2,000 |
| Save/checkpoint operations and native reopen cycles | 200 / 20 |
| Output jobs across enabled formats, including cancel/retry | 30 |
| Collaboration disconnect/reconnect cycles with two or more clients | 50 |
| Resource failure, memory pressure, window failure, and recovery injections | 20 |

The activity order is seed-driven and recorded. The final 30 minutes repeat the first 30-minute sequence so degradation can be compared against an equivalent workload.

### 3.4 Failure Variants

Each applicable profile has separate variants for missing font, missing linked asset, corrupt embedded asset, decoder failure, offline network, high-latency network, provider conflict, permission downgrade, collaboration gap/hash mismatch, stale cache, quota pressure, low memory, renderer-node failure, audience-window loss, display change, export finalization failure, and migration failure. A failure variant preserves the base fixture hash and records only the injected condition.

---

## 4. Measurement and Calibration

### 4.1 Required Measurement Boundaries

| Metric family | Start | End |
|---|---|---|
| Startup first meaningful frame | Navigation/process start | First complete non-placeholder editor frame painted |
| Startup interactive | Navigation/process start | Required shell visible, hit-testable, keyboard reachable, and initial document admitted or hub ready |
| Selection | Accepted pointer/key activation | Selection paint visible plus stable selected identity |
| Property inspector | Selection semantic mark | Correct target and required sections visible, accessible, and stable |
| Typing | `keydown` accepted by editor | Glyph and caret for that input visible, with text intent recorded at the declared boundary |
| Drag/transform | Pointer crosses gesture threshold | First correct preview frame visible |
| Commit | Commit request | New accepted semantic revision and dependent required surfaces stable |
| Slide switch | Navigation command accepted | Target scene painted, active identity stable, required inspector/navigator state synchronized |
| Runtime navigation/build | Session command accepted | Stable target position/build state visible on audience and acknowledged by authority |
| Readiness | Resource plan frozen | Every target-critical dependency ready or approved fallback ready |
| Save | Save intent freezes revision | Verified durable receipt and readback for that revision |
| Open | User/open request accepted | Verified document usable; full verification completion is recorded separately |
| Export | Immutable job plan accepted | Temporary artifact validated and atomically finalized |
| Collaboration | Local commit | Durable authority acknowledgment or remote visible semantic state, as named |
| Recovery | Failure detected | Compatible stable document/session restored or an actionable decision surface ready |

App-emitted `performance.mark` or equivalent monotonic marks are the normative timing source. A provisional DOM-derived mark is reportable but cannot become a Supported Release absolute gate until it has passed equivalence testing against the app-owned mark.

### 4.2 Sample Rules

- Interaction distributions use at least 5 warmups and 30 measured samples per fixture/environment pair.
- Startup uses at least 20 independent warm and 20 independent cold process or context starts.
- Frame metrics use at least ten 10-second windows and report p50, p95, p99, worst frame, missed-frame ratio, and long tasks.
- Save, open, and output use at least 10 runs per size/profile because work is longer; failures remain counted.
- Collaboration uses at least 100 accepted operations per operation family and 10 reconnect cycles per network profile.
- Recovery uses each deterministic injection point at least once and repeats probabilistic interruption points at least 10 times.
- Prolonged use records all windows; no steady-state window is discarded because it is slow.
- Raw samples remain attached to the evidence bundle. Aggregates alone are insufficient.

### 4.3 Calibration Method

Hard ceilings and floors in Section 5 are fixed. A secondary environment class without a fixed gate follows this calibration flow:

1. Freeze metric, fixture, protocol, build mode, and environment definitions.
2. Collect at least 10 independent valid runs across at least 5 days, with the sample count in Section 4.2 per run.
3. Reject the calibration if p95 drifts more than 10 percent without a diagnosed environment cause, if observer overhead fails, or if functional outcomes differ.
4. Set baseline `B95` for lower-is-better metrics and `B05` for higher-is-better metrics from the combined valid-run distribution.
5. For lower-is-better metrics, set `classGate = min(hardCeiling, max(productTarget, B95 * 1.10 + jitterAllowance))`.
6. For higher-is-better metrics, set `classGate = max(hardFloor, min(productTarget, B05 * 0.90 - jitterAllowance))`.
7. `jitterAllowance` is versioned per metric and cannot exceed 5 ms for interaction latency, 1 frame interval for frame metrics, or 2 percent for throughput and memory ratios.
8. If the baseline already violates the hard ceiling/floor, the class remains unsupported for that profile; calibration cannot turn it green.

Before calibration completes, the result is `measured-not-gated`. Missing calibration cannot be represented as pass or not applicable.

### 4.4 Regression Rule

A candidate fails when either:

- it violates the applicable absolute release gate; or
- compared with the current class baseline, lower-is-better p95 regresses by more than both 10 percent and 5 ms, or higher-is-better p05 regresses by more than 10 percent and the metric-specific material delta.

For sub-10-ms metrics, the material absolute delta is 1 ms. A baseline update requires an accepted investigation; rebasing onto a slower candidate is not a fix.

### 4.5 Metric Maturity - `SM-14-001`

| State | Entry | Release use |
|---|---|---|
| `proposed` | User boundary and owner named | None |
| `instrumented` | Marks and schema emit valid records | Diagnostic only |
| `calibrating` | Stable fixture/environment collection active | Trend only |
| `measured` | Distribution valid but gate stability incomplete | Preview disclosure only |
| `gated` | Calibration, observer, and ten-run stability gates pass | Applicable release decision |
| `suspended` | Definition, harness, environment, or correctness is invalid | No release use |
| `retired` | Superseded by a versioned metric | Historical only |

Any semantic boundary change returns a metric to `instrumented`. Threshold-only edits do not preserve gated status unless Section 12 change control passes.

### 4.6 Benchmark Run - `SM-14-002`

```text
planned -> environment-verified -> fixture-verified -> warmed
        -> measuring -> validating -> aggregated -> published
        -> invalid (from any pre-published state)
```

`validating` checks functional correctness, marks, sample count, timeouts, observer overhead, artifact closure, and privacy. An invalid run can diagnose but cannot gate.

### 4.7 Calibration Flow - `FLOW-14-001`

1. Register the metric and exact semantic marks.
2. Freeze the fixture and environment class.
3. Run functional assertions before collecting timing.
4. Collect the calibration window and observer-control window.
5. Inspect variance, thermal/power changes, background load, and worst samples.
6. Compute the class gate under Section 4.3.
7. Review Product, Performance, Quality, and the feature owner.
8. Version the registry and preserve all calibration evidence.

---

## 5. Service and Experience Objectives

All lower-is-better values are inclusive release gates even when the target uses `<`. A run reports p50, p95, and p99; the named percentile controls the gate. Medium is the default professional workflow profile. Large is a required capacity profile unless a release tier explicitly narrows its claim under Volume 15.

### 5.1 Startup and Open

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-001` | Warm Medium startup to first meaningful editor frame, p95 | < 1,000 ms | <= 1,500 ms |
| `SLO-14-002` | Warm Medium startup to interactive, p95 | < 2,000 ms | <= 3,000 ms |
| `SLO-14-003` | Cold Medium startup to interactive, p95 | < 3,000 ms | <= 5,000 ms |
| `SLO-14-004` | Verified native reopen to usable Medium/Large document, p95 | < 3,000 / 8,000 ms | <= 5,000 / 12,000 ms |

Startup never waits for unrelated indexing, telemetry upload, update checks, optional thumbnails, speculative prefetch, or cloud listing. A usable document can continue noncritical verified asset hydration, but the UI identifies partial readiness truthfully.

### 5.2 Authoring Interaction

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-005` | Selection input to visible highlight, p95 | < 50 ms | <= 80 ms |
| `SLO-14-006` | Selection to correct inspector ready, p95 | < 80 ms | <= 120 ms |
| `SLO-14-007` | Keydown to glyph and caret paint, p95 / p99 | < 16 / 30 ms | <= 30 / 50 ms |
| `SLO-14-008` | Drag threshold to first transform feedback, p95 | < 16.7 ms | <= 32 ms |
| `SLO-14-009` | Pointer hit test, p95 / p99 | < 2 / 4 ms | <= 5 / 10 ms |
| `SLO-14-010` | Slide switch, theme switch, and common command stable, p95 | < 100 / 120 / 80 ms | <= 180 / 200 / 150 ms |

### 5.3 Frames and Main-Thread Work

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-011` | Active authoring frame time at 60 Hz, p95 / p99 | < 24 / 33 ms | <= 33 / 50 ms |
| `SLO-14-012` | Audience presentation frame time at 60 Hz, p95 / p99 | < 16.7 / 24 ms | <= 24 / 33 ms |
| `SLO-14-013` | Missed-frame ratio during continuous interaction/presentation | < 0.5 percent | <= 1 percent |
| `SLO-14-014` | Long tasks during a 10-second interaction window | 0 over 50 ms | <= 1 over 50 ms and 0 over 100 ms |
| `SLO-14-015` | Blank, uninitialized, or partial audience frames | 0 | 0 |

At 120-Hz displays, Story need not paint at 120 FPS unless the support profile claims it, but input sampling, pointer alignment, and clock correctness cannot regress relative to the 60-Hz gate.

### 5.4 Text, Vector, Layout, Scene, and Paint

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-016` | Medium paragraph edit to stable reflow, p95 | < 50 ms | <= 100 ms |
| `SLO-14-017` | Vector point/handle edit to visible path, p95 | < 24 ms | <= 50 ms |
| `SLO-14-018` | Local Auto Layout recompute / full Medium slide layout, p95 | < 50 / 150 ms | <= 100 / 300 ms |
| `SLO-14-019` | Resolve and paint one Medium / Large representative slide, p95 | < 100 / 250 ms | <= 200 / 500 ms |
| `SLO-14-020` | Accessibility semantic tree update after local edit, p95 | < 100 ms | <= 200 ms |

Whole-document work runs incrementally or in the background and cannot create a main-thread task over `SLO-14-014`. Full recompute remains the correctness reference, not the interaction path.

### 5.5 Presentation Navigation, Builds, and Timing

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-021` | Session entry to first stable audience frame, p95 | < 300 ms | <= 800 ms after readiness |
| `SLO-14-022` | Next/Previous to stable build or slide, p95 / p99 | < 75 / 150 ms | <= 150 / 300 ms |
| `SLO-14-023` | Build command to first semantic feedback frame, p95 | < 33 ms | <= 50 ms |
| `SLO-14-024` | Transition start command to correct start-state frame, p95 | < 33 ms | <= 50 ms |
| `SLO-14-025` | Session-clock drift over 60 minutes | < 50 ms | <= 100 ms |
| `SLO-14-026` | Media, audio, and caption offset from semantic clock | within +/-50 ms | within +/-100 ms |

Navigation gates include command serialization, target preparation, and stable paint. A readiness block is measured separately and cannot be hidden by ending the navigation timer before paint.

### 5.6 Readiness

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-027` | Local/embedded first-item critical readiness, Medium, p95 | < 2,000 ms | <= 5,000 ms |
| `SLO-14-028` | Hot-next-item readiness after current item is stable, p95 | < 500 ms | <= 1,500 ms |
| `SLO-14-029` | Complete show preflight, Medium / Large, p95 | < 5 / 15 s | <= 10 / 30 s |

Remote linked resources use the declared network profile and report transfer time separately. Readiness success requires exact or approved fallback semantics, never merely a resolved promise.

### 5.7 Save, Load, and Checkpoint

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-030` | Commit-to-checkpoint scheduling work on interaction thread, p95 | < 8 ms | <= 16 ms |
| `SLO-14-031` | Durable local recovery checkpoint, Medium / Large, p95 | < 1 / 4 s | <= 3 / 8 s |
| `SLO-14-032` | Verified local native save, Medium / Large, p95 | < 3 / 10 s | <= 8 / 20 s |
| `SLO-14-033` | Full native verify after usable open, Medium / Large, p95 | < 5 / 15 s | <= 10 / 30 s |

Cloud publication records `localStageMs + uploadBytes / observedGoodput + providerCommitMs + readbackMs`. The fixed non-transfer portion has a p95 gate of 2 seconds on the reference provider profile. Transfer time is compared with measured goodput and cannot be blamed on serialization without phase marks.

### 5.8 Export and Interchange

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-034` | Output preflight, Medium / Large, p95 | < 5 / 20 s | <= 10 / 40 s |
| `SLO-14-035` | One selected SVG / one 4K raster artifact, p95 | < 2 / 3 s | <= 5 / 8 s |
| `SLO-14-036` | Medium 50-slide PDF / preservation PPTX / portable web bundle, p95 | < 30 / 60 / 60 s | <= 60 / 120 / 120 s |
| `SLO-14-037` | 1080p30 video render throughput, software / hardware profile | >= 0.25x / 1.0x real time | >= 0.20x / 0.75x real time |
| `SLO-14-038` | Video audio, caption, and event drift | within +/-50 ms | within +/-100 ms |

Only enabled, fully routed output profiles participate. Disabled or unimplemented formats are not measured as zero and cannot count as passing.

### 5.9 Collaboration, Memory, Recovery, and Observability

| ID | Objective | Product target | Release gate |
|---|---|---:|---:|
| `SLO-14-039` | Accepted-operation acknowledgment, supported-region standard profile, p95 / p99 | < 250 / 750 ms | <= 400 / 1,000 ms |
| `SLO-14-040` | Remote accepted-operation visibility, supported-region standard profile, p95 / p99 | < 400 / 1,000 ms | <= 750 / 1,500 ms |
| `SLO-14-041` | Medium / Large peak total browser memory after stabilization | < 512 / 1,024 MB | <= 768 / 1,536 MB and <= 25 percent of physical RAM |
| `SLO-14-042` | Four-hour post-GC heap trend | <= 2 percent per hour | <= 5 percent total or 50 MB, whichever is smaller after warmup |
| `SLO-14-043` | Detached nodes/listeners/workers after 20 create-dispose cycles | return to baseline | <= baseline + 2 percent, no positive monotonic trend |
| `SLO-14-044` | Authoring crash/reload to recovery decision / Medium restored usable | < 3 / 7 s | <= 5 / 10 s |
| `SLO-14-045` | Audience-window reopen to stable current position | < 1,500 ms | <= 3,000 ms |
| `SLO-14-046` | Observability CPU / main-thread / network overhead | < 1 / 1 / 0.25 percent | <= 2 / 2 / 0.5 percent in normal sampling |
| `SLO-14-047` | Presence update visibility under nominal load, p95 | < 200 ms | <= 500 ms; loss remains permissible |
| `SLO-14-048` | Reconnect with <= 1,000 missed operations / Medium snapshot fallback, p95 | < 3 / 10 s | <= 5 / 15 s |
| `SLO-14-049` | Deterministic collaboration corpus convergence | 100 percent | 100 percent; any semantic-hash mismatch is hard-zero |
| `SLO-14-050` | Revocation commit to denied privileged request, p95 / p100 | < 5 / 30 s | <= 10 / 30 s |
| `SLO-14-051` | Acknowledged-operation RPO / regional collaboration RTO | 0 / < 30 min | 0 / <= 30 min |
| `SLO-14-052` | Pending local queue envelope and ordering integrity after crash/restart | 100 percent | 100 percent |
| `SLO-14-053` | Context orientation across seeded screens | >= 90 percent correct within 10 s | >= 85 percent correct within 15 s |
| `SLO-14-054` | First-attempt shell task completion / median ease | >= 85 percent / >= 5.5 of 7 | >= 80 percent / >= 5.0 of 7 |
| `SLO-14-055` | Command target/result prediction | >= 95 percent | >= 90 percent |
| `SLO-14-056` | One-level Escape prediction / data-loss events | >= 95 percent / 0 | >= 90 percent / 0 |
| `SLO-14-057` | Commit/cancel/reverse prediction | >= 95 percent | >= 90 percent |
| `SLO-14-058` | Uniform/mixed/inherited/conflicted property task completion | >= 90 percent | >= 85 percent |
| `SLO-14-059` | Keyboard region cycle / focus traps or loss | <= 8 F6 presses / 0 | <= 10 / 0 |
| `SLO-14-060` | Adaptive-task continuity / overlap or unreachable controls | >= 90 percent / 0 | >= 85 percent / 0 |
| `SLO-14-061` | Save/offline/read-only/conflict/readiness state comprehension | >= 90 percent | >= 85 percent |
| `SLO-14-062` | Story terminology comprehension after contextual first use | >= 90 percent | >= 85 percent |
| `SLO-14-063` | Equivalent-control visual/state consistency | 100 percent of sampled controls | >= 98 percent; no critical inconsistency |
| `SLO-14-064` | D2 touch/pen supported-task completion without hover blocker or accidental commit | >= 90 percent | >= 85 percent |
| `SLO-14-065` | Keyboard focus indication after focus change | First rendered frame | <= second rendered frame; never absent |
| `SLO-14-066` | Semantic canvas focus response, p95 / p99 | < 100 / 200 ms | <= 150 / 300 ms |
| `SLO-14-067` | Deduplicated navigation-status announcement | <= 500 ms | <= 750 ms; no composition interruption |
| `SLO-14-068` | Accessibility checker Medium / Large and main-thread block | < 2 / 10 s and <= 50 ms | <= 3 / 15 s and <= 100 ms |
| `SLO-14-069` | Strict accessible-output critical semantic errors | 0 | 0 |
| `SLO-14-070` | Authentication replay/nonce/issuer/audience/spoof successes | 0 | 0 |
| `SLO-14-071` | Secret/content/private/share-link/raw-stable-ID telemetry leaks | 0 | 0 |
| `SLO-14-072` | Unsafe-import script execution, external fetch, origin escape, or mutable partial admission | 0 | 0 |
| `SLO-14-073` | Sandbox budget violation containment | Terminated within profile budget; 0 origin escape | Same; hard-zero escape |
| `SLO-14-074` | Recording live tracks outside declared indicated states | 0 | 0 |
| `SLO-14-075` | External AI/transcription payload or unreviewed-commit deviations | 0 | 0 |
| `SLO-14-076` | Retention/deletion truthful terminal or declared pending/hold disposition | 100 percent | 100 percent |
| `SLO-14-077` | Privileged-action audit completeness / denial metadata leaks | 100 percent / 0 | 100 percent / 0 |
| `SLO-14-078` | Cue Line source, edition, scope, readiness, and exact-break comprehension / permitted-owner navigation without mutation | >= 90 percent / 100 percent | >= 85 percent / 100 percent; 0 audience/output leakage |

Local recovery RPO is at most the last accepted change older than 5 seconds under normal storage availability. Shared acknowledged operations have RPO 0 under `SLO-14-051`. Any user-visible claim states which durability boundary applies.

---

## 6. Fidelity Tolerances

Semantic and structural equality is exact unless a feature-owning volume declares a degradation. Numeric and visual tolerances account for finite arithmetic, rasterization, anti-aliasing, and platform text rendering; they never excuse missing content or changed editability.

| Domain | Same-profile tolerance | Cross-platform tolerance | Failure regardless of pixels |
|---|---|---|---|
| Canonical semantics | Identical semantic hash | Identical semantic hash | Missing/extra entity, identity/order/reference change |
| Event/build trace | Exact stable IDs, order, state, and logical time | Exact; timing within named clock tolerance | Reordered, duplicated, or omitted event |
| Geometry in design units | Absolute <= 0.01 du or relative <= 0.000001 | Same semantic geometry before surface conversion | NaN, infinity, singular unreported transform |
| Surface bounds | <= 0.5 CSS px at DPR 1 and <= 1 device px | <= 1 CSS px plus declared font/color variance | Wrong hierarchy, clipping, or hit target |
| Selection/guides | <= 1 CSS px to resolved geometry | Same | Visible misalignment or wrong snap result |
| Text | Identical Unicode, paragraphs, runs, clusters, and line breaks with same font bytes/profile | Same semantics; bounds <= 1 CSS px and platform line-break differences only if profile permits | Missing/reordered text, wrong language/direction, unreported font fallback |
| Solid color | Delta E 2000 <= 1 and alpha <= 1/255 | Delta E 2000 <= 2 under declared color profile | Wrong token/source/profile or clipped gamut without report |
| Same-environment pixels | Mismatch <= 0.1 percent after approved dynamic masks; channel delta <= 8 | Not applicable | Any semantic mismatch |
| Cross-platform pixels | SSIM >= 0.995 and mismatch <= 0.5 percent after approved masks | Required | Difference outside classified text/AA/color-profile region |
| Raster dimensions | Exact width, height, alpha, and profile fields | Exact | Silent crop, downscale, or profile loss |
| Audio/video/captions | `SLO-14-026` and `SLO-14-038` | Same | Missing track/cue, wrong language, private track leak |
| Preserved source parts | Byte-identical hash when untouched | Byte-identical hash | Lost relationship, content type, or reachability |

Golden-image masks can cover only nondeterministic browser chrome, caret blink, OS font anti-aliasing region, permitted timestamp, or consented dynamic external content. A mask cannot cover authored content, selection alignment, compatibility warnings, private-data leakage, blank frames, or the feature under test.

---

## 7. Platform, Browser, Device, and Input Matrix

### 7.1 Environment Classes

| Class | OS/architecture target | Browser/host target | Reference window/display | Primary use |
|---|---|---|---|---|
| `ref.win.desktop` | Windows 11 x64, 4 or more performance cores, 16 GB RAM, SSD, integrated GPU or better | Current Playwright Chromium matching the release toolchain | 1920 x 1080, DPR 1, 60 Hz, sRGB | Absolute benchmark and headed E2E reference |
| `win.desktop` | Supported Windows 11 x64 and ARM64 builds | Current and previous stable Edge and Chrome | W4/W3 plus 125/150/200 percent scaling | Supported desktop matrix |
| `mac.desktop` | Current and previous supported macOS, ARM64 | Current and previous stable Safari and Chrome | Retina DPR 2 plus external DPR 1 | Supported desktop matrix |
| `linux.desktop` | Current Ubuntu LTS x64 | Current and previous stable Chrome and Firefox | W4/W3, DPR 1 | Supported desktop matrix where declared |
| `win.hybrid` | Windows touch/pen hardware | Edge/Chrome stable | W2-W4, DPR 1-2, touch and pen | D2 hybrid authoring |
| `tablet.hybrid` | Current and previous supported iPadOS | Safari stable | Landscape/portrait W1-W2 | D2 bounded authoring/presentation where declared |
| `companion.mobile` | Current and previous supported iOS/Android | Safari/Chrome stable | W1 portrait/landscape | D1 companion workflows |
| `runner.release` | Immutable dedicated release runner image | Pinned browser versions | Fixed per profile | Reproducible release evidence, not a substitute for hardware matrix |

"Current" is frozen at release-candidate cut and recorded in evidence. A browser released after the cut is not silently included.

### 7.2 Browser Applicability

| Capability family | Chromium desktop | Safari desktop | Firefox desktop | Tablet browser | Companion browser |
|---|:---:|:---:|:---:|:---:|:---:|
| Local authoring core | Required | Required when platform is claimed | Required when platform is claimed | Profile-specific | Bounded D1 only |
| Clipboard rich flavors | Required plus permission denial | Host-dependent protocol | Host-dependent protocol | Host-dependent protocol | Bounded |
| Local file/native package | Required | Host-dependent protocol | Host-dependent protocol | Import/export through supported picker | Open/review where declared |
| Presentation fullscreen/windowed | Required | Required | Required where platform is claimed | Required where presentation is claimed | Required where presentation is claimed |
| Presenter multi-window/display | Host matrix | Host matrix | Host matrix | Usually manual/unsupported disclosure | Not applicable unless remote role |
| Recording/capture/codecs | Host/device matrix | Host/device matrix | Host/device matrix | Host/device matrix | Profile-specific |
| Web output playback | Required | Required | Required | Required | Required |

### 7.3 Input and Accessibility Applicability

| Input or environment | Authoring core | Presentation | Output/setup | Required evidence |
|---|---|---|---|---|
| Keyboard only | Required | Required | Required | Headed workflow plus focus/semantic capture |
| Mouse/fine pointer | Required | Required | Required | Real pointer events and hit testing |
| Trackpad | Pan, zoom, selection, gestures | Navigation/zoom where mapped | Scroll/preview | Hardware manual or trusted automation plus headed capture |
| Touch/coarse pointer | D2/D1 matrix | Required on touch claim | Required on touch claim | Real device/browser where gesture fidelity matters |
| Pen | D2 matrix, pressure/tilt optional | Ink/laser where claimed | Signature/drawing only if claimed | Real hardware for pressure, palm, eraser, hover |
| IME and complex script | Text authoring | Search/captions/notes input | Metadata, filenames, captions | Real OS/browser IME matrix from Volume 12 |
| Screen reader | Editor/canvas matrix | Audience and Presenter View | Compatibility/output setup | Manual AT plus semantic capture |
| Voice/switch/magnification | Critical workflows where platform supports | Audience/presenter controls | Setup and recovery | Manual platform protocol |
| Clicker/remote | Not applicable | Required where claimed | Pairing/setup | Physical clicker or protocol-certified device |
| Multi-display | Not applicable | Required where automatic placement is claimed | Setup/recovery | Physical display hotplug and role privacy |
| Microphone/camera/screen capture | Recording setup only | Recording mode | Video review/output | Real permission and interruption tests |

### 7.4 Network and Power Profiles

| Profile | RTT | Down/up | Loss/jitter | Use |
|---|---:|---:|---:|---|
| `local` | < 5 ms | local | 0 | Embedded assets, local authority |
| `regional-broadband` | 50 ms | 100/20 Mbps | 0.1 percent / 10 ms | Collaboration SLO reference |
| `constrained` | 150 ms | 10/2 Mbps | 1 percent / 30 ms | Reconnect, linked assets, output upload |
| `unstable` | 250 ms | variable | 5 percent / 100 ms plus disconnects | Rescue and retry behavior |
| `offline` | unavailable | 0 | 100 percent | Local authoring, cached runtime, recovery |

Performance evidence records AC power or battery, power mode, thermal throttling, display refresh, and background load. Absolute release gates run on AC/best-performance reference settings. Battery/low-power profiles verify graceful degradation and input correctness, not the same throughput unless claimed.

### 7.5 Support Declaration

Each release publishes a matrix cell as `supported`, `supported-with-declared-degradation`, `preview`, `not-supported`, or `not-applicable`. Blank cells are failures in the conformance ledger. A platform claim includes the browser, device tier, input, accessibility, output, network, and host-dependent rows that apply to the advertised workflow.

---

## 8. Reliability and Capacity Budgets

### 8.1 Rolling Reliability Objectives

| Budget | Eligible event | 30-day target | Hard-zero failures |
|---|---|---:|---|
| Authoring healthy session | Open to intentional close, at least 10 minutes | >= 99.9 percent | Silent accepted-content loss |
| Presentation healthy session | Entry to intentional end | >= 99.95 percent | Blank frame, private-note leak, reordered build |
| Local checkpoint | Scheduled eligible checkpoint | >= 99.99 percent | Corrupting the only verified recovery state |
| Native save | Eligible local save with available destination | >= 99.9 percent | Replacing valid destination with partial/corrupt artifact |
| Output job | Supported profile with ready inputs | >= 99.5 percent | Reporting full success for invalid artifact |
| Collaboration acceptance | Valid authorized submission under service envelope | >= 99.9 percent | Acknowledged operation loss or divergent accepted hash |
| Recovery | Injected supported failure with valid recovery material | 100 percent in conformance corpus | Destroying source evidence or choosing divergent branch by timestamp |

User cancellation, an explicit unsupported profile, and a correctly surfaced external provider denial are not reliability failures for the operation, but they remain counted separately and cannot be used to shrink the denominator after observation.

### 8.2 Error-Budget Policy

- A hard-zero failure stops the applicable release or rollout regardless of aggregate availability.
- Two-hour and 24-hour burn alerts fire at 14.4x and 6x the permitted monthly budget respectively.
- Consuming 50 percent of a monthly budget in seven days freezes feature rollout and requires an owner-approved recovery plan.
- Consuming 100 percent freezes non-reliability changes in the affected profile until the rolling window and investigation satisfy the release owner.
- Unknown outcomes count as failures until reconciled.

### 8.3 Capacity Contract

| Area | Standard supported workload | Burst/large workload | Stress behavior |
|---|---|---|---|
| Authoring document | Medium profile | Large profile | Stress admits, reports limits, degrades safely, or blocks before corruption |
| One interactive slide | 300 nodes, 10,000 vector points, 5,000 text scalars | 750 nodes, 50,000 points, 20,000 scalars | 2,500 nodes and profile limit validation |
| History/pending intent | 5,000 retained local intents or policy horizon | 10,000 offline queued transactions, <= 100 MB encoded | Backpressure/fork; never silent discard |
| Collaboration | 25 active editors, 250 presence-only/view clients per document | 100 accepted operations/sec burst, 20/sec sustained for 10 minutes | Presence sheds before durable operations; explicit admission control |
| Presentation | Large profile with 3,000 build steps | 4K audience display plus presenter display and recording where claimed | Reduce prefetch/effects before active-frame loss |
| Raster | 16,384 x 16,384 or codec lower bound | Tiled render up to published pixel budget | Block or explicit downscale; no silent crop |
| PDF/print | 250 pages per job | Batch under declared temporary-storage budget | Pause/cancel/block before quota corruption |
| Video | 1080p30 baseline, 4K profile when claimed | Published codec/hardware matrix | Profile change requires explicit user choice |
| Diagnostic retention | Bounded ring buffers and failure-only heavy artifacts | Incident-approved sampling | Drop diagnostics before product work; retain no content by default |

Every parser, queue, cache, worker pool, recursion, diagnostic list, and artifact job has a finite configured maximum. Reaching a maximum produces typed backpressure, partial-read-only, degraded-safe, or blocked behavior before unbounded allocation.

### 8.4 Reliability State - `SM-14-003`

| State | Meaning | Required action |
|---|---|---|
| `healthy` | Burn within target and no hard-zero event | Normal operation |
| `warning` | Short-window burn or leading indicator elevated | Alert owner, collect bounded diagnostics |
| `budget-risk` | 50 percent budget consumed in seven days | Freeze rollout, mitigation plan |
| `exhausted` | Monthly budget consumed | Stop affected rollout/release, incident review |
| `hard-zero-breach` | Data, privacy, convergence, blank-frame, or artifact-integrity breach | Immediate no-go/rollback path |
| `recovering` | Mitigation deployed and monitored | Fresh evidence and burn validation |

---

## 9. Observability Contract

### 9.1 Signal Roles

| Signal | Purpose | Required shape | Not a substitute for |
|---|---|---|---|
| Metric | Bounded aggregate health and SLO calculation | Counter, histogram, gauge with allowlisted dimensions | Per-user debugging or semantic evidence |
| Trace | Sampled causal phase timing across one operation | Parent/child spans with monotonic duration and outcome | Full authored operation log |
| Log | Discrete diagnosable state transition or failure | Structured event code and bounded parameters | Raw content dump or analytics event |
| Crash record | Process failure classification | Stack/module/build plus privacy policy | Automatic user-content upload |
| Diagnostic bundle | User- or support-initiated bounded investigation | `SCH-14-007` with preview/consent | Continuous telemetry |
| Evidence bundle | Immutable conformance result | `SCH-14-008` and Volume 15 schema | Production monitoring |

### 9.2 Metric Namespaces

Existing hooks from Volumes 03 through 12 are adopted under these stable namespaces:

```text
story.document.*
story.mutation.*
story.scene.*
story.surface.*
story.storage.*
story.collaboration.*
story.authoring.*
story.presentation.*
story.output.*
story.accessibility.*
story.security.*
story.observability.*
```

Each histogram uses explicit buckets appropriate to its SLO. Metrics include outcome and profile dimensions, not raw values or unbounded reason strings.

### 9.3 Allowed Dimensions

Allowed dimensions are bounded enums or buckets: app version, spec/profile version, environment class, operation family, surface, runtime mode, content-family bucket, entity-count bucket, asset-byte bucket, provider capability tier, network profile, cold/warm, exact/degraded/blocked, error code, recovery action, and sampling class.

Forbidden dimensions include user/account/tenant ID, document/package/entity/asset ID, title, text, notes, comments, captions, search query, filename, full path, URL, IP, email, share token, font family when identifying, raw device label, clipboard content, or arbitrary exception message.

### 9.4 Trace Model

The top-level spans are:

```text
story.startup
story.document.open
story.mutation.commit
story.scene.resolve
story.surface.render
story.storage.checkpoint
story.storage.save
story.collaboration.submit
story.presentation.command
story.presentation.readiness
story.output.job
story.recovery
```

Child spans correspond to registered phases such as validate, resolve, layout, text, geometry, plan, prepare, decode, encode, publish, readback, rebase, and verify. Span attributes follow the dimension allowlist. Trace IDs are random, short-lived, and never derived from document or transaction identity.

### 9.5 Structured Logs

Logs use stable `eventCode`, `eventVersion`, severity, outcome, bounded parameters, product build, and ephemeral trace correlation. User-facing diagnostic prose is localized separately. Raw exception strings are sanitized before persistence or upload. Repeated identical events are rate-limited with suppressed-count summaries.

### 9.6 Privacy, Consent, and Retention

| Class | Examples | Default collection | Maximum default retention |
|---|---|---|---:|
| Essential local | Crash marker, recovery journal, local runbook output | Local, required for safety | Through recovery horizon |
| Essential service | Auth/service integrity and abuse events | Service policy, minimized | 30 days unless legal/security policy differs |
| Product health | Bounded metrics and sampled traces | Consent/policy controlled | 30 days raw, 13 months aggregate |
| Diagnostic | User-created support bundle | Explicit preview and consent | 14 days or case closure, whichever is earlier |
| Release evidence | Synthetic fixtures and controlled environments | Required for release | Release lifetime plus policy horizon |

Users can view the telemetry category policy and disable optional product-health collection without disabling local recovery or core functionality. Diagnostic bundles list every included file and data class before upload. Enterprise policy can narrow collection and retention but cannot authorize hidden authored-content telemetry.

### 9.7 Health Probes

Health probes verify bounded operational dependencies without opening user documents: mutation engine self-test, object-store read/write canary, collaboration append/read canary, renderer synthetic frame, output synthetic artifact validation, telemetry queue age, and recovery-store integrity. Canaries use synthetic IDs and content.

### 9.8 Observability Flow - `FLOW-14-002`

1. Product code emits a versioned local signal with allowlisted fields.
2. The observability adapter validates schema and redacts before buffering.
3. Sampling and rate limits run before upload or durable diagnostic storage.
4. Core work proceeds independently of signal success.
5. Exported signals receive retention class, access policy, and ephemeral correlation.
6. Schema violations are counted locally and dropped, not forwarded as raw fallback blobs.

---

## 10. Diagnostics, Alerts, and Runbooks

### 10.1 Diagnostic Bundle Rules

- Bundle creation is explicit unless a crash policy already has informed consent.
- The user or operator can preview categories and omit optional traces/screenshots.
- Screenshots are excluded by default because they may contain authored content.
- A support mode can include content only through a separate explicit item-level consent and access policy; that content never enters normal telemetry.
- Bundles are encrypted in transit and at rest, integrity-hashed, access-audited, and automatically expired.
- Bundle creation failure does not erase local source logs or affect the document.

### 10.2 Alerts

| Alert | Trigger | Severity | Runbook |
|---|---|---|---|
| Startup regression | Absolute/dual regression gate or missing start/end mark | Release blocker or operational warning | `RUN-14-STARTUP` |
| Interaction jank | `SLO-14-005` through `SLO-14-014` burn | High | `RUN-14-INTERACTION` |
| Memory growth | Heap/resource slope or pressure termination | High | `RUN-14-MEMORY` |
| Save/checkpoint integrity | Failed verify, ambiguous head, RPO risk | Critical | `RUN-14-STORAGE` |
| Collaboration divergence | Hash mismatch or acknowledged-loss risk | Critical | `RUN-14-COLLAB` |
| Audience blank/privacy | Blank frame, private-state selector/message/capture | Critical | `RUN-14-RUNTIME` |
| Output invalidity | Validator failure after write or report mismatch | High/Critical by artifact | `RUN-14-OUTPUT` |
| Telemetry pipeline | Queue age, schema rejection, cardinality, overhead | Medium; never product-blocking alone | `RUN-14-OBSERVABILITY` |

### 10.3 Runbook Contract

Every runbook contains owner/on-call role, trigger and severity, affected SLOs/profiles, user impact, hard-zero check, privacy classification, dashboards/queries, first five-minute actions, evidence-preservation steps, safe mitigations, rollback/fail-closed criteria, validation steps, communication fields, escalation, resolution criteria, and post-incident actions.

| Runbook | First discriminating checks | Safe mitigation |
|---|---|---|
| `RUN-14-STARTUP` | Phase spans, cold/warm, bundle/load/font marks, environment change | Defer noncritical work; revert candidate; never skip document validation |
| `RUN-14-INTERACTION` | Input-to-paint phases, long tasks, layout/paint, hot-path I/O | Disable speculative work/effect quality; preserve semantic response |
| `RUN-14-MEMORY` | Heap slope, detached nodes, cache/resource ownership, pressure events | Evict cold/warm caches, reduce prefetch, retain active/recording resources |
| `RUN-14-STORAGE` | Source/candidate hashes, journal, durable head, provider capability | Stop overwrite, preserve candidates, use checkpoint/conflict copy |
| `RUN-14-COLLAB` | Epoch/head/log/hash, pending queue, permission revision | Quarantine replica, stop submit, fetch verified snapshot, retain intent |
| `RUN-14-RUNTIME` | Stable frame, scene/readiness, window roles/messages, checkpoint | Hold safe frame, cut transition, reopen role safely, stop capture on privacy risk |
| `RUN-14-OUTPUT` | Immutable plan, writer decisions, parser validation, destination bytes | Withhold success, keep prior destination, retain diagnostic temporary artifact |
| `RUN-14-OBSERVABILITY` | Queue, schema version, sampling, cardinality, overhead | Drop optional signals, lower sampling, preserve product path |

### 10.4 Regression Triage - `FLOW-14-003`

1. Confirm functional correctness and evidence admissibility.
2. Compare exact fixture, environment, metric, and protocol revisions.
3. Reproduce on the release runner and one representative hardware class.
4. Inspect raw samples and the worst valid sample before aggregates.
5. Split duration by registered phases and check observer overhead.
6. Classify product regression, environment shift, harness defect, or insufficient evidence.
7. Fix or revert the smallest responsible change; do not rebaseline first.
8. Rerun the same protocol, then adjacent profile and prolonged-use checks as impact requires.

### 10.5 Incident Flow - `FLOW-14-004`

1. Detect and classify severity, affected profiles, and hard-zero status.
2. Preserve bounded privacy-safe evidence and stop destructive cleanup.
3. Apply the runbook's fail-safe mitigation or rollback.
4. Verify user work, audience privacy, artifact integrity, and service authority.
5. Communicate scope and mitigation without exposing content.
6. Restore only after fresh functional and SLO evidence.
7. Record root cause, escaped gate, corrective action, and prevention owner.

### 10.6 Runbook Exercise - `FLOW-14-005`

Each release train executes one storage/collaboration hard-zero exercise, one runtime/output exercise, and one performance/observability exercise against synthetic fixtures. An unexercised runbook remains `draft` and cannot be the sole mitigation for a Supported Release gate.

---

## 11. Failure, Pressure, and Degradation

### 11.1 Work Priority

Highest priority runs first:

1. input acceptance, semantic clock, active audience paint, and capture safety;
2. canonical validation/commit and current-scene resolution;
3. local recovery/checkpoint scheduling and durable acknowledgment;
4. target-critical readiness and current output writing;
5. hot-next prefetch, thumbnails, accessibility updates, and collaboration receive/apply;
6. cold caches, search/indexing, analytics, optional traces, and cleanup.

Lower-priority work yields, cancels, batches, or moves off the interaction thread before a higher-priority SLO is violated.

### 11.2 Pressure Ladder

| Pressure | Required order | Forbidden result |
|---|---|---|
| CPU/main thread | Stop optional diagnostics, reduce speculative work, lower nonsemantic effect detail | Delayed input because telemetry or indexing runs |
| Memory | Evict cold then warm caches, reduce prefetch/decode, release hidden surfaces | Evict active frame, pending intent, checkpoint, inverse, recording chunk |
| Storage quota | Stop optional caches, checkpoint compact only with proof, offer destination/recovery choice | Delete sole recovery or partial-overwrite destination |
| Network | Pause optional fetch/upload, prioritize collaboration authority and required target resource | Retry storm or blocked local navigation |
| GPU/decoder | Reduce surface detail/effect quality, use approved poster/cut/fallback | Blank frame, semantic omission, private overlay leak |
| Battery/thermal | Reduce prefetch/frame detail according to declared profile | Change authored timing/order or make controls unresponsive |

### 11.3 Degradation Rules

A degradation is legal only when the feature-owning volume defines it, it appears in the `SurfacePlan` or operation policy, the user or presenter can discover it at the correct surface, and evidence verifies semantic preservation. Performance pressure cannot invent a new flattening, omission, timing, or output policy.

---

## 12. Atomic Requirements

Each row contains one primary normative outcome and one acceptance criterion.

### 12.1 Benchmark Profiles and Fixtures

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-001` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every benchmark fixture **MUST** conform to `SCH-14-001`. | `AC-14-001` |
| `REQ-14-002` | [DES-003](../product-spec.md#51-canvas-and-viewport) | The Tiny profile **MUST** exercise one complete nondegenerate authoring and presentation path at the scale in Section 3.1. | `AC-14-002` |
| `REQ-14-003` | [PRE-001](../product-spec.md#61-slide-and-deck-organization) | The Small profile **MUST** exercise representative multi-slide structure, content, motion, and native persistence at the scale in Section 3.1. | `AC-14-003` |
| `REQ-14-004` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | The Medium profile **MUST** be the default professional workflow workload with every enabled semantic family represented. | `AC-14-004` |
| `REQ-14-005` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | The Large profile **MUST** exercise the supported high-capacity workflow and hotspot distribution in Sections 3 and 8. | `AC-14-005` |
| `REQ-14-006` | [ARC-030](../product-spec.md#74-storage-and-recovery) | The Stress profile **MUST** reach declared limits through valid bounded data and verify safe degradation or rejection before corruption. | `AC-14-006` |
| `REQ-14-007` | [ARC-031](../product-spec.md#74-storage-and-recovery) | The Prolonged profile **MUST** execute the four-hour repeated-workload contract in Section 3.3. | `AC-14-007` |
| `REQ-14-008` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every profile **MUST** satisfy the required content mix and discriminating-fixture rules in Section 3.2. | `AC-14-008` |
| `REQ-14-009` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Each applicable profile **MUST** include separately identifiable failure variants from Section 3.4. | `AC-14-009` |
| `REQ-14-010` | [ARC-002](../product-spec.md#71-canonical-document-model) | A fixture revision **MUST** reproduce the same semantic hash and expected inventory from its declared source and seed. | `AC-14-010` |

### 12.2 Measurement and Calibration

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-011` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every quality run **MUST** use a versioned `SCH-14-002` environment profile. | `AC-14-011` |
| `REQ-14-012` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every run **MUST** record an environment fingerprint sufficient to prevent cross-class baseline mixing. | `AC-14-012` |
| `REQ-14-013` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | Every gated latency metric **MUST** use app-owned or equivalence-verified semantic marks for its exact start and end. | `AC-14-013` |
| `REQ-14-014` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every metric sample **MUST** conform to `SCH-14-003` with an explicit non-success outcome when measurement is unavailable. | `AC-14-014` |
| `REQ-14-015` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every distribution **MUST** meet the sample, percentile, raw-data, and exclusion rules in Section 4.2. | `AC-14-015` |
| `REQ-14-016` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Cold and warm conditions **MUST** remain separate registered scenarios with named cache state. | `AC-14-016` |
| `REQ-14-017` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | An environment-specific gate **MUST** follow the calibration algorithm in Section 4.3. | `AC-14-017` |
| `REQ-14-018` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | A metric **MUST** reach the `gated` state in `SM-14-001` before it can decide Supported Release conformance. | `AC-14-018` |
| `REQ-14-019` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Missing samples, marks, fixtures, environments, or functional assertions **MUST** produce a non-passing gate disposition. | `AC-14-019` |

### 12.3 Quality Objectives and Tolerances

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-020` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Startup and native reopen **MUST** satisfy `SLO-14-001` through `SLO-14-004`. | `AC-14-020` |
| `REQ-14-021` | [DES-013](../product-spec.md#52-selection-and-direct-manipulation) | Authoring interaction feedback **MUST** satisfy `SLO-14-005` through `SLO-14-010`. | `AC-14-021` |
| `REQ-14-022` | [DES-003](../product-spec.md#51-canvas-and-viewport) | Authoring and audience frame delivery **MUST** satisfy `SLO-14-011` through `SLO-14-015`. | `AC-14-022` |
| `REQ-14-023` | [DES-041](../product-spec.md#55-layout-and-responsive-design) | Text, vector, layout, scene, and accessibility updates **MUST** satisfy `SLO-14-016` through `SLO-14-020`. | `AC-14-023` |
| `REQ-14-024` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Cross-surface and artifact comparisons **MUST** satisfy every applicable exactness and tolerance row in Section 6. | `AC-14-024` |
| `REQ-14-025` | [PRE-050](../product-spec.md#66-slide-show-and-audience-runtime) | Presentation entry, navigation, builds, transitions, and clock alignment **MUST** satisfy `SLO-14-021` through `SLO-14-026`. | `AC-14-025` |
| `REQ-14-026` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Target-critical readiness and preflight **MUST** satisfy `SLO-14-027` through `SLO-14-029`. | `AC-14-026` |
| `REQ-14-027` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Checkpoint, native save, open, and verify operations **MUST** satisfy `SLO-14-030` through `SLO-14-033`. | `AC-14-027` |
| `REQ-14-028` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Enabled output and interchange profiles **MUST** satisfy `SLO-14-034` through `SLO-14-038`. | `AC-14-028` |
| `REQ-14-029` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Collaboration latency, presence, reconnect, convergence, revocation, recovery, and queue integrity **MUST** satisfy `SLO-14-039`, `SLO-14-040`, and `SLO-14-047` through `SLO-14-052`. | `AC-14-029` |
| `REQ-14-030` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Medium, Large, and Prolonged memory behavior **MUST** satisfy `SLO-14-041` through `SLO-14-043`. | `AC-14-030` |
| `REQ-14-031` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Authoring and runtime recovery **MUST** satisfy `SLO-14-044` and `SLO-14-045` with the declared durability boundary. | `AC-14-031` |

### 12.4 Reliability, Capacity, and Environment Coverage

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-032` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Every supported subsystem **MUST** enforce the finite capacity and admission contract in Section 8.3. | `AC-14-032` |
| `REQ-14-033` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Each released workflow **MUST** meet its rolling reliability target and error-budget policy in Sections 8.1 and 8.2. | `AC-14-033` |
| `REQ-14-034` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Data loss, divergent accepted state, private audience leakage, blank audience frames, and invalid-artifact success **MUST** remain hard-zero outcomes. | `AC-14-034` |
| `REQ-14-035` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every release profile **MUST** enumerate its applicable operating-system and architecture rows from Section 7.1. | `AC-14-035` |
| `REQ-14-036` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every platform claim **MUST** enumerate and test its browser/version applicability under Section 7.2. | `AC-14-036` |
| `REQ-14-037` | [DES-001](../product-spec.md#51-canvas-and-viewport) | Every device claim **MUST** identify its D1, D2, or D3 workflow boundary and applicable window tiers. | `AC-14-037` |
| `REQ-14-038` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Every claimed workflow **MUST** cover each applicable input and assistive-technology row in Section 7.3. | `AC-14-038` |
| `REQ-14-039` | [PRE-061](../product-spec.md#67-review-and-collaboration) | Networked and prolonged evidence **MUST** identify the network, power, thermal, display, and background-load profile. | `AC-14-039` |
| `REQ-14-040` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | A support claim **MUST** use one explicit disposition for every applicable environment-matrix cell. | `AC-14-040` |

### 12.5 Scheduling and Pressure

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-041` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | Interaction hot paths **MUST** exclude unrelated storage, network, indexing, serialization, and telemetry-flush work. | `AC-14-041` |
| `REQ-14-042` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Runtime scheduling **MUST** follow the work-priority order in Section 11.1. | `AC-14-042` |
| `REQ-14-043` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Resource pressure **MUST** follow the degradation ladder in Section 11.2 without violating semantic or hard-zero invariants. | `AC-14-043` |

### 12.6 Metrics, Traces, Logs, and Privacy

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-044` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Every emitted operational signal **MUST** conform to the versioned `SCH-14-006` envelope. | `AC-14-044` |
| `REQ-14-045` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Metrics **MUST** use stable namespaces, explicit buckets, and only the bounded dimensions in Section 9.3. | `AC-14-045` |
| `REQ-14-046` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Traces **MUST** use the causal span hierarchy and ephemeral correlation policy in Section 9.4. | `AC-14-046` |
| `REQ-14-047` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Operational logs **MUST** use stable structured event codes, sanitization, and rate limits. | `AC-14-047` |
| `REQ-14-048` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | Signal correlation **MUST** use random ephemeral identifiers that cannot recover a user, document, entity, asset, or transaction identity. | `AC-14-048` |
| `REQ-14-049` | [ARC-001](../product-spec.md#71-canonical-document-model) | Normal telemetry **MUST** exclude authored content, private presenter data, credentials, locators, and reusable content identities. | `AC-14-049` |
| `REQ-14-050` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Optional product-health and diagnostic collection **MUST** expose the consent and control behavior in Section 9.6. | `AC-14-050` |
| `REQ-14-051` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Every observability data class **MUST** have a declared access and retention class no broader than Section 9.6. | `AC-14-051` |
| `REQ-14-052` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Normal observability overhead **MUST** satisfy `SLO-14-046`. | `AC-14-052` |

### 12.7 Diagnostics and Operations

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-14-053` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A generated diagnostic package **MUST** conform to `SCH-14-007` and its preview/consent rules. | `AC-14-053` |
| `REQ-14-054` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Operational health probes **MUST** use synthetic bounded canaries and avoid opening user content. | `AC-14-054` |
| `REQ-14-055` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Every alert **MUST** identify an owning SLO/profile, severity, privacy class, and runbook. | `AC-14-055` |
| `REQ-14-056` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Every release-critical failure family **MUST** have a runbook satisfying Section 10.3. | `AC-14-056` |
| `REQ-14-057` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A hard-zero breach **MUST** follow `FLOW-14-004` before the affected profile can resume release or rollout. | `AC-14-057` |
| `REQ-14-058` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | A quality regression **MUST** follow `FLOW-14-003` before any baseline or gate change is considered. | `AC-14-058` |
| `REQ-14-059` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every quality run used for acceptance **MUST** produce an immutable `SCH-14-008` bundle. | `AC-14-059` |
| `REQ-14-060` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Quality evidence **MUST** hand off to Volume 15 with exact requirement, SLO, fixture, environment, protocol, and artifact links. | `AC-14-060` |
| `REQ-14-061` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | A quality-budget or metric-definition change **MUST** preserve prior evidence and record rationale, impact, approvers, and a new version. | `AC-14-061` |

---

## 13. Acceptance Criteria

Each `AC-14-NNN` evaluates exactly the `REQ-14-NNN` with the same suffix.

| ID | Pass condition |
|---|---|
| `AC-14-001` | Schema validation accepts a complete fixture manifest and rejects missing profile, hashes, inventory, expected semantics, or limits. |
| `AC-14-002` | The Tiny fixture meets its exact scale and completes create/edit/undo/save/reopen/present/output assertions without a degenerate all-empty workload. |
| `AC-14-003` | The Small fixture meets scale and exercises multi-slide structure, representative content, motion, and persistence with exact inventory. |
| `AC-14-004` | The Medium fixture meets scale and contains every enabled semantic family plus at least one discriminating negative expectation per material family. |
| `AC-14-005` | The Large fixture meets scale, includes hotspot and distributed complexity, and completes all claimed high-capacity workflows without unreported degradation. |
| `AC-14-006` | Valid Stress fixtures reach each declared boundary and produce the registered supported, degraded-safe, or blocked result with no corruption or unbounded work. |
| `AC-14-007` | A four-hour headed Prolonged run completes every minimum activity count, records five-minute windows, repeats the initial workload, and satisfies trend/cleanup gates. |
| `AC-14-008` | Feature-inventory lint verifies the Section 3.2 mix and detector fixtures prove distinct algorithms/states cannot collapse undetected. |
| `AC-14-009` | Every applicable failure variant preserves the base hash, injects one declared condition, and verifies exact failure, fallback, and recovery behavior. |
| `AC-14-010` | Three independent generations from the same source/seed yield identical semantic hashes, inventory, expected traces, and asset identities. |
| `AC-14-011` | Every sampled result resolves to one immutable environment profile containing all required fields. |
| `AC-14-012` | The run fingerprint distinguishes OS, architecture, browser, viewport, DPR, power, network, build mode, and feature configuration and contains no forbidden identity. |
| `AC-14-013` | Each gated metric has app-owned marks or a documented equivalence experiment whose boundary error is below 1 ms or 1 percent, whichever is larger. |
| `AC-14-014` | Metric-schema validation retains every measured and non-success outcome and rejects an unavailable value encoded as zero or success. |
| `AC-14-015` | The run meets minimum warmups/samples, retains raw values, reports p50/p95/p99/worst, and has no unexplained exclusion. |
| `AC-14-016` | Cache-state instrumentation proves cold and warm scenarios start from their declared states and are reported separately. |
| `AC-14-017` | Calibration evidence meets the day/run/stability rules and recomputation produces the published class gate exactly without weakening a hard bound. |
| `AC-14-018` | Metric-state audit finds calibration, stability, mark, fixture, observer, and review evidence before `gated`; removing any prerequisite suspends it. |
| `AC-14-019` | Fixtures with no data, missing marks, timeout, crash, wrong environment, or failed function all yield fail/blocked/inconclusive and never pass. |
| `AC-14-020` | Valid headed reference runs satisfy all four startup/open gates and traces show no unrelated work before interactive readiness. |
| `AC-14-021` | Selection, inspector, typing, drag, hit-test, slide, theme, and command distributions meet every target gate on Tiny, Medium, and applicable Large hotspots. |
| `AC-14-022` | Authoring and presentation frame captures meet p95/p99/missed/long-task gates with zero blank or partial audience frame. |
| `AC-14-023` | Text, vector, responsive layout, scene, and semantic-tree fixtures meet every applicable gate while semantic reference results remain exact. |
| `AC-14-024` | Cross-surface corpus passes semantic exactness first and then every applicable numeric, color, pixel, timing, dimension, and preserved-byte tolerance. |
| `AC-14-025` | Entry, next/previous, build, transition, 60-minute drift, media, audio, and caption runs meet all six gates with identical semantic traces. |
| `AC-14-026` | Medium/Large readiness fixtures enumerate all critical dependencies and meet first/hot/preflight gates using only exact or approved fallback outcomes. |
| `AC-14-027` | Commit scheduling, local checkpoint, save, open, and full verify meet all gates; changes during save remain dirty and no interaction includes storage work. |
| `AC-14-028` | Every enabled output profile meets preflight/throughput/drift gates and independently parsed artifacts satisfy their semantic plans. |
| `AC-14-029` | Multi-client regional and reconnect runs meet adopted Volume 07 percentiles, retain queue order, and converge to identical semantic hashes. |
| `AC-14-030` | Medium/Large peak memory and Prolonged heap/resource trends meet all gates after controlled garbage collection and disposal barriers. |
| `AC-14-031` | Crash/reload and audience-window failure injections meet decision/restore/reopen gates while reporting the exact local, external, or shared durability boundary. |
| `AC-14-032` | Limit tests exercise each capacity row plus parser/queue/cache/worker maxima and observe bounded admission, backpressure, degradation, or rejection. |
| `AC-14-033` | Reliability calculation reconciles numerators/denominators/exclusions, meets each target, and triggers the exact burn policy on synthetic budget consumption. |
| `AC-14-034` | Negative gates inject every hard-zero class and prove each blocks release/rollout even when all aggregate ratios otherwise pass. |
| `AC-14-035` | Release-profile inspection contains a disposition and evidence reference for every applicable OS/architecture row. |
| `AC-14-036` | Browser matrix runs cover frozen current/previous versions for each claimed platform and identify host-dependent gaps explicitly. |
| `AC-14-037` | Device evidence maps each claimed workflow to D1/D2/D3 and W1-W4 boundaries and rejects a broader claim than the tested boundary. |
| `AC-14-038` | Input/applicability ledger and evidence cover every relevant keyboard, pointer, trackpad, touch, pen, IME, AT, clicker, display, and capture row. |
| `AC-14-039` | Every networked/performance run records network, power, thermal, refresh, and background-load state and invalidates on material drift. |
| `AC-14-040` | Matrix lint reports zero blank cells and no `not-applicable` without a requirement/profile rationale. |
| `AC-14-041` | Input-path traces for selection, drag, typing, slide advance, and build contain no unrelated I/O, full serialization/index, or telemetry flush span. |
| `AC-14-042` | Scheduler fault/load tests show all higher priority work starts before queued lower priority work and semantic clocks remain correct. |
| `AC-14-043` | CPU, memory, storage, network, GPU, and battery pressure tests follow the declared order and preserve every hard-zero invariant. |
| `AC-14-044` | Telemetry-schema tests accept complete versioned envelopes and reject unknown, unbounded, or forbidden fields. |
| `AC-14-045` | Metric registry lint finds stable namespace/version/buckets, bounded dimensions, and no high-cardinality values in representative production capture. |
| `AC-14-046` | Trace capture forms valid parent/child phase trees, uses monotonic durations, and cannot correlate back to durable content identity. |
| `AC-14-047` | Structured-log tests verify code/version/severity/outcome, sanitized parameters, rate limiting, and no raw exception/content fallback. |
| `AC-14-048` | Correlation IDs differ across independent operations, expire with the trace window, and cannot be derived from document or transaction fixtures. |
| `AC-14-049` | Static schema scan and dynamic canary scan find no authored content, notes, captions, credentials, locators, or reusable content IDs in normal telemetry. |
| `AC-14-050` | Headed settings/diagnostic workflows expose category controls, preview/consent, opt-out behavior, and unaffected core local operation. |
| `AC-14-051` | Retention jobs expire each data class at or before its maximum and access audits show only authorized roles. |
| `AC-14-052` | A/B observer-control runs meet CPU, main-thread, and network overhead gates for normal sampling. |
| `AC-14-053` | Diagnostic-bundle inspection matches the manifest, hashes every member, excludes default-forbidden data, records consent, and expires under policy. |
| `AC-14-054` | Each health probe uses only synthetic data, stays within limits, and cannot enumerate or open user presentations. |
| `AC-14-055` | Alert fixtures resolve to exactly one owner, SLO/profile, severity, privacy class, and existing runbook. |
| `AC-14-056` | Runbook lint finds every required section and a release-train exercise reaches its documented safe terminal state. |
| `AC-14-057` | A seeded hard-zero breach preserves evidence, applies fail-safe mitigation, prevents resume, and resumes only after fresh accepted evidence. |
| `AC-14-058` | Regression drill confirms correctness, worst samples, phase spans, observer overhead, and fix/revert before any reviewed baseline update. |
| `AC-14-059` | Evidence-schema validation rejects missing registry/fixture/environment/protocol/raw samples/function/artifacts/limitations and accepts a complete immutable bundle. |
| `AC-14-060` | Volume 15 ingestion resolves every bundle to exact requirements, SLOs, fixture/environment/protocol revisions, artifacts, and one evidence disposition. |
| `AC-14-061` | A seeded budget change creates a new version with rationale, impact, approvers, migration/freshness effects, and unchanged historical records. |

---

## 14. Test Protocols and Evidence Handoff

| ID | Protocol | Required execution and evidence |
|---|---|---|
| `TEST-14-001` | Fixture conformance | Validate schemas, counts, hashes, feature mix, nondegeneracy, expected semantics, and reproducibility. |
| `TEST-14-002` | Microbenchmark correctness | Pure deterministic unit benchmarks for validation, hashing, resolution subphases, geometry, text, and operation transforms; never used alone for user latency. |
| `TEST-14-003` | Headed interaction benchmark | Real browser input to visible/semantic/stable marks with raw samples, frame windows, hit testing, and functional assertions. |
| `TEST-14-004` | Headed rendering and frame protocol | DOM/canvas/pixel/semantic capture during authoring and audience motion at fixed refresh/DPR profiles. |
| `TEST-14-005` | Storage and recovery protocol | Real package, object store, provider capability, crash/fault injection, readback, hashes, and durability boundary. |
| `TEST-14-006` | Collaboration load protocol | Real authority/store, independent clients, network shaping, presence load, accepted log, queue, convergence, and recovery. |
| `TEST-14-007` | Runtime/host protocol | Headed runtime plus physical display/input/capture hardware for claimed host-dependent capabilities. |
| `TEST-14-008` | Output throughput/fidelity protocol | Immutable plan, actual writer, independent parser, semantic comparison, pixel/media samples, and destination safety. |
| `TEST-14-009` | Prolonged-use protocol | Four-hour Medium workflow, five-minute windows, repeated workload, pressure injections, resource ownership, cleanup, and trend analysis. |
| `TEST-14-010` | Observability privacy/overhead protocol | Schema fuzzing, forbidden canaries, cardinality, sampling, rate limits, retention, and observer-control A/B runs. |
| `TEST-14-011` | Runbook exercise | Synthetic incident trigger through mitigation, evidence preservation, validation, communication, and closure. |
| `TEST-14-012` | Calibration and regression protocol | Multi-day stable collection, formula recomputation, worst-sample traces, dual regression rule, and baseline-version review. |

Browser-driven `TEST-14-*` evidence is admissible only under Volume 15's visible headed-browser rule. The current repository scripts are implementation inputs; a script that invokes Playwright without headed mode cannot by itself produce release evidence.

### 14.1 Evidence Handoff

Every protocol run emits `SCH-14-008`. Volume 15 assigns an immutable ID using the `EVD-<date>-<sequence>` grammar, validates freshness, and records whether the evidence is current, stale, blocked, failed, or inadmissible. Re-running creates a new `EVD-*`; it never edits an old result.

---

## 15. Traceability and Source Adoption

### 15.1 Requirement Coverage

| Requirement range | Primary quality outcome | Primary protocols |
|---|---|---|
| `REQ-14-001` through `REQ-14-010` | Reproducible representative profile corpus | `TEST-14-001`, `TEST-14-009` |
| `REQ-14-011` through `REQ-14-019` | Valid measurement, calibration, and gating | `TEST-14-003`, `TEST-14-004`, `TEST-14-012` |
| `REQ-14-020` through `REQ-14-031` | Startup, interaction, render, runtime, readiness, persistence, output, collaboration, memory, recovery | `TEST-14-003` through `TEST-14-009` |
| `REQ-14-032` through `REQ-14-043` | Capacity, reliability, matrix coverage, hot paths, and pressure | `TEST-14-005` through `TEST-14-009` |
| `REQ-14-044` through `REQ-14-052` | Structured privacy-safe observability | `TEST-14-010` |
| `REQ-14-053` through `REQ-14-061` | Diagnostics, alerts, runbooks, incidents, regression, and evidence handoff | `TEST-14-011`, `TEST-14-012` |

### 15.2 Adopted Sources

| Source | Adopted authority | Exclusions or resolution |
|---|---|---|
| [Volume 00](00-governance-and-traceability.md) | Requirement, SLO, evidence, status, waiver, and revision rules | None |
| [Volume 05](05-resolution-scene-and-rendering.md) | Scene/resource/surface hooks and semantic-before-pixel conformance | Thresholds and provisional tolerances are owned here. |
| [Volume 06](06-files-assets-and-recovery.md) | Storage hooks, durability boundaries, failure and recovery states | Provider-specific unproven guarantees do not become quality claims. |
| [Volume 07](07-collaboration-identity-and-sharing.md) | Collaboration objectives, convergence, revocation, RPO/RTO, and load protocols | Current isolated modules are not conformance evidence. |
| [Volume 10](10-presentation-runtime.md) | Runtime clocks, readiness, frame privacy, recovery, and event trace | This volume owns thresholds; Volume 10 owns behavior. |
| [Volume 11](11-interchange-and-output.md) | Artifact validation, fidelity dimensions, output throughput boundaries | Enabled labels and file existence are excluded as evidence. |
| [Performance Benchmarks](../../automation/testing/performance-benchmarks.md) | Existing metric IDs, scenario vocabulary, target candidates, environment fingerprint, and stability concept | Historical run output is stale evidence; several marks are provisional and runner paths are stale. |
| [Performance Testing](../../automation/testing/performance-testing.md) | Performance API, CDP memory, frame, and baseline practices | Example thresholds yield to this volume; developer-machine and headless evidence cannot gate release. |
| [Eval Loop Framework](../../automation/eval-loop/eval-loop-framework.md) | Three-layer state capture, temporal detectors, real input, screenshots, and convergence | Capture remains agenda-free; detector-specific filtering cannot replace raw observation. |
| [DOM State Capture](../../automation/eval-loop/dom-state-capture-guide.md) | DOM/store/canvas capture and visual hit-test evidence | Current selectors and store fields are implementation-specific. |
| [Package Scripts](../../../package.json) | Current executable command inventory | Script presence and prior output do not establish metric maturity or headed evidence. |

### 15.3 Known Baseline Constraints

The current performance runner references removed `documentation/03-automation` registry paths, labels several end conditions provisional, caps samples below this volume's release protocol, and uses a scaled-down placeholder for `soak.60min`. These facts require repair before those paths can create current release evidence. This statement is a specification input, not a claim about future repair or current conformance.

---

## 16. Open Decisions

Defaults remain in force until an accepted decision supersedes them.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-14-001` | Dedicated release-runner hardware image and renewal cadence | `PROFILE-R1-2026-01` uses the `ref.win.desktop` requirements in Section 7.1; the image is frozen per release train. | Quality Engineering and Release Governance | First maintained release runner | `SCH-14-002`; `REQ-14-011` through `REQ-14-019`; `PROFILE-R1-2026-01` | `R1-blocking` |
| `OD-14-002` | Final text shaping and cross-platform visual baseline strategy | Same font bytes/profile require exact text semantics; Section 6 cross-platform tolerance applies to pixels. | Rendering Engineering and Quality Engineering | Acceptance of the Volume 05 shaping engine | `REQ-14-023`; `REQ-14-024`; Section 6 | `pre-implementation` |
| `OD-14-003` | 4K/HDR/wide-gamut runtime and output gates | sRGB 1080p60 presentation and 1080p30 video remain baseline; advanced profiles are separate. | Presentation Runtime, Interchange, and Quality Engineering | First advanced display/output claim | `REQ-14-025`; `REQ-14-028`; `REQ-14-035` through `REQ-14-040` | `non-blocking` |
| `OD-14-004` | Provider-specific cloud fixed-overhead and throughput gates | Use the phase formula in Section 5.7 and make no stronger provider claim than verified capability. | Reliability, Provider, and Quality Engineering | Provider certification | `SCH-14-004`; `REQ-14-028`; `REQ-14-033`; Section 5.7 | `pre-implementation` |
| `OD-14-005` | Stress-profile portable package maximum above 3 GB | 3 GB encoded assets is the test ceiling; larger input follows the limits policy. | Files, Assets, and Quality Engineering | ZIP/container profile decision | `SCH-14-001`; `REQ-14-006`; `REQ-14-032` | `non-blocking` |
| `OD-14-006` | Production telemetry regional retention and aggregation topology | Section 9.6 maxima and the content-free schema apply; deployments may retain less. | Privacy, Security, Observability, and Operations Engineering | Production observability deployment review | `SCH-14-006`; `REQ-14-044` through `REQ-14-052`; Section 9.6 | `pre-implementation` |
| `OD-14-007` | Browser current/previous support window by release tier | `PROFILE-R1-2026-01` freezes current and previous stable Edge and Chrome versions at candidate cut; later tiers make no broader claim without a reviewed matrix. | Quality Engineering and Release Governance | First R2 Supported Release matrix | `SCH-14-002`; `REQ-14-035`; `REQ-14-036`; `REQ-14-040`; `PROFILE-R1-2026-01` | `non-blocking` |
| `OD-14-008` | Real-device lab coverage for pen, displays, clickers, and capture hardware | Claims remain Preview or not-supported without current physical evidence. | Quality Engineering and Accessibility Engineering | A profile first claims the affected device or a maintained device lab becomes available | `REQ-14-037` through `REQ-14-040`; `TEST-14-007`; `TEST-14-008` | `non-blocking` |

---

## 17. Identifier Counts

| Namespace | Count | Range |
|---|---:|---|
| Requirements | 61 | `REQ-14-001` through `REQ-14-061` |
| Schemas | 8 | `SCH-14-001` through `SCH-14-008` |
| Invariants | 16 | `INV-14-001` through `INV-14-016` |
| State machines | 3 | `SM-14-001` through `SM-14-003` |
| Flows | 5 | `FLOW-14-001` through `FLOW-14-005` |
| SLOs | 78 | `SLO-14-001` through `SLO-14-078` |
| Acceptance criteria | 61 | `AC-14-001` through `AC-14-061` |
| Test protocols | 12 | `TEST-14-001` through `TEST-14-012` |
| Open decisions | 8 | `OD-14-001` through `OD-14-008` |

The counts above describe this draft inventory and do not claim implementation, passing evidence, or release conformance.