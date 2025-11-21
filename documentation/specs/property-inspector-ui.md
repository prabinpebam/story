# Property Inspector UI Specification

## Overview
This document outlines the visual design and functional specifications for the redesigned Property Inspector (Right Sidebar). The design aims to replicate a professional, high-density design tool interface, focusing on efficiency, clarity, and space optimization.

**Key Constraint:** This redesign must coexist with the existing application design system. It should use existing CSS variables where possible and define scoped overrides only where necessary to achieve the specific "high-density" look without affecting other components.

## Visual Style & Token Mapping
The UI relies on the existing `styles/main.css` variables, with specific overrides for the Property Inspector context.

- **Theme**: Dark Mode (Default for this panel).
- **Density**: High. Compact spacing.
- **Typography**:
    - **Labels**: `11px` (Use `--font-size-sm`). Color: `--color-text-secondary` (`#AAAAAA` / `#B3B3B3`).
    - **Values**: `12px` (Use `--font-size-md`). Color: `--color-text-primary` (`#FFFFFF`).
    - **Headers**: `13px` (Bold `600`). Color: `--color-text-primary`.
- **Colors**:
    - **Panel Background**: `--color-bg-panel` (`#2C2C2C`).
    - **Input Background**: Custom override `--prop-bg-input` (`#383838`) - *Lighter than global input to stand out on dark panel*.
    - **Borders**: `--color-border` (`#444444`).
    - **Accent**: `--color-accent` (`#18A0FB`).

## Layout Structure
The Property Inspector is divided into vertical sections.

### 1. Header (Global)
- **Tabs**: "Design" (Active), "Prototype" (Inactive).
- **Height**: `--header-height` (`40px`).
- **Border**: Bottom border using `--color-border`.

### 2. Position & Alignment
**Layout**: Grid / Flex row.
- **Alignment Controls**:
    - Icons: Align Left, Center, Right, Top, Middle, Bottom.
    - Style: Ghost buttons (Transparent bg, `--color-bg-hover` on hover).
- **Coordinates**:
    - **X / Y**: Inputs with prefix labels.
    - **Width**: 50% each.
- **Transform**:
    - **Rotation**: Input with icon.
    - **Flip**: Horizontal/Vertical toggle icons.

### 3. Layout (Dimensions)
**Layout**: 2 columns.
- **W / H**: Inputs with prefix labels.
- **Constrain**: Link icon button (Toggle state).
- **Resizing**: Dropdown (Fixed, Hug, Fill) - *If applicable to selection*.

### 4. Appearance
**Layout**: 2 columns.
- **Opacity**: Input (0-100%).
- **Corner Radius**: Input with icon.
- **Blend Mode**: Dropdown (Normal, Multiply, Overlay, etc.).

### 5. Fill
**Header**: "Fill" + "+" (Add).
**List Item**:
- **Preview**: Color swatch (Click opens [Color Picker](./color-picker-ui.md)).
- **Value**: Hex/Variable input.
- **Opacity**: % input.
- **Visibility**: Eye toggle.
- **Remove**: Minus button.

### 6. Stroke
**Header**: "Stroke" + "+" (Add).
**List Item**:
- **Color Row**: Swatch, Value, Opacity, Eye, Remove.
- **Properties Row**:
    - **Position**: Dropdown (Inside/Center/Outside).
    - **Weight**: Input (px).
    - **Advanced**: Settings icon (Dashes, Caps).

### 7. Effects
**Header**: "Effects" + "+" (Add) Icon + "Grid" (Style) Icon.
**Behavior**: Supports multiple effects. Clicking the effect icon (left) opens the detailed Flyout.

**List Item (Per Effect)**:
- **Layout**: Flex Row.
- **Icon**: Effect-specific icon (e.g., Drop Shadow box, Blur grid) on the left. Clicking toggles the Flyout.
- **Type**: Dropdown (Drop shadow, Inner shadow, Layer blur, Background blur).
- **Visibility**: Eye icon toggle.
- **Remove**: Minus (`-`) icon button.

**Effect Flyout (Detail Panel)**:
A popover panel that appears when an effect is configured. The content varies by effect type.

**Common Header**:
- **Type**: Dropdown (Same as list item).
- **Blend Mode**: Water drop icon (Visible for Shadows).
- **Close**: "X" icon to close the flyout.

**Content: Drop Shadow / Inner Shadow**:
- **Position**:
    - Label: "Position".
    - Inputs: "X" value, "Y" value.
- **Blur**:
    - Label: "Blur".
    - Input: Icon (Grid dots) + Value.
- **Spread**:
    - Label: "Spread".
    - Input: Icon (Sun/Spread) + Value.
- **Color**:
    - Label: "Color".
    - Controls: Color Swatch, Hex Code, Opacity %.

**Content: Layer Blur / Background Blur**:
- **Mode**: Segmented Control (Toggle).
    - Options: "Uniform", "Progressive".
- **Blur**:
    - Label: "Blur".
    - Input: Icon (Grid dots) + Value.

### 8. Export
**Header**: "Export" + "+" (Add).
**Content**: Export settings list.

## Implementation Strategy & Scoped Variables

To maintain system integrity, these styles should be scoped to a `.property-inspector` class. This ensures the rest of the app (Canvas, Toolbar, Left Sidebar) remains unaffected.

### Scoped CSS Variables
Add these to `styles/main.css` inside a `.property-inspector` block or a specific theme section.

```css
.property-inspector {
    /* Overrides for High-Density Panel */
    --prop-bg-input: #383838;       /* Lighter input for contrast */
    --prop-bg-input-hover: #444444;
    --prop-text-label: #B3B3B3;     /* Muted label */
    --prop-border-radius: 2px;      /* Sharper corners for pro feel */
    
    /* Spacing Overrides */
    --row-height: 32px;
    --input-height: 28px;
    --spacing-row: 8px;
}
```

### Component Specifications

#### Input Fields (Scoped)
- **Selector**: `.property-inspector input`
- **Background**: `var(--prop-bg-input)`
- **Height**: `var(--input-height)`
- **Border**: `1px solid transparent` (Default), `1px solid var(--color-border-focus)` (Focus).
- **Radius**: `var(--prop-border-radius)`.

#### Dropdowns (Scoped)
- **Selector**: `.property-inspector select` / `.dropdown-trigger`
- **Background**: `var(--prop-bg-input)`
- **Height**: `var(--input-height)`.

#### Section Headers
- **Height**: `32px` (Compact).
- **Font Size**: `13px` (`--font-size-md` + 1px or bold).
- **Divider**: `1px solid var(--color-border)`.

