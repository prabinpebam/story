# Architecture Refactoring Plan - Preset Separation

**Version:** 1.0  
**Last Updated:** December 7, 2025  
**Status:** APPROVED FOR EXECUTION

---

## 1. Executive Summary

### 1.1 Problem Statement

The current Phase 1.1 implementation (ThemePicker/ThemeManager) violates the core architectural principle of separation of concerns:

**VIOLATION:** Colors and typography are embedded directly in Slide Master objects (`themeSettings`), preventing independent manipulation and causing potential conflicts.

**CORRECT ARCHITECTURE:** Slide Masters should only REFERENCE separate Color Theme Presets and Typography Style Presets, never embed them.

### 1.2 Solution Overview

1. **Rollback Phase 1.1** - Remove ThemePicker/ThemeManager (1,201 lines)
2. **Restructure State** - Separate `colorThemePresets` and `typographyStylePresets` libraries
3. **Build New Components** - ColorThemePicker, TypographyStylePicker, SlideMasterPresetPicker
4. **Update Terminology** - Rename all "theme" references to precise terms
5. **Maintain Compatibility** - Support old `.str` files with migration

### 1.3 Scope

**Total Code Impact:**
- Remove: ~1,200 lines (Phase 1.1)
- Add: ~2,500 lines (new architecture)
- Modify: ~500 lines (existing files)
- **Net Change:** +1,800 lines

**Estimated Duration:** 2-3 weeks

---

## 2. Phase 1.1 Rollback Plan

### 2.1 Files to Remove

```
❌ src/ui/components/ThemePicker.js (575 lines)
❌ src/ui/services/ThemeManager.js (87 lines)
❌ tests/unit/ui/ThemePicker.test.js (315 lines)
❌ tests/unit/ui/ThemeManager.test.js (224 lines)
❌ documentation/specs/slides/PHASE-1.1-THEME-MANAGEMENT-COMPLETE.md (194 lines)
```

**Total Removed:** 1,395 lines

### 2.2 Code to Revert

**File:** `src/core/store/handlers/SlideHandlers.js`
```javascript
// REMOVE: handleUpdateMaster function (lines 291-330)
export function handleUpdateMaster(draft, payload) {
    const { id, updates } = payload;
    // ... 40 lines ...
}
```

**File:** `src/core/Store.js`
```javascript
// REMOVE: UPDATE_MASTER case from dispatch
case 'UPDATE_MASTER':
    this.snapshot(type);
    SlideHandlers.handleUpdateMaster(draft, payload);
    break;
```

**File:** `src/ui/components/AppMenu/menuConfig.js`
```javascript
// REMOVE: slide-change-theme menu item
{ 
    id: 'slide-change-theme', 
    label: 'Change Theme...', 
    icon: 'fa-solid fa-palette' 
}
```

**File:** `src/ui/services/MenuActionHandler.js`
```javascript
// REMOVE: showThemePicker method and registration
showThemePicker() {
    document.dispatchEvent(new CustomEvent('story:show-theme-picker'));
}

this.register('slide-change-theme', () => this.showThemePicker());
```

**File:** `src/main.js`
```javascript
// REMOVE: ThemeManager import and initialization
import { themeManager } from './ui/services/ThemeManager.js';
```

### 2.3 Rollback Verification

**Tests to Run:**
```bash
npm test  # All 3,898 tests should still pass after removal
```

**Git Operations:**
```bash
git checkout main  # Ensure on correct branch
git rm src/ui/components/ThemePicker.js
git rm src/ui/services/ThemeManager.js
git rm tests/unit/ui/ThemePicker.test.js
git rm tests/unit/ui/ThemeManager.test.js
git rm documentation/specs/slides/PHASE-1.1-THEME-MANAGEMENT-COMPLETE.md

# Revert specific changes in modified files
git checkout HEAD -- src/core/store/handlers/SlideHandlers.js
git checkout HEAD -- src/core/Store.js
git checkout HEAD -- src/ui/components/AppMenu/menuConfig.js
git checkout HEAD -- src/ui/services/MenuActionHandler.js
git checkout HEAD -- src/main.js

git commit -m "refactor: rollback Phase 1.1 - violates preset separation architecture"
```

---

## 3. State Restructure Plan

### 3.1 Current State Structure (INCORRECT)

```javascript
{
  masters: {
    "theme-default": {  // ❌ Ambiguous name
      type: "theme",     // ❌ Should be "slideMasterPreset"
      themeSettings: {   // ❌ Embedding colors/fonts
        colors: { background1: "#FFF", ... },  // ❌ Should be reference
        fonts: { heading: "Inter", ... },      // ❌ Should be reference
        textStyles: { ... }
      },
      elements: { ... },
      elementOrder: []
    },
    "layout-title": {
      type: "layout",
      parentId: "theme-default",
      styleAssignments: {  // ✅ This is correct (references)
        colorTheme: null,
        typographyStyle: null
      }
    }
  },
  slides: { ... },
  slideOrder: [ ... ]
}
```

