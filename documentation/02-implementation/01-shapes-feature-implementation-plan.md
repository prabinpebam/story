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

## How This Plan Controls Execution (No Drift)

This file is not just a “plan”; it is the **source of truth for execution**.

Rules:
- Every Shapes PR must map to **exactly one** phase/milestone goal *and* update the **Spec Coverage Ledger** below.
- If work cannot be tied to a ledger row (spec → tests → implementation), it is a **rabbit hole** and should be parked.
- The **Topic Tree & Spec Map** remains the authoritative scope: `documentation/01-specs/shapes/00-topic-tree-and-spec-map.md`.

Minimum PR bookkeeping (required):
- Add/extend the failing test first (per `documentation/02-implementation/00-strict-tdd-and-dom-validation.md`).
- Update:
  - `Current Status (Snapshot)` (when materially changed),
  - the ledger row(s) touched (Readiness/Implementation/Tests/Artifacts),
  - and the phase “exit criteria” checklist item(s) you advanced.

---

## Milestones & Gates (Bigger Picture)

Phases below are the long-form roadmap. To keep day-to-day work aligned, we use milestone gates.

Milestone gate definitions (prescriptive):

### M0 — Inventory & Baseline Test Harness
Exit criteria:
- We can run at least one end-to-end Shapes flow deterministically in CI.
- We have a reliable place to store regression fixtures (corpus/goldens/perf) and a stable canonical hashing policy.

### M1 — Authoritative Model + Transforms (Non-UI)
Exit criteria:
- Data model is versioned/migratable and validated.
- Transform + coordinate system contracts are implemented and unit-tested.

### M2 — Rendering Contract + Style/Paint Parity
Exit criteria:
- Shapes render through the existing Story paint stack (fills/strokes/effects) with deterministic output.
- Mode gating is correct (edit/master/presentation behavior).

### M3 — Selection + Hit Testing
Exit criteria:
- Hit testing + selection rules match spec and are covered by Playwright.

### M4 — Editing UX (Object + Vector)
Exit criteria:
- Object mode and vector mode edits are implemented with correct undo/redo coalescing.

### M5 — Booleans + Masks (Non-destructive)
Exit criteria:
- Boolean + mask nodes exist with deterministic failure policy and regression fixtures.

### M6 — Interop + Export Hardening
Exit criteria:
- Interop/export flows are stable, deterministic, and covered (including degrade ladder + warnings).

Gate policy (prevents rabbit holes):
- Prefer work that advances the **earliest incomplete milestone**.
- Phase 10 (interop) work is allowed, but should be explicitly justified as either:
  - unblocking a milestone gate (e.g., export contract), or
  - required product acceptance for paste/import.

---

## Work-in-Progress Limits (Prevents Getting Lost)

To keep progress visible and avoid deep wandering:
- Maximum **2 active tracks** at once (e.g., “model+transforms” and “rendering contract”).
- Maximum **1 exploratory spike** at a time; spikes must end with:
  - a spec update (decision recorded), *or*
  - a testable plan item created in this file.
- If an increment takes longer than a single PR, split it into smaller PRs with intermediate, testable acceptance.

---

## Progress Dashboard (Update Weekly)

Update this section at least weekly so everyone sees the “north star”.

- Current milestone gate: M6 — Interop + Export Hardening
- Next milestone gate: Phase 10 — Interop (Figma paste → editable elements)
- Active tracks (max 2): Phase 10 interop hardening
- Blockers / open decisions: Spec readiness pass still needed for Phase 10 + interop coverage ledger.
- Last shipped (commit 9385edc): M5 booleans + unified masking (non-destructive) with Playwright gates + Vitest boolean corpus.

---

## Current Status (Snapshot — 2025-12-17)

This status snapshot reflects what is implemented in the repo today (not “planned”), with emphasis on the interop work we’ve been actively shipping.

