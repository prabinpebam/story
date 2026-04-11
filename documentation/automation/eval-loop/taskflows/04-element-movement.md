# 04 — Element Movement & Dragging

> Taskflows for moving elements via canvas drag, keyboard nudge, and layer tree reordering.

## Canvas Drag

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MOV-01 | Drag single element | Click-drag gizmo body (not handle) | Element moves with mouse, GPU-accelerated CSS transform during drag | `UPDATE_ELEMENT({id, x, y})` on release |
| MOV-02 | Drag multi-selection | Drag when multiple selected | All selected elements move together, maintaining relative positions | `UPDATE_ELEMENT` × N |
| MOV-03 | Drag with snapping | Drag element near snap target (< 5px/zoom) | Magenta snap lines appear, element sticks to guide | — (snap visual only, position adjusted) |
| MOV-04 | Escape during drag | Escape key while dragging | Cancel drag, revert to start position | — (no commit) |
| MOV-05 | Drop element | Release mouse after drag | Position committed, pushed to undo stack | `UPDATE_ELEMENT` + `UI_INTERACTION_END` |
| MOV-06 | Drag locked element | Attempt drag on locked element | Element cannot be selected or dragged | — |

## Keyboard Nudge

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MOV-07 | Nudge 1px | Arrow key (selection on canvas) | Move element 1px in arrow direction | `UPDATE_ELEMENT({id, x/y ± 1})` |
| MOV-08 | Nudge 10px | Shift+Arrow key | Move element 10px in arrow direction | `UPDATE_ELEMENT({id, x/y ± 10})` |
| MOV-09 | Nudge vector node | Arrow key in vector deep edit | Selected vector node(s) nudged 1px (or 10px with Shift) | `UPDATE_ELEMENT({id, paths})` |

## Layer Tree Reordering

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| MOV-10 | Reorder in tree (before) | Drag layer to top 25% of another | Blue top-border indicator, element moves before target | `REORDER_ELEMENTS` |
| MOV-11 | Reorder in tree (after) | Drag layer to bottom 25% of another | Blue bottom-border indicator, element moves after target | `REORDER_ELEMENTS` |
| MOV-12 | Reparent to group | Drag layer to middle 50% of group | Background highlight, element becomes group child | `REORDER_ELEMENTS` |
| MOV-13 | Reparent out of group | Drag layer out of group to root level | Element moved from group to root elementOrder | `REORDER_ELEMENTS` |
| MOV-14 | Reorder boolean operands | Drag operand within boolean composite | Operand order changed | `REORDER_BOOLEAN_OPERANDS` |
| MOV-15 | Reorder mask content | Drag content within mask composite | Content order changed | `REORDER_MASK_CONTENT` |
| MOV-16 | Block inherited drag | Attempt drag inherited element in tree | Element not draggable (inherited from master) | — |
| MOV-17 | Block mask-shape drag | Attempt drag mask-shape role | Not draggable (structural constraint) | — |
