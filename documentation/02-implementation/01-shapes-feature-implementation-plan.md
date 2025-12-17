# Shapes Feature — Singular Completion Plan (Spec-Led, Strict TDD)

**Goal**: complete the Shapes + Vector Editing feature set with **nothing left out**.

This file is the **only active plan** for Shapes execution. The prior plan has been archived at:
- `documentation/archive/plans/shapes/01-shapes-feature-implementation-plan.v1.md`

References (must stay in sync):
- Strict TDD rules: `documentation/02-implementation/00-strict-tdd-and-dom-validation.md`
- Shapes canonical index: `documentation/01-specs/shapes/00-index.md`
- Shapes canonical spec map: `documentation/01-specs/shapes/00-topic-tree-and-spec-map.md`

---

## Non‑Negotiable Rules (How work is allowed to ship)

- **Red → Green → Refactor** for every increment.
- **Every increment adds/updates Playwright functional tests with DOM/UI assertions**.
- Add **Vitest tests** whenever the increment introduces logic (geometry, transforms, canonicalization, hit testing, import/export, determinism).
- Every bug fix requires a **regression test first** (corpus fixture or test).
- Each PR must advance **exactly one gate** below and update the **Spec Coverage Ledger** row(s).

---

## What “Done” means (No loopholes)

Shapes is “done” only when **all** are true:

Important: completing a **gate** (e.g., G0) is **not** the same as declaring the Shapes feature “done”. Gates are checkpoints; the items below are the only criteria for final completion.

1) **Every Shapes spec file** in `documentation/01-specs/shapes/` is in one of these end states:
   - **Implemented**: Ledger shows `Readiness=READY` and `Implementation=DONE`, with required tests/artifacts present.
   - **Explicit v1 non‑goal**: Ledger still shows `Readiness=READY`, but the spec itself is updated to clearly mark the v1 non‑goal scope and the ledger `Notes` explicitly says `V1 NON-GOAL` (and why).

2) **No ledger rows remain in `NOT REVIEWED` or `BLOCKED`**.

3) **Regression artifacts exist where the spec requires them** (corpus/goldens/perf), and are CI-gated.

4) **Perf smoke gates exist** for representative stress scenes and clipboard paste/undo cycles.

If any spec is “not started” but still in scope, Shapes is not done.

---

## Execution Gates (The only roadmap)

These gates are intentionally spec-led. When Gate G9 is complete, Shapes is complete.

### G0 — Scope lock + ledger normalization (paper cuts first)
**Purpose**: remove ambiguity so “done” is mechanically provable.

Exit criteria:
- For **every** Shapes spec file, ledger `Readiness` is set to one of: `READY` or `BLOCKED` (no `NOT REVIEWED`).
- For any `BLOCKED` spec, the `Notes` include: the exact open decision(s) and the owner.
- Any spec that will be a **v1 non‑goal** is explicitly marked as such in the spec text and referenced in the ledger notes.

Note:
- It is expected that some rows may remain `BLOCKED` after G0; they must be resolved (and flipped to `READY`) before final feature completion.

Required tests/artifacts:
- None (documentation-only), but must not contradict existing tests.

---

### G1 — Geometry Core closure (paths + vector networks)
**Specs targeted**: `07`, `08`, `08a`, `09`, `10`, `11`.

Exit criteria:
- Path representation + segment operations exist per spec (or marked v1 non‑goal with rationale).
- Vector network requirements are either implemented or explicitly scoped out.
- A **paths corpus** exists and is CI-gated: `tests/corpus/shapes/paths/`.

Required tests/artifacts:
- Vitest: canonicalization/determinism + operation semantics.
- Corpus: minimal repro fixtures for degenerate cases.

---

### G2 — Rendering parity closure (architecture + tessellation/AA + paint parity)
**Specs targeted**: `14`, `16`, `16a`.

Exit criteria:
- Rendering architecture decisions are implemented (or v1 non‑goal).
- Any tessellation/AA requirements are implemented (or explicitly scoped out).
- Paint/style parity gaps are closed, including deterministic output.

Required tests/artifacts:
- Playwright: DOM output assertions for fills/strokes/effects across modes.
- Vitest: any derived-geometry determinism used for rendering.

---

### G3 — Tooling & test infrastructure closure (corpus/perf/stress fixtures)
**Specs targeted**: `24`.

Exit criteria:
- All corpus folders required by spec exist and have at least one CI-gated seed fixture:
  - `tests/corpus/shapes/booleans/` (already exists)
  - `tests/corpus/shapes/figma-paste/` (already exists)
  - `tests/corpus/shapes/paths/` (must exist after G1)
