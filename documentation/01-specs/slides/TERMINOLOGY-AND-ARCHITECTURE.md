# Slide System Terminology & Architecture

**Version:** 2.0  
**Last Updated:** December 7, 2025  
**Status:** AUTHORITATIVE REFERENCE

---

## 1. Purpose

This document establishes **clear, unambiguous terminology** for the slide system to prevent confusion and architectural errors. It defines the distinct concepts, their relationships, and where they can be applied in the hierarchy.

**Critical Principle:**
> **Slide Master Presets NEVER contain their own colors or typography. They ONLY reference separate Color Theme Presets and Typography Style Presets.**

This separation is essential to avoid conflicts when manipulating sub-components.

---

## 2. Core Concepts

### 2.1 Slide Master Preset

**What it is:**
A complete, reusable template package that defines the visual structure and design of a presentation.

**Contains:**
- **Layout Masters** (1+ layouts: Title Slide, Content, Two-Column, etc.)
- **REFERENCES to Color Theme Preset** (pointer, not embedded colors)
- **REFERENCES to Typography Style Preset** (pointer, not embedded fonts/sizes)
- **Background elements** (logos, footers, decorative graphics)
- **Placeholder definitions** (position, size, type)
- **Master-level objects** (shapes, images, videos, code fills, etc.)

**Does NOT Contain:**
- ❌ Actual color values (only references like `colorThemeId: "ocean-theme"`)
- ❌ Actual font/typography definitions (only references like `typographyStyleId: "modern-sans"`)

**Examples:**
- "Corporate Professional" preset → References "Blue Corporate" colors + "Formal Serif" typography
- "Creative Bold" preset → References "Vibrant Rainbow" colors + "Modern Sans" typography
- "Minimalist Clean" preset → References "Monochrome" colors + "Light Geometric" typography

**Application Level:**
- At **Slide Master** level (top of hierarchy)
- Each presentation can have multiple Slide Master Presets
- Affects all layout masters and slides under that master

**State Structure:**
```javascript
{
  id: "preset-corporate",
  type: "slideMasterPreset",
  name: "Corporate Professional",
  
  // REFERENCES (not embedded data)
  colorThemeId: "color-theme-blue-corporate",  // Pointer to separate preset
  typographyStyleId: "typo-style-formal-serif", // Pointer to separate preset
  
  // Master-level elements (visible on all slides)
  elements: {
    "logo": { type: "image", url: "...", x: 100, y: 950, ... },
    "footer-shape": { type: "shape", shapeType: "rectangle", ... }
  },
  
  // Layout masters (structural templates)
  layouts: [
    { id: "layout-title", ... },
    { id: "layout-content", ... }
  ]
}
```

---

### 2.2 Color Theme Preset

**What it is:**
A standalone, reusable color palette that can be applied at any level of the slide hierarchy.

**Contains:**
- **12 semantic colors** (background1, background2, text1, text2, accent1-6, hyperlink, followedHyperlink)
- **Color definitions** (hex values, RGB, HSL)
- **Brightness metadata** (light/dark mode indicator)

**Does NOT Contain:**
- ❌ Typography information
- ❌ Layout structure
- ❌ Placeholder positions

