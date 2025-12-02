# Color Value Architecture Specification

## Overview

This document defines a clean, decoupled architecture for color values throughout the application. The core principle is **separation of concerns**:

1. **Color Value** - The actual color data (what gets rendered)
2. **Color Source** - Where the color comes from (custom vs theme-linked)
3. **Color Consumer** - Where the color is applied (fills, strokes, text, gradients)

Elements and renderers should be **agnostic** about color sources. They receive resolved color values and render them. The resolution layer handles the logic of custom vs theme-linked colors.

### Design System Alignment

This architecture follows the principles in `documentation/principles.md`:

- **Global CSS Variables**: Theme-linked colors use `var(--theme-slot-N)` CSS variables
- **No Hardcoded Values**: All theme colors flow through the resolution system
- **Theming as Litmus Test**: Switching themes instantly updates all linked colors
- **Single Component, Multiple Contexts**: `ColorSwatch` component works everywhere
- **Undo/Redo Compatible**: ColorValue changes are atomic and undoable
- **Serialization Safe**: ColorValue format is JSON-serializable for file storage

---

## 1. Core Principles

### 1.1 Single Color Value Type

All places that accept colors use the same data structure:

```typescript
interface ColorValue {
  // The actual hex color (always present, always valid)
  hex: string;  // e.g., '#FF5733'
  
  // Optional: Opacity (0-100, default 100)
  opacity?: number;
  
  // Optional: Source information (for UI/editing purposes only)
  source?: ColorSource;
}

interface ColorSource {
  type: 'custom' | 'theme';
  
  // Only present if type === 'theme'
  themeSlot?: number;  // 0-11
}
```

### 1.2 Resolution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│  (Color Picker, Theme Swatch Click, Preset Application)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COLOR VALUE FACTORY                          │
│  createColorValue({ hex, opacity?, themeSlot? })                │
│  - If themeSlot provided: type='theme', resolves hex from theme │
│  - If only hex provided: type='custom'                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ELEMENT DATA MODEL                           │
│  element.style.fills[0].color = ColorValue                      │
│  element.style.stroke.color = ColorValue                        │
│  element.style.textFill.color = ColorValue                      │
│  gradient.stops[n].color = ColorValue                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RENDERER (Element)                           │
│  Only reads: colorValue.hex and colorValue.opacity              │
│  Does NOT care about colorValue.source                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Theme Update Flow

When the theme changes, a separate process updates all theme-linked colors:

```
┌─────────────────────────────────────────────────────────────────┐
│                     THEME CHANGE EVENT                           │
│  (User edits theme, applies preset, toggles dark mode)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COLOR RESOLVER SERVICE                       │
│  1. Find all elements with source.type === 'theme'              │
│  2. Re-resolve each colorValue.hex from current theme           │
│  3. Update CSS variables (--theme-slot-1 through --theme-slot-12)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RE-RENDER                                    │
│  Elements re-render with updated hex values                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### 2.1 ColorValue Object

```javascript
// ColorValue - The universal color container
{
  hex: '#FF5733',        // REQUIRED: Always a valid hex color
  opacity: 100,          // OPTIONAL: 0-100, defaults to 100
  source: {              // OPTIONAL: Metadata for editing UI
    type: 'custom'       // 'custom' | 'theme'
  }
}

// Theme-linked example:
{
  hex: '#1A1A2E',        // Current resolved value from theme
  opacity: 100,
  source: {
    type: 'theme',
    themeSlot: 0         // Links to slot 0 (shadow primary)
  }
}
```

### 2.2 Migration from Current Model

**Current (inconsistent):**
```javascript
// Solid fill
{ type: 'solid', color: '#FF5733', themeSlot: 5 }

// Text fill  
{ type: 'solid', value: '#FF5733', themeSlot: 5 }

// Stroke
{ color: '#FF5733', themeSlot: undefined }

// Gradient stop
{ color: '#FF5733', position: 50 }  // No themeSlot support!
```

**New (unified):**
```javascript
// Solid fill
{ 
  type: 'solid', 
  color: { hex: '#FF5733', source: { type: 'theme', themeSlot: 5 } }
}

