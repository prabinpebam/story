# Feature Spec: Canvas & Object Manipulation

## 1. Overview
The Canvas is the primary workspace. It must support precise object manipulation, infinite panning (scratchpad), and smart layout tools.

## 2. Navigation & Viewport
The canvas is an "Infinite" 2D plane. The Slide is a fixed region within it.

### 2.1 Panning
- **Space + Drag:** Holding Spacebar changes cursor to "Hand". Dragging moves the viewport.
- **Middle Mouse Drag:** Pan without keyboard modifier.
- **Trackpad:** Two-finger scroll pans the view.

### 2.2 Zooming
- **Shortcuts:**
    - `Ctrl` + `Scroll Wheel`
    - `Ctrl` + `+` / `Ctrl` + `-`
    - Pinch-to-zoom (Trackpad)
- **Behavior:** Zoom towards the mouse cursor position.
- **Range:** 10% to 500%.
- **Fit to View:** `Shift + 1` centers the slide and scales it to fit the available window with padding.

### 2.3 Coordinate System
- **Viewport Transform:** The `canvas-container` has a CSS transform: `translate(x, y) scale(z)`.
- **Conversion:**
    - `Screen -> Canvas`: `(screenX - panX) / zoom`
    - `Canvas -> Screen`: `(canvasX * zoom) + panX`

## 3. Adding Elements (Intuitive Interaction)
We support multiple ways to add content, prioritizing speed and flow.

### 3.1 Drag to Create (Primary)
1.  **Select Tool:** Click "Rectangle" or "Text" in toolbar (or press `R` / `T`).
2.  **Cursor:** Changes to "Crosshair".
3.  **Action:** Click and Drag on the canvas to define the bounding box.
    - **Text:** Creates a text box of that width.
    - **Shape:** Creates a shape of those dimensions.
    - **Shift:** Constrains to square (Shape).

### 3.2 Drag from Toolbar
1.  **Action:** Click and hold the tool icon in the toolbar.
2.  **Drag:** Drag the "ghost" icon onto the canvas.
3.  **Drop:** Release to place the element at that location with default dimensions.

### 3.3 Double Click / Quick Add
1.  **Action:** Double-click the tool icon.
2.  **Result:** Adds the element to the center of the current viewport with default dimensions.

## 4. Real-Time Rendering & Manipulation
Editing must feel instantaneous (60fps).

### 4.1 Direct Manipulation
- **No Ghosting:** When dragging an object, the object *itself* moves. We do not show a wireframe outline unless performance degrades (which shouldn't happen with DOM/CSS).
- **CSS Transforms:** Movement is applied via `transform: translate3d(...)` to utilize GPU acceleration.
- **Data Sync:**
    - While dragging: Update local component state / DOM.
    - On Drop (Mouse Up): Commit the final coordinates to the Global Store (History/Undo point).

### 4.2 Hybrid Rendering Strategy
- **DOM Layer:** Text, Images, SVGs are standard HTML elements. This ensures crisp text rendering and accessibility.
- **Background Layer:** WebGL/Canvas for complex mesh gradients.
- **Overlay Layer:** SVG/HTML layer for Gizmos, Selection boxes, and Snapping guides. It sits on top of everything.

## 5. Object Manipulation (The Gizmo)
When an object is selected, a **Transform Gizmo** (Bounding Box) appears.

### 5.1 Visuals
- **Border:** 1px solid Electric Blue (`#0055FF`).
- **Handles:** 8 points (Corners + Midpoints). White fill, Blue border.
- **Rotation Handle:** A distinct handle extending from the top-center.

### 5.2 Interactions
- **Move:** Drag anywhere inside the bounding box.
- **Resize:** Drag handles.
    - **Corner:** Free resize. Hold `Shift` to lock aspect ratio.
    - **Edge:** Constrained resize (width or height only).
    - **Alt + Drag:** Resize from center.
- **Rotate:** Drag the rotation handle. Snaps to 15-degree increments if `Shift` is held.

## 6. Snapping & Alignment (Smart Guides)
- **Trigger:** Active during Move and Resize operations.
- **Targets:**
    - **Slide:** Edges + center lines.
    - **Other Objects:** Edges (Left, Right, Top, Bottom) and centers of nearby objects.
    - **Additional target providers** may add targets (e.g. layout margins/columns, vector points) but must follow the deterministic rules below.
- **Visual Feedback:**
    - **Magenta Lines:** Appear when edges align.
    - **Distance Markers:** Show pixel gap when spacing is equal between 3+ objects.
- **Threshold:** Snapping occurs within 5px distance.

### 6.1 Anti-jitter (required)
- Snapping MUST use sticky capture + hysteresis:
  - Once snapped to a target, remain snapped until the cursor/handle exits a slightly larger release threshold.
  - This prevents flicker when multiple nearby candidates exist.

### 6.2 Deterministic tie-break (required)
If multiple snap candidates are within threshold, the chosen snap must be deterministic:
1) Prefer the candidate with smallest absolute distance.
2) Tie-break by category priority:
   - Object targets > layout columns > layout margins > slide guides.
3) Tie-break by axis priority: X before Y.
4) Tie-break by a stable identifier (`targetKey`).

### 6.3 Stable target keys (required)
Each snap candidate MUST provide a stable `targetKey` string so results do not depend on iteration order.

Canonical format (string):
- `category:type:id:axis`

Examples:
- `object:center:elem-123:x`
- `object:edge:elem-123:left:x`
- `layout:column:slide-001:col-2:left:x`
- `layout:margin:slide-001:left:x`
- `slide:center:slide-001:x`

## 7. Multi-Selection
- **Shift + Click:** Add/Remove object from selection.
- **Marquee Select:** Drag on empty canvas area to create a selection box. Objects intersecting the box are selected.
- **Group Manipulation:** A multi-selection acts as a temporary group. The Gizmo wraps all selected objects.

### 7.1 Multi-Selection Resizing
- **Behavior:** Resizing a multi-selection scales all selected objects relative to the selection's bounding box.
- **Logic:**
    1.  Calculate the bounding box of the entire selection.
    2.  Determine the scale factor based on the handle movement (e.g., `newWidth / oldWidth`).
    3.  Apply the scale factor to each object's size (`width`, `height`).
    4.  Apply the scale factor to each object's position relative to the selection's origin.
        - `newX = selectionNewX + (objectX - selectionOldX) * scaleX`
        - `newY = selectionNewY + (objectY - selectionOldY) * scaleY`

## 8. Grouping
- **Structure:** Groups are container elements that hold child elements.
- **Coordinates:** Child elements are positioned relative to the group's top-left corner.
- **Bounding Box:** The group's bounding box is the union of all its children's bounding boxes.
- **Dynamic Updates:**
    - When a child is moved, resized, or modified, the group's bounding box must recalculate.
    - If the group's top-left corner changes due to child modification, the group's `x,y` updates, and all children's relative coordinates are shifted to maintain their absolute position.
- **Interaction:**
    - **Selection:** Clicking any child selects the Group.
    - **Deep Select:** `Ctrl/Cmd + Click` selects the specific child.
    - **Double Click:** Enters the group (Deep Selects the child under cursor).
    - **Resize:** Resizing a group scales all children (similar to Multi-Selection Resizing).
