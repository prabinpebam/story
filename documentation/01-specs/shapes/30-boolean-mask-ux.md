# Boolean & Mask Interaction UX

**Status**: Ready for implementation

Defines user flows for creating, editing, and flattening booleans and masks.

This spec is UI-facing: the goal is to make boolean/mask functionality **testable via the existing toolbar + property inspector + sidebar header selection controls**.

Related:
- Tool UX + shortcuts: [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md)
- Shortcuts + modifiers: [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)
- Data model: [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)

---

## V1 scope note (what ships vs future)

**Shipped in v1 (required)**:
- Boolean + mask nodes exist and are non-destructive (until the user explicitly flattens).
- Robust failure-mode behavior is non-fatal (fallbacks keep operands/content intact and surface non-blocking warnings).
- Sidebar header selection UI supports creating booleans from multi-selection via a dropdown (Union/Subtract/Intersect/Exclude) and explicit Flatten.
- Node-level inspector sections exist for boolean operation and mask invert.

**V1 NON-GOAL**:
- Keyboard shortcuts for boolean/mask commands (menu-driven UI is sufficient for v1).
- Mask creation from selection UI (separate follow-up; this spec still documents the desired behavior).

---

## 1. Boolean creation

### 1.1 Entry points (V1)

#### 1.1.1 Sidebar header: Selection summary + boolean dropdown
When **more than 1** element is selected, the sidebar header MUST show the current selection summary (existing behavior).

If the current selection is **eligible for boolean composition** (see rules below), the sidebar header MUST also show a **Boolean operations** control:
- A button/icon for boolean operations with a dropdown caret.
- Clicking opens a dropdown menu anchored to the header control.

Accessibility requirements:
- The control MUST be keyboard focusable.
- The button MUST have an accessible name (e.g. `Boolean operations`).
- Menu items MUST be reachable by keyboard (Up/Down, Enter to activate, Escape to close).

Menu structure (required):
- `Union`
- `Subtract`
- `Intersect`
- `Exclude`
- (Divider: visual separator; not a command)
- `Flatten`

The divider is a UI separator between non-destructive boolean creation commands and destructive/baking commands.

#### 1.1.2 Eligibility rules for showing/enabling the boolean dropdown
The boolean dropdown is only shown when:
- `selectedElementIds.length >= 2`, AND
- After filtering, there are **2+ eligible operands**.

Eligible operands (v1):
- Shape/vector elements that can participate as boolean operands.
- NOT composition nodes (i.e., NOT `shapeKind:'boolean'` and NOT `shapeKind:'mask'`).

If the selection is 2+ but yields <2 eligible operands after filtering:
- Do NOT show the boolean dropdown (avoid silent no-ops).

If a future UX requires showing a disabled dropdown, it MUST include a reason text; however, v1 uses “hide when not eligible” for clarity.

### 1.2 Command behavior
On choosing a boolean op (Union/Subtract/Intersect/Exclude):
- Create a new boolean node with:
	- `shapeKind:'boolean'`
	- `operation:<chosen>`
	- `operands:[...selectedIds]` (ordering; see below)
- The new boolean node becomes the only selected element.

On choosing `Flatten` from the sidebar header dropdown:
- Flatten MUST be treated as an explicit, irreversible baking action.
- Flatten MUST operate on the **current selection** and produce a single baked vector result.

Flatten semantics (v1):
- Filter the current selection to eligible operands (same filtering rules as boolean creation).
- If fewer than 2 eligible operands remain, Flatten MUST do nothing and MUST NOT change selection (this should be prevented by eligibility gating).
- Create a derived boolean result using `operation:'union'` (union is the deterministic default for flattening a multi-selection).
- Convert the derived result into a new baked element (`shapeKind:'vector'`) and place it into the document.
- Remove the original operand elements from the document.
- Select the baked result.

Undo contract:
- Flatten from selection MUST be **1 undo step**.

Failure mode:
- If the boolean engine cannot compute a derived path for flattening, the operation MUST be aborted safely:
	- Keep operands intact.
	- Keep selection intact.
	- Surface a non-blocking warning (no modal).