// Text fill  
{ 
  type: 'solid', 
  color: { hex: '#FF5733', source: { type: 'theme', themeSlot: 5 } }
}

// Stroke
{ 
  color: { hex: '#FF5733', source: { type: 'custom' } },
  width: 2
}

// Gradient stop - NOW supports theme linking!
{ 
  color: { hex: '#FF5733', source: { type: 'theme', themeSlot: 5 } }, 
  position: 50 
}
```

### 2.3 Backward Compatibility

The ColorValue factory handles legacy formats:

```javascript
function normalizeColorValue(input) {
  // Already new format
  if (input && typeof input === 'object' && input.hex) {
    return input;
  }
  
  // Legacy: just a hex string
  if (typeof input === 'string') {
    return { hex: input, source: { type: 'custom' } };
  }
  
  // Legacy: object with color/value and optional themeSlot
  if (input && typeof input === 'object') {
    const hex = input.color || input.value || '#000000';
    const source = input.themeSlot !== undefined && input.themeSlot !== null
      ? { type: 'theme', themeSlot: input.themeSlot }
      : { type: 'custom' };
    return { hex, opacity: input.opacity, source };
  }
  
  return { hex: '#000000', source: { type: 'custom' } };
}
```

---

## 3. Color Resolution Service

### 3.1 ColorResolver Module

```javascript
// src/utils/ColorResolver.js

import { store } from '../core/Store.js';

export const ColorResolver = {
  /**
   * Create a custom (non-linked) color value
   */
  createCustomColor(hex, opacity = 100) {
    return {
      hex: hex,
      opacity: opacity,
      source: { type: 'custom' }
    };
  },

  /**
   * Create a theme-linked color value
   * Resolves the current hex from the theme
   */
  createThemeColor(slotIndex, opacity = 100) {
    const hex = this.resolveThemeSlot(slotIndex);
    return {
      hex: hex,
      opacity: opacity,
      source: { type: 'theme', themeSlot: slotIndex }
    };
  },

  /**
   * Resolve a theme slot to its current hex value
   * Handles dark mode mapping automatically
   */
  resolveThemeSlot(slotIndex) {
    const state = store.getState();
    const themeMaster = Object.values(state.masters).find(m => m.type === 'theme');
    const lumaTheme = themeMaster?.themeSettings?.lumaTheme;
    
    if (!lumaTheme?.slots) {
      return '#000000';
    }
    
    // Apply dark mode mapping if needed
    const colorMode = lumaTheme.colorMode || 'light';
    const effectiveIndex = colorMode === 'dark' ? (11 - slotIndex) : slotIndex;
    
    return lumaTheme.slots[effectiveIndex]?.hex || '#000000';
  },

  /**
   * Get the display hex for any ColorValue
   * This is what renderers should use
   */
  getDisplayColor(colorValue) {
    if (!colorValue) return '#000000';
    
    // If theme-linked, re-resolve to get current value
    if (colorValue.source?.type === 'theme' && colorValue.source.themeSlot !== undefined) {
      return this.resolveThemeSlot(colorValue.source.themeSlot);
    }
    
    return colorValue.hex || '#000000';
  },

  /**
   * Check if a color is theme-linked
   */
  isThemeLinked(colorValue) {
    return colorValue?.source?.type === 'theme';
  },

  /**
   * Unlink a color from theme (converts to custom)
   */
  unlinkFromTheme(colorValue) {
    return {
      hex: this.getDisplayColor(colorValue),
      opacity: colorValue?.opacity || 100,
      source: { type: 'custom' }
    };
  },

  /**
   * Link an existing color to a theme slot
   */
  linkToTheme(colorValue, slotIndex) {
    return this.createThemeColor(slotIndex, colorValue?.opacity || 100);
  }
};
```

### 3.2 Theme Change Handling

When theme changes, CSS variables are updated automatically. Elements using `var(--theme-slot1)` etc. will update. For elements storing resolved hex values, they need re-resolution:

```javascript
// In store subscription or theme change handler
store.on('state-changed', (state) => {
  // Update CSS variables for immediate visual feedback
  const lumaTheme = state.masters?.['theme-default']?.themeSettings?.lumaTheme;
  if (lumaTheme?.slots) {
    const colorMode = lumaTheme.colorMode || 'light';
    const colors = lumaTheme.slots.map(s => s.hex);
    applyThemeToCSSVariables(colors, document.documentElement, colorMode);
  }
});
```

---

## 4. UI/UX Design Patterns

### 4.1 Visual Indicator for Theme-Linked Colors

**The Problem:** Users must always know if a color is custom or theme-linked. If they can't tell, they'll be confused when colors change unexpectedly (on theme switch) or don't change (custom colors).

**The Solution:** A distinct visual treatment for ALL theme-linked color swatches.

#### Theme-Linked Swatch Indicator

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOM COLOR SWATCH          │  THEME-LINKED COLOR SWATCH      │
│                               │                                  │
│  ┌─────────────┐              │  ╔═════════════╗                │
│  │             │              │  ║             ║  ← Accent      │
│  │   #FF5733   │              │  ║   #1A1A2E   ║    border      │
│  │             │              │  ║             ║                │
│  └─────────────┘              │  ╚═════════════╝                │
│                               │         ┌─┐                     │
│  Standard 1px border          │         │5│ ← Slot badge       │
│  var(--color-border)          │         └─┘   (optional)        │
│                               │                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### CSS Implementation

```css
/* Base swatch styles - use global CSS variables */
.color-swatch {
  width: var(--swatch-size, 24px);
  height: var(--swatch-size, 24px);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  position: relative;
}

