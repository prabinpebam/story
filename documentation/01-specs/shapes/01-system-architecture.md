# Shapes System Architecture (Parametric-first, SVG-first)

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This document defines the **fundamental architecture** required for robust shapes handling and editing in Story.

It is intentionally aligned with the philosophy behind tools like Figma:
- **Parametric-first** (edit intent, not vertices)
- **SVG-first** (paths + paints map cleanly to SVG concepts)
- **Non-destructive by default** (boolean/masks are nodes, not baked geometry)
- **Derived geometry is ephemeral** (never edited directly)
- **Deterministic + diffable** (same ops → same results)

---

## 0. Current Implementation Alignment (Must Match)

This spec is forward-looking, but it MUST remain compatible with Story’s current architecture:

- **Renderer layering**: content is rendered via DOM elements (e.g. `ShapeElement`), while editing affordances (gizmos/guides/selection) are drawn on a Canvas overlay.
- **Paint system reuse**: shapes MUST reuse the existing `style` model (multi-fill, multi-stroke, effects, theme-linked slots) rather than introducing a parallel paint system.
- **Code/media fills**: the existing renderer supports `code` fills (embedded canvas via `CodeRunner`) and media fills (image/video via `assetId`), so geometry/masking must be able to clip these reliably.
- **Undo/redo**: shapes gestures MUST integrate with snapshot-based history and interaction bracketing (`START_INTERACTION` / `END_INTERACTION`).
- **Modes**: the editor has `edit`, `master`, and `presentation` modes; presentation suppresses editing overlays and uses a different viewport mapping.
- **Persistence**: `.str` serialization uses a “copy all properties” strategy; new shape fields must be JSON-safe and round-trip without losing unknown/legacy fields.

See also: `documentation/01-specs/shapes/15-current-implementation-alignment.md`.

---

## 0.1 Figma-class learnings to bake into this architecture

These are common lessons from building serious vector editors (Figma-class). They translate into hard architectural constraints:

- **Don’t bake early**: keep primitives parametric; derived paths/meshes must remain ephemeral caches.
- **Determinism is non-negotiable**: stable ordering + canonicalization are required for booleans/masks/export/tests.
- **Booleans are adversarial**: numeric robustness, repair strategies, and fuzz testing are part of the “definition of done”.
- **Unify masking**: one masking model across shapes/text/images/video; avoid per-element special cases.
- **Keep selection forgiving**: screen-space tolerances and stable priority rules prevent UX collapse.

## 1. Goals and Non-Goals

### Goals
- Support primitives (rectangle/ellipse/polygon/star/line) as **true parametric shapes** until explicitly converted.
- Provide a universal representation: **vector paths** (SVG-compatible) as the lowest common denominator.
- Keep boolean ops and masks **editable** by storing them as nodes referencing operands.
- Enable **vector editing** (points/handles/continuity) in a way that remains stable under transforms and zoom.
- Preserve performance via **caching + invalidation**, not via destructive flattening.
- Make undo/redo and collaboration readiness feasible via **operation-level edits**.

### Non-Goals (v1 boundaries)
- NURBS/CAD curves.
- Illustrator-level import fidelity.
- Hardware tessellation-shader dependency.

---

## 2. Architecture Principles (Hard Rules)

### 2.1 Authoritative vs Derived Data (Non-negotiable)
**Authoritative** (editable, stored in document):
- Scene graph node structure + transforms
- Parametric shape parameters
- Vector paths (points/segments) for `Vector` nodes
- Boolean/mask node composition (operand references)
- Style references (fills/strokes/effects) and their editable properties

**Derived** (computed, cached, never edited directly):
- Boolean output paths
- Stroke outline paths (when needed)
- Tessellation meshes / GPU buffers
- Bounding boxes (cache)
- Hit-test acceleration structures

**Rule**: There must be *no* operations that “edit derived geometry”. Derived data is recomputed from authoritative state.

### 2.2 Parametric-first
- Primitive shapes remain parametric until:
  - entering vector edit mode
  - boolean/mask requiring path-level resolution
  - export
  - explicit “Convert to Vector”

