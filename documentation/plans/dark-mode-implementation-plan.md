# Dark Mode Implementation Plan

## Overview

This plan outlines the implementation of a **Dark Mode** toggle for the color theme system. When enabled, dark mode swaps the shadow and highlight clusters' mapping, allowing the same theme to work in both light and dark contexts.

---

## 1. Requirements Summary

### Core Requirement
- Dark mode is a **property of the theme application**, not the theme itself
- When enabled, shadow slots (1-4) are treated as highlight slots and vice versa
- Midtones (5-8) remain unchanged
- The theme definition remains the same; only the **slot resolution mapping** changes

### User Experience
- Toggle control in the Property Inspector's Theme Section (Colors row)
- Same theme, different appearance based on mode
- All theme-linked colors automatically update when mode changes

---

## 2. Technical Architecture

### 2.1 Rejected Approach: Swapping Theme Slot Values
**Why NOT to do this:**
- ❌ Confusing UX in Color Theme Manager (shadow/highlight labels become misleading)
- ❌ Complex logic for generate, adjustments, and presets
- ❌ Breaks the mental model of "shadows are dark, highlights are light"

### 2.2 Chosen Approach: Slot Resolution Mapping Layer

Instead of modifying the theme, we add a **mapping layer** that remaps slot indices at resolution time.

```
Theme Slots (Source)     →    Dark Mode Mapping    →    Resolved Color
───────────────────────────────────────────────────────────────────────
Slot 1 (Shadow, L:5%)    →    Maps to Slot 12      →    #F5F0FA (Highlight)
Slot 2 (Shadow, L:10%)   →    Maps to Slot 11      →    #E8E0F0 (Highlight)
Slot 3 (Shadow, L:18%)   →    Maps to Slot 10      →    #D8CCE8 (Highlight)
Slot 4 (Shadow, L:25%)   →    Maps to Slot 9       →    #C8B8D8 (Highlight)
Slot 5 (Midtone, L:35%)  →    Maps to Slot 8       →    #A090B0 (Midtone)
Slot 6 (Midtone, L:45%)  →    Maps to Slot 7       →    #8878A0 (Midtone)
Slot 7 (Midtone, L:55%)  →    Maps to Slot 6       →    #706090 (Midtone)
Slot 8 (Midtone, L:65%)  →    Maps to Slot 5       →    #584878 (Midtone)
Slot 9 (Highlight, L:70%)→    Maps to Slot 4       →    #483868 (Shadow)
Slot 10 (Highlight,L:80%)→    Maps to Slot 3       →    #382858 (Shadow)
Slot 11 (Highlight,L:90%)→    Maps to Slot 2       →    #281848 (Shadow)
Slot 12 (Highlight,L:97%)→    Maps to Slot 1       →    #180838 (Shadow)
```

### 2.3 Mapping Formula

```javascript
/**
 * Get the effective slot index based on dark mode setting.
 * In dark mode, slots are mirrored: index N maps to (11 - N)
 * 
 * Visual mapping:
 * Light Mode: [0,1,2,3,4,5,6,7,8,9,10,11] (as-is)
 * Dark Mode:  [11,10,9,8,7,6,5,4,3,2,1,0] (reversed)
 * 
 * @param {number} slotIndex - Original slot index (0-11)
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {number} Effective slot index to use
 */
function getEffectiveSlotIndex(slotIndex, isDarkMode) {
    if (!isDarkMode) return slotIndex;
    return 11 - slotIndex;
}
```

---

## 3. Data Model Changes

### 3.1 Theme Master State

Add `colorMode` property to the theme master:

```javascript
// In Store state - masters object
"master-theme-1": {
    id: "master-theme-1",
    type: "theme",
    name: "Default Theme",
    themeSettings: {
        lumaTheme: {
            id: "theme-001",
            name: "Ocean Sunset",
            slots: [...],           // 12 slots with h, s
            adjustments: {...},     // brightness, contrast, etc.
            resolvedColors: [...],  // 12 hex colors (light mode)
        },
        colorMode: "light",         // NEW: "light" | "dark"
        // ... other settings
    }
}
```

### 3.2 CSS Variables

When applying theme colors, respect the color mode:

```javascript
// Current (always light mode)
--theme-slot1: #180838  // Shadow color

// With dark mode enabled
--theme-slot1: #F5F0FA  // Highlight color (mapped from slot 12)
```

---

## 4. Implementation Steps

### Phase 1: Core Infrastructure

#### 4.1 Update ColorThemeUtils.js

Add the slot mapping function:

