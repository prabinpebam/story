# Technical Specification: Interaction & Editing Model

## 1. Architecture Overview
Interaction is handled by the `CanvasManager`, which delegates specific behaviors to a **Tool System**. The state of interaction is managed via the global `Store`.

### 1.1 State Machine
The editor operates as a finite state machine:
- **IDLE:** No active interaction.
- **HOVER:** Mouse is over an element (optional highlight).
- **DRAGGING:** Moving an element or panning.
- **RESIZING:** Dragging a gizmo handle.
- **ROTATING:** Dragging the rotation handle.
- **EDITING:** Active text editing (contenteditable) or specific modal interaction.
- **CREATING:** Dragging to create a new element.

## 2. Selection System (`SelectionManager.js`)

### 2.1 Hit Testing
When the user clicks on the canvas:
1.  **Coordinate Conversion:** Convert `ClientX/Y` to `WorldX/Y`.
2.  **Raycasting:** Iterate through the current slide's elements (in reverse Z-index order, top to bottom).
3.  **Bounding Box Check:** Check if the point lies within the element's rotated bounding box.
    - *Math:* Transform the point into the element's local coordinate space (inverse rotation/translation) and check against `0,0` to `width,height`.
4.  **Result:** Return the first match (topmost element).

### 2.2 Selection Logic
- **Click (No Modifier):**
    - If target is unselected: Deselect all, Select target.
    - If target is selected: Do nothing (wait for drag).
    - If no target: Deselect all.
- **Shift + Click:**
    - If target is unselected: Add to selection.
    - If target is selected: Remove from selection.
- **Double Click:**
    - Trigger `ENTER_EDIT_MODE` for the target.

### 2.3 Multi-Selection
- **Data Structure:** `store.state.editor.selectedElementIds` is an array of strings.
- **Visuals:** A single bounding box is calculated that encompasses all selected elements (AABB - Axis Aligned Bounding Box).

## 3. Editing & Transformation (`TransformManager.js`)

### 3.1 The Gizmo
The Gizmo is a visual overlay rendered on the `interaction-canvas`.
- **Handles:** 8 resize handles (nw, n, ne, e, se, s, sw, w) + 1 rotation handle.
- **Rendering:** Drawn in `World Space` but with constant screen-size handles (divide handle size by `zoom` to keep them visually consistent).

### 3.2 Transformation Math
When a handle is dragged:
1.  **Capture Start:** Record `startX`, `startY`, `startWidth`, `startHeight`, `startRotation`, `startCenter`.
2.  **Calculate Delta:** `dx = currentX - startX`, `dy = currentY - startY`.
3.  **Apply Rotation:** Rotate the delta vector by `-elementRotation` to align with the element's local axes.
4.  **Update Properties:**
    - **East Handle:** `width = startWidth + localDx`.
    - **South Handle:** `height = startHeight + localDy`.
    - **Corner Handles:** Update both, potentially preserving aspect ratio if `Shift` is held.
    - **Rotation:** `angle = atan2(mouseY - center.y, mouseX - center.x)`.

### 3.3 Direct Editing (Text)
1.  **Trigger:** Double-click on a Text Element.
2.  **Action:**
    - Hide the Canvas rendering of the text.
    - Create/Position a DOM `div` with `contenteditable=true` exactly over the text element.
    - Match styles (font, size, color, transform).
    - Focus the element.
3.  **Commit:**
    - On `blur` or `Ctrl+Enter`.
    - Parse innerHTML.
    - Update Store (`UPDATE_ELEMENT`).
    - Remove DOM overlay.
    - Show Canvas rendering.

## 4. Property Inspector Integration
The Property Inspector allows indirect editing.

### 4.1 Unidirectional Data Flow
1.  **User Action:** User changes a value (e.g., Font Size) in the Inspector.
2.  **Dispatch:** `store.dispatch('UPDATE_ELEMENT', { id: '...', style: { fontSize: 24 } })`.
3.  **State Update:** Store updates the element model.
4.  **Event:** Store emits `state-changed`.
5.  **Render:**
    - `SlideRenderer` updates the DOM.
    - `CanvasManager` updates the Gizmo (if size changed).
    - `PropertyInspector` re-renders (to ensure sync).

### 4.2 Batch Updates (Multi-Select)
If multiple elements are selected:
1.  **Display:** Inspector shows "Mixed" or the value if all share the same value.
2.  **Update:** Dispatch `UPDATE_ELEMENTS` (plural) with the list of IDs and the property delta.

## 5. Keyboard Interaction
- **Arrow Keys:** Move selection by `1px` (or `10px` with Shift).
- **Delete/Backspace:** Dispatch `DELETE_ELEMENTS`.
- **Escape:**
    - If Dragging: Cancel drag (revert to start state).
    - If Editing Text: Commit changes and exit edit mode.
    - If Selected: Deselect all.
