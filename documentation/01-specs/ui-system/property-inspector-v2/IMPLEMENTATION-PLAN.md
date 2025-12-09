# Property Inspector v2.0 - Implementation Plan

> **Status:** Planning  
> **Created:** December 2025  
> **Principles Reference:** [principles.md](../../../00-product/principles.md)

---

## Executive Summary

This plan outlines the implementation roadmap for Property Inspector v2.0 features based on the comprehensive specification. All work follows the project principles: small incremental changes, design system compliance, mandatory test validation, and compatibility with undo/redo, storage, and real-time collaboration systems.

---

## Phase 0: Foundation & Technical Debt (Week 1-2)

### Goal
Establish solid foundation before adding new features. Fix technical debt that would compound with new changes.

### 0.1 Design System Audit

**Objective:** Ensure ALL Property Inspector components use centralized design system.

| Task | File | Current State | Action | Effort |
|------|------|---------------|--------|--------|
| Audit inline styles | All section files | Some inline styles exist | Move to CSS classes using design tokens | 2h |
| Verify component usage | All sections | Some custom buttons | Replace with `Button` component | 3h |
| Token compliance | `styles/modules/properties.css` | Some hardcoded values | Replace with `var(--token)` | 2h |

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

### 0.2 Extract Shared Row Component

**Objective:** Eliminate duplicate code in Fill/Stroke/Effect rows.

**Current Problem:**
- `FillSection.js` has `createFillRow()`
- `StrokeSection.js` has `createStrokeRow()`
- `EffectsSection.js` has `createEffectRow()`
- All share: drag handle, visibility toggle, delete button, color swatch

**Solution:** Create `PropertyRow` component with variants.

```javascript
// src/ui/components/PropertyRow.js
export class PropertyRow {
    constructor({
        type,           // 'fill' | 'stroke' | 'effect'
        dragEnabled,    // boolean
        onVisibilityToggle,
        onDelete,
        onDragReorder,
        children        // Slot for type-specific content
    })
}
```

**Files to Modify:**
- Create: `src/ui/components/PropertyRow.js`
- Modify: `FillSection.js`, `StrokeSection.js`, `EffectsSection.js`

**Tests Required:**
- [ ] `PropertyRow.test.js` - All variants
- [ ] Update existing section tests

**Risk:** Medium - Touches multiple files
**Mitigation:** Feature flag, comprehensive test coverage before merge

### 0.3 Section Base Class

**Objective:** Create abstract base class for consistent section behavior.

```javascript
// src/ui/properties/BaseSection.js
export class BaseSection {
    constructor(config) {
        this.section = new Section(config);
        this.selection = [];
    }
    
    // Common patterns
    getElement(state, id) { /* ... */ }
    updateProperty(prop, value, isTransient) { /* ... */ }
    showForElementTypes(types) { /* ... */ }
    handleMultiSelection(elements, property) { /* ... */ }
    
    // Abstract - must implement
    createContent() { throw new Error('Implement createContent()'); }
    update(selection) { throw new Error('Implement update()'); }
}
```

**Files to Modify:**
- Create: `src/ui/properties/BaseSection.js`
- Refactor: All 10 section files to extend `BaseSection`

**Tests Required:**
- [ ] `BaseSection.test.js`
- [ ] Verify all sections still pass existing tests

**Risk:** High - Core refactor
**Mitigation:** One section at a time, run full test suite after each

---

## Phase 1: Critical Fixes (Week 3-4)

### Goal
Fix P0 issues that cause user confusion or workflow gaps.

### 1.1 Multi-Selection "Mixed" Value Display

**Spec Reference:** [12-interactions.md Section 9](./12-interactions.md)

**Current Behavior:** Shows first element's value
**Expected Behavior:** Show "Mixed" or "—" when values differ

**Implementation:**

```javascript
// In BaseSection.js
getMixedValue(elements, property) {
    const values = elements.map(el => el[property]);
    const unique = [...new Set(values)];
    
    if (unique.length === 1) {
        return { value: unique[0], mixed: false };
    }
    return { value: null, mixed: true };
}

// In NumberInput component - add mixed state
new NumberInput({
    value: result.mixed ? null : result.value,
    placeholder: result.mixed ? '—' : undefined,
    // ...
});
```

**Files to Modify:**
- `src/ui/components/NumberInput.js` - Add `mixed` state rendering
- `src/ui/components/Dropdown.js` - Add `mixed` state rendering  
- `src/ui/properties/BaseSection.js` - Add `getMixedValue()` helper
- All section files - Use new helper

