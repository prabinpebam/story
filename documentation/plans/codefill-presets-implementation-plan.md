# CodeFill Presets Implementation Plan

## Overview

This plan outlines the step-by-step implementation of the CodeFill Presets system, replacing the standalone MeshGradient with a unified preset-based architecture.

## Phase 1: Foundation (Core Infrastructure)

### 1.1 Create CodeFillPresets Data File

**File**: `src/core/constants/CodeFillPresets.js`

**Tasks**:
- [ ] Define preset data structure
- [ ] Implement Mesh Gradient as Canvas 2D code (port from WebGL)
- [ ] Create 6-8 built-in presets
- [ ] Export preset array and helper functions

**Estimated Time**: 2 hours

### 1.2 Create PresetManager Service

**File**: `src/core/services/PresetManager.js`

**Tasks**:
- [ ] `getBuiltInPresets()` - return built-in presets
- [ ] `getUserPresets()` - read from localStorage
- [ ] `getAllPresets()` - combine built-in + user
- [ ] `saveUserPreset(preset)` - save to localStorage
- [ ] `deleteUserPreset(id)` - remove from localStorage
- [ ] `updateUserPreset(id, updates)` - update existing

**Estimated Time**: 1 hour

---

## Phase 2: UI Components

### 2.1 Create PresetCard Component

**File**: `src/ui/components/FillFlyout/PresetCard.js`

**Tasks**:
- [ ] Create card container (4:3 aspect ratio)
- [ ] Add mini canvas for live preview
- [ ] Implement CodeRunner integration for preview
- [ ] Add preset name label
- [ ] Add options menu button (for user presets only)
- [ ] Implement hover state with tooltip preview
- [ ] Add click handler for selection
- [ ] Performance: throttle preview to 15fps

**Estimated Time**: 2 hours

### 2.2 Create PresetsTab Component

**File**: `src/ui/components/FillFlyout/PresetsTab.js`

**Tasks**:
- [ ] Create scrollable container
- [ ] Add "Built-in" section header
- [ ] Create 3-column grid layout
- [ ] Render PresetCard for each built-in preset
- [ ] Add "My Presets" collapsible section
- [ ] Render user presets (or empty state)
- [ ] Handle preset selection callback
- [ ] Implement scroll-based pause for performance

**Estimated Time**: 2 hours

### 2.3 Create Hover Preview Tooltip

**File**: Part of `PresetCard.js`

**Tasks**:
- [ ] Create tooltip container (240x160 canvas)
- [ ] Position near card, within viewport
- [ ] Show on 300ms hover delay
- [ ] Display larger live preview
- [ ] Add name and description text
- [ ] Hide on mouse leave

**Estimated Time**: 1 hour

---

## Phase 3: Integration

### 3.1 Update CodeTab with Sub-Tabs

**File**: `src/ui/components/FillFlyout/CodeTab.js`

**Tasks**:
- [ ] Add sub-tab header (Presets | Custom)
- [ ] Track active sub-tab state
- [ ] Render PresetsTab when "Presets" is active
- [ ] Render existing code UI when "Custom" is active
- [ ] Add "Save as Preset" button below code editor
- [ ] Implement save preset modal/dialog
- [ ] Handle preset selection → load code → switch to Custom tab

**Estimated Time**: 2 hours

### 3.2 Create Save Preset Modal

**File**: `src/ui/components/FillFlyout/SavePresetModal.js`

**Tasks**:
- [ ] Create modal overlay
- [ ] Add name input field
- [ ] Show live preview thumbnail
- [ ] Implement Cancel/Save buttons
- [ ] Validate name (non-empty, unique)
- [ ] Call PresetManager.saveUserPreset()
- [ ] Close modal and refresh presets grid

**Estimated Time**: 1 hour

---

## Phase 4: Cleanup

### 4.1 Remove MeshGradient

