# Code Fill Panel Implementation Plan

## Overview
This plan outlines the implementation of the dedicated Code Fill Panel, a draggable, resizable flyout panel for managing code-based dynamic fills. The implementation follows the established patterns from Typography Style Manager and Color Theme Manager.

**Status: ✅ IMPLEMENTED**

---

## Phase 1: Foundation (Core Structure)

### 1.1 Create CodeFillPanel Base Class
**File:** `src/ui/panels/CodeFillPanel.js`

**Tasks:**
- [x] Create `CodeFillPanel` class extending `DraggablePanel`
- [x] Configure panel options:
  - ID: `code-fill-panel`
  - Title: `Code Fill`
  - Default size: `380px × 600px`
  - Min size: `340px × 500px`
  - Max size: `600px × 900px`
- [x] Implement `buildUI()` method with placeholder content
- [x] Register with panel system for singleton access
- [x] Add position/size persistence to localStorage

**Dependencies:** `DraggablePanel.js`, `SegmentedControl.js`

### 1.2 Create Panel CSS
**File:** `styles/modules/code-fill-panel.css`

**Tasks:**
- [ ] Define `.code-fill-panel` base styles
- [ ] Create `.cfp-fill-layer-bar` styles for fill layer swatch bar
- [ ] Define `.cfp-fill-swatch` and state variants (selected, disabled)
- [ ] Create `.cfp-preset-grid` for presets layout
- [ ] Define `.cfp-code-editor` enhanced editor styles
- [ ] Use design tokens consistently (`--spacing-*`, `--color-*`, `--radius-*`)

### 1.3 Add Entry Points
**Tasks:**
- [ ] Add "Open Panel" button to `CodeTab.js` in FillFlyout
- [ ] Add toolbar button for Code Fill Panel (alongside Theme/Typography)
- [ ] Add View menu entry: `View → Code Fill Panel`
- [ ] Implement keyboard shortcut: `Ctrl+Shift+K` / `Cmd+Shift+K`
- [ ] Add "Edit in Panel..." to code fill row in `FillSection.js`

**Files Modified:**
- `src/ui/components/FillFlyout/CodeTab.js`
- `src/ui/Toolbar.js` (or equivalent)
- `src/ui/MenuBar.js` (if exists)
- `src/core/KeyboardManager.js`
- `src/ui/properties/FillSection.js`

---

## Phase 2: Fill Layer Bar

### 2.1 Create Fill Layer Bar Component
**File:** `src/ui/panels/components/FillLayerBar.js`

**Tasks:**
- [ ] Create `FillLayerBar` class
- [ ] Accept `fills` array and `selectedIndex` as props
- [ ] Render swatch for each fill:
  - Code fills: selectable, with code icon
  - Non-code fills: disabled (40% opacity), appropriate preview
- [ ] Render "+" add button at end
- [ ] Emit events: `onSelect(index)`, `onAdd()`, `onDelete(index)`
- [ ] Handle empty state messaging

### 2.2 Fill Swatch Component
**File:** `src/ui/panels/components/FillSwatch.js`

**Tasks:**
- [ ] Create `FillSwatch` class
- [ ] Props: `fill`, `index`, `isSelected`, `isDisabled`
- [ ] Render preview based on fill type:
  - Solid: background color
  - Gradient: CSS gradient
  - Image: thumbnail
  - Video: play icon
  - Code: code icon or mini canvas
- [ ] Selection ring styling
- [ ] Disabled state styling
- [ ] Tooltip on hover

### 2.3 Context Menu for Code Fills
**Tasks:**
- [ ] Create right-click context menu for code fill swatches
- [ ] Menu items:
  - Move Up (disabled if first)
  - Move Down (disabled if last)
  - Divider
  - Duplicate
  - Divider
  - Delete (danger style)
- [ ] Wire up actions to store updates

**Files Modified:** `FillLayerBar.js`, may use existing `ContextMenu.js`

### 2.4 Add Code Fill Action
**Tasks:**
- [ ] Implement "+" button click handler
- [ ] Create new code fill with default code (from `CodeRunner.DEFAULT_CODE`)
- [ ] Insert at end of fills array
- [ ] Auto-select new code fill
- [ ] Update store with new element state

---

## Phase 3: Selection Binding

### 3.1 Object Selection Listener
**File:** `src/ui/panels/CodeFillPanel.js`

