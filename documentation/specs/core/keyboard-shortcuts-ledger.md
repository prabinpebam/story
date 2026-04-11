# Keyboard + Mouse Interaction Ledger (Single Source of Truth)

**Status**: Living ledger

This document is the **single source of truth** for Story’s shortcuts and interaction gestures.

It is designed to:
- Track **what exists today** (implemented) vs **what is labeled** (menus) vs **what is intended** (spec/parity).
- Make mode/context behavior explicit (the same gesture can do different things depending on mode).
- Surface **gaps, conflicts, and broken wiring** so implementation can be planned and verified.

Related:
- Authoritative shortcut spec: `documentation/specs/core/keyboard-shortcuts.md`
- Overlay UX: `documentation/specs/core/keyboard-shortcuts-overlay-ux.md`
- Browser conflicts: `documentation/specs/core/keyboard-shortcuts-conflict-resolution.md`

---

## 0) Status codes

| Code | Meaning |
|---|---|
| **I** | Implemented and verified in current code |
| **P** | Partially implemented (some contexts/modes missing or differs) |
| **M** | Menu-labeled (or UI-labeled) but not handled by current keyboard/mouse routing |
| **S** | Spec-defined (or parity-required) but not implemented and not labeled |
| **C** | Conflict (same gesture mapped to multiple actions) |
| **B** | Broken wiring (label/handler exists but does not work due to mismatched mode/state/IDs) |

---

## 1) Modes + context priority (what can “win”)

### 1.1 Modes

| Mode | Store value (observed/expected) | Notes |
|---|---|---|
| Edit | `edit` | Normal authoring |
| Master | `master` | Edit slide master/layout |
| Presentation | `presentation` | Non-mutating playback; PresentationManager listens for this |

Known issue:
- `MenuActionHandler.startPresentation()` dispatches `SET_MODE`, `'present'` (not `presentation`). This is likely a **B (broken wiring)** for menu-driven present actions.
  - Source: `src/ui/services/MenuActionHandler.js`
  - Presentation key/mouse logic checks `state.editor.mode === 'presentation'`.

### 1.2 Context priority (high → low)

| Priority | Context |
|---:|---|
| 1 | Modal dialogs (e.g., file/sign-in modals) |
| 2 | Menus (AppMenu dropdowns) and context menus |
| 3 | Text editing (`contentEditable`) |
| 4 | Presentation |
| 5 | Panels |
| 6 | Canvas editing (selection/transform/arrange) |
| 7 | Global app |

---

## 2) Keyboard ledger (implemented)

> These entries are verified in current code paths.

### 2.1 Global app shortcuts

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `Cmd/Ctrl+N` | Edit/Master | Global | New document | I | `src/main.js` |
| `Cmd/Ctrl+O` | Edit/Master | Global | Open… | I | `src/main.js` |
| `Cmd/Ctrl+S` | Edit/Master | Global | Save | I | `src/main.js` |
| `Cmd/Ctrl+Shift+S` | Edit/Master | Global | Save as… | I | `src/main.js` |
| `Cmd/Ctrl+Z` | Edit/Master | Global | Undo | I | `src/main.js` |
| `Cmd/Ctrl+Shift+Z` | Edit/Master | Global | Redo | I | `src/main.js` |
| `Cmd/Ctrl+Y` | Edit/Master | Global | Redo (alt) | I | `src/main.js` |
| `Cmd/Ctrl+Shift+M` | Edit/Master | Global | Toggle Master mode | I | `src/main.js` |

