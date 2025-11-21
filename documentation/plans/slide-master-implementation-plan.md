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

## Phase 8: Theme Settings & Global Styles (Completed)
**Goal:** Implement the "Theme" concept fully, allowing global changes to colors and fonts that cascade to all slides.

### 8.1: Core Infrastructure (Store & Renderer) (Completed)
- [x] **Store Action:** Implement `UPDATE_THEME_SETTINGS` in `Store.js`.
- [x] **Renderer Update:** Modify `SlideRenderer.js` to inject CSS variables into the slide container.
- [x] **Element Update:** Update `DEFAULT_MASTERS` placeholders to use these CSS variables.

### 8.2: UI Implementation (Property Inspector) (Completed)
- [x] **Theme Context:** In `PropertyInspector.js`, detect when a **Theme Master** is selected.
- [x] **Color Controls:** Add color pickers for `accent`, `textPrimary`, `textSecondary`.
- [x] **Font Controls:** Add dropdowns for `heading` and `body` fonts.
- [x] **Live Preview:** Ensure changes reflect immediately (via the CSS variable injection).

### 8.3: Verification & Safety (Completed)
- [x] **Risks:** Verified that `updateCurrentSlide` also updates CSS variables for live preview.
- [x] **Mitigation:** Added `themeSettings` to `getEffectiveSlide` and `getEffectiveSlideData` to ensure data availability.

## Phase 9: Final Polish & Optimization (Completed)
**Goal:** Ensure the feature is production-ready.

- [x] **Undo/Redo:** Verify `UPDATE_THEME_SETTINGS` and `UPDATE_SLIDE` (layout change) are captured in history.
    - *Implementation:* Created `HistoryManager.js` and integrated it into `Store.js`. Added keyboard shortcuts (Ctrl+Z/Y).
- [x] **Performance:** Check if changing a theme color triggers a full re-render.
    - *Verification:* It uses CSS variables (`--theme-accent`), so it updates the DOM style instantly without re-rendering the element tree.
- [x] **Cleanup:** Remove any temporary debug logs or visual borders.
    - *Action:* Removed debug logs from `SlideRenderer.js` and `Store.js`.

## Conclusion
The Slide Master system is now fully implemented. It supports:
1.  **Hierarchical Inheritance:** Theme -> Layout -> Slide.
2.  **Global Theming:** Colors and Fonts via CSS variables.
3.  **Layout Switching:** With smart content remapping.
4.  **Master Editing:** Dedicated UI for editing templates.
5.  **Undo/Redo:** For critical actions.

