# Text Editing System v2 - Implementation Plan

## Overview

This plan outlines the phased implementation of the text editing overhaul. Following the principles of small, incremental, testable changes.

**Reference Documents:**
- `documentation/principles.md` - Project principles
- `documentation/tech-specs/core/text-editing/` - Modular architecture specs (00-12)

---

## Principles Compliance Checklist

Per `documentation/principles.md`, each phase must address:

| Principle | How Verified |
|-----------|--------------|
| Small incremental changes | Each phase has clear validation checkpoint |
| Mandatory test validation | vitest tests for each phase |
| Design system (CSS variables) | No hardcoded colors/sizes; use `--color-*`, `--font-*` tokens |
| Dark/light mode | All colors from theme-responsive variables |
| Undo/redo compatibility | HistoryManager modifications in Phase 0.5 |
| File storage compatibility | Same `content` field format, backward compatible |
| Realtime collaboration | All changes through Store, element locking |

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

## Phase 0.5: HistoryManager Prerequisites (P0 - BLOCKER)
**Estimated: 0.5-1 day**

### Goals
- Add required HistoryManager methods BEFORE text system work
- Per principles: "Call out if undo/redo needs modification"

### Tasks
**Files:** `HistoryManager.js`

1. Add `pause()` method - sets `isPaused` flag
2. Add `resume()` method - clears `isPaused` flag  
3. Add `text-edit` entry type handler
4. Modify recording to skip when paused

**Tests (vitest):**
- `pause()` stops state recording
- `resume()` resumes recording
- `text-edit` entries undo/redo correctly
- Nested pause calls handled

**Risk Mitigation:**
- This is a BLOCKER - Phase 1 cannot start until complete
- Simple boolean flag approach, low risk
- Backward compatible with existing history entries

**Validation Checkpoint:**
- [ ] HistoryManager.pause() works
- [ ] HistoryManager.resume() works
- [ ] Existing undo/redo unaffected

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
- `src/core/text/HistoryBridge.js` ← NEW: Undo/redo integration
- `src/core/text/IMEHandler.js` ← NEW: Per architecture spec
- `src/core/text/constants.js`

**Tasks:**
1. Create `TextEditManager` class (singleton orchestrator)
2. Create `PlaceholderManager` class (static utility)
3. Create `ContentSanitizer` class (allowlist-based)
4. Create `SelectionManager` class (node path approach)
5. Create `HistoryBridge` class (edit mode isolation)
6. Create `IMEHandler` class (composition events)
7. Add constants file (design token references)

**Design System Compliance:**
- All CSS classes follow naming convention
- Constants reference `--color-*`, `--font-*` tokens
- No hardcoded colors or sizes

**Tests (vitest):**
- Unit tests for each new class
- Integration with existing system
- Sanitizer security tests (XSS prevention)

### Phase 1.2: State Updates
**Files:** `Store.js`, `handlers/TextEditHandlers.js`

**Tasks:**
1. Add `textEdit` state structure per `10-store-handlers.md`:
   ```
   editor.textEdit: {
     isEditing: boolean,
     elementId: string | null,
     isDirty: boolean,
     initialContent: string | null
   }
   ```
2. Add new action handlers:
   - `ENTER_TEXT_EDIT`
   - `EXIT_TEXT_EDIT`
   - `SAVE_TEXT_CONTENT`
   - `MARK_TEXT_DIRTY`
3. Integrate with existing dispatch

**Realtime Collaboration:**
- `elementId` in state enables "User X is editing" awareness
- Changes go through Store for sync

**Tests (vitest):**
- State updates correctly on actions
- Backward compatible with existing code
- State shape matches spec

### Phase 1.3: TextElement Integration
**Files:** `TextElement.js`

**Tasks:**
1. Delegate to TextEditManager for edit lifecycle
2. Use SelectionManager for selection save/restore
3. Use PlaceholderManager for prompts
4. Use HistoryBridge for undo coordination
5. Use IMEHandler for composition detection