**Tests Required:**
- [ ] NumberInput renders "—" when mixed=true
- [ ] Dropdown shows "Mixed" when mixed=true
- [ ] Each section correctly detects mixed values
- [ ] Editing mixed value applies to ALL selected elements

**Undo/Redo Compatibility:** ✅ No changes needed - existing pattern works
**Storage Compatibility:** ✅ No changes needed
**Collaboration Compatibility:** ✅ No changes needed

### 1.2 Per-Corner Border Radius

**Spec Reference:** [04-appearance-section.md Section 6](./04-appearance-section.md)

**Current State:** Single `borderRadius` value
**Expected State:** Individual corner control with link toggle

**Data Model Change:**
```javascript
// Current
element.borderRadius = 8;

// New (backward compatible)
element.borderRadius = 8;  // Uniform (legacy + default)
// OR
element.borderRadius = {
    topLeft: 8,
    topRight: 8,
    bottomRight: 4,
    bottomLeft: 4,
    linked: false  // UI state for link toggle
};
```

**UI Implementation:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Radius    [8]  [🔗]           <- Linked mode (current)         │
└─────────────────────────────────────────────────────────────────┘

OR when unlinked:

┌─────────────────────────────────────────────────────────────────┐
│  Radius         [🔓]           <- Unlinked mode                │
│  ┌─────────────────────────────────────────────────────────────┐
│  │  TL [8]    TR [8]                                           │
│  │  BL [4]    BR [4]                                           │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

**Files to Modify:**
- `src/ui/properties/AppearanceSection.js` - Add per-corner UI
- `src/core/reducers/elementReducer.js` - Handle object borderRadius
- `src/rendering/ElementRenderer.js` - Render per-corner radius
- `styles/modules/properties.css` - Radius grid layout

**Tests Required:**
- [ ] Linked mode: changing one value changes all
- [ ] Unlinked mode: independent corner values
- [ ] Toggle link: preserves values when unlinking
- [ ] Toggle link: uses max value when relinking
- [ ] Render: CSS `border-radius: TL TR BR BL` format
- [ ] Migration: number → object conversion
- [ ] Undo/redo: correct state restoration

**Undo/Redo Compatibility:** ⚠️ Verify object structure serializes correctly
**Storage Compatibility:** ⚠️ Add migration for old files
**Collaboration Compatibility:** ⚠️ Verify CRDT handles object updates

**Migration Strategy:**
```javascript
// In file loading
if (typeof element.borderRadius === 'number') {
    // Keep as number - backward compatible
}
// New files will have object when per-corner is used
```

### 1.3 Distribute Controls

**Spec Reference:** [02-position-section.md](./02-position-section.md) (to be added)

**Current State:** Only alignment controls exist
**Expected State:** Add horizontal/vertical distribute buttons

**UI Addition:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Align    [◧][◨][◩]  [⬒][⬔][⬓]                                │
│  Distrib  [⋯][⋮]                   <- NEW                      │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```javascript
// Distribute horizontally
distributeHorizontal(elementIds) {
    const elements = elementIds.map(id => getElement(id));
    const sorted = elements.sort((a, b) => a.x - b.x);
    
    const totalWidth = sorted[sorted.length - 1].x - sorted[0].x;
    const spacing = totalWidth / (sorted.length - 1);
    
    sorted.forEach((el, i) => {
        if (i > 0 && i < sorted.length - 1) {
            const newX = sorted[0].x + (spacing * i);
            store.dispatch('UPDATE_ELEMENT', { id: el.id, x: newX });
        }
    });
}
```

**Files to Modify:**
- `src/ui/properties/PositionSection.js` - Add distribute buttons
- `src/core/actions/elementActions.js` - Add `DISTRIBUTE_ELEMENTS` action
- `src/ui/Icons.js` - Add distribute icons

**Tests Required:**
- [ ] Distribute horizontal: even spacing
- [ ] Distribute vertical: even spacing
- [ ] Disabled when < 3 elements selected
- [ ] Undo restores original positions

**Undo/Redo Compatibility:** ✅ Standard UPDATE_ELEMENT pattern
**Storage Compatibility:** ✅ No changes needed
**Collaboration Compatibility:** ✅ Standard element updates

---

## Phase 2: Feature Parity (Week 5-8)

### Goal
Achieve feature parity with Figma for core inspector features.

### 2.1 Multiple Shadows

**Spec Reference:** [07-effects-section.md](./07-effects-section.md) (enhancement)

