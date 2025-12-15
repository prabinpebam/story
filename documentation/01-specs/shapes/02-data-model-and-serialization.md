# Shapes Data Model & Serialization

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This document defines the **canonical Shapes data model** for Story, designed to be:
- Parametric-first
- SVG-first
- Non-destructive (booleans/masks)
- Compatible with current `slides.elements` storage
- Compatible with existing undo/redo and file persistence

It also defines a compatibility strategy for legacy/heterogeneous element types.

Principles reference: `documentation/00-product/principles.md`

Serialization baseline reference (existing):
- `src/core/storage/serialization/PresentationSerializer.js`
- `src/core/storage/serialization/PresentationDeserializer.js`
- `.str` ZIP layout constants: `src/core/storage/constants/StorageConstants.js`
- Related spec: `documentation/01-specs/slides/svg/06-serialization-and-str-format.md`

---

## 1. Canonical element taxonomy (minimum)

### 1.1 Element `type` (top-level)
We standardize on:
- `type: 'shape'` for all primitive shapes and path-based shapes
- `type: 'svg'` for imported raw SVG markup elements (existing)
- `type: 'text'`, `type: 'image'`, `type: 'group'` remain unchanged

Rationale:
- Avoid proliferating types (`rectangle`, `ellipse`, `rect`, `circle`, …).
- Keep a stable base for renderer and inspector.

### 1.2 Shape “kind”
Within `type: 'shape'`, geometry is defined by:
- `shapeKind: 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star' | 'vector' | 'boolean' | 'mask'`

This aligns with:
- Parametric primitives
- Universal vector paths
- Non-destructive composition nodes

---

## 2. Base element fields (align with existing model)

All elements keep existing fields:
- `id`, `name?`
- `x`, `y`, `width`, `height`, `rotation`
- `opacity`, `visible`, `locked`
- `parentId?` for grouping
- `style` for fills/strokes/effects (reuse existing Fill/Stroke/Effects models)

Constraints:
- We do not introduce new rendering-only fields into the document schema.
- All persisted fields MUST be JSON-serializable and safe to round-trip through `.str` (no DOM nodes, functions, cyclic refs).

---

## 3. Parametric shape schema

### 3.1 Rectangle
- `shapeKind: 'rectangle'`
- `params`:
  - `cornerRadii: [tl,tr,br,bl]` (numbers in px)
  - `cornerSmoothing: 0..1` (optional)

### 3.2 Ellipse
- `shapeKind: 'ellipse'`
- `params`:
  - Canonical approach: **derive** radii from element bounds.
    - `rx = width / 2`, `ry = height / 2`
    - Do not persist `rx/ry` separately (prevents dual-source-of-truth drift).

### 3.3 Line
- `shapeKind: 'line'`
- `params`:
  - Canonical approach: store endpoints in **element-local space**, normalized to the element’s local bounds.
    - `p1: {x,y}`, `p2: {x,y}` where $(0,0)$ is the element’s local top-left and $(width,height)$ is bottom-right.
    - This keeps resizing behavior deterministic (endpoints scale with bounds unless explicitly edited).

### 3.4 Polygon
- `shapeKind: 'polygon'`
- `params`:
  - `sides` (int >= 3)
  - `rotation`

### 3.5 Star
- `shapeKind: 'star'`
- `params`:
`params`:
  - `points` (int >= 3)
  - `innerRadiusRatio: number` in `(0, 1)` (canonical; derived inner radius scales with bounds)
  - `rotation`

---

## 4. Vector path schema (SVG-first)

### 4.1 Vector shape
- `shapeKind: 'vector'`
- `paths: Path[]`

### 4.2 Path
- `closed: boolean`
- `fillRule: 'nonzero' | 'evenodd'`
- `segments: Segment[]`

### 4.3 Segment
Minimum set (canonical, to avoid redundant point storage):
- A path has an implicit “current point” starting at `start`.
- Each segment defines how to get to the next point.

Canonical schema:
- `start: {x,y}` for each subpath
- `segments: Array<
  | { kind: 'line', to: {x,y} }
  | { kind: 'cubic', c1: {x,y}, c2: {x,y}, to: {x,y} }
>`

Notes:
- All coordinates are in element-local space.
- If we later add arcs/quadratics, they must be added as new `kind` values (additive, forward-compatible).

### 4.4 Point model
If we implement a point-based editing model (anchors with handles) on top of `segments`, we must ensure stable identity.

Requirements:
- Anchors/handles must have stable IDs or stable addressing across edits (to support future op logs and to avoid selection jumping).
- Handles remain **relative** vectors to their anchor when represented as a point model.

If a point model is persisted (optional, v1 may compute it on demand), canonical fields are:
- `id: string`
- `position: {x,y}`
- `handleIn?: {dx,dy}` (relative)
- `handleOut?: {dx,dy}` (relative)
- `continuity: 'corner' | 'smooth' | 'symmetric'`

---

## 5. Non-destructive composition nodes

