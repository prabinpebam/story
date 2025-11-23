# Global Input & Interaction Behavior

## 1. Input Focus Policy (Global)
To prevent conflicts between typing/editing and application shortcuts, the following policy applies globally:

### 1.1. Shortcut Suppression
- **Rule:** When any text-based input (Input, Textarea, ContentEditable) has focus, **ALL** application-level keyboard shortcuts (e.g., `Delete`, `T`, `R`) must be disabled.
- **Exceptions (Allowed Shortcuts):**
    - System-standard text editing shortcuts must **ALWAYS** pass through to the input:
        - `Ctrl+Z` / `Cmd+Z` (Undo text)
        - `Ctrl+Y` / `Cmd+Shift+Z` (Redo text)
        - `Ctrl+C`, `Ctrl+V`, `Ctrl+X` (Clipboard)
        - `Ctrl+A` (Select All)
        - Arrow Keys (Navigation)
- **Implementation:** A centralized check (e.g., `InputManager.isInputActive()`) should be used by all shortcut listeners.
- **Exception:** The `Escape` key should blur the current input and return focus to the `body` (Canvas), re-enabling app shortcuts.
- **Exception:** `Enter` key should confirm the value (if applicable) and blur the input (or move to next).

## 2. Numeric Input Interaction
All inputs representing numeric values must adhere to a unified interaction model.

### 2.1. Scrubbing (Drag to Edit)
- **Trigger:** Click and drag on the input label or the input field itself (if configured).
- **Cursor:**
    - On Hover: `ew-resize` (East-West Resize).
    - On Drag: **Hidden**. The cursor should disappear to allow infinite dragging without hitting screen edges.
- **Behavior:**
    - Dragging Right increments the value.
    - Dragging Left decrements the value.
    - **Infinite Scrub:** The mouse movement is captured (via Pointer Lock API or similar) so the user never hits the edge of the screen.
- **Precision:**
    - Default: 1px drag = 1 step (usually 1 unit).
    - `Shift` + Drag: 1px drag = 10 steps (Coarse).
    - `Alt/Option` + Drag: 1px drag = 0.1 steps (Fine).

### 2.2. Click vs. Drag (The "Wait" State)
To distinguish between selecting the text and scrubbing the value:
1.  **Mouse Down:** Enter "Potential Scrub" state. Do **not** focus or select text yet. Record start position.
2.  **Mouse Move:**
    - If moved > 3px: Enter "Scrub" state. Hide cursor, start changing value.
    - If not moved: Remain in "Potential Scrub".
3.  **Mouse Up:**
    - If in "Scrub" state: End scrubbing, show cursor.
    - If in "Potential Scrub" state (i.e., was a click): **Focus** the input and **Select All** text.

### 2.3. Keyboard Interaction (When Focused)
- **Arrow Up:** Increment by 1 step.
- **Arrow Down:** Decrement by 1 step.
- **Shift + Arrow:** Increment/Decrement by 10 steps.
- **Alt + Arrow:** Increment/Decrement by 0.1 steps.
- **Enter:** Commit value and Blur.
- **Escape:** 
    - Revert to the value present before the interaction started.
    - Blur the input.
    - **Crucial:** Stop event propagation to prevent the Canvas from catching the `Escape` key and deselecting the object.

### 2.4. Undo/Redo Grouping (Transaction)
- **Scrubbing:** The entire drag operation (from MouseDown to MouseUp) counts as **one** undo step.
    - *Implementation:* Update the Redux store with "transient" updates during drag (if performance allows) or use a specific "SET_PROPERTY" action that replaces the previous one if it's part of the same interaction. Alternatively, capture the "Start Value" on MouseDown and only push the "Final Value" to the Undo Stack on MouseUp.
- **Typing:** Typing "1", "2", "3" (to make 123) should be one undo step, committed on Blur or Enter.

### 2.5. Local Undo/Redo (Text Editing)
- **Requirement:** Users must be able to undo/redo their *typing* within the input field without triggering the global application Undo/Redo.
- **Behavior:**
    - When the input is focused, `Ctrl+Z` undoes the last text change (e.g., "123" -> "12").
    - This relies on the browser's native input history.
    - **Constraint:** The application's global Undo listener must explicitly ignore `Ctrl+Z` events when an input is focused.

### 2.6. Interaction Memory (Escape Revert)
- **Requirement:** The input must remember the value it held *before* the current interaction started to support the "Escape to Cancel" behavior.
- **State:** `initialValue`
- **Lifecycle:**
    - **Set:** On `focus` (via click or tab) OR on `mousedown` (start of scrub).
    - **Use:** On `Escape` key press, restore `value` to `initialValue`.
    - **Clear:** On `blur` (commit).

## 3. Live Preview & Overlay Visibility
To ensure the user can clearly see the effect of their changes:

### 3.1. Hiding Selection Overlay
- **Rule:** When the user is actively changing a property (Scrubbing a number, Dragging a color picker, Moving a slider), the **Selection Overlay** (Blue bounding box, handles, hover outlines) must be **Hidden**.
- **Trigger:**
    - Start Interaction (MouseDown/DragStart on control): Hide Overlay.
    - End Interaction (MouseUp/DragEnd): Show Overlay.
- **Scope:** Applies to all property changes in the Property Inspector and Toolbar.

### 3.2. Real-time Updates
- Changes must be reflected on the Canvas immediately (60fps) during the interaction.
