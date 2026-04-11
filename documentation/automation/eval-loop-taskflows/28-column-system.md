# 28 — Column System

> Taskflows for column grid layout, margin management, column snapping, and the inheritance chain.

## Column Configuration

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-01 | Set column count | Edit columns NumberInput (1–24) in Layout Guides | Column grid generated with equal-width columns and gutters | `updateLayoutGuideColumnsCount()` |
| COL-02 | Set gutter width | Edit gutter NumberInput | Space between columns updated | `updateLayoutGuideGutter()` |
| COL-03 | Set all margins (linked) | Edit margin NumberInput (margins linked) | All 4 margins set to same value | `updateLayoutGuideMargin('all')` |
| COL-04 | Set left margin | Edit left margin (unlinked) | Left margin only | `updateLayoutGuideMargin('left')` |
| COL-05 | Set top margin | Edit top margin (unlinked) | Top margin only | `updateLayoutGuideMargin('top')` |
| COL-06 | Set right margin | Edit right margin (unlinked) | Right margin only | `updateLayoutGuideMargin('right')` |
| COL-07 | Set bottom margin | Edit bottom margin (unlinked) | Bottom margin only | `updateLayoutGuideMargin('bottom')` |
| COL-08 | Toggle margin linking | Click link/unlink button | Linked: one control; Unlinked: 4 independent controls | `toggleLayoutGuideMarginsLinked()` |

## Column Visibility

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-09 | Toggle guides visibility | Ctrl+; or View → Show Guides | Column grid overlay shown/hidden on canvas | `TOGGLE_LAYOUT_GUIDES` |
| COL-10 | Set guide color | Click guide color swatch → FillFlyout | Guide overlay color | `updateLayoutGuideAppearance({color})` |
| COL-11 | Set guide opacity | Edit opacity NumberInput (0–100%) | Guide overlay transparency | `updateLayoutGuideAppearance({opacity})` |

## Column Geometry

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-12 | Compute content bounds | Layout guides configured | `getContentBounds(slideW, slideH, margins)` returns usable area after margins | — |
| COL-13 | Compute column rects | Content bounds available | `getColumnRects(contentBounds, count, gutter)` returns `{x,y,width,height}` per column | — |
| COL-14 | Compute column edges | Column rects generated | `getColumnEdgesX(contentBounds, count, gutter)` returns flat array of all left/right X values | — |

## Column Snapping

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-15 | Snap move to column edge | Drag element near column left/right edge | Element snaps at threshold `5/zoom` px; `type: 'column-edge'` snap target | — |
| COL-16 | Snap resize to column edge | Resize handle near column edge | Edge snaps to column boundary | — |
| COL-17 | Snap to margin edge | Drag element near margin boundary | Element snaps to margin-left, margin-right, margin-top, margin-bottom | — |
| COL-18 | Column snap toggle | `state.editor.snapToColumns` | When false, column/margin snapping disabled | — |

## Inheritance Chain

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| COL-19 | Slide inherits from layout | Slide without layout guide override | Uses `slide.layoutId → layoutMaster.layoutGuide` | — |
| COL-20 | Layout inherits from master | Layout without layout guide override | Uses `layout.parentMasterId → master.layoutGuide` | — |
| COL-21 | System defaults | No guide configured at any level | `enabled: true, margins: {all: 40}, columns: {count: 3, gutter: 20}, appearance: {color: '#FF0000', opacity: 10}` | — |
| COL-22 | Show inherited badge | Guides inherited from parent | Badge shows source level; reset button clears override | — |
