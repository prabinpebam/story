# Interaction Modes & State Machine (Shapes)

**Status**: Implemented (v1, partial)
**Last Updated**: December 17, 2025

Defines the editor interaction state machine for shapes, aligned to Story’s current `CanvasManager` interaction states.

---

## 1. Modes
- Object mode (default)
- Vector edit mode
- Boolean edit mode
- Mask edit mode

Vector edit mode semantics (required):
- V1 edits the active element’s **path/segment representation** (not a graph-based Vector Network).
- V1 deep edit supports edit targets: **node**, **handle**, **edge**. **Face selection** is a v1 non-goal.

V1 non-goals (explicit):
- Vector Networks / derived faces per [08a-vector-networks.md](./08a-vector-networks.md) are **V1 NON-GOAL**.
- Boolean and mask “deep edit modes” are defined conceptually here but are implemented/specified elsewhere and are not part of v1 mode routing.

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

Deep-edit context (required):
- When entering Vector edit mode, the editor MUST set:
	- `deepEdit.elementId`
	- `deepEdit.kind = 'vector'`
	- `deepEdit.selection` (node/edge/face ids)
- When leaving Vector edit mode, the editor MUST clear `deepEdit` and return to normal element selection.

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

Vector edit history bracketing (required):
- Pointer-down that will mutate geometry MUST dispatch `START_INTERACTION`.
- Pointer-up MUST dispatch `END_INTERACTION`.
- During a drag, intermediate state updates may be emitted, but MUST coalesce into a single undo step.

## 5. Tests / acceptance
- Enter/exit modes is predictable and does not lose selection.

## 5.1 Gesture → operation table (required)
This table is the canonical input routing contract.

Object mode:
- Click element: select element
- Drag element: move element
- Drag resize handle: resize element
- Double-click vector-capable element: enter Vector edit mode (deep edit)

Vector edit mode:
- Click node: select node
- Click handle: select handle (and its owning node)
- Click edge: select edge
- Drag node: move node(s)
- Drag handle: move handle
- Double-click edge: insert node on edge
- Double-click node: toggle node type corner ↔ smooth
- Delete/Backspace:
	- if nodes selected: delete nodes
	- else if edges selected: delete edges

Selection modifiers:
- Shift: additive selection
- Ctrl/Cmd: toggle selection membership

Non-negotiable routing rule:
- Hit target selection MUST follow [12-hit-testing.md](./12-hit-testing.md).
- Once a drag starts, the captured target MUST remain stable until pointer-up.

## 6. Quality critique (gaps + risks)
- The spec should include a gesture→operation table (even if partial) to avoid inconsistent tool behaviors across implementers.
- State machine complexity tends to grow; keep mode count minimal and ensure each mode has a single “owner” for input routing.

Resolution:
- The gesture→operation table above is required for v1; implementers must not invent alternate mappings without updating this spec.
