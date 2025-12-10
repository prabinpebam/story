# Keyboard Shortcuts - Current Implementation Audit

## Overview

This document audits the current keyboard shortcut implementations in the Story application as of December 10, 2025, and provides recommendations for alignment with the new specification.

---

## Current Implementations

### 1. Global Shortcuts (src/main.js)

**Location:** Lines 195-237

**Implemented:**
```javascript
// File Operations
Ctrl/Cmd + N    → New presentation
Ctrl/Cmd + O    → Open file
Ctrl/Cmd + S    → Save
Ctrl/Cmd+Shift+S → Save as

// Edit Operations
Ctrl/Cmd + Z    → Undo
Ctrl/Cmd+Shift+Z → Redo
Ctrl/Cmd + Y    → Redo (alternate)

// Mode Toggle
Ctrl/Cmd+Shift+M → Toggle master mode
```

**Status:** ✅ Matches spec
**Notes:** 
- Good platform handling (ctrlKey || metaKey)
- Uses InputManager.shouldBlockShortcut() ✅
- Blocks during presentation mode ✅

---

### 2. Tool Shortcuts (src/ui/Toolbar.js)

**Location:** Lines 30-43

**Implemented:**
```javascript
V           → Select tool
H           → Hand tool
R           → Shape/Rectangle tool
T           → Text tool
Shift + I   → Resources panel
Shift + K   → Image tool
```

**Status:** ⚠️ Partially matches spec

**Issues:**
1. ❌ Missing tools: O (ellipse), L (line), P (pen), F (frame), K (scale), I (eyedropper)
2. ⚠️ Using manual input detection instead of InputManager
3. ⚠️ `R` should be "rectangle" not generic "shape"
4. ⚠️ `Shift+K` for image - spec suggests just `I` for eyedropper
5. ⚠️ `Shift+I` for resources - not in spec

**Recommendations:**
- Update to use InputManager.shouldBlockShortcut()
- Add missing tool shortcuts
- Align tool names with spec

---

### 3. Panel Shortcuts (src/ui/PanelManager.js)

**Location:** Lines 183-228

**Implemented:**
```javascript
Ctrl/Cmd+Shift+C → Color Theme Manager
Escape          → Close topmost panel
```

**Status:** ✅ Good infrastructure

**Notes:**
- Excellent shortcut registration system
- Escape handling is smart (closes top panel)
- Ready for additional panel shortcuts

**Missing:**
- Keyboard shortcuts panel (Ctrl/Cmd+Shift+?)
- Other panel shortcuts from spec

---

### 4. Canvas Shortcuts (src/core/CanvasManager.js)

**Status:** ⚠️ Needs audit