### Phase Status
- Phase 0 (Tooling/Test harness): **PARTIAL** — Playwright + Vitest are in place and we have functional clipboard-paste coverage; initial Shapes corpus scaffolding + deterministic hashing is now present, but broader corpus coverage is still sparse.
- Phase 1–9 (Foundations → UX): **NOT TRACKED IN THIS PLAN FILE YET** — this document still needs a pass to mark what already exists in Story vs what remains for the new Shapes system.
- Milestone M1 (Authoritative Model + Transforms): **DONE** — canonical shape schema/migration/validation + transforms + coordinate spaces are implemented and covered by Vitest.
- Milestone M2 (Rendering Contract): **DONE** — renderer parity increments shipped (nested parent rotation + viewport/mode parity) with Playwright regressions; presentation now degrades gracefully when fullscreen is blocked.
- Milestone M3 (Selection + Hit Testing): **DONE** — deterministic hit tie-break implemented (priority → distance → z-order → hitKey) with Vitest unit coverage; Playwright regressions cover click selection, multi-select toggling, overlap z-order selection, sticky selection during drag, and click-empty clears selection.
- Milestone M4 (Editing UX: Object + Vector): **DONE** — object move/resize/rotate undo coalescing covered by Playwright; vector deep edit supports node/edge/handle hit + editing (box select with Shift/Ctrl, dblclick edge insert, dblclick node corner↔smooth, delete node/edge, nudge, handle drag), all coalesced into single undo steps and covered by Playwright.
- Milestone M5 (Booleans + Masks: Non-destructive): **DONE** — boolean nodes render derived vector geometry (non-destructive) with deterministic fallback policy and a CI-gated Vitest corpus; mask nodes apply unified DOM clip-path masking across element types (incl. text) with invert support and Playwright gates.
- Milestone M6 (Interop + Export Hardening): **DONE** — deterministic SVG export hardening shipped (vectors, flattened booleans, best-effort `<clipPath>` masks, rotation, gradients, image fills) plus theme-slot fill resolution and code/video fill rasterization to `<image>` when possible; exporter emits deterministic warnings metadata; Vitest: `tests/unit/export/ExporterSvgMarkup.test.js`.
- Phase 10 (Interop: Figma paste → editable elements): **IN PROGRESS** — editable SVG paste pipeline implemented for a conservative subset, behind a feature flag, with unit + Playwright coverage.
- Phase 11–12 (Perf/A11y/extensibility): **NOT STARTED (for Shapes program)**

### Phase 10 — Implemented Scope (Editable SVG Paste)
  - [x] `translate(...)`, `scale(...)`
  - [x] Multi-part `translate/scale` lists (SVG right-to-left ordering)
  - [x] `matrix(a 0 0 d e f)` only (scale + translate; no rotate/shear)
  - [x] Unsupported transforms (rotate/skew/general matrices) are ignored (import continues; deterministic warning)
  - [x] Mixed transform lists salvage any translate/scale/matrix axis-aligned parts and ignore the rest (deterministic warning)
  - [x] General `matrix(a b c d e f)` with rotate/shear salvage translation `e/f` (deterministic warning)
  - [x] `objectBoundingBox`
  - [x] `userSpaceOnUse` when explicit coords exist
  - [x] `href` / `xlink:href` inheritance (conservative: depth-limited chain, first-defined attr wins, stops inherited if missing)
  - [x] Deterministic fallback + warning for broken `href` chains (cycle/missing target)
  - [x] Deterministic warning + directional import for axis-aligned `gradientTransform` (applies to direction only; warns)
  - [x] `objectBoundingBox` with explicit/parseable `cx/cy/r`
  - [x] `href` / `xlink:href` inheritance (conservative: depth-limited chain, first-defined attr wins, stops inherited if missing)
  - [x] Deterministic fallback + warning for broken `href` chains (cycle/missing target)
  - [x] Deterministic fallback for unsupported features (e.g. rotate `gradientTransform`, non-centered focal points)
  - [x] `patternUnits="userSpaceOnUse"` + parseable `width/height`
  - [x] Supports `x/y` offsets; imports phase via `tileOffsetX/tileOffsetY`
  - [x] Axis-aligned `patternTransform` (translate/scale/matrix; no rotate/skew)
  - [x] `href` / `xlink:href` inheritance for patterns (conservative: depth-limited chain, first-defined attr wins, children inherited if missing)
  - [x] Deterministic fallback + warning for broken `href` chains (cycle/missing target)
  - [x] `patternUnits="objectBoundingBox"` when `patternContentUnits="objectBoundingBox"` and no `patternTransform`
  - [x] `patternUnits="objectBoundingBox"` when `patternContentUnits="userSpaceOnUse"` and no `patternTransform` (conservative: normalizes user-space content into a `0..1` tile)
  - [x] Imported as repeating `image` fill (SVG tile data URI)
  - [x] Detects `clip-path` usage and imports the shape anyway (clip is ignored; deterministic warning)
  - [x] Detects `mask` usage and imports the shape anyway (mask is ignored; deterministic warning)
  - [x] Detects `filter` usage and imports the shape anyway (filter is ignored; deterministic warning)
  - [x] Detects `mix-blend-mode` usage and imports the shape anyway (blend is ignored; deterministic warning)
  - [x] Vitest: `tests/unit/clipboard/EditableSvgImporter.test.js`
  - [x] Playwright: `tests/e2e/specs/functional/clipboard-html-svg-paste-editable.spec.ts`