### 3.2 New State Structure (CORRECT)

```javascript
{
  // NEW: Separate preset libraries
  colorThemePresets: {
    "color-theme-default": {
      id: "color-theme-default",
      type: "colorThemePreset",
      name: "Default Colors",
      description: "Clean and professional",
      category: "Professional",
      isDark: false,
      colors: {
        background1: "#FFFFFF",
        background2: "#F8FAFC",
        text1: "#0F172A",
        text2: "#64748B",
        accent1: "#3B82F6",
        accent2: "#8B5CF6",
        accent3: "#10B981",
        accent4: "#F59E0B",
        accent5: "#EF4444",
        accent6: "#06B6D4",
        hyperlink: "#2563EB",
        followedHyperlink: "#7C3AED"
      }
    },
    "color-theme-ocean": { ... },
    "color-theme-sunset": { ... },
    "color-theme-forest": { ... },
    "color-theme-midnight": { ... }
  },
  
  typographyStylePresets: {
    "typo-style-default": {
      id: "typo-style-default",
      type: "typographyStylePreset",
      name: "Modern Sans",
      description: "Clean geometric sans-serif",
      category: "Sans Serif",
      fonts: {
        heading: "Inter",
        body: "Inter",
        monospace: "Fira Code"
      },
      textStyles: {
        display: { fontSize: 80, fontWeight: "800", lineHeight: 1.0, ... },
        title: { fontSize: 56, fontWeight: "700", lineHeight: 1.1, ... },
        heading1: { fontSize: 44, fontWeight: "700", lineHeight: 1.2, ... },
        heading2: { fontSize: 32, fontWeight: "600", lineHeight: 1.25, ... },
        heading3: { fontSize: 24, fontWeight: "600", lineHeight: 1.3, ... },
        body: { fontSize: 20, fontWeight: "400", lineHeight: 1.6, ... },
        bodyLarge: { fontSize: 24, fontWeight: "400", lineHeight: 1.5, ... },
        bodySmall: { fontSize: 16, fontWeight: "400", lineHeight: 1.5, ... },
        caption: { fontSize: 14, fontWeight: "500", lineHeight: 1.4, ... },
        label: { fontSize: 12, fontWeight: "600", lineHeight: 1.3, ... }
      }
    },
    "typo-style-formal-serif": { ... },
    "typo-style-technical-mono": { ... }
  },
  
  // UPDATED: Slide master presets (renamed from "masters")
  slideMasterPresets: {
    "master-default": {  // ✅ Clear name
      id: "master-default",
      type: "slideMasterPreset",  // ✅ Precise type
      name: "Default Master",
      
      // ✅ REFERENCES ONLY (not embedded data)
      colorThemeId: "color-theme-default",
      typographyStyleId: "typo-style-default",
      
      // Master-level elements (logo, footer, etc.)
      elements: {
        "footer-text": { type: "text", content: "Company Name", ... }
      },
      elementOrder: ["footer-text"],
      
      // Background
      background: { type: "solid", value: "var(--theme-background1)" },
      
      // Associated layouts (references)
      layoutIds: [
        "layout-title",
        "layout-title-content",
        "layout-section-header",
        "layout-two-column",
        "layout-comparison",
        "layout-blank"
      ]
    }
  },
  
  // Layout masters (separate from slide masters)
  layoutMasters: {
    "layout-title": {
      id: "layout-title",
      type: "layoutMaster",
      parentMasterId: "master-default",  // ✅ References parent
      name: "Title Slide",
      
      // Override references (null = inherit from parent)
      colorThemeId: null,
      typographyStyleId: null,
      
      // Placeholder definitions
      elements: {
        "placeholder-title": { 
          type: "text", 
          isPlaceholder: true,
          placeholderType: "title",
          x: 160, y: 320, width: 1600, height: 240,
          style: { 
            fontSize: 80, 
            textAlign: "center",
            color: "var(--theme-text1)",  // Uses CSS variable
            fontFamily: "var(--theme-font-heading)"
          }
        },
        "placeholder-subtitle": { ... }
      },
      elementOrder: ["placeholder-title", "placeholder-subtitle"],
      
      background: null  // null = inherit from master
    },
    "layout-title-content": { ... },
    "layout-two-column": { ... }
  },
  
  // Slides (instances)
  slides: {
    "slide-1": {
      id: "slide-1",
      layoutId: "layout-title",  // References layout
      
      // Override references (null = inherit from layout)
      colorThemeId: null,
      typographyStyleId: null,
      
      // Actual content
      elements: {
        "title-text": { 
          type: "text", 
          content: "<h1>Welcome to Story</h1>",
          sourceId: "placeholder-title"  // Links to placeholder
        }
      },
      elementOrder: ["title-text"],
      
      background: null,
      notes: ""
    },
    "slide-2": {
      id: "slide-2",
      layoutId: "layout-title-content",
      colorThemeId: "color-theme-sunset",  // ✅ OVERRIDE (just this slide)
      typographyStyleId: null,  // Inherits from layout
      elements: { ... }
    }
  },
  
  slideOrder: ["slide-1", "slide-2"],
  sections: []
}
```

