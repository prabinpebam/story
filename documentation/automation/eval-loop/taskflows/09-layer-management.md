# 09 — Layer Management

> Taskflows for layer tree rendering, selection sync, visibility/lock toggles, renaming, drag-and-drop reordering, and inherited element handling.

## Layer Tree Rendering

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-01 | Render layer tree | `state-changed` event from store | Tree re-renders in reverse z-order (front-to-back); grouped by source: Slide → Layout → Theme | — |
| LYR-02 | Display element type icon | Layer item renders | Type-specific Font Awesome icon shown per element type | — |
| LYR-03 | Show placeholder badge | Placeholder element in layer tree | Badge distinguishes has-content vs empty placeholder | — |
| LYR-04 | Show inherited link icon | Inherited (layout/theme) element | Link icon badge on layer item | — |
| LYR-05 | Show boolean warning | Boolean element degraded/fallback | Orange warning icon on layer item | — |
| LYR-06 | Show morph duplicate warning | Multiple L0 elements share match key | Orange warning indicator for morph name conflict | — |
| LYR-07 | Hide composition children | Boolean operands and mask children | Hidden from top-level; nested under composite parent | — |
| LYR-08 | Depth indentation | Nested elements in groups | `paddingLeft = calc(var(--spacing-2) + depth * var(--spacing-4))` | — |

## Selection

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-09 | Single select layer | Click layer row | Element selected; canvas selection syncs | `UPDATE_SELECTION([id])` |
| LYR-10 | Toggle selection (Shift+click) | Shift+click layer row | Add to or remove from selection | `UPDATE_SELECTION([...existing, id])` or remove |
| LYR-11 | Canvas selection syncs to layers | Select element on canvas | Corresponding layer row gets `.selected` class | — |
| LYR-12 | Layer selection syncs to canvas | Select layer row | Canvas highlights matching element | `UPDATE_SELECTION` |
| LYR-13 | Right-click selects layer | Right-click on layer item | Element selected before context menu opens | `UPDATE_SELECTION` |

## Visibility Toggle

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-14 | Show visibility controls on hover | Hover over layer row | Lock + visibility buttons fade in (opacity) | — |
| LYR-15 | Always show when hidden | Layer of hidden element | Eye-slash icon always visible (not just on hover) | — |
| LYR-16 | Toggle visibility | Click eye icon on layer row | Element hidden/shown on canvas; icon toggles eye ↔ eye-slash | `TOGGLE_ELEMENT_VISIBILITY` |
| LYR-17 | Always show when selected | Selected layer row | Controls always visible regardless of hover | — |

## Lock Toggle

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-18 | Toggle lock | Click lock icon on layer row | Element locked/unlocked; icon toggles lock ↔ lock-open; `.active` class on button | `TOGGLE_ELEMENT_LOCK` |
| LYR-19 | Always show when locked | Layer of locked element | Lock icon always visible | — |

## Rename Flow

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-20 | Enter rename | Double-click layer name span | Inline `<input type="text">` replaces span; pre-filled with current name | — |
| LYR-21 | Programmatic rename entry | Context menu → Rename or `startRename()` | Finds `.layer-item-name` span, triggers ondblclick | — |
| LYR-22 | Commit rename on Enter | Press Enter in rename input | Name updated; span restored | `UPDATE_ELEMENT({id, name: value.trim()})` |
| LYR-23 | Commit rename on blur | Click outside rename input | Name updated on blur event | `UPDATE_ELEMENT({id, name: value.trim()})` |
| LYR-24 | Block rename on inherited | Double-click inherited element name | Rename NOT triggered (not draggable, not renameable) | — |

## Drag and Drop

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-25 | Start drag | Drag non-inherited layer item | `draggedId` + `dragContext` stored; `effectAllowed = 'move'` | — |
| LYR-26 | Block drag on inherited | Attempt to drag inherited element | `draggable = false`; drag doesn't start | — |
| LYR-27 | Block drag on mask shape | Attempt to drag mask shape | `draggable = false` | — |
| LYR-28 | Drop zone: before | Hover top 25% of target item | Blue top border indicator; `dropPosition = 'before'` | — |
| LYR-29 | Drop zone: after | Hover bottom 25% of target item | Blue bottom border indicator; `dropPosition = 'after'` | — |
| LYR-30 | Drop zone: inside group | Hover middle 50% of group item | Highlight background; `dropPosition = 'inside'` | — |
| LYR-31 | Standard reorder | Drop on standard element | Calculates `targetParentId` + `targetIndex` with removal adjustment | `REORDER_ELEMENTS` |
| LYR-32 | Boolean operand reorder | Drop within same boolean composite | Reorder operands within boolean group | `REORDER_BOOLEAN_OPERANDS` |
| LYR-33 | Mask content reorder | Drop within same mask composite | Reorder mask children | `REORDER_MASK_CONTENT` |
| LYR-34 | Clear drag state | dragend event on document | All drag state cleared; tree re-renders | — |

## Inherited Elements

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-35 | Toggle inherited visibility | Click toggle button in header | Show/hide Layout+Theme sections; `showInheritedElements` toggled | — |
| LYR-36 | Inherited section header | Inherited elements present | Collapsible section with link icon and element count | — |
| LYR-37 | Get effective slide elements | Render layer tree | `store.getEffectiveSlide()` merges slide + layout + theme elements | — |

## Group Hierarchy

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| LYR-38 | Render group children | Group element in tree | Children rendered recursively at `depth+1`, reverse order | — |
| LYR-39 | Boolean children nested | Boolean composite element | Operands shown as nested children under composite parent | — |
| LYR-40 | Mask children nested | Mask composite element | Mask contents shown as nested children | — |
