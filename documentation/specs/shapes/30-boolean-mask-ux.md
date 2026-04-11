# Boolean & Mask Interaction UX (Figma-parity+)

**Status**: Ready for implementation

Defines the end-state UX and UI contracts for creating, editing, and flattening booleans and masks with **Figma-parity (and beyond)**. This document is written to be **automation-friendly** (DOM hooks + deterministic state contracts).

Related:
- Tool UX + shortcuts: [39-toolbar-tools-and-creation-ux.md](./39-toolbar-tools-and-creation-ux.md)
- Shortcuts + modifiers: [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)
- Data model: [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)

---

## 0. Principles (non-negotiable)

- **Result-first**: the boolean object is defined by the derived result (visible silhouette, hover outline, selection outline, and bounds).
- **Result-as-base-shape**: a boolean result behaves like a normal shape for selection, transforms, and downstream composition (including nested booleans).
- **Non-destructive**: operands/content are preserved in state until the user explicitly bakes/flattens.
- **No double-rendering**: operands (and mask shapes) are hidden in the viewport by default after composition, so the user sees the resultant composition, not the ingredients.
- **Editable ingredients**: hidden operands/mask shapes remain discoverable and editable via a drill-in/breadcrumb workflow (no “mystery objects”).
- **Composable (unbounded nesting)**: booleans can be used as operands of other booleans as many levels deep as needed (DAG; cycles are invalid and must fall back safely).
- **Deterministic**: operation semantics and operand ordering are stable and testable.
- **Non-fatal failures**: boolean/mask resolution problems never crash and never silently delete user content; they surface non-blocking warnings and preserve data.

---

## 1. Boolean creation

### 1.1 Entry point: sidebar header (multi-selection)
When **more than 1** element is selected, the sidebar header MUST show the current selection summary (existing behavior).

If the current selection is **eligible for boolean composition** (see rules below), the sidebar header MUST also show a **Boolean operations** control:
- A button/icon with dropdown caret.
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
- (Divider)
- `Flatten`

The divider is a UI separator between non-destructive boolean creation commands and destructive baking commands.

### 1.2 Eligibility rules (avoid silent no-ops)
The boolean dropdown is shown only when:
- `selectedElementIds.length >= 2`, AND
- After filtering, there are **2+ eligible operands**.

Eligible operands:
- Any element that provides a filled region in world space (a closed path area), including:
	- Primitive shapes (rect/circle/etc.)
	- Vectors
	- Other booleans (`shapeKind:'boolean'`) using their derived result geometry (enables unbounded nesting)
- NOT mask nodes (`shapeKind:'mask'`) since masks are relationship nodes and do not paint geometry.

If selection is 2+ but yields <2 eligible operands after filtering:
- Do NOT show the boolean dropdown.

### 1.3 Command behavior

On choosing a boolean op (Union/Subtract/Intersect/Exclude):
- Create a new boolean node with:
	- `shapeKind:'boolean'`
	- `operation:<chosen>`
	- `operands:[...filteredSelectedIds]` (ordering; see §1.5)
- The new boolean node becomes the only selected element.
- Operands MUST become hidden in the viewport immediately (see §1.7).

On choosing `Flatten` from the sidebar header dropdown:
- Flatten MUST be treated as an explicit, irreversible baking action.
- Flatten MUST operate on the **current selection** and produce a single baked vector result.

Flatten semantics:
- Filter the current selection to eligible operands (same filtering rules as boolean creation).
- If fewer than 2 eligible operands remain, Flatten MUST do nothing and MUST NOT change selection (this should be prevented by eligibility gating).
- Create a derived boolean result using `operation:'union'` (union is the deterministic default for flattening a multi-selection).
- Convert the derived result into a new baked element (`shapeKind:'vector'`) and place it into the document.
- Remove the original operand elements from the document.
- Select the baked result.

Undo contract:
- Boolean creation is **1 undo step**.
- Flatten from selection is **1 undo step**.

Failure mode:
- If the boolean engine cannot compute a derived path for creation or flattening:
	- Keep operands intact.
	- Keep selection intact (for flatten) or keep the created boolean node present (for creation).
	- Surface a non-blocking warning (no modal).

Implementation mapping (Store actions; used by tests/automation today):
- Union/Subtract/Intersect/Exclude MUST dispatch:
	- `store.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { ids: state.editor.selectedElementIds, operation: <op> })`
- Flatten MUST dispatch a single undo-coalesced action:
	- `store.dispatch('FLATTEN_BOOLEAN_FROM_SELECTION', { ids: state.editor.selectedElementIds })`

