# Control Points & Handles

**Status**: Implemented (v1, minimal)

Defines anchor points, handles, and how they behave under transforms and edits.

---

## 1. Point model (v1)
V1 uses a **segment model** (see [08-path-representation.md](./08-path-representation.md)):
- Anchors are implicit: `path.start` and each `segment.to`.
- Cubic handles are stored as **absolute local-space points**:
	- Outgoing handle from an anchor is `segment.c1` (for the segment leaving the anchor).
	- Incoming handle to an anchor is the previous segment’s `c2` (for the segment arriving at the anchor).

This matches the persisted v1 schema in [02-data-model-and-serialization.md](./02-data-model-and-serialization.md).

## 2. Relative handles (v2+)
Relative handle vectors (stored as $(dx,dy)$ from the anchor) are a desirable future direction for transform-safety and symmetry constraints.

**V1 decision**: defer relative-handle storage. V1 stores absolute handle points (`c1/c2`) and relies on local-space editing to avoid drift.

Identity requirement (v1):
- Anchors are addressed stably by `(pathIndex, nodeIndex)`.
- Handles are addressed stably by `(pathIndex, segmentIndex, handleKind)` where `handleKind` is `c1` or `c2`.
- Canonicalization must be deterministic to avoid selection “jumping” after derived operations.

## 3. Handle visibility rules (UX)
- Show handles in vector mode.
- Show only selected point’s handles unless multi-select behavior is specified.

## 4. Tests / acceptance
- Rotating/scaling an element preserves handle semantics.

## 5. Quality critique (gaps + risks)
- Without stable identity, multi-point edits and undo/redo will “lose” the user’s selection after canonicalization.
- Handle vectors must be clamped/normalized to avoid NaNs (zero-length tangent normalization is a common crash source).