Parametric shapes are not “just paths we keep rewriting”. They are canonical parameter sets.

### 2.3 SVG-first
Internal geometry models must map to SVG with minimal impedance:
- Paths → `<path d="...">`
- Fill rules → `fill-rule: nonzero|evenodd`
- Fills/strokes → SVG paint attributes/gradients
- Groups → `<g>`
- Masks/clips → `<clipPath>` or `<mask>`

**Rule**: If a feature cannot be represented in SVG, we must explicitly specify:
- whether we bake it into geometry (e.g., corner smoothing)
- whether we rasterize on export
- what fidelity guarantee we provide

### 2.4 Deterministic geometry
- Same inputs + same operations must produce identical output paths.
- Avoid hidden randomness, time-based epsilon changes, or non-deterministic iteration order.
- Canonicalize whenever needed (winding normalization, sorting intersections, stable operand ordering).

---

## 3. Core System Decomposition

This avoids the classic “everything mutates everything” trap.

```
Input (pointer/keys)
  → Interaction Controller (modes, gestures, snapping)
    → Operation Log (intent-level ops)
      → Store / Document Model (authoritative state)
        → Geometry Engine (resolve paths)
          → Rendering Adapter (DOM/SVG/Canvas/WebGL)
```

### Responsibilities
- **Interaction Controller**: decides *what the user intends* and emits operations.
- **Operation Log**: the only mutator; also enables undo/redo + collaboration readiness.
- **Document Model**: authoritative nodes/geometry/style.
- **Geometry Engine**: pure functions to resolve geometry, booleans, bounds.
- **Renderer**: consumes resolved geometry; caches render-specific artifacts.

---

## 4. Scene Graph Contracts

### 4.1 Node types (minimum set)
- `ShapeNode` (parametric primitives)
- `VectorNode` (paths)
- `GroupNode` (container)
- `BooleanNode` (operation + operand node IDs)
- `MaskNode` (mask node ID + content node IDs)

### 4.2 Transform policy
- Nodes carry local transforms; world transform is derived by traversal.
- Geometry engine resolves paths in **local space**, then applies transforms as needed.
- Editing must be stable: operations can be expressed either in local or world coordinates, but must be consistent.

Recommended default:
- Store point coordinates in **node-local space**.
- Handle vectors are **relative** to the anchor point (transform-safe).

---

## 5. Geometry Engine (The Heart)

### 5.1 Public API (conceptual)
These functions are pure and deterministic.
- `resolveNodeGeometry(nodeId, context) → ResolvedGeometry`
- `resolvePath(pathId) → Path`
- `computeBounds(nodeId) → Rect`
- `hitTest(nodeId, pointWorld, options) → HitResult`

### 5.2 Resolution pipeline (canonical)
1) **Resolve parametric → path** (lazy)
2) Apply **boolean/mask** composition (produces derived paths)
3) Apply **stroke expansion** when required by downstream consumers
4) Produce **resolved path set** + style references

### 5.3 Parametric → Path conversion
- Must be deterministic.
- Must preserve visual appearance.
- Must produce stable segment ordering.

Corner smoothing note:
- If corner smoothing uses non-SVG behavior, spec must define the approximation procedure and tolerances.

### 5.4 Path model requirements
- Closed/open support
- Fill rules
- Consistent winding conventions
- Segment types: at minimum lines + cubic Béziers

### 5.5 Boolean operations
Booleans are resolved on paths, not on triangles.
- Normalize transforms and winding.
- Produce a stable output path list.
- Cache results and invalidate on operand changes.

Failure handling must be specified:
- empty result
- degenerate intersections
- numeric instability → repair strategies

---

## 6. Rendering Architecture (Backend-agnostic)

Story currently uses a hybrid approach (DOM/SVG/Canvas). Shapes architecture must support:
- DOM/SVG rendering for crisp visuals and straightforward mapping
- optional Canvas/WebGL for heavy effects (existing mesh gradients)