- Stress/perf fixtures strategy is implemented (file-backed where required by spec).

Required tests/artifacts:
- Vitest perf smoke where appropriate.
- Playwright perf smoke for paste/undo cycles.

---

### G4 — Interaction + UX closure (modes/ops/selection/viewport)
**Specs targeted**: `20`, `21`, `22`, `23`, `26`, `27`, `28`, `29`.

Exit criteria:
- All interaction modes and transitions match spec.
- Vector editing operations set matches spec (or v1 non‑goal explicitly).
- Snapping/guides (Shapes delta) is implemented or explicitly scoped.

Required tests/artifacts:
- Playwright: gestures + mode transitions + modifier semantics.
- Vitest: deterministic operation semantics for any new logic.

---

### G5 — UI surfaces closure (styling UI, layer panel, feedback/status, design alignment)
**Specs targeted**: `16-design-system-alignment`, `31`, `32`, `34`.

Exit criteria:
- All required UI surfaces exist and match spec behaviors.
- Feedback/status for warnings and invalid ops is surfaced per spec.

Required tests/artifacts:
- Playwright: inspector and layer panel assertions, and status/warning UI.

---

### G6 — Creation UX closure (toolbar + creation wiring)
**Specs targeted**: `39`.

Exit criteria:
- Toolbar creation flows are implemented for Shapes as specified.
- Creation yields the correct shape kinds and initial properties.

Required tests/artifacts:
- Playwright: create each supported shape kind + verify DOM/model state.

---

### G7 — Interop closure (serialization/export + Figma paste)
**Specs targeted**: `19`, `19a`.

Exit criteria:
- Export and clipboard import specs are fully met, including deterministic degrade ladders.
- Corpus fixtures cover every supported feature + every bug fix.

Required tests/artifacts:
- Vitest: canonical import/export logic and determinism.
- Playwright: end-to-end paste flows.
- Corpus: fixtures + canonical hashes + deterministic warnings.

---

### G8 — Performance + perceived performance + caching closure
**Specs targeted**: `17`, `36`.

Exit criteria:
- Caching layers and invalidation rules are implemented (or explicitly scoped).
- Perceived performance behaviors are implemented (or explicitly scoped).
- Perf smoke gates exist for representative stress scenes.

Required tests/artifacts:
- Perf smoke tests with wide thresholds; fixtures must be deterministic.

---

### G9 — Product requirements + accessibility + extensibility closure (finish line)
**Specs targeted**: `25`, `37`, `38`, plus final “spec readiness sweep” across *all* specs.

Exit criteria:
- Product-level requirements are met.
- Accessibility requirements are implemented and tested.
- Customization/extensibility constraints are implemented and tested.
- Final ledger sweep: every spec row is either **Implemented** or **V1 NON-GOAL**, and all tests are green.

Required tests/artifacts:
- Playwright: role/name and keyboard-only flows where required.

---

## Work sequencing (one-liner)

Complete gates in strict order: **G0 → G1 → G2 → G3 → G4 → G5 → G6 → G7 → G8 → G9**.

If a new issue is discovered mid-gate, fix it, add regression coverage, and keep the PR within the current gate.

---

## Spec Coverage Ledger (Source of Truth)

Status values (use these exact words to keep search/filters simple):
- **Readiness**: `NOT REVIEWED` | `BLOCKED` | `READY`
- **Implementation**: `NOT STARTED` | `IN PROGRESS` | `DONE`
- **Tests**: `NONE` | `VITEST` | `PLAYWRIGHT` | `VITEST+PLAYWRIGHT`
- **Artifacts**: `NONE` | `CORPUS` | `GOLDENS` | `PERF` | `MIXED`

Ledger is maintained in this file because the plan and the traceability system must never drift.

