# Keyboard & Gesture System (Shapes)

**Status**: Draft

Defines keyboard shortcuts and modifier semantics for shapes editing.

---

## 1. Tool switching

Tool switching must be consistent with `documentation/02-specs/core/keyboard-shortcuts.md` and the Shapes toolbar spec: [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md).

### 1.1 Primary tools
- `V` → Select/Move
- `H` → Hand/Pan
- `T` → Text

### 1.2 Shape creation tools (v1)
These must work even when the toolbar is not focused, but must never fire while typing in inputs/textarea/contentEditable.

| Tool | Shortcut | Notes |
|---|---:|---|
| Rectangle | `R` | Default shape tool |
| Ellipse | `O` | Figma-aligned |
| Line | `L` | Figma-aligned |
| Arrow | `Shift+L` | Figma-aligned |
| Polygon | `Shift+P` | Story-specific, enables rapid testing |
| Star | `Shift+S` | Story-specific, enables rapid testing |

### 1.3 Vector edit mode
- `Enter` toggles deep-edit (vector edit) for vector-capable shapes.
- `Escape` exits deep-edit modes without mutating geometry.

Mode gating:
- Shortcuts that mutate geometry are active only in `edit`/`master`.
- In `presentation`, shortcuts must not mutate state and must not enter edit modes.

## 2. Modifiers
- Shift: constrain
- Alt: from center / alternate behavior
- Ctrl/Cmd: additive selection

Constrain rules are defined in [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md).

## 3. Gestures
- Double click to enter edit
- Escape to exit

---

## 3.2 Boolean/mask commands (selection-level)

Boolean/mask commands are only active when selection is compatible (see [30-boolean-mask-ux.md](./30-boolean-mask-ux.md)).

Suggested shortcuts (v1, Windows):
- `Alt+Shift+U` → Union
- `Alt+Shift+S` → Subtract
- `Alt+Shift+I` → Intersect
- `Alt+Shift+E` → Exclude
- `Alt+Shift+F` → Flatten (irreversible)

Mac equivalents use `Option+Shift+…`.

## 3.1 Paste (Ctrl/Cmd+V) — interop
When not in text-editing focus, `Ctrl/Cmd+V` MUST attempt a shapes import paste.

Mode gating:
- In `presentation`, paste MUST not mutate document state.

Paste priority (system clipboard):
- Prefer vector payloads for editability:
	1) `image/svg+xml`
	2) `text/html` containing an `<svg>`
	3) `text/plain` containing an `<svg>`
	4) raster `image/*` (fallback)

Behavior contract:
- Figma clipboard paste MUST follow [19a-figma-clipboard-import.md](./19a-figma-clipboard-import.md) and produce editable Story elements.
- Paste MUST be a single undo step.

Vector editing gestures (v1):
- Double-click a vector-capable shape → enter vector edit; for non-vector-capable shapes, double-click is a no-op.
- Double-click point → toggle corner↔smooth (see [21-vector-editing-operations.md](./21-vector-editing-operations.md)).
- Alt-drag handle → break/unlink handles (explicit; never inferred).

## 4. Acceptance
- Shortcuts are consistent and discoverable.

Figma-class learnings (mode safety):
- Always provide a reliable escape hatch:
	- `Escape` exits deep edit modes (vector/boolean/mask) without mutating geometry.
- Avoid “modal traps”:
	- mode switches should be visually indicated and reversible.
- Shortcut conflicts must be resolved up-front to prevent fragmented muscle memory.

Quality critique (gaps + risks)
- Without explicit mode gating, “presentation edit” bugs will leak into production and corrupt documents.
- Gesture ambiguity (implicit break/toggle rules) leads to user distrust; keep interactions explicit and documented.
