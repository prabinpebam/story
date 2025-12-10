# Property Inspector v2.0 - Implementation Plan

> **Status:** In Progress (Phase 0 & 1 mostly complete)  
> **Updated:** December 10, 2025  
> **Principles Reference:** [principles.md](../../../00-product/principles.md)

---

## Executive Summary

This plan tracks the implementation of Property Inspector v2.0 features based on the comprehensive specification. All work follows the project principles: small incremental changes, design system compliance, mandatory test validation, and compatibility with undo/redo, storage, and real-time collaboration systems.

---

## Implementation Status Summary

### ✅ Completed Features

#### Phase 0: Foundation
- ✅ **BaseSection class** - Created at `src/ui/properties/BaseSection.js`
  - Provides common methods: `getElement()`, `updateProperty()`, `updateStyle()`, `getMixedValue()`
  - All sections now extend BaseSection: AppearanceSection, FillSection, PositionSection, StrokeSection, TextSection, EffectsSection, LayoutSection, ExportSection
  - Tests: `tests/unit/ui/properties/BaseSection.test.js` (32 tests passing)

- ✅ **PropertyRow component** - Created at `src/ui/components/PropertyRow.js`
  - Provides drag-and-drop, visibility toggle, delete functionality
  - Tests: `tests/unit/ui/components/PropertyRow.test.js` (21 tests passing)
  - **NOTE**: Not yet integrated into Fill/Stroke/Effects sections (they still use custom row code)

- ✅ **Mixed value support** - `NumberInput` has full mixed state support
  - Shows "—" placeholder when selection has different values
  - Clears mixed state when user inputs new value
  - Used with `getMixedValue()` utility from `SelectionUtils.js`

#### Phase 1: Critical Features
- ✅ **Per-corner border radius** - Fully implemented in `AppearanceSection.js`
  - Link/unlink toggle between uniform and per-corner modes
  - 4 independent corner inputs (TL, TR, BL, BR)
  - Stores as `cornerRadii: { tl, tr, bl, br }` or simple `borderRadius: number`

- ✅ **Distribute controls** - Fully implemented in `PositionSection.js`
  - Horizontal and vertical distribute buttons
  - Enabled only when 3+ elements selected
  - Uses `DISTRIBUTE_ELEMENTS` action

- ✅ **Multiple effects** - Array-based effects in `EffectsSection.js`
  - Supports: dropShadow, innerShadow, layerBlur, backgroundBlur
  - Each effect has: type, visible, blend mode, parameters
  - Drag to reorder effects

- ✅ **Theme-linked fills** - Visual indicators in `FillSection.js`
  - `.fill-linked` class when `fill.themeSlot` is set
  - Accent border + link icon for theme-linked colors
  - CSS: `styles/modules/theme-linked.css`

### 🚧 Partially Complete

#### Phase 0: Foundation Gaps
- ⚠️ **PropertyRow Integration** - Component exists but not yet used
  - FillSection still uses custom `createFillRow()`
  - StrokeSection still uses custom row creation
  - EffectsSection still uses custom row creation
  - **Action needed**: Refactor sections to use PropertyRow component

- ⚠️ **Design System Audit** - Needs verification
  - Some sections may still have hardcoded colors
  - Need to run theme litmus test (switch accent color, verify no hardcoded blues)
  - **Action needed**: Audit all PI CSS files for hardcoded values

### ❌ Not Started

#### Phase 2: Feature Parity
- ❌ **Export preview** - Live preview of export output in ExportSection
- ❌ **Light mode support** - Full light/dark mode theming for PI

#### Phase 3: Polish
- ❌ **ARIA implementation** - Comprehensive accessibility for all sections
- ❌ **Keyboard navigation** - Complete keyboard-only workflow

#### Phase 4: Theme Integration  
- ❌ **Slide theme override dropdown** - Direct theme selection in SlideSection
- ❌ **Typography style override** - Style selection in SlideSection
- ❌ **Theme-linked typography indicator** - Visual indicator in TextSection
- ❌ **Copy/paste theme slot preservation** - Maintain theme links across paste

---

## Phase 0: Foundation & Technical Debt

### Goal
Establish solid foundation before adding new features. Fix technical debt that would compound with new changes.

### 0.1 Design System Audit ⚠️ NEEDS VERIFICATION

