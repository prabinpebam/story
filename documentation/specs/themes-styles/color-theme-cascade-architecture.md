# Color Theme Cascade Architecture

## Problem Statement

The current implementation has a critical bug where applying a color theme to ANY master (theme or layout) in master mode causes the theme to appear on ALL slides, regardless of the intended target.

### Observed Behavior (Bug)
1. User applies "Electric Dreams" to theme master → All slides show Electric Dreams ✅
2. User applies "Tropical Paradise" to layout master "Title Slide" → **All slides change to Tropical Paradise** ❌
3. User applies "Citrus Burst" to individual slide in edit mode → **All slides change to Citrus Burst** ❌

### Expected Behavior
1. Theme Master: Sets the DEFAULT theme (used when no override exists)
2. Layout Master: Can override for slides using that layout (e.g., all "Title Slide" layouts)
3. Individual Slide: Can override for just that slide
4. Cascade should resolve: Slide Override > Layout Override > Theme Master Default

---

## Root Cause Analysis

### Issue 1: CSS Variables Are Global

The current implementation applies theme colors to `document.documentElement`:

```javascript
// ColorThemeManager.js
applyThemeToCSSVariables(colors, document.documentElement, currentColorMode);
```

This means **every change overwrites the global CSS variables**, regardless of which level in the hierarchy was intended.

### Issue 2: SlideView Doesn't Properly Resolve Per-Slide Themes

While `SlideView.update()` does try to apply per-slide CSS variables:

```javascript
// SlideView.js
const lumaTheme = effectiveSlide.resolvedLumaTheme;
if (lumaTheme?.resolvedColors) {
    lumaTheme.resolvedColors.forEach((hex, i) => {
        this.domElement.style.setProperty(`--theme-slot${i + 1}`, hex);
    });
}
```

The `effectiveSlide.resolvedLumaTheme` is not being populated correctly because:
1. `Store.getEffectiveSlide()` calls `StyleResolver.getThemeInfoForSlide()`
2. But `StyleResolver` uses `window._storyAppStore` which may not be set during initialization
3. Even when set, the cascade logic isn't correctly resolving layout-level overrides

### Issue 3: CSS Variable Scope Confusion

The design mixes two scopes:
- **Global CSS variables** (on `document.documentElement`) - Used for immediate visual feedback
- **Per-slide CSS variables** (on slide DOM element) - Used for rendering different themes per slide

The problem: Global variables always "win" because they're applied last and have higher specificity in the cascade.

---

## Proposed Architecture

### Principle 1: Single Source of Truth for Theme Resolution

