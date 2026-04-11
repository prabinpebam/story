# 01 — Selection & Hit-Testing

> Taskflows for selecting, deselecting, and hit-testing elements on canvas and in the layer tree.

## Canvas Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SEL-01 | Single select element | Click on element | Deselect all, select clicked element, gizmo appears with 8 handles + rotation | `UPDATE_SELECTION([id])` |
| SEL-02 | Add to selection | Shift+Click on unselected element | Element added to selection, gizmo expands to encompass all | `UPDATE_SELECTION([...existing, id])` |
| SEL-03 | Remove from selection | Shift+Click on selected element | Element removed from selection, gizmo recalculated | `UPDATE_SELECTION(existing.filter(x => x !== id))` |
| SEL-04 | Deselect all | Click on empty canvas | All elements deselected, gizmo hidden | `UPDATE_SELECTION([])` |
| SEL-05 | Marquee select | Drag on empty canvas | Selection box drawn, all intersecting elements selected on release | `UPDATE_SELECTION(intersecting)` |
| SEL-06 | Select all | Ctrl+A (canvas context) | All elements on current slide selected | `UPDATE_SELECTION(allIds)` |
| SEL-07 | Deep select child (Ctrl) | Ctrl+Click on group member | Select specific child, not group container | `UPDATE_SELECTION([childId])` |
| SEL-08 | Deep select on double-click | Double-click on group | Enter group via deep edit, select child under cursor | `SET_DEEP_EDIT + UPDATE_SELECTION` |
| SEL-09 | Click locked element | Click on locked element | Element NOT selected, cursor shows "not-allowed" | No dispatch |
| SEL-10 | Click hidden element | Click on area of hidden element | Element NOT selectable, click passes through to canvas/element below | No dispatch |

## Layer Tree Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SEL-11 | Select via layer tree | Click layer in tree | Element selected on canvas, gizmo appears | `UPDATE_SELECTION([id])` |
| SEL-12 | Multi-select layers | Shift+Click in layer tree | Toggle element in/out of multi-selection | `UPDATE_SELECTION(toggled)` |
| SEL-13 | Tab to next element | Tab key (text edit context) | Exit text edit, select next element in order | `UPDATE_SELECTION([nextId])` |

## Canvas ↔ Layer Tree Sync

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SEL-14 | Sync highlight to layer tree | Click element on canvas | Corresponding layer highlighted in tree, scrolled into view | — (UI sync) |
| SEL-15 | Sync selection from layer tree | Click layer in tree | Element selected on canvas with gizmo | `UPDATE_SELECTION` |

## Hit-Testing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SEL-16 | Z-order hit priority | Click overlapping elements | Topmost (highest z-order) element wins hit test | — |
| SEL-17 | Handle hit priority | Click near handle of selected element | Handle takes priority over element body | Hit returns `type: 'handle'` |
| SEL-18 | Vector node hit (deep edit) | Click vector node in deep edit | Node selected, control points shown | `SET_DEEP_EDIT` with updated nodes |
| SEL-19 | Vector edge hit (deep edit) | Click vector edge in deep edit | Edge selected | `SET_DEEP_EDIT` with updated edges |
| SEL-20 | Boolean operand hit (deep edit) | Click operand in boolean deep edit | Operand becomes selectable (normally hidden) | Via `allowHiddenIds` set |