```javascript
/**
 * Dark mode slot mapping.
 * Maps original slot index to effective slot index based on mode.
 */
export const DARK_MODE_SLOT_MAP = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

/**
 * Get effective slot index for color resolution.
 * @param {number} slotIndex - Original slot index (0-11)
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {number} Effective slot index
 */
export function getEffectiveSlotIndex(slotIndex, isDarkMode) {
    if (!isDarkMode) return slotIndex;
    if (slotIndex < 0 || slotIndex > 11) return slotIndex;
    return DARK_MODE_SLOT_MAP[slotIndex];
}

/**
 * Generate theme colors with dark mode support.
 * @param {Array<{h: number, s: number}>} slots - 12 slot colors
 * @param {Object} adjustments - Adjustment values
 * @param {boolean} isDarkMode - Whether to generate dark mode colors
 * @returns {Array<string>} 12 hex colors
 */
export function generateThemeColorsWithMode(slots, adjustments, isDarkMode = false) {
    const baseColors = generateThemeColors(slots, adjustments);
    if (!isDarkMode) return baseColors;
    
    // Remap colors for dark mode
    return baseColors.map((_, index) => {
        const effectiveIndex = getEffectiveSlotIndex(index, true);
        return baseColors[effectiveIndex];
    });
}
```

#### 4.2 Update StyleResolver.js

Modify `resolveThemeSlot` to consider dark mode:

```javascript
resolveThemeSlot(slotIndex, fallback = '#000000') {
    if (slotIndex === undefined || slotIndex === null) return fallback;
    
    const state = store.getState();
    const themeMaster = Object.values(state.masters).find(m => m.type === 'theme');
    const lumaTheme = themeMaster?.themeSettings?.lumaTheme;
    const isDarkMode = themeMaster?.themeSettings?.colorMode === 'dark';
    
    // Apply dark mode mapping
    const effectiveIndex = isDarkMode ? (11 - slotIndex) : slotIndex;
    
    if (lumaTheme?.slots?.[effectiveIndex]) {
        return lumaTheme.slots[effectiveIndex].hex || fallback;
    }
    
    if (lumaTheme?.resolvedColors?.[effectiveIndex]) {
        return lumaTheme.resolvedColors[effectiveIndex];
    }
    
    // CSS variable fallback also needs remapping
    const slotNumber = effectiveIndex + 1;
    const cssValue = getComputedStyle(document.documentElement)
        .getPropertyValue(`--theme-slot${slotNumber}`).trim();
    
    return cssValue || fallback;
}
```

#### 4.3 Update Store Actions

Add action to toggle color mode:

```javascript
// In Store.js - Add action type
case 'SET_COLOR_MODE': {
    const themeMaster = Object.values(draft.masters).find(m => m.type === 'theme');
    if (themeMaster) {
        if (!themeMaster.themeSettings) themeMaster.themeSettings = {};
        themeMaster.themeSettings.colorMode = payload.mode; // 'light' | 'dark'
    }
    break;
}
```

#### 4.4 CSS Variable Application

When theme is applied or mode changes, regenerate CSS variables:

```javascript
// In theme application logic
function applyThemeWithMode(theme, isDarkMode) {
    const colors = generateThemeColorsWithMode(
        theme.slots, 
        theme.adjustments, 
        isDarkMode
    );
    
    colors.forEach((color, index) => {
        document.documentElement.style.setProperty(
            `--theme-slot${index + 1}`, 
            color
        );
    });
    
    // Dispatch event for canvas refresh
    document.dispatchEvent(new CustomEvent('theme-mode-changed', {
        detail: { mode: isDarkMode ? 'dark' : 'light' }
    }));
}
```

---

### Phase 2: UI Implementation

#### 4.5 Update Property Inspector - Theme Section

Add dark mode toggle to the Colors row:

**Updated Colors Row Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  🎨  Colors                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ [■■■■■■] Theme swatches                                      │   │
│  │                                                             │   │
│  │ ☀️ Light  ◉ ○  🌙 Dark                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                   [Edit Theme →]   │
└─────────────────────────────────────────────────────────────────────┘
```

**UI Component:**
```javascript
// SegmentedControl for Light/Dark toggle
const modeToggle = new SegmentedControl({
    options: [
        { value: 'light', label: '☀️', tooltip: 'Light Mode' },
        { value: 'dark', label: '🌙', tooltip: 'Dark Mode' }
    ],
    value: currentMode,
    onChange: (mode) => {
        store.dispatch({ type: 'SET_COLOR_MODE', payload: { mode } });
    }
});
```

#### 4.6 Update property-inspector-slide.md Spec

Add mode toggle to the Colors Row specification:

```markdown
### Colors Row
- **Icon**: Palette icon.
- **Label**: "Colors".
- **Display**: 
    - Color swatches showing the current theme colors.
    - **Mode Toggle**: SegmentedControl with Light (☀️) and Dark (🌙) options.