**StyleResolver** must be the ONLY place that resolves which theme applies to any given slide. All other code paths must use StyleResolver.

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA MODEL (Store)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Theme Master ("theme-default")                                 │
│  ├── themeSettings.lumaTheme: { ... }  ← DEFAULT theme data     │
│  └── styleAssignments.colorTheme: null ← Usually null           │
│                                                                 │
│  Layout Master ("layout-title")                                 │
│  ├── parentId: "theme-default"                                  │
│  └── styleAssignments.colorTheme: "preset_tropical" OR null     │
│                                                                 │
│  Slide ("slide-1")                                              │
│  ├── layoutId: "layout-title"                                   │
│  └── styleAssignments.colorTheme: "preset_citrus" OR null       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RESOLUTION (StyleResolver)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  getEffectiveColorTheme(slideId):                               │
│    1. Check slide.styleAssignments.colorTheme                   │
│       → If set, return { themeId, source: 'slide' }             │
│    2. Check layout.styleAssignments.colorTheme                  │
│       → If set, return { themeId, source: 'layout' }            │
│    3. Fall back to themeMaster.themeSettings.lumaTheme          │
│       → Return { theme object, source: 'master' }               │
│                                                                 │
│  getLumaTheme(slideId):                                         │
│    1. Call getEffectiveColorTheme(slideId)                      │
│    2. If source is 'slide' or 'layout':                         │
│       → Look up theme by ID from presets/custom themes          │
│    3. If source is 'master':                                    │
│       → Return themeMaster.themeSettings.lumaTheme directly     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RENDERING (SlideView)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Each SlideView applies CSS variables to ITS OWN DOM element:   │
│                                                                 │
│  update():                                                      │
│    const themeInfo = StyleResolver.getThemeInfoForSlide(id)     │
│    const colors = themeInfo.lumaTheme.resolvedColors            │
│    colors.forEach((hex, i) => {                                 │
│        this.domElement.style.setProperty(`--theme-slot${i+1}`)  │
│    })                                                           │
│                                                                 │
│  CSS Variables are scoped to the slide container:               │
│  .slide-container { --theme-slot1: #xxx; ... }                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Principle 2: NO Global CSS Variables for Themes

**Remove** all calls to `applyThemeToCSSVariables(colors, document.documentElement, ...)`.

Theme CSS variables should ONLY be set on:
1. Individual slide containers (for per-slide themes)
2. The master slide editor canvas (when in master mode)

```javascript
// WRONG - Sets global variables that affect everything
applyThemeToCSSVariables(colors, document.documentElement, colorMode);

// RIGHT - Set on specific slide container
applyThemeToCSSVariables(colors, slideContainer, colorMode);
```

### Principle 3: Store Structure Clarification

```javascript
// Theme Master - Holds the DEFAULT lumaTheme definition
masters['theme-default'] = {
    id: 'theme-default',
    type: 'theme',
    themeSettings: {
        lumaTheme: {
            id: 'preset_electric_dreams',
            name: 'Electric Dreams',
            slots: [...],
            adjustments: {...},
            resolvedColors: ['#hex1', '#hex2', ...]  // Pre-computed
        }
    },
    styleAssignments: {
        colorTheme: null,  // Not used at theme master level
        colorMode: 'dark'
    }
};

// Layout Master - Can override the theme for all slides using this layout
masters['layout-title'] = {
    id: 'layout-title',
    type: 'layout',
    parentId: 'theme-default',
    styleAssignments: {
        colorTheme: 'preset_tropical_paradise'  // Theme ID reference
        // OR null to inherit from theme master
    }
};

// Slide - Can override for just this slide
slides['slide-1'] = {
    id: 'slide-1',
    layoutId: 'layout-title',
    styleAssignments: {
        colorTheme: 'preset_citrus_burst'  // Theme ID reference
        // OR null to inherit from layout/master
    }
};
```

### Principle 4: Theme Lookup by ID

When a `styleAssignments.colorTheme` contains a theme ID (not a full lumaTheme object), we need a lookup mechanism:

```javascript
// StyleResolver._lookupThemeById(themeId)
function _lookupThemeById(themeId) {
    // 1. Check built-in presets
    const preset = THEME_PRESETS.find(p => p.id === themeId);
    if (preset) {
        return themeToLumaTheme(preset);
    }
    
    // 2. Check custom themes in localStorage
    const customThemes = JSON.parse(localStorage.getItem('colorThemes') || '[]');
    const custom = customThemes.find(t => t.id === themeId);
    if (custom) {
        return themeToLumaTheme(custom);
    }
    
    // 3. Not found - return null (fallback to master)
    return null;
}

function themeToLumaTheme(theme) {
    const colors = generateThemeColors(theme.slots, theme.adjustments);
    return {
        id: theme.id,
        name: theme.name,
        slots: theme.slots,
        adjustments: theme.adjustments,
        resolvedColors: colors
    };
}
```

---

## Implementation Changes Required

### 1. ColorThemeManager.applyThemeToStore()

**Current (Broken):**
```javascript
if (mode === 'master') {
    if (activeMaster.type === 'theme') {
        // Apply lumaTheme to theme master
        store.dispatch('APPLY_LUMA_THEME', {...});
        applyThemeToCSSVariables(colors, document.documentElement, ...);  // ❌ GLOBAL
    } else if (activeMaster.type === 'layout') {
        // Assign styleAssignments.colorTheme
        store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {...});
        applyThemeToCSSVariables(colors, document.documentElement, ...);  // ❌ GLOBAL
    }
}
```

**Fixed:**
```javascript
if (mode === 'master') {
    if (activeMaster.type === 'theme') {
        // Apply lumaTheme to theme master (this IS the default)
        store.dispatch('APPLY_LUMA_THEME', {
            masterId: themeMasterId,
            theme: { id, name, slots, adjustments, colors }
        });
        // Apply CSS vars to master editor canvas only (if visible)
        if (masterEditorCanvas) {
            applyThemeToCSSVariables(colors, masterEditorCanvas, colorMode);
        }
    } else if (activeMaster.type === 'layout') {
        // Set override reference (just the ID, not full theme)
        store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
            masterId: activeMasterId,
            styleAssignments: { colorTheme: theme.id }
        });
        // Apply CSS vars to master editor canvas only (if visible)
        if (masterEditorCanvas) {
            applyThemeToCSSVariables(colors, masterEditorCanvas, colorMode);
        }
    }
} else {
    // Slide mode - set override reference on the slide
    store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId,
        styleAssignments: { colorTheme: theme.id }
    });
    // DO NOT apply global CSS vars - SlideView handles per-slide
}
```

### 2. SlideView.update()

**Current (Partially Working):**
```javascript
update(slideData, options = {}) {
    // ...
    const effectiveSlide = this.store?.getEffectiveSlide?.(this.slideId);
    const lumaTheme = effectiveSlide?.resolvedLumaTheme;
    
    if (lumaTheme?.resolvedColors) {
        lumaTheme.resolvedColors.forEach((hex, i) => {
            this.domElement.style.setProperty(`--theme-slot${i + 1}`, hex);
        });
    }
}
```

**Fixed:**
```javascript
update(slideData, options = {}) {
    // ...
    // Use StyleResolver directly (single source of truth)
    const themeInfo = StyleResolver.getThemeInfoForSlide(this.slideId);
    
    if (themeInfo?.lumaTheme?.resolvedColors) {
        themeInfo.lumaTheme.resolvedColors.forEach((hex, i) => {
            this.domElement.style.setProperty(`--theme-slot${i + 1}`, hex);
        });
        
        // Diagnostic logging
        ThemeDiag.logSlideViewApply(this.slideId, themeInfo.lumaTheme, this.domElement);
    }
}
```

### 3. StyleResolver.getLumaTheme()

**Current (Missing Layout Check):**
```javascript
getLumaTheme(slideId = null) {
    const state = store.getState();
    const themeMaster = Object.values(state.masters || {}).find(m => m.type === 'theme');
    const masterLumaTheme = themeMaster?.themeSettings?.lumaTheme || null;
    
    if (slideId) {
        const themeInfo = this.getEffectiveColorTheme(slideId);
        if (themeInfo.themeId && themeInfo.source !== 'master') {
            const resolvedTheme = this._lookupThemeById(themeInfo.themeId);
            if (resolvedTheme) return resolvedTheme;
        }
    }
    
    return masterLumaTheme;
}
```

**This is actually correct**, but `getEffectiveColorTheme` needs verification:

### 4. StyleResolver.getEffectiveColorTheme()

**Current:**
```javascript
getEffectiveColorTheme(slideId) {
    const state = store.getState();
    const slide = state.slides?.[slideId];
    
    if (!slide) return this._getMasterThemeInfo(state);
    
    // 1. Check slide's own styleAssignments
    if (slide.styleAssignments?.colorTheme) {
        return { themeId: slide.styleAssignments.colorTheme, source: 'slide', ... };
    }
    
    // 2. Check layout master
    const layout = slide.layoutId ? state.masters?.[slide.layoutId] : null;
    if (layout?.styleAssignments?.colorTheme) {
        return { themeId: layout.styleAssignments.colorTheme, source: 'layout', ... };
    }
    
    // 3. Check theme master
    // ...
    
    // 4. Fallback to master's lumaTheme
    return this._getMasterThemeInfo(state);
}
```

**This logic is correct.** The issue is elsewhere.

### 5. Store.getEffectiveSlide() - Remove Circular Dependency

**Current (Has Circular Dependency Issues):**
```javascript
getEffectiveSlide(slideId) {
    // ...
    const StyleResolver = getStyleResolver();  // Lazy loaded
    if (StyleResolver) {
        const themeInfo = StyleResolver.getThemeInfoForSlide(slideId);
        // ...
    }
    // ...
}
```

**Problem:** `getStyleResolver()` may return null during initialization, and even when it works, the lazy loading pattern has race conditions.

**Solution:** Don't resolve themes in `getEffectiveSlide()`. Let the renderer (SlideView) call StyleResolver directly:

```javascript
getEffectiveSlide(slideId) {
    // ... existing element/background merging logic ...
    
    // Remove theme resolution from here
    // SlideView will call StyleResolver.getThemeInfoForSlide() directly
    
    return {
        ...slide,
        effectiveBackground: background,
        effectiveElements,
        effectiveOrder,
        themeSettings,
        // resolvedLumaTheme: removed - SlideView handles this
        // themeSource: removed - SlideView handles this
    };
}
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER ACTION                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  "Apply Tropical Paradise to layout-title master"                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    ColorThemeManager.applyThemeToStore()                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  mode: 'master'                                                          │
│  activeMaster.type: 'layout'                                             │
│  activeMaster.id: 'layout-title'                                         │
│                                                                          │
│  → dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {                         │
│      masterId: 'layout-title',                                           │
│      styleAssignments: { colorTheme: 'preset_tropical_paradise' }        │
│    })                                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              STORE UPDATE                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  masters['layout-title'].styleAssignments.colorTheme =                   │
│      'preset_tropical_paradise'                                          │
│                                                                          │
│  → emit('state-changed')                                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SlideView.update() [for each slide]              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  slide-1 (uses layout-title, no slide override):                         │
│  ├─ StyleResolver.getThemeInfoForSlide('slide-1')                        │
│  ├─ → slide.styleAssignments.colorTheme = null (no override)             │
│  ├─ → layout.styleAssignments.colorTheme = 'preset_tropical_paradise'    │
│  ├─ → Return: { source: 'layout', themeId: 'preset_tropical_paradise' }  │
│  ├─ → _lookupThemeById('preset_tropical_paradise') → lumaTheme           │
│  └─ → Apply CSS vars to slide-1's DOM element                            │
│                                                                          │
│  slide-2 (uses layout-blank, no overrides):                              │
│  ├─ StyleResolver.getThemeInfoForSlide('slide-2')                        │
│  ├─ → slide.styleAssignments.colorTheme = null                           │
│  ├─ → layout.styleAssignments.colorTheme = null                          │
│  ├─ → Return: { source: 'master', theme: masterLumaTheme }               │
│  └─ → Apply CSS vars to slide-2's DOM element (uses master theme)        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Theme Master Sets Default
1. Go to master mode, select theme-default
2. Apply "Electric Dreams"
3. **Expected:** All slides without overrides show Electric Dreams
4. **Verify:** `themeMaster.themeSettings.lumaTheme.id === 'preset_electric_dreams'`

### Scenario 2: Layout Master Override
1. Go to master mode, select layout-title
2. Apply "Tropical Paradise"
3. **Expected:** Only slides using layout-title show Tropical Paradise
4. **Verify:** `masters['layout-title'].styleAssignments.colorTheme === 'preset_tropical_paradise'`
5. **Verify:** Slides using other layouts still show Electric Dreams

### Scenario 3: Slide Override
1. Go to edit mode, select slide-1 (uses layout-title)
2. Apply "Citrus Burst"
3. **Expected:** Only slide-1 shows Citrus Burst
4. **Verify:** `slides['slide-1'].styleAssignments.colorTheme === 'preset_citrus_burst'`
5. **Verify:** Other slides using layout-title still show Tropical Paradise

### Scenario 4: Cascade Hierarchy
```
Theme Master: Electric Dreams (default)
├── layout-title: Tropical Paradise (override)
│   ├── slide-1: Citrus Burst (override) → Shows Citrus Burst
│   └── slide-2: (no override) → Shows Tropical Paradise
├── layout-blank: (no override)
│   └── slide-3: (no override) → Shows Electric Dreams
└── layout-content: Forest Green (override)
    └── slide-4: (no override) → Shows Forest Green
```

### Scenario 5: Remove Override
1. slide-1 has Citrus Burst override
2. Set `slide-1.styleAssignments.colorTheme = null`
3. **Expected:** slide-1 now shows Tropical Paradise (from layout)

---

## Summary of Changes

| Component | Change Required |
|-----------|-----------------|
| `ColorThemeManager.applyThemeToStore()` | Stop applying global CSS variables |
| `SlideView.update()` | Call StyleResolver directly, apply CSS vars to own DOM |
| `Store.getEffectiveSlide()` | Remove theme resolution (let SlideView handle it) |
| `StyleResolver.getThemeInfoForSlide()` | Ensure proper cascade: slide → layout → master |
| `MasterHandlers.handleUpdateMasterStyleAssignments()` | Already implemented correctly |
| `SlideHandlers.handleUpdateSlideStyleAssignments()` | Already implemented correctly |
| Master editor canvas | Apply CSS vars only to editor canvas, not document |

---

## Open Questions

1. **Master Mode Preview:** When editing layout-title in master mode, what colors should the canvas show?
   - Option A: Show the theme being applied to layout-title
   - Option B: Show the effective theme for slides using that layout
   - **Recommendation:** Option A - show what you're editing

2. **SlideList Thumbnails:** Should thumbnails show per-slide themes?
   - Current: All thumbnails use global CSS vars
   - **Recommendation:** Yes, each thumbnail should render with its effective theme

3. **Property Inspector:** When viewing a slide with inherited theme, should we show the inheritance chain?
   - Example: "Theme: Tropical Paradise (from Title Slide layout)"
   - **Recommendation:** Yes, helps user understand where the theme comes from

---

## Architecture Critique & Gap Analysis

### Gap 1: Multiple Points of CSS Variable Application

**Problem:** The architecture identifies the root cause (global CSS vars) but the codebase has **multiple independent places** applying CSS variables:

1. `ColorThemeManager.applyThemeToStore()` - Lines 1254, 1596, 1609
2. `SlideSection.js` (Property Inspector) - Lines 273, 982
3. `SlideView.update()` - Lines 47-59

**Risk:** Fixing one location won't fix the bug if other locations continue applying global CSS variables.

**Recommendation:** Create a **CSS Variable Application Whitelist**:
```javascript
// Only these components should EVER call applyThemeToCSSVariables():
// 1. SlideView.update() - applies to this.domElement (per-slide)
// 2. MasterEditorCanvas (future) - applies to canvas element only
// 3. ThumbnailRenderer (future) - applies to thumbnail element only

// BANNED: document.documentElement should NEVER receive theme CSS vars
```

### Gap 2: Event System Not Leveraged

**Problem:** The existing event system (`STYLE_EVENTS.THEME_UPDATED`, `STYLE_EVENTS.THEME_ASSIGNMENT_CHANGED` in `Events.js`) is defined but not being used to coordinate re-renders.

**Current Flow (Broken):**
```
User applies theme → Store.dispatch() → state-changed event → ???
```

**Risk:** Without explicit theme change events, there's no clean way to tell SlideViews "your theme source changed, re-render".

**Recommendation:** Add event-driven re-render coordination:
```javascript
// When theme assignment changes:
document.dispatchEvent(new CustomEvent(STYLE_EVENTS.THEME_ASSIGNMENT_CHANGED, {
    detail: { 
        targetType: 'layout', // or 'slide', 'master'
        targetId: 'layout-title',
        themeId: 'preset_tropical_paradise',
        affectedSlides: ['slide-1', 'slide-2'] // Pre-computed list
    }
}));

// SlideListPanel listens and only re-renders affected slides
```

### Gap 3: Missing "Clear Override" Mechanism

**Problem:** The architecture describes how to SET overrides but not how to CLEAR them.

**Scenarios Not Covered:**
1. User applies theme to slide-1, then wants to revert to layout inheritance
2. User applies theme to layout-title, then wants to revert to theme-master inheritance

**Recommendation:** Add explicit "Inherit from [Parent]" UI action:
```javascript
// Store action
dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
    slideId: 'slide-1',
    styleAssignments: { colorTheme: null }  // Explicit null clears override
});

