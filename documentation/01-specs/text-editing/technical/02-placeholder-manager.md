# PlaceholderManager - Master/Slide Placeholder Logic

## 1. Purpose

Handles all placeholder-specific behavior: prompt text display, empty state detection, and master/slide inheritance. This is a static utility class with no internal state.

## 2. Core Concepts

### Placeholder vs Regular Element
- **Placeholder**: Element defined in a master layout that shows prompt text when empty
- **Regular element**: User-created element with no special empty behavior

### hasUserContent Flag
Key flag on placeholder elements:
- `true`: User has entered content, show actual content
- `false`: No user content, show prompt text (e.g., "Click to add title")

### Override Tracking
When a slide element differs from its master element, we track which properties are overridden. This enables "Reset to Master" functionality.

## 3. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Detection | Determine if element is a placeholder, if it's empty |
| Prompt Text | Provide appropriate prompt text for each placeholder type |
| Edit Lifecycle | Clear prompt on edit enter, restore on exit if empty |
| Instantiation | Create slide element from master placeholder |
| Override Tracking | Track which properties differ from master |

## 4. Detection Approach

**isPlaceholder(element)**
- Check `element.isPlaceholder === true`

**isEmptyPlaceholder(element)**
- First check `hasUserContent` flag (most reliable)
- Fallback: analyze content for prompt text patterns

**isPromptContent(content)**
- Strip HTML tags, check for:
  - Empty string
  - Known prompt patterns ("Click to add", "Add text", etc.)

## 5. Prompt Text Registry

Each placeholder type has a default prompt:

| Type | Prompt |
|------|--------|
| title | "Click to add title" |
| subtitle | "Click to add subtitle" |
| body | "Click to add text" |
| picture | "Click to add picture" |
| date | "Date" |
| slideNumber | "#" |
| footer | "Footer text" |

Prompt text includes appropriate HTML formatting (h1, p, alignment).

## 6. Edit Lifecycle

### Entering Edit Mode
1. Detect if placeholder is empty
2. If empty: DOM should show empty contentEditable (not prompt text)
3. TextElement clears the displayed prompt, shows cursor

### Exiting Edit Mode
Decision tree:
- If content is empty AND is placeholder → restore prompt text, set `hasUserContent = false`
- If content is empty AND not placeholder → optionally delete element
- If content exists → save content, set `hasUserContent = true`

## 7. Instantiation Approach

When a slide is created from a master layout:
1. For each master placeholder element:
   - Create copy with new ID
   - Link via `masterElementId`
   - Set `hasUserContent = false`
   - Set content to prompt text
   - Initialize empty `overrides` object

### Layout Change Preservation
When switching a slide's layout:
1. Find matching placeholders by type (title → title, body → body)
2. If existing placeholder had user content, preserve it in new layout
3. Unmatched user content should be preserved as extra elements

## 8. Override Tracking

**What to track:**
- Position changes (x, y, width, height)
- Style changes (font, color, etc.)
- NOT content (that's `hasUserContent`)

**Reset to Master:**
- Clear all overrides
- Element reverts to master's position/style
- Content preserved if `hasUserContent = true`

## 9. Visual States

| State | Appearance |
|-------|------------|
| empty | Dimmed (50% opacity), dashed border, prompt text |
| filled | Normal appearance, user content |
| customized | Normal + override indicator (future) |

## 10. Integration Points

| Component | Integration |
|-----------|-------------|
| TextElement | Calls PlaceholderManager for content decisions |
| TextEditManager | Checks placeholder state on enter/exit |
| Store | Updates hasUserContent, overrides |
| SlideManager | Uses instantiation on slide creation |

## 11. Edge Cases

| Scenario | Handling |
|----------|----------|
| Paste into empty placeholder | Clear prompt, paste content, mark hasUserContent |
| Undo all content | Content becomes empty, restore prompt on blur |
| Copy placeholder | Copies content only, not placeholder metadata |
| Duplicate slide | Preserve hasUserContent state |
| Delete placeholder element | Mark slide as "custom layout" |

## 12. Open Questions

1. Should deleting a placeholder element be allowed, or just clearing content?
2. How to handle placeholders with mixed content (some user, some prompt)?
3. Should there be a "Revert to placeholder" action for filled placeholders?