| Spec file | Readiness | Implementation | Tests | Artifacts | Notes (owner, links, gaps) |
|---|---|---|---|---|---|
| `00-index.md` | READY | NOT STARTED | NONE | NONE |  |
| `00-topic-tree-and-spec-map.md` | READY | NOT STARTED | NONE | NONE |  |
| `01-system-architecture.md` | READY | NOT STARTED | NONE | NONE |  |
| `02-data-model-and-serialization.md` | BLOCKED | DONE | VITEST | NONE | Canonical v1 schema + migration + validation: `src/core/shapes/ShapeSchema.js`; tests: `tests/unit/shapes/ShapeSchema.test.js`. Existing migration hooks remain: `src/core/shapes/ShapeMigration.js`, `src/core/shapes/ShapeElementAdapter.js`. Open decision: whether/how to persist a point-model alongside the segment model vs compute on demand. Owner: Prabin. |
| `03-coordinate-systems.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Mode-aware container selection + world/screen mapping contract: `src/core/shapes/CoordinateSpaces.js`; unit tests: `tests/unit/shapes/CoordinateSpaces.test.js`. Presentation mapping verified end-to-end via `src/core/PresentationManager.js` + Playwright: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts`. |
| `04-precision-and-numerics.md` | READY | IN PROGRESS | VITEST | NONE | Central epsilon + numeric helpers: `src/core/shapes/Epsilon.js`; tests: `tests/unit/shapes/Epsilon.test.js`. |
| `05-scene-graph-and-node-types.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | NONE | Parent-chain world transforms for DOM rendering: `src/core/shapes/SceneGraphTransforms.js`, renderer integration: `src/core/renderer/elements/VisualElement.js`, `src/core/renderer/elements/ShapeElement.js`; tests: `tests/unit/shapes/SceneGraphTransforms.test.js`, `tests/e2e/specs/functional/nested-parent-rotation-render.spec.ts`. |
| `06-transform-system.md` | READY | DONE | VITEST | NONE | Affine transform utilities + element box transforms: `src/core/shapes/Transform2D.js`; tests: `tests/unit/shapes/Transform2D.test.js`. (Runtime alignment with `GeometryUtils` still TBD.) |
| `07-parametric-geometry.md` | READY | IN PROGRESS | NONE | NONE | Multiple shape kinds rendered + bounded: `src/core/renderer/elements/ShapeElement.js`, `src/core/canvas/GeometryUtils.js`, `src/core/shapes/ShapeElementAdapter.js` (parametric spec parity TBD). |
| `08-path-representation.md` | READY | NOT STARTED | NONE | NONE |  |
| `08a-vector-networks.md` | READY | NOT STARTED | NONE | NONE |  |
| `09-segments-and-beziers.md` | READY | NOT STARTED | NONE | NONE |  |
| `10-control-points-and-handles.md` | READY | NOT STARTED | NONE | NONE |  |
| `11-continuity-and-smoothness.md` | READY | NOT STARTED | NONE | NONE |  |
| `11-undo-redo-and-operations.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Snapshot undo/redo exists: `src/core/HistoryManager.js`, interaction bracketing via `START_INTERACTION`/`END_INTERACTION` in `src/core/Store.js`. Playwright coverage asserts “drag == one undo”: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `12-hit-testing.md` | READY | DONE | VITEST+PLAYWRIGHT | NONE | Element + handle hit-testing exists: `src/core/canvas/HitTesting.js`, `src/core/CanvasManager.js`. Deterministic tie-break implemented (priority → distance → z-order → hitKey) with unit coverage: `tests/unit/canvas/HitTestingTieBreak.test.js`. Functional coverage: `tests/e2e/specs/functional/m3-selection-hit-testing.spec.ts` (click-to-select, shift-click multi-select, overlap z-order selection). |
| `13-boolean-geometry-system.md` | READY | DONE | VITEST+PLAYWRIGHT | MIXED | Boolean nodes (non-destructive) render derived vector geometry with deterministic fallback policy: `src/core/shapes/booleans/BooleanEngine.js`, `src/core/shapes/booleans/ShapeToPolygons.js`, runtime integration: `src/core/renderer/elements/ShapeElement.js`. Playwright gate: `tests/e2e/specs/functional/m5-booleans-masks.spec.ts`. Vitest corpus: `tests/unit/shapes/BooleanCorpus.test.js` + fixtures under `tests/corpus/shapes/booleans/`. |
| `14-style-and-paint-integration.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Paint stack present (fills/strokes/effects): `src/core/renderer/elements/ShapeElement.js`, UI panels: `src/ui/properties/FillSection.js`, `src/ui/properties/StrokeSection.js`, `src/ui/properties/EffectsSection.js`. Regression coverage: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts` asserts fill/stroke/effects DOM output in edit mode. |
| `15-masking-and-clipping.md` | READY | DONE | PLAYWRIGHT | NONE | Unified DOM masking via computed CSS `clip-path` for any element type (incl. text) with invert support: `src/core/shapes/masking/MaskEngine.js`, renderer hook: `src/core/renderer/elements/VisualElement.js`. Playwright gate: `tests/e2e/specs/functional/m5-booleans-masks.spec.ts`. |
| `15-current-implementation-alignment.md` | READY | NOT STARTED | NONE | NONE |  |
| `16-design-system-alignment.md` | READY | NOT STARTED | NONE | NONE |  |
| `16-rendering-architecture.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Renderer exists with shape-specific element renderer: `src/core/renderer/elements/ShapeElement.js`, `src/core/renderer/`. Regressions: nested transform parity (`tests/e2e/specs/functional/nested-parent-rotation-render.spec.ts`) and mode/viewport parity (`tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts`). |
| `16a-tessellation-and-aa.md` | READY | NOT STARTED | NONE | NONE |  |
| `17-caching-and-performance.md` | READY | NOT STARTED | NONE | NONE |  |
| `18-operation-model-collaboration-readiness.md` | READY | IN PROGRESS | NONE | NONE | Operation + inverse ops plumbing exists: `src/core/collaboration/sync/StateSyncEngine.js` (Shapes op model alignment TBD). |
| `18-operation-model-future-collab.md` | READY | NOT STARTED | NONE | NONE |  |
| `19-serialization-and-interop.md` | READY | DONE | VITEST | NONE | Export + clipboard integration exists: `src/core/export/Exporter.js`, editable SVG importer in `src/core/clipboard/EditableSvgImporter.js` (spec parity TBD). SVG export hardening: `buildSvgMarkup()` supports `shapeKind:'vector'`, flattens `shapeKind:'boolean'` to `<path d=...>`, maps unified masks to SVG `<clipPath>` (best-effort), exports element rotation via `rotate(...)` in the wrapper `<g transform=...>`, and exports paint defs for fills (linear gradients via `<linearGradient>`, radial gradients via `<radialGradient>`, and image fills via `<pattern>` + `<image>`) using deterministic IDs. Adds theme-slot solid fill resolution (exports resolved colors, not theme-slot references) and a deterministic policy for code/video fills (rasterize to `<image>` when possible, otherwise fallback + warning metadata). Vitest: `tests/unit/export/ExporterSvgMarkup.test.js`. |
| `19a-figma-clipboard-import.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | MIXED | Editable SVG paste subset is shipping with deterministic transforms (baked) + clip-path/mask import + supported `mix-blend-mode` → paint `blendMode` mapping (end-to-end via safe inline-style allowlist). Supported SVG effects subset: `feGaussianBlur` → `style.blur`, `feDropShadow` → `style.dropShadow`, otherwise drop with `WARN_EFFECT_DROPPED`. SVG `opacity` imports as element opacity (0..1) and defaults are omitted for deterministic output. Warning code used for blend-mode degrade: `WARN_BLENDMODE_DEGRADED`. Artifacts: corpus fixtures under `tests/corpus/shapes/figma-paste/` (incl. `filter-basic`, `drop-shadow-basic`) + corpus gate `tests/unit/clipboard/FigmaPasteCorpus.test.js`; e2e coverage in `tests/e2e/specs/functional/clipboard-html-svg-paste-editable.spec.ts`. |
| `20-interaction-modes-and-state-machine.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Canvas interaction state + tools exist: `src/core/CanvasManager.js`. Deep edit state added (`editor.deepEdit`) with Escape exit; vector node drag interaction added with bracketing; vector-mode marquee selection routes to deepEdit node selection. Coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `21-vector-editing-operations.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Implemented v1 ops in deep edit: dblclick edge insert node, delete node, delete edge, arrow-key nudge, cubic handle drag, dblclick node corner↔smooth; coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `22-selection-and-focus-ux.md` | READY | DONE | PLAYWRIGHT | NONE | Selection wiring exists: `src/core/CanvasManager.js`, `src/ui/PropertyInspector.js`. Functional coverage: `tests/e2e/specs/functional/m3-selection-hit-testing.spec.ts` (multi-select toggling, sticky selection during drag, click-empty clears selection). (Hover hysteresis + vector-mode focus UX remain spec TODOs.) |
| `23-snapping-and-guides-shapes.md` | READY | IN PROGRESS | NONE | NONE | Snapping system exists: `src/core/canvas/SnappingSystem.js`, `src/core/CanvasManager.js` (Shapes delta TBD). |
| `24-tooling-and-testing.md` | READY | IN PROGRESS | VITEST+PLAYWRIGHT | MIXED | Corpus scaffolding exists: `tests/corpus/shapes/booleans/` + `tests/corpus/shapes/figma-paste/` (paths corpus still missing: `tests/corpus/shapes/paths/`). Perf smoke gates exist for clipboard import/export (`tests/unit/perf/ClipboardImportExportPerf.test.js`) and paste+undo cycles (`tests/e2e/specs/performance/clipboard-paste-editable-perf.spec.ts`). |
| `25-product-level-requirements.md` | READY | NOT STARTED | NONE | NONE |  |
| `26-canvas-and-viewport-shapes.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Canvas/viewport orchestration exists: `src/core/CanvasManager.js`, presentation scaling: `src/core/PresentationManager.js`. Regression: `tests/e2e/specs/functional/m2-rendering-mode-viewport-parity.spec.ts` (edit vs presentation viewport behavior). |
| `27-object-editing-ux.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Object drag move + resize interactions exist in `src/core/CanvasManager.js` and are bracketed for undo coalescing via `START_INTERACTION`/`END_INTERACTION`. Rotation hit zone tightened to avoid accidental rotate triggers when inside bounds (`src/core/canvas/HitTesting.js`). Playwright coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts` (move + resize undo). |
| `28-vector-editing-ux.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Minimal vector deep edit implemented: `editor.deepEdit` state (`src/core/store/InitialState.js`, `src/core/Store.js`, `src/core/store/handlers/EditorHandlers.js`), enter on dblclick for vector elements and exit on Escape (`src/core/CanvasManager.js`). Node hit-testing + node drag (single undo step) implemented (`src/core/canvas/HitTesting.js`, `src/core/CanvasManager.js`). Vector-mode node marquee/box selection + modifier semantics update `editor.deepEdit.selection.nodes` (deterministic ordering). Playwright coverage: `tests/e2e/specs/functional/m4-editing-ux.spec.ts`. |
| `29-continuity-curve-ux.md` | READY | NOT STARTED | NONE | NONE |  |
| `30-boolean-mask-ux.md` | READY | IN PROGRESS | PLAYWRIGHT | NONE | Core boolean/mask nodes + node-level inspector controls exist (`src/core/store/handlers/ElementHandlers.js`, `src/ui/properties/BooleanSection.js`, `src/ui/properties/MaskSection.js`). NEW in spec: selection-level composition UI section + explicit invalid-selection UX + flatten disablement (UI surface not implemented yet). Existing functional coverage targets core composition (`tests/e2e/specs/functional/m5-booleans-masks.spec.ts`). |
| `31-styling-ui.md` | READY | IN PROGRESS | NONE | NONE | Styling UI sections exist: `src/ui/PropertyInspector.js`, `src/ui/properties/FillSection.js`, `src/ui/properties/StrokeSection.js`, `src/ui/properties/EffectsSection.js` (Shapes spec parity TBD). |
| `32-layer-panel-ux.md` | READY | IN PROGRESS | NONE | NONE | Layer tree exists: `src/ui/LayerTree.js`, container wiring: `src/ui/LeftPanel.js` (Shapes UX delta TBD). |
| `33-keyboard-and-gestures.md` | READY | IN PROGRESS | NONE | NONE | Global shortcuts + input-blocking exist: `src/main.js`, `src/core/InputManager.js`; canvas gestures (pan/zoom/drag) exist: `src/core/CanvasManager.js` (Shapes-specific bindings TBD). |
| `34-feedback-and-status.md` | READY | NOT STARTED | NONE | NONE |  |
| `35-undo-redo-ux.md` | READY | IN PROGRESS | NONE | NONE | Undo/redo UX wiring exists via shortcuts + menu actions: `src/main.js`, `src/ui/components/AppMenu/menuConfig.js`, `src/ui/services/MenuActionHandler.js`, store dispatch: `src/core/Store.js`; text edit bridging: `src/core/text/HistoryBridge.js`, `src/core/text/TextEditManager.js`. |
| `36-perceived-performance.md` | READY | NOT STARTED | NONE | NONE |  |
| `37-accessibility.md` | READY | NOT STARTED | NONE | NONE |  |
| `38-customization-and-extensibility.md` | READY | NOT STARTED | NONE | NONE |  |
| `39-toolbar-tools-and-creation-ux.md` | READY | NOT STARTED | NONE | NONE | Spec added to surface shape creation in existing floating toolbar + shortcuts. Implementation requires toolbar dropdown + `SET_ACTIVE_TOOL({tool:'shape',shapeKind})` wiring and Canvas creation branching on `activeToolOptions.shapeKind` (current `activeTool==='shape'` creates legacy rect only). |