**Objective:** Ensure ALL Property Inspector components use centralized design system.

| Task | File | Current State | Action | Effort |
|------|------|---------------|--------|--------|
| Audit inline styles | All section files | ✅ Mostly clean | Verify no inline styles remain | 1h |
| Verify component usage | All sections | ✅ Using Button/IconButton | Verify consistency | 1h |
| Token compliance | PI CSS files | ⚠️ Unknown | Audit for hardcoded colors | 2h |

**Validation:**
```bash
# Run theme litmus test
1. Switch accent color from blue to purple  
2. Verify ALL hover/active/selected states use purple
3. If ANY blue remains → fix hardcoded value
```

**Tests Required:**
- [ ] Visual regression test for theme switching
- [ ] Unit test for each component using design tokens

### 0.2 Extract Shared Row Component ✅ COMPLETE (Not Integrated)

**Status:** Component created and tested, but not yet integrated into sections.

**Completed:**
- ✅ Created `src/ui/components/PropertyRow.js`
- ✅ Tests passing: `tests/unit/ui/components/PropertyRow.test.js` (21 tests)

**Remaining Work:**
- [ ] Refactor `FillSection.createFillRow()` to use PropertyRow
- [ ] Refactor `StrokeSection` to use PropertyRow  
- [ ] Refactor `EffectsSection` to use PropertyRow

**Estimated Effort:** 4-6 hours

**Risk:** Medium - Touches multiple files with complex drag-and-drop logic
**Mitigation:** One section at a time, full test suite after each

### 0.3 Section Base Class ✅ COMPLETE

**Status:** Fully implemented and integrated across all sections.

**Completed:**
- ✅ Created `src/ui/properties/BaseSection.js`
- ✅ Tests: `tests/unit/ui/properties/BaseSection.test.js` (32 tests passing)
- ✅ All 8 element sections now extend BaseSection:
  - AppearanceSection ✅
  - EffectsSection ✅
  - ExportSection ✅
  - FillSection ✅
  - LayoutSection ✅
  - PositionSection ✅
  - StrokeSection ✅
  - TextSection ✅

**Not Extended (Special Cases):**
- PlaceholderSection (master-mode specific)
- SlideSection (non-element properties)

---

## Phase 1: Critical Fixes ✅ COMPLETE

### Goal
Fix P0 issues that cause user confusion or workflow gaps.

### 1.1 Multi-Selection "Mixed" Value Display ✅ COMPLETE

**Status:** Fully implemented with `NumberInput.mixed` state and `getMixedValue()` utility.

**Completed:**
- ✅ `NumberInput` has `mixed` property and `setMixed()` method
- ✅ Shows "—" placeholder when mixed=true
- ✅ `BaseSection.getMixedValue()` helper method delegates to `SelectionUtils.getMixedValue()`
- ✅ `SelectionUtils.getMixedValue()` handles nested properties (e.g., 'fill.color')
- ✅ Clears mixed state when user inputs new value

**Usage Example:**
```javascript
const result = getMixedValue(elements, 'opacity');
this.opacityInput.setMixed(result.mixed);
if (!result.mixed) {
    this.opacityInput.setValue(result.value);
}
```

**Files Modified:**
- `src/ui/components/NumberInput.js` - Mixed state support
- `src/utils/SelectionUtils.js` - getMixedValue() utility
- `src/ui/properties/BaseSection.js` - Delegates to SelectionUtils

**Tests:** Covered in BaseSection.test.js and NumberInput tests

### 1.2 Per-Corner Border Radius ✅ COMPLETE

**Status:** Fully implemented in AppearanceSection with link/unlink toggle.

**Completed:**
- ✅ Uniform radius input with link button
- ✅ Per-corner radius grid (TL, TR, BL, BR inputs)
- ✅ Link toggle switches between modes
- ✅ Stores as `cornerRadii: { tl, tr, bl, br }` object
- ✅ Falls back to simple `borderRadius` number for uniform mode
- ✅ Backward compatible with legacy `borderRadius` number values

**Files Modified:**
- `src/ui/properties/AppearanceSection.js` - Full per-corner UI
- Element data model supports both formats

**Tests:** Covered in AppearanceSection tests (per-corner radius suite)

### 1.3 Distribute Controls ✅ COMPLETE

