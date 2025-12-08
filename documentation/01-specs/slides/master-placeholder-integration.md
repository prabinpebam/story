# Master Slide & Placeholder Integration Specification

## 1. Overview

This specification defines how master slide placeholders integrate with the text editing system. The goal is a seamless experience where users edit placeholder content without needing to understand the master/slide distinction.

---

## 2. Placeholder Architecture

### 2.1 Data Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              MASTER (Layout)                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ elements: {                                                       │   │
│  │   "placeholder-title": {                                          │   │
│  │     id: "placeholder-title",                                      │   │
│  │     type: "text",                                                 │   │
│  │     isPlaceholder: true,                                          │   │
│  │     placeholderType: "title",                                     │   │
│  │     content: "<h1>Click to add title</h1>",  // Prompt text      │   │
│  │     x: 100, y: 80, width: 1720, height: 80,                       │   │
│  │     style: { fontSize: 44, fontWeight: "700", ... }               │   │
│  │   }                                                               │   │
│  │ }                                                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Applied to
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                 SLIDE                                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ layoutId: "layout-title-content"                                  │   │
│  │ elements: {                                                       │   │
│  │   "placeholder-title": {                                          │   │
│  │     id: "placeholder-title",                                      │   │
│  │     type: "text",                                                 │   │
│  │     isPlaceholder: true,                                          │   │
│  │     placeholderType: "title",                                     │   │
│  │     masterElementId: "placeholder-title",  // Link to master      │   │
│  │     content: "<h1>My Custom Title</h1>",   // User content        │   │
│  │     hasUserContent: true,                                         │   │
│  │     overrides: {                            // Any style changes  │   │
│  │       style: { fontSize: 48 }                                     │   │
│  │     }                                                             │   │
│  │   }                                                               │   │
│  │ }                                                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Property Inheritance

Properties cascade from master to slide element:

```
Master Element Properties (base)
        ↓
Slide Element Properties (overrides)
        ↓
Final Rendered Properties
```

**Merge Rules:**
- Slide properties override master properties
- `overrides` object tracks what differs from master
- Deleting an override restores master value
- Content is never inherited (always slide-specific or prompt)

### 2.3 Element States

| State | `content` | `hasUserContent` | Visual | Editable |
|-------|-----------|------------------|--------|----------|
| Empty (from master) | Prompt text | `false` | Dimmed, dashed border | Yes |
| Filled | User content | `true` | Normal | Yes |
| Customized | User content | `true` | Normal (optional indicator) | Yes |

---

## 3. Placeholder Lifecycle

### 3.1 Slide Creation

When a new slide is created with a layout:

```javascript
function createSlideFromLayout(layoutId) {
  const layout = store.getState().masters[layoutId];
  
  const slideElements = {};
  
  for (const [id, masterEl] of Object.entries(layout.elements)) {
    // Copy placeholder to slide
    slideElements[id] = {
      ...masterEl,
      masterElementId: masterEl.id,
      hasUserContent: false,
      overrides: {}
    };
  }
  
  return {
    id: generateId(),
    layoutId: layoutId,
    elements: slideElements,
    elementOrder: [...layout.elementOrder]
  };
}
```

### 3.2 Layout Change

When slide layout is changed:

1. Compare new layout's placeholders with current
2. Preserve content for matching placeholder types
3. Add new placeholders as empty
4. Remove placeholders that don't exist in new layout

```javascript
function changeSlideLayout(slideId, newLayoutId) {
  const slide = store.getState().slides[slideId];
  const newLayout = store.getState().masters[newLayoutId];
  
  const newElements = {};
  
  // First, add all placeholders from new layout
  for (const [id, masterEl] of Object.entries(newLayout.elements)) {
    // Check if we have content for this placeholder type
    const existingEl = Object.values(slide.elements).find(
      el => el.placeholderType === masterEl.placeholderType && el.hasUserContent
    );
    
    if (existingEl) {
      // Preserve user content
      newElements[id] = {
        ...masterEl,
        masterElementId: masterEl.id,
        content: existingEl.content,
        hasUserContent: true,
        overrides: {}
      };
    } else {
      // New empty placeholder
      newElements[id] = {
        ...masterEl,
        masterElementId: masterEl.id,
        hasUserContent: false,
        overrides: {}
      };
    }
  }
  
  // Keep non-placeholder elements
  for (const [id, el] of Object.entries(slide.elements)) {
    if (!el.isPlaceholder) {
      newElements[id] = el;
    }
  }
  
  return {
    ...slide,
    layoutId: newLayoutId,
    elements: newElements
  };
}
```

