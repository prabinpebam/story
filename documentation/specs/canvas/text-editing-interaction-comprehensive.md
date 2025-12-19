# Text Editing Interaction Specification

## Document Control

| Version | Date | Author | Status |
|---------|------|--------|--------|
| 1.0 | 2025-01-XX | Story Team | Draft |

**Industry Benchmarks**: Figma, Adobe Illustrator, Google Docs, Keynote, PowerPoint

---

## Table of Contents

1. [Overview](#1-overview)
2. [Text Element Creation](#2-text-element-creation)
3. [Resizing Modes](#3-resizing-modes)
4. [Alignment & Anchoring System](#4-alignment--anchoring-system)
5. [Edit Mode Lifecycle](#5-edit-mode-lifecycle)
6. [Selection & Caret Behavior](#6-selection--caret-behavior)
7. [Keyboard Shortcuts](#7-keyboard-shortcuts)
8. [Formatting System](#8-formatting-system)
9. [List Handling](#9-list-handling)
10. [Placeholder System](#10-placeholder-system)
11. [IME & International Input](#11-ime--international-input)
12. [Property Inspector Integration](#12-property-inspector-integration)
13. [Undo/Redo Behavior](#13-undoredo-behavior)
14. [Edge Cases & Error Handling](#14-edge-cases--error-handling)

---

## 1. Overview

### 1.1 Purpose

This specification defines all text editing interactions in the Story editor, ensuring consistent, predictable, and industry-standard behavior for text manipulation on the canvas.

### 1.2 Scope

- Text element creation and configuration
- Resizing modes and auto-sizing behavior
- Alignment-based anchoring during resize
- Edit mode entry/exit conditions
- Selection and caret placement
- Formatting (bold, italic, underline, strikethrough)
- Bulleted and numbered lists
- Placeholder text behavior
- IME (Input Method Editor) support
- Property Inspector synchronization

### 1.4 Fundamental Principle: Browser-First Text Edit Isolation

When `editingElementId` is set, the editor is in **Text Edit Mode (isolation mode)**:

- **The browser owns** caret movement, selection, IME behavior, and mouse semantics inside the text box:
    - Single click places caret
    - Double click selects word
    - Triple click selects paragraph/line
    - Arrow keys move caret
    - Shift+Arrow extends selection
- **The app owns** only the lifecycle + persistence boundaries:
    - Enter/Exit edit mode
    - Save/Cancel
    - Sanitization + store sync
    - Optional, explicitly-scoped behaviors (e.g. list indentation)

This spec intentionally minimizes custom text interaction logic. If browser defaults can provide the behavior reliably, we prefer them over custom code.

### 1.3 Key Files

| File | Purpose |
|------|---------|
| `src/core/text/TextEditManager.js` | Central orchestrator for text editing |
| `src/core/renderer/elements/TextElement.js` | DOM rendering and auto-resize behavior |
| `src/core/CanvasManager.js` | Text creation via click/drag |
| `src/ui/properties/LayoutSection.js` | Resizing mode controls (Auto Size / Fixed Width / Fixed Size) |
| `src/ui/properties/TextSection.js` | Typography controls (font, color, alignment) |
| `src/core/text/SelectionManager.js` | Selection save/restore for PI interaction |
| `src/core/text/PlaceholderManager.js` | Placeholder lifecycle handling |
| `src/core/text/IMEHandler.js` | International input handling |

### 1.5 Non-Goals

- Re-implementing browser selection rules (click/dblclick/triple-click) in custom JS
- Custom caret math for normal clicks inside the text box
- Canvas-level shortcuts firing while in text edit mode

---

## 1.6 Mode Contract (Input Routing)

### Object Mode (not editing)

- Keyboard shortcuts control canvas/editor actions (nudge, duplicate, arrange, etc.)
- Pointer input drives selection, transform, marquee, etc.

### Text Edit Mode (editing)

- Keyboard input and mouse interactions are routed to the `contenteditable` element.
- Canvas/global shortcut handlers MUST NOT run while editing, regardless of focus.
    - Rationale: the user may click UI chrome (toolbar/PI) without leaving edit mode.
- The interaction overlay (`#interaction-canvas`) MUST NOT block pointer interactions with the editable text element while editing.
    - If an overlay is required for rendering, it must be `pointer-events: none` during edit mode.

---

## 2. Text Element Creation

### 2.1 Creation Methods

| Method | Gesture | Resizing Mode | Initial Size | Edit Mode Entry |
|--------|---------|---------------|--------------|-----------------|
| Click | Single click with Text tool | `autoSize` | 200×50px (auto-adjusts) | Immediate, select all |
| Drag | Click-drag with Text tool | `fixed` | User-defined (min 50×50) | Immediate, select all |
| Master Mode Click | Single click in master editing | `fixed` | 400×80px | Immediate, select all |

### 2.2 Default Properties

```javascript
{
    id: `text-${Date.now()}`,
    type: 'text',
    x: <creation point>,
    y: <creation point>,
    width: <per method>,
    height: <per method>,
    rotation: 0,
    content: isDrag ? '<p>Text</p>' : '',
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '400',
    textFill: { type: 'solid', value: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    lineHeight: 'auto',
    letterSpacing: 0,
    resizing: <per method>
}
```

### 2.3 Post-Creation Behavior

1. Element is added to the active slide/master
2. Element is selected (`UPDATE_SELECTION`)
3. Tool reverts to Select tool (`SET_ACTIVE_TOOL: 'select'`)
4. Edit mode is entered with `selectionType: 'all'`
5. Element is marked as `isNewlyCreated: true`
6. If Shift was held during drag: aspect ratio is constrained

### 2.4 Figma Alignment

- **Click = Auto Width**: Matches Figma's behavior where single-click creates auto-sizing text
- **Drag = Fixed Size**: Matches Figma's behavior where user intent is to set specific dimensions

---

## 3. Resizing Modes

### 3.1 Mode Definitions

| Mode | Width Behavior | Height Behavior | Constraint | UI Location |
|------|----------------|-----------------|------------|-------------|
| `autoSize` | Expands/contracts with content | Expands/contracts with content | None | LayoutSection |
| `fixedWidth` | Fixed by user | Expands/contracts with content | Horizontal | LayoutSection |
| `fixed` | Fixed by user | Fixed by user | Both | LayoutSection |

### 3.2 Mode Transitions

| Action | Effect on Resizing Mode |
|--------|------------------------|
| Manual resize via handles | Changes to `fixed` |
| Change via LayoutSection buttons | Immediate update |
| Content exceeds bounds (fixed mode) | Text overflows (visible) |
| Enter pressed in auto-width mode | Creates new line, height grows |
| Scale transform (Shift + resize) | Font size scales, dimensions scale |

### 3.3 Scaling vs Resizing

| Operation | Font Size | Dimensions | Behavior |
|-----------|-----------|------------|----------|
| Resize handles | Unchanged | Changed | Content reflows |
| Scale tool (K) | Changed | Changed | Uniform scaling |
| Font size input | Changed | Auto-adjusts | Per resizing mode |

**Note**: Scale tool scales both the bounding box AND font size proportionally. This can result in fractional font sizes.

### 3.4 Property Inspector Behavior

- **Auto Size**: W and H inputs are **disabled** (values shown but not editable)
- **Fixed Width**: W input is **enabled**, H input is **disabled**
- **Fixed Size**: Both W and H inputs are **enabled**

### 3.4 Implementation Reference

```javascript
// LayoutSection.js
updateInputStates(resizingMode) {
    if (resizingMode === 'autoSize') {
        this.wInput.setDisabled(true);
        this.hInput.setDisabled(true);
    } else if (resizingMode === 'fixedWidth') {
        this.wInput.setDisabled(false);
        this.hInput.setDisabled(true);
    } else {
        this.wInput.setDisabled(false);
        this.hInput.setDisabled(false);
    }
}
```

---

## 4. Alignment & Anchoring System

### 4.1 Core Concept

**When a text element auto-resizes, its position is adjusted based on alignment settings to maintain the visual anchor point.**

This ensures that:
- Left-aligned text grows rightward (anchored left)
- Center-aligned text grows both directions (anchored center)
- Right-aligned text grows leftward (anchored right)

### 4.2 Horizontal Anchoring

| `textAlign` Value | Horizontal Factor | Growth Direction | Anchor Point |
|-------------------|-------------------|------------------|--------------|
| `left` | 0 | Right | Left edge |
| `center` | 0.5 | Both | Center |
| `right` | 1 | Left | Right edge |

### 4.3 Vertical Anchoring

| `verticalAlign` Value | Vertical Factor | Growth Direction | Anchor Point |
|-----------------------|-----------------|------------------|--------------|
| `top` | 0 | Down | Top edge |
| `middle` | 0.5 | Both | Center |
| `bottom` | 1 | Up | Bottom edge |

### 4.4 Position Calculation

```javascript
// TextElement.js - handleResize()
const textAlign = el.textAlign || el.style?.textAlign || 'left';
const verticalAlign = el.verticalAlign || el.style?.verticalAlign || 'top';

// Calculate horizontal factor
let horizontalFactor = 0;
if (textAlign === 'center') horizontalFactor = 0.5;
else if (textAlign === 'right') horizontalFactor = 1;

// Calculate vertical factor
let verticalFactor = 0;
if (verticalAlign === 'middle') verticalFactor = 0.5;
else if (verticalAlign === 'bottom') verticalFactor = 1;

// Calculate new position
if (updates.width !== undefined) {
    const widthDelta = updates.width - currentWidth;
    newX = currentX - (widthDelta * horizontalFactor);
}

if (updates.height !== undefined) {
    const heightDelta = updates.height - currentHeight;
    newY = currentY - (heightDelta * verticalFactor);
}
```

### 4.5 Alignment Change Behavior

When alignment is changed via Property Inspector:
1. The alignment property is updated immediately
2. Next resize event will use the new alignment for positioning
3. **No immediate position change** occurs on alignment switch alone

### 4.6 Live Resize During Editing

While in edit mode:
1. Store updates are avoided (would break focus)
2. Position is updated directly on DOM element
3. `_liveX`, `_liveY`, `_liveWidth`, `_liveHeight` track current state
4. `element-live-resize` event is emitted for selection box update
5. Final values are saved to store on edit exit

---

## 5. Edit Mode Lifecycle

### 5.0 Visual States

#### 5.0.1 Object Mode (Not Editing)

| State | Bounding Box | Cursor | Handles |
|-------|--------------|--------|---------|
| Not selected | Hidden | Default (arrow) | Hidden |
| Hover | Hidden | Text (I-beam) over glyphs, Default elsewhere | Hidden |
| Selected | Visible (blue) | Move when over element | Visible (8 handles) |

#### 5.0.2 Edit Mode (Editing)

| State | Bounding Box | Cursor | Handles |
|-------|--------------|--------|---------|
| Editing | Visible (thin outline) | Text (I-beam) | Hidden |
| Text selected | Same + selection highlight | Text (I-beam) | Hidden |

### 5.1 Entry Conditions

| Trigger | Entry Mode | Initial Selection | Source |
|---------|------------|-------------------|--------|
| Double-click on text element | `doubleClick` | Caret at click position | CanvasManager |
| Enter key while selected | `enter` | Select all content | KeyHandler |
| Text tool click (new element) | `click` | Select all content | CanvasManager |
| Programmatic | Varies | Per options | API |

### 5.2 Entry Process

```javascript
// TextEditManager.enterEditMode()
1. Check if already editing (exit current if different element)
2. Validate element exists in store
3. Set editing state flags
4. Begin history session
5. Handle placeholder preparation
6. Enable contentEditable
7. Add CSS classes (EDITING)
8. Set pointer-events and cursor
9. Attach event listeners (input, keydown, blur, paste)
10. Attach IME handler
11. (Optional) Apply initial character when provided
12. Set initial selection based on entry mode
13. Focus element
14. Dispatch store action (ENTER_TEXT_EDIT)
15. Emit TEXT_EDIT_START event
```

### 5.3 Exit Conditions

| Trigger | Save Content | Keep Selection |
|---------|-------------|----------------|
| `Escape` key | No | Yes |
| `Ctrl/Cmd + Enter` | Yes | Yes |
| Click outside element | Yes | No |
| Tab (not in list) | Yes | No (selects next element) |
| Blur to non-PI element | Yes | No |
| Programmatic | Per options | Per options |

### 5.4 Exit Process

```javascript
// TextEditManager.exitEditMode()
1. Block exit during IME composition
2. Clear pending save timer
3. Get and sanitize final content
4. Handle placeholder exit logic
5. Remove contentEditable
6. Remove CSS classes
7. Reset cursor and pointer-events
8. Detach event listeners
9. Detach IME handler
10. End history session (save or discard)
11. Save content to store
12. Handle empty element deletion
13. Update DOM with final content
14. Dispatch EXIT_TEXT_EDIT action
15. Emit TEXT_EDIT_END event
16. Clear internal state
```

### 5.5 Empty Element Handling

- **Newly created + no input**: Element is deleted
- **Existing + emptied**: Element is kept (unless placeholder rules apply)
- **Placeholder + emptied**: Reverts to prompt text

---

## 6. Selection & Caret Behavior

### 6.1 Initial Selection by Entry Mode

| Entry Mode | Selection Behavior |
|------------|-------------------|
| `enter` | Select all content |
| `typing` | Select all content (replaced by typed char) |
| `doubleClick` | Caret at click position |
| `click` | Caret at end |

### 6.2 Click Behavior in Edit Mode

| Click Type | Action |
|------------|--------|
| Single Click | Place caret at click position |
| Double Click | Select word at click position |
| Triple Click | Select entire paragraph/line |
| Quadruple Click | Select all content |
| Click + Drag | Create text selection range |
| Shift + Click | Extend selection to click position |

### 6.3 Selection Persistence

When focus moves to Property Inspector:
1. Current selection is saved via `SelectionManager.save()`
2. Selection is stored as node paths (robust to DOM changes)
3. When returning to text element, selection is restored via `SelectionManager.restore()`

### 6.3 Selection Information

```javascript
// TextEditManager.getSelectionInfo()
{
    text: 'selected text',
    isCollapsed: false,
    startOffset: 5,
    endOffset: 18,
    styles: {
        bold: true,
        italic: false,
        underline: false,
        strikethrough: false
    }
}
```

### 6.4 Caret Positioning

```javascript
// SelectionManager methods
selectAll(element)              // Select all content
placeCaretAtEnd(element)        // Caret at end
setCaretAtPosition(element, {x, y})  // Caret at coordinates
setCaretToEnd(element)          // After specific content
```

---

## 7. Keyboard Shortcuts

### 7.1 Navigation & Mode Control

| Shortcut | Action | Condition |
|----------|--------|-----------|
| `Escape` | Exit edit mode without saving | In edit mode |
| `Ctrl/Cmd + Enter` | Exit edit mode with save | In edit mode |
| `Enter` | Enter edit mode (select all) | Element selected, not editing |
| `Tab` | Exit edit mode, select next element | Not in list |
| `Tab` | Indent list item | In list |
| `Shift + Tab` | Outdent list item | In list |
| Any printable char | Does NOT enter edit mode | Element selected, not editing |
| `Delete` / `Backspace` | Delete selected elements | Element selected, not editing |
| `Arrow Keys` | Nudge element by 1px | Element selected, not editing |
| `Shift + Arrow Keys` | Nudge element by 10px | Element selected, not editing |
| `Arrow Keys` | Move caret | In edit mode |

### 7.2 Formatting Shortcuts

| Shortcut | Format | Implementation |
|----------|--------|----------------|
| `Ctrl/Cmd + B` | Bold | `document.execCommand('bold')` |
| `Ctrl/Cmd + I` | Italic | `document.execCommand('italic')` |
| `Ctrl/Cmd + U` | Underline | `document.execCommand('underline')` |
| `Ctrl/Cmd + Shift + X` | Strikethrough | `document.execCommand('strikeThrough')` |

### 7.3 Clipboard Shortcuts

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl/Cmd + C` | Copy | Browser native |
| `Ctrl/Cmd + X` | Cut | Browser native |
| `Ctrl/Cmd + V` | Paste | Rich paste with sanitization |
| `Ctrl/Cmd + Shift + V` | Paste as Plain Text | Strips formatting |

### 7.4 History Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo (Windows) |

### 7.5 Selection Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + A` | Select all text | In edit mode |
| `Ctrl/Cmd + A` | Select all objects | In object mode |
| `Shift + Arrow` | Extend selection | In edit mode |
| `Ctrl/Cmd + Shift + Arrow` | Extend selection by word | In edit mode |
| `Home` | Move caret to line start | In edit mode |
| `End` | Move caret to line end | In edit mode |
| `Ctrl/Cmd + Home` | Move caret to start | In edit mode |
| `Ctrl/Cmd + End` | Move caret to end | In edit mode |

### 7.6 List Shortcuts

| Shortcut | Action | Condition |
|----------|--------|-----------|
| `- ` + Space | Convert to bulleted list | At line start |
| `* ` + Space | Convert to bulleted list | At line start |
| `1. ` + Space | Convert to numbered list | At line start |
| `a. ` + Space | Convert to numbered list | At line start |
| `Enter` on empty item | Exit list / outdent | Empty list item |
| `Backspace` at item start | Outdent or convert to text | At list item start |

---

## 8. Formatting System

### 8.1 Inline Formatting

Formatting is applied using `document.execCommand()` for browser-native behavior:

```javascript
const commandMap = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough'
};

document.execCommand(commandMap[format], false, null);
```

### 8.2 Format Detection

```javascript
// TextEditManager.getSelectionStyles()
{
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strikethrough: document.queryCommandState('strikeThrough')
}
```

### 8.3 Property Inspector Interaction

1. User clicks formatting button in PI
2. `textEditManager.saveSelection()` is called
3. Format is applied via `textEditManager.applyFormat()`
4. Selection is restored via `textEditManager.restoreSelection()`
5. Element retains focus

---

## 9. List Handling

### 9.1 List Types

| Type | HTML Element | Counter Style |
|------|--------------|---------------|
| Bulleted | `<ul>` | `•` (consistent across levels) |
| Numbered | `<ol>` | Numbers → Letters → Roman (rotates per level) |

### 9.2 Indentation Levels

- Maximum: 5 levels supported
- Indent: `Tab` or `Ctrl/Cmd + ]`
- Outdent: `Shift + Tab` or `Ctrl/Cmd + [`

### 9.3 Auto-Detection Patterns

```javascript
// Bullet patterns: "- " or "* " at line start
/^[-*]\s$/

// Numbered patterns: "1. ", "2. ", etc.
/^\d+\.\s$/

// Lettered patterns: "a. ", "b. ", "A. ", "B. "
/^[a-zA-Z]\.\s$/
```

### 9.4 List Item Navigation

| Key | Behavior |
|-----|----------|
| `Enter` | New list item at same level |
| `Enter` (empty item) | Exit list or outdent |
| `Tab` | Indent (move under previous sibling) |
| `Shift + Tab` | Outdent (move to parent level) |
| `Backspace` (at start) | Outdent or convert to paragraph |

### 9.5 Nested List Structure

```html
<ul>
    <li>Item 1
        <ul>
            <li>Nested Item 1.1</li>
            <li>Nested Item 1.2</li>
        </ul>
    </li>
    <li>Item 2</li>
</ul>
```

### 9.6 List Styling

- Bullet/number color inherits from first character of first item
- Stroke properties apply to entire text layer
- Font weight changes apply to associated bullet/number

---

## 10. Placeholder System

### 10.1 Placeholder Characteristics

```javascript
{
    isPlaceholder: true,
    placeholderType: 'title' | 'subtitle' | 'body' | 'text' | 'date' | 'slideNumber' | 'footer',
    content: '<p>Click to add title</p>',
    hasUserContent: false,
    fromMaster: true  // Indicates element inherits from master
}
```

### 10.2 Placeholder Types & Default Prompts

| Type | Default Prompt |
|------|----------------|
| `title` | "Click to add title" |
| `subtitle` | "Click to add subtitle" |
| `body` | "Click to add text" |
| `text` | "Click to add text" |
| `date` | "Date" |
| `slideNumber` | "#" |
| `footer` | "Footer text" |

### 10.3 Placeholder States

| State | Visual | Content | Behavior |
|-------|--------|---------|----------|
| Empty (showing prompt) | Dashed border, 50% opacity | Prompt text | Clicking enters edit mode |
| Selected (empty) | Selection box, no dashed border | Prompt text | Double-click enters edit mode |
| Editing | No special styling | Empty or user content | Normal editing |
| Filled | Normal | User content | Normal selection/editing |

### 10.4 Placeholder Interaction Flow

```
[Empty Placeholder on Slide]
    ↓ Single Click
[Selected (Shows prompt, no dashed border)]
    ↓ Double Click / Enter Key
[Edit Mode (Prompt cleared, ready to type)]
    ↓ User types content
[Edit Mode with User Content]
    ↓ Escape / Click Outside
[Normal Text Element (hasUserContent: true)]

Alternative: User exits without typing
[Edit Mode (Empty)]
    ↓ Escape / Click Outside
[Empty Placeholder (Prompt text reappears)]
```

### 10.5 Edit Entry for Placeholders

```javascript
// PlaceholderManager.prepareForEdit()
if (isPlaceholder && isEmptyPlaceholder) {
    // Clear DOM content for typing
    domElement.textContent = '';
    return { _wasEmpty: true };
}
```

### 10.6 Edit Exit for Placeholders

| Content State | Action |
|---------------|--------|
| User entered content | Save content, mark `hasUserContent: true` |
| Empty (no user input) | Restore prompt text, `hasUserContent: false` |
| Whitespace only | Treat as empty, restore prompt |

### 10.7 Inherited Placeholders (from Master)

When a slide uses a master layout:
1. Placeholders are rendered from master definition
2. On double-click of inherited placeholder:
   - `INSTANTIATE_PLACEHOLDER` action is dispatched
   - Element is copied to slide's local elements
   - Edit mode is then entered on the local copy
3. Changes only affect the slide instance, not the master

### 10.8 Prompt Text Patterns

```javascript
const promptPatterns = [
    'Click to add',
    'Click to edit Master'
];
```

---

## 11. IME & International Input

### 11.1 IME Composition Handling

- **Composition Start**: Block certain actions (formatting, exit)
- **Composition Update**: Allow text updates
- **Composition End**: Resume normal operation

### 11.2 Blocked Actions During IME

```javascript
if (imeHandler.isCompositionInProgress()) {
    // Block: formatting, exit, undo/redo
    return;
}
```

### 11.3 IME Integration Points

1. `enterEditMode()`: Attach IME handler
2. `exitEditMode()`: Block exit during composition
3. `_handleInput()`: Skip during composition
4. `applyFormat()`: Block during composition
5. `_handleKeyDown()`: Allow composition keys through

---

## 12. Property Inspector Integration

### 12.1 Control Locations

| Section | Controls |
|---------|----------|
| **LayoutSection** | Auto Size / Fixed Width / Fixed Size buttons, W/H inputs |
| **TextSection** | Font family, weight, size, color, line height, letter spacing, alignment (6 buttons), type settings |

### 12.2 Selection Preservation Flow

```
1. User clicks PI control
2. Blur event fires on text element
3. Check if relatedTarget is in PI
4. If yes: saveSelection() and return (don't exit)
5. PI control action executes
6. restoreSelection() is called
7. Text element retains focus
```

### 12.3 Live Updates

- All PI changes update element immediately
- Changes during editing update DOM directly
- Store is updated on edit exit or via PI (non-editing)

---

## 13. Undo/Redo Behavior

### 13.1 History Session

- Session begins on `enterEditMode()`
- Session ends on `exitEditMode()`
- All changes within session are grouped

### 13.2 Granularity

| Change Type | Undo Behavior |
|-------------|---------------|
| Character input | Debounced (word-level) |
| Formatting | Single action |
| Paste | Single action |
| List creation | Single action |

### 13.3 Cross-Session

- Each edit session is one history entry
- Undo after exit reverts entire session
- Redo restores entire session

---

## 14. Edge Cases & Error Handling

### 14.1 Element Not Found

```javascript
if (!elementData) {
    console.warn('TextEditManager: Element not found');
    return false;
}
```

### 14.2 Concurrent Editing Attempt

```javascript
if (this.isEditing && this.currentElementId !== elementId) {
    this.exitEditMode();
}
```

### 14.3 Focus Loss Recovery

```javascript
// Timeout allows click handlers to execute first
setTimeout(() => {
    if (this.isEditing && !this.currentElement.contains(document.activeElement)) {
        this.exitEditMode({ keepSelection: false });
    }
}, 100);
```

### 14.4 Paste Sanitization

#### Allowed HTML Elements

| Category | Elements |
|----------|----------|
| Structure | `p`, `div`, `br` |
| Formatting | `b`, `strong`, `i`, `em`, `u`, `s`, `del`, `sub`, `sup` |
| Inline | `span` |
| Lists | `ul`, `ol`, `li` |

#### Allowed CSS Properties

- Typography: `font-size`, `font-family`, `font-weight`, `font-style`, `text-decoration`, `text-align`
- Color: `color`, `background-color`
- Spacing: `line-height`, `letter-spacing`

#### Sanitization Rules

1. HTML content is parsed into DOM
2. Non-allowed elements are unwrapped (children preserved)
3. Non-allowed attributes are removed
4. Style attributes are filtered to allowed CSS properties
5. Maximum nesting depth enforced (security)
6. Plain text fallback: newlines converted to `<br>`

### 14.5 Empty Content Handling

- Click-created elements with no input are deleted
- Placeholders revert to prompt text
- Regular elements retain empty state

---

## Appendix A: Event Flow Diagrams

### A.1 Text Creation Flow

```
User clicks with Text tool
    ↓
CanvasManager._handleCreationComplete()
    ↓
Determine creation type (click vs drag)
    ↓
Set resizing mode (autoSize vs fixed)
    ↓
store.dispatch('ADD_ELEMENT')
    ↓
store.dispatch('UPDATE_SELECTION')
    ↓
store.dispatch('SET_ACTIVE_TOOL', 'select')
    ↓
store.dispatch('SET_EDITING_ELEMENT', { isNewlyCreated: true })
    ↓
TextEditManager.enterEditMode()
    ↓
User can now type
```

### A.2 Edit Exit Flow

```
Exit trigger (Escape / Ctrl+Enter / Click outside)
    ↓
TextEditManager.exitEditMode()
    ↓
Block if IME composing
    ↓
Get sanitized content
    ↓
Handle placeholder logic
    ↓
Remove contentEditable
    ↓
End history session
    ↓
Save to store (or discard)
    ↓
Handle empty element deletion
    ↓
Clear internal state
```

### A.3 Resize Anchoring Flow

```
Content changes (typing)
    ↓
ResizeObserver triggers
    ↓
TextElement.handleResize()
    ↓
Check resizing mode
    ↓
Calculate new dimensions
    ↓
Get alignment settings
    ↓
Calculate factors (h: 0/0.5/1, v: 0/0.5/1)
    ↓
Calculate position adjustment
    ↓
If editing: Update DOM directly + emit event
Else: store.dispatch('UPDATE_ELEMENT')
```

---

## Appendix B: Test Scenarios

### B.1 Creation Tests

- [ ] Click creates autoSize element
- [ ] Drag creates fixed element
- [ ] Master mode click creates fixed element
- [ ] Shift+drag creates square element
- [ ] New element enters edit mode immediately
- [ ] New element has select-all selection

### B.2 Resizing Mode Tests

- [ ] Auto Size: both dimensions follow content
- [ ] Fixed Width: height follows content, width fixed
- [ ] Fixed Size: both dimensions fixed, content can overflow
- [ ] Mode change updates PI input states
- [ ] Manual resize changes mode to fixed

### B.3 Anchoring Tests

- [ ] Left align + width increase: element stays left
- [ ] Center align + width increase: element stays centered
- [ ] Right align + width increase: element stays right
- [ ] Top align + height increase: element stays top
- [ ] Middle align + height increase: element stays middle
- [ ] Bottom align + height increase: element stays bottom
- [ ] Combined alignment (e.g., center+middle) works correctly

### B.4 Edit Mode Tests

- [ ] Double-click enters edit mode with caret at click
- [ ] Enter key enters edit mode with select-all
- [ ] Typing does NOT enter edit mode
- [ ] Escape exits without saving
- [ ] Ctrl+Enter exits with saving
- [ ] Tab exits and selects next element
- [ ] Click outside exits with saving

### B.5 Formatting Tests

- [ ] Ctrl+B toggles bold
- [ ] Ctrl+I toggles italic
- [ ] Ctrl+U toggles underline
- [ ] Ctrl+Shift+X toggles strikethrough
- [ ] Formatting blocked during IME

### B.6 List Tests

- [ ] "- " auto-converts to bullet list
- [ ] "1. " auto-converts to numbered list
- [ ] Tab indents list item

---

## Appendix C: Implementation Audit (Input Isolation)

This section captures the required invariants and the current places in code that can violate them.

### C.1 Keyboard Routing

- Global key handler: `src/core/CanvasManager.js` (`window.addEventListener('keydown', ...)`)
    - Risk: relies on `InputManager.shouldBlockShortcut()` which depends on focus.
    - Requirement: when `state.editor.editingElementId` is set, global canvas shortcuts MUST be blocked even if focus temporarily moves to non-input UI.
- Input focus heuristic: `src/core/InputManager.js`
    - Purpose: blocks global shortcuts when focused in an input/contenteditable.
    - Limitation: not sufficient alone for edit isolation.
- Text key handler: `src/core/text/TextEditManager.js` (`keydown` capture listener)
    - Allowed overrides (explicit):
        - `Escape` (cancel + exit)
        - `Ctrl/Cmd+Enter` (commit + exit)
        - Optional formatting shortcuts (bold/italic/underline/strikethrough)
        - Optional list indentation behavior
    - Disallowed: intercepting arrow keys/caret navigation or re-implementing click selection.

### C.2 Mouse Routing / Overlay

- Canvas interaction surface: `#interaction-canvas`
    - Requirement: MUST NOT block pointer events intended for the editable text element while in text edit mode.
    - If the overlay remains above the text, native click/dblclick selection will fail and the app will be forced to emulate it.

### C.3 Caret Placement on Entry (Double-Click)

- Double-click edit entry is initiated from `src/core/CanvasManager.js` (hit-test driven).
- Because the initiating event may land on an overlay instead of the text node, the implementation MAY set caret once on entry using browser APIs:
    - `document.caretRangeFromPoint(x, y)` (Chromium/WebKit)
    - `document.caretPositionFromPoint(x, y)` (Firefox)
- Guardrail: this caret placement is a **bridge** for entry only; subsequent in-edit clicks should be native.

---

## Appendix D: Playwright DOM Validation Checklist

These are the invariants tests should assert so manual verification is unnecessary.

### D.1 Enter Edit Mode

- `contenteditable="true"` is set on the correct `.slide-element[data-element-id=...]`
- `window.getSelection()` exists and anchors inside the element

### D.2 Isolation: No Canvas Shortcuts While Editing

- While editing, pressing Arrow keys updates selection/caret (selection changes) and does NOT move the element in store.
- While not editing, pressing Arrow keys nudges the element in store.

### D.3 Mouse Selection Semantics (Native)

- Single click inside editable places a collapsed selection (`isCollapsed === true`)
- Double click creates a non-collapsed selection (`isCollapsed === false`) and selection text length increases
- Triple click expands selection further (selected text length increases vs double click)

### D.4 Double-Click Entry Caret Correctness

- After double-click entry, the selection range start equals `caretRangeFromPoint()` for the same coordinates (when range is within the element).

### D.5 Empty Text Caret Baseline

- With empty content, caret renders on the first line (not vertically centered).
- Implementation hint: ensure the editable element has a stable line box when empty (e.g. `<br>` and/or `min-height: 1em`), and avoid vertical-centering styles.
- [ ] Shift+Tab outdents list item
- [ ] Enter on empty item exits/outdents
- [ ] Backspace at start outdents
- [ ] Maximum 5 indentation levels

### B.7 Placeholder Tests

- [ ] Placeholder shows prompt text when empty
- [ ] Placeholder has dashed border when empty
- [ ] Placeholder clears prompt on edit entry
- [ ] Placeholder restores prompt if exited empty
- [ ] Placeholder shows normal styling when filled
- [ ] Inherited placeholder instantiates on edit
- [ ] hasUserContent flag updates correctly

### B.8 Selection Tests

- [ ] Single click places caret
- [ ] Double click selects word
- [ ] Triple click selects line/paragraph
- [ ] Quadruple click selects all
- [ ] Click+drag creates selection range
- [ ] Shift+click extends selection
- [ ] Ctrl+A selects all in edit mode
- [ ] Selection persists when clicking PI controls
- [ ] Selection restores after PI interaction

### B.9 IME Tests

- [ ] IME composition renders correctly
- [ ] Exit blocked during composition
- [ ] Formatting blocked during composition
- [ ] Composition completes properly
- [ ] Chinese/Japanese/Korean input works

### B.10 Clipboard Tests

- [ ] Copy preserves formatting
- [ ] Cut preserves formatting
- [ ] Paste with formatting works
- [ ] Paste as plain text strips formatting
- [ ] External content is sanitized
- [ ] Images in paste are stripped

### B.11 Property Inspector Tests

- [ ] Font family changes apply immediately
- [ ] Font size changes apply immediately
- [ ] Color changes apply immediately
- [ ] Alignment changes apply immediately
- [ ] Changes apply to selection in edit mode
- [ ] Changes apply to entire element in object mode
- [ ] W/H inputs disabled based on resizing mode

---

## Appendix C: Figma Feature Comparison

| Feature | Figma | Story | Status | Notes |
|---------|-------|-------|--------|-------|
| Auto Width | ✓ | ✓ | ✅ | `autoSize` - Click-to-create |
| Auto Height | ✓ | ✓ | ✅ | `fixedWidth` - Width fixed, height auto |
| Fixed Size | ✓ | ✓ | ✅ | `fixed` - Both dimensions fixed |
| Horizontal Align | L/C/R/Justify | L/C/R | ⚠️ | Justify not implemented |
| Vertical Align | T/M/B | T/M/B | ✅ | Full support |
| Alignment-based Anchoring | ✓ | ✓ | ✅ | Position adjusts on resize |
| Bold/Italic/Underline | ✓ | ✓ | ✅ | Keyboard shortcuts |
| Strikethrough | ✓ | ✓ | ✅ | Ctrl+Shift+X |
| Bulleted Lists | ✓ | ✓ | ✅ | Auto-detection supported |
| Numbered Lists | ✓ | ✓ | ✅ | Auto-detection supported |
| List Indentation | 5 levels | 5 levels | ✅ | Tab/Shift+Tab |
| List Spacing | ✓ | ✗ | ❌ | Not implemented |
| Paragraph Spacing | ✓ | ✓ | ✅ | Via TypeSettingsFlyout |
| OpenType Features | ✓ | Partial | ⚠️ | Via TypeSettingsFlyout |
| Variable Fonts | ✓ | ✓ | ✅ | Via FontManager |
| Truncation | ✓ | ✗ | ❌ | Not implemented |
| Max Lines | ✓ | ✗ | ❌ | Not implemented |
| Hanging Punctuation | ✓ | ✗ | ❌ | Not implemented |
| Hanging Lists | ✓ | ✗ | ❌ | Not implemented |
| Text Decoration | ✓ | Partial | ⚠️ | Via TypeSettingsFlyout |
| Text Case Transform | ✓ | ✓ | ✅ | Via TypeSettingsFlyout |
| Superscript/Subscript | ✓ | ✓ | ✅ | Via inline formatting |
| Text Styles | ✓ | ✓ | ✅ | Style dropdown in PI |
| Text Style Overrides | ✓ | ✓ | ✅ | Override indicator |
| Placeholder System | ✓ | ✓ | ✅ | Master slide support |
| Rich Paste | ✓ | ✓ | ✅ | With sanitization |
| IME Support | ✓ | ✓ | ✅ | Via IMEHandler |

### Legend
- ✅ Fully implemented
- ⚠️ Partially implemented  
- ❌ Not implemented

---

## Appendix D: Implementation Checklist

### D.1 Core Files Verified

- [x] `TextElement.js` - handleResize implements anchoring correctly
- [x] `LayoutSection.js` - Updates resizing mode and input states
- [x] `TextSection.js` - Updates textAlign and verticalAlign
- [x] `TextEditManager.js` - Handles edit lifecycle
- [x] `SelectionManager.js` - Saves/restores selection
- [x] `PlaceholderManager.js` - Handles placeholder lifecycle
- [x] `ContentSanitizer.js` - Sanitizes paste content
- [x] `IMEHandler.js` - Handles international input
- [x] `CanvasManager.js` - Handles text creation

### D.2 Integration Points

- [x] Store actions (ENTER_TEXT_EDIT, EXIT_TEXT_EDIT, SAVE_TEXT_CONTENT)
- [x] History system integration (HistoryBridge)
- [x] Property Inspector synchronization
- [x] Selection system (UPDATE_SELECTION)
- [x] Live resize events (element-live-resize)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-XX | Initial comprehensive specification |
| 1.1 | 2025-01-XX | Added visual states, selection behaviors, clipboard shortcuts |
| 1.2 | 2025-01-XX | Enhanced placeholder documentation, added test scenarios |
| 1.3 | 2025-01-XX | Added implementation checklist, feature comparison updates |