/* Theme-linked indicator - accent color border */
.color-swatch.theme-linked {
  border: 2px solid var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent-subtle);
}

/* Optional: Slot number badge */
.color-swatch.theme-linked::after {
  content: attr(data-slot);
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 8px;
  font-weight: 600;
  background: var(--color-accent);
  color: var(--color-text-on-accent);
  border-radius: var(--radius-xs);
  padding: 0 3px;
  line-height: 12px;
  min-width: 12px;
  text-align: center;
}

/* Hover state follows interaction color philosophy */
.color-swatch:hover {
  border-color: var(--color-accent-muted);
}

.color-swatch.theme-linked:hover {
  box-shadow: 0 0 0 2px var(--color-accent-muted);
}
```

#### Where This Appears

The theme-linked indicator must appear **everywhere** colors are shown:

| Location | Component | Notes |
|----------|-----------|-------|
| Fill Section | `FillRow` swatch | Each fill layer's color swatch |
| Stroke Section | `StrokeRow` swatch | Stroke color swatch |
| Text Section | Text fill swatch | Text color swatch |
| Gradient Editor | Stop handles | Each gradient stop on the bar |
| Gradient Editor | Stop list swatches | In the stop list panel |
| Color Picker | Current color swatch | Shows linked state when open |

### 4.2 Color Picker Integration

The color picker is the central place where users choose between custom and theme-linked colors.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Color Picker                                              [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              HSB Color Picker Area                        │ │
│  │              (Saturation/Brightness square)               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│  └───────────────────────────────────────────────────────────┘ │
│  Hue Slider                                                     │
│                                                                 │
│  ┌─────────┐  ┌───────────────────┐  ┌───────────────────────┐ │
│  │ Preview │  │ Hex: #FF5733      │  │ Opacity: 100%         │ │
│  │ Swatch  │  └───────────────────┘  └───────────────────────┘ │
│  └─────────┘                                                    │
│                                                                 │
│  ───────────────── Theme Colors ─────────────────               │
│                                                                 │
│  ┌────┬────┬────┬────┬────┬────┐                               │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │  Shadows (dark)               │
│  ├────┼────┼────┼────┼────┼────┤                               │
│  │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │  Highlights (light)           │
│  └────┴────┴────┴────┴────┴────┘                               │
│  Click to link color to theme slot                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ╔═══╗ Linked to Theme Slot 5              [Unlink]       │ │
│  │  ║   ║ Changes with theme                                 │ │
│  │  ╚═══╝                                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ^ This section only shows when color IS theme-linked           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Interaction Behaviors

| Action | Result | Notes |
|--------|--------|-------|
| Pick color in HSB area | Creates custom color | Automatically unlinks if was linked |
| Type hex value | Creates custom color | Automatically unlinks if was linked |
| Click theme swatch | Creates linked color | Shows "Linked to Slot N" feedback |
| Click "Unlink" | Converts to custom | Preserves current hex value |
| Adjust opacity | Updates opacity | Doesn't affect link status |

#### State Communication

```javascript
// Color picker onChange callback signature
onChange(colorValue: ColorValue, isTransient: boolean)