// UI: "Inherit from Layout" button in Property Inspector
// UI: "Inherit from Theme Master" button in Master Mode
```

### Gap 4: Undo/Redo Not Addressed

**Problem:** Theme assignment changes must be undoable. Current architecture doesn't specify undo behavior.

**Risk:** User applies wrong theme, can't undo, presentation is ruined.

**Recommendation:** Ensure all theme changes go through undoable Store actions:
```javascript
// All these MUST be undoable actions:
- APPLY_LUMA_THEME (theme master default change)
- UPDATE_MASTER_STYLE_ASSIGNMENTS (layout override)
- UPDATE_SLIDE_STYLE_ASSIGNMENTS (slide override)

// Verify: handlers/UndoRedoHandlers.js handles these action types
```

### Gap 5: Multi-Slide Selection Not Covered

**Problem:** What happens when user selects 3 slides and applies a theme?

**Current:** Undefined behavior
**Expected:** All 3 slides get the theme override

**Recommendation:** Add multi-slide theme application:
```javascript
// New store action
dispatch('UPDATE_MULTIPLE_SLIDES_STYLE_ASSIGNMENTS', {
    slideIds: ['slide-1', 'slide-2', 'slide-3'],
    styleAssignments: { colorTheme: 'preset_citrus_burst' }
});

