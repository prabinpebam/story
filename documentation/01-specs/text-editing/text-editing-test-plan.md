# Text Editing System - Test Plan

**Version**: 2.0  
**Last Updated**: December 2024  
**Companion Spec**: `text-editing-interaction-comprehensive.md`

---

## 1. Overview

This test plan ensures complete coverage of the text editing system as defined in the comprehensive specification. Tests are organized by feature area matching the spec sections.

### 1.1 Files Under Test

| File | Responsibility |
|------|----------------|
| `TextEditManager.js` | Edit lifecycle, formatting, lists, keyboard handling |
| `TextElement.js` | DOM rendering, ResizeObserver, anchoring calculations |
| `LayoutSection.js` | Resizing mode UI (Auto Size / Fixed Width / Fixed Size) |
| `TextSection.js` | Typography controls, alignment buttons |
| `PlaceholderManager.js` | Placeholder prompts, hasUserContent tracking |
| `ContentSanitizer.js` | HTML allowlist sanitization |
| `SelectionManager.js` | Selection save/restore for PI interaction |

### 1.2 Test File Locations

```
tests/
├── unit/
│   └── core/
│       ├── text/
│       │   ├── TextEditManager.test.js
│       │   ├── PlaceholderManager.test.js
│       │   ├── ContentSanitizer.test.js
│       │   ├── SelectionManager.test.js
│       │   └── IMEHandler.test.js
│       └── renderer/elements/
│           └── TextElement.test.js
├── integration/
│   └── text-editing/
│       ├── EditModeFlow.test.js
│       ├── ResizingAnchoring.test.js
│       └── PropertyInspectorSync.test.js
└── e2e/
    └── specs/functional/
        ├── text-creation.spec.ts
        ├── text-editing.spec.ts
        └── text-placeholder-lifecycle.spec.ts
```

---

## 2. Test Coverage by Spec Section

### 2.1 Text Element Creation (Spec §2)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Click to create | Creates autoSize element, enters edit mode | Critical |
| Drag to create | Creates fixed element with drag dimensions, enters edit mode | Critical |
| Minimum drag size | Enforces 20px minimum width/height | High |
| Master slide create | Creates fixed 400x80 element with placeholder | High |
| Position accuracy | Element positioned at click/drag coordinates (zoom-adjusted) | High |

### 2.2 Selection & Activation (Spec §3)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Single click (unselected) | Selects element, shows bounding box | Critical |
| Single click (selected) | Enters edit mode, caret at click | Critical |
| Double click | Enters edit mode, selects word at position | Critical |
| Triple click | Enters edit mode, selects line/paragraph | High |
| Click away | Deselects element | Critical |
| Enter key (selected) | Enters edit mode, selects all content | High |
| Multi-select behavior | Editing disabled when multiple selected | High |

### 2.3 Resizing Modes (Spec §4.1)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Auto Size - width | Expands horizontally with content | Critical |
| Auto Size - height | Expands vertically with content | Critical |
| Fixed Width - wrap | Text wraps, height expands | Critical |
| Fixed Width - width locked | Width doesn't change on typing | Critical |
| Fixed Size - both locked | Neither dimension changes | Critical |
| Fixed Size - overflow | Content visible but clips at boundary | High |
| Mode switch Auto→Fixed | Locks current dimensions | High |
| Mode switch Fixed→Auto | Releases constraints | High |

### 2.4 Anchoring Logic (Spec §4.2)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Left align + auto | Right edge expands, left fixed | Critical |
| Center align + auto | Both edges expand equally | Critical |
| Right align + auto | Left edge expands, right fixed | Critical |
| Top align + height change | Bottom edge expands, top fixed | Critical |
| Middle align + height change | Both edges expand equally | Critical |
| Bottom align + height change | Top edge expands, bottom fixed | Critical |
| Combined (center + middle) | Expands from center point | High |

### 2.5 Visual States (Spec §5)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Unselected state | No border visible | Medium |
| Selected state | Blue border with resize handles | High |
| Editing state | Blue border, no handles, text cursor | High |
| Cursor: object mode hover | `move` cursor | Medium |
| Cursor: edit mode | `text` cursor (I-beam) | Medium |
| Cursor: resize handles | Directional cursors | Medium |

