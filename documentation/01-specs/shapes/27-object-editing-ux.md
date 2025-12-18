# Object-Level Editing UX (Shapes)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines bbox handle behavior, rotation, constraints, and feedback.

---

## 1. Handles
- 8 resize handles
- Rotation handle
- Corner radius handles (rectangles only)

## 2. Modifier semantics
- Shift: constrain aspect/angle
- Alt: resize from center
- Ctrl/Cmd: multi-select additive

V1 notes:
- Shift snaps rotation to a fixed increment and constrains proportional resizing.
- Alt/Option enables resize-from-center.

## 3. Task flows
- Resize
- Rotate
- Corner radius adjust

## 4. Undo
- Each drag is one undo step (see [11-undo-redo-and-operations.md](./11-undo-redo-and-operations.md)).

## 5. Figma-class UX learnings (stability + predictability)
- Use zoom-scaled hit slop and handle sizes; keep selection usable at extreme zoom levels.
- Apply hysteresis: once a handle/edge is captured, don’t retarget to a nearby handle mid-drag.
- Keep modifier keys safe and reversible (e.g. Shift for constrain, Alt for from-center) without causing large discontinuous jumps.
- When constraints produce invalid geometry (tiny/negative sizes), clamp deterministically and show a subtle status hint instead of “snapping” unpredictably.

## 6. Quality critique (gaps + risks)
- The spec should define resize pivot rules (e.g. which handle anchors) and how rotation affects handle direction; ambiguity here causes inconsistent behavior across tools.
