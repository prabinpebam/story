# 20 — Slide Management

> Taskflows for adding, deleting, duplicating, reordering, renaming slides, and slide panel interactions.

## Slide CRUD

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-01 | Add slide below | Click + button or context menu → Add Slide Below | New slide inserted after current; copies placeholder elements from layout; `layoutId` defaults to `layout-blank` | `ADD_SLIDE` |
| SLD-02 | Add slide above | Context menu → Add Slide Above | New slide inserted before current | `ADD_SLIDE({insertIndex})` |
| SLD-03 | Duplicate slide | Ctrl+D or context menu → Duplicate | Deep-copy elements, elementOrder, notesDoc; title becomes "(Copy)"; inserted after source | `DUPLICATE_SLIDE` |
| SLD-04 | Delete slide | Del or context menu → Delete | Slide removed; activeSlideId adjusts to `max(0, index-1)`; disabled if only 1 slide | `DELETE_SLIDE` |
| SLD-05 | Cut slide | Ctrl+X on slide thumbnail | Slide data copied and slide removed | `CUT_SLIDE` |
| SLD-06 | Copy slide | Ctrl+C on slide thumbnail | Slide data copied to clipboard | `COPY_SLIDE` |
| SLD-07 | Paste slide | Ctrl+V on slide panel | Pasted relative to target slide | `PASTE_SLIDE` |

## Navigation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-08 | Select slide | Click slide thumbnail | Slide becomes active; canvas updates; scroll to visible | `SET_ACTIVE_SLIDE` + `SELECT_SLIDE` |
| SLD-09 | Multi-select slides | Ctrl+click thumbnail | Multiple slides selected for bulk operations | `SELECT_SLIDE({multi: true})` |
| SLD-10 | Auto-scroll to active | Active slide changes | `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` | — |
| SLD-11 | Keyboard navigate | Arrow Up/Down in slide panel | Previous/next slide selected | `SET_ACTIVE_SLIDE` |

## Reorder

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-12 | Drag to reorder | Drag slide thumbnail in panel | Drop indicator (before/after) based on y-midpoint; custom 80×45px drag preview | `REORDER_SLIDES` |
| SLD-13 | Drop before target | Drop in upper half of target | Slide moved to position before target | `REORDER_SLIDES({fromIndex, toIndex})` |
| SLD-14 | Drop after target | Drop in lower half of target | Slide moved to position after target | `REORDER_SLIDES` |

## Rename

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-15 | Start rename | F2 or context menu → Rename | Inline `<input>` overlay on thumbnail | — |
| SLD-16 | Commit rename | Press Enter in rename input | Title updated | `RENAME_SLIDE` |
| SLD-17 | Cancel rename | Press Escape in rename input | Revert to original title | — |

## Layout Assignment

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-18 | Change layout | Context menu → Change Layout → [layout] | Layout applied; placeholder reconciliation runs (maps by type, identity, or index) | `UPDATE_SLIDE({layoutId})` |
| SLD-19 | Layout reconciliation | Layout changes on existing slide | Placeholders remapped; unmapped content detached with origin metadata | (via `reconcileLayoutChange()`) |

## Style Assignments

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| SLD-20 | Set slide-specific theme | Override color theme in PI | `styleAssignments.colorTheme` set on slide | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| SLD-21 | Clear slide theme override | Reset to inherited | `styleAssignments.colorTheme` set to null; inherits from layout/master | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| SLD-22 | Bulk style assignment | Apply transition to multiple selected slides | Single undo step for all slides | `UPDATE_SLIDES_STYLE_ASSIGNMENTS` |
