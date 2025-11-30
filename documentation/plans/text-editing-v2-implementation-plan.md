# Text Editing System v2 - Implementation Plan

## Overview

This plan outlines the phased implementation of the text editing overhaul. Following the principles of small, incremental, testable changes.

---

## Phase 0: Foundation (P0 - Critical Bug Fixes)
**Estimated: 2-3 days**

### Goals
- Fix content loss bugs immediately
- Establish proper placeholder handling
- No new features, only stability

### Phase 0.1: Content Never Lost
**Files:** `EditorRenderer.js`

**Tasks:**
1. ✅ Add debounced auto-save during typing
2. ✅ Ensure content saved before any blur
3. ✅ Add localStorage draft recovery

**Tests:**
- Content saved after typing stops for 500ms
- Content saved on Escape/Cmd+Enter/blur
- Draft recovered after browser crash

### Phase 0.2: Placeholder Prompt Handling
**Files:** `TextElement.js`, `EditorRenderer.js`

**Tasks:**
1. ✅ Detect empty placeholder by content pattern
2. ✅ Clear prompt text visually on edit entry
3. ✅ Restore prompt text on empty exit
4. ✅ Never delete placeholder elements

**Tests:**
- Empty placeholder shows prompt text
- Edit mode shows empty (no prompt)
- Exit empty restores prompt
- Placeholder persists after empty exit

### Phase 0.3: hasUserContent Flag
**Files:** `InitialState.js`, handlers

**Tasks:**
1. ✅ Add `hasUserContent` property to placeholders
2. ✅ Set true on any user content save
3. ✅ Set false when content cleared

**Tests:**
- New placeholder has `hasUserContent: false`
- After typing, flag is true
- After clearing, flag is false

**Validation Checkpoint:**
- [ ] User can type in placeholder without content disappearing
- [ ] Empty placeholder shows prompt
- [ ] Filled placeholder shows content
- [ ] Placeholder never deleted accidentally

---

## Phase 1: Text Edit Manager Architecture (P0)
**Estimated: 3-4 days**

### Goals
- Create centralized text editing management
- Clean separation of concerns
- Prepare for rich text features

### Phase 1.1: Core Files
**New Files:**
- `src/core/text/TextEditManager.js`
- `src/core/text/PlaceholderManager.js`
- `src/core/text/ContentSanitizer.js`
- `src/core/text/SelectionManager.js`
- `src/core/text/constants.js`

**Tasks:**
1. Create `TextEditManager` class
2. Create `PlaceholderManager` class
3. Create `ContentSanitizer` class
4. Create `SelectionManager` class
5. Add constants file

**Tests:**
- Unit tests for each new class
- Integration with existing system

### Phase 1.2: State Updates
**Files:** `Store.js`, `handlers/TextEditHandlers.js`

**Tasks:**
1. Add `textEdit` state structure
2. Add new action handlers
3. Integrate with existing dispatch

**Tests:**
- State updates correctly on actions
- Backward compatible with existing code

### Phase 1.3: TextElement Integration
**Files:** `TextElement.js`

**Tasks:**
1. Delegate to TextEditManager
2. Use SelectionManager for selection
3. Use PlaceholderManager for prompts

**Tests:**
- Existing functionality preserved
- New manager integration works

**Validation Checkpoint:**
- [ ] All existing text editing works
- [ ] No regressions in behavior
- [ ] New managers properly initialized

---

## Phase 2: Enter/Exit Refinements (P1)
**Estimated: 2-3 days**

### Goals
- Complete all entry/exit paths per spec
- Proper selection handling
- Clean state transitions

### Phase 2.1: Enter Modes
**Files:** `CanvasManager.js`, `TextEditManager.js`

**Tasks:**
1. Double-click: caret at position
2. Enter key: select all
3. Start typing: replace content
4. Text tool: new element + edit

**Tests:**
- Each entry mode works correctly
- Initial selection matches spec

### Phase 2.2: Exit Modes
**Files:** `TextElement.js`, `TextEditManager.js`

**Tasks:**
1. Escape: exit, keep selection
2. Cmd+Enter: exit, keep selection
3. Click outside: exit, deselect
4. Tab (no list): exit, next object

**Tests:**
- Each exit mode works
- Content saved on every exit

### Phase 2.3: Empty Element Handling
**Files:** `EditorRenderer.js`, `PlaceholderManager.js`

**Tasks:**
1. Delete empty non-placeholder
2. Restore empty placeholder
3. Track "newly created" state

**Tests:**
- Empty regular text deleted
- Empty placeholder preserved
- New element deleted if no typing

**Validation Checkpoint:**
- [ ] All entry paths work
- [ ] All exit paths work
- [ ] Empty handling correct

---

## Phase 3: Layer Tree Integration (P1)
**Estimated: 2-3 days**

