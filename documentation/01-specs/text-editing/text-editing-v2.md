# Text Editing System v2 - UX Specification

## 1. Overview

This specification defines a comprehensive, robust text editing system modeled after industry-leading tools (Figma, Keynote, Google Slides). The primary goals are:

1. **Reliability**: User content must never be lost unexpectedly
2. **Predictability**: Behavior matches user expectations from familiar tools
3. **Performance**: Leverage native browser text editing for speed
4. **Master/Slide Integration**: Seamless editing of placeholder content from masters

---

## 2. Text Object Types

### 2.1 Regular Text Objects
- Created by user via Text Tool or keyboard shortcut (`T`)
- Stored directly in slide's `elements` collection
- Can be freely created, edited, moved, deleted

### 2.2 Placeholder Text Objects (from Master Slide)
- Defined in Layout Master with `isPlaceholder: true`
- Instantiated on slides that use that layout
- **Initial State**: Shows ghost/prompt text (e.g., "Click to add title")
- **Edited State**: Contains user content, stored as override
- **Properties**:
  - `isPlaceholder`: `true` (indicates origin from master)
  - `placeholderType`: `'title' | 'subtitle' | 'body' | 'text' | 'picture' | 'date' | 'slideNumber'`
  - `masterId`: Reference to source master placeholder
  - `content`: User-entered content (or prompt text if empty)
  - `overrides`: Object containing any property overrides from master

### 2.3 Placeholder States

| State | Condition | Visual Appearance | Edit Behavior |
|-------|-----------|-------------------|---------------|
| **Empty** | Content is prompt text or empty | Dimmed, dashed border, ghost text | Double-click clears prompt, shows cursor |
| **Filled** | User has entered content | Normal appearance, no border | Double-click enters edit mode at cursor |
| **Customized** | Properties differ from master | Normal + optional indicator | Same as filled |

---

## 3. Interaction States

### 3.1 State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OBJECT MODE                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Unselected  │───>│   Selected   │───>│  Edit Mode   │              │
│  │              │<───│   (Object)   │<───│   (Text)     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│        │                    │                    │                      │
│   Click outside       Single click          Escape/                    │
│   Deselects            selects            Cmd+Enter                    │
│                                              exits                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Entering Edit Mode

| Trigger | From State | Result | Initial Selection |
|---------|------------|--------|-------------------|
| Double-click | Any | Edit mode | Caret at click position |
| Enter key | Object selected | Edit mode | All text selected |
| Start typing | Object selected | Edit mode | Replaces all content |
| Text Tool + click | Any | New text + edit mode | Cursor at start |

### 3.3 Exiting Edit Mode

| Trigger | Result | Content Handling |
|---------|--------|------------------|
| Escape | Exit, keep selection | Save content |
| Cmd/Ctrl + Enter | Exit, keep selection | Save content |
| Click outside text box | Exit, deselect | Save content |
| Click another object | Exit, select new | Save content |
| Tab (no list) | Exit, select next object | Save content |

### 3.4 Empty Element Behavior

| Scenario | Behavior |
|----------|----------|
| New text object, no typing, exit | Delete the empty object |
| Existing text, delete all content, exit | Delete the object |
| Placeholder, delete content, exit | Revert to prompt text, keep placeholder |
| Placeholder, never had content, exit | Keep placeholder with prompt text |

---

## 4. Placeholder Editing (Master Slide Integration)

### 4.1 Core Principle
Placeholders define structure; content comes from slides. Users should seamlessly edit placeholder content without thinking about the master/slide distinction.

### 4.2 Entering Placeholder Edit Mode

**When user double-clicks an empty placeholder:**
1. Clear the prompt/ghost text from DOM (visually)
2. Set `contenteditable = true`
3. Place cursor at start
4. Do NOT yet save to store (no content to save)

**When user double-clicks a filled placeholder:**
1. Enter edit mode normally
2. Place cursor at click position
3. Existing content remains

### 4.3 Saving Placeholder Content

**On blur/exit with content:**
1. Save content to slide's element (override master)
2. Clear `isEmptyPlaceholder` flag if present
3. Preserve `isPlaceholder` and `placeholderType`

**On blur/exit without content (empty):**
1. Restore prompt text to DOM
2. Mark as empty placeholder
3. Do NOT delete the placeholder element

### 4.4 Visual Indicators

