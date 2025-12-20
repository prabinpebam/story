# Keyboard Shortcuts

Single source of truth: `documentation/02-specs/core/keyboard-shortcuts-ledger.md`

## Overview

This spec defines Story’s keyboard shortcuts and how they must behave across contexts (canvas, text editing, menus, modals, presentation). The intent is **Figma-style muscle memory** where it fits Story’s current feature set, while staying **web-safe** (see `keyboard-shortcuts-conflict-resolution.md`).
# Keyboard Shortcuts Specification

## Overview

This spec defines Story’s keyboard shortcuts and how they must behave across contexts (canvas, text editing, menus, modals, presentation). The intent is **Figma-style muscle memory** where it fits Story’s current feature set, while staying **web-safe** (see `keyboard-shortcuts-conflict-resolution.md`).

**Design principles**
1. **Predictable contexts**: the same key does the same thing in the same context.
2. **Single-key tools**: fast tool switching (V/H/T/R/O/L…).
3. **Cmd/Ctrl for commands**: file/edit/arrange use Cmd/Ctrl-based chords.
4. **Strong escape hatch**: `Esc` reliably closes/backs out.
5. **Discoverable**: shown in menus/tooltips and the shortcuts overlay.

---

## Notation

- “Cmd/Ctrl” means `⌘` on macOS and `Ctrl` on Windows/Linux.
- “Alt/Option” means `⌥` on macOS and `Alt` on Windows/Linux.
- Shortcuts are written as **physical keys**, not characters (e.g. `[` not “brace”).

---

## Context model (priority)

Keyboard handling is **context routed**. Highest priority wins and must stop propagation.

1. **Modal dialogs** (file browser, sign-in, alerts)
2. **Menus / context menus** (app menu dropdowns, right-click menus)
3. **Text editing** (`contentEditable` text element editing)
4. **Presentation mode**
5. **Panels** (dockable/overlay panels)
6. **Canvas editing** (selection, transform, arrange)
7. **Global app** (file ops, undo/redo, mode toggles)

**`Esc` rule**: `Esc` closes the *topmost* UI layer first (submenu → menu → context menu → panel → modal), otherwise it exits edit sub-modes (deep edit / text edit / presentation). In the current app, `Esc` does **not** reliably “deselect all” on the canvas unless a specific UI layer implements it.

---

## 1) Tools (single key)

These shortcuts are active in **Edit/Master** modes when focus is not in an input/textarea/contentEditable (and when no modal/menu is capturing keys).

| Key | Action | Notes |
|---:|---|---|
| `V` | Select / Move | Primary selection tool |
| `H` | Hand (pan) tool | Persistent hand tool |
| `T` | Text tool | Inserts/creates text |
| `R` | Rectangle | Shape tool |
| `O` | Ellipse | Shape tool |
| `L` | Line | Shape tool |
| `Shift+L` | Arrow | Shape tool |
| `Shift+P` | Polygon | Story shape variant |
| `Shift+S` | Star | Story shape variant |
| `Shift+I` | Toggle Resources (Icon Library) panel | Implemented by `Toolbar` (opens `#icon-library`) |
| `Shift+K` | Image tool | Implemented by `Toolbar` (sets active tool to `image`) |

**Insert / media**

Story currently exposes media insert via tool shortcuts (e.g. `Shift+K`) and menu actions; Cmd/Ctrl-based “place image” parity bindings are listed under **Menu-labeled / target parity** below.

---

## 2) Canvas editing (selection & transform)

Active in **Edit/Master** modes when not typing in an input or text-editing.

### Selection & edit

| Shortcut | Action | Notes |
|---|---|---|
| `Cmd/Ctrl+A` | Select all elements on current slide | Current behavior |
| `Delete` / `Backspace` | Delete selection | In deep-edit deletes selected nodes/edges |
| `Cmd/Ctrl+D` | Duplicate | Duplicates elements; duplicates slides if slides are selected |
| `Cmd/Ctrl+G` | Group | Current behavior |
| `Cmd/Ctrl+Shift+G` | Ungroup | Current behavior |
| `0`–`9` | Set opacity preset | Current behavior (selection) |

