# Selection & Focus UX (Shapes)

**Status**: Draft

Defines selection states, visuals, and user expectations.

---

## 1. Selection states
- Hovered
- Selected
- Multi-selected
- Focused (active edit target)

## 2. Visualization
- Bounding box
- Outline highlights
- Anchor point visibility in vector mode
- Z-order indicators (when relevant)

## 3. Priority rules
- Points/handles > stroke > fill

Figma-class learnings (selection stability):
- Prefer predictable selection over “mathematically closest” when ambiguous:
	- use zoom-scaled hit tolerances
	- apply hysteresis so hover/selection doesn’t flicker near boundaries
- During drags, do not change the active target even if cursor crosses other targets.

## 4. Integration points
- `src/core/canvas/GizmoRenderer.js`
- `src/core/canvas/HitTesting.js`

## 5. Tests / acceptance
- Hover outlines do not appear while UI is interacting.
- Multi-selection bbox behaves consistently.

Additional acceptance:
- Deep-edit focus is explicit (vector/boolean/mask) and visible (breadcrumb or equivalent).
- Selection does not change mid-drag (sticky capture).

## 6. Quality critique (gaps + risks)
- This spec does not yet define lasso behavior, cycling behavior when multiple targets overlap, or selection restoration after undo/redo; these are frequent UX regression points.
- Focus rules must be consistent across canvas and layer panel, or users will “lose” where they are editing.