**Status:** Fully implemented in PositionSection with horizontal and vertical distribution.

**Completed:**
- ✅ Horizontal distribute button (Icon: DISTRIBUTE_H)
- ✅ Vertical distribute button (Icon: DISTRIBUTE_V)
- ✅ Buttons disabled when < 3 elements selected
- ✅ Uses `DISTRIBUTE_ELEMENTS` store action
- ✅ `ElementHandlers.handleDistributeElements()` implementation
- ✅ Distributes spacing evenly between first and last element

**Files Modified:**
- `src/ui/properties/PositionSection.js` - Distribute UI
- `src/core/handlers/ElementHandlers.js` - Distribution logic
- `src/core/Store.js` - DISTRIBUTE_ELEMENTS action
- `src/ui/Icons.js` - DISTRIBUTE_H and DISTRIBUTE_V icons

**Tests:** 
- `tests/unit/core/handlers/ElementHandlers.test.js` - Distribution logic
- `tests/unit/ui/properties/PositionSection.test.js` - UI behavior

---

## Phase 2: Feature Parity

### Goal
Achieve feature parity with Figma for core inspector features.

### 2.1 Multiple Shadows/Effects ✅ COMPLETE

**Status:** Fully implemented with array-based effects model.

**Completed:**
- ✅ Array-based `element.style.effects` data model
- ✅ Supports: dropShadow, innerShadow, layerBlur, backgroundBlur
- ✅ Each effect has: id, type, visible, blend mode, parameters
- ✅ Add/remove/reorder effects
- ✅ Effect-specific flyouts for detailed settings
- ✅ Visibility toggle per effect
- ✅ Drag-and-drop reordering

**Files Modified:**
- `src/ui/properties/EffectsSection.js` - Array-based UI
- `src/core/constants/EffectDefaults.js` - Effect type definitions
- Element data model supports effects array

**Tests:** Covered in EffectsSection.test.js (multiple effects suite)

### 2.2 Export Preview ❌ NOT STARTED

**Status:** Not yet implemented.

**Spec Reference:** [09-export-section.md](./09-export-section.md) (enhancement)

**Current State:** Export presets with no preview  
**Expected State:** Live preview of export output

**UI Addition:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Export                                              [+]  ▼     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐
│  │                    Preview Area                             │
│  │              [Rendered preview at scale]                    │
│  │                                                             │
│  │              Dimensions: 400×300px                          │
│  │              File size: ~24KB                               │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  1×  .png  @1x                                          [🗑]    │
│  2×  .png  @2x                                          [🗑]    │
│                                                                 │
│  [        Export Selected        ]                              │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Use existing `ThumbnailRenderer` for preview generation
- Debounce preview updates (300ms after last change)
- Show estimated file size based on format/quality

**Files to Modify:**
- `src/ui/properties/ExportSection.js` - Add preview area
- `src/rendering/ThumbnailRenderer.js` - Add export preview method
- `styles/modules/properties.css` - Preview styling

**Tests Required:**
- [ ] Preview updates on scale change
- [ ] Preview updates on format change
- [ ] Estimated file size calculation
- [ ] Preview performance (< 300ms render)

**Undo/Redo Compatibility:** ✅ No state changes
**Storage Compatibility:** ✅ No state changes
**Collaboration Compatibility:** ✅ Local UI only

---

## Phase 3: Polish & Accessibility ⚠️ PARTIAL

### Goal
Complete accessibility implementation and polish interactions.

### 3.1 ARIA Implementation ⚠️ PARTIAL

**Status:** Basic ARIA exists in Section component, but comprehensive implementation incomplete.

**Spec Reference:** All section ARIA tables in specs

**Current State:** Section component has basic aria-expanded, aria-controls
**Expected State:** Full ARIA compliance per spec

**Implementation Checklist:**
- [ ] All sections have `role="group"` with `aria-labelledby`
- [ ] All inputs have `aria-label` or `aria-labelledby`
- [ ] Numeric inputs have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Dropdowns have `aria-expanded`, `aria-haspopup`
- [ ] Flyouts trap focus and have `aria-modal`
- [ ] Live regions announce value changes
- [ ] Color swatches announce color value

**Files to Modify:**
- All section files
- All component files
- Add `src/ui/utils/announce.js` for screen reader announcements

