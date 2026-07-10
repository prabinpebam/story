# Story Product Specification System

> **Specification ID:** `STORY-SPEC`
> **Status:** Accepted structure
> **Version:** 2.0.0-draft
> **Owner:** Product and Engineering
> **Last reviewed:** July 10, 2026
> **Governing vision:** Figma-class design capability and PowerPoint-class presentation capability in one coherent product

## 1. Purpose

This directory is the normative product specification for Story. It defines the product from strategic intent through interaction behavior, document semantics, runtime behavior, quality targets, and release evidence.

The specification is deliberately multi-volume. A single feature catalog cannot adequately own product strategy, design behavior, data semantics, presentation-runtime behavior, compatibility, and acceptance evidence without becoming contradictory. Each concept therefore has one normative owner and is referenced elsewhere rather than restated.

## 2. Fixed Product Direction

Story combines two equally load-bearing capability pillars:

1. **Figma-class visual authoring.** Designers must recognize the canvas, direct-manipulation grammar, vector and text tools, layout systems, components, variables, styles, layers, shortcuts, and collaboration model.
2. **PowerPoint-class presentation production and delivery.** Presentation authors must recognize slides, sections, masters, layouts, themes, tables, charts, diagrams, media, notes, transitions, animations, rehearsal, recording, Presenter View, slide-show setup, print, and interchange.

Parity is the adoption floor, not the complete reason to choose Story. Story's product advantage is a governed narrative system: one structured source can produce reusable presentation systems, audience editions, deterministic live delivery, and professional outputs without copy drift or silent fidelity loss.

## 3. Normative Volumes

| Volume | File | Sole normative responsibility |
|---:|---|---|
| 00 | [Governance and Traceability](00-governance-and-traceability.md) | Authority, requirement language, identifiers, maturity, ownership, change control, evidence, and supersession |
| 01 | [Product Constitution](01-product-constitution.md) | Vision, market posture, users, jobs, Story-native advantage, principles, bounded parity, non-goals, and success outcomes |
| 02 | [Experience Architecture](02-experience-architecture.md) | Workspace information architecture, mental-model jurisdiction, views, modes, tools, panels, commands, focus, states, adaptive behavior, and UI language |
| 03 | [Canonical Document Model](03-canonical-document-model.md) | Persisted entities, identities, ordering, references, inheritance, overrides, editions, narrative components, animation data, comments, and migration |
| 04 | [Mutation, History, and Determinism](04-mutation-history-and-determinism.md) | Intent, preview/commit, transactions, operations, validation, coalescing, inversion, replay, semantic hashes, and local undo |
| 05 | [Resolution, Scene, and Rendering](05-resolution-scene-and-rendering.md) | Resolution graph, scene IR, geometry, text, paint, media, accessibility semantics, surface adapters, readiness, and degradation |
| 06 | [Files, Assets, and Recovery](06-files-assets-and-recovery.md) | `.str` package, atomic persistence, assets, autosave, checkpoints, cross-tab ownership, cloud providers, and recovery |
| 07 | [Collaboration, Identity, and Sharing](07-collaboration-identity-and-sharing.md) | Replica authority, concurrency, offline queues, presence, permissions, comments, sharing, audit, and revocation |
| 08 | [Figma-Class Design Authoring](08-figma-class-design-authoring.md) | Canvas, selection, transforms, vectors, text, Auto Layout, constraints, components, variables, styles, paint, layers, and clipboard |
| 09 | [PowerPoint-Class Presentation Authoring](09-powerpoint-class-presentation-authoring.md) | Slides, sections, masters, layouts, themes, templates, tables, charts, diagrams, media, notes, motion authoring, rehearsal, and recording |
| 10 | [Presentation Runtime](10-presentation-runtime.md) | Show modes, navigation, timeline, builds, transitions, presenter/audience views, multi-display, controls, kiosk, readiness, and recovery |
| 11 | [Interchange and Output](11-interchange-and-output.md) | PPTX preservation and mapping, fidelity tiers, compatibility reporting, PDF, print, video, web, SVG, raster, and clipboard output |
| 12 | [Accessibility and Internationalization](12-accessibility-and-internationalization.md) | Keyboard and assistive technology, reading order, captions, reduced motion, forced colors, language, bidi, IME, and accessible artifacts |
| 13 | [Security, Privacy, and Trust](13-security-privacy-and-trust.md) | Threat model, trust boundaries, identity, code/SVG/embed safety, recording consent, retention, telemetry, and abuse controls |
| 14 | [Quality Attributes and Observability](14-quality-attributes-and-observability.md) | Benchmark profiles, latency and frame budgets, capacity, reliability, memory, fidelity tolerances, platform support, metrics, and diagnostics |
| 15 | [Acceptance and Release Conformance](15-acceptance-and-release-conformance.md) | Acceptance matrices, fixtures, golden corpora, test protocols, evidence records, waivers, release profiles, and exit gates |

## 4. Supporting Product Documents

| Document | Role | Authority |
|---|---|---|
| [Current Product Entry](../product-spec.md) | Human-readable entry point and constitutional summary | Normative only where it links to the volumes above |
| [Capability Audit](../capability-audit.md) | Dated description of verified current implementation and gaps | Informative; never creates requirements |
| [Requirement Status](../requirement-status.md) | Dated status of parent capabilities | Informative; must be generated or reviewed against traceability records |
| [Delivery Roadmap](../delivery-roadmap.md) | Dependency-ordered implementation programs | Controlled plan; may sequence but never weaken requirements |
| [Glossary](../glossary.md) | Transitional terminology registry | Normative until terminology moves into Volume 00 |
| [Product Principles](../principles.md) | Engineering and craft reminders | Normative where not superseded by a numbered volume |
| [Domain Specifications](../../specs/README.md) | Detailed subsystem specifications and implementation contracts | Normative only when explicitly adopted by a numbered volume |
| [Eval Taskflows](../../automation/eval-loop/taskflows/00-index.md) | User-observable scenario inventory | Requirements input; not implementation or coverage evidence |

