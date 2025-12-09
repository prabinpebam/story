# Property Inspector - Comprehensive Specification v2.0

> **Document Version:** 2.0  
> **Last Updated:** 2025  
> **Status:** Active Development  
> **Supersedes:** property-inspector/ (legacy specs)

---

## Executive Summary

The Property Inspector (PI) is the primary interface for viewing and modifying properties of selected elements in the Story presentation editor. Located in the right sidebar, it dynamically adapts its content based on the current selection context, displaying relevant controls for shapes, text, images, slides, and master layouts.

This specification consolidates and supersedes all previous Property Inspector documentation, providing a complete reference for implementation and future development.

---

## Table of Contents

| Document | Description |
|----------|-------------|
| [00-overview.md](./00-overview.md) | This document - Architecture and general principles |
| [01-architecture.md](./01-architecture.md) | Component structure, state management, rendering |
| [02-position-section.md](./02-position-section.md) | Alignment, coordinates, rotation, transforms |
| [03-layout-section.md](./03-layout-section.md) | Dimensions, constraints, text resizing modes |
| [04-appearance-section.md](./04-appearance-section.md) | Opacity, blend modes, corner radius (unified & per-corner), visibility |
| [05-fill-section.md](./05-fill-section.md) | Fill types, color picker, gradients, images, code fills |
| [06-stroke-section.md](./06-stroke-section.md) | Stroke properties, settings flyout, per-side strokes |
| [07-effects-section.md](./07-effects-section.md) | Drop shadow, blur, background blur |
| [08-typography-section.md](./08-typography-section.md) | Font, spacing, alignment, text styles |
| [09-export-section.md](./09-export-section.md) | Export presets, formats, scales |
| [10-slide-section.md](./10-slide-section.md) | Layout picker, theme, background, master properties |
| [11-placeholder-section.md](./11-placeholder-section.md) | Placeholder types, drag-to-canvas, master layout editing |
| [12-interactions.md](./12-interactions.md) | Input behaviors, keyboard shortcuts, scrubbing |
| [13-gaps-and-roadmap.md](./13-gaps-and-roadmap.md) | Current gaps, risks, and future improvements |
| [14-visual-design.md](./14-visual-design.md) | Layout specifications, colors, typography |
| [15-glossary.md](./15-glossary.md) | Terminology and definitions |

---

## Core Principles

### 1. Single Source of Truth (Store Synchronization)
> **CRITICAL:** The Property Inspector and Viewport MUST always display consistent state.

- **Store is the only source of truth** - Both PI and Viewport read from and write to the Store
- **No local state caching** - PI sections never cache element properties locally
- **All changes go through Store** - Even transient updates during scrubbing dispatch to Store
- **Bidirectional sync is automatic** - Store emits `state-changed`, both views re-render
- **See [01-architecture.md](./01-architecture.md) Section 2.4** for complete synchronization specification

### 2. Context-Sensitive Display
The PI intelligently shows/hides sections based on:
- **Element selection**: Show relevant properties for the selected element type
- **Editor mode**: Different display for Slide mode vs. Master mode
- **Selection count**: Single selection shows full properties; multi-selection shows common properties

### 3. Non-Destructive Editing
- All property changes are applied in real-time to the canvas
- Transient changes (scrubbing) don't create history entries until committed
- Users can undo/redo any property modification

### 4. High-Density Professional Interface
- Compact 28px row height for maximum information density
- Subtle visual hierarchy with 11px labels and 12px values
- Dark theme optimized for extended design work sessions

### 5. Consistent Interaction Patterns
- All numeric inputs support keyboard increment (Arrow keys, Shift+Arrow)
- Labels are scrubbable (drag to adjust values)
- Color swatches trigger flyout pickers
- Sections are collapsible with persistent state

---

## Design System Integration

### Component Library Compliance

> **CRITICAL:** The Property Inspector uses **centralized components** from the design system. Do not create duplicate or one-off component implementations.

| Component | Usage in PI | Source |
|-----------|-------------|--------|
| `Section` | Collapsible section containers | `src/ui/components/Section.js` |
| `NumberInput` | All numeric inputs (X, Y, W, H, Opacity, etc.) | `src/ui/components/NumberInput.js` |
| `Button` | All buttons (icon-only and labeled) | `src/ui/components/Button.js` |
| `Dropdown` | All select menus | `src/ui/components/Dropdown.js` |
| `ColorInput` | All color pickers | `src/ui/components/ColorInput.js` |
| `SliderControl` | Opacity, blur radius sliders | `src/ui/components/SliderControl.js` |
| `SegmentedControl` | Alignment buttons, toggle groups | `src/ui/components/SegmentedControl.js` |
| `Flyout` | Color picker, stroke settings, effect settings | `src/ui/components/Flyout.js` |