### Phase 10 — Not Implemented Yet (Known Gaps)
- [x] Corpus fixtures: `tests/corpus/shapes/figma-paste/` (directory + canonical hash + warnings)
- [ ] Broader SVG paint support (beyond the conservative pattern subset)
- [ ] Broader transform support beyond axis-aligned scale/translate (e.g. rotate/skew; general matrices)
- [ ] True rotate/skew/general matrix support (baked transforms); current behavior warns+ignores (with limited salvage for translate/scale)
- [ ] True clip-path + masking rendering/import for pasted SVG (current behavior ignores and warns)

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
  - `tests/corpus/shapes/booleans/` (PRESENT)
  - `tests/corpus/shapes/paths/` (NOT PRESENT YET)
  - `tests/corpus/shapes/figma-paste/` (PRESENT)

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

Status:
- IN PROGRESS — editable SVG paste subset exists and is tested; corpus + broader interop remains.

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
This section is the **traceability system** that prevents gaps.

Use the ledger table below to track progress. Every Shapes PR must update at least one row.

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

## Spec Coverage Ledger (Source of Truth)

Status values (use these exact words to keep search/filters simple):
- **Readiness**: `NOT REVIEWED` | `BLOCKED` | `READY`
- **Implementation**: `NOT STARTED` | `IN PROGRESS` | `DONE`
- **Tests**: `NONE` | `VITEST` | `PLAYWRIGHT` | `VITEST+PLAYWRIGHT`
- **Artifacts**: `NONE` | `CORPUS` | `GOLDENS` | `PERF` | `MIXED`

