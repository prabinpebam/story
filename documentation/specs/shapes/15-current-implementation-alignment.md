# Current Implementation Alignment (Source-of-Truth Inventory)

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This document exists to keep the Shapes specs grounded in **what Story already does today**. It is not a code walkthrough; it is a compatibility contract.

Principles reference: `documentation/product/principles.md`

---

## 1. What exists today (observed contracts)

### 1.0 Editor modes and active container
Story has multiple editor modes that affect which element container is active and how viewport transforms are computed:
- `edit`: active slide container; pan+zoom.
- `master`: active master container; pan+zoom.
- `presentation`: view-only; uses `PresentationManager` scale/offset mapping.

Compatibility requirement:
- Shapes editing interactions are enabled only in `edit`/`master`.
- Rendering output must be visually equivalent across modes; only the view transform differs.

### 1.1 Document / State shape
- Slides store elements as:
  - `slide.elements: Record<id, element>`
  - `slide.elementOrder: id[]`
- Store supports **effective slide data** in edit/master modes.

### 1.2 Undo/Redo mechanism
- Primary mechanism is **full-state snapshots** via `historyManager.push(state, meta)`.
- Store snapshotting is gated by `Store.isInteracting`.
- There are explicit actions:
  - `START_INTERACTION` → snapshots once + sets `isInteracting=true`
  - `END_INTERACTION` → sets `isInteracting=false`
- Text editing is a special case using `HistoryManager.pushTextEdit`.

Compatibility requirement:
- Shape interactions must bracket continuous edits with `START_INTERACTION`/`END_INTERACTION`.
- Property inspector scrubbing must use `UI_INTERACTION_START`/`UI_INTERACTION_END` to avoid tearing inputs.

### 1.3 Canvas interaction system
- Canvas is orchestrated by `CanvasManager` with sub-modules:
  - `HitTesting`, `SnappingSystem`, `GizmoRenderer`, `ViewportController`.
- Canvas interaction states exist (`IDLE`, `PANNING`, `DRAGGING`, `RESIZING`, `CREATING`, `SELECTING`).

### 1.4 Shape rendering approach
- Shapes are primarily rendered by `ShapeElement` (DOM-based), using:
  - Multiple fill layers as `.fill-layer` divs.
  - Theme-linked fills through CSS variables `--theme-slot{n}`.
  - Effects are applied in the element renderer.

Compatibility requirement:
- New shape geometry/features must not break the existing multi-fill/stroke/effects stack.
- Theme-linked colors must continue to work via tokens/CSS variables.

Paint parity (observed):
- `style.fills[]` supports layered fills including solid/theme-slot, gradients, and media fills (image/video by `assetId`) and code fills (canvas via CodeRunner).
- `style.strokes[]` supports layered strokes; strokes may be rendered as stacked layers.

Compatibility requirement:
- Any new geometry engine output must map into existing DOM/SVG layering without losing fill/stroke ordering.

### 1.5 Hit testing (current)
- `HitTesting` converts screen → world and calls `GeometryUtils.pointInElement(worldX, worldY, el)`.
- Handle hit testing is bbox-oriented (resize/radius/rotate handles) with zoom-aware tolerances.

Compatibility requirement:
- As we introduce ellipse/path hit-testing, we must preserve existing bbox hit-testing behavior for legacy types.

### 1.7 Serialization constraints (`.str` round-trip)
Observed requirement across the app:
- `.str` is treated as a lossless document container; the serializer/deserializer effectively copies JSON properties.

Compatibility requirement:
- Shape data must be JSON-safe and forward-compatible.
- Unknown fields must be preserved across load/save (do not “sanitize” away fields we don’t understand).
- Migrations must be additive and non-breaking; when in doubt, retain old fields and compute derived behavior at runtime.

### 1.6 Property Inspector structure
- Inspector is composed of sections:
  - `PositionSection`, `LayoutSection`, `AppearanceSection`, `FillSection`, `StrokeSection`, `EffectsSection`, `ExportSection`, plus `SvgSection` and `TextSection`.
- Re-render is suppressed when `state.ui.isInteracting` is true.

Compatibility requirement:
- Any new shape/vector UI must integrate by adding a **new section** or extending existing ones without duplicating components.

---

## 2. Observed inconsistencies (must be resolved via migration, not a breaking change)

### 2.1 Shape type representation
- There are multiple representations in the codebase (e.g., `type: 'shape'` with `shape: 'rectangle'`, and also `type: 'rect'`/`'circle'`, plus type names in inspector like `'rectangle'`/`'ellipse'`).

Spec requirement:
- Define a single canonical shape schema.
- Provide a compatibility layer + migration plan.

### 2.2 Renderer capability vs spec ambition
Risk:
- Some specs describe “Figma-class” behaviors that assume a full geometry/render backend; Story currently renders shapes in the DOM with layered fills/strokes and uses canvas for interaction UI.

Spec requirement:
- Specs must always define DOM-first behavior and clearly label any alternative backend as optional.

---

## 3. Non-breaking integration strategy (what the specs will assume)

- Introduce a normalized “shape descriptor” (conceptual) that maps legacy element shapes to canonical forms.
- Keep DOM rendering as the first backend; geometry engine must provide paths for:
  - hit testing
  - boolean/mask evaluation
  - export
  - vector edit mode

---

## 4. Guardrails (Principles-aligned)

- No big-bang refactors.
- Each PR must include Vitest and/or Playwright validations relevant to the change.
- No new hardcoded CSS values: use existing design tokens and components.
- Undo/redo must remain correct; if history model must evolve, it must be explicitly spec’d and staged.

## 5. Quality critique (gaps to close)
- This inventory needs to be kept current as code changes; otherwise it becomes misleading. Add a lightweight “update when X changes” checklist in PR templates.
- Mode/viewport constraints are easy to forget; they should be referenced by all interaction specs (hit testing, snapping, selection).