**Tests Required:**
- [ ] Axe accessibility audit passes
- [ ] Keyboard navigation test
- [ ] Screen reader announcement test

### 3.2 Light/Dark Mode Support ⚠️ NEEDS VERIFICATION

**Spec Reference:** [principles.md](../../../00-product/principles.md) - Theming as Litmus Test

**Current State:** Design tokens in place, but light mode testing needed
**Expected State:** Full light mode support with no hardcoded values

**Implementation:**
1. Audit all hardcoded colors in Property Inspector CSS
2. Replace with semantic tokens that respond to `[data-theme="light"]`
3. Test with theme toggle

**Validation:**
```css
/* Before */
.pi-section { background: #2D2D2D; }

/* After */
.pi-section { background: var(--color-bg-panel); }
```

**Files to Modify:**
- `styles/modules/properties.css`
- Any component CSS used in PI

**Tests Required:**
- [ ] Visual regression: dark mode
- [ ] Visual regression: light mode
- [ ] No hardcoded color values remain

---

## Phase 4: Theme-Linked Properties ⚠️ PARTIAL

### Goal
Complete implementation of theme-linked property indicators and slide-level theme override UI.

**Spec Reference:** [16-theme-linked-properties.md](./16-theme-linked-properties.md), [Color Theme Cascade](../../slides/themes/color-theme-cascade-architecture.md)

### 4.1 Theme-Linked Indicator in Fill Section ✅ COMPLETE

**Status:** Fully implemented with visual indicators for theme-linked fills.

**Completed:**
- ✅ `.fill-linked` class added when `fill.themeSlot` is set
- ✅ Accent border styling via CSS (`styles/modules/theme-linked.css`)
- ✅ Link icon displayed for theme-linked fills
- ✅ Slot name/number shown in UI
- ✅ `StyleResolver.resolveThemeSlot()` resolves actual colors
- ✅ Picking custom color breaks theme link (removes `themeSlot`)
- ✅ Picking theme swatch creates theme link (sets `themeSlot`)

**Files Modified:**
- `src/ui/properties/FillSection.js` - Theme-linked detection and UI
- `styles/modules/theme-linked.css` - Visual styling

### 4.2 Slide Theme Override Dropdown ❌ NOT STARTED

**Current State:** Only "Edit" button exists - opens ColorThemeManager panel
**Expected State:** Dropdown to select/override theme directly in SlideSection

**UI Implementation:**
```
┌─────────────────────────────────────────────────────────────────┐
│  HARDCODED:                                                     │
│  [≡] [■] #FF5500    100%  [👁] [−]                             │
│                                                                 │
│  THEME-LINKED:                                                  │
│  [≡] ║[■] Slot 5 🔗  100%  [👁] [−]                            │
│      ↑ Accent border + "Slot N" label + link icon              │
└─────────────────────────────────────────────────────────────────┘
```

**Files to Modify:**
- `src/ui/properties/FillSection.js` - Add `theme-linked` class when `fill.themeSlot` exists
- `src/ui/components/FillFlyout/SolidTab.js` - Update to pass `themeSlot` in callback
- `styles/modules/properties.css` - Add `.fill-row.theme-linked` styles

**Tests Required:**
- [ ] Fill row shows accent border when `themeSlot` is set
- [ ] Fill row shows "Slot N" label instead of hex when linked
- [ ] Link icon (🔗) visible for linked fills
- [ ] Picking custom color removes `themeSlot` (breaks link)
- [ ] Picking theme swatch sets `themeSlot` (creates link)

### 4.2 Slide Theme Override Dropdown ❌ NOT STARTED

**Current State:** Only "Edit" button exists - opens ColorThemeManager
**Expected State:** Dropdown to select/override theme directly in SlideSection

**Implementation Tasks:**
1. Create theme dropdown component in SlideSection
2. Hook into `Slide.colorTheme` property
3. Integrate with `StyleResolver.getSlideTheme()` cascade
4. Implement "Auto" option (inherits from presentation)
5. Test theme override cascading

**Files to Modify:**
- `src/ui/properties/SlideSection.js` - Add theme dropdown
- `src/core/actions/slideActions.js` - Add `UPDATE_SLIDE_STYLE_ASSIGNMENTS` handler
- `src/utils/StyleResolver.js` - Verify `getEffectiveColorTheme()` works