### 3.3 Migration Function

**File:** `src/core/store/migrations/MigrateToPresets.js` (NEW)

```javascript
/**
 * Migrate old format (embedded themeSettings) to new format (separate presets)
 * Ensures backward compatibility with old .str files
 */
export function migrateToPresets(oldState) {
    const newState = { ...oldState };
    
    // Initialize new libraries
    newState.colorThemePresets = {};
    newState.typographyStylePresets = {};
    newState.slideMasterPresets = {};
    newState.layoutMasters = {};
    
    // Extract old masters
    const oldMasters = oldState.masters || {};
    
    // Separate theme masters from layout masters
    const themeMasters = {};
    const layoutMasters = {};
    
    Object.values(oldMasters).forEach(master => {
        if (master.type === 'theme') {
            themeMasters[master.id] = master;
        } else if (master.type === 'layout') {
            layoutMasters[master.id] = master;
        }
    });
    
    // Migrate each theme master
    Object.values(themeMasters).forEach(oldMaster => {
        // Extract colors and create color theme preset
        if (oldMaster.themeSettings?.colors) {
            const colorThemeId = `color-theme-${oldMaster.id}`;
            newState.colorThemePresets[colorThemeId] = {
                id: colorThemeId,
                type: 'colorThemePreset',
                name: `${oldMaster.name} Colors`,
                colors: oldMaster.themeSettings.colors,
                isDark: false  // Default, can be calculated
            };
        }
        
        // Extract fonts/textStyles and create typography preset
        if (oldMaster.themeSettings?.fonts || oldMaster.themeSettings?.textStyles) {
            const typoStyleId = `typo-style-${oldMaster.id}`;
            newState.typographyStylePresets[typoStyleId] = {
                id: typoStyleId,
                type: 'typographyStylePreset',
                name: `${oldMaster.name} Typography`,
                fonts: oldMaster.themeSettings.fonts || {},
                textStyles: oldMaster.themeSettings.textStyles || {}
            };
        }
        
        // Create new slide master preset (without embedded data)
        const newMasterId = oldMaster.id.replace('theme-', 'master-');
        newState.slideMasterPresets[newMasterId] = {
            id: newMasterId,
            type: 'slideMasterPreset',
            name: oldMaster.name,
            colorThemeId: `color-theme-${oldMaster.id}`,
            typographyStyleId: `typo-style-${oldMaster.id}`,
            elements: oldMaster.elements || {},
            elementOrder: oldMaster.elementOrder || [],
            background: oldMaster.background,
            layoutIds: []  // Will be populated from layoutMasters
        };
    });
    
    // Migrate layout masters
    Object.values(layoutMasters).forEach(oldLayout => {
        const newLayoutId = oldLayout.id;
        const parentMasterId = oldLayout.parentId?.replace('theme-', 'master-');
        
        newState.layoutMasters[newLayoutId] = {
            id: newLayoutId,
            type: 'layoutMaster',
            parentMasterId: parentMasterId,
            name: oldLayout.name,
            colorThemeId: oldLayout.styleAssignments?.colorTheme || null,
            typographyStyleId: oldLayout.styleAssignments?.typographyStyle || null,
            elements: oldLayout.elements || {},
            elementOrder: oldLayout.elementOrder || [],
            background: oldLayout.background
        };
        
        // Add layout to parent master's layoutIds
        if (parentMasterId && newState.slideMasterPresets[parentMasterId]) {
            newState.slideMasterPresets[parentMasterId].layoutIds.push(newLayoutId);
        }
    });
    
    // Migrate slides (update styleAssignments to new property names)
    if (newState.slides) {
        Object.values(newState.slides).forEach(slide => {
            if (slide.styleAssignments) {
                slide.colorThemeId = slide.styleAssignments.colorTheme || null;
                slide.typographyStyleId = slide.styleAssignments.typographyStyle || null;
                delete slide.styleAssignments;
            }
        });
    }
    
    // Remove old masters object
    delete newState.masters;
    
    return newState;
}
```

---

## 4. New Components Implementation

### 4.1 ColorThemePicker

**File:** `src/ui/components/ColorThemePicker.js` (NEW, ~600 lines)

**Purpose:** Allow users to select or create color themes (12-color palettes)

