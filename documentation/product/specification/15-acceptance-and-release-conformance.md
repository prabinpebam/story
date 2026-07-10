# Volume 15: Acceptance and Release Conformance

> **Specification ID:** `STORY-SPEC-15`
> **Volume:** 15 (16 volumes total, 00-15)
> **Status:** Normative draft
> **Version:** 2.0.0-draft
> **Owner:** Quality Engineering and Release Governance
> **Approvers:** Product, Design, Engineering, Quality, Accessibility, Security, Privacy, and Operations
> **Last reviewed:** July 10, 2026
> **Review cadence:** At every conformance-profile, evidence-policy, waiver-policy, or release-gate change and at least once per release train
> **Normative scope:** Applicability and coverage matrices, fixture and golden corpora, verification protocols, evidence records and invalidation, waivers, release tiers, release gates, exact release decisions, post-release validation, and rollback decisions
> **Explicit non-ownership:** Product feature behavior, canonical document meaning, quality thresholds, implementation architecture, delivery sequencing, and implementation status
> **Parent specification:** [Story Product Specification System](README.md)
> **Governed by:** [Volume 00 - Governance and Traceability](00-governance-and-traceability.md)
> **Quality dependency:** [Volume 14 - Quality Attributes and Observability](14-quality-attributes-and-observability.md)
> **Supersedes:** Conflicting acceptance, test-evidence, headed-browser, waiver, completion, and release-gate claims in lower-authority automation, roadmap, status, and domain documents where this volume is more precise
> **Implementation status:** Out of scope; see the dated [Capability Audit](../capability-audit.md). This volume creates no passing evidence, completion claim, waiver, or release decision.

---

## Table of Contents

