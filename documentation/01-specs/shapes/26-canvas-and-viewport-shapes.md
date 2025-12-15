# Canvas & Viewport UX (Shapes delta)

**Status**: Draft

This spec documents shapes-specific canvas UX beyond the existing canvas spec.

Existing baseline: `documentation/01-specs/canvas/canvas-interaction.md`.

---

## 1. Coordinate feedback
- When editing shapes, show:
  - distances
  - angles
  - size deltas

## 2. Creation UX
- Drag to create shapes
- Shift to constrain
- Alt to draw from center (if supported)

## 3. Viewport behaviors
- Zoom-to-cursor consistency during edit.

Current-implementation alignment notes:
- `edit`/`master`: screen↔world mapping uses pan+zoom.
- `presentation`: screen↔world mapping uses `PresentationManager` scale/offset; editing interactions are disabled.
- Shapes interactions must use the active container for the current mode (active slide vs active master).

## 4. Acceptance
- Creating and editing shapes feels consistent with existing canvas behavior.

## 5. Figma-class UX learnings (viewport + interaction)
- Preserve zoom-to-cursor invariants during active drags; avoid subtle world-space drift when zooming while a gesture is in progress.
- Use hysteresis for hover + snapping indicators so they don’t flicker at high zoom or near thresholds.
- Prefer stable screen-space handles: minimum on-screen size with zoom-scaled hit slop.
- Hard rule: `presentation` mode is view-only; do not show editing affordances or allow edit gestures to start.

## 6. Quality critique (gaps + risks)
- Coordinate feedback (angles/distances) needs explicit formatting and measurement sources; otherwise numbers will disagree with inspector values.
- Zoom-to-cursor invariants must be validated under nested transforms (groups) and while editing master vs slide.