**Features:**
- Gallery of built-in color themes (Default, Ocean, Sunset, Forest, Midnight, etc.)
- Visual preview cards showing all 12 colors
- "Create Custom" option to build new themes
- Apply at Slide Master, Layout, or Slide level
- Save custom themes to library

**UI Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Select Color Theme                              [✕]     │
├─────────────────────────────────────────────────────────┤
│ Apply to: ○ Slide Master  ○ Layout  ● This Slide       │
├─────────────────────────────────────────────────────────┤
│ [Built-in Themes] [Custom Themes] [+ Create Custom]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │  Default  │  │   Ocean   │  │  Sunset   │          │
│  │ ■■■■■■    │  │ ■■■■■■    │  │ ■■■■■■    │          │
│  │ ■■■■■■    │  │ ■■■■■■    │  │ ■■■■■■    │          │
│  └───────────┘  └───────────┘  └───────────┘          │
│                                                         │
│  ┌───────────┐  ┌───────────┐                          │
│  │  Forest   │  │ Midnight  │                          │
│  │ ■■■■■■    │  │ ■■■■■■    │                          │
│  │ ■■■■■■    │  │ ■■■■■■    │                          │
│  └───────────┘  └───────────┘                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                         [Cancel] [Apply]                │
└─────────────────────────────────────────────────────────┘
```

**Key Methods:**
```javascript
class ColorThemePicker {
    constructor();
    show(options: { applyLevel: 'master'|'layout'|'slide', targetId: string });
    hide();
    renderThemeGallery();
    createThemeCard(theme: ColorThemePreset);
    openCustomEditor();
    applyTheme(themeId: string, level: string, targetId: string);
}
```

### 4.2 TypographyStylePicker

**File:** `src/ui/components/TypographyStylePicker.js` (NEW, ~500 lines)

**Purpose:** Allow users to select or create typography styles

**Features:**
- Gallery of built-in typography styles (Modern Sans, Formal Serif, Technical Mono, etc.)
- Visual preview showing heading + body text samples
- "Create Custom" option to build new typography systems
- Apply at Slide Master, Layout, or Slide level
- Font family selection with Google Fonts integration

**UI Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Select Typography Style                         [✕]     │
├─────────────────────────────────────────────────────────┤
│ Apply to: ● Slide Master  ○ Layout  ○ This Slide       │
├─────────────────────────────────────────────────────────┤
│ [Built-in Styles] [Custom Styles] [+ Create Custom]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │   Modern Sans       │  │   Formal Serif      │      │
│  │ ──────────────────  │  │ ──────────────────  │      │
│  │ Heading Sample      │  │ Heading Sample      │      │
│  │ Body text example   │  │ Body text example   │      │
│  │ Inter • Inter       │  │ Merriweather        │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
│  ┌─────────────────────┐                               │
│  │  Technical Mono     │                               │
│  │ ──────────────────  │                               │
│  │ Heading Sample      │                               │
│  │ Body text example   │                               │
│  │ Roboto Mono         │                               │
│  └─────────────────────┘                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                         [Cancel] [Apply]                │
└─────────────────────────────────────────────────────────┘
```

### 4.3 SlideMasterPresetPicker

**File:** `src/ui/components/SlideMasterPresetPicker.js` (NEW, ~700 lines)

**Purpose:** Allow users to select complete slide master presets (structure + color + typography)

**Features:**
- Gallery of built-in master presets (Corporate, Creative, Minimalist, Academic, etc.)
- Visual preview showing all layouts in the preset
- Shows which color theme and typography style are referenced
- "Create from Current" option to save current master as preset
- Import/export presets

**UI Structure:**
```
┌──────────────────────────────────────────────────────────┐
│ Apply Slide Master Preset                        [✕]     │
├──────────────────────────────────────────────────────────┤
│ [Built-in Presets] [Custom Presets] [+ Create Preset]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────┐                     │
│  │   Corporate Professional       │                     │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  Preview layouts   │
│  │ │  │ │  │ │  │ │  │ │  │ │  │ │                     │
│  │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │                     │
│  │ 6 layouts                      │                     │
│  │ 📊 Default Colors              │                     │
│  │ 📝 Modern Sans Typography      │                     │
│  └────────────────────────────────┘                     │
│                                                          │
│  ┌────────────────────────────────┐                     │
│  │   Creative Bold                │                     │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐            │                     │
│  │ │  │ │  │ │  │ │  │            │                     │
│  │ └──┘ └──┘ └──┘ └──┘            │                     │
│  │ 8 layouts                      │                     │
│  │ 📊 Sunset Colors               │                     │
│  │ 📝 Display Typography          │                     │
│  └────────────────────────────────┘                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ⚠ This will add a new master and update current slide   │
├──────────────────────────────────────────────────────────┤
│                           [Cancel] [Apply]               │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Handler Updates

### 5.1 New Handlers

**File:** `src/core/store/handlers/ColorThemeHandlers.js` (NEW)

```javascript
/**
 * CREATE_COLOR_THEME_PRESET
 * Add new color theme to library
 */