// ColorThemeManager handles multi-selection
```

### Gap 6: Presentation Mode Not Addressed

**Problem:** In presentation mode, slides advance. Each slide may have different themes.

**Risk:** If CSS vars are global, slide transitions will flash wrong colors.

**Recommendation:** Presentation mode must:
1. Pre-render each slide with its own theme (CSS vars on slide element)
2. During transition, both slides visible with correct themes
3. Never touch document.documentElement

### Gap 7: Export/Copy-Paste Theme Handling

**Problem:** When slide is copied:
- Should it copy the theme override?
- When pasted in another presentation, what happens?

**Recommendation:**
- **Copy within same presentation:** Preserve theme override (it's an ID reference)
- **Copy to different presentation:** Theme ID may not exist
  - Option A: Embed theme data in paste
  - Option B: Fall back to target's theme master
  - **Recommended:** Option B with warning "Theme 'Citrus Burst' not found, using default"

### Gap 8: Custom Theme Persistence

**Problem:** Architecture mentions `localStorage.getItem('colorThemes')` for custom themes. This is fragile.

**Risks:**
1. localStorage can be cleared
2. Custom theme referenced by slide won't resolve
3. No sync across devices

**Recommendation:** Custom themes should be stored IN the presentation file:
```javascript
// presentation.json structure
{
    customThemes: [
        { id: 'custom_xyz', name: 'My Theme', slots: [...] }
    ],
    masters: { ... },
    slides: { ... }
}