### 1.4 Operation semantics (visible geometry)
All operations are computed in a deterministic fold over the operand list.

Terminology:
- Let operands be an ordered list $[A, B, C, ...]$.
- Each operand contributes a filled region (its closed path area) in world space.
	- If an operand is a boolean node, its contribution is its own derived result geometry (recursively resolved).
- The boolean node renders the derived result as its own vector geometry.

Operation semantics:
- **Union**: $(((A \cup B) \cup C) \cup ...)$
- **Subtract**: $(((A \setminus B) \setminus C) \setminus ...)$ (order-dependent)
- **Intersect**: $(((A \cap B) \cap C) \cap ...)$
- **Exclude** (XOR): $(((A \oplus B) \oplus C) \oplus ...)$

Edge cases:
- Degenerate operands (0 width/height or empty paths) contribute nothing.
- If the result is empty (no derived paths), the boolean node renders no fill/stroke geometry (but still exists and is selectable).

### 1.5 Operand ordering (selection order)
Operand ordering is a first-class, testable contract.

Rules:
- The boolean node’s `operands` array MUST preserve the filtered selection ordering.
- No implicit reordering (z-order sorting, ID sorting, etc.) is allowed.

### 1.6 Fill/stroke/effects when operands have different styles
This section is intentionally explicit so validation is unambiguous.

Style rule:
- The boolean node inherits *all paint style* from the **first operand in the filtered operand list**.
	- Concretely: `booleanEl.style` is a deep clone of `firstOperand.style` at creation time.

Paint expectations:
- Fills: render using the boolean node’s `style.fills` list.
- Strokes: render using the boolean node’s `style.strokes` list.
- Opacity and `visible:false` rules are honored per entry.

### 1.7 What remains visible (operand ownership + drill-in requirement)

After boolean creation:
- Creating a boolean does NOT delete or mutate operands.
- A new boolean element is created and becomes the only selected element.
- The boolean element is appended to `elementOrder` (top of stacking in the active container).

Viewport visibility:
- The original operand shapes MUST become invisible in the viewport immediately after the boolean is created.
	- Operands remain preserved in state for deterministic recomputation and editing.
	- Operands MUST not be directly selectable on-canvas while “owned” by the boolean.
- The newly created boolean node is visible by default (governed by its own `hidden` flag) and renders derived vector geometry.

Discoverability/editability (required):
- The UI MUST provide a drill-in/breadcrumb workflow to reveal and edit boolean operands.
- Entering “edit operands” mode MUST make operands visible and selectable.
- Exiting “edit operands” mode MUST restore the default result-first view (operands hidden).

### 1.8 Result-defined bounds + overlays

Result-first UX:
- The boolean object is defined by the resultant shape.
	- The boolean’s visible silhouette, hover outline, selection outline, and selection bounds MUST reflect the derived result.
	- Operands are hidden specifically to prevent double-rendering.

Result-as-base-shape (required; enables scalability + nesting):
- The boolean’s interaction model MUST be derived-result-driven:
	- Bounding box/selection handles MUST enclose the derived result and MUST ignore operand bounds.
	- Hit testing for selecting the boolean MUST behave as if the derived result is the “real shape”.
- This contract MUST remain true even when:
	- A boolean is used as an operand inside another boolean (nested booleans)
	- Operands are hidden
	- Derived geometry extends beyond the boolean’s previous bounds (bounds must update; overlays must always trace the current derived path)

Selection + hover overlays (required):
- Hover (when not selected): highlight the **shape path outline** (not the bounding box).
- Selection: keep the normal selection overlay AND also highlight the **shape path outline**.
- Colors MUST come from design system accent tokens (e.g. `--color-accent`).

### 1.9 Update timing + progressive refinement

Derived geometry recompute triggers:
- Any change that affects operand geometry or transforms MUST eventually update the boolean’s rendered geometry, including operand move/resize/rotate/path edit and boolean operation change.

Timing:
- In steady-state, derived geometry updates on the next render/update pass after the underlying state change.

Progressive refinement:
- During UI interactions (`state.ui.isInteracting === true`), a “heavy” boolean MAY temporarily show its last-known-good derived result instead of recomputing on every frame.
- After interaction ends, the derived result MUST be recomputed and the display updated.

### 1.10 DOM/rendering contract (enables DOM/UI validation)

- Boolean nodes are rendered as `.slide-element[data-shape-kind="boolean"]`.
- They MUST set `data-boolean-status` to `ok|repaired|fallback`.
- Derived geometry is rendered via an `svg.geometry-layer` within the element (vector renderer).
- The SVG MUST be permitted to render overflow (no clipping of derived paths to the element’s box).