export function handleCreateColorTheme(draft, payload) {
    const { id, name, colors } = payload;
    
    draft.colorThemePresets[id] = {
        id,
        type: 'colorThemePreset',
        name,
        colors,
        isDark: calculateBrightness(colors) < 50,
        category: 'Custom'
    };
}

/**
 * UPDATE_COLOR_THEME_PRESET
 * Modify existing color theme
 */
export function handleUpdateColorTheme(draft, payload) {
    const { id, updates } = payload;
    const theme = draft.colorThemePresets[id];
    
    if (!theme) {
        console.warn('[handleUpdateColorTheme] Theme not found:', id);
        return;
    }
    
    Object.assign(theme, updates);
}

/**
 * DELETE_COLOR_THEME_PRESET
 * Remove color theme from library
 */
export function handleDeleteColorTheme(draft, payload) {
    const { id } = payload;
    delete draft.colorThemePresets[id];
}

/**
 * APPLY_COLOR_THEME
 * Apply color theme to master/layout/slide
 */
export function handleApplyColorTheme(draft, payload) {
    const { themeId, level, targetId } = payload;
    // level: 'master' | 'layout' | 'slide'
    
    if (level === 'master') {
        const master = draft.slideMasterPresets[targetId];
        if (master) master.colorThemeId = themeId;
    } else if (level === 'layout') {
        const layout = draft.layoutMasters[targetId];
        if (layout) layout.colorThemeId = themeId;
    } else if (level === 'slide') {
        const slide = draft.slides[targetId];
        if (slide) slide.colorThemeId = themeId;
    }
}
```

**File:** `src/core/store/handlers/TypographyHandlers.js` (NEW)

```javascript
/**
 * CREATE_TYPOGRAPHY_STYLE_PRESET
 * Add new typography style to library
 */
export function handleCreateTypographyStyle(draft, payload) {
    const { id, name, fonts, textStyles } = payload;
    
    draft.typographyStylePresets[id] = {
        id,
        type: 'typographyStylePreset',
        name,
        fonts,
        textStyles,
        category: 'Custom'
    };
}

/**
 * UPDATE_TYPOGRAPHY_STYLE_PRESET
 * Modify existing typography style
 */
export function handleUpdateTypographyStyle(draft, payload) {
    const { id, updates } = payload;
    const style = draft.typographyStylePresets[id];
    
    if (!style) {
        console.warn('[handleUpdateTypographyStyle] Style not found:', id);
        return;
    }
    
    Object.assign(style, updates);
}

/**
 * DELETE_TYPOGRAPHY_STYLE_PRESET
 * Remove typography style from library
 */
export function handleDeleteTypographyStyle(draft, payload) {
    const { id } = payload;
    delete draft.typographyStylePresets[id];
}

/**
 * APPLY_TYPOGRAPHY_STYLE
 * Apply typography style to master/layout/slide
 */
export function handleApplyTypographyStyle(draft, payload) {
    const { styleId, level, targetId } = payload;
    
    if (level === 'master') {
        const master = draft.slideMasterPresets[targetId];
        if (master) master.typographyStyleId = styleId;
    } else if (level === 'layout') {
        const layout = draft.layoutMasters[targetId];
        if (layout) layout.typographyStyleId = styleId;
    } else if (level === 'slide') {
        const slide = draft.slides[targetId];
        if (slide) slide.typographyStyleId = styleId;
    }
}
```

**File:** `src/core/store/handlers/SlideMasterHandlers.js` (NEW)

```javascript
/**
 * CREATE_SLIDE_MASTER_PRESET
 * Add new slide master preset to presentation
 */
export function handleCreateSlideMasterPreset(draft, payload) {
    const { id, name, colorThemeId, typographyStyleId, layouts } = payload;
    
    draft.slideMasterPresets[id] = {
        id,
        type: 'slideMasterPreset',
        name,
        colorThemeId,
        typographyStyleId,
        elements: {},
        elementOrder: [],
        background: null,
        layoutIds: layouts.map(l => l.id)
    };
    
    // Add associated layouts
    layouts.forEach(layout => {
        draft.layoutMasters[layout.id] = {
            ...layout,
            parentMasterId: id
        };
    });
}

/**
 * UPDATE_SLIDE_MASTER_PRESET
 * Modify slide master preset (change referenced themes)
 */
