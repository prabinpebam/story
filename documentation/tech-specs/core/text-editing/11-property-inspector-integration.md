# Property Inspector Integration

## 1. Purpose

Define how text editing integrates with the Property Inspector panel. Enable style changes during editing while preserving text selection.

## 2. The Challenge

When user clicks in Property Inspector:
1. Focus leaves contentEditable
2. Text selection is lost
3. User changes font size
4. Change should apply to original selection

Without special handling, the style change applies to nothing or entire element.

## 3. Solution Overview

```
User clicks in Property Inspector
              │
              ▼
     TextEditManager.onPropertyInspectorFocus()
              │
              ▼
     Save current text selection (SelectionManager)
              │
              ▼
     User changes value in PI
              │
              ▼
     TextEditManager.onPropertyChange(property, value)
              │
              ├──► Restore focus to contentEditable
              │
              ├──► Restore text selection
              │
              └──► Apply formatting to selection
```

## 4. Detection: PI Focus

How to detect Property Inspector received focus:
- Listen for `focusout` on contentEditable
- Check if `relatedTarget` is within PI container
- If so, save selection instead of exiting edit

## 5. Selection Preservation

On PI focus:
1. Call `SelectionManager.saveSelection(element)`
2. Store result in `TextEditManager.pendingSelection`

On PI value change:
1. Focus back to contentEditable
2. Call `SelectionManager.restoreSelection(element, pending)`
3. Clear `pendingSelection`
4. Apply style change

## 6. Style Application Modes

| Editing State | Selection | Style Applied To |
|--------------|-----------|------------------|
| Editing | Has selection | Selected text only (inline) |
| Editing | No selection (caret) | Current word or position |
| Not editing | N/A | Entire element |

## 7. Inline vs Element Styles

**Inline styles**: Applied within HTML content
- Bold, italic, underline
- Font size, color on selection
- Creates `<span style="...">` or `<b>`, etc.

**Element styles**: Applied to element in Store
- styleId (preset)
- Default font, size, color for element
- Text alignment

## 8. Property Inspector Display

When editing, PI should show:
- Current selection's computed styles
- Mixed indicator if selection spans different styles
- Active formatting states (bold on/off, etc.)

## 9. Sync: Text to PI

On selection change during editing:
1. Query styles at current selection
2. Emit event with style data
3. PI updates display

## 10. Sync: PI to Text

On value change in PI:
1. PI emits change event
2. TextEditManager receives with property + value
3. If editing: apply to selection
4. If not editing: apply to element

## 11. Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `selection-style-update` | Text → PI | { bold, italic, fontSize, ... } |
| `property-change` | PI → Text | { property, value } |
| `editing-started` | Text → PI | { elementId } |
| `editing-ended` | Text → PI | { elementId } |

## 12. Preset Selector

When user selects a preset in PI:
1. Triggers `styleId` change
2. StyleBridge applies preset
3. Clears conflicting inline overrides
4. DOM updates with new styles

## 13. Reset to Preset

PI should show "Reset" option when element has overrides:
1. User clicks Reset
2. Dispatch to StyleBridge.resetToPreset()
3. All inline overrides cleared
4. Styles revert to preset

## 14. Focus Return

After PI interaction, focus should return to text:
- Automatically on certain inputs (dropdown select)
- On pressing Enter in text input
- NOT on Tab (allow moving to next PI field)

## 15. Keyboard in PI

While in PI with text editing active:
- Escape: Return focus to text, keep editing
- Enter: Apply change, return focus to text
- Tab: Move to next PI field (don't exit text edit)

## 16. Open Questions

1. Should clicking PI with no selection apply to all text or do nothing?
2. How to handle "mixed" state for multi-format selection?
3. Should there be a "Link to Selection" indicator in PI?
4. What happens if user changes slide while in PI during text edit?