### 2.6 Edit Mode Lifecycle (Spec §6)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Enter: double-click | Sets contenteditable, focuses, attaches listeners | Critical |
| Enter: click on selected | Caret at click position | Critical |
| Enter: from creation | Auto-enters edit mode | Critical |
| Exit: Escape | Saves content, exits edit mode | Critical |
| Exit: Ctrl+Enter | Saves content, exits edit mode | Critical |
| Exit: click outside | Saves content, deselects | Critical |
| Exit: click another element | Saves, selects new element | Critical |
| Exit: empty non-placeholder | Deletes element | Critical |
| Exit: empty placeholder | Keeps element, restores prompt | Critical |
| IME blocking | Blocks exit during composition | High |

### 2.7 Selection Behavior (Spec §7)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Click in text | Places caret at position | Critical |
| Click + drag | Selects character range | Critical |
| Double-click word | Selects word | High |
| Triple-click | Selects line/paragraph | High |
| Ctrl+A | Selects all content | High |
| Shift+Arrow | Extends selection by character | High |
| Ctrl+Shift+Arrow | Extends selection by word | Medium |
| Selection preservation | Saved/restored during PI interaction | Critical |

### 2.8 Keyboard Interactions (Spec §8)

#### Navigation Keys
| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Arrow keys | Move caret by character/line | High |
| Home/End | Move to line start/end | High |
| Ctrl+Home/End | Move to text start/end | Medium |
| Shift+navigation | Extend selection | High |

#### Formatting Shortcuts
| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Ctrl+B | Toggle bold | Critical |
| Ctrl+I | Toggle italic | Critical |
| Ctrl+U | Toggle underline | High |
| Ctrl+Shift+X | Toggle strikethrough | Medium |
| Ctrl+Z | Undo (browser stack) | High |
| Ctrl+Y | Redo | High |

#### Special Keys
| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Enter (normal) | Insert line break | Critical |
| Enter (in list) | Create new list item | Critical |
| Enter (empty list item) | Exit list mode | Critical |
| Shift+Enter | Soft line break | High |
| Escape | Exit edit mode | Critical |
| Ctrl+Enter | Exit edit mode | High |
| Tab (in list) | Indent (max 5 levels) | High |
| Shift+Tab (in list) | Outdent | High |
| Backspace (list start) | Outdent or convert to paragraph | High |

### 2.9 List & Indentation (Spec §9)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Auto-detect `- ` | Converts to bullet list | High |
| Auto-detect `1. ` | Converts to numbered list | High |
| Auto-detect `a. ` | Converts to lettered list | Medium |
| Tab indent | Increases nesting level | High |
| Tab at level 5 | No change (max reached) | High |
| Shift+Tab outdent | Decreases nesting level | High |
| Shift+Tab at level 1 | Converts to paragraph | High |
| Enter on empty item | Exits list mode | High |
| Backspace on empty item | Outdent or exit | High |
| List nesting structure | Creates nested `<ul>`/`<ol>` | High |

### 2.10 Placeholder System (Spec §10)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| New element placeholder | Shows "Type something" | High |
| Master title placeholder | Shows "Title" | High |
| Master subtitle placeholder | Shows "Subtitle" | High |
| Enter edit (empty) | Hides placeholder, shows caret | Critical |
| First character typed | Sets hasUserContent = true | Critical |
| Delete all content | Placeholder reappears on exit | Critical |
| Exit empty (normal) | Deletes element | Critical |
| Exit empty (placeholder) | Keeps element, restores prompt | Critical |

### 2.11 Paste & Sanitization (Spec §11)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Paste plain text | Inserts directly | Critical |
| Paste rich HTML | Sanitizes, then inserts | Critical |
| Preserve allowed tags | p, div, br, b, strong, i, em, u, etc. | Critical |
| Strip script tags | Removes completely | Critical |
| Strip event handlers | Removes onclick, etc. | Critical |
| Strip media tags | Removes img, video, audio | High |
| Preserve list structure | Keeps ul, ol, li | High |
| Sanitize styles | Only allows font-weight, font-style, etc. | High |

