# Shapes & Vector Editing Specification (Index)

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This spec defines the **Shapes system** for Story: creation, rendering, selection, editing (parametric + vector), and non-destructive operations (boolean, masks), with a focus on **robustness, determinism, and UI correctness**.

It is intentionally structured like the existing specs (see `typography-system/00-index.md`): one index + a set of focused documents that can be implemented and tested incrementally.

## Source Notes
- Research notes and design direction: [rough-notes.md](./rough-notes.md)

---

## 1. Scope

### In Scope
- Primitive parametric shapes: **Rectangle, Ellipse, Line, Polygon, Star**
- Shape rendering (fills, strokes, effects integration) on the canvas
- Paint parity with current system:
  - multi-fill
  - gradient fill
  - image/photo fills
  - video/media fills
  - code fill (shader-like canvas fill)
  - multi-stroke
- Hit-testing for fills, strokes, and (eventually) path segments/points
- Editing workflows:
  - Object mode (resize/rotate/move)
  - Parametric editing (corner radii, smoothing, star radii, polygon sides)
  - Vector edit mode (points + handles, segment ops)
- Non-destructive geometry nodes:
  - **Boolean** (union/subtract/intersect/exclude)
  - **Mask/Clip** (single masking model that works for shapes, text, images, and videos)
- Export/serialization requirements (at least internal persistence; SVG mapping as target)
- Figma clipboard paste → editable Story elements (SVG/HTML clipboard import)
- Undo/redo correctness and collaboration-readiness at the operation layer
- Performance strategy: caching, incremental recompute, dirty regions

### Explicit Non-Goals (for v1)
- CAD/NURBS curves
- Gradient mesh authoring (existing mesh gradient system can remain separate)
- Full Illustrator-class pathfinder edge cases on day 1
- Arbitrary SVG import fidelity beyond the defined supported subset (Figma paste is covered; “random SVG from the internet” fidelity is not)

---

## 2. Product Guarantees (Acceptance Targets)

- **Correctness**: geometry edits are deterministic (same input ops → same result)
- **Undo/Redo**: every user-visible edit is reversible; drags coalesce into single undo steps
- **Responsiveness**: interactive edits remain smooth (target 60fps; degrade gracefully)
- **Non-destructive** by default: booleans/masks keep operands editable until flatten
- **Compatibility**: paths + styles map cleanly to SVG concepts (even if not fully exported yet)

---

## 3. Canonical Mental Model (Shared Vocabulary)

Anchor concepts (aligned with your research notes):
- **Node**: scene graph entity (shape, vector path, boolean, mask, group)
- **Geometry**: either **parametric** (rectangle params) or **path-based** (segments/points)
- **Derived Geometry**: boolean results, stroke outlines, tessellation meshes — computed, never edited directly
- **Style/Paint**: fills/strokes/effects applied to geometry
- **Editing Mode**: object vs vector vs boolean edit vs mask edit

---

## 4. High-Level Implementation Plan (Phased)

This is intentionally incremental (small PRs), and mirrors the approach used in the typography system plan.

### Phase 0 — Discovery & Alignment
- Inventory what already exists (shape element types, renderer, inspector UI, hit testing, history)
- Decide the **authoritative geometry model** for shapes (parametric-first, vector-second)
- Define what the **minimum viable** vector edit surface is (points + handles + continuity)

### Phase 1 — Data Model (Authoritative + Diffable)
- Define/confirm:
  - Shape node schema for primitives (params)
  - Vector path schema (paths → segments → points)
  - Boolean/mask node schemas (non-destructive references)
  - A minimal style reference strategy (reuse current fill/stroke/effects systems)
- Add migrations to keep old documents loading safely

### Phase 2 — Geometry Engine (CPU)
- Parametric → path conversion (lazy)
- Core path utilities:
  - bounding boxes
  - transforms
  - flattening / subdivision rules
  - fill rule handling
- Boolean clipping algorithm selection + caching strategy
- Stroke expansion strategy (at least for export/booleans; rendering may use existing stroke rendering)

### Phase 3 — Rendering Integration
- Define render contract: resolved node → render primitives
- Implement caching layers:
  - resolved path cache (by nodeId + params)
  - boolean result cache
  - stroke outline cache (if needed)
