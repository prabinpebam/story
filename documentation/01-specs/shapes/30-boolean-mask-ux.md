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

#### 1.3.1 What changes visually for each boolean operation
This section defines the *visible geometry* for each operation. All operations are computed in a deterministic fold over the operand list.

Terminology:
- Let operands be an ordered list $[A, B, C, ...]$.
- Each operand contributes a filled region (its closed path area) in world space.
- The boolean node renders the derived result as its own vector geometry.

Operation semantics (v1 required):
- **Union**: the combined area of all operands.
	- Equivalent to: $(((A \cup B) \cup C) \cup ...)$
- **Subtract**: removes later operands from earlier ones.
	- Equivalent to: $(((A \setminus B) \setminus C) \setminus ...)$
	- Ordering matters. Subtract is NOT commutative.
- **Intersect**: keeps only the overlapping area across operands.
	- Equivalent to: $(((A \cap B) \cap C) \cap ...)$
- **Exclude** (XOR): keeps areas that are in an odd number of operands.
	- Equivalent to: $(((A \oplus B) \oplus C) \oplus ...)$

Visual expectations per operation (2 operands):
- Union: merged silhouette (no “holes” except those implied by operand shapes).
- Subtract: A with B cut out. If B does not overlap A, result looks like A.
- Intersect: only the overlap region. If no overlap, result is empty (no visible geometry).
- Exclude: union minus intersection. Overlapping region becomes empty.

Edge cases (v1 required):
- Degenerate operands (0 width/height or empty paths) contribute nothing.
- If the result is empty (no derived paths), the boolean node renders no fill/stroke geometry.

#### 1.3.2 Operand ordering (selection order) and why it matters
Operand ordering is a first-class, testable contract.

Rules (v1 required):
- The boolean node’s `operands` array MUST preserve the filtered selection ordering.
- No implicit reordering (z-order sorting, ID sorting, etc.) is allowed.

Why it matters:
- Subtract depends on order: `A - B` is different from `B - A`.
- For Union/Intersect/Exclude, ordering should not change the final region, but ordering still matters for determinism (test repeatability and multi-operand folds).

#### 1.3.3 Fill/stroke/effects when combining differently-styled shapes
This section is intentionally explicit so QA can validate style behavior without ambiguity.

V1 required style rule (current implementation contract):
- The boolean node inherits *all paint style* from the **first operand in the filtered operand list**.
	- Concretely: `booleanEl.style` is a deep clone of `firstOperand.style` at creation time.

Implications:
- If you combine two shapes of different fill colors:
	- The boolean result uses the first operand’s fill(s) and stroke(s).
	- It does NOT blend or average colors.
	- The second operand’s style has no effect on the boolean node’s paint.
- If the user wants the other color:
	- They can change the boolean node’s fill in the Property Inspector after creation, OR
	- They can create the boolean again with the desired “style source” selected first.

Specific paint expectations (v1 required):
- Fills: render using the boolean node’s `style.fills` list.
- Strokes: render using the boolean node’s `style.strokes` list.
- Opacity: per-fill/per-stroke opacity is honored.
- If a fill/stroke entry is `visible:false`, it does not render.

Notes / non-goals (v1):
- There is no multi-operand “style union” or per-operand material preservation.
- If a fill type is unsupported by the vector renderer, it may not appear even if it exists in `style`.

#### 1.3.4 What remains visible after boolean creation
This section defines what the user sees immediately after creating a boolean.

V1 required behavior:
- Creating a boolean does NOT delete or mutate operands.
- A new boolean element is created and becomes the only selected element.
- The boolean element is appended to `elementOrder` (top of stacking in the active container).

Visual implications:
- The boolean result will appear on top of its operands.
- Because operands are not removed in v1, users may still see operand geometry in areas not covered by the boolean result (depending on z-order and transparency).

UX note (not required for v1):
- “Hide operands automatically” is a common pro UX pattern, but v1 keeps operands intact and visible; drill-in/breadcrumb UX is a future improvement.

#### 1.3.5 When and how visible states update
This defines the update timing for derived geometry and what signals exist for validation.

Derived geometry recompute triggers (v1 required):
- Any change that affects the operand polygons or transforms MUST eventually update the boolean’s rendered geometry, including:
	- operand move/resize/rotate
	- operand path edit (vector points/paths)
	- operand parent transform changes (group transform)
	- boolean operation change

