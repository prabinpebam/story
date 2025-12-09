# Text Editing & Manipulation Master Specification

## 1. Overview
This specification defines the comprehensive interaction model for text editing in the Story presentation tool. It consolidates UX, interaction, and technical requirements into a single source of truth. The system is modeled after industry-standard design tools (Figma, Keynote) to ensure familiarity and reliability.

## 2. Modes of Interaction

The text system has two distinct modes. The transition between these modes is critical.

### 2.1 Object Mode (Default)
In this mode, the text element acts like any other vector object (rectangle, image).
- **Visuals**: 
  - Bounding box is visible with resize handles.
  - Cursor is `default` (arrow) or `move` when hovering over the object.
  - Cursor changes to `text` (I-beam) only when hovering directly over the text glyphs to indicate editability.
- **Selection**:
  - **Single Click**: Selects the object. Does **NOT** enter edit mode.
  - **Click & Drag**: Moves the object.
  - **Resize**: Dragging handles resizes the text box (changing wrapping or font size depending on auto-resize settings).
- **Property Inspector**:
  - Displays object-level properties (Position, Opacity, Rotation).
  - Displays text-level properties (Font, Size, Color, Alignment).
  - **Crucial**: Interacting with the Property Inspector (clicking buttons, dropdowns, inputs) must **NOT** deselect the text object. The object remains selected so changes apply immediately.

### 2.2 Edit Mode (Text Editing)
In this mode, the user is editing the content of the text element.
- **Visuals**:
  - Bounding box remains visible (often a thinner outline) but **resize handles are hidden**.
  - A blinking text caret (I-beam) is visible.
  - Text selection highlight (if any) is visible.
- **Entry Triggers**:
  - **Double Click**: On a text object in Object Mode.
  - **Enter Key**: When a text object is selected in Object Mode. (Selects all text by default).
  - **Text Tool**: Clicking on the canvas creates a new text object and immediately enters Edit Mode.
- **Exit Triggers**:
  - **Escape Key**: Commits changes and returns to Object Mode (Object remains selected).
  - **Cmd/Ctrl + Enter**: Commits changes and returns to Object Mode.
  - **Click Outside**: Clicking on the canvas (empty space) commits changes and deselects the object.
  - **Click Another Object**: Commits changes and selects the new object.

## 3. Selection & Navigation Details

### 3.1 Mouse Interaction
| Action | Context | Result |
|--------|---------|--------|
| **Single Click** | Unselected Object | **Selects Object**. (Does NOT enter edit mode). |
| **Single Click** | Selected Object | No change (remains selected). |
| **Double Click** | Object Mode | **Enters Edit Mode**. Caret placed at click position. |
| **Triple Click** | Edit Mode | Selects entire paragraph/line. |
| **Quadruple Click** | Edit Mode | Selects all text. |
| **Click + Drag** | Object Mode | Moves the object. |
| **Click + Drag** | Edit Mode | Selects a range of text. |

### 3.2 Keyboard Shortcuts
| Shortcut | Context | Result |
|----------|---------|--------|
| `Enter` | Object Selected | **Enters Edit Mode**. Selects ALL text. |
| `Escape` | Edit Mode | **Exits Edit Mode**. Returns to Object Mode (Selected). |
| `Cmd/Ctrl + Enter` | Edit Mode | **Exits Edit Mode**. Returns to Object Mode (Selected). |
| `Arrow Keys` | Object Selected | Nudges object position. |
| `Arrow Keys` | Edit Mode | Moves text caret. |
| `Shift + Arrow` | Edit Mode | Extends text selection. |
| `Cmd/Ctrl + A` | Edit Mode | Selects all text within the element. |
| `Cmd/Ctrl + A` | Object Mode | Selects all objects on the slide. |

## 4. Property Inspector Interaction

The Property Inspector (PI) is the primary way to style text.

- **Focus Management**:
  - When a user clicks a control in the PI (e.g., Font Family dropdown, Color Picker), the **Text Object must remain selected**.
  - If in **Edit Mode**: The text selection (range) must be preserved. The focus may temporarily shift to the PI control, but the text selection visuals should remain (or reappear immediately). Applying the property applies it to the selected range.
  - If in **Object Mode**: The property applies to the entire text object.
- **Live Preview**: Hovering over options (like fonts) should ideally preview the change on the canvas.

## 5. Slide Master vs. Normal Slide

### 5.1 Regular Text
- Created on a slide.
- Fully editable.

### 5.2 Placeholder Text (from Master)
- Defined on a Master Slide.
- Appears on Normal Slides as a placeholder.
- **Empty State**:
  - Shows prompt text (e.g., "Click to edit Master title style").
  - **Single Click**: Selects the placeholder object.
  - **Double Click**: Enters Edit Mode. **Clears the prompt text**. Cursor at start.
- **Filled State**:
  - Behaves exactly like Regular Text.
  - **Double Click**: Enters Edit Mode. **Caret is placed exactly at the character position where the click occurred.**
- **Reset**:
  - If the user deletes all content and exits Edit Mode, the element reverts to the **Empty State** (Prompt text reappears).

## 6. Rich Text & Formatting

- **Mixed Styles**: A single text object can contain multiple styles (e.g., one word bold, one word red).
- **Shortcuts**:
  - `Cmd/Ctrl + B`: Bold
  - `Cmd/Ctrl + I`: Italic
  - `Cmd/Ctrl + U`: Underline
  - `Cmd/Ctrl + Shift + K`: Uppercase/Normal toggle
- **Paste Behavior**:
  - `Cmd/Ctrl + V`: Paste. If pasting text from outside, match current style. If pasting internal rich text, preserve style.
  - `Cmd/Ctrl + Shift + V`: Paste and Match Style (Plain text).

## 7. Auto-Sizing & Layout

- **Auto Width**: Box grows horizontally as you type. (No wrapping).
- **Fixed Width**: Box has fixed width. Text wraps. Height grows automatically.
- **Fixed Size**: Box has fixed width and height. Text may overflow.

## 8. Implementation Requirements for QA

1.  **Verify Single Click**: Ensure single clicking a text object *never* triggers the caret or edit mode.
2.  **Verify PI Interaction**: Click a text object, then click the "Bold" button in the inspector. The text should become bold, and the object should *stay selected*.
3.  **Verify Edit Entry**: Double-click to enter. Type. Escape to exit. Text should save.
4.  **Verify Master Placeholder**: Double-click an empty placeholder. Prompt disappears. Type. Exit. Content remains. Delete content. Exit. Prompt reappears.
