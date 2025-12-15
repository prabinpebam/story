# Control Points & Handles

**Status**: Draft

Defines anchor points, handles, and how they behave under transforms and edits.

---

## 1. Point model
- Anchor position (x,y)
- Optional handleIn/handleOut vectors (dx,dy)
- Continuity type

## 2. Relative handles (required)
- Handles are stored as vectors relative to anchor.
- Benefits: transform-safe, easy symmetry constraints.

Identity requirement:
- Editable anchors/handles must have stable identity (stable IDs or stable addressing) so selection does not jump after repairs/canonicalization.

## 3. Handle visibility rules (UX)
- Show handles in vector mode.
- Show only selected point’s handles unless multi-select behavior is specified.

## 4. Tests / acceptance
- Rotating/scaling an element preserves handle semantics.

## 5. Quality critique (gaps + risks)
- Without stable identity, multi-point edits and undo/redo will “lose” the user’s selection after canonicalization.
- Handle vectors must be clamped/normalized to avoid NaNs (zero-length tangent normalization is a common crash source).