export function handleUpdateSlideMasterPreset(draft, payload) {
    const { id, updates } = payload;
    const master = draft.slideMasterPresets[id];
    
    if (!master) {
        console.warn('[handleUpdateSlideMasterPreset] Master not found:', id);
        return;
    }
    
    // Only allow changing references, not structure
    if (updates.colorThemeId !== undefined) {
        master.colorThemeId = updates.colorThemeId;
    }
    if (updates.typographyStyleId !== undefined) {
        master.typographyStyleId = updates.typographyStyleId;
    }
    if (updates.name) {
        master.name = updates.name;
    }
}

/**
 * DELETE_SLIDE_MASTER_PRESET
 * Remove slide master preset (and associated layouts)
 */
export function handleDeleteSlideMasterPreset(draft, payload) {
    const { id } = payload;
    const master = draft.slideMasterPresets[id];
    
    if (!master) return;
    
    // Remove associated layouts
    master.layoutIds.forEach(layoutId => {
        delete draft.layoutMasters[layoutId];
    });
    
    // Remove master
    delete draft.slideMasterPresets[id];
}
```

### 5.2 Store Integration

**File:** `src/core/Store.js` (UPDATE)

```javascript
// Add new action handlers
import * as ColorThemeHandlers from './store/handlers/ColorThemeHandlers.js';
import * as TypographyHandlers from './store/handlers/TypographyHandlers.js';
import * as SlideMasterHandlers from './store/handlers/SlideMasterHandlers.js';

// In dispatch method, add new cases:
switch (type) {
    // ... existing cases ...
    
    // Color Theme Presets
    case 'CREATE_COLOR_THEME_PRESET':
        this.snapshot(type);
        ColorThemeHandlers.handleCreateColorTheme(draft, payload);
        break;
    case 'UPDATE_COLOR_THEME_PRESET':
        this.snapshot(type);
        ColorThemeHandlers.handleUpdateColorTheme(draft, payload);
        break;
    case 'DELETE_COLOR_THEME_PRESET':
        this.snapshot(type);
        ColorThemeHandlers.handleDeleteColorTheme(draft, payload);
        break;
    case 'APPLY_COLOR_THEME':
        this.snapshot(type);
        ColorThemeHandlers.handleApplyColorTheme(draft, payload);
        break;
    
    // Typography Style Presets
    case 'CREATE_TYPOGRAPHY_STYLE_PRESET':
        this.snapshot(type);
        TypographyHandlers.handleCreateTypographyStyle(draft, payload);
        break;
    case 'UPDATE_TYPOGRAPHY_STYLE_PRESET':
        this.snapshot(type);
        TypographyHandlers.handleUpdateTypographyStyle(draft, payload);
        break;
    case 'DELETE_TYPOGRAPHY_STYLE_PRESET':
        this.snapshot(type);
        TypographyHandlers.handleDeleteTypographyStyle(draft, payload);
        break;
    case 'APPLY_TYPOGRAPHY_STYLE':
        this.snapshot(type);
        TypographyHandlers.handleApplyTypographyStyle(draft, payload);
        break;
    
    // Slide Master Presets
    case 'CREATE_SLIDE_MASTER_PRESET':
        this.snapshot(type);
        SlideMasterHandlers.handleCreateSlideMasterPreset(draft, payload);
        break;
    case 'UPDATE_SLIDE_MASTER_PRESET':
        this.snapshot(type);
        SlideMasterHandlers.handleUpdateSlideMasterPreset(draft, payload);
        break;
    case 'DELETE_SLIDE_MASTER_PRESET':
        this.snapshot(type);
        SlideMasterHandlers.handleDeleteSlideMasterPreset(draft, payload);
        break;
}
```

---

## 6. Menu Structure Updates

### 6.1 Current Menu (INCORRECT)

```javascript
{
    label: 'Slide',
    items: [
        { id: 'slide-change-theme', label: 'Change Theme...', icon: 'fa-solid fa-palette' },  // ❌ Ambiguous
        // ...
    ]
}
```

### 6.2 New Menu Structure (CORRECT)

**File:** `src/ui/components/AppMenu/menuConfig.js` (UPDATE)

```javascript
{
    label: 'Design',  // New top-level menu
    items: [
        {
            id: 'design-slide-master-preset',
            label: 'Apply Slide Master Preset...',
            icon: 'fa-solid fa-layer-group',
            description: 'Change complete master template (layouts + colors + typography)'
        },
        { type: 'separator' },
        {
            id: 'design-color-theme',
            label: 'Color Theme...',
            icon: 'fa-solid fa-palette',
            description: 'Change color palette (12 colors)'
        },
        {
            id: 'design-typography-style',
            label: 'Typography Style...',
            icon: 'fa-solid fa-font',
            description: 'Change fonts and text styles'
        },
        { type: 'separator' },
        {
            id: 'design-edit-master',
            label: 'Edit Slide Master',
            icon: 'fa-solid fa-pen-ruler',
            description: 'Enter master editing mode'
        }
    ]
},
{
    label: 'Slide',
    items: [
        {
            id: 'slide-change-layout',
            label: 'Change Layout...',
            icon: 'fa-solid fa-table-cells',
            description: 'Change slide layout within current master'
        },
        // ... other slide operations
    ]
}
```

### 6.3 MenuActionHandler Updates

**File:** `src/ui/services/MenuActionHandler.js` (UPDATE)

```javascript
// REMOVE old method
// showThemePicker() { ... }