- **Mode Toggle Behavior**:
    - Switches between light and dark mode for the presentation.
    - Dark mode maps shadow slots to highlights and vice versa.
    - All theme-linked colors update immediately.
- **Click Action**: Opens the Color Theme Manager panel.
```

---

### Phase 3: Color Theme Manager Updates

#### 4.7 Preview Mode Indicator

The Color Theme Manager should show which mode is active but NOT allow editing the mode (that's in Property Inspector).

```
┌─────────────────────────────────────────────────────────────────────┐
│ Color Theme Manager                              [Mode: ☀️ Light]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  (Theme editing UI unchanged - always edits the source theme)       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The grid always shows the **source** theme (light mode interpretation). A small badge indicates current presentation mode for context.

#### 4.8 Preview Colors in Both Modes

Add a preview toggle to see how the theme looks in dark mode:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Preview: [☀️ Light] [🌙 Dark]                                      │
│                                                                     │
│  (Swatches update to show dark mode appearance)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Phase 4: Integration & Polish

#### 4.9 Canvas Refresh on Mode Change

Ensure canvas re-renders when mode changes:

```javascript
// In CanvasManager.js
document.addEventListener('theme-mode-changed', (event) => {
    this.renderAll();
});
```

#### 4.10 Persistence

Color mode is saved with the presentation:

```javascript
// When saving presentation
{
    masters: {
        "theme-master-1": {
            themeSettings: {
                lumaTheme: {...},
                colorMode: "dark"  // Persisted
            }
        }
    }
}
```

#### 4.11 Export Considerations

When exporting to PDF/images, respect current color mode:
- Export uses the active mode's resolved colors
- No special handling needed (CSS variables already mapped)

---

## 5. File Changes Summary

| File | Changes |
|------|---------|
| `src/ui/panels/color-theme/ColorThemeUtils.js` | Add `getEffectiveSlotIndex()`, `generateThemeColorsWithMode()` |
| `src/utils/StyleResolver.js` | Update `resolveThemeSlot()` to use effective index |
| `src/core/Store.js` | Add `SET_COLOR_MODE` action |
| `src/ui/property-inspector/SlideSection.js` | Add mode toggle to Colors row |
| `src/ui/panels/color-theme/ColorThemeManager.js` | Add mode preview indicator |
| `src/core/CanvasManager.js` | Listen for `theme-mode-changed` event |
| `documentation/specs/property-inspector/property-inspector-slide.md` | Update Colors Row spec |
| `documentation/specs/themes-styles/color-themes-spec.md` | Add Dark Mode section |

---

## 6. Testing Checklist

- [ ] Toggle changes all theme-linked colors immediately
- [ ] Canvas re-renders correctly with new colors
- [ ] Text fills with theme slots update
- [ ] Shape fills with theme slots update  
- [ ] Background fills with theme slots update
- [ ] Mode persists when saving/loading presentation
- [ ] Mode resets to light when switching themes (or preserves - TBD)
- [ ] Color Theme Manager shows correct preview
- [ ] Export/PDF uses correct mode colors
- [ ] Undo/redo works with mode changes

---

## 7. Open Questions

1. **Should mode persist when changing themes?**
   - Option A: Always reset to light mode when theme changes
   - Option B: Preserve mode when theme changes
   - **Recommendation**: Option B - preserve mode

2. **Should individual slides be able to override mode?**
   - Option A: Mode is presentation-wide (simpler)
   - Option B: Mode can be per-slide (complex, more flexible)
   - **Recommendation**: Option A - presentation-wide for v1

3. **Keyboard shortcut for mode toggle?**
   - Suggestion: `Ctrl/Cmd + Shift + D` (D for Dark)
   - Or include in View menu

---

## 8. Future Enhancements

- **Auto mode**: Detect system preference and match
- **Per-slide mode**: Allow different modes on different slides
- **Transition preview**: See how slides look when switching modes
- **Mode-specific adjustments**: Different adjustment values for light/dark

---

## 9. Implementation Order

1. **Core infrastructure** (ColorThemeUtils, StyleResolver, Store)
2. **Property Inspector UI** (Mode toggle)
3. **Canvas integration** (Re-render on mode change)
4. **Color Theme Manager** (Mode preview indicator)
5. **Testing & Polish**
6. **Documentation updates**

Estimated effort: **2-3 days**
