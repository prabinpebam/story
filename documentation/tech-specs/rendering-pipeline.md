# Technical Specification: Rendering Pipeline

## 1. Hybrid Rendering Strategy
To achieve the "Teenage Engineering" aesthetic with crisp typography and high performance, we use a hybrid approach:
- **DOM (HTML/CSS):** Used for rendering the actual slide content (Text, Shapes, Images). This ensures perfect text rendering, accessibility, and easy styling.
- **Canvas (2D Context):** Used for the "Editor Overlay" (Selection box, transform handles, grid, snapping guides) and potentially for complex background animations.

## 2. The Viewport Structure
The main editor area (`#canvas-container`) contains stacked layers:

```html
<div id="viewport">
  <!-- 1. Background Layer -->
  <div id="slide-background"></div>

  <!-- 2. Content Layer (The Slide) -->
  <!-- Scaled using CSS transform: scale() -->
  <div id="slide-content">
    <div class="element text-element" style="...">Hello</div>
    <div class="element shape-element" style="..."></div>
  </div>

  <!-- 3. Interaction Layer (Canvas) -->
  <!-- Matches viewport size, sits on top -->
  <canvas id="interaction-canvas"></canvas>
</div>
```

## 3. Coordinate Systems
We must handle conversion between two coordinate systems:
1.  **Screen Coordinates (ClientX/Y):** The raw mouse position in the browser window.
2.  **Slide Coordinates (LocalX/Y):** The position relative to the slide's top-left corner, accounting for Zoom and Pan.

### Conversion Logic
```javascript
function screenToSlide(screenX, screenY) {
  const rect = slideContent.getBoundingClientRect();
  return {
    x: (screenX - rect.left) / currentZoom,
    y: (screenY - rect.top) / currentZoom
  };
}
```

## 4. Render Loop
The `CanvasManager` runs a `requestAnimationFrame` loop, but it is optimized to only redraw when necessary (dirty checking).

- **DOM Updates:** Triggered reactively via Store subscriptions. When `element.x` changes, the corresponding DOM node's `style.transform` is updated.
- **Canvas Updates:** The `interaction-canvas` is cleared and redrawn every frame IF there is an active interaction (dragging, resizing) or selection change.

## 5. Performance Optimizations
- **CSS Transforms:** Use `transform: translate3d()` for moving elements to utilize GPU acceleration.
- **Will-Change:** Applied to active elements during drag operations.
- **Event Throttling:** Mouse move events are not throttled for drawing (to ensure smoothness) but state updates might be debounced if they trigger heavy logic.