// Examples of what gets emitted:

// User picked a custom color via HSB
{
  hex: '#FF5733',
  opacity: 100,
  source: { type: 'custom' }
}

// User clicked theme slot 5
{
  hex: '#3B82F6',  // Current resolved color from theme
  opacity: 100,
  source: { type: 'theme', themeSlot: 5 }
}

// User clicked "Unlink" on a linked color
{
  hex: '#3B82F6',  // Preserves the color
  opacity: 100,
  source: { type: 'custom' }  // Now custom
}
```

### 4.3 Property Inspector: Fill Section

Each fill row shows the color swatch with appropriate theme-linked styling.

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                    [+]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────┐ ╔════╗  Solid    100%   ≡                              │
│  │ 👁 │ ║    ║  ────────────────                               │
│  └────┘ ╚════╝  ↑ Theme-linked swatch (accent border)          │
│                                                                 │
│  ┌────┐ ┌────┐  Gradient  100%   ≡                              │
│  │ 👁 │ │    │  ────────────────                               │
│  └────┘ └────┘  ↑ Custom color swatch (normal border)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Gradient Editor with Mixed Theme/Custom Stops

Gradients can have **any combination** of theme-linked and custom stops. This is a key feature for design flexibility.

#### Gradient Bar with Stop Handles

```
┌─────────────────────────────────────────────────────────────────┐
│  Gradient                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Type: [Linear ▼]  Angle: [90°]                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓███████████████████████││
│  └─────────────────────────────────────────────────────────────┘│
│    ╔═╗                    ┌─┐                              ╔═╗  │
│    ║ ║                    │ │                              ║ ║  │
│    ╚═╝                    └─┘                              ╚═╝  │
│    ↑ Linked               ↑ Custom                         ↑ Linked
│    (accent border)        (normal border)                  (accent border)
│                                                                 │
│  ─────────────── Stops ───────────────                         │
│                                                                 │
│  ╔════╗ 0%   Theme Slot 1 (Shadow)           [×]               │
│  ║    ║      ↳ Linked to theme                                 │
│  ╚════╝                                                        │
│                                                                 │
│  ┌────┐ 50%  #3B82F6 (Custom)                [×]               │
│  │    │      ↳ Custom color                                    │
│  └────┘                                                        │
│                                                                 │
│  ╔════╗ 100% Theme Slot 12 (Highlight)       [×]               │
│  ║    ║      ↳ Linked to theme                                 │
│  ╚════╝                                                        │
│                                                                 │
│  [+ Add Stop]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Gradient Stop Data Model

```javascript
// Gradient with mixed linked and custom stops
{
  type: 'gradient',
  value: {
    type: 'linear',
    angle: 90,
    stops: [
      {
        position: 0,
        color: {
          hex: '#1A1A2E',
          opacity: 100,
          source: { type: 'theme', themeSlot: 0 }  // Linked to shadow
        }
      },
      {
        position: 50,
        color: {
          hex: '#3B82F6',
          opacity: 100,
          source: { type: 'custom' }  // Custom color
        }
      },
      {
        position: 100,
        color: {
          hex: '#F5F5F7',
          opacity: 100,
          source: { type: 'theme', themeSlot: 11 }  // Linked to highlight
        }
      }
    ]
  }
}
```

#### Use Case: Theme-Adaptive Gradients

When user creates a gradient with theme-linked stops:
1. Start stop → Theme Slot 1 (shadows)
2. End stop → Theme Slot 12 (highlights)

When theme changes:
- The gradient automatically adapts
- Shadow color updates to new theme's shadow
- Highlight color updates to new theme's highlight
- Any custom stops in between stay fixed

This enables **theme-adaptive** gradients that work across different color schemes!

### 4.5 Stroke Section

Strokes use the same ColorValue format and visual indicators.

