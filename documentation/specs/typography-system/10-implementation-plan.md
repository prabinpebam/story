# Typography System Implementation Plan

**Status**: Draft
**Owner**: Engineering Team
**Last Updated**: December 11, 2025

This document outlines the detailed, step-by-step implementation plan for the Typography System. It is designed to be executed in small, incremental PRs to ensure **App Integrity**, **Design System Compliance**, and **Performance**.

## Principles Checklist for Every PR
- [ ] **Incremental Changes**: PR is small and focused (e.g., "Add StyleResolver", not "Implement Typography").
- [ ] **Testing**: Includes Vitest unit tests for logic and Playwright tests for UI flows.
- [ ] **Design System**: Uses `variables.css` tokens and standard components (`Dropdown`, `NumberInput`).
- [ ] **Theming**: Verified in both Light and Dark modes; interactions use Accent color.
- [ ] **Undo/Redo**: State changes are recorded in History; previews are skipped.

---

## Phase 1: State Management & Data Structure (The Wiring)
**Goal**: Establish the Redux state for Typography and ensure data integrity.

### Task 1.1: Define State Schema
- [ ] **Action**: Update `Store.js` initial state.
  - Add `currentTheme.typography` (stores current preset ID or custom definition).
  - Add `typographyStylePresets` (cache of available presets).
- [ ] **Validation**: Verify state structure in Redux DevTools.

### Task 1.2: Implement Actions & Reducers
- [ ] **Action**: Create `APPLY_FONT_PRESET` reducer.
  - **Logic**: Update `currentTheme.typography`. Trigger "Theme Changed" event.
  - **History**: Must be undoable.
- [ ] **Action**: Create `UPDATE_TEXT_STYLE` reducer.
  - **Logic**: Update specific style role (e.g., 'title') in the current theme (if custom).
- [ ] **Test**: Write unit tests for reducers (Vitest).
  - `should update theme when preset is applied`
  - `should merge custom styles correctly`

### Task 1.3: Data Migration Strategy
- [ ] **Action**: Create a utility `migrateTextElements.js`.
  - **Logic**: Iterate all slides. If `textStyleId` is missing, assign default based on heuristics (e.g., if fontSize > 40 -> 'title', else 'body').
  - **Safety**: Move existing hardcoded properties to `manualOverrides` to preserve exact look.
- [ ] **Risk**: Data loss. **Mitigation**: Run on a copy of the data first.

---

## Phase 2: The Rendering Engine (Core)
**Goal**: Text elements render based on the active Theme.

### Task 2.1: Implement Style Resolver
- [ ] **Action**: Create `src/core/text/StyleResolver.js`.
- [ ] **Logic**: Implement `resolveTextStyle(element, layout, master, theme)` function.
  - **Algorithm**: `Merge(Theme[role], Master[role], Layout[role], Element.overrides)`.
- [ ] **Test**: Unit tests for `resolveTextStyle` covering all 4 layers of cascade.

### Task 2.2: Update Text Renderer
- [ ] **Action**: Modify `TextRenderer.js` (or `CanvasManager.js`).
  - **Change**: Replace direct property access (`element.fontSize`) with `StyleResolver.resolve(element).fontSize`.
- [ ] **Performance**: Memoize the result of `resolveTextStyle` to avoid re-calculation on every frame.

### Task 2.3: Active Linking Verification
- [ ] **Action**: Verify that changing the Theme in Redux immediately triggers a canvas re-render.
- [ ] **Test**: Integration test.
  - Load slide with 'Title'.
  - Dispatch `APPLY_FONT_PRESET`.
  - Assert 'Title' font family changed in the renderer output.

---

## Phase 3: Property Inspector (UI)
**Goal**: Users can manage styles via the Property Inspector.

### Task 3.1: Style Selector Dropdown
- [ ] **Action**: Update `TextSection.js`.
  - Add `Dropdown` for `textStyleId` (Title, Body, etc.).
  - **Design System**: Use `src/ui/components/Dropdown.js`.
- [ ] **Logic**: Selecting a new style must dispatch action to update `textStyleId` AND clear `manualOverrides`.

### Task 3.2: Override Detection UI
- [ ] **Action**: Update Font Family/Size/Weight controls.
  - **Logic**: Compare current value with `StyleResolver.resolve(element, ..., { ignoreOverrides: true })`.
  - **UI**: If value differs, show "Modified" state (e.g., highlight label using `--color-accent`).
  - **Interaction**: Add "Reset" button next to modified controls.

### Task 3.3: Reset Functionality
- [ ] **Action**: Implement "Reset to Style" button.
  - **Logic**: Clears `manualOverrides` for the selected element.
- [ ] **Test**: E2E test (Playwright).
  - Select text -> Change Size (Override) -> Click Reset -> Verify Size matches Theme.

---

## Phase 4: Master Slide Inheritance
**Goal**: Enable global overrides via Master Slides.

### Task 4.1: Master Slide Data Model
- [ ] **Action**: Update `MasterSlide` schema to support `typographyOverrides`.
- [ ] **UI**: Add UI in Master View to edit these overrides.

### Task 4.2: Cascade Integration
- [ ] **Action**: Update `StyleResolver.js` to include Master Slide layer.
- [ ] **Test**: Unit test verifying Master override takes precedence over Theme but yields to Element override.

---

## Phase 5: Polish & Non-Functional Requirements
**Goal**: Ensure production readiness.

### Task 5.1: Undo/Redo Compatibility
- [ ] **Action**: Verify all new actions work with `HistoryManager`.
- [ ] **Fix**: Ensure `skipHistory: true` is used for hover previews in `TypographyStyleManager`.

### Task 5.2: Realtime Collaboration
- [ ] **Action**: Verify atomic updates.
- [ ] **Test**: Simulate two clients editing same element (one changes style, one changes content).

### Task 5.3: Performance Profiling
- [ ] **Action**: Profile rendering with 100+ text elements.
- [ ] **Optimization**: Ensure `resolveTextStyle` is not a bottleneck.
