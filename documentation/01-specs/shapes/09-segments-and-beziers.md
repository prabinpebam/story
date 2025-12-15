# Segments & Bézier Curves

**Status**: Draft

Defines segment types and required operations for editing.

---

## 1. Segment types (minimum)
- Line segment
- Cubic Bézier segment

## 2. Operations
- Split segment at t
- Join segments
- Compute bounds for segments
- Flatten/subdivide for hit testing/export

Operation requirements (v1):
- Split must preserve geometry within tolerance and must not introduce micro-segments.
- Join must preserve continuity metadata where possible (or explicitly reset it deterministically).
- Bounds must be conservative (contain the curve) and stable.
- Flattening must be deterministic (fixed epsilon policy; no frame-time dependent subdivision).

## 3. Editing constraints
- Ensure continuity rules are enforced on edit (not on render).

## 4. Tests / acceptance
- Splitting and joining preserves geometry within tolerance.

## 5. Quality critique (gaps + risks)
- Segment operations are a primary source of drift and “path corruption”; tests must include adversarial cases (very short segments, near-tangents).
- If flattening is used for hit testing, it must not depend on zoom in a way that changes which segment you hit.
