# Tessellation & Anti-Aliasing (Shapes)

**Status**: Draft
**Owner**: Engineering
**Last Updated**: December 15, 2025

This spec defines the **canonical tessellation pipeline** for Story shapes: how resolved vector geometry becomes **triangle meshes** (fill + stroke) plus the associated **anti-aliasing (AA)** strategy.

Even if the primary renderer remains DOM/SVG today, this spec is **not optional**:
- Tessellation is required for **deterministic raster export**, **thumbnail/preview rendering**, **canvas-based rendering paths**, and **performance instrumentation**.
- Tessellation must be stable enough to serve as a reference backend ("ground truth"), enabling A/B comparisons between DOM/SVG and mesh rendering.

---

## 0. Current Implementation Alignment (Must Match)
- Authoritative geometry remains parametric/path-based (see [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)); tessellation output is **derived** and **never serialized**.
- Rendering architecture remains compatible with DOM-first `ShapeElement` while allowing a mesh-based backend (see [16-rendering-architecture.md](./16-rendering-architecture.md)).
- Editor modes:
  - `edit`/`master`: pan+zoom.
  - `presentation`: scale/offset mapping; view-only.
  - Tessellation may be view-dependent (LOD), but must be **mode-safe**: presentation must never mutate authoritative state.

---

## 1. Definitions
- **Resolved path**: canonical path representation after parametric resolution + boolean/mask resolution (see [13-boolean-geometry-system.md](./13-boolean-geometry-system.md), [15-masking-and-clipping.md](./15-masking-and-clipping.md)).
- **Flattening**: converting curves to polylines under an error tolerance.
- **Tessellation**: converting one or more closed contours (with holes/self-intersections) into triangles.
- **LOD** (level-of-detail): a discrete bucket that determines flatten tolerance and re-tessellation thresholds.

---

## 2. Non-Goals
- Storing or editing meshes as document data.
- Hardware tessellation-shader dependency.
- Perfect curve AA without flattening. Curve fidelity is achieved through adaptive flattening.

---

## 3. Required Public Contracts

### 3.1 Pure functions (deterministic)
These are conceptual contracts; implement in the geometry engine layer.
- `flattenPath(path, options) -> FlattenedPath`
- `tessellateFill(flattenedPath, options) -> Mesh`
- `strokeToFill(path, strokeStyle, options) -> Path` (outline path)
- `tessellateStroke(path, strokeStyle, options) -> Mesh` (internally calls `strokeToFill` then `tessellateFill`)

**Determinism requirement**:
- Given identical authoritative state and identical `options` (including LOD), output mesh vertex/index buffers must be byte-identical across runs.

### 3.2 Mesh schema (derived)
A mesh is defined as:
- `positions`: float array `[x0,y0, x1,y1, ...]` in **node-local** coordinates
- `indices`: integer array `[i0,i1,i2, ...]` (triangles)
- `boundsLocal`: local AABB
- Optional attributes for AA:
  - `barycentric`: float array `[b0x,b0y,b0z, ...]` per vertex OR
  - `edgeDistances`: float array storing per-vertex distances/flags

**Rule**: Mesh generation must not depend on JS object key ordering.

---

## 4. Flattening (Curves → Polylines)

### 4.1 Tolerance definition
Flattening uses a **screen-space error budget** converted to local-space.

- Define `toleranceScreenPx` (default `0.25px` for final rendering, `1.5px` for interactive preview).
- Convert to local using the world→screen scale factor at the element:
  - `toleranceLocal = toleranceScreenPx / max(worldToScreenScale, minScale)`
  - `minScale` prevents runaway tolerances when scale is extremely small; default `minScale = 1e-3`.

### 4.2 Adaptive subdivision
- Cubic segments MUST be subdivided until the maximum deviation from the curve to its polyline approximation is ≤ `toleranceLocal`.
- Subdivision algorithm must be deterministic:
  - Use float64 math.
  - Use a fixed recursion/iteration ordering.
  - Apply a max segment cap with a defined fallback: if exceeded, increase tolerance by a fixed factor (2×) and retry, bounded to avoid infinite loops.

### 4.3 Canonicalization before flattening
- Remove degenerate segments shorter than `epsilonLengthLocal`.
- Normalize “almost-closed” contours:
  - If start/end distance ≤ `epsilonCloseLocal`, treat as closed and snap end to start.
- Default epsilons (local units):
  - `epsilonLengthLocal = 1e-6`
  - `epsilonCloseLocal = 1e-6`

These values must be shared via the central epsilon policy module (see [04-precision-and-numerics.md](./04-precision-and-numerics.md)).

---

## 5. Fill Tessellation (Interior)

### 5.1 Inputs
- One or more closed contours (outer + holes) as polylines.
- Fill rule: `nonzero` or `evenodd`.

### 5.2 Algorithm requirement
The tessellator MUST:
- Support holes.
- Support self-intersections and complex polygons as produced by booleans.
- Respect winding rules (`nonzero` / `evenodd`).

Acceptable implementation choices:
- A robust tessellator equivalent to **libtess2 / GLU tessellator**.

Not sufficient by itself:
- Basic ear clipping that assumes simple non-self-intersecting polygons.

