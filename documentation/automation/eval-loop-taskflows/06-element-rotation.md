# 06 — Element Rotation

> Taskflows for rotating elements via handles and cursor behavior.

## Rotation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| ROT-01 | Rotate element | Drag rotation handle (top-center, outside gizmo) | Element rotates around center; angle updates in real-time | `UPDATE_ELEMENT({id, rotation})` |
| ROT-02 | Snap to 15° increments | Shift+drag rotation handle | Rotation snaps to 0°, 15°, 30°, 45°, 60°, 75°, 90°, etc. | `UPDATE_ELEMENT({id, rotation})` |
| ROT-03 | Rotate -90° via PI | Click rotate -90° button in Position section | `rotation = currentRotation - 90` | `UPDATE_ELEMENT({id, rotation})` |
| ROT-04 | Set rotation via PI input | Type value in Rotation NumberInput | Rotation set to exact value | `UPDATE_ELEMENT({id, rotation})` |

## Rotation Handle Visibility

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| ROT-05 | Hide rotation handle | Element < 50px at current zoom | Rotation handle hidden (too small to interact) | — |
| ROT-06 | Show rotation handle | Element ≥ 50px at current zoom | Rotation handle visible above gizmo | — |

## Rotation-Aware Cursor

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| ROT-07 | Rotated resize cursor | Hover resize handle on rotated element | Resize cursor rotated to match element orientation (per 45° sector) | — |
| ROT-08 | Cursor sector mapping | Element at various angles | N/S handle cursor rotates through ns-resize → nesw-resize → ew-resize → nwse-resize per 45° | — |