```
┌─────────────────────────────────────────────────────────────────┐
│  Stroke                                                  [+]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔════╗  2px  Inside   100%                                    │
│  ║    ║  ─────────────────                                     │
│  ╚════╝  ↑ Theme-linked stroke color                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Text Color Section

Text fill also uses ColorValue, supporting both custom and theme-linked colors.

```
┌─────────────────────────────────────────────────────────────────┐
│  Text                                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Color:  ╔════╗  Linked to Theme Slot 3                        │
│          ║    ║                                                 │
│          ╚════╝                                                 │
│                                                                 │
│  Font:   Inter                                                  │
│  Size:   16px                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Rendering

### 5.1 Core Principle: Renderers Don't Care About Source

The fundamental rule for rendering is simple:

> **Renderers only read `hex` and `opacity`. They NEVER look at `source`.**

This keeps rendering code simple and ensures clean separation of concerns.

### 5.2 Renderer Implementation

```javascript
// In ShapeElement renderer
applyFill(fill) {
  if (fill.type === 'solid') {
    const color = ColorResolver.getDisplayColor(fill.color);
    const opacity = fill.color?.opacity ?? 100;
    this.element.style.backgroundColor = color;
    this.element.style.opacity = opacity / 100;
  }
}

// In TextElement renderer
applyTextColor(textFill) {
  const color = ColorResolver.getDisplayColor(textFill.color);
  this.element.style.color = color;
}

// In gradient rendering
renderGradient(gradient) {
  const stops = gradient.stops.map(stop => {
    const color = ColorResolver.getDisplayColor(stop.color);
    const opacity = stop.color?.opacity ?? 100;
    return `rgba(${hexToRgb(color)}, ${opacity / 100}) ${stop.position}%`;
  });
  return `linear-gradient(${gradient.angle}deg, ${stops.join(', ')})`;
}
```

### 5.3 CSS Variables for Theme-Linked Colors (Performance Optimization)

For better performance during theme changes, theme-linked colors can render using CSS variables directly. This enables instant updates without re-rendering:

```javascript
// Option A: Always resolve to hex (simpler, requires re-render on theme change)
function applyFillSimple(fill) {
  const color = ColorResolver.getDisplayColor(fill.color);
  this.element.style.backgroundColor = color;
}

// Option B: Use CSS variables for theme-linked (instant theme updates)
function applyFillWithCSSVars(fill) {
  if (ColorResolver.isThemeLinked(fill.color)) {
    const slot = fill.color.source.themeSlot;
    const slotNum = slot + 1; // 1-indexed for CSS (--theme-slot-1 through --theme-slot-12)
    this.element.style.backgroundColor = `var(--theme-slot-${slotNum})`;
  } else {
    this.element.style.backgroundColor = fill.color.hex;
  }
}
```

### 5.4 CSS Variable Definition

CSS variables are defined at the root level and updated when theme changes:

```css
/* Applied to :root or document.documentElement */
:root {
  --theme-slot-1: #1A1A2E;   /* Darkest shadow */
  --theme-slot-2: #2D2D42;
  --theme-slot-3: #404056;
  --theme-slot-4: #53536A;
  --theme-slot-5: #66667E;
  --theme-slot-6: #797992;   /* Midtone */
  --theme-slot-7: #8C8CA6;
  --theme-slot-8: #9F9FBA;
  --theme-slot-9: #B2B2CE;
  --theme-slot-10: #C5C5E2;
  --theme-slot-11: #D8D8F6;
  --theme-slot-12: #F5F5FF;  /* Lightest highlight */
}
```

### 5.5 Theme Change Handler

```javascript
// In ColorThemeManager or Store subscription
function updateThemeCSSVariables(lumaTheme, colorMode = 'light') {
  const root = document.documentElement;
  
  lumaTheme.slots.forEach((slot, index) => {
    // Apply dark mode slot mapping if needed
    const effectiveIndex = colorMode === 'dark' ? (11 - index) : index;
    const hex = lumaTheme.slots[effectiveIndex]?.hex || '#000000';
    
    // CSS variables are 1-indexed
    root.style.setProperty(`--theme-slot-${index + 1}`, hex);
  });
}
```

### 5.6 Rendering Decision Tree

