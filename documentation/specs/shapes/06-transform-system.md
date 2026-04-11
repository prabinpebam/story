# Transform System (Shapes)

**Status**: Draft

Defines transform representation and how transforms affect geometry, hit testing, and editing.

---

## 1. Transform representation
- Story currently stores `x,y,width,height,rotation` on elements.
- Shapes geometry is defined in element-local space and transformed by these properties.

V1 constraint (align to current app):
- No skew/shear in the document model.
- Flips/mirroring are represented via width/height changes and/or point edits (no negative scales persisted unless the base editor model already supports them).

## 2. Composition rules
- Parent group transforms apply to children.
- Rotation pivot is element center unless explicitly specified.

Pivot rule (must be consistent everywhere):
- Rotation pivot is the element’s visual center derived from `x,y,width,height`.
- If we later add custom pivots, they must be additive and default to center.

## 3. Bounding box computation
- Axis-aligned bounds for selection are derived from transformed corners.
- Rotated shapes still use bbox handles (existing UX).

## 4. Editing constraints
- Dragging points/handles in vector edit mode operates in local space, derived from cursor world position.

Figma-class learning to incorporate:
- Store geometry in **element-local space** and handles as **relative vectors** to prevent drift under repeated transforms and to keep continuity constraints stable.

## 5. Integration points (current code)
- `src/core/canvas/GeometryUtils.js` (corners/bounds)
- `src/core/canvas/HitTesting.js` (handle hit tests)

## 6. Tests / acceptance
- Rotated elements still resize/rotate with consistent handle logic.
- Parent rotation impacts child correctly (no drift).

Quality critique (gaps + risks)
- If pivot rules differ between DOM rendering and canvas gizmos, users experience “handle drift”. Pivot must be a single shared utility.
- Any attempt to introduce matrix transforms without migrating the rest of the editor will cause misalignment; v1 should stay with the existing scalar fields.
