# Master Mode Unification Plan

## Phase 1: Analysis & Cleanup (Completed)
- [x] **Audit `CanvasManager.js`**: Identify all remaining hardcoded references to `state.slides` or `activeSlideId`.
- [x] **Audit `Store.js`**: Ensure all element-related actions (`ADD`, `REMOVE`, `UPDATE`, `DUPLICATE`, `REORDER`, `GROUP`, `LOCK`, `VISIBILITY`) correctly switch targets based on mode.
- [x] **Remove Dead Code**: Delete `src/core/SelectionManager.js` if confirmed unused.

## Phase 2: Core Abstraction Implementation (Completed)
- [x] **Refactor `CanvasManager.js`**:
    - Ensure `getActiveContainer` is used in:
        - `renderGizmos` (Selection box drawing)
        - `hitTest` (Click detection)
        - `handleMouseDown` (Drag initiation)
        - `handleMouseMove` (Snapping, Guides)
        - `handleKeyDown` (Nudging, Deletion)
        - `updateViewportTransform` (Canvas sizing)
    - Update `snapToGuides` and `checkSpacingGuides` to respect the active container.
- [x] **Refactor `Store.js`**: Added `getActiveContainer()` helper to `Store` class and updated all actions to use it.
- [x] **Refactor `PropertyInspector.js`**: Added `getActiveContainer()` helper and updated all property update methods.
- [x] **Fix Layout Misalignment**: Changed Master Mode border to a pseudo-element overlay (`#app::after`) to ensure visibility over child elements without causing layout shifts.

## Phase 3: Advanced Interaction Support
- [ ] **Snapping to Inherited Elements**:
    - Modify `CanvasManager` to optionally include inherited elements (from Master) as "passive" snapping targets when editing a Layout.
- [ ] **Clipboard Operations**:
    - Update `COPY`/`PASTE` logic.
    - If copying from Master, can we paste to Slide? (Yes, should just copy data).
    - If copying from Slide, can we paste to Master? (Yes).
    - Ensure `PASTE_ELEMENTS` action handles the target container dynamically.

## Phase 4: UI & Feedback (Partially Completed)
- [x] **Layer Tree**:
    - Update `LayerTree.js` to render the element hierarchy of the Active Master/Layout when in Master Mode.
    - Ensure drag-and-drop reordering in the Layer Tree works for Masters.
- [ ] **Context Menus**:
    - Ensure right-click menus (if any) populate with relevant actions for the current mode.

## Phase 5: Validation
- [ ] **Test Case 1**: Create a Master Theme. Add a background shape.
- [ ] **Test Case 2**: Create a Layout. Add a placeholder. Verify snapping to the Master's background shape (if implemented).
- [ ] **Test Case 3**: Switch to Edit Mode. Apply the Layout. Verify elements appear.
- [ ] **Test Case 4**: Select an element in Master Mode. Resize it. Verify gizmos appear and work.
- [ ] **Test Case 5**: Verify "Undo" works correctly in Master Mode (if Undo is implemented).

## Phase 6: Future Polish
- [ ] **Placeholder Logic**: Implement specific behaviors for "Placeholder" elements (text boxes that can be filled in Edit Mode).