| State | Visual Treatment |
|-------|------------------|
| Empty placeholder (edit mode) | Thin dashed border, no prompt text |
| Empty placeholder (object mode) | Dimmed text, dashed border, ghost prompt |
| Filled placeholder | Normal text, no special indicator |
| Placeholder from master in Layer Tree | Icon badge or "(Master)" label |

### 4.5 Layer Tree Integration

Placeholders should appear in the Layer Tree with special treatment:
- Icon indicating placeholder origin
- Collapsible group: "Master Elements" at bottom of layer list
- Can be hidden/shown per-placeholder
- Deleting a placeholder marks slide as using "Custom Layout"

---

## 5. Text Selection & Navigation

### 5.1 Mouse Selection

| Action | Result |
|--------|--------|
| Click | Place caret at click position |
| Click + Drag | Select character range |
| Double-click | Select word |
| Triple-click | Select paragraph/line |
| Quadruple-click | Select all |
| Shift + Click | Extend selection to click position |

### 5.2 Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| Arrow keys | Move caret by character/line |
| Cmd/Ctrl + Left/Right | Move to line start/end |
| Cmd/Ctrl + Up/Down | Move to text start/end |
| Opt/Alt + Left/Right | Move by word |
| Shift + [Navigation] | Extend selection |
| Cmd/Ctrl + A | Select all |

### 5.3 Selection Preservation

**CRITICAL**: Selection must be preserved during:
- Style changes (bold, italic, etc.)
- Property Inspector interactions
- Tool panel operations
- Focus returns to text after UI interaction

---

## 6. Content Management & Data Integrity

### 6.1 Content Never Lost Principle

User content must be protected at all times. Implement defensive measures:

1. **Auto-save on input**: Save content to store on every meaningful input event
2. **Debounced persistence**: Batch rapid changes, persist every 500ms
3. **Exit confirmation**: If content changed but not saved, force save on any exit path
4. **Undo support**: All content changes are undoable

### 6.2 Content Storage

```javascript
// Element content structure
{
  id: "element-123",
  type: "text",
  content: "<p>User's actual content</p>",  // HTML string
  
  // For placeholders
  isPlaceholder: true,
  placeholderType: "title",
  promptText: "<h1>Click to add title</h1>",  // Original prompt, never changes
  hasUserContent: true,  // Flag: has user ever typed here?
  
  // Styling (can override master)
  style: { ... },
  
  // Master reference
  masterElementId: "placeholder-title"  // Links to master definition
}
```

### 6.3 Save Points

Content is saved to store at these moments:
1. **On blur** (exit edit mode)
2. **Debounced during typing** (every 500ms of idle)
3. **Before any dispatch** that might re-render
4. **Before page unload**

### 6.4 Content Sanitization

On save, content is sanitized:
- Allow: `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`, `<s>`, `<ul>`, `<ol>`, `<li>`, `<span style="...">`, `<h1>`-`<h6>`
- Strip: Scripts, event handlers, external resources
- Preserve: Inline styles for formatting (color, font-size via spans)

---

## 7. Rich Text Formatting

### 7.1 Formatting Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + B | Toggle bold |
| Cmd/Ctrl + I | Toggle italic |
| Cmd/Ctrl + U | Toggle underline |
| Cmd/Ctrl + Shift + X | Toggle strikethrough |
| Cmd/Ctrl + Shift + 7 | Numbered list |
| Cmd/Ctrl + Shift + 8 | Bullet list |

### 7.2 Mixed Styles (Character Ranges)

Text can have mixed styles within a single element:
- Selection determines which characters receive style changes
- No selection: style applies to next typed characters
- Property Inspector shows mixed state when selection spans multiple styles

### 7.3 Style Inheritance

```
Theme Text Style
    ↓ (overridden by)
Master Placeholder Style
    ↓ (overridden by)
Slide Element Style
    ↓ (overridden by)
Inline Character Style (<span>)
```

---

## 8. List Management

### 8.1 Auto-Detection Triggers

| Pattern | Result |
|---------|--------|
| `- ` or `* ` at line start | Convert to bullet list |
| `1. ` or `1) ` at line start | Convert to numbered list |

### 8.2 List Behavior

| Action | Result |
|--------|--------|
| Enter on list item | New list item |
| Enter on empty list item | Exit list, convert to paragraph |
| Tab | Indent (increase nesting) |
| Shift + Tab | Outdent (decrease nesting) |
| Backspace at list item start | Convert to paragraph |

### 8.3 List Continuation

