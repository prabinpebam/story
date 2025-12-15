# Shapes Feature — Comprehensive Implementation Plan (Strict TDD)

**Goal**: implement the Shapes + Vector Editing feature set with **100% spec alignment** and **rigorous automated functional coverage**, using strict TDD.

References (must stay in sync):
- Strict TDD rules: `documentation/02-implementation/00-strict-tdd-and-dom-validation.md`
- Shapes canonical index: `documentation/01-specs/shapes/00-index.md`
- Shapes canonical spec map: `documentation/01-specs/shapes/00-topic-tree-and-spec-map.md`

---

## Operating Rules (Non-Negotiable)
- **Red → Green → Refactor** for every increment.
- **Every increment adds/updates Playwright functional tests with DOM/UI assertions**.
- Add **Vitest tests** whenever the increment introduces logic (geometry, transforms, canonicalization, hit testing, import/export, determinism).
- Every bug fix requires a **regression test first** (corpus fixture or test).
- “Done” means: **no known defects**, all tests green, and the full plan checklist below is checked.

---

## Definition of Done (Shapes “Complete”)
Shapes is complete only when all are true:
- Every spec file in `documentation/01-specs/shapes/` is implemented or explicitly marked “v1 non-goal” (and the spec updated accordingly).
- Functional tests cover:
  - create primitives, select/multi-select, move/resize/rotate, style edits, undo/redo,
  - vector edit mode (points/handles + ops),
  - boolean and mask flows (non-destructive),
  - keyboard/gesture behaviors, feedback/status, and accessibility requirements,
  - Figma clipboard paste → editable elements (fixtures + deterministic hashing).
- Determinism guarantees are enforced by tests:
  - canonical hashing for geometry/exports/import results,
  - seeded fuzzing + on-disk corpuses.
- Performance smoke checks exist for representative “stress scenes”.

---

## Phase 0 — Test Harness, Tooling, and Enforcement (gates all work)
This phase exists so TDD can be followed without friction.

Required deliverables:
- Playwright:
  - A stable test entry path (launch app, create/open doc, focus canvas).
  - Stable selectors strategy (prefer role/name; use `data-testid` where needed).
  - Utilities for pointer drags (with deterministic coordinates), keyboard shortcuts, clipboard stubs.
- Vitest:
  - Helpers for canonical JSON hashing, numeric bucketing, seeded randomness.
- Corpus scaffolding (per shapes testing spec):
  - `tests/corpus/shapes/booleans/`
  - `tests/corpus/shapes/paths/`
  - `tests/corpus/shapes/figma-paste/`

Gate:
- No feature work begins until at least one end-to-end shapes test can run locally and in CI.

Primary spec driver:
- `documentation/01-specs/shapes/24-tooling-and-testing.md`

---

## Phase 1 — Foundations (Math + Model contracts)
Implement the non-UI core contracts first so UX work has stable primitives.

Deliverables (high level):
- Coordinate conversion utilities (local/parent/world/viewport/screen).
- Deterministic numeric policy (epsilon/clamping/degenerate handling).
- Scene graph node identity + traversal rules.
- Transform system (composition, pivot, bounds behavior).

Primary spec drivers:
- `01-system-architecture.md`
- `03-coordinate-systems.md`
- `04-precision-and-numerics.md`
- `05-scene-graph-and-node-types.md`
- `06-transform-system.md`

Tests required:
- Vitest for all pure math + determinism.
- Playwright minimal smoke: create a shape and see stable DOM output.

---

## Phase 2 — Data Model + Serialization (Authoritative, diffable, migratable)
Deliverables:
- Canonical Shapes element/node schemas (including versioning/migrations).
- Document persistence that round-trips without loss for supported features.
- Operation-friendly data layout (for undo/redo + future collaboration model).

Primary spec drivers:
- `02-data-model-and-serialization.md`
- `11-undo-redo-and-operations.md`
- `18-operation-model-collaboration-readiness.md`
- `18-operation-model-future-collab.md` (compatibility shim, if still required)

Tests required:
- Vitest: serialize → deserialize → canonical-equal.
- Playwright: create/edit → reload → visually/DOM equivalent.

---

## Phase 3 — Geometry Core (Parametric + Paths + Vector Networks)
Deliverables:
- Parametric shapes produce canonical path outputs.
- Path representation supports open/closed, fill rules, winding, and segments.
- Segment ops and control point semantics.
- Continuity constraints enforcement.
- Vector Networks (branching topology) support (Figma-class requirements).

Primary spec drivers:
- `07-parametric-geometry.md`
- `08-path-representation.md`
- `08a-vector-networks.md`
- `09-segments-and-beziers.md`
- `10-control-points-and-handles.md`
- `11-continuity-and-smoothness.md`

Tests required:
- Vitest: canonicalization, splitting/joining, handle behaviors, continuity enforcement.
- Corpus entries under `tests/corpus/shapes/paths/` for any degenerate bug found.

