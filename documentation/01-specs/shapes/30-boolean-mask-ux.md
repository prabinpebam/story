# Boolean & Mask Interaction UX

**Status**: Draft

Defines user flows for creating, editing, and flattening booleans and masks.

---

## 1. Boolean creation
- Multi-select shapes
- Choose boolean op
- Preview result

## 2. Boolean editing
- Select boolean node
- Highlight operands
- Reorder operands
- Change operation

Required UX details:
- Breadcrumb / drill-in must show current edit context (Boolean → Operand or Mask → Mask shape/Content).
- Operand selection should be possible from both canvas (click operand outline) and layer panel.
- Reordering operands must be explicit (layer panel drag or dedicated UI); never reorder as a side effect of edits.

Progressive refinement feedback:
- If boolean is in preview/refining state, show a non-blocking indicator (no modal).

## 3. Mask flows
- “Use as mask”
- Edit mask vs content

Mask edit affordances:
- Clearly indicate whether edits are affecting the mask shape or the masked content.
- Allow toggling mask inversion (if supported) via inspector.

## 4. Undo
- Each boolean/mask action is undoable.

## 5. Acceptance
- Non-destructive behavior is obvious and controllable.

Figma-class learnings (UX guardrails):
- Always keep operands editable and visually discoverable (drill-in/breadcrumb), or booleans/masks become “mystery objects”.
- Treat “Flatten” as explicit and irreversible; require clear affordance and undo support.
- Failure handling must be non-fatal:
	- if boolean/mask resolution fails, show a warning and keep operands intact
	- never silently delete or replace operands with empty geometry

Quality critique (gaps + risks)
- This spec previously omitted the breadcrumb/drill-in contract; without it booleans/masks become impossible to understand in complex documents.
- Without a refinement indicator, users interpret boolean lag as a bug or “missing geometry”.
