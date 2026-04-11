# 31 — Cursor Behavior

> Taskflows for tool cursors, resize handle cursors, rotation-aware mapping, priority stack, and cursor hiding.

## Tool Cursors

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-01 | Select tool cursor | Activate select tool (V) | Cursor: `default`; body class: `cursor-select` | — |
| CUR-02 | Hand tool cursor | Activate hand tool (H) | Cursor: `grab`; body class: `cursor-hand` | — |
| CUR-03 | Shape tool cursor | Activate any shape tool (R/O/L) | Cursor: `crosshair`; body class: `cursor-shape` | — |
| CUR-04 | Text tool cursor | Activate text tool (T) | Cursor: `crosshair`; body class: `cursor-text` | — |
| CUR-05 | Image tool cursor | Activate image tool (Shift+K) | Cursor: `crosshair`; body class: `cursor-image` | — |

## Resize Handle Cursors

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-06 | N/S resize cursor | Hover n or s handle | `ns-resize` cursor | — |
| CUR-07 | E/W resize cursor | Hover e or w handle | `ew-resize` cursor | — |
| CUR-08 | NW/SE resize cursor | Hover nw or se handle | `nwse-resize` cursor | — |
| CUR-09 | NE/SW resize cursor | Hover ne or sw handle | `nesw-resize` cursor | — |

## Rotation-Aware Cursor Mapping

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-10 | Rotated handle cursor | Hover resize handle on rotated element | `getResizeCursor(handle, rotation)`: normalize rotation → find 45° sector → offset base cursor index | — |
| CUR-11 | Sector 0 (0°–22.5°) | Handle on unrotated element | Base cursor unchanged | — |
| CUR-12 | Sector 1 (22.5°–67.5°) | Handle on ~45°-rotated element | Cursor rotated one step: ns→nesw→ew→nwse→ns | — |
| CUR-13 | Full rotation cycle | 8 sectors at 45° each | 4-cursor cycle: ns-resize → nesw-resize → ew-resize → nwse-resize → ns-resize | — |

## Priority Stack

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-14 | Push cursor to stack | `CursorManager.push(cursor, reason)` | Cursor added to stack; deduplication by reason (re-push replaces) | — |
| CUR-15 | Pop cursor from stack | `CursorManager.pop(reason)` | Specific cursor removed by reason | — |
| CUR-16 | Stack wins over tool | Stack has entries | Top of stack cursor displayed instead of tool cursor | — |
| CUR-17 | Clear stack | `CursorManager.clearStack()` | All stack entries removed; falls back to tool cursor | — |
| CUR-18 | Resolution order | Cursor resolved | hidden → stack top → tool cursor → `'default'` | — |

## Cursor Hiding

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-19 | Hide cursor | `CursorManager.hide(reason)` (e.g., scrub drag) | `cursor-hidden` class added to `document.body` | — |
| CUR-20 | Show cursor | `CursorManager.show(reason)` | Only shows if reason matches hide reason (prevents mismatch) | — |
| CUR-21 | Presentation idle hide | No mouse movement for 5s in presentation | Cursor auto-hidden; reappears on movement | — |

## Application

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CUR-22 | Cursor applied to canvas | Cursor changes | Applied to `#interaction-canvas` element via `element.style.cursor` | — |
| CUR-23 | Check active reason | `hasReason(reason)` | Returns whether specific cursor reason is currently active | — |