### Goals
- Placeholders visible in layer tree
- Proper visual indicators
- Delete/hide functionality

### Phase 3.1: Display Updates
**Files:** `LayerTree.js`

**Tasks:**
1. Add placeholder icon/badge
2. Group master elements
3. Show placeholder type

**Tests:**
- Placeholders render correctly
- Grouping works
- Badges visible

### Phase 3.2: Interactions
**Files:** `LayerTree.js`, handlers

**Tasks:**
1. Select placeholder via tree
2. Delete placeholder handling
3. Custom layout detection

**Tests:**
- Selection works
- Delete marks custom layout
- UI updates accordingly

### Phase 3.3: Context Menu
**Files:** `LayerTree.js`

**Tasks:**
1. "Reset to Master" option
2. "Detach from Master" option
3. "Hide Placeholder" option

**Tests:**
- Menu appears for placeholders
- Each action works correctly

**Validation Checkpoint:**
- [ ] Placeholders visible in tree
- [ ] Can interact with placeholders
- [ ] Delete works properly

---

## Phase 4: Rich Text Enhancements (P1)
**Estimated: 3-4 days**

### Goals
- Reliable keyboard shortcuts
- Mixed style support
- List improvements

### Phase 4.1: Formatting Shortcuts
**Files:** `TextElement.js`, `TextEditManager.js`

**Tasks:**
1. Cmd+B for bold
2. Cmd+I for italic
3. Cmd+U for underline
4. Cmd+Shift+X for strikethrough

**Tests:**
- Each shortcut works
- Selection preserved after style
- Mixed styles render correctly

### Phase 4.2: Selection Preservation
**Files:** `SelectionManager.js`

**Tasks:**
1. Save selection before UI interaction
2. Restore selection after
3. Handle focus transitions

**Tests:**
- Style change preserves selection
- Property Inspector interaction works
- Focus returns to text correctly

### Phase 4.3: List Enhancements
**Files:** `TextElement.js`

**Tasks:**
1. Improve auto-detection
2. Fix Enter in empty item
3. Tab/Shift+Tab indentation
4. Backspace at start

**Tests:**
- List patterns detected
- List continuation works
- List termination works
- Indentation works

**Validation Checkpoint:**
- [ ] All shortcuts work
- [ ] Selection preserved
- [ ] Lists fully functional

---

## Phase 5: Performance & Polish (P2)
**Estimated: 2-3 days**

### Goals
- Optimize rendering
- Visual refinements
- Edge case handling

### Phase 5.1: Debouncing & Batching
**Files:** `TextEditManager.js`

**Tasks:**
1. Tune debounce timing
2. Batch store updates
3. Optimize resize handling

**Tests:**
- No jank during typing
- Store updates efficient
- Large text handles well

### Phase 5.2: Visual Polish
**Files:** `TextElement.js`, CSS

**Tasks:**
1. Cursor styling
2. Selection highlight
3. Placeholder visual treatment
4. Edit mode bounding box

**Tests:**
- Cursor visible and styled
- Selection clear and readable
- Placeholder state obvious

### Phase 5.3: Error Recovery
**Files:** `ContentRecovery.js`

**Tasks:**
1. Implement draft saving
2. Add recovery prompt
3. Clean up old drafts

**Tests:**
- Drafts saved to localStorage
- Recovery prompt shows
- Old drafts cleaned up

**Validation Checkpoint:**
- [ ] Performance acceptable
- [ ] Visuals polished
- [ ] Recovery works

---

## Phase 6: Text Style Integration (P1)
**Estimated: 2-3 days**

### Goals
- Integrate with existing styleId/preset system
- StyleResolver compatibility
- Property Inspector updates

### Phase 6.1: StyleResolver Integration
**Files:** `TextStyleManager.js`, `StyleResolver.js`

**Tasks:**
1. Use StyleResolver.getEffectiveTextProperties()
2. Ensure styleId cascading works
3. Test with all existing text styles

**Tests:**
- styleId properties resolve correctly
- element.style overrides styleId
- Inline spans override both

### Phase 6.2: TextStyleManager Features
**Files:** `TextStyleManager.js`

**Tasks:**
1. applyStylePreset() clears conflicting element.style
2. detachFromStyle() moves styleId props to element.style
3. clearFormatting() removes inline spans

**Tests:**
- Apply preset updates element correctly
- Detach preserves visual appearance
- Clear formatting respects styleId

### Phase 6.3: Property Inspector Sync
**Files:** `TextSection.js`, `TextEditManager.js`

**Tasks:**
1. Selection save/restore on PI focus
2. Mixed styles indicator
3. Apply changes to selection or element

**Tests:**
- Selection preserved after PI interaction
- Mixed state shown correctly
- Changes apply to right scope

