# TextEditManager - Core Orchestrator

## 1. Purpose

Central coordinator for all text editing operations. Single source of truth for edit mode state. Ensures only one text element is edited at a time and manages the complete edit lifecycle.

## 2. Responsibilities

- Track which element (if any) is being edited
- Coordinate enter/exit transitions
- Delegate to specialized managers (Selection, IME, Recovery, etc.)
- Handle keyboard shortcuts during editing
- Integrate with Property Inspector for style changes
- Manage dirty state and debounced saves

## 3. Public Interface

| Method | Description |
|--------|-------------|
| `getInstance(store)` | Singleton accessor |
| `enterEditMode(elementId, options)` | Start editing an element |
| `exitEditMode(save)` | Stop editing, optionally save |
| `isEditing()` | Check if any element is being edited |
| `isDirty()` | Check if content has unsaved changes |
| `getEditingElementId()` | Get currently editing element ID |
| `handleInput(domElement)` | Process input events |
| `handleBlur(domElement)` | Process blur events |
| `handleKeyDown(event)` | Process keyboard events |
| `applyInlineFormat(format, value)` | Apply formatting to selection |
| `onPropertyInspectorFocus()` | Save selection before PI interaction |
| `onPropertyChange(property, value)` | Apply PI changes to text |

## 4. Internal State

| Field | Purpose |
|-------|---------|
| `activeElementId` | ID of element being edited |
| `activeDOMElement` | Reference to contentEditable DOM node |
| `preEditState` | Snapshot for undo |
| `preEditContent` | Original content for change detection |
| `debounceTimer` | For batching saves |
| `isDirty` | Whether content has changed |
| `savedSelection` | Selection state saved during PI interaction |

## 5. Enter Edit Mode Flow

1. If already editing another element, exit that first (with save)
2. Capture pre-edit state for undo system
3. Dispatch `ENTER_TEXT_EDIT` to Store
4. Notify PlaceholderManager to prepare element
5. Reset dirty flag

**Options accepted:**
- `selectionType`: 'all' | 'end' | 'click' - where to place caret
- `clickPosition`: {x, y} - for click-based caret placement

## 6. Exit Edit Mode Flow

1. Cancel any pending debounced save
2. If saving: sanitize and save content to Store
3. If content changed: push to HistoryManager
4. Dispatch `EXIT_TEXT_EDIT` to Store
5. Clear recovery draft
6. Reset all internal state

## 7. Input Handling Approach

- **Input events**: Mark dirty, schedule debounced save, update recovery draft
- **Blur events**: Check if blur is to Property Inspector (save selection) or outside (exit edit)
- **Keyboard events**: Handle formatting shortcuts, exit shortcuts, block app-level undo

## 8. IME Consideration

All input handling must check `imeHandler.isComposing()` first. During IME composition:
- Skip input processing
- Skip blur handling
- Skip keyboard shortcuts

## 9. Property Inspector Integration

When user clicks in Property Inspector while editing:
1. `onPropertyInspectorFocus()` saves current text selection
2. User makes changes in PI
3. `onPropertyChange()` restores selection and applies formatting
4. Focus returns to text element

This ensures formatting applies to the correct text range.

## 10. Dependencies

| Dependency | Usage |
|------------|-------|
| Store | State management, dispatching actions |
| PlaceholderManager | Check/handle placeholder elements |
| SelectionManager | Save/restore text selection |
| ContentSanitizer | Clean HTML before saving |
| ContentRecovery | Draft backup during editing |
| IMEHandler | Check composition state |
| HistoryManager | Push undo entries on exit |

## 11. Events Emitted

| Event | When |
|-------|------|
| `text-edit-start` | Enter edit mode |
| `text-edit-end` | Exit edit mode |
| `text-selection-change` | Selection/cursor moves |
| `text-content-save` | Content saved to Store |

## 12. Error Handling Strategy

All public methods wrapped in try/catch. On error:
1. Log error with context
2. Call `recover()` to reset to safe state
3. Dispatch forced exit without save

## 13. Open Questions

1. Should `exitEditMode(false)` also revert DOM content to pre-edit state?
2. What's the debounce interval? 500ms proposed.
3. Should clicking another text element auto-enter edit on it?