| Spec file | Readiness | Implementation | Tests | Artifacts | Notes (owner, links, gaps) |
|---|---|---|---|---|---|
| `00-index.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `00-topic-tree-and-spec-map.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `01-system-architecture.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `02-data-model-and-serialization.md` | NOT REVIEWED | DONE | VITEST | NONE | Canonical v1 schema + migration + validation: `src/core/shapes/ShapeSchema.js`; tests: `tests/unit/shapes/ShapeSchema.test.js`. Existing migration hooks remain: `src/core/shapes/ShapeMigration.js`, `src/core/shapes/ShapeElementAdapter.js`. |
| `03-coordinate-systems.md` | NOT REVIEWED | DONE | VITEST+PLAYWRIGHT | NONE | Mode-aware container selection + world/screen mapping contract: `src/core/shapes/CoordinateSpaces.js`; unit tests: `tests/unit/shapes/CoordinateSpaces.test.js`. Presentation mapping verified end-to-end via `src/core/PresentationManager.js` + Playwright: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts`. |
| `04-precision-and-numerics.md` | NOT REVIEWED | IN PROGRESS | VITEST | NONE | Central epsilon + numeric helpers: `src/core/shapes/Epsilon.js`; tests: `tests/unit/shapes/Epsilon.test.js`. |
| `05-scene-graph-and-node-types.md` | NOT REVIEWED | IN PROGRESS | VITEST+PLAYWRIGHT | NONE | Parent-chain world transforms for DOM rendering: `src/core/shapes/SceneGraphTransforms.js`, renderer integration: `src/core/renderer/elements/VisualElement.js`, `src/core/renderer/elements/ShapeElement.js`; tests: `tests/unit/shapes/SceneGraphTransforms.test.js`, `tests/e2e/specs/functional/nested-parent-rotation-render.spec.ts`. |
| `06-transform-system.md` | NOT REVIEWED | DONE | VITEST | NONE | Affine transform utilities + element box transforms: `src/core/shapes/Transform2D.js`; tests: `tests/unit/shapes/Transform2D.test.js`. (Runtime alignment with `GeometryUtils` still TBD.) |
| `07-parametric-geometry.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Multiple shape kinds rendered + bounded: `src/core/renderer/elements/ShapeElement.js`, `src/core/canvas/GeometryUtils.js`, `src/core/shapes/ShapeElementAdapter.js` (parametric spec parity TBD). |
| `08-path-representation.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `08a-vector-networks.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `09-segments-and-beziers.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `10-control-points-and-handles.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `11-continuity-and-smoothness.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `11-undo-redo-and-operations.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Snapshot undo/redo exists: `src/core/HistoryManager.js`, interaction bracketing via `START_INTERACTION`/`END_INTERACTION` in `src/core/Store.js`. Playwright coverage asserts “drag == one undo”: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `12-hit-testing.md` | NOT REVIEWED | DONE | VITEST+PLAYWRIGHT | NONE | Element + handle hit-testing exists: `src/core/canvas/HitTesting.js`, `src/core/CanvasManager.js`. Deterministic tie-break implemented (priority → distance → z-order → hitKey) with unit coverage: `tests/unit/canvas/HitTestingTieBreak.test.js`. Functional coverage: `tests/e2e/specs/functional/m3-selection-hit-testing.spec.ts` (click-to-select, shift-click multi-select, overlap z-order selection). |
| `13-boolean-geometry-system.md` | NOT REVIEWED | DONE | VITEST+PLAYWRIGHT | MIXED | Boolean nodes (non-destructive) render derived vector geometry with deterministic fallback policy: `src/core/shapes/booleans/BooleanEngine.js`, `src/core/shapes/booleans/ShapeToPolygons.js`, runtime integration: `src/core/renderer/elements/ShapeElement.js`. Playwright gate: `tests/e2e/specs/functional/m5-booleans-masks.spec.ts`. Vitest corpus: `tests/unit/shapes/BooleanCorpus.test.js` + fixtures under `tests/corpus/shapes/booleans/`. |
| `14-style-and-paint-integration.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Paint stack present (fills/strokes/effects): `src/core/renderer/elements/ShapeElement.js`, UI panels: `src/ui/properties/FillSection.js`, `src/ui/properties/StrokeSection.js`, `src/ui/properties/EffectsSection.js`. Regression coverage: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts` asserts fill/stroke/effects DOM output in edit mode. |
| `15-masking-and-clipping.md` | NOT REVIEWED | DONE | PLAYWRIGHT | NONE | Unified DOM masking via computed CSS `clip-path` for any element type (incl. text) with invert support: `src/core/shapes/masking/MaskEngine.js`, renderer hook: `src/core/renderer/elements/VisualElement.js`. Playwright gate: `tests/e2e/specs/functional/m5-booleans-masks.spec.ts`. |
| `15-current-implementation-alignment.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `16-design-system-alignment.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `16-rendering-architecture.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Renderer exists with shape-specific element renderer: `src/core/renderer/elements/ShapeElement.js`, `src/core/renderer/`. Regressions: nested transform parity (`tests/e2e/specs/functional/nested-parent-rotation-render.spec.ts`) and mode/viewport parity (`tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts`). |
| `16a-tessellation-and-aa.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `17-caching-and-performance.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `18-operation-model-collaboration-readiness.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Operation + inverse ops plumbing exists: `src/core/collaboration/sync/StateSyncEngine.js` (Shapes op model alignment TBD). |
| `18-operation-model-future-collab.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `19-serialization-and-interop.md` | NOT REVIEWED | DONE | VITEST | NONE | Export + clipboard integration exists: `src/core/export/Exporter.js`, editable SVG importer in `src/core/clipboard/EditableSvgImporter.js` (spec parity TBD). SVG export hardening: `buildSvgMarkup()` supports `shapeKind:'vector'`, flattens `shapeKind:'boolean'` to `<path d=...>`, maps unified masks to SVG `<clipPath>` (best-effort), exports element rotation via `rotate(...)` in the wrapper `<g transform=...>`, and exports paint defs for fills (linear gradients via `<linearGradient>`, radial gradients via `<radialGradient>`, and image fills via `<pattern>` + `<image>`) using deterministic IDs. Adds theme-slot solid fill resolution (exports resolved colors, not theme-slot references) and a deterministic policy for code/video fills (rasterize to `<image>` when possible, otherwise fallback + warning metadata). Vitest: `tests/unit/export/ExporterSvgMarkup.test.js`. |
| `19a-figma-clipboard-import.md` | NOT REVIEWED | IN PROGRESS | VITEST+PLAYWRIGHT | CORPUS | Editable SVG paste subset + deterministic degrade ladder is shipping. |
| `20-interaction-modes-and-state-machine.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Canvas interaction state + tools exist: `src/core/CanvasManager.js`. Deep edit state added (`editor.deepEdit`) with Escape exit; vector node drag interaction added with bracketing; vector-mode marquee selection routes to deepEdit node selection. Coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `21-vector-editing-operations.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Implemented v1 ops in deep edit: dblclick edge insert node, delete node, delete edge, arrow-key nudge, cubic handle drag, dblclick node corner↔smooth; coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `22-selection-and-focus-ux.md` | NOT REVIEWED | DONE | PLAYWRIGHT | NONE | Selection wiring exists: `src/core/CanvasManager.js`, `src/ui/PropertyInspector.js`. Functional coverage: `tests/e2e/specs/functional/m3-selection-hit-testing.spec.ts` (multi-select toggling, sticky selection during drag, click-empty clears selection). (Hover hysteresis + vector-mode focus UX remain spec TODOs.) |
| `23-snapping-and-guides-shapes.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Snapping system exists: `src/core/canvas/SnappingSystem.js`, `src/core/CanvasManager.js` (Shapes delta TBD). |
| `25-product-level-requirements.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `26-canvas-and-viewport-shapes.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Canvas/viewport orchestration exists: `src/core/CanvasManager.js`, presentation scaling: `src/core/PresentationManager.js`. Regression: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts` (edit vs presentation viewport behavior). |
| `27-object-editing-ux.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Object drag move + resize interactions exist in `src/core/CanvasManager.js` and are bracketed for undo coalescing via `START_INTERACTION`/`END_INTERACTION`. Rotation hit zone tightened to avoid accidental rotate triggers when inside bounds (`src/core/canvas/HitTesting.js`). Playwright coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts` (move + resize undo). |
| `28-vector-editing-ux.md` | NOT REVIEWED | IN PROGRESS | PLAYWRIGHT | NONE | Minimal vector deep edit implemented: `editor.deepEdit` state (`src/core/store/InitialState.js`, `src/core/Store.js`, `src/core/store/handlers/EditorHandlers.js`), enter on dblclick for vector elements and exit on Escape (`src/core/CanvasManager.js`). Node hit-testing + node drag (single undo step) implemented (`src/core/canvas/HitTesting.js`, `src/core/CanvasManager.js`). Vector-mode node marquee/box selection + modifier semantics update `editor.deepEdit.selection.nodes` (deterministic ordering). Playwright coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `29-continuity-curve-ux.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `30-boolean-mask-ux.md` | NOT REVIEWED | DONE | PLAYWRIGHT | NONE | Inspector controls shipped for boolean op + mask invert: `src/ui/properties/BooleanSection.js`, `src/ui/properties/MaskSection.js`, wired in `src/ui/PropertyInspector.js`. Functional coverage: `tests/e2e/specs/functional/m5-booleans-masks.spec.ts`. |
| `31-styling-ui.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Styling UI sections exist: `src/ui/PropertyInspector.js`, `src/ui/properties/FillSection.js`, `src/ui/properties/StrokeSection.js`, `src/ui/properties/EffectsSection.js` (Shapes spec parity TBD). |
| `32-layer-panel-ux.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Layer tree exists: `src/ui/LayerTree.js`, container wiring: `src/ui/LeftPanel.js` (Shapes UX delta TBD). |
| `33-keyboard-and-gestures.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Global shortcuts + input-blocking exist: `src/main.js`, `src/core/InputManager.js`; canvas gestures (pan/zoom/drag) exist: `src/core/CanvasManager.js` (Shapes-specific bindings TBD). |
| `34-feedback-and-status.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `35-undo-redo-ux.md` | NOT REVIEWED | IN PROGRESS | NONE | NONE | Undo/redo UX wiring exists via shortcuts + menu actions: `src/main.js`, `src/ui/components/AppMenu/menuConfig.js`, `src/ui/services/MenuActionHandler.js`, store dispatch: `src/core/Store.js`; text edit bridging: `src/core/text/HistoryBridge.js`, `src/core/text/TextEditManager.js`. |
| `36-perceived-performance.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `37-accessibility.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |
| `38-customization-and-extensibility.md` | NOT REVIEWED | NOT STARTED | NONE | NONE |  |

---

## Spec Inventory (Reference List)
Keep this list as the stable, human-friendly grouping. Use the ledger above for status.

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