```
                    ┌─────────────────────────┐
                    │  Render Color Value     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  Use CSS Variables?     │
                    │  (Performance mode)      │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │ NO              │                 │ YES
              ▼                 │                 ▼
    ┌─────────────────┐         │     ┌─────────────────────────┐
    │ Use hex directly │        │     │ Is theme-linked?        │
    │ from ColorValue  │        │     └───────────┬─────────────┘
    └─────────────────┘         │                 │
                                │     ┌───────────┼───────────┐
                                │     │ YES       │           │ NO
                                │     ▼           │           ▼
                                │  var(--theme-   │     Use hex
                                │  slot-N)        │     directly
                                │                 │
                                └─────────────────┘
```

---

## 6. Migration Strategy

### 6.1 Phase 1: Add ColorResolver (Non-Breaking)

1. Create `ColorResolver.js` utility
2. Add `normalizeColorValue()` function
3. Use it in new code paths
4. Existing code continues to work

### 6.2 Phase 2: Update Color Picker

1. ColorPicker returns new `ColorValue` format
2. Update `onChange` callbacks in FillSection, StrokeSection, etc.
3. Add "Unlink from Theme" UI

### 6.3 Phase 3: Update Renderers

1. Renderers use `ColorResolver.getDisplayColor()` 
2. Add CSS variable rendering for theme-linked colors
3. Theme updates work automatically

### 6.4 Phase 4: Enable Gradient Theme-Linking

1. Gradient stop picker uses ColorValue format
2. Gradient stops can now be theme-linked
3. Full feature parity across all color contexts

---

## 7. API Summary

### Creating Colors

```javascript
import { ColorResolver } from '../utils/ColorResolver.js';

// Custom color
const customRed = ColorResolver.createCustomColor('#FF0000', 100);

// Theme-linked color
const themeAccent = ColorResolver.createThemeColor(6, 100); // Slot 6 = midtone accent
```

### Reading Colors

```javascript
// Get the displayable hex (handles theme resolution)
const hex = ColorResolver.getDisplayColor(colorValue);

// Check if theme-linked
const isLinked = ColorResolver.isThemeLinked(colorValue);

// Get slot number if linked
const slot = colorValue.source?.themeSlot;
```

### Modifying Colors

```javascript
// Unlink from theme (keep current color)
const customized = ColorResolver.unlinkFromTheme(colorValue);

// Link to theme
const linked = ColorResolver.linkToTheme(colorValue, 3);
```

---

## 8. Benefits

1. **Clean Separation**: Elements don't know about themes
2. **Consistent API**: Same ColorValue everywhere (fills, strokes, text, gradients)
3. **Easy Testing**: Mock ColorResolver for unit tests
4. **Future Proof**: Easy to add new color sources (e.g., variables, expressions)
5. **Backward Compatible**: Legacy formats are normalized automatically
6. **Theme-Linked Gradients**: Gradients can now use theme colors
7. **Clear UI Pattern**: User always knows if color is custom or linked

---

## 9. Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/utils/ColorResolver.js` | Core color resolution logic |
| `styles/modules/_theme-linked.css` | CSS for theme-linked indicators |

### Modified Files
| File | Changes |
|------|---------|
| `src/ui/components/ColorPicker.js` | Return ColorValue format, add theme swatch grid |
| `src/ui/properties/FillSection.js` | Use ColorResolver, show theme-linked indicator |
| `src/ui/properties/StrokeSection.js` | Add theme linking UI, show indicator |
| `src/ui/components/ColorSwatch.js` | Add `.theme-linked` class support |
| `src/ui/panels/fill-picker/GradientEditor.js` | Theme-link gradient stops |
| `src/core/renderer/elements/ShapeElement.js` | Use ColorResolver.getDisplayColor() |
| `src/core/renderer/elements/TextElement.js` | Use ColorResolver.getDisplayColor() |

---

## 10. Implementation Checklist

### Phase 1: Foundation (Non-Breaking)

