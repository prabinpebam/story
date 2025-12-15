# Vector Editing UX (Points/Handles)

**Status**: Draft

Defines how points/handles are visualized and manipulated.

---

## 1. Visualization
- Anchor points
- Handle lines
- Handle endpoints
- Selected vs unselected styling (accent token driven)

## 2. Interaction
- Click select
- Drag point
- Drag handle
- Box/lasso selection in vector mode (if supported)

## 3. Context actions
- Insert point
- Delete point
- Split/join

## 4. Accessibility
- Keyboard escape
- Focus rules

## 5. Figma-class UX learnings (editing stability)
- Sticky capture: once a point/handle is grabbed, keep it as the target until pointer up (no mid-drag retargeting).
- Use zoom-scaled hit slop for anchors/handles; at low zoom, handles remain pickable without pixel-hunting.
- Avoid “jitter” when hovering dense geometry: use hysteresis (enter/exit thresholds) and deterministic tie-breaking.
- Keep handle math local-space first; avoid drift from repeated world-space conversions during long drags.
- If an operation would create degenerate segments, clamp/repair deterministically and provide quiet feedback (status hint), not modal errors.

## 6. Quality critique (gaps + risks)
- This spec should define whether lasso/box selection is supported in v1 and, if not, explicitly mark it as non-goal to avoid partial implementations.