**Tasks:**
- [ ] Subscribe to `store` state changes
- [ ] Listen for `editor.selectedElementIds` changes
- [ ] When selection changes:
  - Fetch element(s) fills
  - Update Fill Layer Bar
  - Auto-select first code fill (if any)
- [ ] Handle multi-selection gracefully (use first selected, or disable editing)

### 3.2 Slide Background Mode
**Tasks:**
- [ ] Detect when no element is selected but slide background context applies
- [ ] Switch to editing slide background fills
- [ ] Add visual indicator: "Editing: Slide Background"
- [ ] Support same Fill Layer Bar logic for slide backgrounds

### 3.3 Empty States
**Tasks:**
- [ ] Implement "Select an object" empty state
- [ ] Implement "No code fills" empty state with CTA
- [ ] Style empty states per design spec

---

## Phase 4: Presets Tab

### 4.1 Reuse/Adapt PresetsTab
**File:** `src/ui/panels/CodeFillPanel.js` (or separate component)

**Tasks:**
- [ ] Import or adapt `PresetsTab` from FillFlyout
- [ ] Modify for panel context (larger grid, more columns)
- [ ] Add search input with filtering
- [ ] Add category dropdown filter
- [ ] Display both built-in and user presets
- [ ] Section headers: "Built-in" and "My Presets"

### 4.2 Preset Card Enhancements
**Tasks:**
- [ ] Larger preview canvas (panel has more space)
- [ ] Hover preview animation
- [ ] Delayed tooltip with enlarged preview
- [ ] Click applies to selected code fill (creates if none)

### 4.3 Connect Preset Selection to Active Fill
**Tasks:**
- [ ] On preset click:
  - Get selected code fill index
  - If none selected but code fills exist: warn user
  - If no code fills: create new one
  - Update code fill with preset code
  - Switch to Custom tab

---

## Phase 5: Custom Tab

### 5.1 Canvas Preview Area
**Tasks:**
- [ ] Create larger preview canvas (full width, 16:9 aspect)
- [ ] Initialize `CodeRunner` with selected code fill's code
- [ ] Handle play/pause state
- [ ] Handle code errors gracefully
- [ ] Update preview when code changes