**Tests (vitest):**
- Existing functionality preserved
- New manager integration works
- No regressions

**Validation Checkpoint:**
- [ ] All existing text editing works
- [ ] No regressions in behavior
- [ ] New managers properly initialized
- [ ] HistoryBridge pauses/resumes correctly

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
1. Save selection before UI interaction (node path approach per `03-selection-manager.md`)
2. Restore selection after PI interaction
3. Handle focus transitions between text and PI

**Tests (vitest):**
- Style change preserves selection
- Property Inspector interaction works
- Focus returns to text correctly
- Mixed selection across styles detected

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
**Files:** `TextElement.js`, CSS modules

**Tasks:**
1. Cursor styling (use `--color-text-primary`)
2. Selection highlight (use `--color-selection`)
3. Placeholder visual treatment (use `--color-text-tertiary`)
4. Edit mode bounding box (use `--color-focus-ring`)
5. Focus indicator styling

**Design System Compliance:**
- All colors from CSS variables
- Dark/light mode tested
- No inline styles

**Tests (vitest + manual):**
- Cursor visible and styled in both themes
- Selection clear and readable
- Placeholder state obvious
- Dark mode renders correctly

### Phase 5.3: Error Recovery
**Files:** `ContentRecovery.js`

**Tasks:**
1. Implement draft saving (dual-write: IndexedDB + localStorage per `08-content-recovery.md`)
2. Add recovery prompt on app start
3. Clean up old drafts (7-day expiration)
4. Handle storage quota errors gracefully

**Security Compliance:**
- Drafts stored locally only
- No sensitive data in drafts
- Cleared on successful save

**Tests (vitest):**
- Drafts saved to IndexedDB
- localStorage fallback works
- Recovery prompt shows after crash
- Old drafts cleaned up
- Quota errors handled

**Validation Checkpoint:**
- [ ] Performance acceptable
- [ ] Visuals polished
- [ ] Recovery works

---

## Phase 6: Style System Integration (P1)
**Estimated: 2-3 days**

### Goals
- Integrate with existing styleId/preset system
- StyleResolver compatibility
- Property Inspector updates
- Design token compliance

### Phase 6.1: StyleBridge Implementation
**Files:** `src/core/text/StyleBridge.js` (new), `StyleResolver.js`

**Tasks:**
1. Create StyleBridge class per `05-style-bridge.md`
2. Use StyleResolver.getEffectiveTextProperties()
3. Implement style cascade: Theme → Preset → Element → Inline
4. Ensure all values use design tokens

**Design System Compliance:**
- fontFamily → `--font-family-sans`, `--font-family-heading`
- fontSize → `--font-size-body`, `--font-size-heading-*`
- color → `--color-text-primary`, `--color-text-heading`
- All colors respond to dark/light theme

**Tests (vitest):**
- styleId properties resolve correctly
- element.style overrides styleId
- Inline spans override both
- Theme change updates all elements

### Phase 6.2: TextStyleManager Features
**Files:** `TextStyleManager.js`

**Tasks:**
1. applyStylePreset() - clears conflicting element.style, updates styleId
2. detachFromStyle() - moves styleId props to element.style
3. clearFormatting() - removes inline spans, respects styleId
4. Track inline overrides (per `05-style-bridge.md`)

**Tests (vitest):**
- Apply preset updates element correctly
- Detach preserves visual appearance
- Clear formatting respects styleId
- Override tracking accurate

### Phase 6.3: Property Inspector Sync
**Files:** `TextSection.js`, `TextEditManager.js`, `SelectionManager.js`

**Tasks:**
1. Selection save/restore on PI focus (via SelectionManager)
2. Mixed styles indicator for multi-character selection
3. Apply changes to selection or element based on scope
4. Bidirectional sync per `11-property-inspector-integration.md`

**Tests (vitest):**
- Selection preserved after PI interaction
- Mixed state shown correctly
- Changes apply to right scope
- No focus fighting