### Clipboard

| Shortcut | Action | Notes |
|---|---|---|
| `Cmd/Ctrl+C` | Copy | Copies elements (internal clipboard); copies slide selection when slides are selected |
| `Cmd/Ctrl+V` | Paste | Prefers system clipboard image/SVG when available; otherwise pastes internal clipboard |

Notes:
- `Cmd/Ctrl+X` (Cut) and `Cmd/Ctrl+Shift+V` (Paste in place) are labeled in menus today but are not currently handled by the global keydown stack.

### Pan

| Shortcut | Action | Notes |
|---|---|---|
| `Space` (hold) + drag | Pan canvas | Must prevent page scroll while active |

### Nudge

| Shortcut | Action |
|---|---|
| Arrow keys | Nudge 1px |
| `Shift` + Arrow keys | Nudge 10px |

### Arrange (z-order)

| Shortcut | Action | Notes |
|---|---|---|
| `Cmd/Ctrl+[` | Send backward | Current behavior |
| `Cmd/Ctrl+]` | Bring forward | Current behavior |
| `Cmd/Ctrl+Shift+[` | Send to back | Current behavior |
| `Cmd/Ctrl+Shift+]` | Bring to front | Current behavior |

### Slides (thumbnail selection)

When slide thumbnails are selected (multi-select supported), `CanvasManager` handles a limited set of slide operations:

| Shortcut | Action | Notes |
|---|---|---|
| `Cmd/Ctrl+D` | Duplicate selected slide(s) | Uses current selection (`selectedSlideIds`) |
| `Delete` / `Backspace` | Delete selected slide(s) | Prompts for confirmation |
| `Cmd/Ctrl+C` | Copy selected slide | Copies the first selected slide ID |
| `Cmd/Ctrl+V` | Paste slide | Pastes relative to current active slide |

---

## 3) Text editing (contentEditable)

Text editing captures keydown in **capture phase** and must win over canvas/global shortcuts.

### Exit

| Shortcut | Action |
|---|---|
| `Esc` | Exit text edit (keep selection, do not force-save) |
| `Cmd/Ctrl+Enter` | Exit text edit and commit/save |

