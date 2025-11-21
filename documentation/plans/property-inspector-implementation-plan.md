# Property Inspector Implementation Plan

This document outlines the step-by-step plan to redesign the Property Inspector. The approach is **granular and incremental**, ensuring the application remains stable at all times. We will build the foundation first, then tackle each section individually, and finally implement the complex Unified Color Picker.

## Principles
1.  **Don't Break Things**: Ensure the application remains usable at every step.
2.  **Small Incremental Changes**: Implement one section at a time.
3.  **Visual Parity**: Strictly adhere to the `ui-design-system.md`.
4.  **Color Picker Last**: Use existing color inputs until the final phase.

---

## Phase 1: Foundation & Overall UI Shell
**Goal**: Establish the visual environment and reusable components needed for all subsequent sections.

### 1.1. CSS Scoping & Variables
- **Action**: Update `styles/main.css`.
- **Details**:
    - Define `.property-inspector` class.
    - Add high-density variables inside this scope:
        - `--prop-bg-input`: `#383838`
        - `--prop-text-label`: `#B3B3B3`
        - `--row-height`: `32px`
        - `--input-height`: `28px`
- **Verification**: Check that these variables do not leak to the rest of the app.

### 1.2. Base UI Components
Create the building blocks in `src/ui/components/`.
- **`NumberInput.js`**:
    - Features: Scrubbable label, Arrow key support, Shift modifier (10x), Prefix label (e.g., "X", "W").
- **`TextInput.js`**:
    - Features: Standard styled input, Focus states.
- **`IconButton.js`**:
    - Features: Icon support, Active/Selected states, Tooltip support.
- **`Section.js`**:
    - Features: Collapsible header, Title, Right-aligned actions (Add, Visibility).

### 1.3. Property Inspector Skeleton
- **Action**: Refactor `PropertyInspector.js`.
- **Details**:
    - Clear the existing monolithic `render()` method.
    - Create a structure that simply instantiates and appends Section components.
    - **Crucial**: Ensure it handles "No Selection" and "Multi-Selection" states gracefully (even if empty for now).

---

## Phase 2: Position Section
**Goal**: Implement the X, Y, Rotation, and Alignment controls.

### 2.1. Alignment Row
- **Action**: Create `src/ui/properties/PositionSection.js`.
- **Details**: Implement the 6 alignment icons (Left, Center, Right, Top, Middle, Bottom).
- **Logic**: Connect to existing alignment commands in `Store.js` or `CanvasManager.js`.

### 2.2. Coordinates & Transform
- **Details**: Add X, Y, Rotation inputs and Flip buttons to `PositionSection.js`.
- **Integration**: Bind `NumberInput` changes to `store.updateElement()`.

---

## Phase 3: Layout & Appearance Section
**Goal**: Implement Dimensions, Constraints, Opacity, and Corner Radius.

### 3.1. Layout Section
- **Action**: Create `src/ui/properties/LayoutSection.js`.
- **Details**:
    - Width / Height inputs.
    - Constrain Proportions toggle (Link icon).
    - **Logic**: Implement aspect ratio locking logic when updating W or H.

### 3.2. Appearance Section
- **Action**: Create `src/ui/properties/AppearanceSection.js`.
- **Details**:
    - Opacity input (%).
    - Corner Radius input.
    - Blend Mode dropdown (if supported by engine).

### 3.3. Slide Properties Section
- **Action**: Create `src/ui/properties/SlideSection.js`.
- **Specs**: `property-inspector-slide.md`.
- **Details**:
    - Name input (Master mode).
    - Layout picker (Slide mode).
    - Dimensions (W/H).
    - Background controls (Inherited/Solid/Code/etc.).
    - Theme settings (Theme Master mode).

---

## Phase 4: Export Section
**Goal**: Implement the Export presets UI.

### 4.1. Export UI
- **Action**: Create `src/ui/properties/ExportSection.js`.
- **Details**:
    - List of export presets (Scale, Suffix, Format).
    - "Add Preset" button.
    - "Export" button.
- **Note**: If actual export logic is complex, implement the UI first and mock the export action.

---

## Phase 5: Stroke Section (Structure)
**Goal**: Implement the Stroke UI using existing color inputs.

### 5.1. Stroke List & Controls
- **Action**: Create `src/ui/properties/StrokeSection.js`.
- **Details**:
    - Stackable stroke list (Add/Remove).
    - Weight input.
    - Position dropdown (Inside/Center/Outside).
    - **Temporary**: Use the existing `ColorInput.js` for the color swatch.

---

## Phase 6: Fill Section (Structure)
**Goal**: Implement the Fill UI using existing color inputs.

### 6.1. Fill List & Controls
- **Action**: Create `src/ui/properties/FillSection.js`.
- **Details**:
    - Stackable fill list.
    - Opacity and Visibility toggles per fill.
    - **Temporary**: Use the existing `ColorInput.js` for the color swatch.

---

## Phase 7: Effects Section
**Goal**: Implement Shadows and Blurs.

### 7.1. Effects List
- **Action**: Create `src/ui/properties/EffectsSection.js`.
- **Details**:
    - List of effects (Drop Shadow, Blur).
    - Effect Settings Flyout (or inline expansion for now).

---

## Phase 8: Unified Color Picker (Final Integration)
**Goal**: Replace temporary color inputs with the professional Unified Color Picker.

### 8.1. Color Picker Component
- **Action**: Create `src/ui/components/ColorPicker/`.
- **Details**: Implement the full HSB, Gradient, Image, and **Code Fill** picker as per `color-picker-ui.md` and `property-inspector-fill.md`.

### 8.2. Code Fill Implementation
- **Action**: Implement `CodeFillView.js` in the Color Picker.
- **Details**:
    - AI Prompt input and generation logic.
    - Code Editor (Monospace textarea).
    - Integration with `CodeRunner.js`.

### 8.3. Integration
- **Action**: Update `FillSection`, `StrokeSection`, and `EffectsSection`.
- **Details**: Replace `ColorInput` with the new `ColorPicker` trigger.
