# Parametric Geometry (Shapes)

**Status**: Implemented (v1, partial)

This spec defines each primitive shape as a **parametric** model and how/when it converts to paths.

---

## 1. Supported primitives
- Rectangle
- Ellipse
- Line
- Polygon
- Star

## 2. Authoritative params
- Rectangle: per-corner radii + corner smoothing
- Ellipse: derived from bounds (`rx=width/2`, `ry=height/2`) (canonical; see [02-data-model-and-serialization.md](./02-data-model-and-serialization.md))
- Polygon: sides, rotation
- Star: points, `innerRadiusRatio`, rotation (canonical)
- Line: local-space endpoints `p1/p2` normalized to element bounds (canonical)

## 3. Conversion to path
- Conversion is lazy: only when required (vector edit, boolean, export).
- Must be deterministic and stable.

Additional conversion requirements:
- Conversion must be idempotent within tolerance: repeated conversions should not change the path output.
- Conversion must respect fill rule defaults and winding conventions defined in the path representation spec.

V1 implementation notes:
- Deterministic conversion helpers live in `src/core/shapes/paths/ParametricToPaths.js`.
- V1 supports deterministic conversion for: rectangle (uniform corner radius only), ellipse, line, polygon, star.
- Per-corner radii and corner smoothing are deferred; v1 treats any per-corner radii as an approximation (uniform radius).

## 4. Corner radii & smoothing
- Must define:
  - per-corner radii clamp rules
  - smoothing behavior and approximation tolerance
  - SVG export baking semantics

## 5. Tests / acceptance
- Resizing a rectangle preserves radii constraints.
- Converting to vector preserves the exact appearance.

## 6. Quality critique (gaps + risks)
- Parametric-to-path conversion is a frequent source of visual drift; this doc must be treated as a correctness contract and backed by golden tests.
- If conversion rules differ between hit testing, booleans, and export, users will see contradictions (selectable but not booleanable, export differs from canvas).