### 5.1 Boolean
- `shapeKind: 'boolean'`
- `operation: 'union' | 'subtract' | 'intersect' | 'exclude'`
- `operands: elementId[]`

Reference invariants:
- Operands must refer to elements in the same active container (slide or master). Cross-container references are not allowed.
- Operands must not create cycles (a boolean cannot ultimately reference itself).
- Operand order is semantically meaningful and must be preserved.

### 5.2 Mask
- `shapeKind: 'mask'`
- `maskShapeId: elementId`
- `contentIds: elementId[]`
- `mode?: 'clip' | 'alpha'` (default: `clip`)
- `invert?: boolean` (default: `false`)

Important:
- The boolean/mask nodes store **references** to editable operands.
- Derived output geometry is cached, not stored.

Reference invariants:
- `maskShapeId` and all `contentIds` must refer to elements in the same active container.
- `contentIds` must not include the mask node itself.
- Nested masks are allowed, but cycles are not.

---

## 6. Legacy compatibility & migration

### 6.1 Current heterogeneity
The codebase currently contains shapes represented as:
- `type: 'shape'` with fields like `shape: 'rectangle'` (observed)
- `type: 'rect'` and `type: 'circle'` (observed)
- inspector name mapping for `type: 'rectangle' | 'ellipse'` (observed)

### 6.2 Compatibility strategy
- Add a **normalization layer** (conceptual) used by:
  - renderer
  - hit testing
  - inspector
  - exporter
- Normalization maps legacy fields → canonical `type:'shape'` + `shapeKind` + `params`.

### 6.3 Migration strategy
- File load (`LOAD_PRESENTATION`) may migrate in-memory objects to canonical shape representation.
- Migration must be:
  - lossless for visuals
  - deterministic
  - versioned

Additional `.str`-compatibility constraints:
- Migrations MUST preserve unknown/extra element fields to avoid data loss across save/load, because the current serializer/deserializer deliberately “copy all properties”.
- If a migration replaces legacy fields (e.g. `type:'rect'`) with canonical fields, it MUST either:
  - keep the original fields (preferred for a deprecation window), OR
  - move them under a dedicated preservation container (e.g. `legacy: {...}`), so round-tripping older data does not drop information.

---

## 7. Serialization requirements

### 7.1 `.str` file format compatibility (current implementation)
Story `.str` files are ZIP archives (see `FILE_FORMAT` / `ARCHIVE_PATHS`) containing:
- `manifest.json`
- `document/metadata.json`
- `document/theme.json`
- `document/slideOrder.json`
- `document/slides/slide-<slideId>.json` (one JSON file per slide)
- `assets/*` (optional assets)

Slide JSON storage rules (current implementation):
- Slides are serialized with `elements` stored as an **array**.
- Serializer behavior is intentionally “copy all properties” for slides/elements (with some deep-copy handling for nested objects like `style.fills`, `effects`, etc.).
- Deserializer restores slides/elements by copying all properties and applying core defaults.

Therefore, this Shapes schema MUST follow:
- Shapes remain ordinary elements within `slide.elements[]`.
- Shapes must keep the existing top-level geometry fields (`x`, `y`, `width`, `height`, `rotation`) so current editor behaviors and defaults remain valid.
- All new geometry fields MUST be plain JSON and must not rely on runtime-only references.

### 7.2 Persistence invariants
- Shapes data must be compatible with Story’s existing file storage (slides/elements structure inside `.str`).
- No derived caches are serialized.
- All geometry must be reconstructable from canonical state.
- Unknown element fields should round-trip without being deleted (lossless save/load policy).

---

## 8. Open decisions (to resolve before implementation)

Remaining open decisions (non-blocking for v1 scaffolding, but must be finalized before implementation details land):
- How/if we persist a point-model alongside the segment model (or compute it on demand).

Resolved (required): segment type normalization
- Internal editable segment types are **line + cubic Bézier only**.
- On import (SVG or any external vector source), any non-cubic primitives MUST be normalized before entering the document model:
  - Quadratic Béziers are converted to cubic Béziers.
  - Elliptical arcs are converted to one or more cubic Béziers within a specified geometric tolerance.

Rationale:
- Keeps the authoring model minimal and deterministic.
- Preserves SVG-first compatibility while avoiding multi-segment-type editing complexity.

Update (resolved in this spec):
- Ellipse uses element bounds as the single source of truth (`rx/ry` are derived).
- Line stores local-space endpoints normalized to element bounds.
- Star stores `innerRadiusRatio`.

## 9. Quality critique (gaps + risks)
- The biggest historical failure mode is “dual sources of truth” (bounds vs params vs points). This spec now makes bounds authoritative for ellipse and normalizes line endpoints, but other parametric shapes must follow the same discipline.
- Cross-container ID references (slide↔master) are a common accidental bug; invariants above must be enforced at creation and validated on load.
- Segment schema changes can be migration-sensitive; we must treat it as additive and preserve unknown fields for forward compatibility.