**Current State:** Single drop shadow per element
**Expected State:** Multiple shadows array, like fills/strokes

**Data Model:**
```javascript
// Current
element.dropShadow = { x: 4, y: 4, blur: 8, color: '#000000', opacity: 0.25 };

// New
element.effects = [
    { type: 'dropShadow', x: 4, y: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.25, visible: true },
    { type: 'dropShadow', x: -2, y: -2, blur: 4, spread: 0, color: '#FFFFFF', opacity: 0.1, visible: true },
    { type: 'innerShadow', x: 0, y: 2, blur: 4, color: '#000000', opacity: 0.1, visible: true },
    { type: 'layerBlur', blur: 4, visible: true },
    { type: 'backgroundBlur', blur: 8, visible: true }
];
```

**UI Changes:**
- Effects section becomes array-based like Fill/Stroke
- Each effect row shows type icon + condensed settings
- Add effect dropdown: Drop Shadow, Inner Shadow, Layer Blur, Background Blur

**Files to Modify:**
- `src/ui/properties/EffectsSection.js` - Full rewrite for array model
- `src/core/reducers/elementReducer.js` - Handle effects array
- `src/rendering/ElementRenderer.js` - Render multiple effects
- Migration script for existing files

**Tests Required:**
- [ ] Add multiple effects
- [ ] Reorder effects (drag)
- [ ] Toggle visibility per effect
- [ ] Delete individual effect
- [ ] Render stacked effects correctly
- [ ] Migration from single shadow to array

**Undo/Redo Compatibility:** ⚠️ Array operations need careful handling
**Storage Compatibility:** ⚠️ Migration required
**Collaboration Compatibility:** ⚠️ Array CRDT operations

**Risk:** High - Significant data model change
**Mitigation:** 
1. Feature flag for new effects system
2. Automatic migration on file load
3. Extensive test coverage

### 2.2 Export Preview

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

## Phase 3: Polish & Accessibility (Week 9-10)

### Goal
Complete accessibility implementation and polish interactions.

### 3.1 ARIA Implementation

**Spec Reference:** All section ARIA tables in specs

**Current State:** Basic ARIA, incomplete
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

### 3.2 Light/Dark Mode Support

**Spec Reference:** [principles.md](../../../00-product/principles.md) - Theming as Litmus Test

**Current State:** Dark mode only
**Expected State:** Full light mode support

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

## Phase 4: Theme-Linked Properties (Week 11-12)

### Goal
Complete implementation of theme-linked property indicators and slide-level theme override UI.

**Spec Reference:** [16-theme-linked-properties.md](./16-theme-linked-properties.md), [Color Theme Cascade](../../slides/themes/color-theme-cascade-architecture.md)

### 4.1 Theme-Linked Indicator in Fill Section

**Current State:** Theme swatches work, but fill rows don't indicate when a fill is theme-linked.
**Expected State:** Visual indicator (accent border + link icon) when `fill.themeSlot` is set.

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

### 4.2 Slide Theme Override Dropdown

**Current State:** Only "Edit" button exists - opens ColorThemeManager
**Expected State:** Dropdown to select/override theme directly in SlideSection

**UI Implementation:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Colors                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Theme: [Default Theme          ▼]     <- Override dropdown    │
│         ┌────────────────────────────┐                         │
│         │ ◉ Inherit from Layout      │                         │
│         │ ──────────────────────────│                          │
│         │ ○ Default Theme    [■■■]  │                          │
│         │ ○ Ocean Sunset     [■■■]  │                          │
│         │ ○ Forest Green     [■■■]  │                          │
│         │ ──────────────────────────│                          │
│         │ [+ Create Custom...]      │                          │
│         └────────────────────────────┘                         │
│                                                                 │
│  [■■■■■■][■■■■■■]                    <- 12 swatches           │
│  Source: Inherited from Master                                  │
│  [Edit ✏️]  [Reset ↺]                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Files to Modify:**
- `src/ui/properties/SlideSection.js` - Replace simple display with Dropdown
- `src/core/actions/slideActions.js` - Add `UPDATE_SLIDE_STYLE_ASSIGNMENTS` handler
- `src/utils/StyleResolver.js` - Verify `getEffectiveColorTheme()` works

**Tests Required:**
- [ ] Dropdown shows "Inherit from Layout" option
- [ ] Dropdown lists all available themes with preview swatches
- [ ] Selecting theme dispatches `UPDATE_SLIDE_STYLE_ASSIGNMENTS`
- [ ] Selecting "Inherit" clears `styleAssignments.colorTheme`
- [ ] Swatches update to reflect selected theme
- [ ] Source label updates ("Inherited" vs "Override")
- [ ] Reset button clears override