### 1.11 Tech architecture: “result-as-base-shape” + nested booleans (no code)

This section defines the required technical architecture to make booleans scalable and composable without special-case UX regressions.

#### 1.11.1 Geometry provider model (single abstraction)
- The system MUST treat multiple element types as **geometry providers**.
- A geometry provider yields:
	- A resolved set of vector paths/polygons representing its filled region in world space (or element-local + a transform)
	- A derived bounds box for the resolved geometry
	- A status (`ok|repaired|fallback`) and diagnostics for UI warnings

Provider rules (required):
- Primitive shapes/vectors: provide geometry from their own data.
- Boolean nodes: provide geometry by resolving operands’ geometry providers and folding the boolean operation over them.
	- This recursion is how nested booleans work.
- Mask nodes do not provide filled geometry (relationship-only) and MUST NOT be treated as boolean operands.

#### 1.11.2 Composition graph (DAG) + cycle safety
- The system MUST treat boolean references as a **dependency graph** (edges: boolean -> operand).
- Evaluation MUST be safe and deterministic:
	- Topologically evaluate dependencies (leaves first).
	- Detect cycles (direct or indirect self-reference). Cycles MUST NOT crash; they MUST produce `fallback`.
	- Missing operands MUST NOT crash; they MUST produce `fallback`.

#### 1.11.3 Derived geometry cache + invalidation
- Derived boolean geometry MUST be cached (in memory) to avoid recomputing on every hover/selection frame.
- Cache keys MUST change when any of these change:
	- boolean operation
	- operand list ordering
	- any operand geometry/transform that affects the final region (including nested boolean changes)
- Cache entries MUST include:
	- derived paths
	- derived bounds
	- status
	- last-known-good snapshot for progressive refinement during interaction

#### 1.11.4 “Result bounds” as the source of truth for interaction
- The selection box and selection handles for a boolean MUST be computed from the derived result bounds.
- The hover/selection outline MUST be computed from derived result paths.
- The system MUST NOT use operand bounds for any of the above.

Recommended (keeps the rest of the engine simple):
- Keep the boolean element’s persisted `x/y/width/height` synchronized to the derived result bounds on recompute.
	- This lets generic selection/transform code work without per-feature hacks.
	- If bounds synchronization is throttled during interaction, overlays must still trace the true derived path so UX remains correct.

#### 1.11.5 Drill-in editing context (double-click) is a first-class editor mode
- The editor MUST support a **composition drill-in context stack** (breadcrumb).
- For booleans:
	- Default mode: result-first (operands hidden, boolean selectable as a base shape)
	- Operand edit mode: operands revealed + selectable, with clear “you are editing operands” context
- Enter operand edit mode:
	- Double-click on the boolean on the canvas, OR
	- Use the Boolean inspector’s drill-in control
- Exit operand edit mode:
	- Click `Done` / breadcrumb exit, OR
	- Press `Escape`

State/behavior requirements:
- Entering operand edit mode MUST reveal operands without destroying the result-first relationship.
- Exiting operand edit mode MUST restore operand visibility to hidden.
- Nested drill-in MUST be supported (double-click into inner boolean while editing outer operands).
- Selection/hover overlays MUST always reflect the currently active edit context:
	- Outside drill-in: overlays for the derived result
	- Inside drill-in: overlays for the operand(s) the user is selecting/editing

---

## 2. Boolean editing

### 2.1 Property Inspector: Boolean section (boolean node selected)
When exactly one selected element is a boolean node (`shapeKind:'boolean'`), the Property Inspector MUST surface the current boolean settings so the user can revisit/edit them.

Visibility:
- The Boolean section is shown only when `selectedElementIds.length === 1` AND the selected element kind is `boolean`.

Operation control:
- The section includes an `Operation` dropdown with options: Union/Subtract/Intersect/Exclude.
- The dropdown MUST be pre-populated to the selected boolean’s current operation (`el.operation`, default `union`).
- The dropdown MUST be addressable via `data-testid="boolean-operation"`.
- Changing the dropdown MUST be non-destructive and update the boolean operation immediately by dispatching:
	- `store.dispatch('SET_BOOLEAN_OPERATION', { id: <booleanId>, operation: <op> })`

Status warning:
- If the boolean cannot be resolved (missing/invalid operands, compute failure), show a non-blocking status row (no modal).
- The warning row MUST be addressable via `data-testid="boolean-status-warning"`.
- In `presentation` mode, the warning row is not shown.

Operand editing:
- The section MUST provide an affordance to drill into operands (enter/exit operand-edit mode).
- The entry control MUST be addressable via `data-testid="boolean-edit-operands"`.