### 3.3 Editing Placeholder Content

**On Edit Entry:**
1. Detect if element is empty placeholder
2. Store the prompt text for restoration
3. Clear DOM (show empty, ready for typing)
4. Enter `contenteditable` mode

**On Edit Exit:**
1. Check if content is empty
2. If empty: restore prompt text, mark `hasUserContent = false`
3. If has content: save content, mark `hasUserContent = true`
4. Placeholder is NEVER deleted (unlike regular text)

### 3.4 Deleting a Placeholder

When user explicitly deletes a placeholder element:

1. Mark slide as using "Custom Layout"
2. Remove the placeholder from slide elements
3. Update `layoutId` to indicate customization
4. Store which placeholders were removed in slide metadata

```javascript
function deletePlaceholder(slideId, placeholderId) {
  const slide = store.getState().slides[slideId];
  
  // Remove from elements
  const { [placeholderId]: removed, ...remainingElements } = slide.elements;
  
  // Mark as custom layout
  return {
    ...slide,
    layoutId: null,  // Or 'custom'
    customLayoutBase: slide.layoutId,
    deletedPlaceholders: [...(slide.deletedPlaceholders || []), placeholderId],
    elements: remainingElements
  };
}
```

---

## 4. Layer Tree Integration

### 4.1 Display Structure

```
Layer Tree:
├── 📄 Title (placeholder-title) [🔗]
├── 📄 My Custom Text
├── 🖼️ Image 1
└── ── Master Elements ──────────
    ├── 📄 Subtitle (placeholder-subtitle) [🔗]
    └── 📄 Footer (placeholder-footer) [🔗]
```

**Visual Indicators:**
- `[🔗]` or similar icon indicates placeholder from master
- Master elements grouped at bottom
- Collapsible section for master elements

### 4.2 Interactions

| Action | Regular Element | Placeholder Element |
|--------|-----------------|---------------------|
| Select | Standard selection | Standard selection |
| Move | Free move | Allowed (creates position override) |
| Resize | Free resize | Allowed (creates size override) |
| Edit | Standard edit | Edit with prompt handling |
| Delete | Remove from slide | Convert to custom layout |
| Duplicate | Creates copy | Creates regular element (not placeholder) |

### 4.3 Context Menu

For placeholder elements, add:
- "Reset to Master" - Clears all overrides
- "Detach from Master" - Converts to regular element
- "Hide Placeholder" - Hides without deleting

---

## 5. Style Overrides

### 5.1 Tracking Overrides

When user changes a placeholder's style:

```javascript
function updatePlaceholderStyle(elementId, property, value) {
  const element = getElement(elementId);
  const masterElement = getMasterElement(element.masterElementId);
  
  // Check if value differs from master
  const masterValue = masterElement.style?.[property];
  
  if (value === masterValue) {
    // Remove override (reset to master)
    delete element.overrides.style[property];
  } else {
    // Track as override
    element.overrides.style = {
      ...element.overrides.style,
      [property]: value
    };
  }
  
  // Apply to element
  element.style = {
    ...element.style,
    [property]: value
  };
}
```

### 5.2 Resolving Final Styles

```javascript
function getEffectiveStyle(element) {
  if (!element.isPlaceholder || !element.masterElementId) {
    return element.style;
  }
  
  const masterElement = getMasterElement(element.masterElementId);
  
  // Merge: master base + slide overrides
  return {
    ...masterElement.style,
    ...element.overrides?.style
  };
}
```

### 5.3 Property Inspector Display

For placeholder elements, show:
- Current value (merged)
- Indicator if value differs from master
- "Reset" button to restore master value

```
┌─────────────────────────────────────┐
│ Font Size                           │
│ ┌─────────────────────────────┬───┐ │
│ │ 48                          │ ↺ │ │ ← Reset button (shows 44 from master)
│ └─────────────────────────────┴───┘ │
│ [Override from master: 44]          │ ← Optional: show master value
└─────────────────────────────────────┘
```

---

## 6. Theme Integration

### 6.1 Theme Variables in Placeholders

Master placeholders use theme variables:

```javascript
{
  style: {
    color: "var(--theme-text-primary, #0F172A)",
    fontFamily: "var(--theme-font-heading, Inter)"
  }
}
```

These resolve at render time based on active theme.

### 6.2 Theme Change Propagation

