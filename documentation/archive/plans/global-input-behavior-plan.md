# Implementation Plan: Global Input & Interaction Behavior

## Phase 1: Foundation (State & Input Manager)
**Goal:** Establish the shared state for "Interaction Mode" and a centralized utility for shortcut management.

### 1.1. Store Update (Interaction State)
- **File:** `src/core/Store.js`
- **Action:** Add `ui` slice to the initial state.
- **State:** `{ isInteracting: false }`
- **Reducers:**
    - `UI_INTERACTION_START`: Set `isInteracting = true`.
    - `UI_INTERACTION_END`: Set `isInteracting = false`.

### 1.2. InputManager Utility Class
- **File:** `src/core/InputManager.js` (New)
- **Methods:**
    - `isInputActive()`: Returns `true` if `document.activeElement` is an input, textarea, or contentEditable.
    - `shouldBlockShortcut(event)`: 
        - Returns `true` if `isInputActive()` is true.
        - **Exception:** Returns `false` (allow) for standard editing keys:
            - `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+Y` (Undo/Redo)
            - `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+A`
            - Arrow Keys, Home, End, Delete, Backspace.
    - `setupGlobalListeners()`: (Optional) Central place to attach listeners if we refactor later.

### 1.3. Global Shortcut Audit (Main)
- **File:** `src/main.js`
- **Action:** In the global `keydown` listener, replace manual tag checks with `InputManager.shouldBlockShortcut(e)`.

### 1.4. Global Shortcut Audit (Canvas)
- **File:** `src/core/CanvasManager.js`
- **Action:** In `handleKeyDown`, use `InputManager.shouldBlockShortcut(e)` to prevent canvas shortcuts (like Delete, Duplicate) when typing.

## Phase 2: NumberInput Component (Iterative)
**Goal:** Implement the unified interaction model in small, testable steps.

### 2.1. State Machine & Click/Drag Detection
- **File:** `src/ui/components/NumberInput.js`
- **Task:** Refactor `handleInputMouseDown`.
- **Logic:**
    - Implement the "Wait Threshold" (3px).
    - Distinguish clearly between `isScrubbing` and `isEditing`.
    - **Test:** Click focuses. Drag > 3px logs "Scrubbing" to console (no value change yet).

### 2.2. Keyboard Support & Memory
- **File:** `src/ui/components/NumberInput.js`
- **Task:** Implement `handleKeyDown` and `initialValue` tracking.
- **Logic:**
    - **Memory:** On `focus` or `mousedown`, store `this.initialValue = this.value`.
    - **Arrows:** Arrow Up/Down modifies value.
    - **Modifiers:** Shift/Alt modifiers change step size.
    - **Escape:** Set `this.value = this.initialValue`, dispatch update, and blur.
    - **Enter:** Commits and blurs.
    - **Test:** Focus input, change value, hit Escape. Value should revert.

### 2.3. Infinite Scrubbing (Pointer Lock)
- **File:** `src/ui/components/NumberInput.js`
- **Task:** Implement `requestPointerLock`.
- **Logic:**
    - On Scrub Start: Request Pointer Lock.
    - On Scrub Move: Use `e.movementX` to update value.
    - On Scrub End: Exit Pointer Lock.
    - **UX:** Ensure cursor reappears at expected location (or center) if possible, though Pointer Lock usually resets it.

### 2.4. Undo/Redo Transaction Logic
- **File:** `src/ui/components/NumberInput.js`
- **Task:** Manage `onChange` calls.
- **Logic:**
    - **Problem:** Every mouse move triggers `onChange` -> `store.dispatch`. This floods the undo stack.
    - **Solution:**
        - The `NumberInput` should take a `onValueChange` (transient) and `onValueCommit` (final).
        - **OR** (Simpler for now): The Store needs a way to "Update without pushing history" or "Replace last history entry".
        - **Plan:** For now, we will dispatch updates continuously (for live preview). We will rely on the Store's `ADD_HISTORY_ENTRY` logic. We might need to add a flag `skipHistory: true` to the `UPDATE_ELEMENT` action during drag, and then fire a final `UPDATE_ELEMENT` (with history) on mouse up.
    - **Refinement:** Add `skipHistory` parameter to `onChange` prop in `NumberInput`.

## Phase 3: Visual Feedback (Overlay)
**Goal:** Hide the selection gizmo during property adjustments.

### 3.1. Connect Input to Store
- **File:** `src/ui/components/NumberInput.js`
- **Task:** Dispatch Interaction Actions.
- **Logic:**
    - `mousedown` (if scrubbing): Dispatch `UI_INTERACTION_START`.
    - `mouseup` (after scrubbing): Dispatch `UI_INTERACTION_END`.

### 3.2. Update Canvas Rendering
- **File:** `src/core/CanvasManager.js` (or `SlideRenderer.js`)
- **Task:** Subscribe to Store `ui.isInteracting`.
- **Logic:**
    - When `isInteracting` becomes `true`: Add class `interaction-active` to canvas container.
    - CSS: `.interaction-active .selection-gizmo { opacity: 0; }`.
    - **Benefit:** CSS transition can make this smooth.

## Phase 4: Migration & Verification
**Goal:** Ensure all inputs use the new system.

### 4.1. Audit PropertyInspector
- **File:** `src/ui/PropertyInspector.js`
- **Task:** Check all `new NumberInput(...)` calls.
- **Action:** Ensure they pass the correct `step` (e.g., 0.1 for opacity, 1 for position).

### 4.2. Verify TextSection & Others
- **File:** `src/ui/properties/*.js`
- **Task:** Ensure `TextSection`, `PositionSection` etc. are using the updated `NumberInput`.

## Implications & Risks
- **Pointer Lock:** Browser permissions might block this. Fallback: Standard drag (cursor visible, hits screen edge).
- **Undo History:** Flooding the undo stack is the biggest risk. We MUST implement the `skipHistory` flag in the Store actions for continuous updates.