**Validation Checkpoint:**
- [ ] styleId integration works
- [ ] Property Inspector syncs correctly
- [ ] No conflicts with existing typography panel
- [ ] Dark/light mode colors correct

---

## Phase 7: Advanced Features (P2)
**Estimated: 2-3 days**

### Goals
- IME support
- Multi-element editing
- Undo/Redo integration

### Phase 7.1: IME Handling
**Files:** `IMEHandler.js`, `TextElement.js`

**Tasks:**
1. Track compositionstart/compositionend events per `07-ime-handler.md`
2. Suppress auto-save during composition
3. Block formatting shortcuts during composition
4. Block exit attempts during composition

**Tests (vitest + manual with CJK IME):**
- CJK input works correctly
- No save during composition
- Shortcuts blocked until composition ends
- Exit blocked during composition

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

### Phase 7.3: Undo/Redo Integration
**Files:** `HistoryBridge.js`, `TextEditManager.js`

**Tasks:**
1. Use HistoryBridge.beginSession() on edit enter
2. Use HistoryBridge.endSession() on edit exit
3. Block app Ctrl+Z during edit mode (let browser handle)
4. Push single `text-edit` entry on dirty exit

**Per `06-history-bridge.md`:**
- Browser undo during edit (character-level)
- App undo outside edit (operation-level)
- Single history entry per edit session

**Tests (vitest):**
- Pre-edit state captured
- History entry created on change
- Browser undo works in edit mode
- App undo works outside edit mode
- No history entry if no changes

**Validation Checkpoint:**
- [ ] IME works for CJK languages
- [ ] Multi-element editing correct
- [ ] Undo/Redo works seamlessly

---

## Risk Assessment

### High Risk
| Risk | Mitigation | Principle |
|------|------------|-----------|
| Breaking existing text editing | Comprehensive vitest suite, incremental changes | App integrity |
| Content loss during migration | localStorage/IndexedDB drafts, careful blur handling | App integrity |
| Selection loss during interactions | SelectionManager save/restore | App integrity |
| styleId conflicts with inline styles | Clear hierarchy, test coverage | Design system |
| HistoryManager incompatibility | Phase 0.5 blocker, implement pause/resume first | Undo/redo |
| Hardcoded colors/styles | Lint rules, code review for CSS variables | Design system |

### Medium Risk
| Risk | Mitigation | Principle |
|------|------------|-----------|
| Performance regression | Debouncing, batching, profiling | Performance |
| Browser compatibility | Use native APIs, feature detection | App integrity |
| Undo/Redo conflicts | Edit mode isolation, HistoryBridge | Undo/redo |
| IME edge cases | Test with real IME, user feedback | App integrity |
| Dark mode rendering | Test both themes, CSS variables only | Design system |
| Concurrent edits (collab) | Element locking, "User X editing" UI | Realtime collab |

### Low Risk
| Risk | Mitigation | Principle |
|------|------------|-----------|
| CSS conflicts | Scoped styles, careful selectors | Design system |
| Mobile support | Progressive enhancement | App integrity |
| Draft storage quota | Cleanup old drafts, handle errors | Security |

---

## Dependencies

### External
- None (using native browser APIs)

### Internal (Critical!)
| Dependency | Used By | Notes | Modifications Needed |
|------------|---------|-------|---------------------|
| HistoryManager.js | HistoryBridge | Edit session creates undo points | **Add pause(), resume(), text-edit type** |
| StyleResolver.js | StyleBridge | Must call getEffectiveTextProperties() | None |
| themeSettings.textStyles | PlaceholderManager | Prompt styling from presets | None |
| Property Inspector | StyleBridge | Selection sync, mixed state | None |
| Store handlers | All managers | Existing action patterns | Add new actions |
| CSS Variables | All UI | Design tokens | Must exist in design system |

### HistoryManager Modifications (BLOCKER)

Per `06-history-bridge.md`, these must be implemented in Phase 0.5:

