# Technical Specification: Rendering & Navigation Details

## 1. Coordinate Systems & Matrices
To support infinite canvas-like navigation (Pan & Zoom) while keeping DOM elements aligned, we use a unified coordinate system.

### 1.1 The Transform Matrix
The viewport state is defined by a transformation matrix (or simplified object):
```javascript
const ViewportState = {
  zoom: 1.0,      // Scale factor (0.1 to 5.0)
  panX: 0,        // Horizontal offset in pixels
  panY: 0         // Vertical offset in pixels
};
```

### 1.2 Coordinate Spaces
1.  **Screen Space:** Pixels relative to the browser window (ClientX/Y).
2.  **Viewport Space:** Pixels relative to the `#canvas-container`.
3.  **World Space (Slide Space):** The logical coordinate system where the slide exists. (0,0) is the top-left of the slide.

### 1.3 Transformation Logic
To convert Screen Space to World Space:
```javascript
function screenToWorld(screenX, screenY) {
  const containerRect = container.getBoundingClientRect();
  const viewportX = screenX - containerRect.left;
  const viewportY = screenY - containerRect.top;
  
  return {
    x: (viewportX - panX) / zoom,
    y: (viewportY - panY) / zoom
  };
}
```

## 2. Rendering Implementation

### 2.1 DOM Layer (Content)
The `#slide-content` div acts as the container for all slide elements.
- **Applying Transform:** We apply the Pan/Zoom to this container using CSS Transform.
  ```css
  #slide-content {
    transform-origin: 0 0;
    transform: translate(var(--pan-x), var(--pan-y)) scale(var(--zoom));
  }
  ```
- **Performance:** Using CSS Variables allows us to update the style efficiently without triggering full layout thrashing.

### 2.2 Canvas Layer (Interaction)
The `#interaction-canvas` sits on top and matches the `#canvas-container` size exactly.
- **Drawing:** When drawing gizmos or selection boxes, we must apply the same transform *inside* the Canvas context.
  ```javascript
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);
  // Draw gizmos at World Coordinates
  ctx.strokeRect(element.x, element.y, element.width, element.height);
  ctx.restore();
  ```

## 3. Navigation Controls

### 3.1 Panning
- **Input:** Spacebar + Drag OR Middle Mouse Drag.
- **Logic:**
    1.  `mousedown`: Record `startX`, `startY` and initial `panX`, `panY`.
    2.  `mousemove`: `currentPanX = initialPanX + (currentX - startX)`.
    3.  Update Store -> Triggers CSS update.

### 3.2 Zooming
- **Input:** Ctrl + Scroll OR Pinch Gesture.
- **Logic (Zoom towards pointer):**
    1.  Get mouse position in World Space *before* zoom (`worldX`).
    2.  Update `zoom` level.
    3.  Adjust `panX/Y` so that `worldX` remains at the same screen position.
    ```javascript
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    ```

### 3.3 Fit to Screen
Calculates the optimal Zoom/Pan to center the slide with padding.
```javascript
const padding = 50;
const availableWidth = containerWidth - padding * 2;
const scale = Math.min(availableWidth / slideWidth, availableHeight / slideHeight);
// Center logic...
```

## 4. Scrollbars (Optional)
While "Infinite Canvas" tools often omit scrollbars, we may implement custom "Mini-map" or virtual scrollbars if the user navigates far away.
- **Implementation:** Custom DOM elements that reflect the ratio of Viewport Size to World Bounds.