**Test Coverage:**
- Dropdown shows "Inherit from Layout" option
- Dropdown lists all available themes with preview swatches
- Selecting theme dispatches action and updates slide
- Selecting "Inherit" clears `styleAssignments.colorTheme`
- Swatches update to reflect selected theme
- Source label updates ("Inherited" vs "Override")
- Reset button clears override

### 4.3 Slide Typography Override Dropdown ❌ NOT STARTED

**Current State:** Basic font display in SlideSection
**Expected State:** Dropdown to override typography settings at slide level

**Implementation Tasks:**
1. Add `typographyTheme` property to `Slide` model
2. Create typography theme dropdown in SlideSection
3. Hook into `TypographyStyleManager.getTheme(slide)` cascade
4. Implement "Auto" option (inherits from presentation)
5. Test inheritance and overrides

**Files to Modify:**
- `src/ui/properties/SlideSection.js` - Add typography override dropdown
- `src/utils/StyleResolver.js` - Add `getEffectiveTypographyStyle()`

**Test Coverage:**
- Dropdown shows available typography presets
- Selecting preset updates slide's typography override
- Reset button clears typography override
- Source label shows inheritance state
- Typography changes cascade to text elements on slide

### 4.4 Theme-Linked Typography Indicator in TextSection ❌ NOT STARTED

**Current State:** Style dropdown exists but no visual indicator for style linkage
**Expected State:** Visual indicator when text uses a style, override dots for local changes

**Implementation Tasks:**
1. Add link icon when text element uses a typography style
2. Add override dots (●) to properties that differ from style
3. Implement "Reset to Style" functionality
4. Style linked typography controls

**Files to Modify:**
- `src/ui/properties/TextSection.js` - Add link indicator and override dots
- `styles/modules/properties.css` - Add `.style-linked` and `.has-override` styles

**Test Coverage:**
- Link icon appears when text uses a style
- Override dots show which properties differ from style
- Clicking reset removes overrides and restores style values
- Style dropdown shows current style name accurately

**Tests Required:**
- [ ] Link icon shows when `styleId` is set
- [ ] Override dot shows when property differs from style
- [ ] "Reset Overrides" button clears all local overrides
- [ ] Changing style updates all non-overridden properties

### 4.5 Copy/Paste Theme Slot Preservation ⚠️ NEEDS VERIFICATION

**Current State:** Unknown if `themeSlot` is preserved on copy/paste
**Expected State:** Pasting element to different theme context adapts colors

**Files to Review:**
- `src/core/clipboard.js` - Verify `themeSlot` is included in copy
- `src/core/actions/elementActions.js` - Verify color resolution on paste

**Test Coverage Needed:**
- Copy element with `themeSlot: 5` on Ocean theme
- Paste to slide with Forest theme
- Verify `themeSlot: 5` preserved, color resolved to Forest's slot 5
- Verify undo/redo maintains correct colors

---

## Testing Strategy

### Unit Tests (Per Feature)

Every task requires unit tests BEFORE merge:

| Component | Test File | Status |
|-----------|-----------|--------|
| BaseSection | `BaseSection.test.js` | ✅ 32 tests passing |
| PropertyRow | `PropertyRow.test.js` | ✅ 21 tests passing |
| NumberInput (mixed) | `NumberInput.test.js` | ✅ Tests updated |
| Per-corner radius | `AppearanceSection.test.js` | ✅ Tests updated |
| Distribute | `PositionSection.test.js` | ✅ Tests updated |
| Multiple effects | `EffectsSection.test.js` | ✅ Tests updated |
| Export preview | `ExportSection.test.js` | ❌ Not implemented |

### Integration Tests

| Flow | Test Scope |
|------|------------|
| Multi-select edit | Select 3 elements → Edit property → All update |
| Undo/redo | Change → Undo → Redo → Verify state |
| Theme switch | Toggle theme → Verify all colors change |
| Keyboard nav | Tab through all controls → Verify order |

### Validation Commands