// ADD new methods
showSlideMasterPresetPicker() {
    document.dispatchEvent(new CustomEvent('story:show-slide-master-preset-picker'));
}

showColorThemePicker() {
    document.dispatchEvent(new CustomEvent('story:show-color-theme-picker', {
        detail: { applyLevel: 'master', targetId: 'master-default' }  // Context-aware
    }));
}

showTypographyStylePicker() {
    document.dispatchEvent(new CustomEvent('story:show-typography-style-picker', {
        detail: { applyLevel: 'master', targetId: 'master-default' }
    }));
}

// Register new handlers
this.register('design-slide-master-preset', () => this.showSlideMasterPresetPicker());
this.register('design-color-theme', () => this.showColorThemePicker());
this.register('design-typography-style', () => this.showTypographyStylePicker());
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**New Test Files:**

```
tests/unit/core/handlers/ColorThemeHandlers.test.js (~300 lines)
tests/unit/core/handlers/TypographyHandlers.test.js (~300 lines)
tests/unit/core/handlers/SlideMasterHandlers.test.js (~400 lines)
tests/unit/ui/ColorThemePicker.test.js (~350 lines)
tests/unit/ui/TypographyStylePicker.test.js (~350 lines)
tests/unit/ui/SlideMasterPresetPicker.test.js (~400 lines)
tests/unit/migrations/MigrateToPresets.test.js (~250 lines)
```

**Total New Tests:** ~2,350 lines, ~80 test cases

### 7.2 Integration Tests

**Test Scenarios:**

1. **Apply color theme at master level** → All slides update
2. **Apply color theme at layout level** → Only slides with that layout update
3. **Apply color theme at slide level** → Only that slide updates
4. **Change master's color theme** → All dependent layouts/slides update
5. **Override color theme** → Slide-level override takes precedence
6. **Cascading inheritance** → Verify 5-level resolution (element → slide → layout → master → default)
7. **Migration** → Load old `.str` file, verify automatic migration
8. **Serialization** → Save/load preserves all preset references

### 7.3 Acceptance Criteria

**Before Refactoring (Phase 1.1):**
- ❌ Colors embedded in master (`themeSettings.colors`)
- ❌ No separation between color/typography
- ❌ Can only edit at master level
- ❌ No preset library

**After Refactoring:**
- ✅ Colors separated into `colorThemePresets` library
- ✅ Typography separated into `typographyStylePresets` library
- ✅ Can apply at master/layout/slide/element level
- ✅ 10+ built-in color themes
- ✅ 8+ built-in typography styles
- ✅ 5+ built-in slide master presets
- ✅ Custom preset creation
- ✅ Mix and match (Corporate master + Sunset colors + Serif typography)
- ✅ Backward compatibility (old files auto-migrate)

---

## 8. Implementation Phases

### Phase 1: Rollback & State Restructure (Week 1)

**Tasks:**
1. ✅ Remove Phase 1.1 code (ThemePicker, ThemeManager)
2. ✅ Revert modified files
3. ✅ Create `TERMINOLOGY-AND-ARCHITECTURE.md`
4. ✅ Update `InitialState.js` to new structure
5. ✅ Create migration function `MigrateToPresets.js`
6. ✅ Write migration tests
7. ✅ Verify all existing tests still pass

**Deliverables:**
- Clean codebase (Phase 1.1 removed)
- New state structure implemented
- Migration function tested
- Zero test regressions

### Phase 2: Color Theme System (Week 2, Days 1-3)

**Tasks:**
1. Create `ColorThemeHandlers.js`
2. Create `ColorThemePicker.js` component
3. Build color theme gallery UI
4. Build custom color editor
5. Integrate with Store (dispatch actions)
6. Write unit tests (35 tests)
7. Write integration tests (10 tests)

**Deliverables:**
- 10+ built-in color themes
- Color theme picker modal
- Apply at master/layout/slide level
- 45 passing tests

### Phase 3: Typography Style System (Week 2, Days 4-5)

**Tasks:**
1. Create `TypographyHandlers.js`
2. Create `TypographyStylePicker.js` component
3. Build typography gallery UI
4. Build custom typography editor
5. Google Fonts integration
6. Write unit tests (35 tests)
7. Write integration tests (10 tests)