// StyleResolver._lookupThemeById() checks:
// 1. Built-in presets
// 2. Presentation's customThemes array (NEW)
// 3. localStorage (deprecated, migration path)
```

### Gap 9: Performance - Multiple StyleResolver Calls

**Problem:** With many slides, `SlideView.update()` calling `StyleResolver.getThemeInfoForSlide()` for each slide on every state change is expensive.

**Recommendation:** Add caching layer:
```javascript
// StyleResolver.getThemeInfoForSlide() should cache results
// Cache invalidation on:
// - APPLY_LUMA_THEME
// - UPDATE_MASTER_STYLE_ASSIGNMENTS
// - UPDATE_SLIDE_STYLE_ASSIGNMENTS

const themeCache = new Map(); // slideId -> themeInfo

function invalidateThemeCache(affectedSlideIds) {
    if (affectedSlideIds === 'all') {
        themeCache.clear();
    } else {
        affectedSlideIds.forEach(id => themeCache.delete(id));
    }
}
```

### Gap 10: Dark Mode Interaction

**Problem:** Architecture mentions `colorMode` but doesn't fully specify interaction with per-slide themes.

**Clarification Needed:**
- Is colorMode per-slide or global?
- If slide-1 has theme override, does it respect global dark mode?

**Recommendation:** ColorMode is ALWAYS global (theme-master level):
```javascript
// Dark mode affects HOW slots map to colors (slot inversion)
// But theme palette itself is per-slide