### 4.3 Typography Style Override Dropdown

**Current State:** Basic font display in SlideSection
**Expected State:** Dropdown to override typography settings at slide level

**Files to Modify:**
- `src/ui/properties/SlideSection.js` - Add typography override dropdown
- `src/utils/StyleResolver.js` - Add `getEffectiveTypographyStyle()`

**Tests Required:**
- [ ] Dropdown shows available typography presets
- [ ] Selecting preset updates slide's typography override
- [ ] Reset button clears typography override
- [ ] Source label shows inheritance state

### 4.4 Theme-Linked Typography Indicator in TextSection

**Current State:** Style dropdown exists but no visual indicator for style linkage
**Expected State:** Visual indicator when text uses a style, override dots for local changes

**UI Implementation:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Style:  [Title              ▼] 🔗    <- Link icon when styled │
│                                                                 │
│  Font:   [Inter          ▼] [Bold    ▼] [48] pt ●             │
│                                          ↑ Override dot        │
└─────────────────────────────────────────────────────────────────┘
```

**Files to Modify:**
- `src/ui/properties/TextSection.js` - Add link indicator and override dots
- `styles/modules/properties.css` - Add `.style-linked` and `.has-override` styles

**Tests Required:**
- [ ] Link icon shows when `styleId` is set
- [ ] Override dot shows when property differs from style
- [ ] "Reset Overrides" button clears all local overrides
- [ ] Changing style updates all non-overridden properties

### 4.5 Copy/Paste Theme Slot Preservation

**Current State:** Unknown if `themeSlot` is preserved on copy/paste
**Expected State:** Pasting element to different theme context adapts colors

**Files to Modify:**
- `src/core/clipboard.js` - Ensure `themeSlot` is included in copy
- `src/core/actions/elementActions.js` - Resolve color on paste

**Tests Required:**
- [ ] Copy element with `themeSlot: 5` on Ocean theme
- [ ] Paste to slide with Forest theme
- [ ] Verify `themeSlot: 5` preserved, color resolved to Forest's slot 5
- [ ] Verify undo/redo maintains correct colors

---

## Testing Strategy

### Unit Tests (Per Feature)

Every task requires unit tests BEFORE merge:

| Component | Test File | Coverage Target |
|-----------|-----------|-----------------|
| BaseSection | `BaseSection.test.js` | 95% |
| PropertyRow | `PropertyRow.test.js` | 95% |
| NumberInput (mixed) | `NumberInput.test.js` | Update existing |
| Per-corner radius | `AppearanceSection.test.js` | Update existing |
| Distribute | `PositionSection.test.js` | Update existing |
| Multiple effects | `EffectsSection.test.js` | Full rewrite |
| Export preview | `ExportSection.test.js` | Update existing |

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

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Phase 0 | Design system audit, PropertyRow, BaseSection |
| 3-4 | Phase 1 | Mixed values, per-corner radius, distribute |
| 5-6 | Phase 2a | Multiple effects |
| 7-8 | Phase 2b | Export preview |
| 9-10 | Phase 3 | ARIA, light mode |
| 11-12 | Phase 4 | Theme-linked indicators, theme override dropdowns |

---

## Success Criteria

### Phase 0 Complete When:
- [ ] Zero hardcoded color values in PI CSS
- [ ] Theme litmus test passes
- [ ] PropertyRow component extracted and tested
- [ ] BaseSection implemented, 3+ sections migrated

### Phase 1 Complete When:
- [ ] Multi-select shows "Mixed" correctly
- [ ] Per-corner radius works with undo/redo
- [ ] Distribute controls work for 3+ elements
- [ ] All tests pass

### Phase 2 Complete When:
- [ ] Multiple effects with drag reorder
- [ ] Export preview renders in < 300ms
- [ ] Old files migrate automatically
- [ ] All tests pass

### Phase 3 Complete When:
- [ ] Axe audit: 0 critical/serious issues
- [ ] Light mode: full visual parity
- [ ] Keyboard navigation: complete flow
- [ ] All tests pass

### Phase 4 Complete When:
- [ ] Fill rows show theme-linked indicator (accent border + icon)
- [ ] Slide theme override dropdown works
- [ ] Typography style override dropdown works
- [ ] Copy/paste preserves themeSlot references
- [ ] All theme cascade tests pass

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