**Examples:**
- "Ocean Blue" → Blues and teals (#1E3A8A, #0EA5E9, ...)
- "Sunset Warm" → Oranges and reds (#EA580C, #DC2626, ...)
- "Forest Green" → Greens and earth tones (#15803D, #CA8A04, ...)
- "Midnight Dark" → Dark background with bright accents
- "High Contrast" → Accessibility-focused with WCAG AAA compliance

**Application Level:**
- At **Slide Master** level (affects all layouts/slides)
- At **Layout Master** level (override for specific layout)
- At **Individual Slide** level (override for one slide)
- At **Element** level (override for specific shape/text)

**State Structure:**
```javascript
{
  id: "color-theme-ocean",
  type: "colorThemePreset",
  name: "Ocean Blue",
  description: "Cool blues and teals for professional presentations",
  
  // Actual color definitions (this is where colors live)
  colors: {
    background1: "#FFFFFF",
    background2: "#F0F9FF",
    text1: "#0C4A6E",
    text2: "#475569",
    accent1: "#0EA5E9",
    accent2: "#3B82F6",
    accent3: "#10B981",
    accent4: "#F59E0B",
    accent5: "#EF4444",
    accent6: "#8B5CF6",
    hyperlink: "#0284C7",
    followedHyperlink: "#7C3AED"
  },
  
  // Metadata
  isDark: false,
  category: "Professional"
}
```

---

### 2.3 Typography Style Preset

**What it is:**
A standalone, reusable typography system that can be applied at any level of the slide hierarchy.

**Contains:**
- **Font families** (heading font, body font)
- **Text style definitions** (Display, Title, Heading 1-3, Body, Caption, Label)
- **Font properties** (size, weight, line-height, letter-spacing)

**Does NOT Contain:**
- ❌ Color information (colors come from Color Theme Preset)
- ❌ Layout structure
- ❌ Placeholder positions

**Examples:**
- "Modern Sans" → Inter/Open Sans, geometric proportions
- "Formal Serif" → Merriweather/Georgia, traditional hierarchy
- "Technical Mono" → Roboto Mono/Fira Code, monospace accents
- "Creative Display" → Poppins/Montserrat, bold headlines

**Application Level:**
- At **Slide Master** level (affects all layouts/slides)
- At **Layout Master** level (override for specific layout)
- At **Individual Slide** level (override for one slide)
- At **Element** level (override for specific text box)

**State Structure:**
```javascript
{
  id: "typo-style-modern-sans",
  type: "typographyStylePreset",
  name: "Modern Sans",
  description: "Clean geometric sans-serif for contemporary presentations",
  
  // Font families
  fonts: {
    heading: "Inter",
    body: "Inter",
    monospace: "Fira Code"  // Optional
  },
  
  // Text style definitions (sizes, weights, spacing)
  textStyles: {
    display: { fontSize: 80, fontWeight: "800", lineHeight: 1.0, letterSpacing: "-2%", fontFamily: "heading" },
    title: { fontSize: 56, fontWeight: "700", lineHeight: 1.1, letterSpacing: "-1%", fontFamily: "heading" },
    heading1: { fontSize: 44, fontWeight: "700", lineHeight: 1.2, letterSpacing: "-0.5%", fontFamily: "heading" },
    heading2: { fontSize: 32, fontWeight: "600", lineHeight: 1.25, letterSpacing: "0%", fontFamily: "heading" },
    body: { fontSize: 20, fontWeight: "400", lineHeight: 1.6, letterSpacing: "0%", fontFamily: "body" },
    caption: { fontSize: 14, fontWeight: "500", lineHeight: 1.4, letterSpacing: "0.5%", fontFamily: "body" }
  },
  
  // Metadata
  category: "Sans Serif"
}
```

---

## 3. Hierarchy & Inheritance

### 3.1 Application Hierarchy

```
PRESENTATION
│
├─► Color Theme Presets (Library, 10+)
│   ├─ Ocean Blue
│   ├─ Sunset Warm
│   ├─ Forest Green
│   └─ ...
│
├─► Typography Style Presets (Library, 8+)
│   ├─ Modern Sans
│   ├─ Formal Serif
│   ├─ Technical Mono
│   └─ ...
│
├─► Slide Master Presets (1+ per presentation)
│   │
│   ├─ SLIDE MASTER: "Corporate Theme"
│   │   ├─ colorThemeId: "ocean-blue" ← REFERENCE
│   │   ├─ typographyStyleId: "modern-sans" ← REFERENCE
│   │   ├─ Master elements (logo, footer)
│   │   │
│   │   └─► LAYOUT MASTERS (1+ per master)
│   │       │
│   │       ├─ Layout: "Title Slide"
│   │       │   ├─ colorThemeId: null (inherits from master)
│   │       │   ├─ typographyStyleId: null (inherits from master)
│   │       │   ├─ Placeholders (title, subtitle positions)
│   │       │   │
│   │       │   └─► SLIDES (instances)
│   │       │       ├─ Slide 1
│   │       │       │   ├─ colorThemeId: null (inherits from layout)
│   │       │       │   ├─ typographyStyleId: null (inherits from layout)
│   │       │       │   └─ Content (actual text, images)
│   │       │       │
│   │       │       └─ Slide 2
│   │       │           ├─ colorThemeId: "sunset-warm" (OVERRIDE)
│   │       │           ├─ typographyStyleId: null (inherits)
│   │       │           └─ Content
│   │       │
│   │       └─ Layout: "Content"
│   │           ├─ colorThemeId: null (inherits)
│   │           ├─ typographyStyleId: "formal-serif" (OVERRIDE)
│   │           └─ Placeholders (title, body positions)
│   │
│   └─ SLIDE MASTER: "Creative Theme"
│       ├─ colorThemeId: "vibrant-rainbow"
│       ├─ typographyStyleId: "creative-display"
│       └─ ...
│
└─► Slides (ordered list of slide instances)
    ├─ Slide 1 (uses "Title Slide" layout from "Corporate Theme")
    ├─ Slide 2 (uses "Content" layout from "Corporate Theme")
    └─ Slide 3 (uses "Title Slide" layout from "Creative Theme")
```

### 3.2 Inheritance Rules

**Color Theme Resolution (Cascading):**
```
1. Element level colorThemeId (highest priority)
   ↓ if null
2. Slide level colorThemeId
   ↓ if null
3. Layout Master level colorThemeId
   ↓ if null
4. Slide Master level colorThemeId
   ↓ if null
5. Presentation default colorThemeId (fallback)
```

**Typography Style Resolution (Cascading):**
```
1. Element level typographyStyleId (highest priority)
   ↓ if null
2. Slide level typographyStyleId
   ↓ if null
3. Layout Master level typographyStyleId
   ↓ if null
4. Slide Master level typographyStyleId
   ↓ if null
5. Presentation default typographyStyleId (fallback)
```

---

## 4. Current Implementation Issues

### 4.1 Architecture Violations (Phase 1.1)

**PROBLEM 1: Colors embedded in Slide Master**
```javascript
// WRONG - Current implementation
"theme-default": {
  type: "theme",  // ❌ Ambiguous name
  themeSettings: {  // ❌ Embedding colors directly
    colors: {
      background1: "#FFFFFF",
      text1: "#0F172A",
      accent1: "#3B82F6",
      // ... more colors
    }
  }
}

// CORRECT - Should be
"master-default": {
  type: "slideMasterPreset",
  colorThemeId: "color-theme-default",  // Reference, not embedded
  typographyStyleId: "typo-style-default"
}

// Separate color theme preset
"color-theme-default": {
  type: "colorThemePreset",
  colors: {
    background1: "#FFFFFF",
    // ...
  }
}
```

**PROBLEM 2: ThemePicker edits colors at master level**
- Current Phase 1.1 implementation allows editing colors directly in `themeSettings`
- This violates separation principle
- Should have separate `ColorThemePicker` that creates/edits `colorThemePreset` objects
- Master should only select which color theme to reference

**PROBLEM 3: Terminology confusion**
- `type: "theme"` should be `type: "slideMasterPreset"`
- `themeSettings` should be split into references: `colorThemeId`, `typographyStyleId`
- Menu item "Change Theme" is ambiguous (change master? color? typography?)

---

## 5. Correct Terminology Usage

### 5.1 User-Facing Terms

| Term | Definition | Menu Location |
|------|------------|---------------|
| **Slide Master Preset** | Complete template package (layouts + references) | Design → Apply Slide Master |
| **Color Theme** | Color palette (12 colors) | Design → Color Theme |
| **Typography Style** | Font system (families + sizes) | Design → Typography Style |
| **Layout** | Specific slide arrangement within a master | Slide → Change Layout |

### 5.2 Code Terms (State/API)

| Code Term | Type | Description |
|-----------|------|-------------|
| `slideMasterPreset` | Object type | Complete master template |
| `colorThemePreset` | Object type | Color palette definition |
| `typographyStylePreset` | Object type | Typography system definition |
| `layoutMaster` | Object type | Individual layout within master |
| `colorThemeId` | String reference | Pointer to color theme |
| `typographyStyleId` | String reference | Pointer to typography style |

### 5.3 Forbidden Terms (Ambiguous)

| Forbidden | Why | Use Instead |
|-----------|-----|-------------|
| `theme` | Too vague | `slideMasterPreset`, `colorThemePreset`, or `typographyStylePreset` |
| `themeSettings` | Mixed concerns | `colorThemeId` + `typographyStyleId` |
| `style` | Too generic | `typographyStylePreset` or `colorThemePreset` |
| `template` | Ambiguous | `slideMasterPreset` |

---

## 6. Refactoring Requirements

### 6.1 State Structure Changes

**BEFORE (Current):**
```javascript
state = {
  masters: {
    "theme-default": {
      type: "theme",
      themeSettings: {
        colors: { ... },  // ❌ Embedded
        fonts: { ... }     // ❌ Embedded
      }
    },
    "layout-title": {
      type: "layout",
      parentId: "theme-default"
    }
  }
}
```

**AFTER (Correct):**
```javascript
state = {
  // Separate libraries
  colorThemePresets: {
    "color-theme-default": {
      type: "colorThemePreset",
      colors: { ... }  // ✅ Centralized
    },
    "color-theme-ocean": { ... }
  },
  
  typographyStylePresets: {
    "typo-style-default": {
      type: "typographyStylePreset",
      fonts: { ... },  // ✅ Centralized
      textStyles: { ... }
    },
    "typo-style-formal": { ... }
  },
  
  // Slide master presets with references
  slideMasterPresets: {
    "master-default": {
      type: "slideMasterPreset",
      colorThemeId: "color-theme-default",  // ✅ Reference
      typographyStyleId: "typo-style-default",  // ✅ Reference
      layouts: ["layout-title", "layout-content"]
    }
  },
  
  // Layout masters
  layoutMasters: {
    "layout-title": {
      type: "layoutMaster",
      parentMasterId: "master-default",
      colorThemeId: null,  // null = inherit from parent
      typographyStyleId: null
    }
  },
  
  // Slides
  slides: {
    "slide-1": {
      layoutId: "layout-title",
      colorThemeId: null,  // null = inherit from layout
      typographyStyleId: null
    }
  }
}
```

### 6.2 Code Changes Required

**Files to Remove:**
- ❌ `src/ui/components/ThemePicker.js` (575 lines)
- ❌ `src/ui/services/ThemeManager.js` (87 lines)
- ❌ `tests/unit/ui/ThemePicker.test.js` (315 lines)
- ❌ `tests/unit/ui/ThemeManager.test.js` (224 lines)
- ❌ Phase 1.1 implementation (1,201 lines total)

**Files to Create:**
- ✅ `src/ui/components/ColorThemePicker.js` (new)
- ✅ `src/ui/components/TypographyStylePicker.js` (new)
- ✅ `src/ui/components/SlideMasterPresetPicker.js` (new)
- ✅ `src/core/store/handlers/ColorThemeHandlers.js` (new)
- ✅ `src/core/store/handlers/TypographyHandlers.js` (new)

**Files to Update:**
- 🔄 `src/core/store/InitialState.js` (restructure presets)
- 🔄 `src/ui/components/AppMenu/menuConfig.js` (rename menu items)
- 🔄 All spec docs (terminology updates)

---

## 7. Migration Strategy

### 7.1 Backward Compatibility

**Support old `.str` files:**
```javascript
// Migration function
function migrateOldFormat(oldState) {
  // Extract colors from themeSettings
  const colors = oldState.masters['theme-default'].themeSettings.colors;
  
  // Create separate color theme preset
  const colorTheme = {
    id: "color-theme-migrated",
    type: "colorThemePreset",
    colors: colors
  };
  
  // Update master to reference it
  oldState.masters['theme-default'].colorThemeId = "color-theme-migrated";
  delete oldState.masters['theme-default'].themeSettings.colors;
  
  return newState;
}
```

### 7.2 Phased Rollout

**Phase 1: Create new structure alongside old**
- Add `colorThemePresets`, `typographyStylePresets` to state
- Keep old `themeSettings` temporarily
- Dual read: check new first, fallback to old

**Phase 2: Migrate UI components**
- Replace ThemePicker with ColorThemePicker
- Add TypographyStylePicker
- Update menu structure

**Phase 3: Remove old structure**
- Delete `themeSettings` property
- Delete old ThemePicker code
- Update all references

---

## 8. User Workflows

### 8.1 Apply Slide Master Preset

**Menu:** Design → Apply Slide Master Preset

**Workflow:**
1. User opens "Slide Master Preset" picker
2. Sees gallery of complete preset packages (Corporate, Creative, Minimalist, etc.)
3. Each preset shows preview (layouts, colors, fonts combined)
4. Selects preset
5. System applies:
   - Adds master to presentation
   - Sets referenced color theme
   - Sets referenced typography style
   - Creates all layout masters
   - Updates current slide to use new layout

### 8.2 Change Color Theme

**Menu:** Design → Color Theme

**Workflow:**
1. User opens "Color Theme" picker
2. Sees library of color palettes only (no fonts/layouts)
3. Can apply at:
   - Slide Master level (affects all layouts/slides)
   - Layout level (affects specific layout type)
   - Slide level (affects one slide)
4. Selects color theme
5. System updates `colorThemeId` at chosen level
6. Colors cascade down hierarchy

### 8.3 Change Typography Style

**Menu:** Design → Typography Style

**Workflow:**
1. User opens "Typography Style" picker
2. Sees library of typography systems only (no colors/layouts)
3. Can apply at same levels as color theme
4. Selects typography style
5. System updates `typographyStyleId` at chosen level
6. Typography cascades down hierarchy

### 8.4 Create Custom Color Theme

**Menu:** Design → Color Theme → Create Custom

**Workflow:**
1. Opens color editor (12 color slots)
2. Adjusts colors with ColorInput component
3. Names the theme
4. Saves to `colorThemePresets` library
5. Can now apply to any master/layout/slide

---

## 9. Summary

### 9.1 Key Principles

1. **Separation of Concerns:**
   - Slide Master Presets = Structure + References
   - Color Themes = Colors only
   - Typography Styles = Fonts/sizes only

2. **No Embedding:**
   - Masters NEVER contain actual color values
   - Masters NEVER contain actual typography definitions
   - Masters ONLY contain references (IDs)

3. **Cascading Inheritance:**
   - Any level can reference a preset
   - Null = inherit from parent
   - Non-null = override with specific preset

4. **Clear Terminology:**
   - Avoid ambiguous terms like "theme" or "style"
   - Use precise terms: `slideMasterPreset`, `colorThemePreset`, `typographyStylePreset`

### 9.2 Benefits

- ✅ **No conflicts** when changing colors (doesn't affect master structure)
- ✅ **Reusability** (one color theme works with any master preset)
- ✅ **Mix and match** (Corporate master + Sunset colors + Serif typography)
- ✅ **Easy updates** (change color theme, all instances update)
- ✅ **Clear mental model** (users understand what changes what)

---

## 10. Next Steps

1. ✅ **Review and approve this document** (establish as authoritative reference)
2. 📋 **Create detailed refactoring plan** (step-by-step migration)
3. 📋 **Update all spec documents** (terminology consistency)
4. 📋 **Implement new state structure** (add preset libraries)
5. 📋 **Build new UI components** (ColorThemePicker, TypographyStylePicker, SlideMasterPresetPicker)
6. 📋 **Remove Phase 1.1 implementation** (ThemePicker, ThemeManager)
7. 📋 **Update tests** (reflect new architecture)
8. 📋 **Migration guide** (for existing .str files)

---

**End of Document**