// Resolution:
const lumaTheme = StyleResolver.getLumaTheme(slideId);  // Per-slide theme
const colorMode = StyleResolver.getColorMode();          // Global from theme-master
const effectiveSlot = getEffectiveSlotIndex(slotIndex, colorMode);  // Apply mode
```

---

## Updated Implementation Recommendations

### Priority 1: Fix Global CSS Variable Application (CRITICAL)

**Files to modify:**
1. `ColorThemeManager.js` - Remove ALL `document.documentElement` calls
2. `SlideSection.js` - Remove ALL `document.documentElement` calls
3. `SlideView.js` - This is the ONLY place CSS vars should be applied

**Verification Test:**
```javascript
// Add to dev builds:
const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty = function(prop, value) {
    if (prop.startsWith('--theme-slot') && this === document.documentElement.style) {
        console.error('🚨 ILLEGAL: Theme CSS var applied to document.documentElement!', prop);
        console.trace();
    }
    return originalSetProperty.call(this, prop, value);
};
```

### Priority 2: Ensure StyleResolver is Single Source of Truth

**Audit all code paths that resolve themes:**
```
grep -r "lumaTheme" src/
grep -r "colorTheme" src/
grep -r "themeSlot" src/
```

All must eventually call `StyleResolver.getLumaTheme()` or `StyleResolver.getThemeInfoForSlide()`.

### Priority 3: Add Theme Change Events

**New events to dispatch:**
```javascript
// After APPLY_LUMA_THEME:
document.dispatchEvent(new CustomEvent(STYLE_EVENTS.THEME_UPDATED, {
    detail: { masterId: 'theme-default', affectedSlides: 'all' }
}));

