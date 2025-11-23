# Rendering Architecture Overhaul

## 1. Problem Statement
The current rendering system suffers from artifacts (e.g., duplicate borders, ghost elements) when switching between Edit, Master, and Presentation modes. This is primarily due to:
1.  **State Leakage**: The `SlideRenderer` attempts to reuse or transition DOM elements between modes without a clean separation of concerns.
2.  **Manual DOM Patching**: The `updateElementDOM` method manually appends/removes SVG layers (`_strokeLayers`, `_shadowEl`) which is error-prone and leads to accumulation of debris if not perfectly managed.
3.  **Mixed Responsibilities**: The `SlideRenderer` handles both "Static Rendering" (drawing the slide) and "Transition Logic" (animating between slides), leading to complex state management.

## 2. Core Philosophy: "Clean Slate" Rendering
To ensure robustness, we will adopt a **Clean Slate** philosophy for mode transitions.
*   **Strict Isolation**: Each mode (Edit, Master, Presentation) is a distinct "World". Switching worlds destroys the previous world entirely.
*   **Component-Based Elements**: Each element (Text, Rect, Image) is treated as a self-contained component with a strict lifecycle (`mount`, `update`, `unmount`).
*   **Layered Architecture**: The rendering pipeline is split into distinct layers (Background, Content, Overlay) to prevent z-index fighting.

## 3. Architecture Specification

### 3.1 The Renderer Hierarchy
Instead of a single monolithic `SlideRenderer`, we will have:
*   **`BaseRenderer`**: Abstract class handling the "Stage".
    *   Manages physical DOM layers: `backgroundLayer`, `contentLayer`, `overlayLayer`.
    *   Manages `SlideView` instances (containers for a specific slide's elements).
*   **`EditorRenderer`**: Extends `BaseRenderer`.
    *   Renders a single active `SlideView`.
    *   Adds editing tools to the `overlayLayer` (selection box, handles).
    *   Optimized for high-frequency updates (dragging).
*   **`PresentationRenderer`**: Extends `BaseRenderer`.
    *   Can manage **multiple** `SlideView` instances simultaneously (e.g., `outgoingSlide` and `incomingSlide` during a transition).
    *   Handles the animation loop for transitions.

### 3.2 The Element Lifecycle
We will move away from ad-hoc `div` manipulation to a structured Class-based element system.
*   **`VisualElement` (Base Class)**
    *   **Principle: Pure Rendering**: Elements are "dumb". They only know how to render the data provided. They **never** contain mode-specific logic (e.g., "if editing, show handles"). Handles and overlays are the responsibility of the `EditorRenderer`.
    *   `constructor(data)`: Stores state.
    *   `mount(layerContainer)`: Creates DOM, attaches listeners. Returns root node.
    *   `update(newData)`: **Smart Diffing**. Checks `newData` against `this.lastData`.
        *   If `geometry` changes -> update `style.transform`.
        *   If `appearance` (fill/stroke) changes -> update internal SVG/Canvas.
    *   `unmount()`: Removes DOM, cleans up listeners/timers.
*   **`ShapeElement`**:
    *   Maintains a `div` (root) and an internal `svg` (strokes).
    *   `update()` checks: "Did strokes change?" -> If yes, rebuild SVG. "Did position change?" -> If yes, just update CSS.

### 3.3 Rendering Pipeline & The "Stage"
1.  **Stage Initialization**: `BaseRenderer` creates the container structure:
    ```html
    <div class="renderer-stage">
        <div class="layer-background"></div>
        <div class="layer-content"></div>
        <div class="layer-overlay"></div>
    </div>
    ```
2.  **Slide Mounting**: To render a slide, we create a `SlideView` object.
    *   The `SlideView` instantiates `VisualElement`s for that slide.
    *   It mounts them into the correct layers of the Stage.
3.  **Mode Switching (The Fix)**:
    *   `main.js` calls `currentRenderer.destroy()`.
    *   `BaseRenderer` calls `unmount()` on all active `SlideViews`.
    *   The Stage is wiped.
    *   New Renderer starts fresh.

### 3.4 Handling Complex Objects (The "Border" Fix)
Complex styles (SVG Strokes, Shadows) will be encapsulated within the `VisualElement`.
*   **Encapsulation**: The `ShapeElement` will maintain its own SVG root for strokes.
*   **Reconciliation**: The `update()` method will strictly check if strokes have changed.
*   **Z-Index**: Strokes are always rendered in a dedicated container *on top* of the fill container within the Element's root.

## 4. Implementation Plan

### Phase 1: Element System (Refactor `SlideRenderer`)
*   Create `src/core/renderer/elements/VisualElement.js`.
*   Create `src/core/renderer/elements/ShapeElement.js` (Move stroke/shadow logic here).
*   **Optimization**: Implement `diff` logic in `update()` to avoid unnecessary DOM writes.

### Phase 2: The Stage & BaseRenderer
*   Create `src/core/renderer/BaseRenderer.js`.
*   Implement the Layer system (`bg`, `content`, `overlay`).
*   Implement `SlideView` class to manage a group of elements.

### Phase 3: Renderer Split
*   Split `SlideRenderer` into `EditorRenderer` and `PresentationRenderer`.
*   Update `main.js` to instantiate the correct renderer based on mode.

### Phase 4: Transition Isolation
*   Move `AnimationManager` logic *inside* `PresentationRenderer`.
*   Implement "Dual Slide" rendering in `PresentationRenderer` for transitions.

### Phase 5: Verification
*   Test switching Edit -> Presentation -> Edit.
*   Verify complex borders do not duplicate.
*   Verify Master mode renders correctly.

## 5. Risk Assessment
*   **Performance**: Creating class instances for every element might be slightly heavier than raw DOM calls, but negligible for <1000 elements.
*   **Regression**: Existing features (CodeRunner, MeshGradient) need to be carefully ported to the `unmount` lifecycle to prevent memory leaks.