When theme changes:
1. Re-resolve all CSS variables
2. Trigger re-render of affected elements
3. Overrides using explicit values (not variables) remain unchanged

---

## 7. Implementation Details

### 7.1 Placeholder Detection

```javascript
// Check if element is a placeholder
function isPlaceholder(element) {
  return element?.isPlaceholder === true;
}

// Check if placeholder is empty (shows prompt)
function isEmptyPlaceholder(element) {
  return isPlaceholder(element) && !element.hasUserContent;
}

// Get the prompt text for a placeholder type
function getPromptText(placeholderType) {
  const prompts = {
    title: '<h1>Click to add title</h1>',
    subtitle: '<p>Click to add subtitle</p>',
    body: '<p>Click to add text</p>',
    text: '<p>Click to add text</p>',
    picture: '<p>🖼️ Click to add picture</p>',
    date: '<p>Date</p>',
    slideNumber: '<p>#</p>'
  };
  return prompts[placeholderType] || prompts.text;
}
```

### 7.2 Blur Handler Update

```javascript
function handlePlaceholderBlur(element, domElement) {
  const content = domElement.innerHTML;
  const textContent = domElement.textContent?.trim() || '';
  const isEmpty = textContent === '' || content === '<br>';
  
  if (isEmpty) {
    // Restore prompt text
    const promptText = getPromptText(element.placeholderType);
    store.dispatch('UPDATE_ELEMENT', {
      id: element.id,
      content: promptText,
      hasUserContent: false
    });
  } else {
    // Save user content
    store.dispatch('UPDATE_ELEMENT', {
      id: element.id,
      content: content,
      hasUserContent: true
    });
  }
  
  // Exit edit mode (but DO NOT delete placeholder)
  store.dispatch('SET_EDITING_ELEMENT', null);
}
```

### 7.3 TextElement Update for Placeholders

```javascript
// In TextElement.update()
update(newData) {
  // ... existing code ...
  
  const isPlaceholder = el.isPlaceholder === true;
  const isEmptyPlaceholder = isPlaceholder && !el.hasUserContent;
  
  // Visual treatment for empty placeholder
  if (isEmptyPlaceholder && !div.isContentEditable) {
    div.style.opacity = '0.5';
    div.style.border = '1px dashed rgba(100, 116, 139, 0.4)';
  } else {
    div.style.opacity = '1';
    div.style.border = 'none';
  }
  
  // ... rest of update ...
}
```

---

## 8. Edge Cases

### 8.1 Paste into Empty Placeholder

When pasting into an empty placeholder:
1. Clear prompt text first (if not already cleared)
2. Paste content normally
3. Mark `hasUserContent = true`

### 8.2 Undo to Empty State

If user undoes all content in a placeholder:
1. Content becomes empty
2. On next blur, restore prompt text
3. Mark `hasUserContent = false`

### 8.3 Copy Placeholder Content

When copying a placeholder's content:
- Copy just the content, not placeholder metadata
- Pasting creates regular text, not placeholder

### 8.4 Duplicate Slide with Placeholders

When duplicating a slide:
- Copy all placeholders with their content
- Maintain `masterElementId` references
- New slide uses same layout

---

## 9. Migration from Current System

### 9.1 Current Issues

1. Prompt text not properly separated from content
2. `hasUserContent` flag not consistently used
3. Empty placeholder deletion logic incorrect
4. Blur handler doesn't distinguish placeholders

### 9.2 Migration Steps

1. Add `hasUserContent` to existing placeholder elements
2. Detect empty placeholders by checking for prompt patterns
3. Update blur handler to use placeholder-aware logic
4. Add prompt text restoration on empty exit

---

## 10. Testing Checklist

### 10.1 Placeholder Lifecycle

- [ ] New slide creates empty placeholders
- [ ] Empty placeholder shows prompt text
- [ ] Empty placeholder has visual treatment (dimmed)
- [ ] Edit mode clears prompt from DOM
- [ ] Exit empty restores prompt
- [ ] Exit with content preserves content
- [ ] Delete placeholder marks custom layout
- [ ] Layout change preserves content

### 10.2 Content Integrity

- [ ] User content never reverts to prompt unexpectedly
- [ ] Undo restores previous content state
- [ ] Paste into empty placeholder works
- [ ] Copy placeholder copies only content

### 10.3 Style Overrides

- [ ] Style change creates override
- [ ] Reset clears override
- [ ] Theme change updates variables
- [ ] Override indicator shows in UI
