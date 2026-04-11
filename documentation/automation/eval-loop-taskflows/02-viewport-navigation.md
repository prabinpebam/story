# 02 — Viewport & Navigation

> Taskflows for panning, zooming, and fitting the canvas viewport.

## Panning

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| VP-01 | Pan with space+drag | Space hold + left-click drag | Cursor changes to grab hand, viewport pans with mouse delta | `UPDATE_EDITOR({pan})` |
| VP-02 | Pan with middle mouse | Middle mouse button drag | Pan viewport without holding space | `UPDATE_EDITOR({pan})` |
| VP-03 | Pan with scroll wheel | Scroll wheel (no modifier) | `pan.x -= deltaX`, `pan.y -= deltaY` | `UPDATE_EDITOR({pan})` |
| VP-04 | Pan with hand tool | Hand tool (H key) + left-click drag | Cursor shows grab, viewport pans | `UPDATE_EDITOR({pan})` |
| VP-05 | Release pan | Release mouse during pan | Interaction returns to IDLE, cursor restored to previous tool | — |
| VP-06 | Performance pan mode | Space+drag begins | `isPerformancePanning = true`, direct CSS transform without store dispatch per frame | Commit on release |

## Zooming

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| VP-07 | Zoom in (scroll) | Ctrl+Scroll wheel up | Zoom toward mouse cursor position, cursor position preserved in world space | `UPDATE_EDITOR({zoom, pan})` |
| VP-08 | Zoom out (scroll) | Ctrl+Scroll wheel down | Zoom away from mouse cursor position | `UPDATE_EDITOR({zoom, pan})` |
| VP-09 | Zoom in (keyboard) | Ctrl+`+` or `+` button | `zoom * 1.2`, centered on viewport center | `UPDATE_EDITOR({zoom, pan})` |
| VP-10 | Zoom out (keyboard) | Ctrl+`-` or `-` button | `zoom / 1.2`, centered on viewport center | `UPDATE_EDITOR({zoom, pan})` |
| VP-11 | Zoom min enforcement | Any zoom action at 10% | Zoom clamped to `0.1` (10%), further zoom-out blocked | — |
| VP-12 | Zoom max enforcement | Any zoom action at 500% | Zoom clamped to `5.0` (500%), further zoom-in blocked | — |
| VP-13 | Cursor-centered zoom | Ctrl+Scroll | World coordinates under cursor remain fixed after zoom. Pan adjusted: `newPan = cursorScreen - (cursorWorld * newZoom)` | `UPDATE_EDITOR({zoom, pan})` |
| VP-14 | Zoom display update | Any zoom change | `#zoom-display` element updated with percentage (e.g., "100%") | — (DOM update) |

## Fit & Reset

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| VP-15 | Fit to view | Shift+1 or Ctrl+0 or fit button | `min(availW / slideW, availH / slideH)` with 60px padding, slide centered | `UPDATE_EDITOR({zoom, pan})` |
| VP-16 | Zoom to 100% | Ctrl+1 | Reset zoom to exactly 1.0, re-center slide | `UPDATE_EDITOR({zoom, pan})` |

## Viewport Transform

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| VP-17 | Content layer transform | Any pan/zoom change | CSS `translate(pan.x, pan.y) scale(zoom)` applied to `#slide-content` and `#slide-background` | — |
| VP-18 | Canvas resize | Window resize | Canvas dimensions synced to container `getBoundingClientRect()`, skipped in presentation mode | — |
