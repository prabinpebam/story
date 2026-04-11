# Shapes Toolbar, Tools & Creation UX

**Status**: Implemented (v1)
**Owner**: Engineering
**Last Updated**: December 17, 2025

Evidence:
- Playwright: `tests/e2e/specs/functional/m6-creation-ux.spec.ts`

Defines the **UI surface** for creating Shapes in the existing Story app UI, including:
- Toolbar affordances (Figma-like shape tool menu)
- Tool shortcuts for shape creation
- Creation behaviors (drag, modifiers)
- Minimal inspector controls for parametric shapes (polygon/star)

This spec is intentionally constrained to the existing UI architecture:
- Floating toolbar (`#floating-toolbar`) at bottom-center
- Property inspector sections (existing `PropertyInspector` + section components)

Related:
- Toolbar baseline: `documentation/specs/ui-system/toolbar/toolbar-redesign.md`
- Global shortcuts baseline: `documentation/specs/core/keyboard-shortcuts.md`
- Shapes keyboard modifiers: [33-keyboard-and-gestures.md](./33-keyboard-and-gestures.md)
- Boolean + mask UX: [30-boolean-mask-ux.md](./30-boolean-mask-ux.md)
- Parametric shape schema: [02-data-model-and-serialization.md](./02-data-model-and-serialization.md)

---

## 1. Goals
- Make it possible to **create and test**: Rectangle, Ellipse, Line, Arrow, Polygon, Star via UI.
- Make tool selection **discoverable and consistent** with Figma muscle memory.
- Keep a single, compact toolbar slot for “Shape” while allowing a shape-type menu.

## 2. Non-goals (v1)
- No new panels, dialogs, or command palette.
- No advanced shape libraries or presets.
- No new styling UI beyond existing Fill/Stroke/Effects sections.

---

## 3. Toolbar: tool slots and shape menu

### 3.1 Toolbar placement
- Use the existing floating toolbar pattern (bottom-center).
- The toolbar contains tool buttons; one of them is the **Shape tool slot**.

### 3.2 Shape tool slot
The Shape tool occupies **one** toolbar button, but supports multiple shape kinds.

**Implementation constraint (current app)**
- The store already supports `SET_ACTIVE_TOOL` payloads that are either:
  - a string tool name (e.g. `'shape'`), or
  - an object `{ tool: string, ...options }` stored as `state.editor.activeToolOptions`.
- For v1 of this UX, the Shape menu MUST be represented as:
  - `activeTool: 'shape'`
  - `activeToolOptions.shapeKind: 'rectangle' | 'ellipse' | 'line' | 'polygon' | 'star'`
- This avoids introducing new tool IDs and matches the existing editor handler behavior.

**Interaction**
- Click the Shape tool button:
  - Activates the last-used shape kind (initial default: Rectangle) by setting `activeTool='shape'`.
- Click the Shape tool **caret** (or long-press on the button):
  - Opens a dropdown menu listing available shape kinds.
- Choosing an item from the menu:
  - Sets `activeTool='shape'` with `activeToolOptions.shapeKind=<chosen>`.
  - Updates the toolbar button icon/tooltip to match the selected shape kind.

**Menu items (v1)**
- Rectangle
- Ellipse
- Line
- Arrow
- Polygon
- Star

**Note on Arrow**
- The canonical shapes schema does not include `shapeKind:'arrow'`.
- Arrow MUST be represented as a Line shape with arrowhead styling (stroke end cap) for v1.

**Discoverability**
- Each menu item shows its shortcut (where defined).
- The toolbar button tooltip reflects the current shape kind (e.g. "Polygon (Shift+P)").

---

## 4. Keyboard shortcuts (tools)

**Implementation constraint (current app)**
- Tool shortcuts are currently handled globally in the floating toolbar controller (`src/ui/Toolbar.js`) via a `document.addEventListener('keydown', ...)` listener.
- For v1, add/extend shortcuts there (do not introduce a second competing shortcut registry).

### 4.1 Required (Figma-aligned)
These are the primary “shape creation” shortcuts.

| Shape tool | Shortcut | Notes |
|---|---:|---|
| Rectangle | `R` | Enters rectangle creation |
| Ellipse | `O` | Enters ellipse creation |
| Line | `L` | Enters line creation |
| Arrow | `Shift+L` | Mirrors Figma arrow shortcut |

### 4.2 Additional (Story-specific, to enable testing)
Polygon and Star do not have universal single-key shortcuts across design tools.
To make them quickly testable, Story defines:

| Shape tool | Shortcut | Notes |
|---|---:|---|
| Polygon | `Shift+P` | Avoids conflict with `P` (pen) if added later |
| Star | `Shift+S` | Avoids conflict with `S` (commonly reserved for save in other apps) |

