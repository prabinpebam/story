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

Text elements have three distinct sizing modes that determine how the bounding box responds to content changes.

### 6.1 Sizing Modes

#### Auto Size (Grow in Both Directions)
- **Behavior**: Both width and height automatically adjust to fit the text content. No line wrapping occurs unless a manual line break (`Enter` or `Shift+Enter`) is inserted.
- **Use Case**: Labels, headings, short text that should always fit its content.
- **Handle Behavior**: Dragging any resize handle converts the element to **Fixed Size** mode.

#### Fixed Width (Grow Vertical Only)
- **Behavior**: The text box has a fixed width. Text wraps automatically when it reaches the right edge. The height expands or contracts to fit the content.
- **Use Case**: Paragraphs, body text, constrained layouts.
- **Handle Behavior**: 
  - Dragging **width handles** (left, right, corners) adjusts width while staying in Fixed Width mode.
  - Dragging **height-only handles** (top, bottom center) converts to **Fixed Size** mode.

#### Fixed Size
- **Behavior**: Both width and height are fixed and do not change with content.
- **Overflow**: Text that exceeds the bounds remains visible but extends beyond the bounding box. The bounding box defines the "official" size for layout purposes.
- **Use Case**: Constrained areas, overlay text, precise layouts.

### 6.2 Alignment-Based Anchor Points

When a text element is in **Auto Size** or **Fixed Width** mode and the content changes (typing, deleting, style changes), the bounding box must resize. The **anchor point** that remains fixed during this resize is determined by the text alignment settings.

#### Horizontal Anchor (determined by Text Align)

| Text Align | Anchor Point | Resize Behavior |
|------------|--------------|-----------------|
| **Left** | Left edge | Box grows/shrinks rightward. Left edge stays fixed. |
| **Center** | Horizontal center | Box grows/shrinks equally from both sides. Center point stays fixed. |
| **Right** | Right edge | Box grows/shrinks leftward. Right edge stays fixed. |

**Visual Example (Auto Size, typing "Hello" → "Hello World"):**
```
Left Aligned:                 Center Aligned:               Right Aligned:
┌──────┐                          ┌──────┐                        ┌──────┐
│Hello │  →  ┌───────────┐    │Hello │  →  ┌───────────┐    │Hello │  →  ┌───────────┐
└──────┘     │Hello World│        └──────┘     │Hello World│        └──────┘     │Hello World│
             └───────────┘                     └───────────┘                     └───────────┘
[Left fixed]                  [Center fixed]              [Right fixed]
```

#### Vertical Anchor (determined by Vertical Align)

| Vertical Align | Anchor Point | Resize Behavior |
|----------------|--------------|-----------------|
| **Top** | Top edge | Box grows/shrinks downward. Top edge stays fixed. |
| **Middle** | Vertical center | Box grows/shrinks equally from top and bottom. Center point stays fixed. |
| **Bottom** | Bottom edge | Box grows/shrinks upward. Bottom edge stays fixed. |

**Visual Example (Fixed Width, adding a second line):**
```
Top Aligned:          Middle Aligned:        Bottom Aligned:
┌─────────┐           ┌─────────┐            ┌─────────┐
│ Line 1  │           │ Line 1  │            │ Line 1  │
└─────────┘           └─────────┘            └─────────┘
     ↓                     ↓                      ↓
┌─────────┐              ┌─────────┐         ┌─────────┐
│ Line 1  │              │ Line 1  │         │ Line 1  │
│ Line 2  │              │ Line 2  │         │ Line 2  │
└─────────┘              └─────────┘         └─────────┘
[Top fixed]          [Center fixed]       [Bottom fixed]
```

#### Combined Anchor Points (9-Point Grid)

The combination of horizontal and vertical alignment creates a 9-point anchor grid:

```
┌─────────────────────────────────┐
│  TL        TC        TR         │
│  (L+T)     (C+T)     (R+T)      │
│                                 │
│  ML        MC        MR         │
│  (L+M)     (C+M)     (R+M)      │
│                                 │
│  BL        BC        BR         │
│  (L+B)     (C+B)     (R+B)      │
└─────────────────────────────────┘
```

| Horizontal | Vertical | Anchor | Common Use |
|------------|----------|--------|------------|
| Left | Top | Top-Left (TL) | Default behavior, standard text flow |
| Center | Top | Top-Center (TC) | Centered headings |
| Right | Top | Top-Right (TR) | Right-aligned labels |
| Left | Middle | Middle-Left (ML) | Vertically centered left text |
| Center | Middle | Middle-Center (MC) | Centered callouts, badges |
| Right | Middle | Middle-Right (MR) | Right-aligned vertically centered |
| Left | Bottom | Bottom-Left (BL) | Bottom-anchored left text |
| Center | Bottom | Bottom-Center (BC) | Footer text, captions |
| Right | Bottom | Bottom-Right (BR) | Bottom-right anchored labels |

### 6.3 Implementation Notes

#### During Text Editing (Edit Mode)
- Resize calculations happen in real-time as the user types.
- The DOM element position must update immediately to maintain the anchor point.
- Store updates are deferred until editing ends (blur) to avoid disrupting the editing session.
- A live event system (`element-live-resize`) communicates dimension and position changes to the selection overlay.

#### Position Calculation
When content changes cause a size change:
```
newX = originalX - (widthDelta × horizontalFactor)
newY = originalY - (heightDelta × verticalFactor)

Where:
- horizontalFactor: 0 (left), 0.5 (center), 1 (right)
- verticalFactor: 0 (top), 0.5 (middle), 1 (bottom)
- widthDelta: newWidth - originalWidth
- heightDelta: newHeight - originalHeight
```

#### Mode Switching via Resize Handles
When the user manually resizes a text element using handles:

| Current Mode | Handle Type | Result |
|--------------|-------------|--------|
| Auto Size | Width handles (L, R, corners) | → Fixed Width |
| Auto Size | Any handle | → Fixed Size (if not width-only) |
| Fixed Width | Height handles (T, B center) | → Fixed Size |
| Fixed Width | Width handles | Stays Fixed Width |
| Fixed Size | Any handle | Stays Fixed Size |

### 6.4 Visual Indicators

- **Mode Icons**: The Property Inspector displays distinct icons for each mode:
  - **Auto Size**: Arrows pointing outward in both directions
  - **Fixed Width**: Horizontal constraint with vertical arrows
  - **Fixed Size**: Fully constrained box icon

- **Resize Handles**: Handle appearance may differ based on mode to indicate which dimensions are auto vs. fixed.

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