```
HistoryManager.pause()      → Add isPaused flag, skip recording
HistoryManager.resume()     → Clear isPaused flag
HistoryManager.push(entry)  → Support type: 'text-edit'
```

### File Modification Dependencies

```
                    ┌─────────────────────────────────┐
                    │      Phase 0.5 (BLOCKER)        │
                    │  HistoryManager modifications   │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
StyleResolver.js ──────┐    HistoryManager.js ─────> HistoryBridge.js
                       │                                    │
                       ├──> StyleBridge.js                  │
themeSettings ─────────┘           │                        │
                                   ▼                        │
                         TextEditManager.js <───────────────┘
                                   │
                                   ▼
                         TextElement.js
                                   │
                                   ▼
                    TextSection.js (Property Inspector)
```

---

## Test Strategy

### Unit Tests (vitest)
- All new classes
- All new handlers
- Edge cases
- styleId integration
- IME composition
- ContentSanitizer security (XSS)
- HistoryBridge isolation

### Integration Tests (vitest)
- Full edit workflows
- Placeholder lifecycle
- Layer tree integration
- StyleResolver chain
- Undo/Redo flows
- Selection preservation

### Visual Tests (manual)
- Dark mode rendering
- Light mode rendering
- CSS variable usage
- Focus indicators
- Placeholder styling

### Manual Testing
- Cross-browser (Chrome, Firefox, Safari, Edge)
- Performance profiling
- CJK input with real IME
- Edge cases
- Realtime collaboration scenarios

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

### Phase 0.5 Complete (BLOCKER)
- HistoryManager.pause()/resume() working
- text-edit entry type handled
- Existing undo/redo unaffected

### Phase 1 Complete
- New architecture in place
- No regressions
- New vitest tests passing
- HistoryBridge integrated

### Phase 2-5 Complete
- All spec requirements met
- Performance acceptable
- User experience matches Figma/Keynote
- Dark/light mode tested

### Phase 6-7 Complete
- styleId integration seamless
- All colors from CSS variables
- IME works for CJK
- Undo/Redo works correctly
- Multi-element editing correct

---

## Timeline Summary

| Phase | Duration | Priority | Dependencies | Key Principle |
|-------|----------|----------|--------------|---------------|
| 0: Foundation | 2-3 days | P0 | None | App integrity |
| 0.5: HistoryManager | 0.5-1 day | P0 | None | **Undo/redo (BLOCKER)** |
| 1: Architecture | 3-4 days | P0 | Phase 0, 0.5 | App integrity |
| 2: Enter/Exit | 2-3 days | P1 | Phase 1 | App integrity |
| 3: Layer Tree | 2-3 days | P1 | Phase 2 | Design system |
| 4: Rich Text | 3-4 days | P1 | Phase 2 | App integrity |
| 5: Polish | 2-3 days | P2 | Phase 4 | Design system |
| 6: Style Integration | 2-3 days | P1 | Phase 4 | Design system |
| 7: Advanced | 2-3 days | P2 | Phase 5, 6 | Undo/redo, Collab |

**Total Estimated: 19-28 days**

---

## Architecture Reference

See `documentation/tech-specs/core/text-editing/` for detailed specs:

| File | Content |
|------|---------|
| `00-architecture-overview.md` | System context, principles compliance |
| `01-text-edit-manager.md` | Core orchestrator |
| `02-placeholder-manager.md` | Master/slide placeholders |
| `03-selection-manager.md` | Selection preservation |
| `04-content-sanitizer.md` | HTML allowlist cleaning |
| `05-style-bridge.md` | Style cascade, design tokens |
| `06-history-bridge.md` | Undo/redo integration, **HistoryManager mods** |
| `07-ime-handler.md` | CJK composition support |
| `08-content-recovery.md` | Draft saving |
| `09-text-element-integration.md` | Renderer delegation |
| `10-store-handlers.md` | State shape, actions |
| `11-property-inspector-integration.md` | PI sync |
| `12-constants.md` | Design token references |