---

## Phase 4 — Rendering Integration (DOM-first, overlays second)
Deliverables:
- Render contract from resolved node → DOM paint stack + overlay.
- Tessellation/AA strategy implemented as required by spec (even if used initially for a subset).
- Style/paint integration parity with the existing Story style system.

Primary spec drivers:
- `16-rendering-architecture.md`
- `16a-tessellation-and-aa.md`
- `14-style-and-paint-integration.md`
- `16-design-system-alignment.md`

Tests required:
- Playwright: DOM output correctness for fills/strokes/effects and mode gating.
- Vitest: tessellation determinism and canonical hashing for derived geometry.

---

## Phase 5 — Hit Testing + Selection Engine
Deliverables:
- Hit testing for fills/strokes; escalation rules for points/segments in vector mode.
- Selection model (single/multi, lasso where specified).
- Focus rules and z-order/hierarchy selection behavior.

Primary spec drivers:
- `12-hit-testing.md`
- `22-selection-and-focus-ux.md`
- `05-scene-graph-and-node-types.md`

Tests required:
- Vitest: hit test math in multiple coordinate spaces.
- Playwright: click selection, multi-select modifiers, selection visuals/DOM state.

---

## Phase 6 — Interaction State Machine + Editing UX
Deliverables:
- Modes: object/vector/boolean/mask with explicit transitions.
- Object editing: move/resize/rotate; parametric handles.
- Vector editing: point/handle selection + editing operations.
- Snapping/guides integration (shapes delta to existing canvas spec).

Primary spec drivers:
- `20-interaction-modes-and-state-machine.md`
- `27-object-editing-ux.md`
- `28-vector-editing-ux.md`
- `21-vector-editing-operations.md`
- `23-snapping-and-guides-shapes.md`
- `26-canvas-and-viewport-shapes.md`
- `29-continuity-curve-ux.md`

Tests required:
- Playwright: drag gestures, keyboard modifiers, mode switching, snapping assertions.
- Vitest: operation semantics (the same action sequence yields identical canonical output).

---

## Phase 7 — Booleans and Masks (Non-destructive)
Deliverables:
- Boolean nodes (union/subtract/intersect/exclude) with deterministic outputs.
- Masking/clipping model that works for shapes/text/image/video.
- UX for boolean/mask editing and operand drill-in.
- Failure policy: never crash; degrade deterministically.

Primary spec drivers:
- `13-boolean-geometry-system.md`
- `15-masking-and-clipping.md`
- `30-boolean-mask-ux.md`

Tests required:
- Vitest: canonical boolean outputs + seeded fuzzing.
- Corpus: minimal repros checked into `tests/corpus/shapes/booleans/`.
- Playwright: create boolean/mask, edit operands, undo/redo, verify DOM state.

---

## Phase 8 — UI Surfaces (Styling UI, Layer Panel, Feedback)
Deliverables:
- Styling UI for shapes consistent with existing system.
- Layer panel + hierarchy interactions for shapes/groups/booleans/masks.
- Feedback and status messaging (warnings, invalid operations, import degradations).

Primary spec drivers:
- `31-styling-ui.md`
- `32-layer-panel-ux.md`
- `34-feedback-and-status.md`
- `16-design-system-alignment.md`

Tests required:
- Playwright: inspector changes reflect on-canvas; layer panel selection and ordering.

---

## Phase 9 — Keyboard/Gestures + Undo/Redo UX
Deliverables:
- Keyboard shortcuts and gesture behaviors for all editing modes.
- Undo/redo correctness, coalescing, and UX parity with spec.

Primary spec drivers:
- `33-keyboard-and-gestures.md`
- `35-undo-redo-ux.md`
- `11-undo-redo-and-operations.md`

Tests required:
- Playwright: hotkeys for mode switching and editing; undo/redo across drags and multi-step ops.
- Vitest: operation coalescing and determinism.

---

## Phase 10 — Interop: Serialization/Export + Figma Paste Import
Deliverables:
- Internal serialization/export rules.
- SVG mapping/export for supported subset.
- Figma clipboard paste → editable elements conversion pipeline with deterministic degrade ladder.

Primary spec drivers:
- `19-serialization-and-interop.md`
- `19a-figma-clipboard-import.md`

Tests required:
- Corpus: `tests/corpus/shapes/figma-paste/` fixtures with canonical hash + warnings.
- Playwright: paste flows (mock clipboard), placement, selection after paste.

---

## Phase 11 — Performance, Perceived Performance, and Caching
Deliverables:
- Cache layers + invalidation rules.
- Performance smoke gates with “stress scenes”.
- UI responsiveness heuristics and perceived performance behaviors.

Primary spec drivers:
- `17-caching-and-performance.md`
- `36-perceived-performance.md`
- `25-product-level-requirements.md`