### 2.12 Property Inspector Controls (Spec §12)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Font family change | Updates element fontFamily | High |
| Font size change | Updates element fontSize | High |
| Font weight change | Updates element fontWeight | High |
| Text color change | Updates element fill | High |
| Line height change | Updates element lineHeight | High |
| Letter spacing change | Updates element letterSpacing | High |
| H align buttons | Updates textAlign (affects anchoring) | Critical |
| V align buttons | Updates verticalAlign (affects anchoring) | Critical |
| Auto Size button | Sets resizing: 'autoSize', disables W/H | Critical |
| Fixed Width button | Sets resizing: 'fixedWidth', enables W | Critical |
| Fixed Size button | Sets resizing: 'fixed', enables W/H | Critical |
| PI interaction during edit | Preserves selection, stays in edit mode | Critical |

### 2.13 IME & International Input (Spec §13)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Composition start | Sets isComposing flag | High |
| Composition end | Clears isComposing flag | High |
| Shortcuts during composition | Blocked | High |
| Exit during composition | Blocked | High |
| CJK input | Works correctly | High |

### 2.14 Blur & Focus Handling (Spec §14)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Click canvas | Exits edit mode | Critical |
| Click Property Inspector | Stays in edit mode | Critical |
| Click toolbar | Stays in edit mode | High |
| Click another element | Exits, selects new | Critical |
| Window loses focus | Stays in edit mode | High |
| Focus return after PI | Restores selection | Critical |

### 2.15 Master Slide Integration (Spec §15)

| Test Case | Expected Behavior | Priority |
|-----------|-------------------|----------|
| Master text default size | 400x80 fixed | High |
| Instance inherits master | Formatting cascades | High |
| Instance content local | Content changes don't affect master | High |
| Empty instance behavior | Reverts to master content | High |

---

## 3. Integration Test Scenarios

### 3.1 Full Edit Flow
1. Create text element (click)
2. Type content
3. Apply formatting (Ctrl+B)
4. Change alignment (center)
5. Verify anchoring shifts element
6. Exit edit mode
7. Verify content persisted

### 3.2 Placeholder Lifecycle
1. Double-click empty placeholder
2. Verify prompt cleared
3. Exit without typing
4. Verify prompt restored
5. Double-click again
6. Type content
7. Exit
8. Verify content persisted
9. Re-enter and delete all
10. Verify prompt restored

### 3.3 Resizing Mode Transitions
1. Create auto-size text
2. Type long content, verify expansion
3. Switch to Fixed Width
4. Verify text wraps
5. Type more, verify height grows
6. Switch to Fixed Size
7. Type more, verify overflow

### 3.4 PI Interaction During Edit
1. Enter edit mode
2. Select text range
3. Click font size in PI
4. Verify selection preserved
5. Change value
6. Verify applied to selection
7. Verify still in edit mode

---

## 4. Critical Paths (100% Coverage Required)

1. **Content saving on blur** - User content must never be lost
2. **Placeholder prompt restoration** - Empty placeholders must restore prompt
3. **Empty element deletion vs preservation** - Normal vs placeholder behavior
4. **Selection state save/restore** - PI interaction must not lose selection
5. **Anchoring calculations** - Element must anchor correctly per alignment
6. **IME composition handling** - Must not interrupt international input
7. **Resizing mode behavior** - Each mode must behave as specified

---

## 5. Test Coverage Requirements

| Component | Target Coverage |
|-----------|-----------------|
| TextEditManager | 90% |
| TextElement (anchoring) | 90% |
| PlaceholderManager | 95% |
| ContentSanitizer | 95% |
| SelectionManager | 85% |
| LayoutSection | 85% |
| TextSection | 85% |

---

## 6. Regression Checklist

After any changes, manually verify:

### Core Editing
- [ ] Double-click enters edit mode
- [ ] Escape exits edit mode  
- [ ] Content saved on exit
- [ ] Empty non-placeholder deleted
- [ ] Empty placeholder preserved

### Resizing & Anchoring
- [ ] Auto Size expands both ways
- [ ] Fixed Width wraps text
- [ ] Fixed Size clips content
- [ ] Left align anchors left
- [ ] Center align anchors center
- [ ] Right align anchors right

### Lists
- [ ] Auto-detect bullet `- `
- [ ] Auto-detect number `1. `
- [ ] Tab indents (max 5)
- [ ] Empty item exits list

### Blur Handling
- [ ] PI click preserves edit mode
- [ ] Canvas click exits edit mode
- [ ] Selection restored after PI

### IME
- [ ] CJK input works
- [ ] Shortcuts blocked during composition

---

*End of Test Plan*