Constraint: these shortcuts must not fire while typing in inputs/textarea/contentEditable.

---

## 5. Shape creation behaviors

### 5.1 General creation
- Creation is **press-drag-release** on the canvas.
- On mouse-down: capture starting point.
- On drag: show live preview.
- On release:
  - If width/height are below a small threshold (e.g. < 5px), creation cancels (no element created).
  - Otherwise, create the shape element and select it.

**Implementation constraint (current app)**
- The canvas creation path currently creates a legacy rectangle element when `activeTool==='shape'`.
- To support multiple shape kinds without new tool IDs, the creation logic MUST branch on `state.editor.activeToolOptions?.shapeKind`.
- Until legacy element types are fully migrated, it is acceptable for creation to output either:
  - legacy element types (e.g. `type:'rect'`) when that is what the renderer/inspector already supports, OR
  - canonical `type:'shape'` elements when the rendering path supports them.
- The inspector title/type label SHOULD use `shapeKind` when `type:'shape'` to avoid showing a generic “Object”.

Known issue to avoid (current behavior mismatch):
- Current creation code uses a minimum size check that requires BOTH `width > 5` AND `height > 5`.
  - This will block horizontal/vertical Line and Arrow creation.
  - When implementing Line/Arrow creation, the minimum threshold MUST be based on segment length (e.g. $\sqrt{w^2+h^2} > 5$), not both dimensions.

Known issue to avoid (global state leakage):
- Current creation code toggles a global “constrain proportions” editor setting on mouse-up.
  - Creation-time Shift constraints MUST be handled per-gesture and MUST NOT mutate global constrain settings.
  - Otherwise a single constrained creation can unexpectedly change later resize behavior.

Selection behavior (matches current tool model):
- Switching to a non-select tool clears the current selection.
- Implementations MUST not rely on selection remaining present after switching into a creation tool.

Mode gating:
- Shape creation shortcuts and creation gestures MUST not mutate document state in `presentation` mode.

### 5.2 Modifiers (during drag)
- `Shift`: constrain
  - Rectangle → Square
  - Ellipse → Circle
  - Line/Arrow → constrain angle to 0/45/90° increments
  - Polygon/Star → constrain rotation to 15° increments (simple + predictable)
- `Alt` (Option): create from center
  - The start point becomes the shape center; width/height expand symmetrically.

Note: no other modifiers are added in v1.

### 5.3 Shape-specific creation

#### Rectangle
- Creates `shapeKind: 'rectangle'`.
- Border radius defaults to 0.

Implementation note:
- In current code, Rectangle creation may be represented as `type:'rect'` (legacy) during transition.

#### Ellipse
- Creates `shapeKind: 'ellipse'`.

#### Line
- Creates `shapeKind: 'line'`.
- Element bounds are the rectangle that encloses the two endpoints.
- Endpoints are stored in element-local space:
  - `params.p1 = {x: 0, y: 0}` and `params.p2 = {x: width, y: height}` (before rotation)

#### Arrow
- Creates `shapeKind: 'line'` with an arrowhead stroke style, or a dedicated `params.endCap = 'arrow'`.
- v1 contract: Arrow must render as a line with arrowhead and export as a path/line in SVG.

#### Polygon
- Creates `shapeKind: 'polygon'`.
- Default `params.sides = 6`.
- Default rotation = 0.

#### Star
- Creates `shapeKind: 'star'`.
- Default `params.points = 5`.
- Default `params.innerRadiusRatio = 0.5`.
- Default rotation = 0.

---

## 6. Property inspector controls (parametric)

### 6.1 When controls appear
- Parametric controls appear when exactly one shape is selected and it is:
  - Polygon or Star (v1 required)
  - Rectangle corner radius remains in existing controls (already present)

### 6.2 Polygon controls (v1)
- Section title: **Shape**
- Controls:
  - `Sides` (integer stepper): min 3, max 20
  - `Rotation` (numeric): degrees

### 6.3 Star controls (v1)
- Section title: **Shape**
- Controls:
  - `Points` (integer stepper): min 3, max 20
  - `Inner radius` (slider or numeric): maps to `innerRadiusRatio` in (0, 1)
  - `Rotation` (numeric): degrees

Constraints:
- Changes apply live.
- Each drag/continuous edit is a single undo step.

---

## 7. Manual test checklist (UI)
- Toolbar shape dropdown lists Rectangle/Ellipse/Line/Arrow/Polygon/Star.
- `R`, `O`, `L`, `Shift+L` switch creation tool and update tooltip.
- `Shift+P`, `Shift+S` switch to Polygon/Star.
- Drag-create each shape; ensure selection + inspector updates.
- Shift/Alt modifiers behave as defined.
- Polygon/Star inspector controls change geometry deterministically.

