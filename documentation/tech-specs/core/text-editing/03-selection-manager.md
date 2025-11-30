# SelectionManager - Text Selection Handling

## 1. Purpose

Save and restore text selection within contenteditable elements. Critical for Property Inspector interactions where focus leaves the text element but selection must be preserved.

## 2. Problem Being Solved

When user clicks in Property Inspector to change font size:
1. Focus leaves contentEditable → selection is lost
2. User changes value → should apply to previously selected text
3. Without selection save/restore, the change applies to nothing or the wrong text

## 3. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Save Selection | Capture current selection state as serializable object |
| Restore Selection | Reconstruct selection from saved state |
| Positioning | Place caret at specific locations (start, end, click point) |
| Query | Get selected text, check if selection exists |
| Style Query | Get computed styles at selection for Property Inspector |

## 4. Selection State Structure

Saved selection contains:
- **anchorNodePath**: Array of child indices from container to anchor node
- **anchorOffset**: Character offset within anchor node
- **focusNodePath**: Array of child indices from container to focus node  
- **focusOffset**: Character offset within focus node
- **isCollapsed**: Whether it's a caret (true) or range (false)

Using node paths instead of node references because DOM nodes may change between save and restore.

## 5. Save Selection Approach

1. Get current browser selection
2. Verify selection is within our container element
3. Calculate path from container to anchor/focus nodes
4. Return serializable state object

**Edge case**: If selection is outside container, return null.

## 6. Restore Selection Approach

1. Walk node paths to find anchor and focus nodes
2. If nodes no longer exist, fall back to placing caret at end
3. Clamp offsets to valid range (content may have changed)
4. Create range and set browser selection

**Edge case**: If structure changed dramatically, gracefully fall back rather than crash.

## 7. Caret Positioning Methods

| Method | Use Case |
|--------|----------|
| selectAll | Cmd+A, or when applying style to all text |
| placeCaretAtPoint | Double-click entry, place caret at click location |
| placeCaretAtStart | Enter via keyboard, start typing at beginning |
| placeCaretAtEnd | Default fallback, append to existing content |

### Click-to-Caret

Use `document.caretRangeFromPoint(x, y)` (Chrome/Safari) or `document.caretPositionFromPoint(x, y)` (Firefox) to place caret at click location.

## 8. Style Query Approach

**getSelectionStyles()**: Walk up from selection anchor to find containing element, return computed styles:
- bold (fontWeight >= 700)
- italic (fontStyle === 'italic')
- underline (textDecoration includes 'underline')
- fontSize, fontFamily, color

**getMixedState()**: For multi-character selection, check if styles vary across the selection. Return which properties have mixed values (for Property Inspector to show "-" or mixed indicator).

## 9. Browser Compatibility

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| caretRangeFromPoint | ✅ | ❌ | ✅ |
| caretPositionFromPoint | ❌ | ✅ | ❌ |
| Selection API | ✅ | ✅ | ✅ |

Need to handle both APIs for click-to-caret positioning.

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| Node removed after save | Fall back to placeCaretAtEnd |
| Text changed after save | Clamp offsets to valid range |
| Selection outside container | Return null on save |
| Empty container | Place caret at start |
| Nested formatting spans | Walk to text node level |

## 11. Integration Points

| Component | How it uses SelectionManager |
|-----------|------------------------------|
| TextEditManager | Save on PI focus, restore on PI change |
| Property Inspector | Query selection styles for display |
| Formatting toolbar | Query selection to show active states |
| Keyboard shortcuts | Apply formatting to current selection |

## 12. Open Questions

1. Should selection be saved to Store for potential undo of selection changes?
2. How to handle selection across multiple paragraphs for style detection?
3. Should there be a "selection history" for quick re-selection?