### Do Not Create

❌ Custom icon buttons → Use `Button` with `icon` and `size: 'xs'`
❌ Custom scrubbing inputs → Use `NumberInput` with `scrubbable: true`
❌ Custom toggle buttons → Use `Button` with `active` state
❌ Custom color swatches → Use `ColorInput` component

### Design Token Compliance

All styles MUST use design tokens from `styles/modules/variables.css`:

```css
/* ✅ CORRECT */
.pi-row {
    gap: var(--spacing-2);
    height: var(--input-height-md);
}

/* ❌ WRONG - Magic numbers */
.pi-row {
    gap: 8px;
    height: 28px;
}
```

See [01-architecture.md](./01-architecture.md) Section 3 for complete component API reference.

---

## Current Implementation Status

### ✅ Fully Implemented Sections

| Section | File | Key Features |
|---------|------|--------------|
| Position | `PositionSection.js` | Alignment, X/Y, rotation, flip |
| Layout | `LayoutSection.js` | W/H, constrain proportions, text resize modes |
| Appearance | `AppearanceSection.js` | Opacity, blend mode, corner radius |
| Fill | `FillSection.js` | Multiple fills, solid/gradient/image/video/code |
| Stroke | `StrokeSection.js` | Multiple strokes, color, weight, position, settings |
| Effects | `EffectsSection.js` | Drop shadow, layer blur, background blur |
| Typography | `TextSection.js` | Font, size, spacing, alignment, text styles |
| Export | `ExportSection.js` | Scale, format, suffix presets |
| Slide | `SlideSection.js` | Layout picker, theme colors, typography |
| Placeholder | `PlaceholderSection.js` | Placeholder palette for master layouts |

### 📊 Implementation Statistics

| Metric | Count |
|--------|-------|
| Total Lines of Code | ~4,500 |
| Section Components | 10 |
| UI Components Used | 15+ |
| Test Coverage | ~85% |

---

## Section Visibility Matrix

| Section | Shape | Text | Image | Group | Slide | Master |
|---------|-------|------|-------|-------|-------|--------|
| Position | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Layout | ✅ | ✅* | ✅ | ✅ | ✅** | ✅** |
| Appearance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Typography | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fill | ✅ | ❌*** | ✅ | ✅ | ✅ | ✅ |
| Stroke | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Effects | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Placeholders | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Notes:**
- \* Text has additional layout mode buttons (Auto Size, Fixed Width, Fixed Size)
- \** Slide/Master shows dimensions in a different context (canvas size)
- \*** Text has fill control in Typography section (single fill only)

---

## Component Hierarchy

