# Slide Master Implementation Plan

## Guiding Principles
*   **Small, Safe Steps:** Each phase must be testable in isolation.
*   **No Regressions:** The "Normal Slide Edit" mode must remain fully functional at every step.
*   **Isolation:** Logic for Master mode should be kept separate from Slide mode where possible (e.g., separate render methods or helpers).

## Risks & Mitigations
1.  **Renderer Instability:** The `SlideRenderer` is the heart of the app. Modifying it to support Masters carries the risk of breaking normal slide rendering.
    *   *Mitigation:* We will abstract the data retrieval logic (`getRenderableObject`) before changing the rendering logic.
2.  **State Confusion:** Mixing up `activeSlideId` and `activeMasterId` could lead to editing the wrong object.
    *   *Mitigation:* Explicitly separate these in the Store. Actions like `ADD_ELEMENT` must check the current `mode` to determine the target.
3.  **UI Clutter:** `SlideList.js` could become unmaintainable if we just pile `if/else` logic into it.
    *   *Mitigation:* We will implement a distinct `renderMasterList()` method (or a separate class if needed) to keep the view logic clean.

---

## Phase 1: Data Structure & Core Logic (Completed)
- [x] Update `Store.js` with `masters` state (Theme & Layouts).
- [x] Define `DEFAULT_MASTERS` structure.
- [x] Implement `getEffectiveSlide(slideId)` helper in Store to handle inheritance (Theme -> Layout -> Slide).
- [x] Update `ADD_SLIDE` to use default layout.

## Phase 2: Rendering Engine (Completed)
- [x] Refactor `SlideRenderer.js` to use `getEffectiveSlide`.
- [x] Implement rendering of inherited elements (Theme/Layout elements).
- [x] Implement "Locked" state for inherited elements (visuals only, no interaction).
- [x] Implement Background inheritance (Theme -> Layout -> Slide).
- [x] Support for Solid, Gradient, and Image backgrounds.

---

## Phase 3: Master Mode Foundation (State & Navigation)
**Goal:** Establish the "Master Mode" state without changing any visible UI or rendering logic yet.

1.  **Store Updates**
    *   Add `editor.mode` state ('edit' | 'master').
    *   Add `editor.activeMasterId` state (default to the first theme).
    *   Add actions: `SET_MODE`, `SET_ACTIVE_MASTER`.
    *   *Risk:* None. Pure state addition.

2.  **Toolbar UI**
    *   Add "Edit Master" button to the Toolbar (View menu or standalone).
    *   Add "Close Master View" button (visible only when `mode === 'master'`).
    *   *Verification:* Clicking the button changes the state in the console/logs. The main view will still show the slide for now (until Phase 5), which is expected.

## Phase 4: The Master List UI (Left Panel)
**Goal:** Visualize the Master/Layout hierarchy in the left panel when in Master Mode.

1.  **Refactor `SlideList.js`**
    *   Keep `render()` as the entry point.
    *   Add check: `if (state.editor.mode === 'master') return this.renderMasterList();`
    *   Implement `renderMasterList()`:
        *   Iterate through `state.masters`.
        *   Group Layouts under their parent Theme.
        *   Render a Tree View (Theme -> Layouts).
    *   *Risk:* Breaking the existing slide list.
    *   *Mitigation:* Ensure the "else" path (normal render) is untouched.

2.  **Selection Logic**
    *   Clicking a Master/Layout in the list should dispatch `SET_ACTIVE_MASTER`.
    *   *Verification:* Clicking items in the new list updates `activeMasterId`.

## Phase 5: Rendering Masters (The Engine)
**Goal:** Update the main canvas to render the selected Master or Layout when in Master Mode.

1.  **Data Retrieval Helper**
    *   Create `getRenderableObject(id, mode)` in Store (or Utils).
    *   If mode is 'slide': call `getEffectiveSlide(id)`.
    *   If mode is 'master':
        *   If ID is a **Theme**: Return the theme object directly.
        *   If ID is a **Layout**: We need a new helper `getEffectiveLayout(layoutId)` that merges Theme + Layout (similar to `getEffectiveSlide` but stopping at Layout level).

2.  **Update `SlideRenderer.js`**
    *   In `render()` loop:
        *   Check `state.editor.mode`.
        *   If 'master', use `state.editor.activeMasterId`.
        *   If 'edit', use `state.editor.activeSlideId`.
    *   Pass the ID and Mode to `getRenderableObject`.
    *   *Risk:* The renderer might crash if the Master object is missing properties expected by the renderer (e.g., `transition`, `notes`).
    *   *Mitigation:* Ensure `getEffectiveLayout` returns a standardized object shape matching a Slide.

## Phase 6: Editing Masters (Interaction)
**Goal:** Allow adding/moving/modifying elements on Master slides.

1.  **Selection Manager Update**
    *   Ensure `SelectionManager` respects the current mode.
    *   When in Master mode, it should only allow selecting elements that belong to the *current* Master/Layout.
    *   Inherited elements (from Theme, when editing Layout) should be locked.

2.  **Store Action Updates**
    *   Update `ADD_ELEMENT`, `UPDATE_ELEMENT`, `DELETE_ELEMENT`.
    *   Add logic:
        ```javascript
        const targetId = state.editor.mode === 'master' 
            ? state.editor.activeMasterId 
            : state.editor.activeSlideId;
        const targetCollection = state.editor.mode === 'master' 
            ? state.masters 
            : state.slides;
        ```
    *   *Risk:* Accidental deletion of slide data.
    *   *Mitigation:* Unit test or carefully verify the target ID resolution.

## Phase 7: Layout Application & Refinement
**Goal:** Apply layouts to slides and polish the UX.

1.  **Layout Picker** (Property Inspector)
2.  **Smart Content Remapping** (Preserving text when switching layouts)
3.  **Theme Settings Editor** (Colors/Fonts)
