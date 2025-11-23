# Rendering Overhaul Implementation Plan

## Phase 1: Foundation - The Element System
**Goal**: Encapsulate DOM manipulation logic into reusable, testable classes with strict lifecycles.

- [ ] **1.1 Create Base `VisualElement` Class**
    - Define `mount(container)`, `update(data)`, `unmount()`.
    - Handle basic positioning (x, y, width, height, rotation).
- [ ] **1.2 Implement `ShapeElement`**
    - Port logic from `SlideRenderer.updateElementDOM` (Rect case).
    - **Crucial**: Implement robust SVG Stroke management. The `update` method should clear and rebuild strokes if the structure changes, preventing duplicates.
    - Port `MeshGradient` and `CodeRunner` logic, ensuring `unmount` calls `.stop()`.
- [ ] **1.3 Implement `TextElement` & `ImageElement`**
    - Port Text and Image logic.
- [ ] **1.4 Create `ElementFactory`**
    - Simple factory to instantiate the correct class based on `element.type`.

## Phase 2: The Stage & BaseRenderer
**Goal**: Separate concerns between Editing and Presenting.

- [ ] **2.1 Create `BaseRenderer`**
    - Manage the container structure (`bg`, `content`, `overlay`).
    - Manage a map of `activeSlideViews` (ID -> SlideView).
    - Implement `renderSlide(slideData)`:
        - Diff `slideData.elements` against `activeElements`.
        - Call `factory.create` + `mount` for new.
        - Call `update` for existing.
        - Call `unmount` for removed.
- [ ] **2.2 Create `SlideView` Class**
    - Manages a group of `VisualElement`s for a single slide.
    - Handles mounting/unmounting of the entire group.
- [ ] **2.3 Create `EditorRenderer`**
    - Extends `BaseRenderer`.
    - Adds `renderOverlay()` (selection handles, hover effects).
    - *Note*: Currently `CanvasManager` handles some of this. We might keep it there for now, or move it here. Let's keep `CanvasManager` for input/overlay for now, and `EditorRenderer` just for content.
- [ ] **2.4 Create `PresentationRenderer`**
    - Extends `BaseRenderer`.
    - Adds `transition(fromSlide, toSlide)` logic.
    - Adds `playBuild(index)` logic.
    - **Crucial**: Implement "Dual Slide" rendering (keeping both old and new slides mounted during transition).

## Phase 3: Integration & Switchover
**Goal**: Replace the monolithic `SlideRenderer` in `main.js`.

- [ ] **3.1 Update `main.js`**
    - Import new Renderers.
    - In `render(mode)`:
        - If `edit` or `master`: `this.renderer = new EditorRenderer(...)`.
        - If `presentation`: `this.renderer = new PresentationRenderer(...)`.
- [ ] **3.2 Verify Mode Switching**
    - Ensure `renderer.destroy()` is called before swapping.
    - Verify no DOM elements leak.

## Phase 4: Cleanup & Optimization
**Goal**: Remove legacy code and optimize.

- [ ] **4.1 Delete `src/core/SlideRenderer.js`**
    - Once fully replaced.
- [ ] **4.2 Optimize `ShapeElement`**
    - Optimize SVG updates (don't rebuild if only color changed).

## Dependencies
*   `src/core/effects/` (CodeRunner, MeshGradient) - Need to ensure they are compatible with the new lifecycle.
*   `src/core/AnimationManager.js` - Will be used by `PresentationRenderer`.

## Risks
*   **Z-Index Context**: Moving to separate components might mess up stacking contexts if not careful. We must ensure all `VisualElement` roots are siblings in the same container.
*   **Event Listeners**: Ensure `unmount` removes all listeners to prevent memory leaks.
