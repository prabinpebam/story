# 05 — Element Resize

> Taskflows for resizing elements via handles, keyboard, and property inspector.

## Handle Resize

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| RSZ-01 | Resize edge handle (N/S) | Drag N or S edge handle | Resize height only, width unchanged | `UPDATE_ELEMENT({id, y, height})` |
| RSZ-02 | Resize edge handle (E/W) | Drag E or W edge handle | Resize width only, height unchanged | `UPDATE_ELEMENT({id, x, width})` |
| RSZ-03 | Resize corner handle | Drag NW/NE/SE/SW corner | Free resize — both width and height | `UPDATE_ELEMENT({id, x, y, width, height})` |
| RSZ-04 | Constrained resize | Shift+drag corner handle | Maintain original aspect ratio | `UPDATE_ELEMENT` (ratio-locked) |
| RSZ-05 | Resize from center | Alt+drag any handle | Expand/contract symmetrically from center point | `UPDATE_ELEMENT` (center-anchored) |
| RSZ-06 | Resize multi-selection | Drag handle on multi-selection gizmo | All selected elements scale proportionally relative to selection bounding box | `UPDATE_ELEMENT` × N |
| RSZ-07 | Resize group | Drag handle on group gizmo | All children scale proportionally; positions adjusted relative to group origin | `UPDATE_ELEMENT` × N |
| RSZ-08 | Resize with snapping | Drag handle near snap target | Handle edge snaps to slide/object edge (only when rotation = 0) | — |
| RSZ-09 | Minimum size enforcement | Resize below minimum | Width/height clamped to minimum (50px for creation, 1px for resize) | — |

## Text Resize

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| RSZ-10 | Resize triggers fixed mode | Drag text element handles | Text element auto-switches to `resizing: 'fixed'` mode, font size unchanged, content reflows | `UPDATE_ELEMENT({id, width, height, resizing: 'fixed'})` |
| RSZ-11 | Scale transform | Shift+drag resize handle on text | Font size AND dimensions scale proportionally | `UPDATE_ELEMENT({id, width, height, fontSize})` |
| RSZ-12 | Auto-resize position adjust | Text auto-resizes after content change | Position adjusted based on textAlign: left→right growth, center→both, right→left growth | `UPDATE_ELEMENT({id, x, y, width, height})` |

## Selection Overlay During Resize

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| RSZ-13 | Hide gizmo during resize | Begin resize interaction | Gizmo and handles hidden during resize (except text elements) | `START_INTERACTION` |
| RSZ-14 | Show gizmo after resize | End resize interaction | Gizmo and handles reappear | `END_INTERACTION` |
| RSZ-15 | Text overlay stays visible | Resize text element | Selection overlay REMAINS visible (exception to hide rule) | — |

## Scale Tool

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| RSZ-16 | Activate scale tool | K key or tool selection | Resize scales all properties (including font size) uniformly | `SET_ACTIVE_TOOL('scale')` |