- Implement tessellation + AA as a required derived pipeline (export/reference backend): [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

### Phase 4 — Interaction Model & UX
- Hit testing priority rules (fill vs stroke vs points)
- Selection visualization (bbox + points/handles in vector mode)
- Tool behaviors:
  - Create shape by drag
  - Parametric handles (corner radius, star/polygon controls)
  - Vector edits (move point, move handle, add/split/join)
- Constraint system integration (snapping, shift/alt modifiers)

### Phase 5 — Inspector & Layer Tree
- Contextual inspector sections for shapes
- Boolean/mask UI affordances (operand drill-in, reorder)
- “Flatten” actions and their irreversible semantics

### Phase 6 — Testing & Hardening
- Unit tests (geometry): conversion, bounds, continuity constraints
- Property-based / fuzz tests (boolean robustness)
- Playwright flows (create/edit/undo/redo, multi-select, inspector-driven edits)
- Performance guardrails (profiling scripts + regression thresholds where feasible)

---

## 5. Exhaustive Documentation Set (What We Will Spec)

Start here (canonical TOC): [00-topic-tree-and-spec-map.md](./00-topic-tree-and-spec-map.md)

Alignment anchors:
- Current implementation inventory: [15-current-implementation-alignment.md](./15-current-implementation-alignment.md)
- Design system rules for Shapes UI: [16-design-system-alignment.md](./16-design-system-alignment.md)

Core engine specs (scaffolded):
- [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)
- [03-coordinate-systems.md](./03-coordinate-systems.md)
- [04-precision-and-numerics.md](./04-precision-and-numerics.md)
- [05-scene-graph-and-node-types.md](./05-scene-graph-and-node-types.md)
- [06-transform-system.md](./06-transform-system.md)
- [07-parametric-geometry.md](./07-parametric-geometry.md)
- [08-path-representation.md](./08-path-representation.md)
- [08a-vector-networks.md](./08a-vector-networks.md)
- [09-segments-and-beziers.md](./09-segments-and-beziers.md)
- [10-control-points-and-handles.md](./10-control-points-and-handles.md)
- [11-continuity-and-smoothness.md](./11-continuity-and-smoothness.md)
- [12-hit-testing.md](./12-hit-testing.md)
- [13-boolean-geometry-system.md](./13-boolean-geometry-system.md)
- [14-style-and-paint-integration.md](./14-style-and-paint-integration.md)
- [15-masking-and-clipping.md](./15-masking-and-clipping.md)

Rendering/performance/interop specs (scaffolded):
- [16-rendering-architecture.md](./16-rendering-architecture.md)
- [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)
- [17-caching-and-performance.md](./17-caching-and-performance.md)
- [18-operation-model-collaboration-readiness.md](./18-operation-model-collaboration-readiness.md)
- [19-serialization-and-interop.md](./19-serialization-and-interop.md)
- [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md)

Interaction/UX specs (scaffolded):
- [20-interaction-modes-and-state-machine.md](./20-interaction-modes-and-state-machine.md)
- [21-vector-editing-operations.md](./21-vector-editing-operations.md)
- [22-selection-and-focus-ux.md](./22-selection-and-focus-ux.md)
- [23-snapping-and-guides-shapes.md](./23-snapping-and-guides-shapes.md)
- [26-canvas-and-viewport-shapes.md](./26-canvas-and-viewport-shapes.md)
- [27-object-editing-ux.md](./27-object-editing-ux.md)
- [28-vector-editing-ux.md](./28-vector-editing-ux.md)
- [29-continuity-curve-ux.md](./29-continuity-curve-ux.md)
- [30-boolean-mask-ux.md](./30-boolean-mask-ux.md)
- [31-styling-ui.md](./31-styling-ui.md)
- [32-layer-panel-ux.md](./32-layer-panel-ux.md)
- [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)
- [34-feedback-and-status.md](./34-feedback-and-status.md)
- [35-undo-redo-ux.md](./35-undo-redo-ux.md)
- [36-perceived-performance.md](./36-perceived-performance.md)
- [37-accessibility.md](./37-accessibility.md)
- [38-customization-and-extensibility.md](./38-customization-and-extensibility.md)
- [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md)

The goal is: **nothing left unspecified**. Each document below is scoped, testable, and PR-friendly.

## 6. Quality critique (gaps + risks)
- Several linked docs are still marked Draft; implementation should not start until v1-critical “open decisions” are resolved (especially parametric schema and export fallbacks).
- The highest-risk integration points in Story are DOM rendering + multi-layer paints + presentation mode mapping; each feature spec must explicitly restate mode gating and paint parity.
- Boolean/mask correctness requires a failure policy (non-fatal, non-destructive) and deterministic canonicalization; any spec that omits this will cause regressions.

---

## 5.1 Current Implementation Alignment (Must Match)

This section is intentionally **implementation-led**: these are constraints and facts from the current Story app that the Shapes system must align to.

### A) Viewport rendering engines (today)
- **DOM content layer** (`#slide-content`): primary rendering of visual elements (shapes, text, images, SVG) using HTML/CSS.
- **DOM background layer** (`#slide-background`): slide background rendering.
- **Canvas overlay** (`#interaction-canvas`): gizmos/selection/hover outlines/guides/measurement overlays.
- **Per-element canvas usage** (inside DOM): Code Fill runs via `CodeRunner` on a `<canvas>` inside a `ShapeElement` fill layer (and needs world bounds for mouse).

Implication for Shapes specs:
- The v1 shapes renderer must remain compatible with the DOM-based `ShapeElement` paint stack (multi-fill layers, strokes, effects), and with presentation scaling.

### B) Canvas handling & modes (edit/master/presentation)
- In `edit` and `master` modes:
  - Viewport pan/zoom is applied as `translate(pan) scale(zoom)` on `#slide-content` and `#slide-background`.
  - The overlay canvas draws interaction UI and performs hit testing using pan/zoom math.
- In `presentation` mode:
  - Pan/zoom transforms are not applied by the editor; the entire `#viewport` is scaled/centered by `PresentationManager`.
  - Selection/gizmo overlays are cleared/suppressed.

Implication:
- Shapes editing features must be gated to `edit`/`master` (no selection UX in presentation), but shapes rendering must still work in `presentation`.

### C) Fill + stroke system (current capabilities to preserve)
- **Multi-fill** is supported: `element.style.fills[]` and each fill becomes a `.fill-layer` with blending and opacity.
- Fill types in active use:
  - `solid` (including theme-slot linked colors via CSS variables)
  - `gradient`
  - `image` (asset-backed)
  - `code` (canvas-driven)
- **Multi-stroke** is supported: `element.style.strokes[]` with per-stroke settings (visibility, opacity, blend) and UI reorder.

Implication:
- Shapes data model and rendering contract MUST reuse `style.fills[]` and `style.strokes[]` semantics; do not invent a parallel paint model.

### D) Undo/redo system (current)
- The app uses **snapshot-based history** via `HistoryManager`.
- Interactions are bracketed via Store’s interaction gating to avoid excessive history entries (and text editing has special handling).

Implication:
- All geometry edits (dragging points/handles, resizing, param changes) must coalesce into sane snapshot boundaries consistent with existing interaction bracketing.

### E) Design system (current)
- Shapes UI must use the existing UI components, tokens, and CSS variables (no new hardcoded colors/typography/shadows).
- Theme-linked colors are already a first-class concept (theme slots, linked properties).

Implication:
- Vector editing affordances (points/handles/highlights) must be expressed using the existing tokens and accent semantics (see design-system alignment doc).

### F) Layer nesting, grouping, and inheritance (current)
- Containers differ by mode:
  - `master` edits `slideMasterPresets[activeMasterId]`
  - otherwise edits `slides[activeSlideId]`
- Slides can have **inherited layers** from Theme/Layout masters (effective elements/order).
- `parentId` is used for grouping/nesting.

Implication:
- Shapes specs must work with:
  - inherited/locked elements
  - master/layout editing
  - group-relative coordinates and transforms

### G) Masking status & requirement
- There is **no unified masking implementation** across shapes/text/images/videos today.

Requirement:
- Introduce **one masking model** that:
  - is non-destructive
  - works consistently across shapes, text, images, and videos
  - is compatible with DOM rendering (and SVG export), with clearly defined fallbacks

### H) Rectangle implementation strategy (keep or replace)
- The current renderer supports legacy shape element types (`rect`, `circle`) by routing them to `ShapeElement`.

Requirement:
- The Shapes system may preserve this path as a compatibility layer or migrate to the canonical `type:'shape'` taxonomy, but must keep existing `.str` files and rendered output stable during migration.

### I) Additional critical alignment requirements
- **Code Fill input correctness:** world-bounds computation must remain correct for nested/grouped elements and in master vs slide mode.
- **Presentation parity:** rendering output must match between edit view and presentation view; only the view transform differs.
- **Serialization compatibility:** all shape fields must remain plain JSON and round-trip through `.str` save/load without lossy transforms.

---

## 5.2 Figma-class Implementation Learnings (Public/Industry)

This section captures **common learnings** repeatedly encountered when building Figma-class vector/shapes editors. It is not a claim about any private/internal Figma implementation; it is a practical guardrail list we will incorporate into this spec set.

### A) Preserve authoring intent (parametric-first)
- Keep primitives parametric as long as possible; converting to paths too early leads to:
  - edit drift (repeated conversions accumulate error)
  - loss of “simple controls” (corner radii, star inner radius, etc.)
- When conversion is required, define it as **deterministic** and **stable under repeated application** (idempotent within tolerance).

### B) Booleans are where editors die
- Boolean geometry must assume:
  - degenerate intersections
  - coincident edges
  - near-zero segments
  - self-intersections
  - mixed winding and fill rules
- The spec must require:
  - strict canonicalization (winding/fill rule normalization)
  - robust epsilon policy (centralized)
  - repair strategies and failure UX (never “explode” the document)
  - fuzz/corpus tests (see testing spec)

### C) Hit testing must be forgiving and stable
- Selection frustration is a top failure mode. We must define:
  - screen-space tolerances that scale with zoom
  - priority rules (points > stroke > fill)
  - hysteresis / sticky selection during drags to prevent flicker

### D) Masking/clipping must be unified early
- Separate per-element masking models become impossible to reason about.
- Masking must work for shapes, text, images, and video, and must clip:
  - multi-fill stacks
  - media fills
  - code fills

### E) Performance needs architectural rules, not micro-optimizations
- Avoid recomputing expensive derived geometry (booleans, stroke expansion) on every pointer-move.
- Require caching + invalidation + (if needed) progressive refinement.
- Keep renderer artifacts derived and disposable; never serialize caches.

### F) Determinism is a product feature
- Determinism affects undo/redo correctness, export stability, and tests.
- Specs must insist on stable ordering and canonical output for any derived geometry.

### 00 — Index (this doc)
- Scope, goals, phased plan, and the spec map

### 01 — System Architecture
- Scene graph responsibilities for shapes
- “Authoritative vs derived” rules
- Coordinate systems (local/parent/world/screen)
- Determinism & precision rules (float64 CPU policy, epsilons)

Draft: [01-system-architecture.md](./01-system-architecture.md)

### 02 — Data Model & Serialization
- JSON schema (document/page/nodes/paths/points)
- Versioning/migrations strategy
- Backward compatibility guarantees

### 03 — Parametric Shapes Spec
- Rectangle: per-corner radii + smoothing behavior
- Ellipse: derived radii from bounds; circle constraint rules
- Polygon/star: sides/points, radii, rotation
- Line: caps + bounds semantics
- Conversion rules to paths (when and how)

### 04 — Path Model & Vector Editing Semantics
- Path/subpath/segment definitions
- Node point model (handles, continuity types)
- Edit operations:
  - insert node on segment
  - delete node
  - split path
  - join endpoints
  - convert node type (corner/smooth/symmetric)

### 05 — Boolean Operations (Non-Destructive)
- Boolean node schema, operand ordering semantics
- Fill rule, winding normalization, transforms
- Cache invalidation and failure handling
- Flattening semantics

### 06 — Masking / Clipping
- Mask node schema and evaluation order
- Nested masks, transform rules
- Interaction model: edit mask vs edit content

### 07 — Rendering Contract
- Resolved geometry pipeline (parametric → path → derived)
- Rendering backends assumptions (DOM/SVG/Canvas/WebGL)
- Anti-aliasing strategy and edge quality expectations
- Bounding boxes and dirty region propagation

### 08 — Hit Testing & Selection Priority
- Fill/stroke hit testing rules
- Control point/handle hit testing rules
- Priority resolution (e.g., points > stroke > fill)
- Tolerance scaling with zoom

### 09 — Interaction State Machine
- Modes: object / vector / boolean-edit / mask-edit
- Mode entry/exit rules
- Gesture → operation mapping table
- Modifier keys semantics

### 10 — Property Inspector UX
- Shape-specific controls
- Vector edit controls (continuity toggles, numeric editors)
- Boolean/mask controls (operands list, reorder, flatten)
- Reset/override behavior (aligned with existing inspector patterns)

### 11 — Edit Operations Model (Undo/Redo/Collab)
- Operation envelope
- Required atomic operations (MOVE_POINT, SET_PARAM, SET_TRANSFORM, etc.)
- Transaction coalescing rules for drags
- Conflict policies (delete wins, LWW for same prop)

### 12 — Performance & Caching
- Cache layers and keys
- Invalidation matrix
- Partial redraw strategy
- Large document behavior (LOD, culling)

### 13 — Testing Strategy
- Unit test matrix per geometry feature
- Integration/E2E flows and fixtures
- Golden image tests (optional) and tolerances

### 14 — Implementation Plan (Detailed, PR-sized)
- A step-by-step plan similar to typography’s `10-implementation-plan.md`, broken into small PRs

---

## 6. Next Concrete Step (to start coding safely)

1) Create `01-system-architecture.md` and `02-data-model-and-serialization.md` first.
2) In parallel, do a codebase inventory to map:
- current shape element schema
- current renderer path for shapes
- current hit test/selection code
- current history/undo integration points

Once those are known, we lock the **authoritative data model** and begin Phase 1.
