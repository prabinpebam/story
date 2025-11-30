# HistoryBridge - Undo/Redo Integration

## 1. Purpose

Integrate text editing with the application's undo/redo system. Handle the conflict between browser's contenteditable undo and application-level undo.

## 2. The Problem

Two undo systems exist:
1. **Browser undo**: Ctrl+Z in contentEditable undoes character-by-character
2. **App undo**: Ctrl+Z in app undoes entire operations (move element, delete, etc.)

Without coordination:
- Ctrl+Z during editing could trigger app undo (jumping to previous slide state)
- Exiting edit mode loses all the granular browser undo history
- App undo history could contain every keystroke (too granular)

## 3. Strategy: Edit Mode Isolation

```
┌──────────────────────────────────────────────────────┐
│                 NOT EDITING                          │
│  Ctrl+Z → Application HistoryManager                │
│  Full state snapshots for undo/redo                 │
└──────────────────────┬───────────────────────────────┘
                       │ Enter Edit Mode
                       ▼
┌──────────────────────────────────────────────────────┐
│                    EDITING                           │
│  Ctrl+Z → Browser contenteditable (character-level) │
│                                                      │
│  • HistoryManager paused                            │
│  • Initial state captured                           │
│  • Browser manages typing undo                      │
└──────────────────────┬───────────────────────────────┘
                       │ Exit Edit Mode
                       ▼
┌──────────────────────────────────────────────────────┐
│  Compare: initial content vs final content          │
│  If changed: Push SINGLE entry to HistoryManager    │
│  "Edit text element" - whole edit becomes one undo  │
└──────────────────────────────────────────────────────┘
```

## 4. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Session Tracking | Know when editing starts/ends |
| State Capture | Snapshot content before editing |
| Keyboard Intercept | Block app undo during editing |
| History Push | Create single entry on exit |
| Entry Application | Handle undo/redo of text edits |

## 5. Edit Session Lifecycle

### Begin Session
1. Capture current element content and styles
2. Pause HistoryManager (stop recording)
3. Track session element ID

### During Session
1. Keyboard handler intercepts Ctrl+Z/Ctrl+Y
2. Stops propagation so app doesn't see it
3. Browser contentEditable handles the undo
4. No app history entries created

### End Session
1. Resume HistoryManager
2. Compare initial vs final content
3. If changed: push single history entry
4. Clear session state

## 6. Keyboard Interception Approach

On keydown (capture phase):
- Check if in edit session
- If NOT editing: handle Ctrl+Z/Y normally (app undo)
- If editing: stop propagation, let browser handle

This keeps browser's undo working during typing while preventing app undo from interfering.

## 7. History Entry Structure

When exiting with changes, create entry:
- **type**: 'text-edit'
- **elementId**: Which element was edited
- **before**: { content, inlineStyles } before edit
- **after**: { content, inlineStyles } after edit
- **description**: 'Edit text' (for undo menu)

## 8. Applying History Entries

On undo of text-edit entry:
- Restore `before` content and styles to element
- Update DOM to reflect change

On redo of text-edit entry:
- Restore `after` content and styles to element
- Update DOM to reflect change

## 9. HistoryManager Requirements

HistoryManager must support:
- `pause()`: Stop recording state changes
- `resume()`: Resume recording
- `push(entry)`: Add custom entry
- Entry application callback for text-edit type

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| Click away during edit | Ends session, saves, pushes history |
| App blur during edit | Same as click away |
| Multiple rapid edits | Each enter/exit creates separate entry |
| Edit → undo → edit again | New session, new entry |
| Redo while editing | Browser handles (in contentEditable) |
| Cancel edit (Escape) | Exit with save=true (could be save=false to discard) |

## 11. Future: Coalescing

Could combine rapid sequential text edits into single entry:
- Same element edited within 1 second
- Merge: keep first "before", use latest "after"
- Results in single undo for quick typing session

Not implemented initially - adds complexity.

## 12. Integration with TextEditManager

TextEditManager calls:
- `historyBridge.beginSession(elementId)` on enter
- `historyBridge.endSession(elementId, content)` on exit
- Keyboard handler delegates to historyBridge for interception

## 13. Testing Scenarios

1. **Basic**: Type text → exit → Ctrl+Z → entire edit reverts
2. **Browser undo**: Type text → Ctrl+Z (during edit) → character reverts
3. **No change**: Enter → no changes → exit → no history entry
4. **Style change**: Enter → bold text → exit → undo reverts bold
5. **Cancel**: Enter → changes → exit(save=false) → no history entry

## 14. Open Questions

1. Should Escape cancel (discard changes) or commit (save changes)?
2. Should there be a keyboard shortcut to explicitly discard changes?
3. How long should coalescing window be if implemented?