Flatten:
- The section MUST provide a `Flatten` action (danger-styled) that converts the boolean to a baked `shapeKind:'vector'` result and removes operand linkage.
- Undo: 1 step.
- Failure: non-fatal; keep operands + boolean node intact; show non-blocking warning.

### 2.2 Moving a boolean node (translate)
Dragging the boolean node MUST move the *composed result* in the viewport.

Rules:
- Drag MUST translate the boolean node AND all operand elements by the same $(\Delta x, \Delta y)$.
- If an operand listed in `booleanEl.operands` is missing at drag time, it is skipped.
- The boolean element still moves; `data-boolean-status` becomes `fallback` if operands are missing.

### 2.3 Enter/exit operand edit mode (double-click drill-in)

Canvas interaction (required):
- Double-clicking a boolean node MUST enter operand edit mode (drill-in).
	- Operands become visible and selectable.
	- The UI MUST provide a clear breadcrumb/context indicator (e.g., `Boolean > Operands`) so users understand they are “inside” the boolean.

Exit interactions (required):
- Press `Escape`, OR
- Click a `Done`/breadcrumb exit affordance.

Inspector interaction (required):
- The `data-testid="boolean-edit-operands"` affordance MUST enter/exit the same operand edit mode.

Nested drill-in (required):
- While in operand edit mode, double-clicking an operand that is itself a boolean MUST enter the inner boolean’s operand edit mode (stacked breadcrumbs).

---

## 3. Mask flows

### 3.1 Entry points (selection-level)
When selection contains one intended mask shape and 1+ intended content elements:
- Provide a selection-level command **Use as mask** in the same selection-level composition section in the Property Inspector, OR expose it via the right-click canvas context menu.

Default mask-shape choice (when the user does not explicitly choose):
- The mask shape is the topmost element among the selection by current stacking order.

Implementation mapping (Store actions; used by tests/automation today):
- “Use as mask” MUST dispatch:
	- `store.dispatch('CREATE_MASK_FROM_SELECTION', { ids: state.editor.selectedElementIds })`

### 3.2 Creation + visibility
Creation behavior:
- Create `shapeKind:'mask'` node with:
	- `maskShapeId:<chosen mask id>`
	- `contentIds:[...chosen content ids]`
	- default `mode:'clip'`
	- default `invert:false`
- The new mask node becomes selected.

Viewport visibility (no double-rendering):
- The mask node is a relationship node and does not paint its own geometry.
- The mask shape referenced by `maskShapeId` MUST become invisible in the viewport while owned by the mask.
- Content elements in `contentIds` remain visible but clipped.

Discoverability/editability (required):
- The UI MUST provide a drill-in/breadcrumb workflow to reveal and edit the mask shape and masked content.

### 3.3 What masks look like (clip behavior)
- Content elements listed in `maskNode.contentIds` are clipped via a computed CSS `clip-path`.

Determinism:
- If multiple mask nodes affect the same element, their clip regions are intersected.
- Multiple masks are applied in a deterministic order (by mask node id).

Invert:
- If `invert:true`, the effective clip region is (element bounds) minus (mask shape region).
- If invert computation fails, invert falls back deterministically to a no-op (treat as full rect).

DOM validation hook:
- Masked content elements MUST set `data-mask-count` to the number of masks applied.

### 3.4 Property Inspector: Mask section (mask node selected)
When exactly one selected element has `shapeKind:'mask'`, show a **Mask** section with:
- `Invert` toggle
- (Optional) `Mode` dropdown: Clip/Alpha (if alpha masking is implemented)

### 3.5 Update timing (mask visuals)
Mask updates MUST be reactive.

Changes that MUST update the visible clip on the next render/update pass:
- Mask shape geometry/transform changes.
- Content element geometry/transform changes.
- Mask invert toggles.
- Content membership changes (`contentIds` reorder/add/remove).
- Adding/removing mask nodes that affect an element.

---

## 4. Undo (required)

- Each boolean/mask action is undoable.
- Creating a boolean/mask is 1 undo step.
- Changing boolean operation is 1 undo step.
- Flatten from selection is 1 undo step.
- Flatten a selected boolean node is 1 undo step.

---

## 5. Acceptance (end-state)

Boolean operations control (sidebar header)
- With <2 selected elements: boolean control is hidden.
- With 2+ selected, but fewer than 2 eligible operands after filtering: boolean control is hidden.
- With 2+ eligible operands: control is visible, keyboard accessible, and menu items appear in this exact order: Union, Subtract, Intersect, Exclude, separator, Flatten.
- Eligibility includes `shapeKind:'boolean'` so users can create nested booleans (boolean + shape, boolean + boolean, etc.).
- Selecting an operation dispatches `CREATE_BOOLEAN_FROM_SELECTION`.
- Selecting Flatten dispatches `FLATTEN_BOOLEAN_FROM_SELECTION`.

