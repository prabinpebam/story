# Boolean & Mask Interaction UX

**Status**: Draft

Defines user flows for creating, editing, and flattening booleans and masks.

This spec is UI-facing: the goal is to make the shipped boolean/mask functionality **testable via the existing toolbar + property inspector**.

Related:
- Tool UX + shortcuts: [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md)
- Shortcuts + modifiers: [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)
- Data model: [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)

---

## 1. Boolean creation

### 1.1 Entry points (must exist)
When the user has **2+ boolean-capable** elements selected (shapes/vectors/booleans as operands):
- A **Boolean operations** dropdown is visible in the Property Inspector header area (near the selected element type/name), matching the Figma-style affordance shown in UI references.

Dropdown items:
- Union
- Subtract
- Intersect
- Exclude
- Divider
- Flatten

### 1.2 Command behavior
On choosing a boolean op (Union/Subtract/Intersect/Exclude):
- Create a new boolean node with:
	- `shapeKind:'boolean'`
	- `operation:<chosen>`
	- `operands:[...selectedIds]` (deterministic ordering; see below)
- The new boolean node becomes the only selected element.

Deterministic operand ordering:
- Use canvas z-order from back → front (or an equivalent deterministic ordering already used by selection).
- Never re-order operands implicitly later.

### 1.3 Preview/result
- The boolean node renders the derived result immediately.
- If the boolean engine is still computing/refining, show a non-blocking “Refining…” indicator (no modal).

## 2. Boolean editing
- Select boolean node
- Highlight operands
- Reorder operands
- Change operation

### 2.1 Property Inspector: Boolean section (node selected)
When exactly one selected element has `shapeKind:'boolean'`, the inspector shows a **Boolean** section with:
- `Operation` dropdown: Union/Subtract/Intersect/Exclude
	- Changing it updates `el.operation` (non-destructive)

Optional but recommended for testability:
- `Flatten` button (danger-styled) that converts the boolean to a `shapeKind:'vector'` result and removes operand linkage.

### 2.2 Shortcuts (Windows)
These shortcuts invoke the same commands as the Boolean operations dropdown when selection is compatible:
- `Alt+Shift+U` → Union
- `Alt+Shift+S` → Subtract
- `Alt+Shift+I` → Intersect
- `Alt+Shift+E` → Exclude
- `Alt+Shift+F` → Flatten

Mac equivalents use `Option+Shift+…`.

Required UX details:
- Breadcrumb / drill-in must show current edit context (Boolean → Operand or Mask → Mask shape/Content).
- Operand selection should be possible from both canvas (click operand outline) and layer panel.
- Reordering operands must be explicit (layer panel drag or dedicated UI); never reorder as a side effect of edits.

Progressive refinement feedback:
- If boolean is in preview/refining state, show a non-blocking indicator (no modal).

## 3. Mask flows
- “Use as mask”
- Edit mask vs content

### 3.1 Entry points
When selection contains:
- Exactly 2+ elements, with one intended to be the mask shape and the rest content:
	- Provide a selection-level command **Use as mask** in the same inspector-header dropdown group (or adjacent), OR expose it via the right-click canvas context menu.

Creation behavior:
- Create `shapeKind:'mask'` node with:
	- `maskShapeId:<chosen mask id>`
	- `contentIds:[...chosen content ids]`
	- default `mode:'clip'`
	- default `invert:false`
- The new mask node becomes selected.

Mask edit affordances:
- Clearly indicate whether edits are affecting the mask shape or the masked content.
- Allow toggling mask inversion via inspector (required).

### 3.2 Property Inspector: Mask section (node selected)
When exactly one selected element has `shapeKind:'mask'`, show a **Mask** section with:
- `Invert` toggle
- (Optional) `Mode` dropdown: Clip/Alpha (if alpha masking is implemented)

## 4. Undo
- Each boolean/mask action is undoable.

Acceptance for undo:
- Creating a boolean/mask is 1 undo step.
- Changing boolean operation is 1 undo step.
- Flatten is 1 undo step.

## 5. Acceptance
- Non-destructive behavior is obvious and controllable.

Manual UI acceptance checklist:
- Multi-select shapes → Boolean dropdown appears → choose Union/Subtract/Intersect/Exclude → boolean node created and selected.
- Boolean node selected → Boolean section appears → Operation dropdown changes operation.
- Mask node selected → Mask section appears → Invert toggle works.

Figma-class learnings (UX guardrails):
- Always keep operands editable and visually discoverable (drill-in/breadcrumb), or booleans/masks become “mystery objects”.
- Treat “Flatten” as explicit and irreversible; require clear affordance and undo support.
- Failure handling must be non-fatal:
	- if boolean/mask resolution fails, show a warning and keep operands intact
	- never silently delete or replace operands with empty geometry

Quality critique (gaps + risks)
- This spec previously omitted the breadcrumb/drill-in contract; without it booleans/masks become impossible to understand in complex documents.
- Without a refinement indicator, users interpret boolean lag as a bug or “missing geometry”.