## 4.1 Conformance Profiles and Benchmarks

| Document | Role | Authority |
|---|---|---|
| [R1 Preview Profile](profiles/R1-preview.md) | First executable external-preview slice: exact platforms, capability tiers, 24 workflows, defaults, exclusions, and release gates | Normative for `PROFILE-R1-2026-01`; it selects but never weakens end-state requirements |
| [Familiarity and Story-Native Benchmark](benchmarks/familiarity-and-story-native.md) | Fixed Figma-transfer, PowerPoint-transfer, Story-native, accessibility, and product-outcome protocol | Normative interpretation of `SLO-01-001` through `SLO-01-010` for R1 |
| [Generated Traceability Index](traceability-index.md) | Compact volume and parent-capability navigation backed by a full JSON requirement registry | Generated informative view; numbered volumes remain normative |
| [R1 Atomic Ledger](profiles/R1-ledger.md) | Complete included/deferred/excluded/Preview disposition and 24 workflow-to-requirement mapping | Generated profile closure; editable source is `profiles/R1-selection.json` |
| [Protocol Registry](protocol-registry.md) | Versioned manifest for every allocated `TEST-*` protocol and the product benchmark alias | Generated conformance input; incomplete protocols provide no release coverage |
| [Canonical Enum Registry](registries/canonical-enums.json) | W4-W1, D3-D1, workspace view, runtime mode, surface role, and placement values | Normative derivative of Volume 02; conflicting aliases fail validation |

## 5. Requirement Hierarchy

The requirement graph is:

```text
VISION
  -> CAPABILITY (DES-*, PRE-*, ARC-*)
    -> ATOMIC REQUIREMENT (REQ-<volume>-<sequence>)
      -> SCHEMA / INVARIANT / STATE MACHINE / FLOW / SLO
        -> ACCEPTANCE CRITERION (AC-*)
          -> TEST OR EVAL (TEST-*)
            -> IMMUTABLE EVIDENCE RECORD (EVD-*)
```

### 5.1 Parent Capabilities

Existing `DES-*`, `PRE-*`, and `ARC-*` identifiers are immutable parent capabilities. They communicate product scope and remain stable even when detailed requirements are decomposed or moved.

### 5.2 Atomic Requirements

Atomic requirements use `REQ-<volume>-<sequence>`, for example `REQ-08-014`. Each atomic requirement:

- contains one normative outcome;
- uses exactly one primary `MUST`, `SHOULD`, or `MAY` statement;
- identifies its parent capability;
- can be accepted or rejected independently;
- names applicable surfaces and lifecycle boundaries;
- links to acceptance criteria;
- never uses implementation status as requirement language.

### 5.3 Supporting Identifiers

| Namespace | Meaning |
|---|---|
| `INV-*` | Invariant that must remain true across operations or surfaces |
| `SCH-*` | Normative schema or data contract |
| `SM-*` | State machine |
| `FLOW-*` | User, data, or failure flow |
| `SLO-*` | Quantified service or experience objective |
| `AC-*` | Pass/fail acceptance criterion |
| `TEST-*` | Test, eval, or inspection protocol |
| `EVD-*` | Immutable evidence record tied to revision and environment |
| `ADR-*` | Architecture or product decision record |
| `WP-*` | Delivery work package; may reference requirements but may not define them |

## 6. Authority Rules

1. The newest accepted numbered volume owns its declared responsibility.
2. One concept has one normative owner. Other documents link to it.
3. Product requirements override implementation snapshots.
4. Production code defines current behavior, not intended behavior.
5. Audit and status documents describe evidence; they do not create scope.
6. Roadmaps sequence accepted scope; they do not create, weaken, or silently defer requirements.
7. Archived documents are non-normative.
8. Contradictions are resolved through an `ADR-*` decision and a versioned specification change.
9. A lower-level document may make a parent capability more precise but may not narrow it without explicit product approval.
10. Unsupported or deferred behavior remains visible in traceability records; it is never deleted to make status appear complete.

## 7. Completeness Standard

A product area is specification-complete only when it defines:

1. User and job.
2. Entry points and information hierarchy.
3. Happy path and recovery path.
4. Empty, loading, partial, offline, conflict, permission, and error states where applicable.
5. Commands, keyboard, pointer, touch, pen, and assistive-technology behavior.
6. Persisted schema and migration.
7. Mutation, undo, redo, and collaboration semantics.
8. Editor, thumbnail, presentation, presenter, export, print, recording, and interchange applicability.
9. Security and privacy boundaries.
10. Performance and capacity targets.
11. Atomic acceptance criteria.
12. Required evidence and release gate.

No implementer should need to invent product behavior that changes user-visible outcomes, data semantics, fidelity, permissions, or recovery.

The end-state volumes are intentionally broader than one release. Implementation begins from an accepted conformance profile that selects a coherent workflow and declares every included, deferred, excluded, Preview, and unsupported outcome. A profile cannot omit a numbered owner whose responsibility applies to an advertised workflow.

## 8. Current Draft Status

Version 2.0 expands the previous product charter into this multi-volume system. During migration:

- parent `DES`, `PRE`, and `ARC` capabilities remain valid;
- existing domain specifications remain active unless a volume explicitly supersedes them;
- conflicts must be recorded rather than silently normalized;
- requirement-status counts remain parent-level until atomic traceability is generated;
- each volume must declare what it supersedes and what remains unresolved.