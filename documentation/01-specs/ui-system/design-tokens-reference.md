# Design Tokens Reference

> **Complete reference of all design tokens in the Story Design System**

## Table of Contents

1. [Overview](#1-overview)
2. [Color Tokens](#2-color-tokens)
3. [Typography Tokens](#3-typography-tokens)
4. [Spacing Tokens](#4-spacing-tokens)
5. [Size Tokens](#5-size-tokens)
6. [Border & Radius Tokens](#6-border--radius-tokens)
7. [Shadow Tokens](#7-shadow-tokens)
8. [Animation Tokens](#8-animation-tokens)
9. [Z-Index Tokens](#9-z-index-tokens)
10. [Cursor Tokens](#10-cursor-tokens)
11. [Component Tokens](#11-component-tokens)
12. [Legacy Aliases](#12-legacy-aliases)

---

## 1. Overview

### 1.1 Token File Location

All design tokens are defined in:
```
styles/modules/variables.css
```

This is the **single source of truth** for all design values.

### 1.2 Token Naming Convention

```
--{category}-{property}-{variant}

Examples:
--color-bg-app
--font-size-md
--spacing-4
--radius-lg
```

### 1.3 Usage in CSS

```css
.component {
    background: var(--color-bg-panel);
    padding: var(--spacing-3);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
}
```

### 1.4 Usage in JavaScript

```javascript
// Get computed value
const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent');

// Use in inline styles (prefer CSS classes)
element.style.background = 'var(--color-bg-panel)';
```

---

## 2. Color Tokens

### 2.1 Background Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-bg-app` | `#1E1E1E` | `#E8E8E8` | Main application background |
| `--color-bg-canvas` | `#252526` | `#FFFFFF` | Canvas/viewport background |
| `--color-bg-panel` | `#2D2D2D` | `#F5F5F5` | Sidebars, floating panels |
| `--color-bg-elevated` | `#333333` | `#FFFFFF` | Modals, popovers |
| `--color-bg-input` | `#383838` | `#FFFFFF` | Input fields, wells |
| `--color-bg-hover` | `var(--color-accent-subtle)` | `var(--color-accent-subtle)` | Hover states |
| `--color-bg-active` | `var(--color-accent-muted)` | `var(--color-accent-muted)` | Active/pressed states |
| `--color-bg-selected` | `#1E3A5F` | `#E6F4FF` | Selected items background |

### 2.2 Surface Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-surface-primary` | `#2D2D2D` | `#F5F5F5` | Primary surfaces |
| `--color-surface-secondary` | `#363636` | `#EFEFEF` | Secondary surfaces |
| `--color-surface-tertiary` | `#3D3D3D` | `#E8E8E8` | Tertiary surfaces |

### 2.3 Text Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-text-primary` | `#E8E8E8` | `#1A1A1A` | Main text, headings |
| `--color-text-secondary` | `#A0A0A0` | `#666666` | Labels, captions |
| `--color-text-tertiary` | `#707070` | `#999999` | Hints, placeholders |
| `--color-text-disabled` | `#505050` | `#BBBBBB` | Disabled text |
| `--color-text-inverse` | `#1E1E1E` | `#FFFFFF` | Text on light/accent |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent buttons |

### 2.4 Border Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-border` | `#404040` | `#DDDDDD` | Default borders |
| `--color-border-subtle` | `#353535` | `#E8E8E8` | Subtle dividers |
| `--color-border-strong` | `#505050` | `#CCCCCC` | Emphasized borders |
| `--color-border-hover` | `#555555` | `#BBBBBB` | Border on hover |
| `--color-border-focus` | `#18A0FB` | `#18A0FB` | Focus rings |

### 2.5 Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#18A0FB` | Primary accent (Figma Blue) |
| `--color-accent-hover` | `#3DB8FF` | Accent hover state |
| `--color-accent-active` | `#0D86D7` | Accent active state |
| `--color-accent-subtle` | `rgba(24, 160, 251, 0.20)` | Hover backgrounds (20%) |
| `--color-accent-muted` | `rgba(24, 160, 251, 0.35)` | Active backgrounds (35%) |

### 2.6 Semantic/Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#1BC47D` | Success, positive actions |
| `--color-success-subtle` | `rgba(27, 196, 125, 0.15)` | Success background |
| `--color-warning` | `#FFBE0B` | Warnings, caution |
| `--color-warning-subtle` | `rgba(255, 190, 11, 0.15)` | Warning background |
| `--color-danger` | `#F24822` | Errors, destructive |
| `--color-danger-subtle` | `rgba(242, 72, 34, 0.15)` | Danger background |
| `--color-info` | `#18A0FB` | Informational |
| `--color-info-subtle` | `rgba(24, 160, 251, 0.15)` | Info background |

### 2.7 Interactive State Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-interactive-hover` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.05)` | Generic hover overlay |
| `--color-interactive-active` | `rgba(255, 255, 255, 0.12)` | `rgba(0, 0, 0, 0.08)` | Generic active overlay |
| `--color-interactive-selected` | `rgba(24, 160, 251, 0.20)` | `rgba(24, 160, 251, 0.15)` | Selected state |

### 2.8 Shadow & Overlay Colors

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-shadow` | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.12)` | Shadow base |
| `--color-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.3)` | Semi-transparent overlay |
| `--color-backdrop` | `rgba(0, 0, 0, 0.6)` | `rgba(0, 0, 0, 0.4)` | Modal backdrop |

### 2.9 Special Purpose Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-grid-dot` | `rgba(255, 255, 255, 0.08)` | Canvas grid dots |
| `--color-selection-fill` | `rgba(24, 160, 251, 0.3)` | Selection marquee fill |
| `--color-drag-indicator` | `#18A0FB` | Drag and drop indicator |

### 2.10 Alternative Theme Accent Colors

| Theme | Accent | Hover | Active |
|-------|--------|-------|--------|
| **Default** | `#18A0FB` | `#3DB8FF` | `#0D86D7` |
| **Purple** | `#7C3AED` | `#8B5CF6` | `#6D28D9` |
| **Teal** | `#14B8A6` | `#2DD4BF` | `#0D9488` |
| **Orange** | `#F97316` | `#FB923C` | `#EA580C` |
| **Pink** | `#EC4899` | `#F472B6` | `#DB2777` |

---

## 3. Typography Tokens

### 3.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-ui` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | UI text |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace` | Code, values |

### 3.2 Font Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-2xs` | `9px` | Micro labels |
| `--font-size-xs` | `10px` | Small labels, badges |
| `--font-size-sm` | `11px` | Property labels, secondary text |
| `--font-size-md` | `12px` | Body text, input values |
| `--font-size-lg` | `13px` | Section headers |
| `--font-size-xl` | `14px` | Panel titles |
| `--font-size-2xl` | `16px` | Modal headers |
| `--font-size-3xl` | `20px` | Large headers |
| `--font-size-4xl` | `24px` | Display text |
| `--font-size-5xl` | `32px` | Hero text |
| `--font-size-6xl` | `48px` | Jumbo text |

### 3.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-regular` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, emphasis |
| `--font-weight-semibold` | `600` | Headers, buttons |
| `--font-weight-bold` | `700` | Strong emphasis |
| `--font-weight-black` | `900` | Maximum emphasis |

### 3.4 Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--line-height-tight` | `1.2` | Headings, compact text |
| `--line-height-normal` | `1.4` | Body text |
| `--line-height-relaxed` | `1.6` | Long-form content |

### 3.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--letter-spacing-tight` | `-0.02em` | Headlines |
| `--letter-spacing-normal` | `0` | Body text |
| `--letter-spacing-wide` | `0.02em` | Small caps |
| `--letter-spacing-wider` | `0.05em` | All caps labels |

---

## 4. Spacing Tokens

Based on a **4px grid**:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-0` | `0` | Reset |
| `--spacing-0-5` | `2px` | Half step, fine adjustments |
| `--spacing-1` | `4px` | Tight gaps, inline spacing |
| `--spacing-1-5` | `6px` | 1.5 step |
| `--spacing-2` | `8px` | Standard gaps, input padding |
| `--spacing-2-5` | `10px` | 2.5 step |
| `--spacing-3` | `12px` | Section padding |
| `--spacing-4` | `16px` | Component padding |
| `--spacing-5` | `20px` | Large gaps |
| `--spacing-6` | `24px` | Panel padding |
| `--spacing-8` | `32px` | Section margins |
| `--spacing-10` | `40px` | Hero spacing |
| `--spacing-12` | `48px` | Maximum spacing |

### Spacing Visual Scale

```
0    0.5   1    1.5   2    2.5   3    4    5    6    8    10   12
|    |     |    |     |    |     |    |    |    |    |    |    |
0px  2px   4px  6px   8px  10px  12px 16px 20px 24px 32px 40px 48px
```

---

## 5. Size Tokens

### 5.1 Control Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--control-size-xs` | `20px` | Micro controls |
| `--control-size-sm` | `24px` | Compact controls |
| `--control-size-md` | `28px` | Default controls |
| `--control-size-lg` | `32px` | Comfortable controls |
| `--control-size-xl` | `40px` | Large controls, toolbar |
| `--control-size-2xl` | `48px` | Extra large, primary actions |

### 5.2 Icon Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--icon-size-xs` | `12px` | Micro icons, indicators |
| `--icon-size-sm` | `14px` | Small inline icons |
| `--icon-size-md` | `16px` | Default icon size |
| `--icon-size-lg` | `20px` | Emphasized icons |
| `--icon-size-xl` | `24px` | Large icons, buttons |
| `--icon-size-2xl` | `32px` | Hero icons, empty states |

### 5.3 Swatch Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--swatch-size-xs` | `12px` | Micro swatches, inline indicators |
| `--swatch-size-sm` | `14px` | Small swatches in compact inputs |
| `--swatch-size-md` | `16px` | Default swatch size |
| `--swatch-size-lg` | `20px` | Comfortable swatches |
| `--swatch-size-xl` | `24px` | Large theme swatches |
| `--swatch-size-2xl` | `40px` | Hero swatches, theme cards |

### 5.4 Thumbnail Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--thumbnail-xs` | `32px` | Tiny thumbnails |
| `--thumbnail-sm` | `48px` | Small thumbnails |
| `--thumbnail-md` | `64px` | Medium thumbnails |
| `--thumbnail-lg` | `80px` | Large thumbnails |
| `--thumbnail-xl` | `120px` | Extra large thumbnails |

### 5.5 Input Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--input-height-sm` | `24px` | Compact inputs, inline controls |
| `--input-height-md` | `28px` | Default input height |
| `--input-height-lg` | `32px` | Large inputs, form controls |

### 5.6 Input Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--input-width-xs` | `40px` | Tiny inputs (opacity) |
| `--input-width-sm` | `60px` | Small inputs (percentages) |
| `--input-width-md` | `80px` | Default inputs |
| `--input-width-lg` | `120px` | Wide inputs |
| `--input-width-xl` | `160px` | Extra wide inputs |

### 5.7 Panel Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--panel-width-sm` | `200px` | Narrow panels |
| `--panel-width-md` | `240px` | Default panel width |
| `--panel-width-lg` | `280px` | Wide panels |
| `--panel-width-xl` | `320px` | Extra wide panels |
| `--panel-width-2xl` | `400px` | Maximum panel width |

### 5.8 Flyout Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--flyout-width-sm` | `200px` | Compact flyouts |
| `--flyout-width-md` | `280px` | Default flyout width |
| `--flyout-width-lg` | `340px` | Wide flyouts |
| `--flyout-width-xl` | `400px` | Extra wide flyouts |

### 5.9 Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | `240px` | Standard panel width |
| `--header-height` | `40px` | Top header bar |
| `--toolbar-height` | `48px` | Main toolbar |
| `--panel-min-width` | `200px` | Minimum panel width |
| `--panel-max-width` | `400px` | Maximum panel width |

---

## 6. Border & Radius Tokens

### 6.1 Border Widths

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-0` | `0` | No border |
| `--border-width-1` | `1px` | Default borders |
| `--border-width-2` | `2px` | Focus rings, emphasis |
| `--border-width-4` | `4px` | Heavy emphasis |

### 6.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `2px` | Subtle rounding |
| `--radius-sm` | `4px` | Inputs, buttons |
| `--radius-md` | `6px` | Cards, dropdowns |
| `--radius-lg` | `8px` | Panels, modals |
| `--radius-xl` | `12px` | Large elements |
| `--radius-2xl` | `16px` | Hero elements |
| `--radius-full` | `9999px` | Circles, pills |

### Radius Visual Scale

```
xs     sm     md     lg     xl     2xl    full
┌─┐    ┌─┐    ┌─┐    ┌──┐   ┌──┐   ┌───┐  ⬤
└─┘    └─┘    └─┘    └──┘   └──┘   └───┘
2px    4px    6px    8px    12px   16px   ∞
```

---

## 7. Shadow Tokens

### 7.1 Shadow Scale

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.15)` | Same | Minimal elevation |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.3)` | `...0.08` | Slight elevation |
| `--shadow-md` | `0 4px 8px rgba(0, 0, 0, 0.3)` | `...0.10` | Medium elevation |
| `--shadow-lg` | `0 8px 16px rgba(0, 0, 0, 0.3)` | `...0.12` | High elevation |
| `--shadow-xl` | `0 12px 24px rgba(0, 0, 0, 0.4)` | `...0.15` | Very high elevation |
| `--shadow-2xl` | `0 20px 40px rgba(0, 0, 0, 0.5)` | `...0.18` | Maximum elevation |
| `--shadow-floating` | `0 4px 24px rgba(0, 0, 0, 0.35)` | `...0.12` | Floating panels |

### 7.2 Shadow Usage Guide

| Element Type | Recommended Shadow |
|--------------|-------------------|
| Buttons (hover) | `--shadow-xs` |
| Cards | `--shadow-sm` |
| Dropdowns | `--shadow-md` |
| Popovers | `--shadow-lg` |
| Modals | `--shadow-xl` |
| Floating panels | `--shadow-floating` |

---

## 8. Animation Tokens

### 8.1 Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `0ms` | Immediate |
| `--duration-fast` | `100ms` | Micro-interactions |
| `--duration-normal` | `150ms` | Standard transitions |
| `--duration-moderate` | `200ms` | Medium animations |
| `--duration-slow` | `250ms` | Panel slides |
| `--duration-slower` | `300ms` | Complex animations |
| `--duration-slowest` | `400ms` | Major transitions |

### 8.2 Easing Functions

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-linear` | `linear` | Constant speed |
| `--ease-in` | `ease-in` | Acceleration |
| `--ease-out` | `ease-out` | Deceleration |
| `--ease-in-out` | `ease-in-out` | Acceleration then deceleration |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring/bounce |

### 8.3 Transition Presets

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `100ms ease-out` | Hover states |
| `--transition-normal` | `150ms ease-out` | Standard transitions |
| `--transition-slow` | `250ms ease-out` | Panel animations |

### 8.4 Animation Usage Guide

```css
/* Hover states */
.button {
    transition: background-color var(--transition-fast);
}

/* Focus rings - instant */
.input:focus {
    outline: 2px solid var(--color-border-focus);
    /* No transition on focus ring */
}

/* Panel slides */
.panel {
    transition: transform var(--transition-slow);
}

/* Spring animations */
.bounce-element {
    transition: transform var(--duration-moderate) var(--ease-spring);
}
```

---

## 9. Z-Index Tokens

> **📘 Note:** For comprehensive z-index strategy, principles, and migration guidance, see the [Z-Index Strategy Specification](./z-index-strategy.md).

### Core Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | `0` | Base layer |
| `--z-dropdown` | `1000` | Dropdowns, menus |
| `--z-sticky` | `1100` | Sticky headers |
| `--z-fixed` | `1200` | Fixed elements |
| `--z-modal-backdrop` | `1300` | Modal overlays |
| `--z-modal` | `1400` | Modal dialogs |
| `--z-popover` | `1500` | Popovers |
| `--z-tooltip` | `1600` | Tooltips |
| `--z-toast` | `1700` | Toast notifications |

### Extended Z-Index Scale (Proposed)

| Token | Value | Usage |
|-------|-------|-------|
| `--z-canvas` | `100` | Canvas layer |
| `--z-canvas-overlay` | `200` | Canvas selection handles |
| `--z-panel` | `1000` | Base panel layer |
| `--z-panel-active` | `1050` | Active/focused panel |
| `--z-modal-nested` | `1450` | Nested modal (rare) |
| `--z-popover-nested` | `1550` | Nested popover (e.g., color picker in flyout) |
| `--z-notification` | `1750` | System notifications |
| `--z-alert` | `1800` | Critical alerts |
| `--z-system-overlay` | `9000` | System-level overlays |
| `--z-presentation` | `9500` | Presentation mode base |
| `--z-presentation-ui` | `9600` | Presentation mode UI controls |
| `--z-collaboration` | `9800` | Collaboration cursors |
| `--z-master-mode` | `9900` | Master mode overlay |
| `--z-fullscreen` | `10000` | Maximum overlay |

### Z-Index Stacking Order

```
z-toast (1700)         ┌─────────────────┐
                       │   Toast         │
z-tooltip (1600)       └─────────────────┘
                           ┌─────────┐
                           │ Tooltip │
z-popover (1500)           └─────────┘
                       ┌───────────────┐
                       │   Popover     │
z-modal (1400)         └───────────────┘
                   ┌─────────────────────────┐
                   │        Modal            │
z-modal-backdrop   └─────────────────────────┘
(1300)             ████████████████████████████
                   █████ Backdrop Overlay █████
z-fixed (1200)     ████████████████████████████
               ┌─────────────────────────────────┐
z-sticky       │      Fixed Header               │
(1100)         └─────────────────────────────────┘
z-dropdown     ┌────────────┐
(1000)         │  Dropdown  │
               └────────────┘
z-base (0)     ═══════════════════════════════════
               ════════ Main Content ═════════════
```

---

## 10. Cursor Tokens

### 10.1 Standard Cursors

| Token | Value | Usage |
|-------|-------|-------|
| `--cursor-default` | `default` | Default arrow |
| `--cursor-pointer` | `pointer` | Clickable elements |
| `--cursor-grab` | `grab` | Draggable elements |
| `--cursor-grabbing` | `grabbing` | During drag |
| `--cursor-crosshair` | `crosshair` | Drawing mode |
| `--cursor-text` | `text` | Text editing |
| `--cursor-move` | `move` | Moving elements |
| `--cursor-not-allowed` | `not-allowed` | Disabled actions |
| `--cursor-none` | `none` | Hidden cursor |

### 10.2 Resize Cursors

| Token | Value | Usage |
|-------|-------|-------|
| `--cursor-resize-ns` | `ns-resize` | Vertical resize |
| `--cursor-resize-ew` | `ew-resize` | Horizontal resize |
| `--cursor-resize-nwse` | `nwse-resize` | Diagonal resize |
| `--cursor-resize-nesw` | `nesw-resize` | Diagonal resize |
| `--cursor-resize-col` | `col-resize` | Column resize |
| `--cursor-resize-row` | `row-resize` | Row resize |

---

## 11. Component Tokens

### 11.1 Property Inspector Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--pi-row-height` | `32px` | Property row height |
| `--pi-input-height` | `var(--input-height-md)` | Input height |
| `--pi-label-color` | `var(--color-text-secondary)` | Label color |
| `--pi-input-bg` | `var(--color-bg-input)` | Input background |
| `--pi-input-bg-hover` | `var(--color-bg-hover)` | Input hover |

### 11.2 Input Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--input-border-radius` | `var(--radius-sm)` | Input corners |
| `--input-padding-x` | `8px` | Horizontal padding |
| `--input-padding-y` | `4px` | Vertical padding |

### 11.3 Menu Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--menu-bg` | `var(--color-bg-elevated)` | Menu background |
| `--menu-border` | `var(--color-border)` | Menu border |
| `--menu-item-hover` | `var(--color-interactive-hover)` | Item hover |
| `--menu-item-active` | `var(--color-interactive-active)` | Item active |
| `--menu-item-selected` | `var(--color-interactive-selected)` | Selected item |

### 11.4 Toolbar Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--toolbar-bg` | `var(--color-bg-panel)` | Toolbar background |
| `--toolbar-border` | `var(--color-border)` | Toolbar border |
| `--tool-active-bg` | `var(--color-accent)` | Active tool bg |
| `--tool-active-color` | `var(--color-text-on-accent)` | Active tool text |

### 11.5 Swatch Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--swatch-border` | `1px solid var(--color-border)` | Swatch border |
| `--swatch-border-overlay` | `1px solid rgba(255, 255, 255, 0.1)` | Overlay border |

---

## 12. Legacy Aliases

> **Note:** These aliases exist for backward compatibility. New code should use the primary tokens.

| Legacy Token | Maps To |
|--------------|---------|
| `--bg-app` | `var(--color-bg-app)` |
| `--bg-panel` | `var(--color-bg-panel)` |
| `--bg-well` | `var(--color-bg-input)` |
| `--border-color` | `var(--color-border)` |
| `--text-primary` | `var(--color-text-primary)` |
| `--text-secondary` | `var(--color-text-secondary)` |
| `--te-blue` | `var(--color-accent)` |
| `--spacing-sm` | `var(--spacing-2)` |
| `--color-primary` | `var(--color-accent)` |
| `--color-bg-primary` | `var(--color-surface-primary)` |
| `--color-bg-secondary` | `var(--color-surface-secondary)` |
| `--color-bg-tertiary` | `var(--color-surface-tertiary)` |
| `--color-bg-well` | `var(--color-bg-input)` |
| `--prop-bg-input` | `var(--color-bg-input)` |
| `--prop-bg-input-hover` | `var(--color-bg-hover)` |
| `--prop-text-label` | `var(--color-text-secondary)` |
| `--prop-border-radius` | `var(--input-border-radius)` |

---

## 13. Opacity Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-0` | `0` | Invisible |
| `--opacity-5` | `0.05` | Near invisible |
| `--opacity-10` | `0.1` | Very subtle |
| `--opacity-20` | `0.2` | Subtle overlays |
| `--opacity-40` | `0.4` | Disabled states |
| `--opacity-50` | `0.5` | Half visible |
| `--opacity-60` | `0.6` | Placeholder text |
| `--opacity-70` | `0.7` | Strong but not full |
| `--opacity-80` | `0.8` | Very visible |
| `--opacity-90` | `0.9` | Near full |
| `--opacity-100` | `1` | Fully opaque |

### Semantic Opacity Aliases

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-disabled` | `var(--opacity-40)` | Disabled elements |
| `--opacity-placeholder` | `var(--opacity-60)` | Placeholder text |
| `--opacity-muted` | `var(--opacity-50)` | Muted content |
| `--opacity-hover-overlay` | `var(--opacity-10)` | Hover effect |

---

## Quick Reference: Most Used Tokens

### Colors
```css
--color-bg-app            /* App background */
--color-bg-panel          /* Panel background */
--color-bg-input          /* Input background */
--color-bg-hover          /* Hover background */
--color-text-primary      /* Main text */
--color-text-secondary    /* Label text */
--color-accent            /* Primary accent */
--color-accent-subtle     /* Hover bg (20%) */
--color-border            /* Default border */
--color-border-focus      /* Focus ring */
```

### Spacing
```css
--spacing-1    /* 4px - tight */
--spacing-2    /* 8px - standard */
--spacing-3    /* 12px - comfortable */
--spacing-4    /* 16px - spacious */
```

### Typography
```css
--font-size-sm    /* 11px - labels */
--font-size-md    /* 12px - body */
--font-weight-medium  /* 500 */
```

### Sizes
```css
--control-size-sm    /* 24px - compact */
--control-size-md    /* 28px - default */
--control-size-lg    /* 32px - comfortable */
--radius-sm          /* 4px */
--radius-md          /* 6px */
```

---

*Last Updated: December 2024*
*Version: 1.0*