Tests required:
- Perf smoke checks (wide thresholds) against deterministic fixtures.

---

## Phase 12 — Accessibility, Customization, Extensibility
Deliverables:
- Accessible selection/focus states; keyboard-only editing paths where required.
- Extensibility hooks and customization constraints.

Primary spec drivers:
- `37-accessibility.md`
- `38-customization-and-extensibility.md`

Tests required:
- Playwright: role/name queries, focus order, keyboard-only flows.

---

# Spec-by-Spec Coverage Checklist (Nothing Missed)
Use this section to track progress. Each spec must be fully checked.

Legend:
- **Spec readiness**: the spec has no v1-critical “TBD”/open decisions.
- **Implementation**: the behavior exists in the product.
- **Tests**: Playwright functional coverage + Vitest logic coverage where applicable.
- **Regression artifacts**: corpus/goldens/perf fixtures as required.

For every spec file below, check:
- [ ] Spec readiness confirmed
- [ ] Failing test(s) added first (RED)
- [ ] Minimal implementation (GREEN)
- [ ] Refactor while green
- [ ] Playwright DOM/UI assertions cover the behavior
- [ ] Vitest coverage exists for logic/determinism
- [ ] Corpus/goldens added if relevant

---

## Index and map
- `00-index.md` — Shapes & Vector Editing Specification (Index)
- `00-topic-tree-and-spec-map.md` — Topic Tree & Spec Map

## Foundations
- `01-system-architecture.md` — System Architecture
- `03-coordinate-systems.md` — Coordinate Systems
- `04-precision-and-numerics.md` — Precision & Numerics

## Model, graph, transforms
- `02-data-model-and-serialization.md` — Data Model & Serialization
- `05-scene-graph-and-node-types.md` — Scene Graph & Node Types
- `06-transform-system.md` — Transform System

## Geometry core
- `07-parametric-geometry.md` — Parametric Geometry
- `08-path-representation.md` — Path Representation
- `08a-vector-networks.md` — Vector Networks
- `09-segments-and-beziers.md` — Segments & Bézier Curves
- `10-control-points-and-handles.md` — Control Points & Handles
- `11-continuity-and-smoothness.md` — Continuity & Smoothness

## Undo/redo semantics and operation model
- `11-undo-redo-and-operations.md` — Undo/Redo & Operation Semantics
- `18-operation-model-collaboration-readiness.md` — Operation Model (Collab readiness)
- `18-operation-model-future-collab.md` — Operation Model compatibility shim

## Hit testing and constraints
- `12-hit-testing.md` — Hit Testing
- `23-snapping-and-guides-shapes.md` — Snapping & Guides (Shapes delta)

## Boolean + masking
- `13-boolean-geometry-system.md` — Boolean Geometry System
- `15-masking-and-clipping.md` — Masking & Clipping
- `30-boolean-mask-ux.md` — Boolean & Mask Interaction UX

## Styling and design system
- `14-style-and-paint-integration.md` — Style & Paint Integration
- `16-design-system-alignment.md` — Design System Alignment
- `31-styling-ui.md` — Styling UI

## Rendering and performance
- `16-rendering-architecture.md` — Rendering Architecture
- `16a-tessellation-and-aa.md` — Tessellation & AA
- `17-caching-and-performance.md` — Caching & Performance
- `36-perceived-performance.md` — Perceived Performance

## Interop
- `19-serialization-and-interop.md` — Serialization & Interop
- `19a-figma-clipboard-import.md` — Figma Clipboard Paste → Editable Elements

## Interaction + UX
- `20-interaction-modes-and-state-machine.md` — Interaction Modes & State Machine
- `21-vector-editing-operations.md` — Vector Editing Operations
- `22-selection-and-focus-ux.md` — Selection & Focus UX
- `26-canvas-and-viewport-shapes.md` — Canvas & Viewport UX (Shapes delta)
- `27-object-editing-ux.md` — Object Editing UX
- `28-vector-editing-ux.md` — Vector Editing UX
- `29-continuity-curve-ux.md` — Continuity & Curve UX
- `32-layer-panel-ux.md` — Layer Panel UX
- `33-keyboard-and-gestures.md` — Keyboard & Gestures
- `34-feedback-and-status.md` — Feedback & Status
- `35-undo-redo-ux.md` — Undo/Redo UX

## Product-level requirements
- `25-product-level-requirements.md` — Product-Level Requirements

## Accessibility and extensibility
- `37-accessibility.md` — Accessibility
- `38-customization-and-extensibility.md` — Customization & Extensibility

## Alignment and notes (still must be read/kept consistent)
- `15-current-implementation-alignment.md` — Implementation alignment inventory (must remain accurate during build)
- `README.md` — Specs quick start (update if entry points change)
- `rough-notes.md` — Research direction (ensure no contradictions with v1)