- [ ] **Create `src/utils/ColorResolver.js`**
  - [ ] `createCustomColor(hex, opacity)` function
  - [ ] `createThemeColor(slotIndex, opacity)` function
  - [ ] `resolveThemeSlot(slotIndex)` function (with dark mode support)
  - [ ] `getDisplayColor(colorValue)` function
  - [ ] `isThemeLinked(colorValue)` function
  - [ ] `unlinkFromTheme(colorValue)` function
  - [ ] `linkToTheme(colorValue, slotIndex)` function
  - [ ] `normalizeColorValue(input)` for backward compatibility
  - [ ] Export all functions

- [ ] **Write unit tests for ColorResolver**
  - [ ] Test createCustomColor creates proper structure
  - [ ] Test createThemeColor resolves current theme value
  - [ ] Test resolveThemeSlot with light mode
  - [ ] Test resolveThemeSlot with dark mode (slot mapping)
  - [ ] Test getDisplayColor for custom colors
  - [ ] Test getDisplayColor for theme-linked colors
  - [ ] Test unlinkFromTheme preserves hex
  - [ ] Test normalizeColorValue handles legacy formats

### Phase 2: Color Picker Updates

- [ ] **Update ColorPicker component**
  - [ ] Add theme swatch grid (6x2 layout)
  - [ ] Clicking theme swatch calls `onChange` with theme-linked ColorValue
  - [ ] Picking in HSB area calls `onChange` with custom ColorValue
  - [ ] Add "Linked to Slot N" indicator section
  - [ ] Add "Unlink" button that converts to custom
  - [ ] Ensure opacity changes don't affect link status

- [ ] **Create theme-linked CSS styles**
  - [ ] Add `.theme-linked` class to `styles/modules/_theme-linked.css`
  - [ ] 2px accent border for linked swatches
  - [ ] Optional slot number badge (data-slot attribute)
  - [ ] Hover states for both custom and linked

### Phase 3: Property Inspector Updates

- [ ] **Update FillSection**
  - [ ] Apply `.theme-linked` class to swatch when `ColorResolver.isThemeLinked()`
  - [ ] Set `data-slot` attribute for badge display
  - [ ] Handle ColorValue format from ColorPicker

- [ ] **Update StrokeSection**
  - [ ] Same theme-linked indicator as FillSection
  - [ ] Handle ColorValue format from ColorPicker

- [ ] **Update TextSection** (if separate)
  - [ ] Same theme-linked indicator
  - [ ] Handle ColorValue format

### Phase 4: Gradient Support

- [ ] **Update GradientEditor**
  - [ ] Gradient stops use ColorValue format
  - [ ] Stop color picker shows theme swatches
  - [ ] Stop handles show theme-linked indicator
  - [ ] Stop list shows theme-linked vs custom distinction
  - [ ] Mixed theme/custom stops work correctly

- [ ] **Update gradient rendering**
  - [ ] Resolve each stop color via ColorResolver
  - [ ] Handle opacity correctly per stop

### Phase 5: Renderer Updates

- [ ] **Update ShapeElement renderer**
  - [ ] Use `ColorResolver.getDisplayColor()` for fills
  - [ ] Use `ColorResolver.getDisplayColor()` for strokes
  - [ ] Optional: Use CSS variables for theme-linked colors

- [ ] **Update TextElement renderer**
  - [ ] Use `ColorResolver.getDisplayColor()` for text color
  - [ ] Optional: Use CSS variables for theme-linked colors

- [ ] **Update CSS variable system**
  - [ ] Ensure `--theme-slot-1` through `--theme-slot-12` are set on theme load
  - [ ] Update CSS variables when theme changes
  - [ ] Update CSS variables when color mode toggles

### Phase 6: Migration & Cleanup

- [ ] **Backward compatibility**
  - [ ] `normalizeColorValue()` handles old `{ hex, themeSlot }` format
  - [ ] `normalizeColorValue()` handles plain hex strings
  - [ ] `normalizeColorValue()` handles undefined/null gracefully

- [ ] **File format compatibility**
  - [ ] Saving uses new ColorValue format
  - [ ] Loading runs `normalizeColorValue()` on all colors
  - [ ] Test round-trip: save → load → verify colors

- [ ] **Documentation**
  - [ ] Update any existing color-related docs
  - [ ] Document ColorResolver API
  - [ ] Add migration notes for developers

---

## 11. Testing Strategy

### Unit Tests

