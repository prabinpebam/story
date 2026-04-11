# 03 — Element Creation

> Taskflows for creating elements via tools, toolbar drag, and double-click.

## Shape Tool Creation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CRE-01 | Create rectangle (click) | R tool → click canvas | Default 200×50px rect at click position, auto-selected, enter select tool | `ADD_ELEMENT` |
| CRE-02 | Create rectangle (drag) | R tool → click-drag on canvas | Drag defines bounding box (min 50×50px by default), select tool activates after | `ADD_ELEMENT` |
| CRE-03 | Create constrained rect | R tool → Shift+drag | Constrains to square (width = height) | `ADD_ELEMENT` |
| CRE-04 | Create ellipse (click) | O tool → click canvas | Default size ellipse at click position | `ADD_ELEMENT` |
| CRE-05 | Create ellipse (drag) | O tool → click-drag | Drag defines bounding box | `ADD_ELEMENT` |
| CRE-06 | Create constrained ellipse | O tool → Shift+drag | Constrains to circle | `ADD_ELEMENT` |
| CRE-07 | Create line | L tool → drag canvas | Line drawn from start to end point | `ADD_ELEMENT` |
| CRE-08 | Create arrow | Shift+L tool → drag | Arrow from start to end point | `ADD_ELEMENT` |
| CRE-09 | Create polygon | Shift+P tool → drag | Polygon with default sides (6) | `ADD_ELEMENT` |
| CRE-10 | Create star | Shift+S tool → drag | Star with default points (5) | `ADD_ELEMENT` |

## Text Tool Creation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CRE-11 | Create text (click) | T tool → single-click canvas | AutoSize text (200×50px), enter text edit mode with all text selected, `isNewlyCreated: true` | `ADD_ELEMENT` |
| CRE-12 | Create text (drag) | T tool → click-drag canvas | FixedWidth text, user-defined size (min 50×50), enter text edit mode with all selected | `ADD_ELEMENT` |
| CRE-13 | Create text (master mode) | T tool (master mode) → click | Fixed mode, default 400×80px, enter edit mode | `ADD_ELEMENT_TO_MASTER` |

## Other Creation Methods

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CRE-14 | Place image | Shift+K tool → click canvas | Image placement UI appears, file dialog, element created with image fill | `ADD_ELEMENT` |
| CRE-15 | Double-click tool | Double-click shape tool in toolbar | Element placed at center of viewport with default dimensions | `ADD_ELEMENT` |
| CRE-16 | Drag from toolbar | Click-hold-drag tool from toolbar | Ghost icon follows cursor, drop on canvas places element at drop location | `ADD_ELEMENT` |

## Post-Creation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CRE-17 | Newly created flag | Element just created | `isNewlyCreated: true` for 3 seconds (enables inline rename, disables undo on backspace) | — |
| CRE-18 | Tool revert to select | After element placed | Tool automatically reverts to select tool (V) | `SET_ACTIVE_TOOL('select')` |
| CRE-19 | Empty text deletion | Create text → exit without typing | If newly created with no content, element auto-deleted | `DELETE_ELEMENT` |