### 2.2 Tool switching (Toolbar)

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `V` | Edit/Master | Canvas | Select / Move tool | I | `src/ui/Toolbar.js` |
| `H` | Edit/Master | Canvas | Hand tool | I | `src/ui/Toolbar.js` |
| `T` | Edit/Master | Canvas | Text tool | I | `src/ui/Toolbar.js` |
| `R` | Edit/Master | Canvas | Rectangle tool | I | `src/ui/Toolbar.js` |
| `O` | Edit/Master | Canvas | Ellipse tool | I | `src/ui/Toolbar.js` |
| `L` | Edit/Master | Canvas | Line tool | I | `src/ui/Toolbar.js` |
| `Shift+L` | Edit/Master | Canvas | Arrow tool | I | `src/ui/Toolbar.js` |
| `Shift+P` | Edit/Master | Canvas | Polygon tool | I | `src/ui/Toolbar.js` |
| `Shift+S` | Edit/Master | Canvas | Star tool | I | `src/ui/Toolbar.js` |
| `Shift+I` | Edit/Master | Canvas | Toggle Resources (Icon Library) panel | I | `src/ui/Toolbar.js` (opens `#icon-library`) |
| `Shift+K` | Edit/Master | Canvas | Image tool | I | `src/ui/Toolbar.js` |

### 2.3 Panels

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `Cmd/Ctrl+Shift+C` | Edit/Master | Panels | Toggle Color Theme manager | I | Registered in `src/main.js` / handled by `src/ui/PanelManager.js` |
| `Cmd/Ctrl+Shift+T` | Edit/Master | Panels | Toggle Typography Style manager | I | Registered in `src/main.js` / handled by `src/ui/PanelManager.js` |
| `Cmd/Ctrl+Shift+K` | Edit/Master | Panels | Toggle Code Fill panel | I | Registered in `src/main.js` / handled by `src/ui/PanelManager.js` |
| `Esc` | Edit/Master | Panels | Close topmost panel | I | `src/ui/PanelManager.js` |

