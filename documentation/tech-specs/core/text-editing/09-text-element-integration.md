# TextElement Integration - Changes to Existing Renderer

## 1. Purpose

Document required changes to the existing TextElement.js to integrate with the new text editing system. TextElement should delegate edit responsibility to TextEditManager.

## 2. Current Issues

TextElement currently:
- Manages its own edit state (contentEditable toggle)
- Handles input/blur events directly
- Doesn't coordinate with other systems
- Has bugs with placeholder handling

## 3. New Approach

TextElement becomes a "dumb" renderer that:
- Renders content based on state
- Forwards user interactions to TextEditManager
- Receives callbacks for state changes
- Delegates all edit logic

## 4. Key Changes

### 4.1 Remove Internal Edit State
- Remove `isEditing` internal flag
- Query TextEditManager for edit state instead
- Remove direct contentEditable manipulation

### 4.2 Delegate Event Handling
- Double-click → Tell TextEditManager to enter edit mode
- Input events → Forward to TextEditManager
- Blur events → Forward to TextEditManager
- Keyboard events → Forward to TextEditManager

### 4.3 Content Rendering
- In view mode: Show content or placeholder prompt
- In edit mode: Show raw content (no prompt)
- contentEditable controlled by TextEditManager

### 4.4 Callbacks from TextEditManager
- `onEnterEditMode()`: Update CSS classes, prepare DOM
- `onExitEditMode(content)`: Update content, refresh display
- `onContentUpdate(content)`: Mid-edit content sync

## 5. Rendering Modes

| Mode | contentEditable | Content Shown |
|------|-----------------|---------------|
| View (has content) | false | User content |
| View (empty placeholder) | false | Prompt text, dimmed |
| View (empty regular) | false | Empty or delete |
| Edit | true | User content (no prompt) |

## 6. CSS Classes

| Class | Meaning |
|-------|---------|
| `.text-element` | Base class |
| `.text-element.editing` | Currently in edit mode |
| `.text-element.placeholder-empty` | Empty placeholder showing prompt |
| `.text-element.selected` | Selected but not editing |

## 7. Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-element-id` | For DOM lookups by TextEditManager |
| `data-placeholder-type` | For PlaceholderManager queries |

## 8. Click/Selection Behavior

| User Action | Current Selection | Result |
|-------------|-------------------|--------|
| Click | None | Select element |
| Click | This element | Enter edit mode |
| Double-click | Any | Enter edit mode |
| Click outside | This element editing | Exit edit mode |

## 9. Focus Management

When editing:
- ContentEditable element receives focus
- Selection managed by SelectionManager
- On PI interaction: save selection, allow PI focus
- On return from PI: restore selection

## 10. Master Element Handling

If element is from master (`fromMaster: true`):
1. On first edit attempt, create slide-level copy
2. Edit the copy, not the original
3. Track relationship via `masterInstanceId`

## 11. Style Application

TextElement applies styles from StyleBridge:
- Query effective styles on render
- Apply to DOM element
- Listen for style change events
- Re-apply on style updates

## 12. Store Subscription

TextElement subscribes to Store:
- Re-render when element properties change
- Update selection visual when selection changes
- Handle element deletion

## 13. Cleanup

On element removal:
- Unsubscribe from Store
- Remove from DOM
- Clear any timers/listeners

## 14. Integration Diagram

```
User Interaction
       │
       ▼
  TextElement
       │
       ├──► Double-click → TextEditManager.enterEditMode()
       │
       ├──► Input event → TextEditManager.handleInput()
       │
       ├──► Blur event → TextEditManager.handleBlur()
       │
       └──► Key event → TextEditManager.handleKeyDown()


  TextEditManager
       │
       ├──► onEnterEditMode() → TextElement
       │
       └──► onExitEditMode() → TextElement
```

## 15. Open Questions

1. Should TextElement own the contentEditable div or should TextEditManager create an overlay?
2. How to handle resize during editing? Exit edit mode first?
3. Should there be a "text editing layer" separate from the canvas elements?