1. [Purpose and Authority](#1-purpose-and-authority)
2. [Conformance Model](#2-conformance-model)
3. [Applicability and Coverage Matrices](#3-applicability-and-coverage-matrices)
4. [Fixture and Golden Corpus](#4-fixture-and-golden-corpus)
5. [Verification Protocols](#5-verification-protocols)
6. [Evidence Records and Invalidation](#6-evidence-records-and-invalidation)
7. [Findings, Flakiness, and Quarantine](#7-findings-flakiness-and-quarantine)
8. [Waivers](#8-waivers)
9. [Release Tiers and Gates](#9-release-tiers-and-gates)
10. [Exact Release Decision Process](#10-exact-release-decision-process)
11. [Conformance Objectives](#11-conformance-objectives)
12. [Atomic Requirements](#12-atomic-requirements)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Protocol and Evidence Inventory](#14-protocol-and-evidence-inventory)
15. [Traceability and Source Adoption](#15-traceability-and-source-adoption)
16. [Open Decisions](#16-open-decisions)
17. [Identifier Counts](#17-identifier-counts)

---

## 1. Purpose and Authority

This volume defines how Story decides whether a requirement, surface, lifecycle boundary, artifact, environment, release profile, and final candidate conform. It prevents a narrow green check from being promoted into a broad product claim.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are interpreted under BCP 14, RFC 2119, and RFC 8174 as governed by [Volume 00](00-governance-and-traceability.md#2-normative-language).

### 1.1 Acceptance Thesis

Acceptance is a graph closure problem:

```text
accepted requirement revision
  x declared conformance profile
  x applicable surface
  x applicable lifecycle boundary
  x entity/operation durability boundary
  x role/connectivity state
  x platform/input/accessibility environment
  -> criterion
  -> protocol
  -> immutable evidence
  -> release gate
  -> signed decision
```

No filename, test count, screenshot, implementation status, feature flag, menu label, or aggregate score closes this graph by itself.

### 1.2 Acceptance Authority

| Artifact | Decides | Cannot decide |
|---|---|---|
| Feature-owning volume | Intended semantic behavior and local acceptance condition | Release tier or evidence freshness |
| [Volume 14](14-quality-attributes-and-observability.md) | Workloads, quality objectives, tolerances, support classes, and diagnostics | Final release disposition |
| This volume | Applicability, protocol sufficiency, evidence admissibility/freshness, waivers, tiers, and release decision | Feature semantics or implementation status |
| Capability audit/status | Dated current-state observation | Product scope or conformance |
| Roadmap | Sequencing | Acceptance or waiver |
| Test implementation | A protocol execution mechanism | Its own adequacy or broad coverage claim |

### 1.3 No Completion Inference

An accepted specification is not delivered. Delivered code is not verified. A passing test is not current evidence until its exact product, protocol, fixture, environment, and artifact revisions are bound. A current evidence record proves only its declared cells. A released profile says nothing about excluded profiles.

### 1.4 Missing Normative Owner

A manifest-listed volume or required owner that is absent, unresolved, or contradictory creates a `missing-specification` finding. It cannot be replaced by this acceptance volume or classified not applicable merely because implementation exists.

---

## 2. Conformance Model

### 2.1 Independent Axes

| Axis | Allowed values | Meaning |
|---|---|---|
| Specification maturity | proposed, draft, accepted, superseded, retired, rejected | Approval of intended behavior |
| Implementation disposition | missing, partial, delivered, removed, unknown | Production-route state |
| Verification disposition | not-evaluated, passing, failing, blocked, waived, not-applicable, inadmissible | Criterion result for one cell |
| Evidence freshness | missing, current, stale, expired, invalidated | Whether evidence can support the candidate |
| Release applicability | included, excluded-by-profile, deferred-by-profile, not-applicable | Scope of one declared release profile |
| Support disposition | supported, supported-with-degradation, preview, not-supported, not-applicable | Published environment/workflow claim |

These values remain separate in storage, UI, reports, and release decisions.

### 2.2 Conformance Profile Schema

#### `SCH-15-001 ConformanceProfile`

| Field | Required content |
|---|---|
| `profileId`, `profileVersion` | Stable ID and immutable version |
| `releaseTier` | `R0-internal`, `R1-preview`, `R2-supported`, or `R3-assured` |
| `specificationRevision` | Exact specification version and content hash |
| `requiredVolumeSet` | Nonempty immutable set copied from the selected profile's Required Volume Set and reconciled against the specification manifest |
| `requirementSetHash` | Hash of included accepted requirements and explicit exclusions |
| `productCommit`, `buildId` | Exact candidate source and reproducible build identity |
| `surfaces`, `lifecycles` | Applicable codes from Section 3 |
| `outputs`, `runtimeModes` | Enabled and claimed profiles |
| `roles`, `connectivity` | Applicable authorization and network states |
| `environments` | Volume 14 environment profile IDs and support dispositions |
| `accessibility` | Applicable input, AT, language, and output profiles |
| `qualityRegistryVersion` | Exact Volume 14 budget registry |
| `allowedWaiverClasses` | Tier-bounded policy, never a list of preapproved defects |
| `evidenceFreshnessPolicy` | Exact age, commit, and invalidation rules |
| `decisionAuthorities` | Required approving roles |

`requiredVolumeSet` is derived from the selected profile, then reconciled against the specification manifest; it is never inferred from candidate-advertised workflows and is not candidate-editable. For `PROFILE-R1-2026-01`, the default set is the profile-declared Volumes 00 through 15, inclusive, so it is nonempty and includes the present Volume 13 Security, Privacy, and Trust owner. A release profile is invalid when the set is empty, omits Volume 00 or 01, omits an applicable numbered owner, contains a volume absent from the manifest, or names a workflow whose owner is contradictory or not explicitly reviewed for that profile.

### 2.3 Applicability Cell Schema

#### `SCH-15-002 ApplicabilityCell`

```text
cellId, requirementId, criterionId, profileId
surfaceCode, lifecycleCode, entityFamily, operationFamily
outputProfile, runtimeMode, inputClass, displayClass, failureClass
role, capability, connectivityState
environmentProfileId, accessibilityProfile
applicability, rationale, owner
protocolIds, requiredEvidenceClasses, riskClass
verificationDisposition, evidenceIds, waiverId
```

`applicability` is one of `required`, `not-applicable`, `excluded-by-profile`, or `deferred-by-profile`. Every non-required value contains a normative source and reason. Blank, inferred, inherited-without-review, and `unknown` are invalid for a release candidate.

### 2.4 Coverage Ledger Schema

#### `SCH-15-003 CoverageLedger`

The ledger is a normalized set of `SCH-15-002` cells plus hashes of the active requirement, criterion, matrix-axis, protocol, fixture, and environment registries. Derived pivot tables are views. The normalized ledger is the only editable release-coverage source.

### 2.5 Verification Record Schema

#### `SCH-15-004 VerificationRecord`

```text
verificationId, cellId, criterionRevision, protocolId, protocolVersion
executionId, result, startedAtUtc, endedAtUtc
evidenceIds, findingIds, waiverId, limitations
reviewer, reviewedAtUtc, freshnessState
```

`result` is `pass`, `fail`, `blocked`, `inconclusive`, or `not-applicable`. `waived` is not a test result; it is a release disposition attached to an unchanged fail/blocked/missing result.

### 2.6 Conformance Invariants

| ID | Invariant |
|---|---|
| `INV-15-001` | Every included accepted requirement has at least one criterion, protocol, applicable cell, and current admissible evidence record. |
| `INV-15-002` | Every criterion evaluates one or more named requirements, and every evidence record evaluates named criteria and cells. |
| `INV-15-003` | A pass is scoped to one exact product/specification/protocol/fixture/environment/artifact set. |
| `INV-15-004` | Missing, blocked, inconclusive, stale, invalidated, expired, inadmissible, and failing remain distinguishable. |
| `INV-15-005` | A waiver changes release disposition only; it never changes the underlying verification result or evidence. |
| `INV-15-006` | `not-applicable` requires a normative reason and cannot mean absent implementation, unavailable test, unsupported platform, or deferred work. |
| `INV-15-007` | An aggregate pass cannot conceal a failed cell, severe finding, missing artifact, unsupported environment, or nonwaivable condition. |
| `INV-15-008` | Protocol capture records observations before detectors filter, normalize, pair, or judge them. |
| `INV-15-009` | User-observable browser evidence is produced only by a visible headed browser; headless Playwright output is inadmissible. |
| `INV-15-010` | Test retries and reruns append outcomes; they never erase an earlier failure or mutate its artifacts. |
| `INV-15-011` | Artifact-producing workflows are not accepted from DOM, screenshot, MIME, extension, or nonzero-byte evidence alone. |
| `INV-15-012` | Visual acceptance never substitutes for semantic, editability, accessibility, privacy, or preservation acceptance. |
| `INV-15-013` | Manual evidence names operator, procedure, environment, observations, limitations, and artifact references. |
| `INV-15-014` | Evidence and release records are append-only and content-addressed. |
| `INV-15-015` | Candidate evidence is invalidated when any dependency capable of changing the observed outcome changes. |
| `INV-15-016` | Release authorities cannot approve a tier broader than the closed matrices and current evidence support. |
| `INV-15-017` | A required reviewer can stop a release for a nonwaivable or unresolved applicable risk. |
| `INV-15-018` | R3 Assured has no active waivers, quarantined gates, or incomplete manual/hardware cells. |
| `INV-15-019` | A released artifact and its decision record identify one exact candidate build and conformance profile. |
| `INV-15-020` | Rollback preserves the release evidence and decision history it supersedes. |
| `INV-15-021` | A conformance profile cannot close over an empty requirement set or an omitted applicable numbered volume. |
| `INV-15-022` | Volumes 00, 01, 13, 14, and 15 are required for every external profile; other volumes are required whenever their owned responsibility appears in an advertised workflow or artifact. |

---

## 3. Applicability and Coverage Matrices

### 3.1 Applicability Codes

#### Surface codes

| Code | Surface |
|---|---|
| `SUR-HUB` | Document Hub/open/import/recovery |
| `SUR-SHELL` | Global shell, command bar, status, panels, dialogs |
| `SUR-NAV` | Slides, layers, outline, grid/sorter, notes, system navigators |
| `SUR-CANVAS` | Visual canvas and direct-manipulation overlays |
| `SUR-INSPECT` | Inspector, property editors, flyouts, data editors, sequencer |
| `SUR-MASTER` | Master, layout, component, and narrative-component edit roots |
| `SUR-SYSTEM` | Narrative, edition, library, compatibility, readiness workflows |
| `SUR-AUDIENCE` | Audience presentation surface |
| `SUR-PRESENTER` | Private Presenter View and recovery controls |
| `SUR-RECORDER` | Recording setup, capture, and review |
| `SUR-NATIVE` | Native `.str` package, checkpoint, provider object |
| `SUR-CLIP` | System/internal clipboard |
| `SUR-OUTPUT` | PPTX, PDF, print, video, web, SVG, raster, reports |
| `SUR-SERVICE` | Collaboration, identity, sharing, library, audience services |
| `SUR-DIAG` | Diagnostics, audit, telemetry, evidence, release reports |

#### Lifecycle codes

| Code | Boundary |
|---|---|
| `LC-CREATE` | Create, import, instantiate, register, or admit |
| `LC-READ` | Resolve, inspect, render, search, navigate, or announce |
| `LC-EDIT` | Draft, preview, commit, reorder, transform, or configure |
| `LC-CANCEL` | Cancel, reject, abort, or pointer/focus interruption |
| `LC-UNDO` | Undo, redo, inverse, no-op, or history retention |
| `LC-SAVE` | Checkpoint, save, publish, close, and reopen |
| `LC-COLLAB` | Submit, accept, transform, converge, offline, and reconnect |
| `LC-MIGRATE` | Validate, migrate, preserve unknowns, and forward compatibility |
| `LC-RESOLVE` | Inheritance, layout, scene, readiness, and degradation |
| `LC-PRESENT` | Compile show, enter, navigate/build, recover, and exit |
| `LC-OUTPUT` | Preflight, write, validate, cancel, and finalize artifact |
| `LC-DELETE` | Delete, tombstone, restore, purge, revoke, and cleanup |
| `LC-FAIL` | Partial, offline, corrupt, conflict, permission, quota, pressure, and recovery |

### 3.2 Requirement x Surface x Lifecycle Matrix

The release ledger contains one or more concrete `SCH-15-002` rows for every active requirement. This table defines the minimum expansion by normative owner; local requirement applicability can add cells but cannot remove these defaults without a reviewed not-applicable rationale.

| Owner | Minimum surfaces | Minimum lifecycle boundaries |
|---|---|---|
| Volume 00 governance | `SUR-DIAG` and every artifact that makes a conformance claim | create, read, migrate/change, fail |
| Volume 01 constitution | Every advertised user surface | create, read, present, output, fail |
| Volume 02 experience | `SUR-HUB`, `SUR-SHELL`, `SUR-NAV`, `SUR-CANVAS`, `SUR-INSPECT`, `SUR-SYSTEM`, audience/presenter where named | create, read, edit, cancel, present, fail |
| Volume 03 document | Every canonical producer/consumer, native, service, output | create, read, edit, undo, save, collab, migrate, resolve, delete, fail |
| Volume 04 mutation | Every mutation producer, history, service, migration/import | create, edit, cancel, undo, save, collab, migrate, delete, fail |
| Volume 05 scene | Canvas, navigator preview, audience, presenter, recorder, output | read, edit preview, resolve, present, output, fail |
| Volume 06 files/assets | Hub, shell status, native, service/provider, scene resource consumers | create, read, edit references, undo pins, save, collab, migrate, delete, fail |
| Volume 07 collaboration | Shell, navigator/canvas presence, comments, service, native checkpoint, diagnostics | create, read, edit, undo, save, collab, migrate epoch, delete/revoke, fail |
| Volume 08 design authoring | Canvas, layers, inspector, master/component roots, native, clipboard, all resolved outputs | create, read, edit, cancel, undo, save, collab, migrate, resolve, output, delete, fail |
| Volume 09 presentation authoring | Navigator/grid/outline/notes/master/motion/recording, native, runtime, output | create, read, edit, cancel, undo, save, collab, migrate, resolve, present, output, delete, fail |
| Volume 10 runtime | Setup, audience, presenter, recorder, remote/service, diagnostics | create session, read, cancel, resolve, present, output trace, delete/end, fail |
| Volume 11 interchange/output | Hub/import, system/compatibility, native preservation, clipboard, every enabled output | create/admit, read, edit decisions, cancel, save source, migrate/map, resolve, output, delete temp, fail |
| Volume 12 accessibility/i18n | Every interactive surface, native semantics, runtime, outputs | create, read, edit, cancel, undo, save, collab, migrate, resolve, present, output, fail |
| Volume 13 security/privacy/trust | Every trust boundary and affected surface | create, read, edit, save, collab, present, output, delete/retention, fail |
| Volume 14 quality | Every measured/observed surface and diagnostics | read, measure, calibrate, fail, recover |
| Volume 15 conformance | Coverage, evidence, waiver, decision, release, rollback | create, read, invalidate, waive, decide, publish, rollback |

### 3.3 Entity/Operation x Undo/File/Collaboration/Migration Matrix

Codes in the four right columns are `R` required, `C` conditional when the operation is enabled, and `N` not applicable only for runtime-only state. Every `R` or `C` expands to an applicability cell and protocol evidence.

| Entity family | Representative operations | Undo/redo | Native file/reopen | Collaboration/replay | Migration/unknowns |
|---|---|:---:|:---:|:---:|:---:|
| Document metadata/page setup | set, clear, resize policy, fields | R | R | R | R |
| Sections/slides/custom shows/narratives/editions | create, duplicate, move, hide, delete, substitute, restore | R | R | R | R |
| Masters/layouts/placeholders | create, map, reset, detach, restore, reconcile, delete | R | R | R | R |
| Themes/styles/variables/modes | create, bind, alias, update, delete, publish/apply | R | R | R | R |
| Components/instances/variants/overrides | instantiate, swap, override, reset, detach, source update | R | R | R | R |
| Scene hierarchy/layout | create, transform, reparent, reorder, constrain, layout edit | R | R | R | R |
| Shapes/vectors/booleans/masks | parameter edit, point/path edit, operand/mask edit, flatten | R | R | R | R |
| Rich text/typography | insert, delete, mark, paragraph/list, IME commit, style | R | R | R | R |
| Fill/stroke/effect stacks | add, set, reorder, toggle, delete, multi-edit | R | R | R | R |
| Tables | cell/range edit, row/column, merge, formula, style | R | R | R | R |
| Charts/linked data | data edit, family, series/axis, refresh snapshot | R | R | R | R |
| Diagrams/equations | structure, layout, source edit, convert | R | R | R | R |
| Media/assets | register, reference, crop/trim, replace, relink/embed, remove | R | R | R | R |
| Motion/timelines/transitions | add, target, reorder, timing, trigger, Morph map | R | R | R | R |
| Notes/comments/accessibility metadata | edit, anchor, reply, resolve, reading order, captions | R | R | R | R |
| Rehearsal/recording tracks | accept timing, track/take selection, trim, retake, delete | R | R | C | R |
| Preservation/opaque source | retain, classify, dirty-scope rewrite, explicit discard | C | R | C | R |
| Sharing/grants/audit | invite, role, revoke, transfer, restore | N | C | R | R |
| Editor selection/view/tool/panels | select, focus, viewport, preview, panel state | N | N | N except ephemeral presence | N |
| Runtime position/overlays/laser/unsaved ink | navigate, pause, black/white, pointer, transient ink | N | N except recovery checkpoint | C session sync | N |
| Explicit save-ink/accepted recording | convert runtime state to authored transaction | R | R | C | R |

For each row, acceptance proves operation identity and outcome, inverse or declared non-undoable boundary, semantic round trip, independent-client replay where collaborative, migration determinism, and preservation of stable identity/unknown data. A unit test for one column cannot satisfy another column.

### 3.4 Output Fidelity Matrix

Required dimensions: `S` semantic structure, `E` editability, `V` visual/audio appearance, `B` behavior/timing, `A` accessibility, `P` privacy/preservation, and `I` independent artifact validation.

| Output profile | Required fidelity contract | Mandatory dimensions | Minimum evidence |
|---|---|---|---|
| Native `.str` | Exact canonical semantics, stable IDs, unknown preservation, integrity, reopen | S, E, V through scene, B, A, P, I | Production save/close/reopen, semantic hash, package graph, assets, migrations |
| Story clipboard | Versioned editable closure with remapped IDs and portable fallbacks | S, E, V, A, P, I | Flavor inventory, parsed internal payload, receiving-context tests, failed-cut safety |
| SVG | Volume 11 declared tier, exact bounds, safe references, text policy | S where represented, E tier, V, A, P, I | Parsed XML/reference closure, sanitizer, pixels, report |
| Raster | Exact dimensions/profile/alpha and declared static state | V, P, I plus semantic source linkage | Header/profile parse, pixel comparison, no silent crop, report |
| PDF | Page plan, live/vector/flatten policy, tags when claimed | S, E as declared, V, A, P, I | Independent parser, tags/fonts/links/page boxes, pixels, report |
| Print/spool | Immutable page plan and host-capability truth | S, V, A where available, P, I | Spool artifact parse, preview parity, host acceptance not physical-completion claim |
| Video | Deterministic runtime trace, frames, audio, captions, privacy | S trace, V, B, A, P, I | Container decode, frame samples, audio/caption/event drift, report |
| Portable web | Versioned player semantics, integrity, CSP, offline and browser matrix | S, V, B, A, P, I | Manifest/hash parse, headed playback, network/CSP audit, accessibility tree |
| PPTX preservation-first | Per-feature F0-F5, untouched byte preservation, valid package | S, E, V, B, A, P, I | OPC graph, mappings, preserved hashes, Office target matrix, reimport, report |
| PPTX clean | Target-native or declared fallback with no silent loss | S, E tier, V, B tier, A, P, I | Generated package parse, target app, reimport, semantic/visual/behavior comparisons |
| Compatibility report | Actual writer/validator decisions, same issue IDs in human/machine form | S, A, P, I | Schema validation, issue reconciliation, artifact hashes |

An enabled output command receives every applicable row. A format with no writer, validator, report mapping, accessibility policy, and artifact protocol is `not-supported`, not passing or not applicable.

### 3.5 Runtime Mode/Input/Display/Failure Matrix

Runtime cells use result codes: `X` required exact behavior, `D` required declared degradation, `B` must block before audience reveal, and `N` not applicable with rationale.

#### Mode x input

| Mode | Keyboard | Pointer/HUD | Touch | Pen/ink | Clicker | Network remote | Timer/link/media | Assistive technology |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Preview | X | X | X when claimed | D/N | X where mapped | D/N | X | X |
| Rehearsal | X | X | X when claimed | X when captured | X | D/N | X | X |
| Recording | X | X | X when claimed | X when enabled | X | D/N | X | X |
| Live presentation | X | X | X when claimed | X when enabled | X | X when enabled | X | X |
| Kiosk | Restricted X | Policy X | Policy X | N by default | N by default | Policy X | X | Essential X |

#### Display x required proof

| Display class | Required behavior | Evidence |
|---|---|---|
| One window, deliberate windowed | Audience-clean root, full controls by policy, no fullscreen request | Headed DOM/pixel/input capture |
| One display plus separate Presenter View | Role handshake, private presenter root, stable audience | Two visible headed contexts, message and privacy capture |
| Two physical displays | Chosen assignment, DPR/scale, fullscreen target, role privacy | Physical display matrix and screenshots |
| Popup/fullscreen denied | Explicit fallback without position loss | Permission-denial headed workflow |
| Role swap | Privacy barrier before new role paint | Frame-by-frame DOM/pixel/message evidence |
| Hotplug/disconnect | Audience stable; presenter reassign/collapse by policy | Physical host injection and semantic checkpoint |
| Audience window loss/reopen | Authority and semantic position retained | Close/reopen headed workflow and event trace |
| Authority window/process loss | Authorized recovery/election without private leak | Fault injection, role state, checkpoint, messages |
| Recording capture display | Consented selected source only; indicator and stop behavior | Real permission/source interruption and artifact track inspection |

#### Failure x mode result

| Failure | Preview | Rehearsal | Recording | Live presentation | Kiosk |
|---|---|---|---|---|---|
| Empty/invalid show plan | B | B | B | B | B |
| Required scene unresolved | D/B | D/B | D/B and preserve chunks | Hold last frame, D/B | Safe screen, D/B |
| Optional media/resource failure | D | D | D and gap/fallback | D without navigation block | D without loop storm |
| Popup/fullscreen/display denial | D | D | D | D | B or configured D |
| Network loss | X local/cached | X local/cached | X eligible tracks | X local navigation | X cached/fallback |
| Sleep/background throttle | Suspend/resync | Suspend/resync | Mark capture gap | Hold/resync | Configured resume/restart |
| Memory pressure | Degrade/evict | Degrade/evict | Retain recording-critical | Retain active frame | Retain safe frame |
| Capture device loss | N | D if analysis enabled | Stop track, preserve chunks, D/B | N unless live captions | N |
| Window/authority failure | Rebuild/exit | Recover | Recover tracks/session | Hold/recover/end | Configured restart/resume |
| Privacy or integrity breach | End/block | End/block | Stop capture/end | Safe frame/end | Safe screen/end |

Every runtime row also verifies event-trace equality, no blank frame, input serialization, focus, audience privacy, resource cleanup, and recovery checkpoint compatibility.

### 3.6 Role/Permission/Connectivity Matrix

Capability codes are `allow`, `policy`, and `deny`. Server/service enforcement is authoritative; UI state is additional evidence.

| Capability | Owner | Co-owner | Editor | Commenter | Viewer | Presenter |
|---|---|---|---|---|---|---|
| View authorized document | allow | allow | allow | allow | allow | allow |
| Mutate authored content | allow | allow | allow | deny | deny | deny |
| Comment/reply | allow | allow | allow | allow | deny | policy |
| Resolve any thread | allow | allow | policy | deny | deny | deny |
| Export/download/copy/print | allow | allow | policy | policy | policy | policy |
| Present authorized revision | allow | allow | allow | deny | policy | allow |
| Record/capture | policy | policy | policy | deny | deny | policy |
| Invite/create share link | allow | allow | policy | deny | deny | deny |
| Change role/revoke | allow | allow | deny | deny | deny | deny |
| Transfer ownership/delete | allow | policy | deny | deny | deny | deny |
| View audit/private diagnostics | policy | policy | deny | deny | deny | deny |

| Connectivity state | Required behavior for allowed mutation role | Required behavior for denied/read role |
|---|---|---|
| Online clean | Current grant and head before action | Read/present only within current grant |
| Online pending | Local tentative state distinct until acknowledgment | No forged mutation despite UI tampering |
| Offline clean | Local inspection; editing only if offline policy allows | Cached read only within policy |
| Offline pending | Durable ordered queue, local-only label, no shared claim | No pending mutation creation |
| Reconnecting | Refresh auth, epoch, permission, head before submit | Refresh grant before protected reads |
| Conflict/reconciling | Preserve accepted and tentative intent; explicit resolution | Read stable accepted state if allowed |
| Revoked | Stop submit/read as policy requires; bounded recovery copy for unshared work | No metadata/content enumeration |
| Epoch changed | Block replay; fork/copy/discard | Reopen authorized current lineage only |
| Service unavailable | Preserve local state and distinguish durability | No privilege escalation through fallback |

The full cross-product tests every capability through direct API/service calls and representative headed UI. A disabled UI control alone does not prove denial.

### 3.7 Platform/Accessibility Applicability Matrix

| Profile family | Required platform classes | Required accessibility/input variants | Required output/runtime variants |
|---|---|---|---|
| Desktop authoring Supported | Every claimed Windows/macOS/Linux browser row from Volume 14 | Mouse, keyboard only, 200 percent zoom, forced colors/high contrast where supported, reduced motion, screen-reader representative | Native save/reopen, clipboard, presentation entry, enabled outputs |
| Hybrid authoring Supported | Claimed Windows tablet/iPad class | Touch, pen where claimed, hardware keyboard, orientation, 200 percent zoom, screen reader | Save/recovery, presentation, bounded output |
| Companion Supported | Claimed iOS/Android class | Touch, screen reader, large text, orientation, keyboard where supported | Open, navigate, review/comment, notes, remote/present, bounded correction |
| Presentation Supported | Every claimed desktop/tablet/mobile playback browser | Keyboard, pointer/touch, screen reader, reduced motion, forced colors, captions | Fullscreen/windowed, denial fallback, media, recovery |
| Presenter View Supported | Claimed desktop host/browser | Keyboard, screen reader, zoom, localization, high contrast | One/two display, popup denial, close/reopen, role swap |
| Accessible output profile | Writer environment plus target reader/tool | Document language, reading order, alternatives, captions, tables/charts, keyboard player where applicable | Parsed artifact plus manual AT sample |
| International authoring profile | Claimed OS/browser combinations | Real IME, LTR/RTL, complex scripts, locale formatting, pseudo-localization | Native round trip and declared outputs |

Each matrix cell declares `required`, `not-supported`, or `not-applicable`; Preview is a support disposition, not a reason to omit the cell. Automated emulation supplements but does not replace real hardware/AT where platform behavior is the claim.

### 3.8 Matrix-Wide Closure Rules

1. The active requirement set is generated from accepted normative sources and includes tombstoned/superseded relationships.
2. Every requirement has a requirement x surface x lifecycle row.
3. Every authored entity/operation family has undo/file/collaboration/migration dispositions.
4. Every enabled output has all fidelity dimensions and an independent validator.
5. Every claimed runtime mode has input, display, and failure cells.
6. Every role/capability has online, offline, reconnect, conflict, revoked, and epoch-change disposition where applicable.
7. Every platform claim has accessibility/input and output/runtime applicability.
8. Every required cell has criterion, protocol, fixture, environment, current evidence, and result.
9. Every non-required cell has a reviewed normative rationale.
10. Counts in every derived view reconcile to the normalized ledger without duplicate credit.

---

## 4. Fixture and Golden Corpus

### 4.1 Fixture Manifest

#### `SCH-15-005 FixtureManifest`

| Field | Required content |
|---|---|
| Identity | Stable fixture ID, semantic version, family, owner, status |
| Source | Generator version/seed or source artifact hash and provenance |
| Licensing/privacy | Redistribution, confidential-data, synthetic/real classification, retention |
| Requirements | Exact `REQ-*`, `AC-*`, and matrix cells exercised |
| Preconditions | Feature flags, role, connectivity, environment, setup state |
| Actions | Ordered semantic and real-input actions |
| Oracles | Semantic, visual, artifact, event, accessibility, security, and failure expectations |
| Negatives | Plausible false implementation the fixture must reject |
| Variants | Empty, nil, boundary, large, malformed, failure, locale, accessibility |
| Hashes | Canonical input, expected semantic outputs, assets, goldens |
| Limits | Expected resource bounds and timeout |
| Change record | Rationale, reviewers, invalidated evidence, predecessor/successor |

### 4.2 Golden Manifest

#### `SCH-15-006 GoldenManifest`

A golden records golden ID/version, fixture ID/version, oracle type, production generator/reader versions, environment scope, normalization, tolerance/masks, expected semantic/artifact hash, human review status, source commit, creation protocol, limitations, and supersession.

Goldens are expectations, not evidence. Updating a golden invalidates dependent evidence and requires a reason independent of the candidate output. Blindly accepting the current output is forbidden.

### 4.3 Corpus Taxonomy

| Corpus family | Minimum contents | Primary oracle |
|---|---|---|
| `COR-DOC` canonical model | Every entity kind, empty/nil/clear/inherit, references, order, unknowns, tombstones | Schema, canonical JSON, semantic hash |
| `COR-OPS` operations/history | Every operation family, inverse, no-op, coalescing, rejection, replay, interleaving | Before/after hashes, operations, diagnostics |
| `COR-SCENE` resolution/render | Inheritance ranks, variables, components, layout, text, paint, media, accessibility | Scene projection, provenance, semantic capture, pixels |
| `COR-FILE` native/storage | Shards, assets, unknown objects, providers, interrupted saves, checkpoints, migrations | Package graph, hashes, reopen, recovery |
| `COR-COLLAB` collaboration | Concurrent scalar/order/text/vector/data edits, offline, gaps, retries, revocation | Accepted log, queue, final hashes, UI states |
| `COR-DESIGN` design authoring | Selection, transforms, vectors, text, layout, reuse, paint, layers, clipboard | Semantic result, interaction timeline, pixels, round trip |
| `COR-PRES` presentation authoring | Slides, masters/layouts, data objects, notes, motion, rehearsal, recording | Semantic result, event trace, tracks, round trip |
| `COR-RUNTIME` delivery | Every mode/input/display/failure cell, builds, transitions, media, captions, recovery | Session snapshots, event trace, frames, messages |
| `COR-INTEROP` PPTX/import | Real and synthetic Office profiles, unknowns, corruption, active content, round trip | OPC graph, mappings, preserved hashes, Office render |
| `COR-OUTPUT` artifacts | PDF, print, video, web, SVG, raster, clipboard, compatibility report | Independent parser, semantic inventory, visual/media checks |
| `COR-A11Y` accessibility/i18n | Keyboard, focus, canvas semantics, reading order, AT, IME, bidi, outputs | Accessibility tree/events, Unicode, artifact semantics, manual AT |
| `COR-SEC` trust/privacy | Malformed/untrusted input, permissions, secrets, cross-window/remote, telemetry canaries | Denial, unchanged state, scans, audit |
| `COR-PERF` quality | Volume 14 Tiny through Prolonged profiles and failure variants | Raw samples, functional assertions, traces, trends |
| `COR-RESCUE` failure/recovery | Fault at every durable/authority/runtime/output boundary | Preserved state, terminal outcome, no-loss/privacy assertions |

### 4.4 Golden Types

| Type | Use | Update rule |
|---|---|---|
| Semantic golden | Canonical state, scene, event trace, accessibility structure | Exact review against specification; no visual approval shortcut |
| Diagnostic golden | Stable codes, addresses, severity, recovery | Prose localization excluded; code change requires compatibility review |
| Visual golden | Same-environment pixels or approved cross-platform comparison | Mask/tolerance review; authored content cannot be masked |
| Artifact golden | Parsed package/page/media/web/clipboard inventory and normalized hash | Generated by production writer, verified independently |
| Preservation golden | Untouched source byte hashes and relationship reachability | Byte changes require explicit owned-scope rationale |
| Interaction golden | Raw action/state timeline and expected temporal invariants | Real input only; no direct handler substitution |
| Manual reference | Hardware/AT/user-observable expected result | Two-person review for critical profiles |

### 4.5 Corpus State - `SM-15-001`

| State | Meaning | Release use |
|---|---|---|
| `proposed` | Fixture purpose and owner exist | None |
| `reviewed` | Schema, requirements, negatives, provenance reviewed | Protocol development |
| `active` | Reproducible, bounded, discriminating, licensed, and hashed | Release evidence |
| `quarantined` | Ambiguous oracle, privacy/license issue, or harness defect | No release credit |
| `superseded` | New version replaces it with migration links | Historical evidence only |
| `retired` | Requirement/profile removed by accepted decision | Historical only |

### 4.6 Corpus Update Flow - `FLOW-15-001`

1. Identify the requirement or defect the fixture must discriminate.
2. Define expected semantics before generating candidate output.
3. Minimize while retaining the discriminating property.
4. Add boundary, negative, and failure variants.
5. Produce goldens through the approved independent oracle path.
6. Review provenance, licensing, privacy, limits, and portability.
7. Run against a known-good and intentionally false implementation or mutation.
8. Version manifests and invalidate dependent evidence.

---

## 5. Verification Protocols

### 5.1 Protocol Definition

#### `SCH-15-007 ProtocolDefinition`

Each `TEST-*` protocol defines owner, version, applicable risk and matrix cells, setup, fixtures, production boundaries, allowed substitutions, real-input requirements, environment, steps, capture schema, detector versions, assertions, retries, timeouts, artifacts, privacy, cleanup, pass/fail/block conditions, and known limitations.

### 5.2 Protocol Layers

| Layer | Required purpose | Cannot prove alone |
|---|---|---|
| Unit | Pure schemas, algorithms, reducers, transforms, parsers, validators, and negative cases | Routed UI, browser paint, real files/services, AT, hardware |
| Integration | Real module boundaries, production Store/services, files, providers, authority, worker/adapter contracts | Full user interaction, visible paint, cross-window privacy |
| Headed E2E | Real browser input, focus, hit testing, DOM/canvas paint, workflow, recovery, multiple contexts | Native artifact semantics without parsing, physical hardware not emulated |
| Eval | Agenda-free timeline, temporal/semantic detectors, screenshots/pixels, repeated real workflows | Formal format validity or unsupported matrix cells |
| Artifact | Actual writer/clipboard/save output parsed by independent readers and compared semantically/visually | User setup/decision usability by itself |
| Manual/hardware/AT | Human-observed accessibility, IME, display, clicker, pen, capture, printer/Office behavior | Deterministic algorithm breadth without automation |
| Performance/soak | Volume 14 marks, samples, frames, memory, capacity, trends | Correctness unless functional assertions run first |
| Fault/security | Boundary injection, authorization, malformed input, privacy scans, durability/rescue | Ordinary usability and visual craft |

### 5.3 Repository Playwright Rule

All Playwright execution in this repository is visible headed execution.

1. Every Playwright command includes `--headed`, uses a configuration that sets `headless: false`, or uses the visible Playwright UI/debug mode.
2. The browser window remains visible for the run; minimizing, hiding, or substituting a headless/virtual-only browser invalidates browser evidence.
3. A trace, screenshot, or video captured by a headless run does not rehabilitate it.
4. A test that functionally passes headless and fails headed is failing.
5. A test that cannot run headed is blocked, not exempt.
6. Unit and non-browser integration protocols may run without Playwright; they cannot claim headed E2E coverage.

Current release-safe command forms are:

| Purpose | Command form | Evidence status |
|---|---|---|
| Unit/integration Vitest | `npm test` or a targeted `npx vitest run <path>` | Admissible for its declared non-browser boundary |
| Coverage | `npm run test:coverage` | Supplementary; percentage is not semantic coverage |
| Full Playwright | `npm run test:e2e:headed` | Candidate headed protocol, subject to metadata and visibility |
| Targeted Playwright | `npx playwright test <spec-or-grep> --headed` | Candidate headed protocol |
| Playwright debug/UI | `npm run test:e2e:debug` or `npm run test:e2e:ui` | Diagnostic/manual evidence when artifacts are recorded |
| Default Playwright script without headed enforcement | `npm run test:e2e` | Prohibited for conformance until the script itself enforces headed execution |
| Existing performance wrappers that omit headed enforcement | `npm run perf:bench`, `npm run perf:bench:gate`, `npm run perf:soak` | Inadmissible for release until they launch visible headed Playwright and satisfy Volume 14 |

This table describes present command wiring. Future script changes can alter the command form only when the headed invariant remains explicit and testable.

### 5.4 Production Boundary Rule

Protocols use production Store, mutation, resolver, file writer/reader, collaboration authority, runtime reducer, output writer, and UI routes for the boundary claimed. State seeding may establish a valid fixture before the action under test; it cannot bypass the behavior being accepted. Mocks are allowed only for a boundary explicitly out of scope and are disclosed in evidence.

### 5.5 Eval Capture Rule

Eval capture records raw-enough real state in execution order before detector judgment. It includes applicable document/store, DOM, canvas/pixels, interaction state, accessibility tree/events, service/operation stream, session/event trace, resource/readiness, and artifacts. Capture does not pair, filter, normalize, or omit data merely because a known detector does not use it. Bounded capture is achieved through focused fixture and trigger design.

### 5.6 Protocol Selection by Risk

| Risk class | Typical change | Minimum protocols |
|---|---|---|
| `C0-editorial` | Link/wording with no behavior | Link/ID/ASCII/schema lint plus human review |
| `C1-local` | Pure helper or isolated control with no durable semantics | Unit plus focused integration; headed E2E when user-visible |
| `C2-workflow` | Routed command, panel, canvas gesture, notes, runtime control | Unit/integration plus headed E2E and eval; artifact if durable output |
| `C3-cross-boundary` | Document schema, history, files, collaboration, scene, output, accessibility | Unit, integration, headed E2E, eval, artifact, fault, applicable manual |
| `C4-critical` | Data loss, auth, privacy, recording, audience roles, migration, recovery | All applicable protocols, adversarial corpus, independent review, runbook exercise |

A low code-diff size does not lower risk when a shared schema, serializer, renderer, permission, or release gate changes.

### 5.7 Core Protocol Identifiers

| ID | Protocol |
|---|---|
| `TEST-15-001` | Specification, identifier, link, ASCII, schema, and traceability lint |
| `TEST-15-002` | Unit/model protocol using pure and mutation-testing fixtures |
| `TEST-15-003` | Integration/contract protocol through production module boundaries |
| `TEST-15-004` | Visible headed Playwright workflow protocol using real input |
| `TEST-15-005` | Agenda-free eval capture and deterministic/temporal/semantic detector protocol |
| `TEST-15-006` | Native file, clipboard, and output artifact parsing/round-trip protocol |
| `TEST-15-007` | Multi-client collaboration, role, permission, offline, and convergence protocol |
| `TEST-15-008` | Runtime mode/input/display/failure and audience-privacy protocol |
| `TEST-15-009` | Accessibility, internationalization, real IME, and manual AT protocol |
| `TEST-15-010` | Volume 14 benchmark, frame, memory, capacity, and prolonged-use protocol |
| `TEST-15-011` | Fault injection, crash, durability, migration, recovery, and runbook protocol |
| `TEST-15-012` | Security, privacy, malformed-input, authorization, secret, and telemetry protocol |
| `TEST-15-013` | Platform/browser/device/hardware/Office/printer/codec compatibility protocol |
| `TEST-15-014` | Release dossier reconciliation, independent review, decision, and rollback drill |

### 5.8 Protocol Registry and Templates

The generated [Protocol Registry](protocol-registry.md) and [machine-readable registry](protocol-registry.json) compile every allocated `TEST-*` definition under `SCH-15-007`. `TEST-01-001` is the canonical product familiarity/Story-native benchmark; `BENCH-PRODUCT-001` is its permanent alias and cannot receive duplicate coverage credit.

Protocol templates are versioned contracts:

| Template | Required production boundary and evidence |
|---|---|
| `unit-model` | Deterministic inputs, pure/model boundary, seeded negative/mutation cases, exact semantic assertions, no user-surface claim |
| `integration-contract` | Production module/service/store/worker/writer boundary, success/failure routes, mocks disclosed, correlated state/output |
| `headed-e2e` | Visible non-minimized headed browser, real input, focus/hit-test/paint, semantic terminal state, failure/rescue, same-run media |
| `artifact-roundtrip` | Production writer, actual bytes, independent parser/consumer, semantics, preservation, visual/media, destination integrity |
| `accessibility-manual` | Actual claimed AT/IME/hardware environment, versioned tasks, operator, observations, blockers, relevant artifacts |
| `performance-soak` | Correctness first, exact environment/profile, semantic marks, raw samples, frames/memory/trends, thresholds and hard zeros |
| `security-fault` | Adversarial/fault corpus, exact trust or durability boundary, unchanged protected state, bounded rescue, audit evidence |
| `usability-benchmark` | Qualified cohorts, frozen tasks/fixtures, objective validators, interventions, time/error/confidence, privacy-safe raw and aggregate results |

A generated protocol record is `draft-incomplete` until every required fixture, environment, step, capture, assertion, cleanup, and terminal-condition field names a materialized versioned artifact. `draft-incomplete` protocols provide no release coverage.

---

## 6. Evidence Records and Invalidation

### 6.1 Execution Schema

#### `SCH-15-008 TestExecution`

| Field | Required content |
|---|---|
| Identity | Execution ID, protocol ID/version, attempt number, parent execution if rerun |
| Candidate | Git commit, build ID/hash, dirty state and patch hash, dependency lock hash |
| Specification | Spec version/hash, requirement/criterion/cell revisions |
| Fixture | Fixture/golden IDs and hashes, seed, failure schedule |
| Environment | Volume 14 environment ID/fingerprint, browser/host, headed-visible attestation |
| Command | Exact command, arguments, working directory, relevant allowlisted environment variables |
| Timing | UTC start/end and monotonic durations |
| Observations | Raw capture references in execution order |
| Detectors | Detector versions, inputs, outcomes, false-positive disposition |
| Results | Pass/fail/blocked/inconclusive per assertion and cell |
| Artifacts | `SCH-15-010` references and hashes |
| Limitations | Mocks, substitutions, unobserved boundaries, environmental incidents |
| Operator | Automation identity or human operator/reviewer |

### 6.2 Evidence Record Schema

#### `SCH-15-009 EvidenceRecord`

An immutable evidence record contains:

```text
evidenceId: EVD-<YYYYMMDD>-<three-digit-sequence>
recordVersion, createdAtUtc, evidenceClass
productCommit, buildId, buildHash, dirtyPatchHash|null
specificationVersion, specificationHash
requirements[], criteria[], applicabilityCells[]
protocolId, protocolVersion, executionIds[]
fixtureAndGoldenRefs[], environmentProfileId, environmentFingerprintHash
result, findings[], waiverRefs[], observationSummary
artifacts[], artifactManifestHash
freshnessState, invalidationRefs[], limitations
producer, independentReviewer, signatureOrAttestation
```

`result` is `pass`, `fail`, `blocked`, or `inconclusive`. Waivers are referenced but do not convert it to pass.

This specification defines the record grammar and required evidence classes; it does not create an `EVD-*` instance. An instance exists only after a protocol execution and immutable publication.

### 6.3 Artifact Reference Schema

#### `SCH-15-010 ArtifactReference`

| Field | Required content |
|---|---|
| `artifactId` | Stable execution-scoped identity |
| `kind`, `mediaType` | Raw capture, log, trace, screenshot, video, semantic JSON, package, report, binary output, manual form |
| `sha256`, `byteLength` | Full content integrity and size |
| `storageRef` | Durable access-controlled location, never a developer-local-only path for release evidence |
| `createdBy`, `createdAtUtc` | Producer and time |
| `privacyClass`, `retentionClass` | Access and expiry policy |
| `sourceExecutionId` | Exact execution |
| `semanticRole` | Which assertion/cell it supports |
| `redaction`, `normalization` | Versioned transformations, if any |

### 6.4 Invalidation Record

#### `SCH-15-011 InvalidationRecord`

An invalidation record contains ID, triggering revision/event, affected evidence IDs and cells, reason code, dependency path, detected time, actor/automation, resulting freshness state, required rerun scope, and superseding evidence IDs when available.

### 6.5 Evidence Lifecycle - `SM-15-002`

| State | Meaning | Release use |
|---|---|---|
| `draft` | Execution artifacts still assembling | None |
| `reviewable` | Schema and artifact closure pass | Review only |
| `current` | Exact dependencies match candidate/profile and review passes | Applicable release gate |
| `stale` | Informative but a dependency changed or age policy exceeded | Diagnosis only |
| `expired` | Time-bound manual/service exercise exceeded maximum age | None |
| `invalidated` | Harness, fixture, detector, environment, or product defect makes result unreliable | None |
| `inadmissible` | Protocol violated a foundational rule, including headless browser evidence | None |
| `superseded` | New evidence covers the same cells at a later valid candidate | Historical only |

### 6.6 Invalidation Triggers

| Change | Minimum invalidation scope |
|---|---|
| Product source or generated asset | Every evidence cell whose dependency graph reaches the change; exact-candidate release evidence always reruns |
| Dependency lock, browser, runtime, compiler, build flag | Affected environment/protocol cells |
| Requirement, invariant, schema, SLO, criterion, or matrix applicability | All evidence interpreting the changed normative outcome |
| Protocol steps, assertions, capture, detector, timeout, retry, or parser | All evidence from the changed protocol version unless equivalence is formally proven |
| Fixture, seed algorithm, golden, tolerance, mask, or failure schedule | All evidence using the changed item |
| Environment support matrix or host capability | Affected environment cells |
| Discovered false positive/negative or flaky harness | Evidence whose conclusion may change |
| Security/privacy incident affecting artifact integrity/access | Affected evidence and release decisions |
| Waiver expiry or scope change | Release disposition only; underlying evidence remains unchanged |
| Manual/hardware/AT evidence older than 30 days | Expired for candidate release unless the profile sets a stricter bound |
| Disaster-recovery/runbook evidence older than 90 days | Expired; exact candidate compatibility still requires review |
| Performance baseline older than 30 days or changed runner image | Stale; candidate metrics remain required at exact commit |

### 6.7 Dirty Worktree Rule

Exploratory evidence can bind to a commit plus exact dirty patch hash. Release evidence binds to the exact clean candidate commit and reproducible build. Dirty evidence becomes current only if a clean build of a commit containing byte-equivalent changes reruns or a deterministic equivalence protocol proves the executable and artifacts identical. A verbal claim that changes are the same is insufficient.

### 6.8 Evidence Production Flow - `FLOW-15-002`

1. Resolve exact requirement, criterion, cells, profile, and risk.
2. Select protocols and active fixtures/goldens.
3. Verify candidate, environment, headed visibility, and production boundaries.
4. Capture raw observations and artifacts before detector judgment.
5. Run deterministic, temporal, semantic, artifact, and manual checks as applicable.
6. Preserve every attempt and finding.
7. Validate schemas, hashes, privacy, and artifact closure.
8. Publish a new `EVD-<date>-<sequence>` record.
9. Independently review high-risk evidence.
10. Attach the record to exact coverage cells without broadening its scope.

### 6.9 Evidence Invalidation Flow - `FLOW-15-003`

1. Observe a dependency, age, integrity, or protocol change.
2. Traverse evidence dependency links to affected cells.
3. Append `SCH-15-011`; do not edit the original record.
4. Mark affected coverage cells missing current evidence.
5. Determine the smallest sufficient rerun without hiding shared-boundary impact.
6. Produce new evidence or retain the cell as stale/failing/blocked.

### 6.10 Evidence Classes

| Class | Minimum contents |
|---|---|
| `EVC-SPEC` | Link/ID/schema/ASCII/traceability outputs and reviewed diff |
| `EVC-MODEL` | Unit/integration raw results, fixture hashes, mutation/negative results |
| `EVC-HEADED` | Visible headed attestation, real input trace, screenshots/video, DOM/canvas/state/accessibility capture |
| `EVC-EVAL` | Agenda-free timeline, detector outputs, repeated-run summaries, semantic findings |
| `EVC-ARTIFACT` | Actual artifact, independent parser output, semantic/visual/media comparisons, compatibility report |
| `EVC-COLLAB` | Authority config, independent clients, accepted stream, queues, fault schedule, final hashes |
| `EVC-MANUAL` | Operator, hardware/AT versions, procedure, observations, evidence media, limitations, reviewer |
| `EVC-QUALITY` | Volume 14 registry, raw samples, aggregates, traces, functional result, environment |
| `EVC-RESCUE` | Failure point, preserved state, recovery actions, terminal state, no-loss/privacy checks |
| `EVC-RELEASE` | Candidate/profile matrices, evidence index, findings, waivers, approvals, decision, signatures |

---

## 7. Findings, Flakiness, and Quarantine

### 7.1 Finding Schema

#### `SCH-15-012 Finding`

A finding contains stable ID, severity, requirement/criterion/cells, product/spec/protocol/fixture/environment revisions, observation, expected outcome, user/data/security/accessibility impact, reproducibility, artifacts, owner, disposition, fix/decision link, retest evidence, and discovery/closure timestamps.

### 7.2 Severity

| Severity | Meaning | Default release effect |
|---|---|---|
| `S0-critical` | Data loss/corruption, auth bypass, private audience leak, acknowledged-operation loss, blank/reordered delivery, malicious execution, false valid-artifact claim | Nonwaivable no-go |
| `S1-high` | Critical workflow unavailable, inaccessible only path, severe fidelity loss, unrecoverable failure, supported environment broken | No-go unless tier allows an approved bounded waiver and Section 8 permits |
| `S2-medium` | Material bounded workflow defect with workaround and no silent loss | Preview waiver possible; Supported only under strict waiver policy |
| `S3-low` | Minor noncritical defect or craft issue with preserved semantics | Reviewed disposition; can remain known issue by tier |
| `S4-info` | Observation with no conformance failure | No gate effect, retained for context |

### 7.3 Finding State - `SM-15-003`

```text
open -> triaged -> fixing -> reviewable -> verified-closed
              -> waived-active -> waiver-expired -> open
              -> duplicate
              -> not-a-defect with evidence
```

`cannot-reproduce` is not terminal. It remains open/inconclusive until evidence identifies a harness/environment cause or repeated protocol closes the finding.

### 7.4 Flakiness

A flaky result is any criterion whose outcome changes across equivalent executions without a specified semantic input change. Release-blocking suites require zero unresolved flaky cells. Retrying is diagnostic; it does not convert failure into pass. A quarantined test contributes no coverage, and every cell it previously covered becomes missing current evidence until a replacement protocol passes.

### 7.5 Eval Convergence

Eval scenarios require at least three independent clean runs with zero critical and zero warning anomalies and no actionable semantic finding. Info observations require written disposition. A fixed seed can be one run but cannot be the only run when concurrency, timing, non-deterministic service response, or hardware variation is material.

---

## 8. Waivers

### 8.1 Waiver Schema

#### `SCH-15-013 WaiverRecord`

| Field | Required content |
|---|---|
| Identity/status | Waiver ID, revision, proposed/active/rejected/expired/revoked |
| Scope | Exact requirement, criterion, cells, profile, candidate/release, environment, artifact |
| Underlying result | Failing, blocked, missing, stale, or inadmissible; never rewritten |
| User impact | Observable consequence, affected population, data/accessibility/privacy/security impact |
| Risk analysis | Likelihood, severity, blast radius, detectability, rollback/recovery |
| Mitigation | Tested workaround, guard, feature disablement, monitoring, support action |
| Disclosure | Release note, compatibility report, UI warning, support communication as applicable |
| Accountability | Owner, issue, target fix, retest protocol |
| Time bound | Effective release, expiry date, maximum one release train unless renewed as a new waiver |
| Approvals | Product, Engineering, Quality, and affected Accessibility/Security/Privacy/Operations authorities |
| Evidence | Failure evidence, mitigation evidence, decision record, artifact hashes |

### 8.2 Nonwaivable Conditions

The following cannot be waived into any conforming external tier:

- silent authored-content deletion, corruption, or identity/order loss;
- authentication/authorization bypass or active-content execution;
- undisclosed user-content transmission, credential/secret exposure, or presenter-private leakage;
- acknowledged collaboration operation loss or divergent accepted semantic state;
- blank/uninitialized audience frames or reordered builds in an advertised presentation path;
- inaccessible only path for a critical workflow in a claimed accessibility profile;
- claiming a higher fidelity, accessibility, preservation, support, or completion tier than evidence proves;
- reporting success for an invalid, partial, corrupt, or unverified artifact;
- headless Playwright evidence offered as headed browser evidence;
- missing evidence represented as pass or not applicable;
- a absent normative owner for the behavior being claimed;
- any nonwaivable condition inherited from [Volume 00](00-governance-and-traceability.md#122-non-waivable-conditions) or hard-zero condition from [Volume 14](14-quality-attributes-and-observability.md#84-reliability-state---sm-14-003).

### 8.3 Waiver State - `SM-15-004`

| State | Transition guard |
|---|---|
| `proposed` | Complete schema and failure evidence |
| `under-review` | Risk owners assigned and mitigation tested |
| `active` | All required approvals, exact candidate/profile, disclosure, expiry |
| `rejected` | Risk unacceptable or condition nonwaivable |
| `revoked` | Scope/assumption changed, mitigation failed, or authority revoked |
| `expired` | Date, release train, candidate, profile, requirement, or evidence scope expired |
| `closed` | Fresh evidence passes and release no longer relies on waiver |

### 8.4 Waiver Flow - `FLOW-15-004`

1. Preserve the failing/missing evidence and classify severity.
2. Check nonwaivable conditions and tier policy.
3. Narrow exact cells and disable broader claims.
4. Test mitigation and recovery with current evidence.
5. Record user impact, disclosure, owner, fix, expiry, and retest.
6. Obtain unanimous required approvals.
7. Attach the active waiver to coverage and release decision.
8. Revoke automatically on dependency or scope change.
9. Expire without silent renewal; a renewal is a new record and decision.

### 8.5 Waiver Limits by Tier

| Tier | Allowed waiver scope |
|---|---|
| R0 Internal | Findings can remain open; no external conformance claim |
| R1 Preview | S2/S3 and selected S1 only with safe mitigation, conspicuous preview disclosure, and no nonwaivable condition |
| R2 Supported | S3 and exceptional bounded S2 only; no core workflow, data, security, privacy, accessibility-critical, fidelity-claim, durability, or hard-zero waiver |
| R3 Assured | No active waiver |

A prior waiver does not create precedent or lower the requirement. Counts and details remain visible in the release record.

---

## 9. Release Tiers and Gates

### 9.1 Tier Definitions

| Tier | Audience and claim | Required gate |
|---|---|---|
| `R0-internal` | Developer/research use; no external support or conformance claim | Build and minimum safety for named testers; open findings visible |
| `R1-preview` | Opt-in external preview with explicit bounded scope and instability disclosure | Preview matrix closed, critical safety/privacy/data/accessibility gates pass, current headed/artifact evidence for advertised flows |
| `R2-supported` | General supported release for a published environment/workflow profile | Every included MUST passes or has a permitted bounded waiver, all matrix/evidence/quality/recovery gates close, no blocker |
| `R3-assured` | High-assurance profile for declared critical workflows/environments | R2 plus no waivers/quarantine, independent rerun/review, full fault/DR/manual matrix, stricter evidence freshness |

No tier is a percentage. A lower tier is not a partial R2 claim; it publishes a narrower explicit profile.

### 9.2 Universal Gates

Every tier requires:

1. Exact candidate commit/build/profile/specification identities.
2. Reproducible build and dependency lock.
3. No unresolved merge markers, generated-source drift, or unknown candidate bytes.
4. Coverage ledger schema and count reconciliation.
5. All nonwaivable and hard-zero checks pass.
6. Findings, evidence, waivers, and exclusions disclosed honestly.
7. Release decision record exists before distribution.

### 9.3 R0 Internal Gate

- Candidate builds and launches in its named internal environment.
- No known test artifact contains credentials or unconsented user content.
- Data-destructive experiments use disposable synthetic fixtures or explicit backup/recovery.
- The UI and documentation label the profile internal/experimental.
- No status system reports external conformance.

### 9.4 R1 Preview Gate

- The default R1 profile is [PROFILE-R1-2026-01](profiles/R1-preview.md), with its nonempty immutable profile-derived required-volume set and requirement set.
- Product familiarity and Story-native outcome claims use [BENCH-PRODUCT-001](benchmarks/familiarity-and-story-native.md) as the default frozen benchmark protocol.
- Active requirement set and all advertised matrix cells close.
- Every advertised user workflow has current `EVC-HEADED`; headless results receive no credit.
- Every advertised durable/output workflow has current `EVC-ARTIFACT`.
- S0 findings are zero; nonwaivable conditions are zero.
- Security/privacy/accessibility critical paths and recovery pass for the preview profile.
- Volume 14 hard ceilings/floors pass; calibrated noncritical targets can be `measured-not-gated` only when disclosed and not represented as supported performance.
- Preview limitations and active waivers are visible before user commitment where material.

### 9.5 R2 Supported Gate

- `SLO-15-001` through `SLO-15-010` pass.
- Every included accepted `MUST` has current pass evidence or a permitted active waiver; every `SHOULD` divergence has reviewed rationale.
- Requirement/surface/lifecycle, entity durability, output, runtime, role, and platform/accessibility matrices are 100 percent resolved.
- Unit, integration, visible headed E2E, eval, artifact, manual/hardware/AT, quality, fault/recovery, and security protocols run wherever applicable.
- All advertised outputs independently validate and reports match actual artifacts.
- All advertised browser/platform/device/input/AT cells have current evidence.
- Volume 14 quality metrics used by the profile are gated and pass on candidate commit.
- S0/S1 findings are zero; unresolved release-gate flakiness/quarantine is zero.
- Disaster recovery, rollback, migration, and runbooks are current and compatible with the candidate.
- Required authorities unanimously approve the exact dossier.

### 9.6 R3 Assured Gate

- All R2 gates pass with no active waiver.
- No required protocol is quarantined, blocked, inconclusive, stale, or expired.
- An independent operator reruns every C4 protocol on the signed candidate build.
- Physical hardware/AT/Office/printer/codec evidence covers every claimed cell without emulation-only substitution.
- Four-hour Prolonged and disaster-recovery exercises run on the signed candidate configuration.
- Reproducible-build comparison yields equivalent executable/artifact hashes under the declared normalization.
- Release and rollback drills are witnessed by Quality and Operations.

### 9.7 Gate Manifest

#### `SCH-15-014 ReleaseCandidateManifest`

The manifest contains release/candidate ID, tier/profile, commit/build hashes, clean-state proof, dependency and generated-source hashes, specification/requirement/matrix/quality-registry hashes, environment support matrix, protocol/fixture/golden versions, evidence index, findings, waivers, known limitations, migration/rollback plan, monitoring/runbook version, and requested authorities.

### 9.8 Decision Record

#### `SCH-15-015 ReleaseDecisionRecord`

The immutable record contains decision ID/version, candidate manifest hash, evidence dossier hash, meeting/time, required authorities and votes, dissent, decision (`go`, `go-preview`, `hold`, `no-go`, `rollback`), exact approved profile/tier, waivers, exclusions, release artifacts and hashes, publication target, monitoring window, rollback triggers, communications, and signatures/attestations.

---

## 10. Exact Release Decision Process

### 10.1 Roles and Authority

| Role | Required responsibility |
|---|---|
| Release Owner | Freezes candidate/profile, assembles dossier, executes decision and publication; cannot override a no-go |
| Product Authority | Confirms advertised scope, user impact, compatibility disclosure, and tier |
| Engineering Authority | Confirms candidate identity, architecture/migration, known defects, and rollback feasibility |
| Quality Authority | Independently validates matrices, protocol sufficiency, evidence, findings, and gate reconciliation |
| Accessibility Authority | Required for every user-facing R1-R3 profile; can stop inaccessible critical workflow/output claims |
| Security/Privacy Authority | Required for every R1-R3 profile with user data, identity, sharing, external content, capture, telemetry, or distribution |
| Operations/Reliability Authority | Required for networked services, collaboration, hosted output, R2, and R3 |
| Evidence Custodian | Validates hashes, immutability, access, retention, and dossier reproducibility |

For R2 and R3, Product, Engineering, Quality, and Accessibility are always required. Security/Privacy and Operations are required whenever their scope is nonempty; an external supported product normally makes both nonempty. One required `no-go` or unresolved required vote prevents `go`. Abstention by a required authority is `hold`, not approval.

### 10.2 Candidate State - `SM-15-005`

```text
draft
  -> frozen
  -> evidence-collecting
  -> review-ready
  -> decision-review
      -> approved
      -> preview-approved
      -> held
      -> rejected
approved|preview-approved -> publishing -> monitoring -> promoted
                                          -> rollback-pending -> rolled-back
```

Any candidate byte, dependency, build flag, requirement, profile, matrix, protocol, fixture/golden, waiver, or release artifact change after `frozen` creates a new candidate revision and returns to `evidence-collecting` for affected cells.

### 10.3 Decision Steps

1. **Freeze intent.** The Release Owner records requested tier, profile, scope, environments, outputs, compatibility claims, and user communications.
2. **Freeze candidate.** Record clean commit, dependency lock, generated assets, build configuration, feature flags, and reproducible build hashes.
3. **Freeze normative inputs.** Record specification and quality-registry hashes; copy the non-candidate-editable required-volume set from the selected profile and reconcile it against the manifest; fail on an empty set, a missing manifest entry, or an omitted applicable owner; then derive the active accepted requirement set.
4. **Build matrices.** Expand all Section 3 axes and reject blank, unknown, duplicate-credit, or unjustified not-applicable cells.
5. **Select protocols.** Assign risk class and protocols/fixtures/environments to every required cell.
6. **Execute foundational gates.** Run specification/schema, build, unit, integration, migration, and static security checks.
7. **Execute user-observable gates.** Run visible headed Playwright workflows and eval captures. Any headless execution is excluded and rerun headed.
8. **Execute durable/artifact gates.** Save/reopen, clipboard, collaboration, output, compatibility, parser, and preservation protocols produce actual artifacts.
9. **Execute matrix/manual gates.** Run platform/browser/device/input/AT/IME/display/clicker/capture/Office/printer/codec procedures for claimed cells.
10. **Execute quality/rescue gates.** Run candidate Volume 14 metrics, capacity, Prolonged as tier requires, fault injection, recovery, security/privacy, and runbook exercises.
11. **Ingest evidence.** Publish immutable `EVD-*` records, verify artifact hashes/access, and attach only to exact cells.
12. **Invalidate and reconcile.** Apply all dependency/age invalidations; reconcile requirement, cell, evidence, finding, and waiver counts to zero unexplained difference.
13. **Triage findings.** Assign severity, owner, disposition, fix/retest, or proposed waiver while preserving every attempt.
14. **Review waivers.** Reject nonwaivable cases; test mitigation; obtain exact tier approvals and disclosure before dossier lock.
15. **Assemble dossier.** Freeze `SCH-15-014`, evidence index, matrices, quality report, findings, waivers, migration, rollback, monitoring, and communications.
16. **Independent review.** Quality and specialist authorities reproduce ledger totals and sample raw evidence/artifacts without relying on the candidate author's summary.
17. **Decision meeting.** Each required authority records `go`, `hold`, or `no-go` with rationale against the exact dossier hash.
18. **Resolve decision.** Unanimous `go` yields `go`; R1 can yield `go-preview`; any no-go yields `no-go`; abstention/missing/stale input yields `hold`. Conditional go is forbidden because conditions must become completed evidence or an approved waiver before the vote.
19. **Sign and publish.** Create `SCH-15-015`, sign/attest release artifacts, publish only the approved profile/tier, limitations, compatibility, and waiver disclosures.
20. **Monitor.** Observe the declared window and hard-zero/quality/error-budget triggers using the exact runbooks.
21. **Promote or rollback.** Close monitoring only when gates remain healthy; execute `FLOW-15-006` on a rollback trigger.

### 10.4 Decision Outcomes

| Outcome | Exact meaning |
|---|---|
| `go` | Exact R2/R3 candidate/profile approved for named targets; no broader claim |
| `go-preview` | Exact R1 candidate/profile approved with preview disclosure and active permitted waivers |
| `hold` | Evidence, authority, environment, artifact, or mitigation incomplete; candidate is not releasable |
| `no-go` | Gate or risk is unacceptable for requested tier; a changed candidate requires a new decision |
| `rollback` | Published candidate exceeds a rollback trigger or loses conformance; prior approved artifact/profile is restored or service disabled safely |

### 10.5 Rollback Triggers

Immediate rollback/disable evaluation begins for any hard-zero event, security/privacy breach, migration corruption, acknowledged-operation loss, invalid output reported as valid, audience private-data leak, blank/reordered presentation path, unrecoverable supported-workflow failure, or error-budget state required by Volume 14. A severe monitoring regression can hold promotion while diagnosis runs.

### 10.6 Rollback Flow - `FLOW-15-005`

1. Freeze rollout and preserve incident/release evidence.
2. Classify hard-zero, affected profiles, users, data, and artifacts.
3. Stop unsafe writes/capture/services and protect recovery sources.
4. Restore the last signed compatible release or disable the affected capability through a tested safe flag/profile.
5. Verify migration compatibility, user work, permissions, audience privacy, and service authority.
6. Publish incident/compatibility communication at the required scope.
7. Create an immutable rollback decision linked to both releases.
8. Require a new candidate, fresh invalidated evidence, and full decision process before re-release.

### 10.7 Release Dossier Flow - `FLOW-15-006`

The dossier is generated from normalized registries and immutable evidence, never manually reconciled spreadsheets alone. Generation fails on hash mismatch, duplicate requirement/cell/evidence credit, blank applicability, stale evidence, expired waiver, unresolved required vote, or artifact-reference failure.

---

## 11. Conformance Objectives

| ID | Objective | Release gate |
|---|---|---:|
| `SLO-15-001` | Active accepted requirement parent and criterion closure | 100 percent |
| `SLO-15-002` | Required applicability cells with explicit disposition | 100 percent |
| `SLO-15-003` | Required cells with protocol, active fixture, environment, and current evidence | 100 percent |
| `SLO-15-004` | Evidence artifacts with verified SHA-256 and durable reference | 100 percent |
| `SLO-15-005` | Eval scenarios with at least three clean independent runs | 100 percent applicable scenarios |
| `SLO-15-006` | Unresolved flaky or quarantined release-gate cells | 0 |
| `SLO-15-007` | Claimed platform/browser/device/input/accessibility cells with current evidence | 100 percent |
| `SLO-15-008` | Expired or out-of-scope active waivers at decision time | 0 |
| `SLO-15-009` | Nonwaivable/hard-zero findings at decision time | 0 |
| `SLO-15-010` | Dossier counts/hashes/decisions reconciling to source registries | 100 percent |

---

## 12. Atomic Requirements

Each row has one primary normative outcome and one acceptance criterion.

### 12.1 Matrix and Traceability Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-001` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every candidate **MUST** derive an immutable active requirement set from the exact accepted specification revision. | `AC-15-001` |
| `REQ-15-002` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every active requirement **MUST** have a requirement x surface x lifecycle disposition under Section 3.2. | `AC-15-002` |
| `REQ-15-003` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every applicability cell **MUST** conform to `SCH-15-002` with a normative rationale for any non-required disposition. | `AC-15-003` |
| `REQ-15-004` | [ARC-012](../product-spec.md#72-transactions-history-and-collaboration) | Every authored entity/operation family **MUST** resolve the undo, native-file, collaboration, and migration matrix in Section 3.3. | `AC-15-004` |
| `REQ-15-005` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Every enabled output profile **MUST** resolve every fidelity and validation dimension in Section 3.4. | `AC-15-005` |
| `REQ-15-006` | [PRE-050](../product-spec.md#66-slide-show-and-audience-runtime) | Every claimed runtime mode **MUST** resolve its input, display, and failure cells in Section 3.5. | `AC-15-006` |
| `REQ-15-007` | [PRE-062](../product-spec.md#67-review-and-collaboration) | Every role/capability **MUST** resolve all applicable connectivity states in Section 3.6. | `AC-15-007` |
| `REQ-15-008` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | Every platform claim **MUST** resolve the accessibility, input, output, and runtime applicability in Section 3.7. | `AC-15-008` |
| `REQ-15-009` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Cross-matrix joins **MUST** preserve the exact requirement, profile, environment, role, surface, lifecycle, and artifact scope of evidence. | `AC-15-009` |
| `REQ-15-010` | [ARC-002](../product-spec.md#71-canonical-document-model) | A release ledger **MUST** satisfy all matrix-wide closure rules in Section 3.8 and `SLO-15-001` through `SLO-15-003`. | `AC-15-010` |

### 12.2 Fixture and Golden Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-011` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every release fixture **MUST** conform to `SCH-15-005`. | `AC-15-011` |
| `REQ-15-012` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | The active corpus **MUST** cover every applicable taxonomy family in Section 4.3. | `AC-15-012` |
| `REQ-15-013` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every golden **MUST** conform to `SCH-15-006` and remain separate from evidence. | `AC-15-013` |
| `REQ-15-014` | [ARC-002](../product-spec.md#71-canonical-document-model) | Semantic goldens **MUST** define exact canonical, scene, event, diagnostic, or accessibility outcomes before candidate comparison. | `AC-15-014` |
| `REQ-15-015` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Visual goldens **MUST** declare environment, tolerance, masks, semantic preconditions, and independent review. | `AC-15-015` |
| `REQ-15-016` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Artifact and preservation goldens **MUST** define parsed semantic structure, normalized hashes, and untouched-source expectations. | `AC-15-016` |
| `REQ-15-017` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Every material claim **MUST** include boundary, negative, malformed, and failure fixtures capable of rejecting a plausible false implementation. | `AC-15-017` |
| `REQ-15-018` | [ARC-002](../product-spec.md#71-canonical-document-model) | Fixture or golden updates **MUST** follow `FLOW-15-001` and invalidate dependent evidence. | `AC-15-018` |
| `REQ-15-019` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Every active corpus item **MUST** have reviewed provenance, licensing, privacy, retention, and redistribution status. | `AC-15-019` |
| `REQ-15-020` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | A release fixture **MUST NOT** receive coverage credit when its data is degenerate for the behavior or detector it claims to exercise. | `AC-15-020` |

### 12.3 Protocol Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-021` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every release protocol **MUST** conform to `SCH-15-007`. | `AC-15-021` |
| `REQ-15-022` | [ARC-011](../product-spec.md#72-transactions-history-and-collaboration) | Pure model and algorithm behavior **MUST** use `TEST-15-002` with positive, boundary, negative, deterministic, and mutation-sensitive assertions. | `AC-15-022` |
| `REQ-15-023` | [ARC-030](../product-spec.md#74-storage-and-recovery) | Cross-module claims **MUST** use `TEST-15-003` through the production contracts named by the criterion. | `AC-15-023` |
| `REQ-15-024` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Every Playwright execution **MUST** use a visible headed browser under Section 5.3. | `AC-15-024` |
| `REQ-15-025` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | User-observable workflows **MUST** use `TEST-15-004` with real input, paint, hit-test, focus, semantic state, and recovery assertions. | `AC-15-025` |
| `REQ-15-026` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Eval protocols **MUST** capture raw-enough real state before detector selection or judgment. | `AC-15-026` |
| `REQ-15-027` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every applicable eval scenario **MUST** meet the three-clean-run convergence rule and `SLO-15-005`. | `AC-15-027` |
| `REQ-15-028` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Every durable or portable output claim **MUST** use `TEST-15-006` against the actual artifact and an independent parser or consumer. | `AC-15-028` |
| `REQ-15-029` | [DES-010](../product-spec.md#52-selection-and-direct-manipulation) | Platform, hardware, IME, and assistive-technology claims **MUST** use `TEST-15-009` or `TEST-15-013` on representative real environments. | `AC-15-029` |
| `REQ-15-030` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Quality and capacity claims **MUST** use `TEST-15-010` under the exact Volume 14 registry and environment. | `AC-15-030` |
| `REQ-15-031` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Durability, permission, privacy, security, and recovery claims **MUST** use the applicable fault and adversarial protocols `TEST-15-011` and `TEST-15-012`. | `AC-15-031` |
| `REQ-15-032` | [ARC-002](../product-spec.md#71-canonical-document-model) | Protocol selection **MUST** meet or exceed the risk-class minimum in Section 5.6. | `AC-15-032` |
| `REQ-15-033` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | A protocol **MUST** exercise the production boundary claimed and disclose every substituted or mocked boundary. | `AC-15-033` |
| `REQ-15-034` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | A flaky or quarantined protocol **MUST NOT** provide release coverage until current replacement evidence exists. | `AC-15-034` |
| `REQ-15-035` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Release command records **MUST** preserve the exact command and headed status required by Section 5.3. | `AC-15-035` |

### 12.4 Evidence Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-036` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every protocol attempt **MUST** produce a `SCH-15-008` execution record. | `AC-15-036` |
| `REQ-15-037` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Every conformance evidence record **MUST** conform to `SCH-15-009` and the `EVD-<date>-<sequence>` grammar. | `AC-15-037` |
| `REQ-15-038` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Release evidence **MUST** bind to the exact clean candidate commit and reproducible build. | `AC-15-038` |
| `REQ-15-039` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | Evidence **MUST** bind to one exact environment profile and fingerprint appropriate to the claim. | `AC-15-039` |
| `REQ-15-040` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Every evidence artifact **MUST** conform to `SCH-15-010` and satisfy `SLO-15-004`. | `AC-15-040` |
| `REQ-15-041` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Evidence **MUST** retain raw observations in execution order before normalized detector or summary outputs. | `AC-15-041` |
| `REQ-15-042` | [ARC-002](../product-spec.md#71-canonical-document-model) | Evidence freshness **MUST** follow `SM-15-002` and the invalidation rules in Section 6.6. | `AC-15-042` |
| `REQ-15-043` | [ARC-010](../product-spec.md#72-transactions-history-and-collaboration) | A product or dependency change **MUST** invalidate every evidence cell reachable through its declared dependency graph. | `AC-15-043` |
| `REQ-15-044` | [ARC-002](../product-spec.md#71-canonical-document-model) | A specification, protocol, fixture, golden, detector, tolerance, or environment change **MUST** invalidate evidence whose interpretation can change. | `AC-15-044` |
| `REQ-15-045` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Dirty-worktree evidence **MUST** follow Section 6.7 and cannot substitute for exact clean-candidate release evidence. | `AC-15-045` |
| `REQ-15-046` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Reruns and retries **MUST** append all attempts and preserve prior failures, artifacts, and findings. | `AC-15-046` |
| `REQ-15-047` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Missing, stale, expired, invalidated, inadmissible, blocked, or inconclusive evidence **MUST NOT** be represented as passing. | `AC-15-047` |
| `REQ-15-048` | [ARC-031](../product-spec.md#74-storage-and-recovery) | Evidence stores **MUST** enforce declared integrity, access, privacy, and retention policy. | `AC-15-048` |
| `REQ-15-049` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every evidence record **MUST** link bidirectionally to exact requirements, criteria, applicability cells, executions, findings, waivers, and release decisions. | `AC-15-049` |
| `REQ-15-050` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | Re-executing a protocol **MUST** create a new immutable `EVD-*` record rather than modifying an earlier record. | `AC-15-050` |

### 12.5 Waiver Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-051` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | Every proposed waiver **MUST** conform to `SCH-15-013`. | `AC-15-051` |
| `REQ-15-052` | [ARC-002](../product-spec.md#71-canonical-document-model) | A waiver **MUST** be bounded to exact requirements, cells, profile, candidate, environment, artifacts, and one release horizon. | `AC-15-052` |
| `REQ-15-053` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | A waiver **MUST** preserve the underlying failing, missing, stale, blocked, or inadmissible disposition. | `AC-15-053` |
| `REQ-15-054` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A release **MUST NOT** waive any condition in Section 8.2 into a conforming external claim. | `AC-15-054` |
| `REQ-15-055` | [PRE-062](../product-spec.md#67-review-and-collaboration) | An active waiver **MUST** have unanimous approvals from every required risk authority. | `AC-15-055` |
| `REQ-15-056` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A waiver **MUST** expire or revoke on its earliest date, release, candidate, scope, assumption, mitigation, or requirement change. | `AC-15-056` |
| `REQ-15-057` | [PRE-073](../product-spec.md#68-import-export-print-and-compatibility) | A material waiver **MUST** appear in the applicable release, compatibility, UI, or support disclosure before user commitment. | `AC-15-057` |
| `REQ-15-058` | [ARC-002](../product-spec.md#71-canonical-document-model) | A prior waiver **MUST NOT** establish precedent, silently renew, broaden profile scope, or lower the requirement. | `AC-15-058` |

### 12.6 Release Tier and Decision Requirements

| ID | Parent capability | Atomic normative statement | Acceptance |
|---|---|---|---|
| `REQ-15-059` | [ARC-002](../product-spec.md#71-canonical-document-model) | An R0 Internal distribution **MUST** satisfy Section 9.3 and make no external conformance claim. | `AC-15-059` |
| `REQ-15-060` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | An R1 Preview release **MUST** satisfy every gate in Section 9.4. | `AC-15-060` |
| `REQ-15-061` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | An R2 Supported release **MUST** satisfy every gate in Section 9.5. | `AC-15-061` |
| `REQ-15-062` | [ARC-031](../product-spec.md#74-storage-and-recovery) | An R3 Assured release **MUST** satisfy every gate in Section 9.6. | `AC-15-062` |
| `REQ-15-063` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every release candidate **MUST** have one immutable `SCH-15-014` manifest before decision review. | `AC-15-063` |
| `REQ-15-064` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A release candidate **MUST** have zero unresolved nonwaivable, hard-zero, or tier-blocking findings. | `AC-15-064` |
| `REQ-15-065` | [PRE-071](../product-spec.md#68-import-export-print-and-compatibility) | A user-facing external release **MUST** close every applicable security, privacy, accessibility, compatibility, and recovery gate for its advertised profile. | `AC-15-065` |
| `REQ-15-066` | [ARC-022](../product-spec.md#73-rendering-and-fidelity) | R2 and R3 quality claims **MUST** use current gated Volume 14 metrics and satisfy the applicable SLOs. | `AC-15-066` |
| `REQ-15-067` | [ARC-020](../product-spec.md#73-rendering-and-fidelity) | A release tier **MUST NOT** exceed the scope closed by its requirement, output, runtime, role, and platform/accessibility matrices. | `AC-15-067` |
| `REQ-15-068` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every release decision **MUST** follow the complete ordered process in Section 10.3. | `AC-15-068` |
| `REQ-15-069` | [PRE-062](../product-spec.md#67-review-and-collaboration) | A required release authority **MUST** be able to record a binding hold or no-go for an unresolved applicable risk. | `AC-15-069` |
| `REQ-15-070` | [ARC-002](../product-spec.md#71-canonical-document-model) | Every final release decision **MUST** create an immutable `SCH-15-015` record before distribution. | `AC-15-070` |
| `REQ-15-071` | [ARC-031](../product-spec.md#74-storage-and-recovery) | A published release **MUST** enter the declared monitoring window and follow `FLOW-15-005` on a rollback trigger. | `AC-15-071` |
| `REQ-15-072` | [ARC-002](../product-spec.md#71-canonical-document-model) | Release communication **MUST** keep specification, implementation, verification, evidence freshness, tier, exclusions, and waivers as distinct facts. | `AC-15-072` |

---

## 13. Acceptance Criteria

Each `AC-15-NNN` evaluates exactly `REQ-15-NNN` with the same suffix. Criteria `AC-15-001` through `AC-15-010` are the matrix-wide gates requested by this volume.

### 13.1 Matrix-Wide Gates

| ID | Pass condition |
|---|---|
| `AC-15-001` | Active-set generation from the exact specification hash produces every accepted requirement once, retains supersession links, identifies missing normative owners, and has a stable set hash. |
| `AC-15-002` | Matrix lint finds at least one reviewed surface/lifecycle row for every active requirement and zero unowned rows. |
| `AC-15-003` | Every normalized cell validates, every non-required cell cites a normative rationale, and absent implementation/testing never yields not-applicable. |
| `AC-15-004` | Every entity/operation row has explicit undo/file/collaboration/migration cells and protocol evidence for each required/conditional enabled boundary. |
| `AC-15-005` | Every enabled output has all S/E/V/B/A/P/I dimensions, actual artifact validation, and no enabled format with an unrouted writer or validator. |
| `AC-15-006` | Every claimed runtime mode covers all applicable input/display/failure rows, event traces, privacy, cleanup, and recovery without blank cells. |
| `AC-15-007` | Direct service and headed UI tests cover every role/capability/connectivity cell and UI denial never substitutes for server enforcement. |
| `AC-15-008` | Every claimed platform cell links current browser/device/input/AT/output/runtime evidence or an explicit not-supported/not-applicable disposition. |
| `AC-15-009` | Evidence attachment cannot broaden across profile, surface, lifecycle, role, environment, output, or artifact dimensions; sampled reverse links reproduce exact scope. |
| `AC-15-010` | All ten Section 3.8 closure rules and `SLO-15-001` through `SLO-15-003` reconcile to 100 percent with zero duplicate credit. |

### 13.2 Fixture and Golden Criteria

| ID | Pass condition |
|---|---|
| `AC-15-011` | Fixture-schema validation finds complete identity, provenance, requirements, setup, actions, oracles, negatives, variants, hashes, limits, and change history. |
| `AC-15-012` | Corpus ledger maps every applicable family to active fixtures and identifies every unsupported/unimplemented family without inferring coverage from filenames. |
| `AC-15-013` | Golden-schema validation proves each golden has an independent expectation source and no golden is stored as a passing evidence record. |
| `AC-15-014` | Repeated oracle generation yields exact expected semantics before candidate execution and detects seeded semantic mutations. |
| `AC-15-015` | Visual goldens state environment/tolerance/masks, pass semantic preconditions, detect seeded visible defects, and mask no authored/target feature. |
| `AC-15-016` | Artifact goldens parse expected structure/hashes/relationships and detect seeded truncation, silent flattening, unknown-part loss, or report mismatch. |
| `AC-15-017` | For every material claim, at least one negative/failure fixture fails a plausible false implementation while the valid reference passes. |
| `AC-15-018` | A fixture/golden update follows all eight flow steps, versions the manifest, records rationale, and marks every dependent evidence record stale/invalidated. |
| `AC-15-019` | Corpus audit finds no unreviewed proprietary, personal, confidential, unsafe, or unlicensed input and enforces retention/redistribution. |
| `AC-15-020` | Degeneracy tests reject identical algorithms/modes/states on fixtures meant to distinguish them and reject empty/repeated-shape scale proxies where semantic breadth is claimed. |

### 13.3 Protocol Criteria

| ID | Pass condition |
|---|---|
| `AC-15-021` | Protocol lint finds all `SCH-15-007` fields and rejects ambiguous pass, missing artifact, hidden retry, or unspecified production boundary. |
| `AC-15-022` | Unit/model corpus covers positive/boundary/negative/determinism and fails under representative mutation operators for the asserted semantics. |
| `AC-15-023` | Integration tests use the production Store/service/writer/reader/authority/adapter boundary and observe both success and failure without shape-incompatible mocks. |
| `AC-15-024` | Every Playwright execution record attests headed visible mode and includes a same-run visible browser artifact; any headless/minimized/hidden/virtual-only run is inadmissible. |
| `AC-15-025` | Headed workflows use real user input and prove visible hit-testable paint, focus/accessibility, canonical outcome, failure/rescue, and return path. |
| `AC-15-026` | Capture review proves raw execution-order observations exist before detector outputs and detector-specific pairing/filtering occurs only in analysis. |
| `AC-15-027` | Every applicable eval scenario has at least three independent runs with zero critical/warning anomalies and no actionable semantic finding. |
| `AC-15-028` | Every durable/output claim includes actual bytes, independent parse/consumer results, semantic comparison, visual/media checks when applicable, and destination integrity. |
| `AC-15-029` | Real hardware/IME/AT evidence names versions/devices/operators and completes each claimed task without emulation-only substitution. |
| `AC-15-030` | Candidate quality evidence uses the exact gated registry, fixture, marks, raw samples, environment, functional assertions, and Volume 14 gate result. |
| `AC-15-031` | Fault/adversarial protocols inject every applicable boundary and prove authorization, content preservation, typed failure, bounded rescue, and safe cleanup. |
| `AC-15-032` | Risk review assigns every change C0-C4 and selected protocols meet all minimums; shared-boundary changes cannot be classified by diff size alone. |
| `AC-15-033` | Boundary instrumentation proves the claimed production route executes; every mock/substitution is listed and cannot satisfy a mocked boundary's cell. |
| `AC-15-034` | Flaky/quarantine ledger contributes zero passing coverage and every affected cell has current replacement evidence or remains missing/failing. |
| `AC-15-035` | Execution records contain exact commands and reject `npm run test:e2e` or current performance wrappers as release browser evidence unless their invocation explicitly enforces visible headed mode. |

### 13.4 Evidence Criteria

| ID | Pass condition |
|---|---|
| `AC-15-036` | Every attempt, including setup failure, timeout, retry, and cancel, has one complete immutable execution record. |
| `AC-15-037` | Evidence-schema validation accepts complete `EVD-YYYYMMDD-NNN` records and rejects missing candidate/spec/cell/protocol/fixture/environment/result/artifact/freshness/reviewer fields. |
| `AC-15-038` | Candidate evidence commit/build/hash exactly matches the clean signed release candidate and independent reproducible-build check. |
| `AC-15-039` | Environment fingerprint matches the declared profile and invalidates when browser/OS/device/power/network/feature configuration materially differs. |
| `AC-15-040` | Every artifact hash and byte length verifies from durable storage, resolves to one execution/assertion, and meets privacy/retention class. |
| `AC-15-041` | Raw capture allows reconstruction of event order and product state without relying only on detector summaries or screenshots. |
| `AC-15-042` | Evidence state transitions follow `SM-15-002`; stale/expired/invalidated/inadmissible records receive no release credit. |
| `AC-15-043` | Seeded product/dependency changes invalidate exactly all reachable evidence cells and force exact-candidate reruns for release. |
| `AC-15-044` | Seeded requirement/protocol/fixture/golden/detector/tolerance/environment changes invalidate every record whose expected result or interpretation could change. |
| `AC-15-045` | Dirty evidence records exact patch hash, remains exploratory, and cannot close release cells until equivalent clean-candidate evidence exists. |
| `AC-15-046` | Two attempts produce separate execution/evidence records; the first failure and all artifacts remain byte-identical and visible after later pass. |
| `AC-15-047` | Gate fixtures for missing/stale/expired/invalidated/inadmissible/blocked/inconclusive evidence never produce pass or not-applicable. |
| `AC-15-048` | Evidence access/retention tests enforce hash integrity, authorized roles, privacy class, expiry, legal hold, and deletion audit. |
| `AC-15-049` | From any sampled requirement/cell/execution/finding/waiver/decision, a reviewer can navigate bidirectionally to every adjacent evidence graph level. |
| `AC-15-050` | Rerunning an identical protocol creates a distinct EVD ID while preserving the earlier record and explicit supersession/freshness links. |

### 13.5 Waiver Criteria

| ID | Pass condition |
|---|---|
| `AC-15-051` | Waiver-schema validation rejects any missing scope/result/impact/risk/mitigation/disclosure/owner/fix/expiry/approval/evidence field. |
| `AC-15-052` | Attempting to apply a waiver to another requirement/cell/profile/candidate/environment/artifact/release fails closed. |
| `AC-15-053` | Coverage and release reports continue to show the original failure/missing/stale/blocked/inadmissible result beside the waiver. |
| `AC-15-054` | Every nonwaivable fixture remains no-go in R1-R3 even with a syntactically valid waiver attached. |
| `AC-15-055` | Waiver activation fails when any required Product/Engineering/Quality/Accessibility/Security/Privacy/Operations approval is missing. |
| `AC-15-056` | Date/release/candidate/scope/assumption/mitigation/requirement changes automatically revoke or expire the waiver and reopen the gate. |
| `AC-15-057` | Material waiver appears in every required precommit/release/compatibility/support surface with accurate consequence and workaround. |
| `AC-15-058` | Reuse/broadening/renewal fixtures require a new waiver record and approvals and leave the normative requirement unchanged. |

### 13.6 Release and Decision Criteria

| ID | Pass condition |
|---|---|
| `AC-15-059` | R0 distribution meets every Section 9.3 item and all external status/marketing/compatibility surfaces avoid a conformance claim. |
| `AC-15-060` | R1 dossier satisfies every Preview gate, has zero S0/nonwaivable condition, current headed/artifact evidence, and visible limitations/waivers. |
| `AC-15-061` | R2 dossier satisfies all Section 9.5 gates, `SLO-15-001` through `SLO-15-010`, and unanimous required approval. |
| `AC-15-062` | R3 dossier satisfies all R2 and Section 9.6 gates with zero waiver/quarantine/incomplete cell and independent rerun/review. |
| `AC-15-063` | Candidate-manifest schema validates and every referenced hash resolves before decision review begins. |
| `AC-15-064` | Finding/gate reconciliation reports zero S0/S1 and zero other tier-blocking unresolved finding; synthetic blockers prevent review-ready state. |
| `AC-15-065` | Every advertised trust/accessibility/compatibility/recovery claim has applicable current protocols and evidence and no narrower omission hidden by aggregate status. |
| `AC-15-066` | R2/R3 quality report uses current gated Volume 14 definitions and the exact candidate passes all applicable absolute/regression/hard-zero gates. |
| `AC-15-067` | Attempting to approve a broader tier/profile/environment/output/runtime/role claim than matrix closure fails dossier generation. |
| `AC-15-068` | Release audit finds all 21 ordered decision steps with matching hashes and no post-freeze change lacking rerun/review. |
| `AC-15-069` | A seeded required hold/no-go vote prevents approval and cannot be overridden by Release Owner or vote count. |
| `AC-15-070` | No artifact is distributed before a valid immutable decision record exists; record hashes match exact manifest/dossier/artifacts/approvals. |
| `AC-15-071` | Monitoring starts at publication, rollback triggers route through `FLOW-15-005`, and a rollback drill preserves work/evidence and restores a signed compatible state. |
| `AC-15-072` | Release report exposes separate specification, implementation, verification, freshness, tier, exclusion, failure, and waiver fields and contains no aggregate completion substitute. |

---

## 14. Protocol and Evidence Inventory

### 14.1 Protocol Mapping

| Requirement range | Minimum protocols |
|---|---|
| `REQ-15-001` through `REQ-15-010` | `TEST-15-001`, `TEST-15-014` |
| `REQ-15-011` through `REQ-15-020` | `TEST-15-001`, `TEST-15-002`, applicable domain protocol |
| `REQ-15-021` through `REQ-15-035` | `TEST-15-002` through `TEST-15-013` by risk and boundary |
| `REQ-15-036` through `REQ-15-050` | All producing protocols plus `TEST-15-014` integrity/reconciliation |
| `REQ-15-051` through `REQ-15-058` | Failing source protocol, mitigation protocol, `TEST-15-014` |
| `REQ-15-059` through `REQ-15-072` | Every applicable protocol and `TEST-15-014` |

### 14.2 Required EVD Bundles by Tier

Actual records use `EVD-<YYYYMMDD>-<sequence>` and one or more evidence classes from Section 6.10.

| Tier | Required evidence classes |
|---|---|
| R0 | `EVC-SPEC`, selected `EVC-MODEL`, safety artifacts as applicable |
| R1 | R0 plus `EVC-HEADED`, `EVC-EVAL`, `EVC-ARTIFACT`, `EVC-RESCUE`, and applicable `EVC-MANUAL`, `EVC-QUALITY` |
| R2 | All applicable evidence classes, including collaboration, manual/hardware/AT, quality, security, recovery, and release dossier |
| R3 | R2 plus independent rerun records, reproducible-build evidence, current Prolonged/DR/manual matrices, and rollback drill |

No EVD instance is generated by this normative draft. Evidence count for this file is therefore zero until a real protocol publishes records.

---

## 15. Traceability and Source Adoption

### 15.1 Requirement Coverage

| Requirement range | Conformance responsibility |
|---|---|
| `REQ-15-001` through `REQ-15-010` | Active-set and all required applicability matrices |
| `REQ-15-011` through `REQ-15-020` | Fixture/golden taxonomy, quality, provenance, and nondegeneracy |
| `REQ-15-021` through `REQ-15-035` | Unit, integration, headed E2E, eval, artifact, manual, quality, fault, and security protocols |
| `REQ-15-036` through `REQ-15-050` | Commit/environment/artifact-bound evidence, freshness, invalidation, immutability |
| `REQ-15-051` through `REQ-15-058` | Bounded waiver mechanics and nonwaivable conditions |
| `REQ-15-059` through `REQ-15-072` | Release tiers, gates, authorities, exact decision, monitoring, and rollback |

### 15.2 Adopted Sources

| Source | Adopted authority | Exclusion or resolution |
|---|---|---|
| [Volume 00](00-governance-and-traceability.md) | Authority, ID grammar, evidence, status axes, and waiver limits | This volume makes release mechanics more precise. |
| [Volume 03](03-canonical-document-model.md) | Entity families, identity, schema, migration, semantic hash | This volume owns cross-lifecycle acceptance only. |
| [Volume 04](04-mutation-history-and-determinism.md) | Operations, undo/redo, replay, rejection, pending intent | Matrix tests cannot substitute snapshot-only behavior. |
| [Volume 05](05-resolution-scene-and-rendering.md) | Semantic-before-pixel, scene/surface capture, degradation | Visual equality cannot excuse semantic mismatch. |
| [Volume 06](06-files-assets-and-recovery.md) | Real package/artifact, durability, recovery, provider fault boundaries | File existence and optimistic save status are excluded. |
| [Volume 07](07-collaboration-identity-and-sharing.md) | Independent clients, authority, permissions, convergence, headed multi-context evidence | Isolated modules and presence alone are excluded. |
| [Volume 08](08-figma-class-design-authoring.md) | Design task, lifecycle, headed, artifact, negative requirements | Taskflow labels are inputs, not evidence. |
| [Volume 09](09-powerpoint-class-presentation-authoring.md) | Presentation authoring matrices and cross-surface/event requirements | Screenshots cannot prove structured data/motion. |
| [Volume 10](10-presentation-runtime.md) | Mode/input/display/failure, audience privacy, host/hardware evidence | Headless runtime output is inadmissible. |
| [Volume 11](11-interchange-and-output.md) | F0-F5, actual artifact validation, compatibility reports | MIME/extension/nonzero bytes are excluded. |
| [Volume 12](12-accessibility-and-internationalization.md) | Manual AT/IME, semantic artifact, headed keyboard/accessibility protocols | Axe/parser alone cannot prove full conformance. |
| [Volume 14](14-quality-attributes-and-observability.md) | Profiles, SLOs, tolerances, environment, quality evidence, runbooks | Historical/provisional metrics do not gate current release. |
| [Eval Loop Framework](../../automation/eval-loop/eval-loop-framework.md) | User-derived expectations, three-layer capture, temporal/semantic detection, repeated runs | Technology-specific examples do not redefine product behavior. |
| [DOM State Capture](../../automation/eval-loop/dom-state-capture-guide.md) | Raw DOM/store/canvas capture and artifact structure | Capture must remain agenda-free despite detector examples. |
| [Automation Test Scenarios](../../automation/testing/test-scenarios.md) | Scenario inventory | Check marks/status are not evidence or completion. |
| [Package Scripts](../../../package.json) and [Playwright config](../../../playwright.config.ts) | Current command and project inventory | The default script/config does not override the repository headed-only rule. |
| Repository testing memory | All Playwright runs must use visible headed mode; headless results are invalid | Adopted as the strict repository rule in Section 5.3. |

### 15.3 Current Evidence Boundary

The workspace contains extensive unit, integration, collaboration, headed browser, eval, performance, accessibility, storage, runtime, and artifact-oriented tests. Their presence is useful protocol input. This draft does not inspect every execution artifact, assign current `EVD-*` records, close matrices, or make a release claim. The dated audit and status ledger remain informative current-state sources until evidence is regenerated under this volume.

---

## 16. Open Decisions

Defaults remain in force until an accepted decision supersedes them.

| ID | Decision/question | Default in force | Owner | Review trigger | Affected requirements/contracts | Blocking class |
|---|---|---|---|---|---|---|
| `OD-15-001` | Machine-readable storage format and generator for the normalized coverage ledger | Versioned canonical JSON with derived Markdown/HTML views; hand-edited aggregate tables are nonauthoritative. | Quality Engineering and Release Governance | First implementation of the ledger | `SCH-15-002`; `SCH-15-003`; `REQ-15-001` through `REQ-15-010` | `R1-blocking` |
| `OD-15-002` | Evidence store, signing, and long-term retention service | Content-addressed immutable artifacts with access and retention policy; local-only paths cannot support release. | Evidence Custodian and Security/Privacy Authority | First release evidence publication | `SCH-15-009`; `SCH-15-010`; `REQ-15-036` through `REQ-15-050` | `R1-blocking` |
| `OD-15-003` | Release candidate signing and reproducible-build attestation mechanism | SHA-256 artifact manifests and required authority attestations; no unsigned external R2/R3 release. | Release Engineering and Security Authority | Distribution infrastructure selection | `SCH-15-014`; `SCH-15-015`; `REQ-15-038`; `REQ-15-063`; `REQ-15-070` | `pre-implementation` |
| `OD-15-004` | Exact specialist quorum for an entirely local/offline R1 preview | For `PROFILE-R1-2026-01`, Product, Engineering, Quality, and Accessibility remain required; Security/Privacy reviews the explicit no-data/no-network boundary. | Release Governance and Security/Privacy Authority | First offline `PROFILE-R1-2026-01` dossier | `REQ-15-055`; `REQ-15-060`; `REQ-15-069`; `PROFILE-R1-2026-01` | `R1-blocking` |
| `OD-15-005` | Whether R2 can carry more than one active S2 waiver | The maximum is one bounded S2 waiver and unlimited reviewed S3 known issues; any change requires a Product/Quality decision. | Product Authority and Quality Authority | First R2 waiver request | `SCH-15-013`; `REQ-15-051` through `REQ-15-058`; `REQ-15-061` | `non-blocking` |
| `OD-15-006` | Physical device/AT/Office/printer lab cadence | Evidence maximum ages in Section 6.6 apply; unsupported cells remain not-supported rather than inferred. | Quality Authority and Accessibility Authority | A profile first claims an affected cell or a maintained device lab is established | `REQ-15-029`; `REQ-15-039`; `REQ-15-042`; `TEST-15-009`; `TEST-15-013` | `non-blocking` |
| `OD-15-007` | Whether virtual-display headed CI can ever satisfy the visible-browser rule | No. It may diagnose but does not create headed conformance evidence. | Quality Engineering and Release Governance | Explicit repository policy change approved by Quality and the user | `REQ-15-024`; `REQ-15-025`; `REQ-15-035`; `AC-15-024`; `TEST-15-004` | `non-blocking` |
| `OD-15-008` | Automated requirement parser and one-keyword validation grammar for prose/table variants | The Volume 00 one-primary-keyword rule applies; ambiguous rows fail lint. | Specification Tooling and Quality Engineering | Parser implementation | `REQ-15-001`; `REQ-15-003`; `TEST-15-001`; Volume 00 requirement grammar | `pre-implementation` |
| `OD-15-009` | Release monitoring duration by tier | `PROFILE-R1-2026-01`: 72 hours; R2: 7 days; R3: 14 days, with immediate hard-zero rollback evaluation. | Release Governance and Operations/Reliability Authority | First release train policy review | `REQ-15-071`; `FLOW-15-005`; `SCH-15-015`; `PROFILE-R1-2026-01` | `R1-blocking` |

---

## 17. Identifier Counts

| Namespace | Count | Range |
|---|---:|---|
| Requirements | 72 | `REQ-15-001` through `REQ-15-072` |
| Schemas | 15 | `SCH-15-001` through `SCH-15-015` |
| Invariants | 20 | `INV-15-001` through `INV-15-020` |
| State machines | 5 | `SM-15-001` through `SM-15-005` |
| Flows | 6 | `FLOW-15-001` through `FLOW-15-006` |
| SLOs | 10 | `SLO-15-001` through `SLO-15-010` |
| Acceptance criteria | 72 | `AC-15-001` through `AC-15-072` |
| Test protocols | 14 | `TEST-15-001` through `TEST-15-014` |
| EVD record instances | 0 | Actual instances use `EVD-YYYYMMDD-NNN`; this draft creates none. |
| Open decisions | 9 | `OD-15-001` through `OD-15-009` |

The counts above describe this draft inventory and do not claim implementation, passing evidence, matrix closure, waiver approval, or release conformance.