# Text Editing & Manipulation Specification

## 1. Overview
This specification details the interaction model for direct text editing on the canvas. The goal is to provide a "world-class" text editing experience similar to professional design tools like Figma, Sketch, or Adobe Illustrator. This involves seamless transitions between object-level manipulation and character-level editing, robust rich text support, and intuitive list management.

## 2. Interaction States

### 2.1 Entering Edit Mode
Users can enter **Edit Mode** for a text element via the following actions:
- **Double Click**: Double-clicking a text element on the canvas.
- **Enter Key**: Pressing `Enter` while a text element is selected.
- **Tool Activation**: Clicking on the canvas with the **Text Tool** active creates a new text element and immediately enters Edit Mode.

**Initial State upon Entry:**
- **Existing Text**:
    - If entered via **Double Click**: The cursor is placed at the specific character location clicked.
    - If entered via **Enter Key**: All text within the element is **selected** by default. This allows for quick replacement of content.
- **New Text**: The element is empty, and the cursor is a blinking caret at the start.

### 2.2 Exiting Edit Mode
Users can exit Edit Mode and return to **Object Selection Mode** via:
- **Escape Key**: Commits changes and selects the text object.
- **Cmd/Ctrl + Enter**: Commits changes and selects the text object.
- **Click Outside**: Clicking anywhere on the canvas outside the text bounding box commits changes and deselects the object (or selects the newly clicked object).
- **Empty State**: If a new text object is created and exited without typing, the object is automatically deleted.

## 3. Selection & Navigation

### 3.1 Mouse Interaction
- **Hover**: Cursor changes to `text` (I-beam) when hovering over a text element (even in Object Mode).
- **Click (Edit Mode)**: Moves the caret to the clicked position.
- **Drag (Edit Mode)**: Selects a range of text.
- **Double Click (Edit Mode)**: Selects the **word** under the cursor.
- **Triple Click (Edit Mode)**: Selects the entire **paragraph** (or line, depending on implementation preference; Figma selects paragraph).
- **Quadruple Click (Edit Mode)**: Selects **all text** in the element.

### 3.2 Keyboard Navigation
Standard OS-level text navigation must be supported:
- **Arrow Keys**: Move caret left/right/up/down.
- **Opt/Alt + Left/Right**: Move caret by word.
- **Cmd/Ctrl + Left/Right**: Move caret to start/end of line.
- **Cmd/Ctrl + Up/Down**: Move caret to start/end of text field.
- **Shift + [Navigation]**: Extends selection based on the navigation unit.

## 4. Rich Text Support (Mixed Styling)

Unlike basic text fields, the text engine must support **multiple styles within a single text object**.

### 4.1 Attribute Ranges
Properties are applied to specific character ranges (indices). A single text node can contain:
- **Mixed Font Families**: e.g., "Hello **World**" (Inter Regular + Inter Bold).
- **Mixed Sizes**: e.g., Large drop cap.
- **Mixed Colors**: e.g., Highlighting specific words.
- **Mixed Decorations**: Underline, Strikethrough on specific parts.

### 4.2 Applying Styles
- **Selection**: If a range is selected, changing a property in the Property Inspector applies it *only* to that range.
- **Caret (No Selection)**:
    - Changing a property updates the **pending style**. The next character typed will use this new style.
    - If the caret is moved, the pending style resets to match the character preceding the caret.

## 5. List Management (Auto-formatting)

The editor should support intuitive list creation and management, triggered automatically by typing patterns.

### 5.1 Auto-detection Triggers
When the user types a trigger followed by a `Space`, the line automatically converts to a list item:
- **Bullet List**:
    - `- ` (Hyphen + Space)
    - `* ` (Asterisk + Space)
    - `+ ` (Plus + Space)
    - **Result**: Converts to a bulleted list item (`•`). The trigger characters are removed.
- **Numbered List**:
    - `1. ` (Number + Dot + Space)
    - `1) ` (Number + Paren + Space)
    - **Result**: Converts to an ordered list item (`1.`).

### 5.2 List Behavior
- **Indentation**:
    - **Tab**: Indents the current list item (increases nesting level).
    - **Shift + Tab**: Outdents the current list item (decreases nesting level).
- **Continuation**:
    - Pressing `Enter` at the end of a list item creates a new list item at the same nesting level.
    - **Numbered Lists**: Automatically increment (1. -> 2. -> 3.).
- **Termination**:
    - Pressing `Enter` on an **empty** list item removes the list styling for that line and exits the list mode (returns to paragraph).
    - Pressing `Backspace` at the start of a list item removes the list styling (converts back to paragraph text).

## 6. Layout & Resizing

Text elements have three distinct resizing behaviors that interact with editing.

### 6.1 Auto Width (Grow Horizontal)
- **Behavior**: The text box width expands as the user types. No line wrapping occurs unless a manual line break (`Enter` or `Shift+Enter`) is inserted.
- **Visuals**: Resize handles are usually hidden or distinct to indicate auto-width.
- **Interaction**: Manually resizing the width switches the mode to **Fixed Size**.

### 6.2 Auto Height (Grow Vertical)
- **Behavior**: The text box has a fixed width. Text wraps automatically when it hits the right edge. The height expands to fit the content.
- **Interaction**: Manually resizing the height switches the mode to **Fixed Size**.

### 6.3 Fixed Size
- **Behavior**: Both width and height are fixed.
- **Overflow**: Text that exceeds the bounds is either clipped or visible but outside the box (depending on "Clip Content" setting).
- **Visuals**: Often indicated by a red overflow marker if text is hidden.

## 7. Advanced Input Handling

### 7.1 Paste Behavior
- **Paste (Cmd/Ctrl + V)**:
    - If pasting text from an external source, it should attempt to match the style of the insertion point ("Paste and Match Style" behavior is often default in design tools for text content, or it retains basic formatting like bold/italic but adapts font/size).
    - If pasting rich text from within the app, it retains all style attributes.
- **Paste over Selection**: Replaces the selected text.

### 7.2 Smart Formatting (Optional but Recommended)
- **Smart Quotes**: Automatically convert straight quotes `'` `"` to curly quotes `’` `”`.
- **Em Dashes**: Automatically convert `--` to en-dash `–` or `---` to em-dash `—`.

## 8. Visual Feedback

### 8.1 The Cursor
- **I-Beam**: Standard text cursor.
- **Color**: Should match the layer color or the UI accent color (e.g., Blue).

### 8.2 Selection Highlight
- **Color**: Semi-transparent blue (e.g., `rgba(24, 160, 251, 0.3)`).
- **Behavior**: Must render behind the text glyphs to ensure readability.

### 8.3 Text Box Bounds
- While in Edit Mode, the bounding box of the text element should remain visible (thin outline) to show the user the layout constraints (especially for Fixed Size text).