### 2.4 Canvas editing (selection/transform/arrange)

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `Esc` | Edit/Master | Canvas | Exit deep-edit stack (vector/boolean/mask) | I | `src/core/CanvasManager.js` |
| `Enter` | Edit/Master | Canvas | If exactly 1 text element selected: enter text edit | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+A` | Edit/Master | Canvas | Select all elements on slide | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+D` | Edit/Master | Canvas | Duplicate (elements) | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+D` | Edit/Master | Slides selection | Duplicate selected slide(s) | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+G` | Edit/Master | Canvas | Group | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+Shift+G` | Edit/Master | Canvas | Ungroup | I | `src/core/CanvasManager.js` |
| `Delete` / `Backspace` | Edit/Master | Canvas | Delete selected elements | I | `src/core/CanvasManager.js` |
| `Delete` / `Backspace` | Edit/Master | Slides selection | Delete selected slide(s) (confirm) | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+C` | Edit/Master | Canvas | Copy selected elements to internal clipboard | I | `src/core/CanvasManager.js` (`window.elementClipboard`) |
| `Cmd/Ctrl+V` | Edit/Master | Canvas | Paste: system clipboard image/SVG when available OR internal clipboard | P | `src/core/CanvasManager.js` (hybrid) |
| `Cmd/Ctrl+C` | Edit/Master | Slides selection | Copy selected slide (first) | I | `src/core/CanvasManager.js` (`window.slideClipboard`) |
| `Cmd/Ctrl+V` | Edit/Master | Slides selection | Paste slide (relative to active slide) | I | `src/core/CanvasManager.js` |
| Arrow keys | Edit/Master | Canvas | Nudge selection 1px | I | `src/core/CanvasManager.js` |
| `Shift` + Arrow keys | Edit/Master | Canvas | Nudge selection 10px | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+[` | Edit/Master | Canvas | Send backward (z-order) | I | `src/core/CanvasManager.js` (`BracketLeft`) |
| `Cmd/Ctrl+]` | Edit/Master | Canvas | Bring forward (z-order) | I | `src/core/CanvasManager.js` (`BracketRight`) |
| `Cmd/Ctrl+Shift+[` | Edit/Master | Canvas | Send to back | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl+Shift+]` | Edit/Master | Canvas | Bring to front | I | `src/core/CanvasManager.js` |
| `0`–`9` | Edit/Master | Canvas | Set opacity preset | I | `src/core/CanvasManager.js` |

### 2.5 Text editing (contentEditable)

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `Esc` | Edit/Master | Text edit | Exit text edit (discard/save=false) | I | `src/core/text/TextEditManager.js` |
| `Cmd/Ctrl+Enter` | Edit/Master | Text edit | Exit text edit (commit/save) | I | `src/core/text/TextEditManager.js` |
| `Cmd/Ctrl+B` | Edit/Master | Text edit | Bold | I | `src/core/text/TextEditManager.js` |
| `Cmd/Ctrl+I` | Edit/Master | Text edit | Italic | I | `src/core/text/TextEditManager.js` |
| `Cmd/Ctrl+U` | Edit/Master | Text edit | Underline | I | `src/core/text/TextEditManager.js` |
| `Cmd/Ctrl+Shift+X` | Edit/Master | Text edit | Strikethrough | I | `src/core/text/TextEditManager.js` |
| `Tab` | Edit/Master | Text edit (in list) | Indent | I | `src/core/text/TextEditManager.js` |
| `Shift+Tab` | Edit/Master | Text edit (in list) | Outdent | I | `src/core/text/TextEditManager.js` |
| `Tab` | Edit/Master | Text edit (not list) | Exit text edit and select next element | I | `src/core/text/TextEditManager.js` |
| `Shift+Tab` | Edit/Master | Text edit (not list) | Outdent | I | `src/core/text/TextEditManager.js` |

### 2.6 Presentation keyboard

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| `ArrowRight` / `Space` / `Enter` / `PageDown` / `N` | Presentation | Presentation | Next (build-first, then slide) | I | `src/core/PresentationManager.js` |
| `ArrowLeft` / `Backspace` / `PageUp` / `P` | Presentation | Presentation | Prev (build-first, then slide) | I | `src/core/PresentationManager.js` |
| `Esc` | Presentation | Presentation | Exit presentation | I | `src/core/PresentationManager.js` |
| `B` or `.` | Presentation | Presentation | Toggle black screen | I | `src/core/PresentationManager.js` |
| `W` or `,` | Presentation | Presentation | Toggle white screen | I | `src/core/PresentationManager.js` |
| `L` | Presentation | Presentation | Toggle laser pointer | I | `src/core/PresentationManager.js` |
| `G` | Presentation | Presentation | Toggle grid view | I | `src/core/PresentationManager.js` |

---

## 3) Mouse + pointer gesture ledger (implemented)

### 3.1 Canvas navigation + viewport

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Mouse wheel (no modifier) | Edit/Master | Canvas | Pan viewport (dx/dy) | I | `src/core/CanvasManager.js` (`handleWheel`) |
| `Cmd/Ctrl` + wheel | Edit/Master | Canvas | Zoom towards cursor | I | `src/core/CanvasManager.js` (`handleWheel`) |
| Middle mouse drag | Edit/Master | Canvas | Pan viewport | I | `src/core/CanvasManager.js` (`handleMouseDown` → `PANNING`) |
| Hold `Space` + left-drag | Edit/Master | Canvas | Pan viewport | I | `src/core/CanvasManager.js` (`Space` sets `isSpacePressed`, then mousedown pans) |
| Hand tool + left-drag | Edit/Master | Canvas | Pan viewport | I | `src/core/CanvasManager.js` (activeTool === `hand`) |

### 3.2 Selection + manipulation

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Click element | Edit/Master | Canvas | Select element (replace selection) | I | `src/core/CanvasManager.js` |
| `Shift` + click element | Edit/Master | Canvas | Toggle element in selection | I | `src/core/CanvasManager.js` |
| `Cmd/Ctrl` + click element | Edit/Master | Canvas | Deep-select behavior (do not climb to top parent) | I | `src/core/CanvasManager.js` (deep select logic) |
| Drag selection | Edit/Master | Canvas | Move selected elements | I | `src/core/CanvasManager.js` |
| `Alt` + drag | Edit/Master | Canvas | Duplicate while dragging | I | `src/core/CanvasManager.js` |
| Drag on empty space | Edit/Master | Canvas | Marquee selection (Shift adds) | I | `src/core/CanvasManager.js` |
| Resize handle drag + `Shift` | Edit/Master | Canvas | Constrain proportions (or invert based on state) | I | `src/core/CanvasManager.js` (`_handleResize`) |
| Resize handle drag + `Alt` | Edit/Master | Canvas | Resize from center | I | `src/core/CanvasManager.js` (`_handleResize`) |
| Rotate handle drag + `Shift` | Edit/Master | Canvas | Snap rotation (15°) | I | `src/core/CanvasManager.js` |

### 3.3 Double-click behaviors

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Double-click text element | Edit/Master | Canvas | Enter text edit at click position | I | `src/core/CanvasManager.js` (`handleDoubleClick` → `SET_EDITING_ELEMENT`) |
| Double-click vector element | Edit/Master | Canvas | Enter vector deep edit | I | `src/core/CanvasManager.js` |
| Double-click boolean/mask result shape | Edit/Master | Canvas | Enter deep edit (operands/shape) | I | `src/core/CanvasManager.js` |
| Double-click vector edge (in vector deep edit) | Edit/Master | Canvas | Insert node on edge | I | `src/core/CanvasManager.js` |
| Double-click vector node (in vector deep edit) | Edit/Master | Canvas | Toggle corner↔smooth | I | `src/core/CanvasManager.js` |

### 3.4 Context menus

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Right-click on empty canvas | Edit/Master | Canvas | Clear selection; show canvas-empty menu | I | `src/core/CanvasManager.js` + `src/ui/components/ContextMenu/*` |
| Right-click on element | Edit/Master | Canvas | Select element (Shift extends), show element menu | I | `src/core/CanvasManager.js` |
| Right-click while text editing | Edit/Master | Canvas | Show text-editing context menu | I | `src/core/CanvasManager.js` |

### 3.5 Drag and drop

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Drag image onto canvas | Edit/Master | Canvas | Import/place image via drop | I | `src/core/CanvasManager.js` (`dragover`/`drop`) |

### 3.6 Presentation mouse

| Gesture | Mode(s) | Context | Action | Status | Implementation |
|---|---|---|---|:---:|---|
| Mouse move | Presentation | Presentation | Laser pointer tracking when enabled | I | `src/core/PresentationManager.js` |
| Mouse move/down/up | Presentation | Presentation | Broadcast mouse state to CodeFill | I | `src/core/PresentationManager.js` |

---

## 4) Menu + context menu keyboard navigation (implemented)

| Gesture | Context | Action | Status | Implementation |
|---|---|---:|:---:|---|
| `ArrowUp` / `ArrowDown` | AppMenu | Move focus | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `ArrowRight` | AppMenu | Open submenu | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `ArrowLeft` | AppMenu | Close submenu | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `Enter` / `Space` | AppMenu | Activate focused item | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `Home` / `End` | AppMenu | Jump to first/last | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `A`–`Z` (typeahead) | AppMenu | Jump to item by first letter | I | `src/ui/components/AppMenu/MenuDropdown.js` |
| `ArrowUp` / `ArrowDown` | ContextMenu | Move focus | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `ArrowRight` | ContextMenu | Open submenu | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `ArrowLeft` | ContextMenu | Close submenu | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `Enter` / `Space` | ContextMenu | Activate focused item | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `Home` / `End` | ContextMenu | Jump to first/last | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `A`–`Z` (typeahead) | ContextMenu | Jump to item by first letter | I | `src/ui/components/ContextMenu/ContextMenu.js` |
| `Esc` | ContextMenu | Close menu (or close submenu) | I | `src/ui/components/ContextMenu/ContextMenu.js` |

---

## 5) Ledger: menu-labeled shortcuts and implementation gaps

> These are shortcuts shown in `src/ui/components/AppMenu/menuConfig.js` (and/or other UI), but **are not necessarily handled** by keyboard routing.

### 5.1 Conflicts and broken wiring

| Gesture | Labeled action(s) | Actual behavior today | Status | Notes |
|---|---|---|:---:|---|
| `Cmd/Ctrl+Enter` | Slide → New Slide; Present → From Beginning | Canvas: `Enter` (no modifiers) enters text edit; `Cmd/Ctrl+Enter` commits text edit when editing; no global handler to start presentation | C | Menu labels conflict. Spec reserves `Cmd/Ctrl+Enter` for New Slide; Present needs different binding. |
| Present menu actions | Present → From Beginning / From Current | PresentationManager expects mode `presentation` | B | `MenuActionHandler.startPresentation()` uses `SET_MODE`, `'present'` (not `presentation`), likely preventing true presentation mode. |

### 5.2 Menu-labeled but not handled by key routing (examples)

| Gesture | Menu label | Expected action | Status | Notes |
|---|---|---|:---:|---|
| `Cmd/Ctrl+X` | Edit → Cut | Cut selection | P | Implemented for menu click in `MenuActionHandler` (internal clipboard), but **not** implemented as a canvas keydown shortcut in `CanvasManager`’s handler stack. |
| `Cmd/Ctrl+Shift+V` | Edit → Paste in Place | Paste in place | M | Labeled in menu, no key handler found in current stack. |
| `Ctrl+/` (displayed) | Help → Keyboard Shortcuts | Show shortcut overlay | M | Menu emits `story:show-shortcuts`, but no overlay implementation found; no key handler for `Cmd/Ctrl+/` or `?` in `src/**`. |
| `Ctrl++` / `Ctrl+-` | View → Zoom In/Out | Zoom in/out | M | Zoom is implemented for menu click (`MenuActionHandler.zoomIn/zoomOut`), but no key handler registered for `Ctrl++/Ctrl+-`. Mouse zoom exists via `Ctrl+wheel`. |
| `Ctrl+0` / `Ctrl+1` | View → Fit/Actual | Fit/actual | M | Fit is event-driven (`story:fit-to-view`) via menu click; no key handler for these bindings. |
| `Ctrl+Backspace` | Slide → Delete Slide | Delete slide | M | Canvas key handler uses `Delete/Backspace` to delete slides *when slides are selected* (with confirm). Menu label uses `Ctrl+Backspace` but key handler does not. |
| `Ctrl+↑` / `Ctrl+↓` | Slide → Move Slide Up/Down | Reorder slides | M | Menu click dispatches MOVE actions; no key handler registered. |
| `Ctrl+L` / `Ctrl+Shift+L` | Arrange → Lock / Unlock All | Lock/unlock | M | Menu click dispatches `LOCK_ELEMENTS`/`UNLOCK_ALL`; no key handler registered. |
| `Ctrl+'` / `Ctrl+;` / `Ctrl+R` | View → Grid/Guides/Rulers | Toggle overlays | M | Menu click dispatches toggle actions; no key handler registered. |

### 5.3 “Two clipboards” gap (consistency)

| Area | Current behavior | Status | Why it matters |
|---|---|:---:|---|
| Copy/Paste via keys | Uses `window.elementClipboard` / `window.slideClipboard` in `CanvasManager` | P | Works for keyboard paths, but not shared with menu cut/copy/paste. |
| Cut/Copy/Paste via menu click | Uses `MenuActionHandler.clipboard` (in-memory) | P | Menu click paste may not paste what keyboard copy produced, and vice versa. |

---

## 6) Implementation planning checklist (what the ledger implies)

This ledger is intended to be used as a build plan:

1. **Fix broken mode string**: unify on `presentation` for presenting.
2. **Resolve menu label conflicts** (notably `Cmd/Ctrl+Enter`).
3. **Add missing key handlers** for menu-labeled shortcuts (zoom, view toggles, paste variants, slide reorder).
4. **Unify clipboard model** (menu vs keyboard) so Cut/Copy/Paste are consistent.
5. **Implement shortcut overlay** and wire `?` + `Cmd/Ctrl+/` + Help → Keyboard Shortcuts.

---

**Last updated:** 2025-12-20