**Validation Checkpoint:**
- [ ] styleId integration works
- [ ] Property Inspector syncs correctly
- [ ] No conflicts with existing typography panel

---

## Phase 7: Advanced Features (P2)
**Estimated: 2-3 days**

### Goals
- IME support
- Multi-element editing
- Undo/Redo integration

### Phase 7.1: IME Handling
**Files:** `TextElement.js`

**Tasks:**
1. Track compositionstart/compositionend
2. Suppress auto-save during composition
3. Block shortcuts during composition

**Tests:**
- CJK input works correctly
- No save during composition
- Shortcuts blocked until composition ends

### Phase 7.2: Multi-Element
**Files:** `CanvasManager.js`

**Tasks:**
1. First text element edit on typing
2. Batch style changes to all selected
3. Handle mixed type selection

**Tests:**
- Typing enters first text only
- Style applies to all text elements
- Shapes ignored for text operations

### Phase 7.3: Undo/Redo
**Files:** `TextEditManager.js`, `HistoryManager.js`

**Tasks:**
1. Capture pre-edit state on enter
2. Push to history on dirty exit
3. Block app Cmd+Z during edit mode

**Tests:**
- Pre-edit state captured
- History entry created on change
- Browser undo works in edit mode
- App undo works outside edit mode

**Validation Checkpoint:**
- [ ] IME works for CJK languages
- [ ] Multi-element editing correct
- [ ] Undo/Redo works seamlessly

---

## Risk Assessment

### High Risk
| Risk | Mitigation |
|------|------------|
| Breaking existing text editing | Comprehensive test suite, incremental changes |
| Content loss during migration | localStorage drafts, careful blur handling |
| Selection loss during interactions | SelectionManager save/restore |
| styleId conflicts with inline styles | Clear hierarchy, test coverage |

### Medium Risk
| Risk | Mitigation |
|------|------------|
| Performance regression | Debouncing, batching, profiling |
| Browser compatibility | Use native APIs, feature detection |
| Undo/Redo conflicts | Careful history management, mode detection |
| IME edge cases | Test with real IME, user feedback |

### Low Risk
| Risk | Mitigation |
|------|------------|
| CSS conflicts | Scoped styles, careful selectors |
| Mobile support | Progressive enhancement |

---

## Dependencies

### External
- None (using native browser APIs)

### Internal (Critical!)
| Dependency | Used By | Notes |
|------------|---------|-------|
| StyleResolver.js | TextStyleManager | Must call getEffectiveTextProperties() |
| themeSettings.textStyles | PlaceholderManager | Prompt styling from presets |
| HistoryManager.js | TextEditManager | Edit session creates undo points |
| Property Inspector | TextStyleManager | Selection sync, mixed state |
| Store handlers | All managers | Existing action patterns |

### File Modification Dependencies

```
StyleResolver.js ──────┐
                       ├──> TextStyleManager.js
themeSettings.textStyles ──┘

HistoryManager.js ─────> TextEditManager.js

TextSection.js <────── SelectionManager.js
(Property Inspector)
```

---

## Test Strategy

### Unit Tests
- All new classes
- All new handlers
- Edge cases
- styleId integration
- IME composition

### Integration Tests
- Full edit workflows
- Placeholder lifecycle
- Layer tree integration
- StyleResolver chain
- Undo/Redo flows

### Manual Testing
- Cross-browser
- Performance
- CJK input
- Edge cases

---

## Rollback Plan

Each phase can be rolled back independently:

1. **Phase 0**: Core bug fixes - unlikely to rollback
2. **Phase 1**: New files - can disable by not importing
3. **Phase 2-5**: Feature flags if needed
4. **Phase 6**: styleId features behind flag
5. **Phase 7**: Advanced features behind flag

---

## Success Criteria

### Phase 0 Complete
- Zero content loss bugs reported
- Placeholders work correctly
- All existing tests pass

### Phase 1 Complete
- New architecture in place
- No regressions
- New tests passing

### Phase 2-5 Complete
- All spec requirements met
- Performance acceptable
- User experience matches Figma/Keynote

### Phase 6-7 Complete
- styleId integration seamless
- IME works for CJK
- Undo/Redo works correctly
- Multi-element editing correct

---

## Timeline Summary

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| 0: Foundation | 2-3 days | P0 | None |
| 1: Architecture | 3-4 days | P0 | Phase 0 |
| 2: Enter/Exit | 2-3 days | P1 | Phase 1 |
| 3: Layer Tree | 2-3 days | P1 | Phase 2 |
| 4: Rich Text | 3-4 days | P1 | Phase 2 |
| 5: Polish | 2-3 days | P2 | Phase 4 |
| 6: Style Integration | 2-3 days | P1 | Phase 4 |
| 7: Advanced | 2-3 days | P2 | Phase 5, 6 |

**Total Estimated: 18-26 days**