### Formatting

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+B` | Bold |
| `Cmd/Ctrl+I` | Italic |
| `Cmd/Ctrl+U` | Underline |
| `Cmd/Ctrl+Shift+X` | Strikethrough |

### Tab behavior

- In lists: `Tab` indents; `Shift+Tab` outdents.
- Not in lists: `Tab` exits text edit and selects next element; `Shift+Tab` performs outdent.

---

## 4) Presentation mode

When `mode === presentation`, editing shortcuts must not mutate document state.

| Shortcut | Action |
|---|---|
| `Esc` | Exit presentation |
| Next: `ArrowRight`, `Space`, `Enter`, `PageDown`, `N` | Next slide |
| Prev: `ArrowLeft`, `Backspace`, `PageUp`, `P` | Previous slide |
| `B` or `.` | Black screen |
| `W` or `,` | White screen |
| `L` | Laser pointer |
| `G` | Grid view |

Build-step behavior (Story-specific):
- Next/Prev first advance through “builds” (incremental steps) when available; only when the build sequence is exhausted does navigation move to the next/previous slide.

---

## 5) Menus and context menus

Menus/context menus must support keyboard navigation and must intercept these keys while open:

| Key | Action |
|---|---|
| `ArrowUp` / `ArrowDown` | Move focus |
| `ArrowRight` | Open submenu |
| `ArrowLeft` | Close submenu |
| `Enter` / `Space` | Activate focused item |
| `Home` / `End` | Jump to first/last item |
| `Esc` | Close menu/context menu |
| A–Z (typeahead) | Focus item by first character |

---

## 6) Modals

Modals own the keyboard while open.

- `Esc` closes the modal.
- File browser modal: `Backspace` navigates up one level when focus is not in an input.

---

## 7) Global app shortcuts

Active when no higher-priority context is capturing shortcuts.

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+N` | New document |
| `Cmd/Ctrl+O` | Open… |
| `Cmd/Ctrl+S` | Save |
| `Cmd/Ctrl+Shift+S` | Save as… |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl+Y` | Redo (alternate) |
| `Cmd/Ctrl+Shift+M` | Toggle Master mode |

Note: `?` and `Cmd/Ctrl+/` are the intended overlay toggles; they are specified in `keyboard-shortcuts-overlay-ux.md` but are not currently wired in `src/**`.

---

## 8) Story-specific panels

Story includes panels that don’t have Figma-equivalent shortcuts.

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+Shift+C` | Toggle Color Theme manager |
| `Cmd/Ctrl+Shift+T` | Toggle Typography Style manager |
| `Cmd/Ctrl+Shift+K` | Toggle Code Fill panel |

Rationale:
- These bindings reflect the current `PanelManager` registrations in `src/main.js`.
- They intentionally trade off Figma parity (e.g., `Cmd/Ctrl+Shift+C` for “Copy as PNG”) until the app can migrate Story-specific panels off those reserved bindings.

---

## 9) Menu-labeled / target parity shortcuts (not yet wired)

These shortcuts are currently shown in menu labels and/or are required for Figma-parity where features overlap, but are not consistently handled by the current distributed `keydown` listeners.

Important: some menu labels currently conflict (the same shortcut is shown for more than one action). The table below lists the intended bindings; where the menu is currently conflicting, it is called out explicitly so the spec remains unambiguous.

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+X` | Cut |
| `Cmd/Ctrl+Shift+V` | Paste in Place |
| `Cmd/Ctrl+Shift+C` | Copy as PNG (Figma parity) |
| `Cmd/Ctrl+Shift+K` | Place image (Figma parity) |
| `Cmd/Ctrl+0` | Fit to Screen |
| `Cmd/Ctrl+1` | Actual Size |
| `Cmd/Ctrl++` | Zoom In |
| `Cmd/Ctrl+-` | Zoom Out |
| `Cmd/Ctrl+'` | Toggle Grid |
| `Cmd/Ctrl+;` | Toggle Guides |
| `Cmd/Ctrl+R` | Toggle Rulers |
| `Cmd/Ctrl+Enter` | New Slide |
| `Cmd/Ctrl+Shift+Enter` | Start Presentation (from current slide) |
| `Cmd/Ctrl+,` | Open Settings |
| `Cmd/Ctrl+L` | Lock selection |
| `Cmd/Ctrl+Shift+L` | Unlock all |
| `Esc` | Deselect all (when no higher-priority layer is open) |
| `?` and `Cmd/Ctrl+/` | Toggle keyboard shortcuts overlay |

Menu label conflict note (current app):
- `Cmd/Ctrl+Enter` is currently labeled for both **Slide → New Slide** and **Present → From Beginning** in `src/ui/components/AppMenu/menuConfig.js`. The app must pick one binding; this spec reserves `Cmd/Ctrl+Enter` for **New Slide**.

---

## 10) Phased delivery (no deferred scope)

Phasing is allowed for sequencing, but **all shortcuts in this spec** are in-scope.

1. **Normalize & route**: enforce the context priority model above (menus/modals/text edit/presentation/panels/canvas/global) and use a single normalization function for key combos.
2. **Make labels truthful**: menus/tooltips/overlay must show only shortcuts that exist, and must reflect the bindings in this spec.
3. **Close parity gaps**: implement missing items already surfaced in menus/spec (notably Cut, Copy as PNG, paste variants) and remove conflicts (e.g. don’t bind panel toggles to `Cmd/Ctrl+Shift+C` / `Cmd/Ctrl+Shift+K`).
4. **Overlay**: ensure `?` and `Cmd/Ctrl+/` toggle the shortcut overlay and it lists the complete, context-aware set.

---

**Last updated:** 2025-12-20
