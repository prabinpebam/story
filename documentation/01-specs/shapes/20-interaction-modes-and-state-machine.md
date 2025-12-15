# Interaction Modes & State Machine (Shapes)

**Status**: Draft

Defines the editor interaction state machine for shapes, aligned to Story’s current `CanvasManager` interaction states.

---

## 1. Modes
- Object mode (default)
- Vector edit mode
- Boolean edit mode
- Mask edit mode

Editor-level mode constraints (must match current behavior):
- `editor.mode: 'edit' | 'master' | 'presentation'` gates what interactions are allowed.
- `presentation` is view-only (no creation, no geometry edits, no selection affordances).
- `master` edits the active master container rather than the active slide’s element set.

## 2. Canvas interaction states (existing)
- `IDLE`, `PANNING`, `DRAGGING`, `RESIZING`, `CREATING`, `SELECTING`

Shapes must extend these without breaking existing behaviors.

## 3. Mode entry/exit
- Double-click shape: enter appropriate deep-edit mode (vector/group/mask) per rules.
- Escape: exit to object mode.

Figma-class learnings (state machine guardrails):
- Avoid implicit mode switches mid-gesture; mode changes should be explicit and predictable.
- “Sticky target” rule: once a gesture begins, keep the same edit target (point/handle/operand) until completion.
- Prevent UI from entering ambiguous states (e.g. simultaneously in vector mode and mask edit) by defining clear precedence and breadcrumbs.

Additional guardrails:
- If a tool/command is unavailable in the current mode (especially `presentation`), it should fail silently with no state mutation.
- When switching containers (slide↔master), clear deep-edit context explicitly to avoid “editing the wrong thing”.

## 4. Undo/redo coupling
- Mode changes should not create history entries unless they change document state.
- Gestures that mutate geometry must bracket with `START_INTERACTION`.

## 5. Tests / acceptance
- Enter/exit modes is predictable and does not lose selection.

## 6. Quality critique (gaps + risks)
- The spec should include a gesture→operation table (even if partial) to avoid inconsistent tool behaviors across implementers.
- State machine complexity tends to grow; keep mode count minimal and ensure each mode has a single “owner” for input routing.