**Expected shortcuts:**
- Arrow keys for nudging
- Shift+Arrow for 10px nudge
- Delete for removing elements
- Ctrl/Cmd + D for duplicate
- Ctrl/Cmd + G for grouping
- Ctrl/Cmd + ]/[ for arrange

**Action needed:** Full canvas shortcut audit

---

## Comparison with Spec

### ✅ Fully Implemented

| Shortcut | Action | Location |
|----------|--------|----------|
| `Ctrl/Cmd+N` | New presentation | main.js |
| `Ctrl/Cmd+O` | Open file | main.js |
| `Ctrl/Cmd+S` | Save | main.js |
| `Ctrl/Cmd+Shift+S` | Save as | main.js |
| `Ctrl/Cmd+Z` | Undo | main.js |
| `Ctrl/Cmd+Shift+Z` | Redo | main.js |
| `V` | Select tool | Toolbar.js |
| `H` | Hand tool | Toolbar.js |
| `R` | Rectangle tool | Toolbar.js |
| `T` | Text tool | Toolbar.js |
| `Esc` | Close panel/deselect | PanelManager.js |

### ⚠️ Partially Implemented

| Shortcut | Expected Action | Current Status | Notes |
|----------|----------------|----------------|-------|
| `Ctrl/Cmd+Shift+M` | Toggle master mode | ✅ Works | Matches spec |
| `Ctrl/Cmd+Shift+C` | Color theme panel | ✅ Works | Conflicts with clipboard copy! |

### ❌ Missing (High Priority)

**Tools:**
```
O           - Ellipse tool
L           - Line tool
P           - Pen tool
F           - Frame tool
K           - Scale tool
I           - Eyedropper
```

**Edit Operations:**
```
Ctrl/Cmd+C       - Copy
Ctrl/Cmd+X       - Cut
Ctrl/Cmd+V       - Paste
Ctrl/Cmd+Alt+C   - Copy as PNG (clipboard)
Ctrl/Cmd+D       - Duplicate
Delete           - Delete selection
```

**Selection:**
```
Ctrl/Cmd+A       - Select all
Ctrl/Cmd+Shift+A - Deselect all
Tab              - Next object
Shift+Tab        - Previous object
```

**Transform:**
```
Arrows           - Nudge 1px
Shift+Arrows     - Nudge 10px
Ctrl/Cmd+Arrows  - Nudge by grid
```

**Arrange:**
```
Ctrl/Cmd+]       - Bring forward
Ctrl/Cmd+[       - Send backward
Ctrl/Cmd+Alt+]   - Bring to front
Ctrl/Cmd+Alt+[   - Send to back
```

**Group:**
```
Ctrl/Cmd+G       - Group
Ctrl/Cmd+Shift+G - Ungroup
```

**Zoom:**
```
Ctrl/Cmd++       - Zoom in
Ctrl/Cmd+-       - Zoom out
Ctrl/Cmd+0       - 100% zoom
Ctrl/Cmd+1       - Zoom to fit
Ctrl/Cmd+2       - Zoom to selection
```

**Alignment:**
```
Alt+A/W/H/T/S/V  - Align operations
```

---

## Issues & Conflicts

### 1. ⚠️ Ctrl/Cmd+Shift+C Conflict

**Current:** Color Theme Manager panel
**Spec:** Copy selection as PNG to clipboard

**Resolution options:**
1. Keep color theme manager as is, use `Ctrl/Cmd+Alt+C` for clipboard (as per updated spec) ✅ **RECOMMENDED**
2. Move color theme manager to different shortcut
3. Make context-aware (clipboard when elements selected, panel when not)

**Decision:** Option 1 already implemented in spec ✅

---

### 2. ⚠️ Input Blocking Inconsistency

**Issue:** Toolbar.js uses manual check instead of InputManager

**Current (Toolbar.js):**
```javascript
if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
```

**Should be:**
```javascript
if (InputManager.shouldBlockShortcut(e)) return;
```

**Fix:** Update Toolbar.js to use InputManager

---

### 3. ⚠️ Missing KeyboardManager

**Issue:** Shortcuts scattered across multiple files
- main.js: File operations, undo/redo
- Toolbar.js: Tool shortcuts
- PanelManager.js: Panel shortcuts
- CanvasManager.js: Canvas shortcuts

**Recommendation:** Implement centralized KeyboardManager as per `keyboard-shortcuts-implementation.md`

---

## Migration Plan

### Phase 1: Fix Existing Issues (1 day)

**Priority 0:**
1. [ ] Update Toolbar.js to use InputManager.shouldBlockShortcut()
2. [ ] Verify clipboard shortcut (Ctrl/Cmd+Alt+C) doesn't conflict
3. [ ] Test existing shortcuts on Mac and Windows

**Files to modify:**
- `src/ui/Toolbar.js` - Line 33 (input check)

---

### Phase 2: Add Missing Tools (2 days)

**Priority 1:**
1. [ ] Add O - Ellipse tool
2. [ ] Add L - Line tool
3. [ ] Add P - Pen tool
4. [ ] Add F - Frame tool
5. [ ] Add K - Scale tool
6. [ ] Add I - Eyedropper tool

**Files to modify:**
- `src/ui/Toolbar.js` - Add cases to switch statement
- Update toolbar UI if needed

---

### Phase 3: Add Missing Edit Operations (2 days)

**Priority 1:**
1. [ ] Add Ctrl/Cmd+C - Copy
2. [ ] Add Ctrl/Cmd+X - Cut
3. [ ] Add Ctrl/Cmd+V - Paste
4. [ ] Add Ctrl/Cmd+D - Duplicate
5. [ ] Add Delete - Delete selection
6. [ ] Add Ctrl/Cmd+Alt+C - Copy as PNG (from spec)

**Files to modify:**
- `src/main.js` - Add to keyboard handler
- Potentially `src/core/CanvasManager.js`

---

### Phase 4: Add Transform & Arrange (3 days)

**Priority 2:**
1. [ ] Arrow keys - Nudge 1px
2. [ ] Shift+Arrows - Nudge 10px
3. [ ] Ctrl/Cmd+]/[ - Bring forward/Send backward
4. [ ] Ctrl/Cmd+Alt+]/[ - Bring to front/Send to back
5. [ ] Ctrl/Cmd+G - Group
6. [ ] Ctrl/Cmd+Shift+G - Ungroup

**Files to modify:**
- `src/core/CanvasManager.js` or create new handler

---

### Phase 5: Add Zoom & View (2 days)

**Priority 2:**
1. [ ] Ctrl/Cmd++ - Zoom in
2. [ ] Ctrl/Cmd+- - Zoom out
3. [ ] Ctrl/Cmd+0 - 100% zoom
4. [ ] Ctrl/Cmd+1 - Zoom to fit
5. [ ] Ctrl/Cmd+2 - Zoom to selection

**Files to modify:**
- `src/core/canvas/ViewportController.js` or main.js

---

### Phase 6: Implement KeyboardManager (5 days)

**Priority 3:**
1. [ ] Create KeyboardManager class
2. [ ] Create ShortcutRegistry class
3. [ ] Create ContextManager class
4. [ ] Migrate all existing shortcuts
5. [ ] Add comprehensive tests

**Files to create:**
- `src/core/keyboard/KeyboardManager.js`
- `src/core/keyboard/ShortcutRegistry.js`
- `src/core/keyboard/ContextManager.js`
- `tests/unit/core/keyboard/*.test.js`

---

### Phase 7: Add Shortcut Panel UI (3 days)

**Priority 3:**
1. [ ] Create ShortcutPanel component
2. [ ] Add search functionality
3. [ ] Add category filtering
4. [ ] Register Ctrl/Cmd+Shift+? shortcut
5. [ ] Style panel

**Files to create:**
- `src/ui/panels/ShortcutPanel.js`
- `styles/modules/shortcut-panel.css`

---

### Phase 8: Advanced Features (5 days)

**Priority 4:**
1. [ ] Add alignment shortcuts (Alt+A/W/H/T/S/V)
2. [ ] Add text formatting shortcuts
3. [ ] Add presentation mode shortcuts
4. [ ] Add component shortcuts
5. [ ] Add boolean operation shortcuts

---

## Testing Requirements

### Unit Tests Needed

**KeyboardManager:**
- [ ] Shortcut registration
- [ ] Event normalization (Mac vs Windows)
- [ ] Context routing
- [ ] Priority handling
- [ ] Conflict detection

**ContextManager:**
- [ ] Context stack management
- [ ] Context detection
- [ ] Context-specific shortcut filtering

**ShortcutRegistry:**
- [ ] Shortcut storage and retrieval
- [ ] Search functionality
- [ ] Category filtering
- [ ] Usage tracking

### E2E Tests Needed

**Critical Shortcuts:**
- [ ] File operations (Ctrl/Cmd+S/N/O)
- [ ] Edit operations (Ctrl/Cmd+C/V/Z)
- [ ] Tool shortcuts (V, R, T, H)
- [ ] Selection shortcuts (Ctrl/Cmd+A, Esc)

**Platform Tests:**
- [ ] Mac keyboard shortcuts
- [ ] Windows keyboard shortcuts
- [ ] Modifier key mapping

**Context Tests:**
- [ ] Input blocking (shortcuts blocked in text fields)
- [ ] Text editing context (Ctrl/Cmd+B works in text)
- [ ] Presentation mode context (different shortcuts)

---

## Documentation Updates Needed

**User Documentation:**
- [x] Keyboard shortcuts spec (keyboard-shortcuts.md) ✅
- [x] Implementation guide (keyboard-shortcuts-implementation.md) ✅
- [x] Quick reference (keyboard-shortcuts-quick-reference.md) ✅
- [ ] Help menu integration
- [ ] Video tutorials

**Developer Documentation:**
- [x] Technical implementation guide ✅
- [ ] Migration guide (this document)
- [ ] API documentation for KeyboardManager
- [ ] Testing guidelines

---

## Estimated Effort

| Phase | Days | Priority | Status |
|-------|------|----------|--------|
| Phase 1: Fix Issues | 1 | P0 | Not started |
| Phase 2: Add Tools | 2 | P1 | Not started |
| Phase 3: Edit Operations | 2 | P1 | Not started |
| Phase 4: Transform & Arrange | 3 | P2 | Not started |
| Phase 5: Zoom & View | 2 | P2 | Not started |
| Phase 6: KeyboardManager | 5 | P3 | Not started |
| Phase 7: Shortcut Panel | 3 | P3 | Not started |
| Phase 8: Advanced | 5 | P4 | Not started |
| **Total** | **23 days** | | |

**Note:** Can be parallelized. Critical path is Phase 1-3 (5 days) for basic functionality.

---

## Recommendations

### Immediate Actions (This Week)

1. **Fix Toolbar.js input blocking** - 1 hour
   - Replace manual check with InputManager
   - Test on both Mac and Windows

2. **Verify clipboard shortcut** - 30 minutes
   - Confirm Ctrl/Cmd+Alt+C doesn't conflict
   - Document in spec if needed

3. **Add missing tools (O, L)** - 2 hours
   - Start with high-priority tools
   - Test keyboard activation

### Short Term (Next Sprint)

1. **Implement edit operations** - 2 days
   - Copy/Cut/Paste
   - Duplicate
   - Delete

2. **Add transform shortcuts** - 2 days
   - Nudging with arrows
   - Arrange (Ctrl/Cmd+]/[)
   - Group (Ctrl/Cmd+G)

3. **Start KeyboardManager planning** - 1 day
   - Review architecture
   - Plan migration strategy

### Long Term (Future Sprints)

1. **Implement KeyboardManager** - 1 week
2. **Build Shortcut Panel UI** - 3 days
3. **Add advanced features** - 1 week
4. **Comprehensive testing** - 3 days

---

## Success Criteria

### Phase 1-3 (MVP)
- [ ] All tool shortcuts work (V, H, R, T, O, L)
- [ ] All file operations work (Ctrl/Cmd+S/N/O)
- [ ] All edit operations work (Ctrl/Cmd+C/V/Z/D)
- [ ] Transform shortcuts work (arrows, arrange, group)
- [ ] Input blocking works consistently
- [ ] Tests pass on Mac and Windows

### Phase 6-7 (Full Implementation)
- [ ] KeyboardManager fully functional
- [ ] All shortcuts from spec implemented
- [ ] Shortcut panel working
- [ ] Context awareness working
- [ ] No shortcut conflicts
- [ ] Comprehensive test coverage (>90%)

### Phase 8 (Complete)
- [ ] All advanced features working
- [ ] Custom shortcuts (optional)
- [ ] Full accessibility support
- [ ] Complete documentation
- [ ] Video tutorials published

---

## Appendix: Current File Analysis

### src/main.js
- **Lines 195-237:** Global keyboard handler
- **Good:** Uses InputManager, handles platform differences
- **Needs:** More shortcuts (copy/paste, duplicate, etc.)

### src/ui/Toolbar.js
- **Lines 30-43:** Tool keyboard shortcuts
- **Issues:** Manual input check, missing tools
- **Needs:** Update to use InputManager, add missing tools

### src/ui/PanelManager.js
- **Lines 183-228:** Panel shortcut system
- **Good:** Clean registration system, escape handling
- **Needs:** More panel shortcuts, shortcut panel itself

### src/core/CanvasManager.js
- **Status:** Needs full audit
- **Expected:** Canvas-specific shortcuts (arrows, delete, etc.)
- **Action:** Review and document current implementation

---

**Last Updated:** December 10, 2025
**Status:** Ready for Implementation
**Next Action:** Begin Phase 1 (Fix existing issues)
