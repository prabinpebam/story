# Keyboard & Gesture System (Shapes)

**Status**: Draft

Defines keyboard shortcuts and modifier semantics for shapes editing.

---

## 1. Tool switching
- Existing: `R` selects shape tool.
- Define vector edit toggle shortcut (must not conflict).

Mode gating:
- Shortcuts that mutate geometry are active only in `edit`/`master`.
- In `presentation`, shortcuts must not mutate state and must not enter edit modes.

## 2. Modifiers
- Shift: constrain
- Alt: from center / alternate behavior
- Ctrl/Cmd: additive selection

## 3. Gestures
- Double click to enter edit
- Escape to exit

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
