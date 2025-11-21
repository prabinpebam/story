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

## Phase 3: Master Mode Foundation (State & Navigation) (Completed)
- [x] Add `editor.mode` state ('edit' | 'master').
- [x] Add `editor.activeMasterId` state.
- [x] Add actions: `SET_MODE`, `SET_ACTIVE_MASTER`.
- [x] Add "Edit Master" and "Close Master View" buttons.

## Phase 4: The Master List UI (Left Panel) (Completed)
- [x] Refactor `SlideList.js` to support `renderMasterList()`.
- [x] Implement Tree View for Masters/Layouts.
- [x] Implement selection logic for Masters/Layouts.

## Phase 5: Rendering Masters (The Engine) (Completed)
- [x] Implement `getRenderableObject` logic (handled via `handleSlideChange` in Renderer).
- [x] Update `SlideRenderer.js` to support Master Mode rendering.
- [x] Ensure Layouts inherit correctly from Themes during rendering.

## Phase 6: Editing Masters (Interaction) (Completed)
- [x] **Unified Interaction Logic**: Implemented `getActiveContainer(state)` abstraction to unify interaction across modes.
- [x] **Store Updates**: `ADD_ELEMENT`, `UPDATE_ELEMENT`, `REMOVE_ELEMENT`, etc., now use `getActiveContainer` to target the correct collection.
- [x] **Canvas Manager**: Hit testing, gizmos, and manipulation now respect the active container.
- [x] **Visual Feedback**: Added orange border overlay for Master Mode.
- [x] **Layer Tree**: Updated to show Master/Layout hierarchy.

## Phase 7: Advanced Features (Completed)
- [x] **Snapping to Inherited Elements**: Allow Layout elements to snap to Master Theme elements.
- [x] **Clipboard Operations**: Verify Copy/Paste works across modes.
- [x] **Placeholder Logic**: Implement specific behaviors for placeholders.
        ```
    *   *Risk:* Accidental deletion of slide data.
    *   *Mitigation:* Unit test or carefully verify the target ID resolution.

## Phase 8: Layout Application & Refinement (In Progress)
**Goal:** Apply layouts to slides and polish the UX.

- [x] **Layout Picker**: Add dropdown in Property Inspector to switch layouts.
- [x] **Smart Content Remapping**: Preserve content when switching layouts by matching placeholder IDs.
- [ ] **Theme Settings Editor**: Add controls for Theme Colors and Fonts.