**Files to modify**:
- `src/core/effects/MeshGradient.js` - DELETE
- `src/core/renderer/elements/ShapeElement.js` - Remove mesh handling
- `src/core/renderer/SlideView.js` - Remove mesh handling

**Tasks**:
- [ ] Delete MeshGradient.js
- [ ] Remove MeshGradient import from ShapeElement.js
- [ ] Remove `fillType === 'mesh'` handling from ShapeElement.js
- [ ] Remove mesh cleanup from ShapeElement.js
- [ ] Remove MeshGradient import from SlideView.js
- [ ] Remove `fill.type === 'mesh'` handling from SlideView.js

**Estimated Time**: 30 minutes

### 4.2 Add Migration Logic

**File**: `src/core/Store.js` (or data loader)

**Tasks**:
- [ ] Detect `fillType: 'mesh'` in loaded data
- [ ] Convert to `fillType: 'code'`
- [ ] Apply mesh gradient preset code
- [ ] Preserve meshColors if present

**Estimated Time**: 30 minutes

---

## Phase 5: Polish & Testing

### 5.1 Accessibility

**Tasks**:
- [ ] Add keyboard navigation to preset grid
- [ ] Implement focus indicators
- [ ] Add ARIA labels
- [ ] Test with screen reader

**Estimated Time**: 1 hour

### 5.2 Performance Optimization

**Tasks**:
- [ ] Verify 15fps throttling on grid cards
- [ ] Test scroll pause behavior
- [ ] Profile memory usage with many presets
- [ ] Test on lower-end hardware

**Estimated Time**: 1 hour

### 5.3 End-to-End Testing

**Tasks**:
- [ ] Test applying built-in preset
- [ ] Test creating user preset
- [ ] Test deleting user preset
- [ ] Test renaming user preset
- [ ] Test persistence across page reload
- [ ] Test hover preview tooltip
- [ ] Test AI generation still works
- [ ] Test loading old project with mesh gradient

**Estimated Time**: 1 hour

---

## File Summary

### New Files
| File | Description |
|------|-------------|
| `src/core/constants/CodeFillPresets.js` | Built-in preset definitions |
| `src/core/services/PresetManager.js` | Preset CRUD operations |
| `src/ui/components/FillFlyout/PresetsTab.js` | Presets grid UI |
| `src/ui/components/FillFlyout/PresetCard.js` | Individual preset card |
| `src/ui/components/FillFlyout/SavePresetModal.js` | Save dialog |
| `documentation/specs/codefill-presets.md` | Specification |

### Modified Files
| File | Changes |
|------|---------|
| `src/ui/components/FillFlyout/CodeTab.js` | Add sub-tabs, save button |
| `src/core/renderer/elements/ShapeElement.js` | Remove mesh handling |
| `src/core/renderer/SlideView.js` | Remove mesh handling |

### Deleted Files
| File | Reason |
|------|--------|
| `src/core/effects/MeshGradient.js` | Replaced by CodeFill preset |

---

## Implementation Order

```
1. CodeFillPresets.js (built-in presets data)
      ↓
2. PresetManager.js (storage service)
      ↓
3. PresetCard.js (card component)
      ↓
4. PresetsTab.js (grid component)
      ↓
5. Update CodeTab.js (sub-tabs + save button)
      ↓
6. SavePresetModal.js (save dialog)
      ↓
7. Remove MeshGradient (cleanup)
      ↓
8. Test & Polish
```

---

## Total Estimated Time

| Phase | Time |
|-------|------|
| Phase 1: Foundation | 3 hours |
| Phase 2: UI Components | 5 hours |
| Phase 3: Integration | 3 hours |
| Phase 4: Cleanup | 1 hour |
| Phase 5: Polish & Testing | 3 hours |
| **Total** | **~15 hours** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Mesh gradient visual parity | Extensive testing of Canvas 2D port |
| Performance with many presets | Throttle rendering, lazy loading |
| localStorage limits | Compress code, limit preset count |
| Migration breaks old projects | Fallback to default if migration fails |