**Deliverables:**
- 8+ built-in typography styles
- Typography style picker modal
- Font family selection
- 45 passing tests

### Phase 4: Slide Master Preset System (Week 3, Days 1-3)

**Tasks:**
1. Create `SlideMasterHandlers.js`
2. Create `SlideMasterPresetPicker.js` component
3. Build master preset gallery UI
4. Build preset creation wizard
5. Integrate with color themes and typography styles
6. Write unit tests (40 tests)
7. Write integration tests (15 tests)

**Deliverables:**
- 5+ built-in slide master presets
- Master preset picker modal
- Preset creation from current master
- 55 passing tests

### Phase 5: Menu & Integration (Week 3, Days 4-5)

**Tasks:**
1. Update menu structure (Design menu)
2. Update MenuActionHandler
3. Create manager services (ColorThemeManager, TypographyManager, MasterManager)
4. Context-aware apply levels
5. Keyboard shortcuts
6. Write integration tests (20 tests)

**Deliverables:**
- Complete Design menu
- Context-aware pickers (right-click)
- Keyboard shortcuts working
- 20 integration tests passing

### Phase 6: Documentation & Polish (Week 4)

**Tasks:**
1. Update all spec documents (terminology)
2. Update implementation plan
3. Create user guide
4. Create developer guide
5. Code review
6. Performance optimization
7. Accessibility audit

**Deliverables:**
- All docs updated with correct terminology
- User guide for preset system
- Developer guide for architecture
- Performance benchmarks met
- WCAG AA compliance

---

## 9. Success Metrics

### 9.1 Code Quality

- **Test Coverage**: >90% for new code
- **Tests Passing**: 3,898+ (all existing + new)
- **Zero Regressions**: No existing functionality broken
- **Performance**: No degradation in render times

### 9.2 Architecture Compliance

- ✅ **Separation**: Colors/typography in separate libraries
- ✅ **References**: Masters use IDs, not embedded data
- ✅ **Cascading**: 5-level inheritance working
- ✅ **Flexibility**: Can apply at any level
- ✅ **Reusability**: One theme works with any master

### 9.3 User Experience

- ✅ **Clarity**: Clear terminology (no ambiguous "theme")
- ✅ **Flexibility**: Mix and match presets
- ✅ **Ease**: One-click application
- ✅ **Discovery**: Rich preset libraries
- ✅ **Customization**: Full color/typography editors

---

## 10. Risks & Mitigation

### Risk 1: Breaking Existing Files

**Impact:** HIGH  
**Probability:** MEDIUM  
**Mitigation:**
- Comprehensive migration function
- Extensive migration tests
- Support both old and new formats during transition
- Backward compatibility layer

### Risk 2: Performance Degradation

**Impact:** MEDIUM  
**Probability:** LOW  
**Mitigation:**
- Benchmark before/after
- Cache resolved themes
- Virtual scrolling for preset galleries
- Lazy load preset previews

### Risk 3: User Confusion

**Impact:** LOW  
**Probability:** LOW  
**Mitigation:**
- Clear menu structure
- Descriptive labels
- Tooltips and help text
- In-app tour for new system

### Risk 4: Scope Creep

**Impact:** MEDIUM  
**Probability:** MEDIUM  
**Mitigation:**
- Strict adherence to plan
- Phased implementation
- Clear acceptance criteria
- Regular progress reviews

---

## 11. Rollout Plan

### Phase 1: Internal Testing (Week 4)
- Dev team uses new system
- Identify edge cases
- Fix critical bugs
- Performance tuning

### Phase 2: Beta Release (Week 5)
- Small group of beta testers
- Collect feedback
- Monitor crash reports
- Iterate on UX

### Phase 3: Full Release (Week 6)
- Release to all users
- Migration notifications
- Support documentation
- Monitor adoption

---

## 12. Success Criteria

**BEFORE starting Phase 2, MUST have:**
- ✅ Phase 1.1 completely removed
- ✅ State restructure complete
- ✅ Migration function tested
- ✅ All existing tests passing
- ✅ Architecture document approved

**BEFORE Phase 2 → Phase 3:**
- ✅ Color theme system complete
- ✅ 45 color theme tests passing
- ✅ Zero regressions

**BEFORE Phase 3 → Phase 4:**
- ✅ Typography system complete
- ✅ 45 typography tests passing
- ✅ Zero regressions

**BEFORE Phase 4 → Phase 5:**
- ✅ Master preset system complete
- ✅ 55 master preset tests passing
- ✅ Zero regressions

**BEFORE final release:**
- ✅ All 200+ new tests passing
- ✅ All docs updated
- ✅ Performance benchmarks met
- ✅ User guide complete

---

**End of Refactoring Plan**

**Next Action:** Approve this plan and begin Phase 1 (Rollback & State Restructure)