- Numbered lists auto-increment (1 → 2 → 3)
- Nested items maintain parent numbering context
- Copy/paste preserves list structure

---

## 9. Clipboard Operations

### 9.1 Copy

| Source | Clipboard Content |
|--------|-------------------|
| Text selection | HTML with inline styles + plain text fallback |
| Entire text object | Same as selection |

### 9.2 Cut

Same as copy, then delete selection.

### 9.3 Paste

| Source | Behavior |
|--------|----------|
| Plain text | Insert at caret, inherit current style |
| Rich text (internal) | Preserve all formatting |
| Rich text (external) | Match destination style for block, preserve bold/italic |
| Over selection | Replace selected text |

### 9.4 Paste and Match Style

`Cmd/Ctrl + Shift + V`: Paste as plain text, inheriting caret position style.

---

## 10. Layout & Resizing

### 10.1 Sizing Modes

| Mode | Width | Height | Text Wrap |
|------|-------|--------|-----------|
| Auto Size | Expands | Expands | No wrap (single line) |
| Fixed Width | Fixed | Expands | Wraps at width |
| Fixed Size | Fixed | Fixed | Wraps, may overflow |

### 10.2 Alignment Anchoring

Text box resizes anchor from alignment point:
- **Left align**: Anchor left edge
- **Center align**: Anchor center
- **Right align**: Anchor right edge
- Same logic for vertical alignment (top/middle/bottom)

### 10.3 Resize Handle Behavior

| Current Mode | Handle Drag | Result |
|--------------|-------------|--------|
| Auto Size | Any | Convert to Fixed Width or Fixed Size |
| Fixed Width | Width handles | Stay Fixed Width |
| Fixed Width | Height handles | Convert to Fixed Size |
| Fixed Size | Any | Stay Fixed Size |

---

## 11. Visual Feedback

### 11.1 Cursor

- **I-beam cursor** over text in edit mode
- **Accent color caret** (matches UI theme)
- **Blinking**: Standard 530ms on/off cycle

### 11.2 Selection Highlight

- **Color**: Semi-transparent accent (e.g., `rgba(24, 160, 251, 0.3)`)
- **Renders behind text** for readability

### 11.3 Text Box Bounds

| State | Visual |
|-------|--------|
| Object selected (not editing) | Standard selection handles |
| Edit mode | Thin blue outline, no resize handles |
| Empty placeholder | Dashed border, dimmed |

### 11.4 Placeholder Ghost Text

- **Opacity**: 50%
- **Style**: Italic or normal, matching placeholder type
- **Behavior**: Disappears entirely on edit mode entry, reappears on empty exit

---

## 12. Accessibility

### 12.1 Keyboard Support

- Full keyboard navigation (no mouse required)
- Standard text editing shortcuts
- Tab navigation between UI elements

### 12.2 Screen Reader

- Text elements have proper ARIA labels
- Edit mode announced on entry
- Selection changes announced

### 12.3 High Contrast

- Selection visible in all color modes
- Cursor visible against any background

---

## 13. Performance Considerations

### 13.1 Native Browser Editing

Use `contenteditable` with minimal intervention:
- Let browser handle cursor positioning
- Let browser handle text selection
- Let browser handle IME (Input Method Editor)
- Only intercept for custom behaviors (lists, shortcuts)

### 13.2 Render Optimization

- No store updates during active typing (use debounce)
- No full re-renders during edit mode
- Selection overlay updates via lightweight events
- Batch style changes

### 13.3 Large Text Handling

- Virtualize extremely long text if needed
- Lazy-render off-screen paragraphs
- Efficient diff for content updates

---

## 14. Text Style Presets

### 14.1 Overview

The theme defines text styles (presets) like `title`, `heading1`, `body`, etc. Elements reference these via `styleId`.

### 14.2 Style Hierarchy

```
Text Style Preset (styleId)
    ↓ (overridden by)
Element Style (element.style)
    ↓ (overridden by)
Inline Character Style (<span>)
```

### 14.3 User Actions

| Action | Result |
|--------|--------|
| Apply style preset | Sets `styleId`, clears conflicting `element.style` |
| Change property (no selection) | Updates `element.style`, keeps `styleId` |
| Change property (with selection) | Creates inline `<span>` style |
| "Clear Formatting" | Removes inline spans, keeps `styleId` |
| "Detach from Style" | Moves preset props to `element.style`, clears `styleId` |

### 14.4 Mixed Styles Indicator