### 5.3 Deterministic ordering rules
To ensure byte-identical meshes:
- Contours must be processed in a stable order:
  - Sort by `(sourcePathId, subpathIndex, contourIndex)`.
- Vertex emission must be stable:
  - Use stable indexing (first-seen order) when possible.
  - If the tessellator reorders vertices, canonicalize by reindexing vertices in first-occurrence order of the output index buffer.

### 5.4 Output invariants
- No NaNs or infinities in `positions`.
- Triangle indices always reference valid vertices.
- Total signed area of triangles approximates polygon area within `areaTolerance = toleranceLocal * perimeterApprox`.

---

## 6. Stroke Tessellation

### 6.1 Stroke → outline path (authoritative rule)
Strokes are tessellated by converting stroke paint to a **filled outline** path.

Inputs:
- `path` (can be open or closed)
- `strokeStyle`:
  - `width`
  - `position`: `center|inside|outside`
  - `cap`: `butt|round|square`
  - `join`: `miter|round|bevel`
  - `miterLimit`
  - `dashPattern` + `dashOffset`

Rules:
- Dashes are applied in path-length parameter space before offsetting.
- Joins and caps must match visual semantics used by the DOM/SVG renderer.
- Round joins/caps are approximated by arcs tessellated with an angle step derived from `toleranceLocal`.

### 6.2 Offset robustness requirements
Offsetting must be robust under:
- very small segments
- acute angles
- self-intersections

If an offset computation fails:
- fall back to a conservative approximation:
  - bevel joins
  - clamp miter lengths to `miterLimit`
  - drop segments under `epsilonLengthLocal`

### 6.3 Tessellate outline
The outline path is tessellated using the fill tessellator (Section 5).

---

## 7. Anti-Aliasing Strategy

### 7.1 DOM/SVG AA
For DOM/SVG rendering:
- Browser native AA is the baseline.
- The tessellation pipeline still exists for export and reference rendering.

### 7.2 Mesh-based AA (required for any triangle renderer)
If triangles are rendered (Canvas/WebGL/WebGPU):

Primary requirement: **analytic edge AA**.
- Each triangle must carry enough information to compute a smooth coverage ramp at polygon boundaries.

One acceptable approach:
- Emit `barycentric` coordinates per vertex for each triangle, and in the fragment shader compute an edge coverage based on `min(barycentric)` and `fwidth`.
- Boundary-only AA: only boundary triangles need AA; interior triangles may skip AA attributes.

Fallback:
- MSAA render targets may be used, but must be justified by measured quality/perf; analytic AA remains the default.

### 7.3 AA correctness acceptance
- At 100% zoom, edges must not exhibit obvious stair-stepping.
- At large zoom (>800%), AA must remain stable (no shimmering) during panning.

---

## 8. LOD, Caching, and Invalidation

### 8.1 LOD buckets (no continuous retessellation)
To avoid re-tessellating on every tiny zoom delta:
- Compute `lod` from `worldToScreenScale` using discrete buckets.
- Canonical default:
  - `lod = clamp(round(log2(worldToScreenScale) * 4), -24, 24)` (quarter-octave steps)

Flatten tolerances are derived from `lod`, not raw zoom.

### 8.2 Cache keys
Mesh caches must be keyed by:
- `nodeId`
- `resolvedGeometryHash` (includes param/path + boolean outputs)
- `strokeStyleHash` (for stroke meshes)
- `fillRule`
- `lod`

### 8.3 Invalidation rules
- Any authoritative geometry change invalidates all dependent meshes.
- Style-only changes invalidate stroke meshes if stroke style changed.
- View changes only affect caches through `lod` (no other view state allowed in cache keys).

---

## 9. Integration Requirements

### 9.1 Booleans/masks ordering
- Booleans and masks are resolved at the path level before tessellation.
- Tessellation never performs boolean clipping; it assumes the input contours represent the final filled region.

### 9.2 Export and rasterization
- Any export path that rasterizes vector content must use the tessellation pipeline for consistent geometry fidelity.
- Code/video fills remain raster sources; clipping/masking uses the resolved clip region and is applied to the rasterized layer.

---

## 10. Tests / Acceptance

### 10.1 Determinism tests
- For a fixed scene and fixed LOD, the mesh output hash must match golden snapshots:
  - `hash(round(positions, 1e-6), indices, lod)`.

### 10.2 Correctness corpus
Maintain a corpus of adversarial shapes:
- self-intersections
- tiny features
- boolean slivers
- extreme miters

For each corpus entry:
- tessellation succeeds (no crashes)
- triangle output passes invariants (Section 5.4)

### 10.3 Performance acceptance
- Interactive preview uses coarse tolerance (preview LOD) and completes within the pointer-move budget.
- Final refinement runs on pointer-up and produces stable output.

---

## 11. Quality critique (gaps + risks)
- Tessellation determinism is notoriously fragile; without explicit canonicalization (Section 5.3) we will not get stable golden tests.
- Stroke offsetting is a large source of edge cases; the fallback policy in 6.2 must be implemented and tested early.
- If DOM rendering semantics drift from stroke-to-fill semantics, visual mismatches will appear between DOM view and tessellated exports; this requires explicit parity tests.