```bash
# Run all tests
npm test

# Run PI-specific tests
npm test -- --grep "properties"

# Run with coverage
npm test -- --coverage

# Visual regression (if configured)
npm run test:visual
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Multi-effect migration breaks existing files | Medium | High | Feature flag, extensive migration testing |
| Per-corner radius breaks existing files | Low | Medium | Backward compatible data model |
| BaseSection refactor causes regressions | Medium | High | One section at a time, full test suite |
| ARIA changes break existing behavior | Low | Low | Non-breaking additions |
| Light mode reveals hardcoded values | High | Medium | Systematic token audit |

---

## Dependencies

### External Dependencies
- None - all features use existing internal systems

### Internal Dependencies
| Feature | Depends On |
|---------|------------|
| Multi-selection mixed | BaseSection refactor |
| Multiple effects | PropertyRow component |
| Per-corner radius | None |
| Distribute | None |
| Export preview | ThumbnailRenderer (exists) |

---

## Timeline Summary

| Week | Phase | Status |
|------|-------|--------|
| 1-2 | Phase 0 | ⚠️ PARTIAL - PropertyRow not integrated, design audit needed |
| 3-4 | Phase 1 | ✅ COMPLETE - Mixed values, per-corner radius, distribute |
| 5-6 | Phase 2a | ✅ COMPLETE - Multiple effects |
| 7-8 | Phase 2b | ❌ NOT STARTED - Export preview |
| 9-10 | Phase 3 | ⚠️ PARTIAL - ARIA needs completion, light mode needs verification |
| 11-12 | Phase 4 | ⚠️ PARTIAL - Theme-linked fills done, slide dropdowns not started |

---

## Success Criteria

### Phase 0 Complete When:
- [ ] Zero hardcoded color values in PI CSS (⚠️ NEEDS AUDIT)
- [ ] Theme litmus test passes (⚠️ NOT VERIFIED)
- [x] PropertyRow component extracted and tested (✅ 21 tests passing)
- [x] BaseSection implemented, 3+ sections migrated (✅ 8 sections migrated, 32 tests passing)

### Phase 1 Complete When:
- [x] Multi-select shows "Mixed" correctly (✅ COMPLETE)
- [x] Per-corner radius works with undo/redo (✅ COMPLETE)
- [x] Distribute controls work for 3+ elements (✅ COMPLETE)
- [x] All tests pass (✅ VERIFIED)

### Phase 2 Complete When:
- [x] Multiple effects with drag reorder (✅ COMPLETE)
- [ ] Export preview renders in < 300ms (❌ NOT STARTED)
- [x] Old files migrate automatically (✅ BACKWARD COMPATIBLE)
- [x] All tests pass (✅ VERIFIED for effects)

### Phase 3 Complete When:
- [ ] Axe audit: 0 critical/serious issues (⚠️ NEEDS COMPLETION)
- [ ] Light mode: full visual parity (⚠️ NEEDS VERIFICATION)
- [ ] Keyboard navigation: complete flow (⚠️ NEEDS VERIFICATION)
- [x] All tests pass (✅ VERIFIED for completed features)

### Phase 4 Complete When:
- [x] Fill rows show theme-linked indicator (accent border + icon) (✅ COMPLETE)
- [ ] Slide theme override dropdown works (❌ NOT STARTED)
- [ ] Typography style override dropdown works (❌ NOT STARTED)
- [ ] Copy/paste preserves themeSlot references (⚠️ NEEDS VERIFICATION)
- [ ] All theme cascade tests pass (⚠️ PARTIAL)

---

## Appendix: File Change Summary

### New Files
```
src/ui/components/PropertyRow.js
src/ui/properties/BaseSection.js
src/ui/utils/announce.js
tests/unit/ui/components/PropertyRow.test.js
tests/unit/ui/properties/BaseSection.test.js
```

### Modified Files
```
src/ui/properties/AppearanceSection.js
src/ui/properties/PositionSection.js
src/ui/properties/FillSection.js
src/ui/properties/StrokeSection.js
src/ui/properties/EffectsSection.js
src/ui/properties/ExportSection.js
src/ui/components/NumberInput.js
src/ui/components/Dropdown.js
src/core/reducers/elementReducer.js
src/rendering/ElementRenderer.js
styles/modules/properties.css
```

---

## Review Checkpoints

Before each phase merge:
1. [ ] All tests pass (`npm test`)
2. [ ] Theme litmus test passes
3. [ ] No new hardcoded values introduced
4. [ ] Undo/redo verified for affected features
5. [ ] Accessibility audit passes
6. [ ] Code review completed
