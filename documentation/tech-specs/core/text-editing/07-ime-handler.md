# IMEHandler - Input Method Editor Support

## 1. Purpose

Handle composition events for CJK (Chinese, Japanese, Korean) input and other complex input methods. Prevent disruption during IME composition.

## 2. The Problem

IME input works differently from direct typing:
1. User types phonetic keys (e.g., "ni hao" for Chinese)
2. IME shows candidate characters
3. User selects final character
4. Final text is committed

During composition:
- There's "uncommitted" text in the field
- Blurring would lose the composition
- Style changes could break the composition
- Input events fire but text isn't "real" yet

## 3. Composition Event Flow

```
User types phonetic key
        │
        ▼
┌─────────────────────┐
│ compositionstart    │ ← IME activated
│ isComposing = true  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ compositionupdate   │ ← Candidate text changing
│ (may fire multiple) │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ compositionend      │ ← User selected final text
│ isComposing = false │
└─────────────────────┘
```

## 4. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| State Tracking | Know when composition is active |
| Event Forwarding | Notify TextEditManager of composition state |
| Action Blocking | Prevent disruptive actions during composition |

## 5. Approach

### Attach to Element
When entering edit mode, attach composition event listeners to the contentEditable element.

### Track State
Maintain `isComposing` flag and current composition text.

### Notify Consumers
Fire callbacks on composition start/update/end so TextEditManager can react.

### Detach on Exit
Remove listeners when exiting edit mode.

## 6. Actions to Block During Composition

| Action | Why Block |
|--------|-----------|
| Exit edit mode | Would lose uncommitted text |
| Save content | Content is incomplete |
| Apply formatting | Could break IME rendering |
| Blur handling | Must keep focus for IME |

## 7. Integration with TextEditManager

TextEditManager checks `imeHandler.isComposing()` before:
- Processing input events
- Handling blur events
- Applying style changes
- Exiting edit mode

If composing, these actions are either blocked or queued.

## 8. Blur During Composition

If user clicks outside during composition:
1. Detect blur is happening
2. If composing: force focus back to element
3. Let composition complete naturally
4. Then allow blur to proceed

Alternative: force-end composition and proceed with blur.

## 9. Browser Compatibility

All modern browsers support composition events:
- Chrome: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

Composition events are part of the DOM Level 3 Events spec.

## 10. Edge Cases

| Scenario | Handling |
|----------|----------|
| Click outside during composition | Force focus back OR end composition |
| Escape during composition | Cancel composition, stay in edit mode |
| Tab during composition | End composition, then handle tab |
| Style change during composition | Queue until composition ends |
| Rapid typing with IME | Events handled in sequence |

## 11. Testing Approach

**Manual testing required** - composition events are difficult to simulate:
1. Switch to Chinese/Japanese/Korean IME
2. Type phonetic input
3. Verify candidate selection works
4. Verify committed text appears correctly
5. Test interruption scenarios

**Simulated testing** for unit tests:
- Dispatch synthetic CompositionEvent objects
- Verify state transitions
- Verify action blocking

## 12. Future Considerations

- Virtual keyboards on mobile may have composition-like behavior
- Voice input may trigger composition events
- Emoji picker may use composition

## 13. Open Questions

1. Should we queue style changes during composition and apply after?
2. What's the best UX for click-outside during composition?
3. Should there be visual indication that composition is active?