```
PropertyInspector
├── Header (Dynamic Title)
│   └── Shows: Element name / "X Objects" / "Slide" / "Master"
│
├── PositionSection
│   ├── AlignmentRow (6 buttons)
│   ├── CoordinatesRow (X, Y inputs)
│   └── TransformRow (Rotation, Flip buttons)
│
├── LayoutSection
│   ├── LayoutModeRow (Text only: Auto/FixedWidth/Fixed)
│   └── DimensionsRow (W, H, Constrain toggle)
│
├── AppearanceSection
│   ├── OpacityRow (Opacity input, Blend mode dropdown)
│   └── RadiusRow (Corner radius input)
│
├── TextSection (Text elements only)
│   ├── StyleRow (Style dropdown, Style menu)
│   ├── FontRow (Family, Weight, Size)
│   ├── FillRow (Color swatch, Hex input)
│   ├── SpacingRow (Line Height, Letter Spacing)
│   └── AlignmentRow (H-Align, V-Align, Settings)
│
├── FillSection (Hidden for Text)
│   ├── FillList (Multiple fills)
│   │   └── FillRow (Swatch, Hex, Opacity, Visibility, Remove)
│   └── InheritedFillRow (For slides with inherited background)
│
├── StrokeSection
│   ├── StrokeList (Multiple strokes)
│   │   └── StrokeRow (Swatch, Hex, Opacity, Width, Position, Settings)
│   └── StrokeSettingsFlyout
│
├── EffectsSection
│   ├── EffectList
│   │   └── EffectRow (Icon, Name, Visibility, Remove)
│   └── EffectFlyout (Shadow/Blur settings)
│
├── ExportSection (Collapsed by default)
│   ├── PresetList
│   │   └── PresetRow (Scale, Suffix, Format, Remove)
│   └── ExportButton
│
└── SlideSection (No selection)
    ├── NameRow (Master mode only)
    ├── LayoutSection (Layout picker, Dimensions)
    ├── ThemeSection (Colors, Typography)
    └── FillSection (Background)
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Vanilla JavaScript ES6+ |
| State Management | Custom Store (Observer pattern) |
| Styling | CSS Variables + BEM-like classes |
| Testing | Vitest + JSDOM |
| Build | Vite |

---

## Related Documentation

- [Design System Overview](../design-system-overview.md)
- [Design Tokens Reference](../design-tokens-reference.md)
- [Interaction Patterns](../interaction-patterns.md)
- [Component Library](../component-library.md)

---

## Property Persistence Behavior

### Session Persistence
The Property Inspector maintains several types of state persistence:

| State Type | Persistence | Location |
|------------|-------------|----------|
| Section collapse state | Session | Memory (PropertyInspector) |
| Scroll position | Selection-based | Resets on selection change |
| Last used fill color | Session | FillSection memory |
| Last used stroke settings | Session | StrokeSection memory |
| Flyout open state | Transient | Closes on selection change |

### Property Memory System
When creating new fills, strokes, or effects, the PI remembers last-used settings:

```javascript
// Example: Property memory for fills
lastFillSettings = {
  type: 'solid',
  color: '#4dabf7',
  opacity: 100
};
// Applied to next "Add Fill" action
```

### Cross-Selection Persistence
When switching between selections:
1. **Scroll position** - Resets to top
2. **Open flyouts** - Auto-close
3. **Input focus** - Releases to document
4. **Pending edits** - Committed or discarded

---

## Scroll Behavior

### Default Behavior
- Panel scrolls vertically when content exceeds viewport
- Scroll position resets on selection change
- Smooth scroll when programmatically navigating

### Scroll Anchoring
When sections expand/collapse:
- Content above cursor anchors in place
- Content below shifts accordingly
- No jarring scroll jumps

### Section Auto-Scroll
When opening a section flyout:
- Panel scrolls to ensure flyout is visible
- Maintains 16px padding from viewport edge

---

## Empty States

### No Selection
```
┌─────────────────────────────────┐
│ No Selection                    │
├─────────────────────────────────┤
│                                 │
│         [    🎯    ]            │
│                                 │
│    Select an element on the    │
│    canvas to view and edit     │
│    its properties               │
│                                 │
└─────────────────────────────────┘
```

### No Elements on Canvas (Slide Mode)
- Shows SlideSection for slide properties
- Other sections hidden

### Empty Section
When a section exists but has no items (e.g., no fills):
```
┌─────────────────────────────────┐
│ ▼ Fill                    [+]   │
├─────────────────────────────────┤
│    Click + to add a fill       │
└─────────────────────────────────┘
```

---

## Accessibility Overview

### Screen Reader Support
| Feature | Implementation |
|---------|----------------|
| Panel role | `role="region"` with `aria-label="Property Inspector"` |
| Section headers | `role="button"` with `aria-expanded` |
| Input labels | Associated via `aria-labelledby` |
| Live updates | `aria-live="polite"` for value changes |

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Move between controls |
| Enter/Space | Activate buttons, open flyouts |
| Arrow Keys | Adjust values in inputs |
| Escape | Close flyouts, cancel edits |

See [11-interactions.md](./11-interactions.md) for complete keyboard reference.

---

## Error Handling Overview

### Input Validation
- Invalid values show error border (red)
- Values outside range are clamped
- Malformed inputs revert to previous value

### Recovery Patterns
| Error Type | Handling |
|------------|----------|
| Invalid number | Revert to last valid |
| Out of range | Clamp to min/max |
| Font not loaded | Show placeholder, retry |
| Image load failure | Show broken image icon |

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 2.0.1 | 2025 | Added persistence, scroll, empty states, accessibility |
| 2.0 | 2025 | Comprehensive consolidation of all PI specs |
| 1.x | 2024 | Original individual section specs |