Update timing (v1 required):
- In steady-state, derived geometry updates on the next render/update pass after the underlying state change.

Progressive refinement / interaction behavior (v1 required):
- During UI interactions (`state.ui.isInteracting === true`), a “heavy” boolean MAY temporarily show its last-known-good derived result instead of recomputing on every frame.
- After interaction ends, the derived result MUST be recomputed and the display updated.

DOM validation hooks (v1 required):
- The boolean host element MUST set `data-boolean-status` to one of:
	- `ok` (computed successfully)
	- `repaired` (computed with canonicalization)
	- `fallback` (missing operands, self-reference, or compute failure)

Recommended (optional) UI indicator:
- If `data-boolean-status !== 'ok'` or the boolean is in a “stale preview” state, show a non-blocking “Refining…” affordance (no modal).

#### 1.3.6 Failure modes (non-fatal) and what the user sees
Boolean creation/editing failure MUST be non-fatal.

Rules (v1 required):
- If the boolean engine cannot compute paths:
	- The boolean node must remain in the document.
	- The app must not crash.
	- The boolean node may render empty geometry.
	- `data-boolean-status` MUST reflect `fallback`.

Flatten failure MUST be non-fatal (v1 required):
- If flatten cannot produce a valid path result:
	- Operands MUST remain intact.
	- Selection MUST remain unchanged.
	- A non-blocking warning is shown (no modal).

#### 1.3.7 Selection + hover overlays for booleans
This defines the expected selection/hover visuals for boolean nodes.

Required:
- Hover (when not selected): highlight the **shape path outline** (not the bounding box).
- Selection: keep the normal selection overlay AND also highlight the **shape path outline**.
- Colors MUST come from the design system accent tokens (e.g. `--color-accent`).

Validation note:
- Canvas overlay drawing can be validated by instrumenting the `#interaction-canvas` 2D context calls (e.g. path commands vs `strokeRect`).

#### 1.3.8 Concrete, testable creation contract (state + ordering + style)
After `CREATE_BOOLEAN_FROM_SELECTION`:
- `selectedElementIds` becomes `[<newBooleanId>]`.
- New element exists in the active container:
	- `type: 'shape'`
	- `shapeKind: 'boolean'`
	- `operation: <chosen>`
	- `operands: <filtered selection order>`
	- `style`: deep clone of operand[0].style (or default black fill if missing)
- New boolean is appended to `elementOrder` (topmost).

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
When exactly one selected element is a boolean node (`shapeKind:'boolean'`), the Property Inspector MUST surface the current boolean settings so the user can revisit/edit them.

Visibility rules (v1 required; matches current implementation):
- The Boolean section is shown only when `selectedElementIds.length === 1` AND the selected element kind is `boolean`.
- Otherwise, the Boolean section is hidden.

Operation control (v1 required; matches current implementation):
- The section includes an `Operation` dropdown with these options:
	- Union (`union`)
	- Subtract (`subtract`)
	- Intersect (`intersect`)
	- Exclude (`exclude`)
- The dropdown MUST be pre-populated to the selected boolean’s current operation:
	- Value is `el.operation`.
	- If missing/invalid, it defaults to `union`.
- The dropdown element MUST be addressable for automation via `data-testid="boolean-operation"`.
- Changing the dropdown MUST be non-destructive and update the boolean operation immediately by dispatching:
	- `store.dispatch('SET_BOOLEAN_OPERATION', { id: <booleanId>, operation: <op> })`

Status warning (v1 required; matches current implementation):
- If the boolean cannot be resolved (missing/invalid operands, etc.), the section shows a non-blocking status row (no modal).
- The warning row MUST be addressable via `data-testid="boolean-status-warning"`.
- In `presentation` mode, the warning row is not shown.

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

### 3.3 What masks look like (clip behavior)
V1 required behavior:
- A mask node (`shapeKind:'mask'`) is a relationship node and does not paint its own geometry.
- Content elements listed in `maskNode.contentIds` are clipped via a computed CSS `clip-path`.

What is visible:
- The **content** remains visible but clipped to the mask region.
- The **mask node** itself is not visible as a painted shape.
- The **mask shape element** referenced by `maskShapeId` remains a normal element unless the user changes its style.

Determinism (v1 required):
- If multiple mask nodes affect the same element, their clip regions are intersected.
- Multiple masks are applied in a deterministic order (by mask node id) even though intersection is commutative.