Implementation mapping (Store actions; used by tests/automation today):
- Union/Subtract/Intersect/Exclude MUST dispatch:
	- `store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: state.editor.selectedElementIds, operation: <op> })`
	- The store handler is responsible for filtering invalid operands and selecting the newly created boolean.

Implementation mapping for Flatten (new requirement):
- Sidebar header `Flatten` MUST dispatch a single action that is undo-coalesced into one history step, e.g.:
	- `store.dispatch('FLATTEN_BOOLEAN_FROM_SELECTION', { ids: state.editor.selectedElementIds })`

Notes:
- If implementation prefers composing multiple lower-level actions, it MUST still present as **one undo step**.

Operand ordering (v1):
- Preserve the current selection ordering (`state.editor.selectedElementIds`) after filtering to valid operands.
- Never re-order operands implicitly later.

Implementation note:
- The current store handler follows the selection array order rather than sorting by z-order.
- If selection order is found to be unstable, the recommended stabilization is sorting by `elementOrder` back→front.

### 1.3 Preview/result
- The boolean node renders the derived result immediately.
- If the boolean engine is still computing/refining, show a non-blocking “Refining…” indicator (no modal).

### 1.4 Invalid selection behavior (must be explicit)
The boolean dropdown MUST avoid silent no-ops.

Rules:
- If selection is < 2 elements, the boolean dropdown is hidden.
- If selection is 2+ but becomes ineligible after filtering (e.g. includes booleans/masks, or non-shape elements), hide the dropdown.

## 2. Boolean editing
- Select boolean node
- Highlight operands
- Change operation

v1 constraint:
- Operand reordering and drill-in/breadcrumb UX are future work; v1 supports operation changes only.

### 2.1 Property Inspector: Boolean section (node selected)
When exactly one selected element has `shapeKind:'boolean'`, the inspector shows a **Boolean** section with:
- `Operation` dropdown: Union/Subtract/Intersect/Exclude
	- Changing it updates `el.operation` (non-destructive)

Optional (recommended, consistent with sidebar header behavior):
- `Flatten` button (danger-styled) that converts the boolean to a `shapeKind:'vector'` result and removes operand linkage.
	- Undo: 1 step.
	- Failure: non-fatal; keep operands + boolean node intact; show non-blocking warning.

### 2.2 Shortcuts (V1 NON-GOAL)
Selection-level boolean/mask shortcuts are not shipped in v1.

Required UX details:

Future UX (not required for v1):
- Breadcrumb / drill-in context (Boolean → Operand or Mask → Mask shape/Content).
- Operand selection from both canvas and layer panel.
- Explicit operand reordering UI.

Progressive refinement feedback:
- If boolean is in preview/refining state, show a non-blocking indicator (no modal).

## 3. Mask flows
- “Use as mask”
- Edit mask vs content

### 3.1 Entry points (V1 NON-GOAL)
When selection contains:
- Exactly 2+ elements, with one intended to be the mask shape and the rest content:
	- Provide a selection-level command **Use as mask** in the same selection-level composition section in the Property Inspector, OR expose it via the right-click canvas context menu.

v1 default mask-shape choice:
- If the user does not explicitly choose a mask shape, the mask shape is the topmost element among the selection by current stacking order.

Creation behavior:
- Create `shapeKind:'mask'` node with:
	- `maskShapeId:<chosen mask id>`
	- `contentIds:[...chosen content ids]`
	- default `mode:'clip'`
	- default `invert:false`
- The new mask node becomes selected.

Implementation mapping (Store actions; used by tests/automation today):
- “Use as mask” MUST dispatch:
	- `store.dispatch('CREATE_MASK_FROM_SELECTION', { ids: state.editor.selectedElementIds })`
- Explicit choice of `maskShapeId` / `contentIds` is optional future UX. v1 uses handler defaults.

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

Flatten acceptance for undo:
- Flatten from selection is 1 undo step.
- Flatten a selected boolean node is 1 undo step.

## 5. Acceptance
- Non-destructive behavior is obvious and controllable.

Manual UI acceptance checklist:
- Multi-select 2+ eligible shapes/vectors → sidebar header shows Boolean operations dropdown → choose Union/Subtract/Intersect/Exclude → boolean node created and selected.
- Multi-select 2+ eligible shapes/vectors → choose Flatten → baked vector created; operands removed; result selected.
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