Boolean creation
- Creates a new element with `shapeKind:'boolean'` and chosen `operation`.
- `operands` equals the filtered selection order (no reordering).
- New boolean is added to `elementOrder` (topmost) and becomes the only selection.
- Operands become hidden in the viewport and are not directly selectable on-canvas.
- The boolean silhouette/bounds/overlays reflect the derived result (not operand bounds).

Nested booleans
- A boolean can be used as an operand of another boolean.
- The outer boolean’s silhouette/bounds/overlays are computed from the outer derived result (which depends on the inner derived result).
- Cycle safety: self-references or cycles do not crash; they produce `fallback` + a non-blocking warning.

Boolean editing
- Selecting a boolean shows the Boolean inspector section.
- `data-testid="boolean-operation"` reflects the current operation (defaults to `union`).
- Changing operation dispatches `SET_BOOLEAN_OPERATION` and updates rendered geometry.
- If resolution fails, `data-testid="boolean-status-warning"` appears (not in presentation mode).
- Drill-in editing exists: entering operand-edit mode reveals operands; exiting restores result-first view.
- Double-clicking a boolean enters operand-edit mode.

Boolean performance + DOM signals
- Boolean host DOM element sets `data-boolean-status` (`ok|repaired|fallback`) and updates when:
	- operation changes
	- operands change geometry/transform
	- nested boolean dependencies change
- During heavy interactions, derived geometry may be temporarily stale, but MUST refresh after interaction ends.

Flatten
- Flatten from selection bakes a `shapeKind:'vector'` union, removes operands, selects baked result.
- Flatten selected boolean bakes the boolean’s current result and removes linkage.
- Failure mode is non-fatal and preserves user data.

Mask
- Creating a mask creates a `shapeKind:'mask'` node with `maskShapeId` and `contentIds`.
- Mask node does not paint geometry.
- Mask shape becomes hidden in the viewport while owned by the mask.
- Content in `contentIds` is clipped.
- Masked content elements set `data-mask-count`.
- Invert toggle updates clipping; invert failures fall back deterministically.

Mask drill-in
- The Mask inspector provides an affordance to reveal/edit the mask shape (drill-in) and return to the result-first view.

---

## 6. Phased delivery plan (does not change the target UX)

This section sequences implementation work; it does not relax any requirements above.

Phase 1 (foundation)
- Sidebar header boolean dropdown (Union/Subtract/Intersect/Exclude/Flatten) with eligibility gating.
- Result-first booleans: operands hidden, boolean defined by derived result (bounds + overlays).
- Nested booleans: allow `shapeKind:'boolean'` as operands; cycle-safe evaluation.
- Boolean inspector: operation dropdown + non-blocking warning row.
- Non-fatal failure handling + deterministic `data-boolean-status`.

Phase 2 (editability)
- Drill-in/breadcrumb for booleans: enter/exit operand-edit mode, reveal operands, restore result-first view.
- Drill-in/breadcrumb for masks: edit mask shape vs masked content.

Phase 3 (authoring power)
- Operand management UI: reorder operands, add/remove operands, and clear ownership/release flows where applicable.
- Flatten selected boolean in inspector (if not already shipped).

---

## 7. QA + automation notes (non-normative)

This section is guidance for validation tooling; it does not change the UX/UI requirements above.

Overlay validation
- Canvas overlay drawing can be validated by instrumenting the `#interaction-canvas` 2D context calls.
	- For result-first booleans, hover/selection should trace the derived path outline (not only `strokeRect`).

Derived-bounds validation
- For any boolean node, selection bounds MUST equal the derived result bounds (not operand union bounds).
- Resize/transform handles (where present) must frame the derived result.

Drill-in validation
- Double-click enters operand edit mode; `Escape` exits.
- Nested drill-in produces a deterministic breadcrumb stack.

Cycle safety validation
- If a cycle is introduced (directly or indirectly), the app must not crash.
- The affected boolean(s) should show a non-blocking warning and render `fallback`.

Stable DOM hooks
- Boolean: `.slide-element[data-shape-kind="boolean"]`, `data-boolean-status`, `data-testid="boolean-operation"`, `data-testid="boolean-edit-operands"`.
- Mask: `data-mask-count` on masked content, `data-testid="mask-invert-toggle"`, `data-testid="mask-edit-shape"`.