Invert behavior (v1 required):
- If `invert:true`, the effective clip region is (element bounds) minus (mask shape region).
- If invert computation fails, invert falls back deterministically to a no-op (treat as full rect).

DOM validation hook (v1 required):
- Masked content elements MUST set `data-mask-count` to the number of masks applied.

### 3.4 When mask visuals update
Mask updates MUST be reactive.

Changes that must update the visible clip:
- Mask shape geometry/transform changes.
- Content element geometry/transform changes.
- Mask invert toggles.
- Adding/removing mask nodes or content membership.

Expected timing:
- Clip-path updates on the next render/update pass.

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

### 5.1 Comprehensive validation checklist (UI + state + DOM)
Use this list to validate “correctness” with high confidence.

Boolean operations control (sidebar header)
- With <2 selected elements: boolean control is hidden.
- With 2+ selected, but fewer than 2 eligible operands after filtering: boolean control is hidden.
- With 2+ eligible operands:
	- The control is visible.
	- It is keyboard focusable.
	- It has accessible name `Boolean operations`.
	- Menu items appear in this exact order: Union, Subtract, Intersect, Exclude, separator, Flatten.
- Selecting an operation dispatches:
	- `CREATE_BOOLEAN_FROM_SELECTION` with `{ ids: selectedElementIds, operation: <op> }`.
- Selecting Flatten dispatches:
	- `FLATTEN_BOOLEAN_FROM_SELECTION` with `{ ids: selectedElementIds }`.

Boolean creation: state contract
- Creates a new element with `shapeKind:'boolean'` and chosen `operation`.
- `operands` equals the filtered selection order (no reordering).
- New boolean is added to `elementOrder` (topmost).
- Selection becomes exactly the new boolean.
- Style is inherited from operand[0] (first selected eligible operand):
	- If operand[0] fill is red and operand[1] fill is blue, result is red.

Boolean creation: visual contract
- Union/Subtract/Intersect/Exclude change the visible silhouette according to §1.3.1.
- Subtract is order-dependent and must match §1.3.1 fold semantics.
- The boolean node renders as vector geometry (fills/strokes follow boolean node style).
- Operands remain in the document in v1 (non-destructive).

Boolean editing
- Selecting a boolean shows a Boolean inspector section.
- The `Operation` dropdown shows the current `el.operation` value (defaults to `union`).
- Changing operation dispatches `SET_BOOLEAN_OPERATION` and updates the rendered geometry.
- If resolution fails, a non-blocking warning appears via `data-testid="boolean-status-warning"` (not in presentation mode).

Boolean editing: automation hooks (v1 required)
- The Operation dropdown is queryable via `data-testid="boolean-operation"`.
- The warning row is queryable via `data-testid="boolean-status-warning"`.
- When a boolean is selected, `data-testid="boolean-operation"` MUST reflect the current operation value.

Boolean update + performance signals
- Boolean host DOM element has `data-boolean-status` and updates when:
	- operation changes
	- operands change geometry/transform
- During heavy interactions, geometry may remain temporarily stale, but must refresh after interaction ends.

Flatten
- When eligible (2+ operands), Flatten creates a new `shapeKind:'vector'` element with union result.
- New vector style inherits from operand[0] (first eligible operand).
- Operands are removed.
- Selection becomes the new vector.
- Failure mode:
	- Operands and selection remain unchanged.
	- A non-blocking warning is shown.

Mask
- Creating a mask creates a `shapeKind:'mask'` node with `maskShapeId` and `contentIds`.
- Mask node itself does not paint geometry.
- Content in `contentIds` is clipped.
- Masked content elements set `data-mask-count`.
- Invert toggle updates clipping; invert failures fall back deterministically.

Figma-class learnings (UX guardrails):
- Always keep operands editable and visually discoverable (drill-in/breadcrumb), or booleans/masks become “mystery objects”.
- Treat “Flatten” as explicit and irreversible; require clear affordance and undo support.
- Failure handling must be non-fatal:
	- if boolean/mask resolution fails, show a warning and keep operands intact
	- never silently delete or replace operands with empty geometry

Quality critique (gaps + risks)
- This spec previously omitted the breadcrumb/drill-in contract; without it booleans/masks become impossible to understand in complex documents.
- Without a refinement indicator, users interpret boolean lag as a bug or “missing geometry”.