// After UPDATE_MASTER_STYLE_ASSIGNMENTS:
document.dispatchEvent(new CustomEvent(STYLE_EVENTS.THEME_ASSIGNMENT_CHANGED, {
    detail: { 
        targetType: 'layout',
        targetId: 'layout-title', 
        affectedSlides: computeAffectedSlides('layout-title')
    }
}));

// After UPDATE_SLIDE_STYLE_ASSIGNMENTS:
document.dispatchEvent(new CustomEvent(STYLE_EVENTS.THEME_ASSIGNMENT_CHANGED, {
    detail: { 
        targetType: 'slide',
        targetId: 'slide-1', 
        affectedSlides: ['slide-1']
    }
}));
```

### Priority 4: Add Clear Override UI

**Property Inspector changes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Theme: Citrus Burst (slide-specific)    [🗑️ Clear Override]│
│                                                             │
│  When cleared, inherits from: Title Slide Layout            │
│  (which uses: Tropical Paradise)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Risk Assessment Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Global CSS vars persist after fix | High | Critical | Add dev-mode guard, audit all files |
| Undo breaks theme changes | Medium | High | Add tests for undo/redo of theme actions |
| Performance regression with many slides | Medium | Medium | Add caching, batch updates |
| Custom themes lost on export | High | Medium | Store custom themes in presentation file |
| Multi-slide selection undefined | Medium | Low | Define and implement behavior |
| Presentation mode flicker | Low | High | Pre-render with scoped CSS vars |

---

## Verification Checklist

After implementation, verify:

- [ ] Applying theme to Theme Master affects all slides (that don't have overrides)
- [ ] Applying theme to Layout Master affects only slides using that layout
- [ ] Applying theme to individual slide affects only that slide
- [ ] Slides using other layouts are NOT affected by layout-specific theme
- [ ] "Clear Override" returns slide to inherited theme
- [ ] Undo reverses theme change
- [ ] Redo re-applies theme change
- [ ] Presentation mode shows correct theme per slide
- [ ] Thumbnails show correct theme per slide
- [ ] Property Inspector shows inheritance chain
- [ ] No `--theme-slot*` on `document.documentElement` (except UI panels)
- [ ] Custom themes persist in presentation file
