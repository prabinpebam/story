# Store Integration - State and Actions

## 1. Purpose

Define Store state structure and actions for text editing. Integrate with existing Store pattern.

## 2. New State Shape

Add to existing Store state:

```
state.editor.textEdit = {
  editingElementId: string | null,    // Currently editing element
  isDirty: boolean,                    // Content has unsaved changes
  selectionType: 'all' | 'end' | 'click' | null,
  clickPosition: { x, y } | null
}
```

## 3. New Actions

| Action | Payload | Description |
|--------|---------|-------------|
| `ENTER_TEXT_EDIT` | { elementId, selectionType?, clickPosition? } | Start editing |
| `EXIT_TEXT_EDIT` | { save: boolean } | Stop editing |
| `SAVE_TEXT_CONTENT` | { elementId, content, dimensions? } | Save content |
| `MARK_TEXT_DIRTY` | none | Mark content as changed |

## 4. Action Flow

### Enter Edit Mode
1. Dispatch `ENTER_TEXT_EDIT`
2. Reducer sets `editingElementId`, clears dirty flag
3. Subscribers notified (TextElement, PropertyInspector)

### During Editing
1. On input, dispatch `MARK_TEXT_DIRTY`
2. On debounced save, dispatch `SAVE_TEXT_CONTENT`
3. `SAVE_TEXT_CONTENT` updates element.content, clears dirty

### Exit Edit Mode
1. Dispatch `EXIT_TEXT_EDIT`
2. If save=true and dirty, content already saved via debounce
3. Reducer clears `editingElementId`
4. Subscribers notified

## 5. Element Updates

`SAVE_TEXT_CONTENT` updates the element in slides:
- Find element by ID across all slides
- Update `content` property
- Update `hasUserContent` if placeholder
- Optionally update dimensions (auto-size)

## 6. Selector Functions

| Selector | Returns |
|----------|---------|
| `isEditingText(state)` | boolean |
| `getEditingElementId(state)` | string or null |
| `isTextDirty(state)` | boolean |
| `getEditingElement(state)` | element object or null |

## 7. Existing Action Interactions

### UPDATE_ELEMENT
Text editing may trigger `UPDATE_ELEMENT` for:
- Style changes (inlineStyles, styleId)
- Position changes (if text box resizes)

### DELETE_ELEMENT
If editing element is deleted:
- Auto-exit edit mode
- Reducer should handle this edge case

### UNDO/REDO
HistoryBridge intercepts and handles text-edit entries.
Standard undo/redo doesn't apply during active edit.

## 8. Reducer Considerations

### Text Edit State Reducer
- Handle enter/exit transitions
- Validate element exists before entering edit
- Clear edit state on slide change

### Element Reducer
- `SAVE_TEXT_CONTENT` finds and updates element
- Handle missing element gracefully
- Update `hasUserContent` flag for placeholders

## 9. Middleware Considerations

Could add middleware for:
- Logging text edit events
- Analytics tracking
- Debouncing multiple rapid saves

## 10. Subscription Pattern

Components subscribe to relevant state slices:
- TextElement: own element, edit state
- PropertyInspector: editing element, selection styles
- Toolbar: edit state (for button states)

## 11. Derived State

Some state is derived, not stored:
- Effective styles (from StyleResolver)
- Selection info (from DOM, not Store)
- Undo/redo availability (from HistoryManager)

## 12. Migration

If existing presentations have text elements:
- No migration needed
- New properties (hasUserContent, inlineStyles) optional
- Graceful handling of missing properties

## 13. Open Questions

1. Should selection state be in Store? (Currently: no, DOM-only)
2. Should there be a separate text editing reducer or combine with editor?
3. How to handle concurrent edits (future: collaboration)?