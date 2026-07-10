# Eval Loop Taskflow Catalog — Index

> Inventory of user-observable behaviors expected by the current taskflow specifications.
> A taskflow row is a requirement candidate, not proof of implementation or test coverage.

The catalog predates the unified [Story Product Specification](../../../product/product-spec.md). Existing IDs remain useful for detailed interaction behavior, but each category must be reconciled with the product requirements as it is implemented. Coverage is valid only when a test performs the listed user action and asserts the resulting visible state, document state, and artifact where applicable.

## Files

| # | File | Category | Taskflows |
|---|------|----------|-----------|
| 01 | [01-selection-hit-testing.md](01-selection-hit-testing.md) | Selection & Hit-Testing | 20 |
| 02 | [02-viewport-navigation.md](02-viewport-navigation.md) | Viewport & Navigation | 18 |
| 03 | [03-element-creation.md](03-element-creation.md) | Element Creation | 19 |
| 04 | [04-element-movement.md](04-element-movement.md) | Element Movement & Dragging | 17 |
| 05 | [05-element-resize.md](05-element-resize.md) | Element Resize | 16 |
| 06 | [06-element-rotation.md](06-element-rotation.md) | Element Rotation | 8 |
| 07 | [07-text-editing.md](07-text-editing.md) | Text Editing | 82 |
| 08 | [08-context-menu.md](08-context-menu.md) | Context Menu | 82 |
| 09 | [09-layer-management.md](09-layer-management.md) | Layer Management | 40 |
| 10 | [10-undo-redo.md](10-undo-redo.md) | Undo / Redo | 22 |
| 11 | [11-property-inspector.md](11-property-inspector.md) | Property Inspector — Core Sections | 115 |
| 12 | [12-numeric-input.md](12-numeric-input.md) | Numeric Input Interaction | 24 |
| 13 | [13-snapping-alignment.md](13-snapping-alignment.md) | Snapping & Alignment | 19 |
| 14 | [14-fills-system.md](14-fills-system.md) | Fills System | 74 |
| 15 | [15-strokes-system.md](15-strokes-system.md) | Strokes System | 28 |
| 16 | [16-effects-system.md](16-effects-system.md) | Effects System | 25 |
| 17 | [17-typography-styles.md](17-typography-styles.md) | Typography Styles & OpenType | 43 |
| 18 | [18-color-picker.md](18-color-picker.md) | Color Picker & Theme Linking | 39 |
| 19 | [19-shapes.md](19-shapes.md) | Shapes & Vector Editing | 49 |
| 20 | [20-slide-management.md](20-slide-management.md) | Slide Management | 22 |
| 21 | [21-master-slides-layouts.md](21-master-slides-layouts.md) | Master Slides & Layouts | 30 |
| 22 | [22-themes.md](22-themes.md) | Themes & Luma-Locked Palette | 41 |
| 23 | [23-transitions.md](23-transitions.md) | Transitions | 23 |
| 24 | [24-slide-notes.md](24-slide-notes.md) | Slide Notes | 26 |
| 25 | [25-presentation-mode.md](25-presentation-mode.md) | Presentation Mode | 50 |
| 26 | [26-ai-features.md](26-ai-features.md) | AI Features | 10 |
| 27 | [27-collaboration.md](27-collaboration.md) | Collaboration | 26 |
| 28 | [28-column-system.md](28-column-system.md) | Column System & Layout Guides | 22 |
| 29 | [29-keyboard-shortcuts.md](29-keyboard-shortcuts.md) | Keyboard Shortcuts & Input Manager | 58 |
| 30 | [30-file-operations.md](30-file-operations.md) | File Operations | 21 |
| 31 | [31-cursor-behavior.md](31-cursor-behavior.md) | Cursor Behavior | 23 |
| 32 | [32-export-system.md](32-export-system.md) | Export System | 33 |
| — | **TOTAL** | | **~1,085** |

## Conventions

- **ID format**: `CAT-NN` (e.g., `SEL-01`, `FIL-14`, `PI-32`)
- **Each row** = one discrete user action and expected result
- **Trigger** = the exact user gesture (click, drag, key combo, etc.)
- **Expected behavior** = observable outcome (store change, DOM change, visual change)
- **Store dispatch** = the action dispatched to the Immer store
- **Conditional** = when the taskflow only applies under specific conditions

## Coverage Rules

- A baseline capture does not cover a taskflow unless it performs the trigger and evaluates the expected outcome.
- Multiple taskflow IDs may share setup, but each expected behavior needs discriminating evidence.
- DOM presence alone does not prove visible, hit-testable paint or interaction.
- Store state alone does not prove that the user received the result.
- Coverage claims must record the test, evidence type, revision, date, and result separately from this inventory.