When selection spans multiple inline styles:
- Property shows "Mixed" placeholder
- Changing the value applies to entire selection
- Click reveals individual values (future)

### 14.5 Property Inspector Behavior

| State | Font Size Shows | Changing Font Size... |
|-------|-----------------|----------------------|
| No selection (object mode) | Element's effective size | Updates `element.style.fontSize` |
| Selection (edit mode), uniform | Selection's size | Wraps in `<span style="font-size">` |
| Selection (edit mode), mixed | "Mixed" | Wraps entire selection in `<span>` |

---

## 15. Multi-Element Editing

### 15.1 When Multiple Text Elements Selected

| Action | Behavior |
|--------|----------|
| Start typing | Enter edit mode on FIRST text element only |
| Enter key | Enter edit mode on FIRST text element |
| Double-click one | Enter edit mode on that element only |
| Property change | Apply to ALL selected elements |
| Apply style preset | Apply to ALL selected elements |
| Delete key | Delete ALL selected elements |

### 15.2 Mixed Element Types

When selection includes text + shapes:
- Typing does nothing (can't edit shapes)
- Property changes apply to all where applicable
- Style presets apply to text elements only

---

## 16. IME (Input Method) Support

### 16.1 Composition Behavior

During CJK input composition:
- **No auto-save** (would interrupt composition)
- **No keyboard shortcuts** (let IME handle keys)
- **No validation** (incomplete characters are normal)

### 16.2 Completion

When composition ends:
- Trigger normal input handling
- Resume auto-save debouncing
- Resume keyboard shortcut detection

---

## 17. Error Handling

### 17.1 Content Recovery

If edit session ends abnormally (crash, navigation):
- Auto-save draft to localStorage
- Prompt to restore on next load
- Never silently lose content

### 17.2 Invalid State Recovery

If text element gets into invalid state:
- Detect empty `content` with `hasUserContent = true`
- Prompt or auto-restore from last known good state
- Log for debugging

### 17.3 Undo/Redo Integration

| In Edit Mode | Outside Edit Mode |
|--------------|-------------------|
| Cmd+Z = browser undo (character-level) | Cmd+Z = app undo (full state) |
| Exit creates undo point | Undo restores previous content |

---

## 18. Known Issues & Fixes Required

Based on current bugs reported:

| Issue | Root Cause | Fix |
|-------|------------|-----|
| Placeholder text disappears on edit entry | Prompt text cleared, never restored | Store prompt separately, restore on empty exit |
| Text disappears on exit | Content not saved before blur | Save on every input, verify on blur |
| Master elements not editable | Placeholders not properly instantiated on slide | Ensure slide has copy of master elements |
| Can't delete master element | No mechanism to override/remove | Add "use custom layout" flow |

---

## 19. Migration Path

### 19.1 Breaking Changes

None - this spec extends existing behavior.

### 19.2 New Features Phased Rollout

1. **Phase 1**: Fix content loss bugs (save reliability)
2. **Phase 2**: Placeholder prompt text handling
3. **Phase 3**: Layer tree integration for master elements
4. **Phase 4**: Enhanced list editing
5. **Phase 5**: Full rich text support

---

## Appendix A: Comparison with Industry Tools

| Feature | This Spec | Figma | Keynote | Google Slides |
|---------|-----------|-------|---------|---------------|
| Double-click edit | ✓ | ✓ | ✓ | ✓ |
| Enter to edit | ✓ | ✓ | ✓ | ✓ |
| Escape to exit | ✓ | ✓ | ✓ | ✓ |
| Empty delete | ✓ | ✓ | ✓ | ✓ |
| Placeholder ghost text | ✓ | N/A | ✓ | ✓ |
| Mixed inline styles | ✓ | ✓ | ✓ | ✓ |
| Auto lists | ✓ | ✓ | ✓ | ✓ |
| Alignment anchoring | ✓ | ✓ | ✓ | ✓ |
| Style presets | ✓ | ✓ | ✓ | ✓ |
| IME support | ✓ | ✓ | ✓ | ✓ |

---

## Appendix B: Glossary

- **Caret**: The blinking text cursor
- **Edit Mode**: State where text can be edited character-by-character
- **Object Mode**: State where elements are selected/moved as wholes
- **Placeholder**: A text box defined in a master slide
- **Prompt Text**: Ghost text shown in empty placeholder ("Click to add...")
- **Override**: Slide-level property that differs from master
- **styleId**: Reference to a theme text style preset
- **IME**: Input Method Editor for CJK languages