```javascript
// ColorResolver.test.js
describe('ColorResolver', () => {
  describe('createCustomColor', () => {
    it('creates a custom color with default opacity', () => {
      const color = ColorResolver.createCustomColor('#FF5733');
      expect(color).toEqual({
        hex: '#FF5733',
        opacity: 100,
        source: { type: 'custom' }
      });
    });
  });

  describe('isThemeLinked', () => {
    it('returns true for theme-linked colors', () => {
      const color = { hex: '#123', source: { type: 'theme', themeSlot: 5 } };
      expect(ColorResolver.isThemeLinked(color)).toBe(true);
    });

    it('returns false for custom colors', () => {
      const color = { hex: '#123', source: { type: 'custom' } };
      expect(ColorResolver.isThemeLinked(color)).toBe(false);
    });
  });
});
```

### Integration Tests

1. **Color Picker → Fill → Render flow**
   - Pick custom color → verify element renders with that color
   - Pick theme slot → verify element renders with theme color
   - Change theme → verify only theme-linked colors update

2. **Gradient theme-linking**
   - Create gradient with mixed stops
   - Change theme → verify only linked stops update
   - Unlink a stop → verify it no longer updates

3. **Dark mode**
   - Create theme-linked color in light mode
   - Toggle to dark mode
   - Verify color shows correct mapped slot

### Visual Tests

- Screenshot comparison of theme-linked vs custom swatches
- Screenshot comparison of gradient with mixed stops
- Screenshot comparison before/after theme change

---

## 12. Edge Cases & Design Decisions

### Q: What happens when a theme-linked color's slot is deleted?

**Decision:** Slots can't be deleted. The 12-slot system is fixed. If a theme has fewer than 12 colors defined, missing slots should fall back to black `#000000`.

### Q: What if user pastes a hex value into the hex input?

**Decision:** Typing/pasting a hex value creates a **custom** color. This automatically unlinks if the color was previously theme-linked. The user consciously chose a specific color.

### Q: What if user adjusts opacity on a theme-linked color?

**Decision:** Adjusting opacity **does not** unlink the color. The color remains theme-linked, just with a different opacity. This is intentional because opacity is a separate concern from the base color.

### Q: Can the same element have some fills custom and some theme-linked?

**Decision:** **Yes.** Each fill is independent. An element with 3 fills could have:
- Fill 1: Custom `#FF0000`
- Fill 2: Theme-linked to Slot 3
- Fill 3: Theme-linked to Slot 8

### Q: How do copy/paste handle theme-linked colors?

**Decision:** Colors are copied **with their source information**. Pasting preserves the theme linking. If you copy a theme-linked element and paste it, the pasted element is also theme-linked.

### Q: What about eyedropper/color picking from canvas?

**Decision:** The eyedropper always creates a **custom** color. It picks the visual color value (hex) without any source information, because you're sampling a pixel, not a semantic slot.

### Q: Should there be a "Link all colors to theme" button?

**Decision:** Not in v1. This could be a future feature, but it's complex - which slot should each color link to? We'd need some kind of color matching algorithm.

### Q: What happens in presentation mode?

**Decision:** Presentation mode renders the resolved `hex` values. Theme-linked colors are resolved at render time. If the presentation uses a theme, all theme-linked colors will show the presentation's theme colors.

---

## 13. Future Considerations

### Additional Color Sources (v2+)

The architecture is designed to support additional source types:

```typescript
interface ColorSource {
  type: 'custom' | 'theme' | 'variable' | 'computed';
  
  // For theme
  themeSlot?: number;
  
  // For variable (future)
  variableName?: string;
  
  // For computed (future)  
  expression?: string;
}
```

### Global Color Variables (v2+)

Users could define named colors that can be referenced across slides:

```javascript
{
  hex: '#3B82F6',
  source: { type: 'variable', variableName: 'brand-primary' }
}
```

### Dynamic Colors (v2+)

Colors that compute based on context:

```javascript
{
  hex: '#FFFFFF', // Resolved value
  source: { 
    type: 'computed', 
    expression: 'contrast(parent.backgroundColor)' 
  }
}
```

These are all future enhancements. The current architecture supports them without breaking changes.