### 5.2 Code Editor Enhancement
**Tasks:**
- [ ] Create enhanced code editor textarea
- [ ] Monospace font, proper sizing
- [ ] Resizable height (with min/max)
- [ ] Input debouncing (300ms) before store update
- [ ] Tab key support (insert spaces, don't change focus)

### 5.3 Playback Controls
**Tasks:**
- [ ] Play/Pause toggle button
- [ ] Reset button (t=0)
- [ ] Error indicator (checkmark vs warning icon)
- [ ] Display error message on hover/click

### 5.4 Real-time Updates
**Tasks:**
- [ ] On code change: update `CodeRunner`
- [ ] On code change (debounced): update store
- [ ] Validate code before applying
- [ ] Rollback to last valid code on persistent error

---

## Phase 6: AI Tab

### 6.1 AI Tab Layout
**Tasks:**
- [ ] Create AI tab content area
- [ ] Canvas preview (same as Custom tab)
- [ ] Prompt textarea
- [ ] Refine checkbox
- [ ] Update/Generate buttons
- [ ] Generation history row

### 6.2 AI Integration
**Tasks:**
- [ ] Connect to existing `AIService`
- [ ] Use existing prompts from `templates.js`
- [ ] Handle "Update" action (modify existing code)
- [ ] Handle "Generate" action (create new code)
- [ ] Show loading state during generation
- [ ] Apply generated code to preview

### 6.3 Generation History
**Tasks:**
- [ ] Track last N generations (5?)
- [ ] Store code snapshots
- [ ] Display as small thumbnails
- [ ] Click to restore previous generation
- [ ] Session-only storage (not persisted)

---

## Phase 7: Store Integration

### 7.1 Update Fill Actions
**File:** `src/core/Store.js` (or actions file)

**Tasks:**
- [ ] Ensure `updateElementFill(elementId, fillIndex, fillData)` exists
- [ ] Ensure `addElementFill(elementId, fillData)` exists
- [ ] Ensure `removeElementFill(elementId, fillIndex)` exists
- [ ] Ensure `reorderElementFills(elementId, fromIndex, toIndex)` exists
- [ ] All actions should trigger undo/redo history

### 7.2 Undo/Redo Integration
**Tasks:**
- [ ] Code changes should be undoable
- [ ] Group rapid changes (within 500ms) into single undo action
- [ ] Test undo/redo with code fill operations

---

## Phase 8: Polish & Testing

### 8.1 Keyboard Navigation
**Tasks:**
- [ ] Tab between fill swatches
- [ ] Enter to select
- [ ] Delete to delete
- [ ] Arrow keys in preset grid
- [ ] Escape to close panel

### 8.2 Copy/Paste Support
**Tasks:**
- [ ] Ctrl+C copies selected code fill's code
- [ ] Ctrl+V creates new code fill with clipboard content
- [ ] Handle paste in code editor (standard behavior)

### 8.3 Drag & Drop Reorder
**Tasks:**
- [ ] Implement drag on fill swatches
- [ ] Drop to reorder
- [ ] Visual insertion indicator
- [ ] Update store on drop

### 8.4 Performance Optimization
**Tasks:**
- [ ] Lazy-load presets (canvas only when in viewport)
- [ ] Pause hidden previews
- [ ] Throttle code editor input handling
- [ ] Debounce store updates

### 8.5 Accessibility
**Tasks:**
- [ ] ARIA labels on interactive elements
- [ ] Focus management on tab switch
- [ ] Screen reader announcements for actions
- [ ] Visible focus indicators

### 8.6 Testing
**Tasks:**
- [ ] Unit tests for FillLayerBar logic
- [ ] Integration test: preset selection flow
- [ ] Integration test: code editing flow
- [ ] Integration test: fill layer management
- [ ] Visual regression tests

---

## File Structure Summary

```
src/
├── ui/
│   ├── panels/
│   │   ├── CodeFillPanel.js          # Main panel class
│   │   └── components/
│   │       ├── FillLayerBar.js       # Fill layer swatch bar
│   │       └── FillSwatch.js         # Individual fill swatch
│   └── components/
│       └── FillFlyout/
│           └── CodeTab.js            # Modified: add "Open Panel" button
├── core/
│   └── Store.js                      # Modified: ensure fill actions exist

styles/
└── modules/
    └── code-fill-panel.css           # New: panel-specific styles
    └── variables.css                 # May need new tokens

documentation/
└── specs/
    └── code-fill-panel.md            # Created: specification
└── plans/
    └── code-fill-panel-implementation.md  # This file
```

---

## Dependencies

### Existing Components to Reuse
- `DraggablePanel` - Base panel class
- `SegmentedControl` - Tab switcher
- `IconButton` - Button components
- `ContextMenu` - Right-click menus (if exists)
- `PresetsTab` - Preset grid display
- `CodeRunner` - Canvas code execution
- `AIService` - AI generation
- `PresetManager` - Preset CRUD operations

### New Components to Create
- `CodeFillPanel` - Main panel
- `FillLayerBar` - Fill layer management
- `FillSwatch` - Fill preview swatch

---

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Foundation | 2 days | P0 |
| Phase 2: Fill Layer Bar | 2 days | P0 |
| Phase 3: Selection Binding | 1 day | P0 |
| Phase 4: Presets Tab | 1 day | P1 |
| Phase 5: Custom Tab | 2 days | P1 |
| Phase 6: AI Tab | 1 day | P2 |
| Phase 7: Store Integration | 1 day | P0 |
| Phase 8: Polish & Testing | 2 days | P1 |

**Total Estimated Time:** 12 days

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance with multiple running canvases | High | Pause non-visible previews, throttle updates |
| Complex state management with fills | Medium | Use existing patterns from FillSection |
| AI service availability | Low | Graceful degradation, show offline message |
| Undo/redo complexity | Medium | Group rapid changes, test thoroughly |

---

## Success Criteria

1. ✅ Panel opens from all entry points
2. ✅ Fill Layer Bar correctly shows all fills with proper states
3. ✅ Code fills can be selected, added, deleted, reordered
4. ✅ Preset selection applies to selected code fill
5. ✅ Code editing updates preview in real-time
6. ✅ Changes persist to store and are undoable
7. ✅ Works for both elements and slide backgrounds
8. ✅ Matches design patterns of existing panels (Typography, Color Theme)
9. ✅ Responsive and performant
10. ✅ Accessible with keyboard navigation
