# Comprehensive Text Editing Interaction Specification

> **Status note (2025-12-19):** This document is **deprecated** as a source of truth.
>
> Use the canonical spec: `documentation/specs/canvas/text-editing-interaction-comprehensive.md`.
>
> Rationale: we maintain a single browser-first “text edit isolation mode” contract and a single DOM-validation checklist to prevent drift.

**Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Deprecated (see canonical spec)  
**Industry Benchmark**: Figma, Keynote, PowerPoint

---

## Table of Contents

1. [Overview](#1-overview)
2. [Text Element Creation](#2-text-element-creation)
3. [Selection & Activation](#3-selection--activation)
4. [Resizing Modes & Anchoring Logic](#4-resizing-modes--anchoring-logic)
5. [Visual States & Cursor Behavior](#5-visual-states--cursor-behavior)
6. [Edit Mode Lifecycle](#6-edit-mode-lifecycle)
7. [Selection Behavior](#7-selection-behavior)
8. [Keyboard Interactions](#8-keyboard-interactions)
9. [List & Indentation System](#9-list--indentation-system)
10. [Placeholder System](#10-placeholder-system)
11. [Paste & Sanitization](#11-paste--sanitization)
12. [Property Inspector Controls](#12-property-inspector-controls)
13. [IME & International Input](#13-ime--international-input)
14. [Blur & Focus Handling](#14-blur--focus-handling)
15. [Master Slide Integration](#15-master-slide-integration)
16. [Test Scenarios](#16-test-scenarios)
17. [Industry Comparison](#17-industry-comparison)
18. [Implementation Reference](#18-implementation-reference)

---

## 1. Overview

This document defines the complete interaction model for text elements in the Story editor. It serves as the authoritative specification aligned with the current implementation and industry best practices.

### 1.1 Design Principles

1. **Predictable Behavior**: Text should grow and reflow in predictable ways
2. **Minimal Modes**: Reduce cognitive load with clear, distinct modes
3. **Industry Alignment**: Match user expectations from Figma, Keynote, PowerPoint
4. **Accessibility**: Support keyboard-only workflows and screen readers

### 1.2 Key Files

| File | Responsibility |
|------|----------------|
| `TextElement.js` | DOM rendering, ResizeObserver, anchoring calculations |
| `TextEditManager.js` | Edit lifecycle, formatting, lists, keyboard handling |
| `LayoutSection.js` | Resizing mode UI (Auto Size / Fixed Width / Fixed Size) |
| `TextSection.js` | Typography controls, alignment buttons |
| `PlaceholderManager.js` | Placeholder prompts, hasUserContent tracking |
| `ContentSanitizer.js` | HTML allowlist sanitization |
| `SelectionManager.js` | Selection save/restore for PI interaction |

---

## 2. Text Element Creation

### 2.1 Click to Create (Auto Size Mode)

| Aspect | Value |
|--------|-------|
| **Action** | Text Tool → Single click on canvas |
| **Resizing Mode** | `autoSize` |
| **Initial Width** | `auto` (CSS min: 1em) |
| **Initial Height** | `auto` (CSS min: 1em) |
| **Content** | Empty (shows placeholder) |
| **Position** | Click coordinates (adjusted by scroll/zoom) |
| **Immediate Behavior** | Enters edit mode, caret positioned |

**Implementation**: `CanvasManager._handleCreationComplete()` sets `resizing: 'autoSize'` when no drag occurred.

### 2.2 Drag to Create (Fixed Mode)

| Aspect | Value |
|--------|-------|
| **Action** | Text Tool → Drag rectangle on canvas |
| **Resizing Mode** | `fixed` |
| **Initial Width** | Drag width (minimum 20px) |
| **Initial Height** | Drag height (minimum 20px) |
| **Content** | Empty (shows placeholder) |
| **Immediate Behavior** | Enters edit mode, caret positioned |

**Implementation**: `CanvasManager._handleCreationComplete()` sets `resizing: 'fixed'` when drag dimensions detected.

### 2.3 Master Slide Text Creation

| Aspect | Value |
|--------|-------|
| **Action** | Add text in Master Mode |
| **Resizing Mode** | `fixed` |
| **Default Width** | 400px |
| **Default Height** | 80px |
| **Content** | Placeholder based on type (title/subtitle/body) |

---

## 3. Selection & Activation

### 3.1 Object Mode Selection

| Action | Result | Visual Feedback |
|--------|--------|-----------------|
| **Single Click** (unselected) | Select element | Blue bounding box with handles |
| **Single Click** (selected) | Enter edit mode | Caret appears, handles hidden |
| **Double Click** | Enter edit mode | Selects word at click position |
| **Triple Click** | Enter edit mode | Selects entire line/paragraph |
| **Click Away** | Deselect | Bounding box removed |

### 3.2 Edit Mode Activation

| Entry Method | Initial Selection State |
|--------------|------------------------|
| Single click (on selected element) | Caret at click position |
| Double click | Word at click position selected |
| Triple click | Line/paragraph selected |
| Keyboard (Enter key) | All content selected |
| From creation | Caret at start (placeholder visible) |

**Implementation**: `TextEditManager.enterEditMode(element, entryMode)` handles all entry scenarios.

### 3.3 Multi-Select Behavior

- Text elements can be part of multi-selection
- Editing is disabled when multiple elements selected
- Double-click on one element exits multi-select and enters edit mode

---

## 4. Resizing Modes & Anchoring Logic

### 4.1 Resizing Mode Definitions

| Mode | Property | Width Behavior | Height Behavior | Use Case |
|------|----------|----------------|-----------------|----------|
| **Auto Size** | `autoSize` | Expands with content | Expands with content | Headlines, labels |
| **Fixed Width** | `fixedWidth` | User-defined | Expands with content | Paragraphs, body text |
| **Fixed Size** | `fixed` | User-defined | User-defined | Constrained containers |

### 4.2 Anchoring Logic

When content changes cause dimension changes, the element anchors from a specific point based on alignment:

#### Horizontal Anchoring (based on `textAlign`)

| Text Align | Anchor Point | Growth Direction | Position Formula |
|------------|--------------|------------------|------------------|
| `left` | Left edge | → Right | `newX = currentX` |
| `center` | Center | ← → Both | `newX = currentX - (deltaWidth / 2)` |
| `right` | Right edge | ← Left | `newX = currentX - deltaWidth` |

#### Vertical Anchoring (based on `verticalAlign`)

| Vertical Align | Anchor Point | Growth Direction | Position Formula |
|----------------|--------------|------------------|------------------|
| `top` | Top edge | ↓ Down | `newY = currentY` |
| `middle` | Middle | ↑↓ Both | `newY = currentY - (deltaHeight / 2)` |
| `bottom` | Bottom edge | ↑ Up | `newY = currentY - deltaHeight` |

**Implementation**: `TextElement.handleResize()` uses ResizeObserver and calculates `horizontalFactor` / `verticalFactor` as 0, 0.5, or 1 based on alignment.

### 4.3 Dimension Constraints

| Mode | Width Constraint | Height Constraint |
|------|------------------|-------------------|
| Auto Size | min: 1em, max: none | min: 1em, max: none |
| Fixed Width | User value | min: 1em, max: none |
| Fixed Size | User value | User value (content clips) |

---

## 5. Visual States & Cursor Behavior

### 5.1 Element States

| State | Visual | Interaction Available |
|-------|--------|----------------------|
| **Unselected** | No border | Click to select |
| **Selected** | Blue border, resize handles | Move, resize, delete, enter edit |
| **Editing** | Blue border (no handles), text cursor | Type, format, select text |
| **Dragging** | Translucent, position preview | Release to place |
| **Resizing** | Dimension overlay, resize preview | Release to commit |

### 5.2 Cursor States

| Context | Cursor | Notes |
|---------|--------|-------|
| Hovering (Object mode) | `move` | Indicates draggable |
| Hovering (Edit mode) | `text` | I-beam cursor |
| Over resize handle | `nwse-resize`, `nesw-resize`, etc. | Directional |
| Over rotation handle | `grab` | (Future feature) |
| Text selection active | `text` | I-beam maintained |

---

## 6. Edit Mode Lifecycle

### 6.1 Entering Edit Mode

**Triggers**:
- Double-click on element
- Single click on already-selected element
- Press Enter with element selected
- Element creation (auto-enters edit mode)

**Process** (TextEditManager.enterEditMode):
1. Check for IME composition blocking
2. Exit any current editing session
3. Set `this.isEditing = true`
4. Store reference to `this.currentElement`
5. Set `contenteditable="true"` on text container
6. Clear placeholder if present
7. Focus the element
8. Set initial selection based on entry mode
9. Attach event listeners (keydown, input, paste, blur)

### 6.2 Exiting Edit Mode

**Triggers**:
- Press Escape
- Press Ctrl+Enter
- Click outside the element
- Select another element
- Blur event (with exceptions)

**Process** (TextEditManager.exitEditMode):
1. Check for IME composition blocking (block exit if active)
2. Save current content to element data
3. If content is empty, delete the element
4. Set `contenteditable="false"`
5. Remove event listeners
6. Restore placeholder if no content
7. Update `hasUserContent` flag
8. Set `this.isEditing = false`
9. Emit `text:editEnd` event

### 6.3 Blur Handling Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Click on Property Inspector | **Preserve** edit mode, save selection |
| Click on canvas (not on element) | Exit edit mode |
| Click on another element | Exit, select new element |
| Window loses focus | **Preserve** edit mode |
| Click on toolbar | **Preserve** edit mode (contextual) |

**Implementation**: `TextEditManager._handleBlur()` checks `event.relatedTarget` for Property Inspector containers.

---

## 7. Selection Behavior

### 7.1 Text Selection in Edit Mode

| Action | Result |
|--------|--------|
| Click | Place caret at position |
| Click + Drag | Select character range |
| Double-click | Select word |
| Triple-click | Select line/paragraph |
| Ctrl+A | Select all content |
| Shift+Arrow | Extend selection by character |
| Ctrl+Shift+Arrow | Extend selection by word |
| Shift+Home/End | Extend to line start/end |

### 7.2 Selection Preservation

When interacting with Property Inspector:
1. Selection is saved via `SelectionManager.save()`
2. PI interaction occurs
3. Selection restored via `SelectionManager.restore()`
4. Formatting applied to restored selection

**Implementation**: Uses node paths to serialize/deserialize selection ranges.

### 7.3 Selection Visual Feedback

| Context | Selection Color | Caret Color |
|---------|-----------------|-------------|
| Active editing | System highlight (::selection) | Black/inherit |
| Lost focus, preserved | Dimmed highlight | Hidden |

---

## 8. Keyboard Interactions

### 8.1 Navigation Keys

| Key | Normal | + Shift | + Ctrl | + Ctrl+Shift |
|-----|--------|---------|--------|--------------|
| ← | Move caret left | Extend selection left | Move by word | Extend by word |
| → | Move caret right | Extend selection right | Move by word | Extend by word |
| ↑ | Move to line above | Extend selection up | - | - |
| ↓ | Move to line below | Extend selection down | - | - |
| Home | Start of line | Extend to line start | Start of text | Extend to start |
| End | End of line | Extend to line end | End of text | Extend to end |

### 8.2 Formatting Shortcuts

| Shortcut | Action | Implementation |
|----------|--------|----------------|
| `Ctrl+B` | Toggle Bold | `document.execCommand('bold')` |
| `Ctrl+I` | Toggle Italic | `document.execCommand('italic')` |
| `Ctrl+U` | Toggle Underline | `document.execCommand('underline')` |
| `Ctrl+Shift+X` | Toggle Strikethrough | `document.execCommand('strikethrough')` |
| `Ctrl+Z` | Undo | Browser undo stack |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo | Browser redo stack |

### 8.3 Special Keys

| Key | Context | Behavior |
|-----|---------|----------|
| `Enter` | Normal text | Insert line break, grow height |
| `Enter` | In list | Create new list item |
| `Enter` | Empty list item | Exit list, continue as paragraph |
| `Shift+Enter` | Any | Soft line break (no new paragraph) |
| `Escape` | Edit mode | Exit edit mode, commit changes |
| `Ctrl+Enter` | Edit mode | Exit edit mode, commit changes |
| `Tab` | In list | Indent list item (max 5 levels) |
| `Shift+Tab` | In list | Outdent list item |
| `Tab` | Normal text | Insert tab character or navigate |
| `Backspace` | Start of list item | Outdent or convert to paragraph |
| `Delete` | End of content | Standard delete behavior |

**Implementation**: `TextEditManager._handleKeyDown()` processes all keyboard events.

---

## 9. List & Indentation System

### 9.1 List Types

| Type | Trigger Pattern | HTML Element | Visual |
|------|-----------------|--------------|--------|
| Bulleted | Type `- ` | `<ul><li>` | • |
| Numbered | Type `1. ` | `<ol><li>` | 1. |
| Lettered | Type `a. ` | `<ol type="a"><li>` | a. |

### 9.2 Auto-Detection

When typing at the start of a line:
- `- ` → Converts to bulleted list
- `1. ` → Converts to numbered list
- `a. ` → Converts to lettered list

**Implementation**: `TextEditManager._checkListAutoDetection()` monitors input events.

### 9.3 Indentation Levels

| Level | Margin | Max Allowed |
|-------|--------|-------------|
| 1 | 0 | - |
| 2 | 24px | - |
| 3 | 48px | - |
| 4 | 72px | - |
| 5 | 96px | Maximum |

### 9.4 List Keyboard Behaviors

| Key | Context | Behavior |
|-----|---------|----------|
| Tab | In list item | Indent (if < level 5) |
| Shift+Tab | In list item | Outdent |
| Backspace | Empty list item | Outdent or exit list |
| Backspace | Start of list item (with content) | Merge with previous |
| Enter | End of list item | Create new item |
| Enter | Empty list item | Exit list mode |
| Enter+Enter | End of list | Exit list, new paragraph |

### 9.5 List Nesting Rules

- Maximum 5 levels of nesting
- Each indent creates a nested `<ul>` or `<ol>`
- Tab at max level is ignored
- Shift+Tab at level 1 converts to paragraph

---

## 10. Placeholder System

### 10.1 Placeholder Types

| Element Type | Placeholder Text | Color |
|--------------|------------------|-------|
| Generic Text | "Type something" | Gray (#888) |
| Title (Master) | "Title" | Gray (#888) |
| Subtitle (Master) | "Subtitle" | Gray (#888) |
| Body (Master) | "Body text" | Gray (#888) |

### 10.2 Placeholder Lifecycle

| State | Placeholder Visible | hasUserContent |
|-------|---------------------|----------------|
| Newly created | Yes | false |
| First character typed | No | true |
| All content deleted | Yes | false |
| Content exists | No | true |
| In edit mode (empty) | No (caret visible) | false |

### 10.3 Placeholder Behavior

1. **Enter Edit Mode**: Placeholder hidden, caret shown
2. **Type First Character**: `hasUserContent = true`
3. **Delete All Content**: Placeholder reappears after exit
4. **Exit Empty**: Element deleted (normal) OR placeholder restored (master)

**Implementation**: `PlaceholderManager.prepareForEdit()` and `handleEditExit()` manage lifecycle.

---

## 11. Paste & Sanitization

### 11.1 Paste Sources

| Source | Handling |
|--------|----------|
| Plain text | Insert directly |
| Rich text (HTML) | Sanitize, then insert |
| Word/Docs | Strip proprietary formatting, sanitize |
| Code | Insert as plain text |

### 11.2 Allowed HTML Elements

| Element | Purpose | Preserved |
|---------|---------|-----------|
| `<p>` | Paragraph | ✓ |
| `<div>` | Block container | ✓ |
| `<br>` | Line break | ✓ |
| `<b>`, `<strong>` | Bold | ✓ |
| `<i>`, `<em>` | Italic | ✓ |
| `<u>` | Underline | ✓ |
| `<s>`, `<del>` | Strikethrough | ✓ |
| `<sub>` | Subscript | ✓ |
| `<sup>` | Superscript | ✓ |
| `<span>` | Inline container | ✓ (with style restrictions) |
| `<ul>`, `<ol>`, `<li>` | Lists | ✓ |

### 11.3 Stripped Elements

- `<script>`, `<style>` - Security
- `<img>`, `<video>`, `<audio>` - Media not allowed in text
- `<table>`, `<form>` - Complex structures
- `<a>` - Links (may be allowed in future)
- All event attributes (`onclick`, etc.)

### 11.4 Attribute Sanitization

**Allowed Attributes**:
- `style` (with restricted properties)
- `class` (may be stripped)

**Allowed Style Properties**:
- `font-weight`, `font-style`
- `text-decoration`
- `color` (may be restricted)

**Implementation**: `ContentSanitizer.sanitize(html)` uses allowlist approach.

---

## 12. Property Inspector Controls

### 12.1 Typography Section (TextSection.js)

| Control | Property | Range/Options |
|---------|----------|---------------|
| Font Family | `fontFamily` | System fonts + custom |
| Font Weight | `fontWeight` | 100-900, Normal, Bold |
| Font Size | `fontSize` | 1-999px |
| Text Color | `fill` | Color picker |
| Opacity | `opacity` | 0-100% |
| Line Height | `lineHeight` | Auto, 0.5-3x |
| Letter Spacing | `letterSpacing` | -10 to 100px |
| H Align | `textAlign` | Left, Center, Right |
| V Align | `verticalAlign` | Top, Middle, Bottom |

### 12.2 Layout Section (LayoutSection.js)

| Control | Property | States |
|---------|----------|--------|
| Auto Size | `resizing: 'autoSize'` | W/H inputs disabled |
| Fixed Width | `resizing: 'fixedWidth'` | W enabled, H disabled |
| Fixed Size | `resizing: 'fixed'` | W/H enabled |
| Width (W) | `width` | Number input |
| Height (H) | `height` | Number input |

### 12.3 PI Interaction During Editing

1. User clicks PI control while in edit mode
2. Selection is saved
3. PI control updates property
4. If formatting-related, apply to selection
5. Selection is restored
6. Focus returns to text

---

## 13. IME & International Input

### 13.1 IME Composition States

| State | Behavior |
|-------|----------|
| Composition Start | Block formatting, block exit |
| Composing | Show composition preview |
| Composition End | Commit text, unblock operations |

### 13.2 IME Handling Rules

- **During Composition**: Do not apply formatting shortcuts
- **During Composition**: Do not exit edit mode
- **Escape Key**: Cancel composition, do not exit
- **Enter Key**: Confirm composition, do not create newline

**Implementation**: `imeHandler` in TextEditManager tracks `isComposing` state.

### 13.3 Right-to-Left Support

- Text direction inherited from element style
- Cursor position respects RTL flow
- Alignment still uses left/center/right (logical mapping)

---

## 14. Blur & Focus Handling

### 14.1 Blur Scenarios

| Scenario | Behavior | Implementation |
|----------|----------|----------------|
| Click canvas | Exit edit mode | Standard blur handling |
| Click Property Inspector | **Stay** in edit mode | Check `relatedTarget` |
| Click toolbar | **Stay** in edit mode | Check `relatedTarget` |
| Click another element | Exit, select new | Blur + selection change |
| Window blur | **Stay** in edit mode | Ignore window blur |
| Tab to next element | Exit edit mode | Standard blur handling |

### 14.2 Focus Return

After PI interaction:
1. Call `element.focus()` 
2. Restore saved selection
3. Continue editing

### 14.3 EditorRenderer Blur Check

For batch text elements, verify blur belongs to current editing element:
```javascript
// Only handle blur if this element is actually the one being edited
```

---

## 15. Master Slide Integration

### 15.1 Master Slide Text Elements

| Property | Default Value |
|----------|---------------|
| Resizing | `fixed` |
| Width | 400px |
| Height | 80px |
| isPrototype | true |

### 15.2 Instance Behavior

- Instances inherit master formatting
- Content changes are local to instance
- Formatting changes can cascade from master

### 15.3 Empty Element Handling

| Context | Empty Behavior |
|---------|----------------|
| Normal Slide | Delete element |
| Master Slide | Keep element, show placeholder |
| Instance (overridden) | Revert to master content |

---

## 16. Test Scenarios

### 16.1 Creation Tests

| Test | Steps | Expected |
|------|-------|----------|
| Click create | Text tool → click canvas | Auto-size element, edit mode |
| Drag create | Text tool → drag 200x100 | Fixed 200x100, edit mode |
| Master create | Master mode → add text | Fixed 400x80, placeholder |

### 16.2 Resizing Mode Tests

| Test | Steps | Expected |
|------|-------|----------|
| Auto-size growth | Type long text | Width expands, anchors per alignment |
| Fixed-width wrap | Type in fixed-width | Text wraps, height grows |
| Fixed-size overflow | Type in fixed | Content overflows, size unchanged |
| Mode switch | Change Auto→Fixed | Dimensions locked at current |

### 16.3 Anchoring Tests

| Test | Setup | Steps | Expected |
|------|-------|-------|----------|
| Left-align anchor | Left-aligned, auto | Type text | Right edge expands |
| Center-align anchor | Center-aligned, auto | Type text | Both edges expand equally |
| Right-align anchor | Right-aligned, auto | Type text | Left edge expands |

### 16.4 List Tests

| Test | Steps | Expected |
|------|-------|----------|
| Auto-bullet | Type `- test` | Converts to bullet list |
| Auto-number | Type `1. test` | Converts to numbered list |
| Tab indent | Tab in list item | Indents one level |
| Max indent | Tab at level 5 | No change |
| Exit list | Enter on empty item | Exits list mode |

### 16.5 Blur/Focus Tests

| Test | Steps | Expected |
|------|-------|----------|
| PI interaction | Edit → click font size | Stay in edit, selection preserved |
| Canvas click | Edit → click empty canvas | Exit edit mode |
| Element switch | Edit A → click B | Exit A, select B |

---

## 17. Industry Comparison

### 17.1 Figma Feature Comparison

| Feature | Figma | Story | Notes |
|---------|-------|-------|-------|
| Auto Width | ✓ | ✓ (autoSize) | Equivalent |
| Auto Height | ✓ | ✓ (fixedWidth) | Equivalent |
| Fixed | ✓ | ✓ (fixed) | Equivalent |
| Truncate | ✓ | ✗ | Future feature |
| Max Lines | ✓ | ✗ | Future feature |
| Alignment Anchoring | ✓ | ✓ | Fully implemented |
| List Auto-detect | ✓ | ✓ | Pattern matching |
| Nested Lists (5 levels) | ✓ | ✓ | Implemented |
| Hanging Punctuation | ✓ | ✗ | Future feature |
| Variable Fonts | ✓ | Partial | Basic support |
| OpenType Features | ✓ | ✗ | Future feature |

### 17.2 Keynote/PowerPoint Comparison

| Feature | Keynote | PowerPoint | Story |
|---------|---------|------------|-------|
| Click to create | ✓ | ✓ | ✓ |
| Drag to create | ✓ | ✓ | ✓ |
| Auto-resize modes | ✓ | ✓ | ✓ |
| Bullet/Number lists | ✓ | ✓ | ✓ |
| Master slide text | ✓ | ✓ | ✓ |
| Text placeholders | ✓ | ✓ | ✓ |
| Rich paste | ✓ | ✓ | ✓ (sanitized) |

---

## 18. Implementation Reference

### 18.1 File Locations

```
src/core/text/
├── TextEditManager.js    # Edit lifecycle, keyboard, formatting
├── PlaceholderManager.js # Placeholder prompts, hasUserContent
├── ContentSanitizer.js   # HTML sanitization
├── SelectionManager.js   # Selection save/restore
└── imeHandler.js         # IME composition handling

src/core/renderer/elements/
└── TextElement.js        # DOM rendering, ResizeObserver, anchoring

src/ui/properties/
├── TextSection.js        # Typography controls
└── LayoutSection.js      # Resizing mode, dimensions

src/core/constants.js     # Timing, shortcuts, CSS classes
```

### 18.2 Key Methods

| Method | File | Purpose |
|--------|------|---------|
| `enterEditMode()` | TextEditManager.js | Start editing session |
| `exitEditMode()` | TextEditManager.js | End editing, save content |
| `handleResize()` | TextElement.js | Calculate anchored position |
| `_handleKeyDown()` | TextEditManager.js | Keyboard event processing |
| `_handleBlur()` | TextEditManager.js | Blur handling with PI detection |
| `applyListStyle()` | TextEditManager.js | Toggle list formatting |
| `sanitize()` | ContentSanitizer.js | Clean pasted HTML |
| `save()/restore()` | SelectionManager.js | Selection preservation |

### 18.3 Event Flow

```
User Action → Event Handler → State Update → DOM Update → Observer → Position Update
     │              │              │              │              │
     │              │              │              │              └── TextElement.handleResize()
     │              │              │              └── contenteditable updates
     │              │              └── Element properties updated
     │              └── TextEditManager methods
     └── Click/Keyboard/etc
```

### 18.4 Verification Checklist

- [x] `TextElement.js`: handleResize implements anchoring correctly
- [x] `LayoutSection.js`: Updates resizing mode, toggles input states  
- [x] `TextSection.js`: Updates textAlign and verticalAlign
- [x] `TextEditManager.js`: Handles enter/exit edit mode
- [x] `PlaceholderManager.js`: Manages placeholder lifecycle
- [x] `ContentSanitizer.js`: Sanitizes pasted content
- [x] `SelectionManager.js`: Preserves selection during PI interaction

---

*End of Specification*