### 6.1 Render contract
Renderer consumes **resolved geometry**:
- world-space or local-space paths + transforms
- style references
- clip/mask context

### 6.2 Anti-aliasing policy
- Prefer SVG/DOM native AA where applicable.
- For any triangle renderer, analytic edge AA is the default. Canonical: [16a-tessellation-and-aa.md](./16a-tessellation-and-aa.md)

---

## 7. Caching & Invalidation (Performance Backbone)

### 7.1 Cache layers
- `ParametricPathCache`: shape params → base path
- `BooleanCache`: operands + op type → output path
- `StrokeOutlineCache`: path + stroke style → outline path
- `BoundsCache`: nodeId + transform → rect
- `HitTestCache`: optional acceleration per node

### 7.2 Dirty propagation rules
Edits set “dirty flags” on:

---

## 8. Quality critique (gaps + risks)
- The architecture diagram implies an “Operation Log” as the only mutator; Story currently uses snapshot history. Specs must be careful not to imply new infra is required for v1.
- Node identity below element-level (points/segments) is a common missing piece; without stable sub-IDs, selection and operation logs will be brittle.
- Mode/container confusion (slide vs master vs presentation) is a repeat failure mode; every interaction spec must route through a single active-container utility.
- the node edited
- dependent derived nodes (boolean/mask parents)
- any cache layers keyed by changed inputs

**Rule**: invalidation must be explicit and minimal; avoid “clear all caches”.

---

## 8. Interaction Model Hooks (How UI uses the engine)

### 8.1 Modes as explicit state machine
- Object mode: bbox transforms, snapping, multi-select
- Parametric sub-mode: shape-specific handles (radii, star inner radius)
- Vector edit mode: anchors/handles, continuity, segment ops
- Boolean/mask edit context: drill-in/operand selection

### 8.2 Hit-testing priority (principle)
Priority should be predictable and zoom-aware:
- control points/handles
- stroke
- fill

Tolerance must scale with zoom so points remain selectable.

---

## 9. Operation Model Alignment (Undo/Redo + Collaboration readiness)

### 9.1 Intent-level operations
Operations mutate only authoritative data:
- `SET_GEOMETRY_PARAM`
- `SET_TRANSFORM`
- `MOVE_POINT`
- `SET_HANDLE`
- `SET_CONTINUITY`
- `ADD_SEGMENT` / `REMOVE_SEGMENT`
- `CREATE_BOOLEAN` / `SET_BOOLEAN_OP`
- `CREATE_MASK`

### 9.2 Transactions
Drag gestures must coalesce:
- pointer-move emits local preview (no history)
- pointer-up commits final op(s) as one transaction

### 9.3 Deterministic replay
- All operations must be independent of transient UI state.
- Avoid “apply delta” in the persisted op; store absolute target values.

---

## 10. Precision & Numerical Stability

### 10.1 Numeric policy
- Use float64 for CPU geometry computations.
- Use epsilon-based comparisons with **centralized constants**.

### 10.2 Stability rules
- Remove degenerate segments (near-zero length) in derived outputs.
- Canonicalize path winding and segment ordering when outputting derived paths.

---

## 11. Pitfalls to Avoid (Hard-learned lessons)

These are common failure modes in vector editors; the architecture above prevents them.

- **Destructive editing everywhere** → impossible booleans/masks/undo correctness.
- **Storing derived paths in the document** → caches become bugs; edits diverge.
- **Coupling renderer geometry with model geometry** → refactors become impossible.
- **Delta ops stored for dragging** → drift + non-deterministic replay.
- **No explicit invalidation** → performance death by full recompute.
- **Hit-testing tied to render artifacts** → breaks when switching render backends.

---

## 12. Immediate Next Specs (to fully lock architecture)

This document establishes the backbone. Next, to make it buildable without ambiguity:
- `02-data-model-and-serialization.md` (canonical schemas + versioning)
- `04-path-model-and-vector-editing.md` (exact semantics and edge cases)
- `07-rendering-contract.md` (what renderer needs, what it must never assume)
