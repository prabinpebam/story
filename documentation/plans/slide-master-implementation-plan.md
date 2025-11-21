# Slide Master Implementation Plan

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

## Phase 3: Master View Mode (UI & Navigation)
**Goal:** Allow users to switch between "Slide Edit" and "Master Edit" modes and navigate the master hierarchy.

1.  **Store Updates**
    *   Add `editor.mode` state ('edit' | 'master').
    *   Add `editor.activeMasterId` state.
    *   Add actions: `SET_MODE`, `SET_ACTIVE_MASTER`.

2.  **Toolbar UI**
    *   Add "Edit Master" button to the Toolbar (or View menu).
    *   Add "Close Master View" button (visible only in Master mode).

3.  **Slide List (Left Panel) Adaptation**
    *   Refactor `SlideList.js` to handle two modes.
    *   **Normal Mode:** Shows Slides (current behavior).
    *   **Master Mode:** Shows Tree View:
        *   Theme Master (Root)
        *   └── Layout Masters (Children)
    *   Implement selection logic for Masters/Layouts in the list.

4.  **Renderer Adaptation**
    *   Update `SlideRenderer.js` to handle `editor.mode`.
    *   If mode is 'master', render `state.masters[activeMasterId]` instead of `state.slides[activeSlideId]`.
    *   **Important:** When editing a Layout, it should visually inherit from its parent Theme (similar to how Slides inherit from Layouts).
        *   Need `getEffectiveMaster(masterId)` helper? Or reuse `getEffectiveSlide` logic adapted for masters.

## Phase 4: Master Editing (Core)
**Goal:** Enable editing of Master and Layout slides (backgrounds, elements, placeholders).

1.  **Selection & Property Inspector**
    *   Update `SelectionManager` to allow selecting elements on Master slides when in Master mode.
    *   Update `PropertyInspector` to bind to `state.masters[activeMasterId]` when in Master mode.

2.  **Element Operations**
    *   Update Store actions (`ADD_ELEMENT`, `UPDATE_ELEMENT`, `DELETE_ELEMENT`, `UPDATE_SLIDE`) to target the correct object based on `editor.mode`.
    *   If in Master mode, target `state.masters[activeMasterId]`.
    *   If in Slide mode, target `state.slides[activeSlideId]`.

3.  **Placeholder Management**
    *   Add "Insert Placeholder" tool to Toolbar (only in Master mode).
    *   Define `placeholder` element type in Store/Renderer.
    *   Render placeholders with distinct visual style (dashed border, prompt text).

## Phase 5: Layout Application
**Goal:** Allow users to change the layout of an existing slide.

1.  **Layout Picker UI**
    *   Add "Layout" dropdown to `PropertyInspector` (Slide Properties section).
    *   Show available layouts from the current theme.

2.  **Layout Switching Logic**
    *   Implement `APPLY_LAYOUT` action in Store.
    *   **Smart Remapping:**
        *   When switching layouts, try to map existing elements to new placeholders based on type/ID.
        *   Preserve content (text, images) while updating position/style to match new layout.

## Phase 6: Theme Editor (Global Styles)
**Goal:** Edit global theme properties.

1.  **Theme Settings**
    *   Add `themeSettings` to Theme Master object (colors, fonts).
    *   Create "Theme" tab in Property Inspector (when Theme Master is selected).

2.  **Global Propagation**
    *   Ensure all slides/layouts reference these theme variables (CSS variables or Store lookups).
