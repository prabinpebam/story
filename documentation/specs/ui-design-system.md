# UI Design System & Component Library
**Theme:** Professional Creative Tool (High Density, Focused, Tactile)
**Last Updated:** Design Token Standardization Phase

---

## 0. Design Token Standardization Status

> **Related Document:** See `documentation/plans/design-token-standardization-plan.md` for the complete standardization roadmap.

### Standardization Progress

| Category | Status | Token Pattern |
|----------|--------|---------------|
| Spacing/Gap | ✅ Complete | `--spacing-{n}` |
| Colors | ✅ Complete | `--color-{category}-{variant}` |
| Shadows | ✅ Complete | `--shadow-{size}` |
| Z-Index | ✅ Complete | `--z-{level}` |
| Border Radius | ✅ Complete | `--radius-{size}` |
| Transitions | ✅ Complete | `--transition-{speed}` |
| Font Sizes | ✅ Complete | `--font-size-{size}` |
| Font Weights | ✅ Complete | `--font-weight-{name}` |
| Input Heights | ✅ Complete | `--input-height-{size}` |
| Icon Sizes | 🔄 In Progress | `--icon-size-{size}` |
| Opacity | 🔄 In Progress | `--opacity-{n}` |
| Border Width | 🔄 In Progress | `--border-width-{n}` |
| Component Sizes | 🔄 In Progress | `--control-size-{size}` |

### The "No Magic Numbers" Rule

**CRITICAL:** All numeric values in CSS must use design tokens. No arbitrary pixel values.

```css
/* ❌ WRONG - Magic numbers */
.component {
    padding: 6px 10px;
    font-size: 13px;
    border-radius: 5px;
}

/* ✅ CORRECT - Design tokens */
.component {
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-lg);
    border-radius: var(--radius-sm);
}
```

---

## 1. Design Philosophy

The interface is designed for professional workflows, balancing the density of a complex editor (like Figma) with tactile, clear interactions.

- **Content First:** The UI recedes to let the user's work take center stage.
- **High Density:** Controls are compact to maximize screen real estate for the canvas.
- **Clear Hierarchy:** Use contrast and spacing (not decoration) to group related controls.
- **Tactile Feedback:** Hover states, focus rings, and active states provide immediate, clear feedback.
- **Token-First Development:** All colors MUST use CSS variables. Never hardcode hex values in components.

---

## 2. Theme System Architecture

### 2.1 Theme Switching Mechanism

The application uses a **dark-mode-default** architecture:

```css
/* Dark mode is the default (no class needed) */
:root {
  --color-bg-app: #1E1E1E;
  /* ... dark mode tokens */
}

/* Light mode is activated via body class */
body.theme-light {
  --color-bg-app: #FFFFFF;
  /* ... light mode overrides */
}
```

**Implementation Details:**
- **Default State:** Dark mode (no class on body)
- **Light Mode:** Add `theme-light` class to `<body>`
- **Toggle Location:** Settings Modal (`src/ui/SettingsModal.js`)
- **Persistence:** User preference stored in localStorage

### 2.2 Token File Location

All design tokens are defined in: `styles/modules/variables.css`

**IMPORTANT:** This is the single source of truth for all color values. Components must NEVER define their own hardcoded colors.

---

## 3. Color Token System

### 3.1 Background Tokens

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-bg-app` | `#1E1E1E` | `#FFFFFF` | Main application background |
| `--color-bg-secondary` | `#2C2C2C` | `#F5F5F5` | Panel backgrounds |
| `--color-bg-tertiary` | `#383838` | `#E8E8E8` | Elevated surfaces, cards |
| `--color-bg-elevated` | `#404040` | `#FFFFFF` | Floating panels, modals |
| `--color-bg-input` | `#1E1E1E` | `#FFFFFF` | Input field backgrounds |
| `--color-bg-hover` | `#3A3A3A` | `#E0E0E0` | Hover states |
| `--color-bg-active` | `#4A4A4A` | `#D0D0D0` | Active/pressed states |
| `--color-surface-primary` | `#2C2C2C` | `#FFFFFF` | Primary surfaces |
| `--color-surface-secondary` | `#383838` | `#F5F5F5` | Secondary surfaces |

### 3.2 Border Tokens

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-border` | `#444444` | `#E0E0E0` | Standard borders |
| `--color-border-subtle` | `#333333` | `#EEEEEE` | Subtle separators |
| `--color-border-strong` | `#555555` | `#CCCCCC` | Emphasized borders |
| `--color-border-focus` | `#18A0FB` | `#18A0FB` | Focus rings (same both themes) |

### 3.3 Text Tokens

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--color-text-primary` | `#FFFFFF` | `#1A1A1A` | Primary text, values |
| `--color-text-secondary` | `#AAAAAA` | `#666666` | Labels, placeholders |
| `--color-text-tertiary` | `#777777` | `#999999` | Muted text |
| `--color-text-disabled` | `#666666` | `#AAAAAA` | Disabled states |
| `--color-text-inverse` | `#1A1A1A` | `#FFFFFF` | Text on accent colors |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent buttons |

### 3.4 Accent & Brand Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#18A0FB` | Primary accent, selections, focus |
| `--color-accent-hover` | `#0D86D7` | Accent hover state |
| `--color-accent-active` | `#0A6EAE` | Accent pressed state |
| `--color-accent-subtle` | `rgba(24, 160, 251, 0.15)` | Selection backgrounds |
| `--color-selection` | `rgba(24, 160, 251, 0.1)` | Light selection wash |

### 3.5 System Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#30D158` | Success states |
| `--color-warning` | `#FFD60A` | Warning states |
| `--color-error` | `#FF453A` | Error states |
| `--color-info` | `#18A0FB` | Informational states |

### 3.6 Shadow Tokens

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--color-shadow` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.15)` |
| `--shadow-sm` | `0 1px 2px var(--color-shadow)` | Same |
| `--shadow-md` | `0 4px 12px var(--color-shadow)` | Same |
| `--shadow-lg` | `0 8px 24px var(--color-shadow)` | Same |
| `--shadow-floating` | `0 8px 32px rgba(0,0,0,0.4)` | `0 8px 32px rgba(0,0,0,0.12)` |

---

## 4. Typography System

### 4.1 Font Families

```css
--font-family-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 4.2 Font Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-2xs` | `9px` | Micro labels, badges |
| `--font-size-xs` | `10px` | Small labels, captions |
| `--font-size-sm` | `11px` | Secondary text, labels |
| `--font-size-md` | `12px` | Body text, input values |
| `--font-size-lg` | `13px` | Section headers |
| `--font-size-xl` | `14px` | Panel titles |
| `--font-size-2xl` | `16px` | Modal headers |
| `--font-size-3xl` | `20px` | Large headers (proposed) |
| `--font-size-4xl` | `24px` | Display text (proposed) |
| `--font-size-5xl` | `32px` | Hero text (proposed) |
| `--font-size-6xl` | `48px` | Jumbo text (proposed) |

> **Note:** Larger sizes (3xl-6xl) are proposed for display text, empty states, and presentation mode.

### 4.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-regular` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, emphasis |
| `--font-weight-semibold` | `600` | Headers, buttons |
| `--font-weight-bold` | `700` | Strong emphasis |

> **Note:** Avoid using `font-weight: 900` - it's not in our token scale.

### 4.4 Line Heights

| Token | Value |
|-------|-------|
| `--line-height-tight` | `1.2` |
| `--line-height-normal` | `1.4` |
| `--line-height-relaxed` | `1.6` |

---

## 5. Spacing & Layout System

### 5.1 Spacing Scale (4px Base Grid)

The spacing system uses a constrained numeric scale based on a 4px grid:

| Token | Value | Usage |
|-------|-------|-------------|
| `--spacing-0` | `0` | Reset |
| `--spacing-1` | `4px` | Tight gaps, inline spacing |
| `--spacing-2` | `8px` | Standard gaps, input padding |
| `--spacing-3` | `12px` | Section padding, comfortable gaps |
| `--spacing-4` | `16px` | Component padding, section margins |
| `--spacing-5` | `20px` | Large gaps |
| `--spacing-6` | `24px` | Panel padding, major sections |
| `--spacing-8` | `32px` | Large section margins |
| `--spacing-10` | `40px` | Hero spacing |
| `--spacing-12` | `48px` | Maximum spacing |

> **Note:** We use numeric naming (`--spacing-1`, `--spacing-2`) instead of t-shirt sizing (`--spacing-sm`, `--spacing-md`) because it's more precise and predictable for developers.

### 5.2 Input & Control Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--input-height-sm` | `24px` | Compact inputs, inline controls |
| `--input-height-md` | `28px` | Default input height |
| `--input-height-lg` | `32px` | Large inputs, form controls |

### 5.3 Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | `240px` | Standard panel width |
| `--header-height` | `40px` | Top header bar |
| `--toolbar-height` | `48px` | Main toolbar |
| `--panel-min-width` | `200px` | Minimum panel width |
| `--panel-max-width` | `400px` | Maximum panel width |
| `--pi-row-height` | `32px` | Property inspector row |

### 5.4 Icon Sizes (Proposed)

| Token | Value | Usage |
|-------|-------|-------|
| `--icon-size-xs` | `12px` | Micro icons, indicators |
| `--icon-size-sm` | `14px` | Small inline icons |
| `--icon-size-md` | `16px` | Default icon size |
| `--icon-size-lg` | `20px` | Emphasized icons |
| `--icon-size-xl` | `24px` | Large icons, buttons |
| `--icon-size-2xl` | `32px` | Hero icons, empty states |

### 5.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `2px` | Subtle rounding |
| `--radius-sm` | `4px` | Inputs, buttons |
| `--radius-md` | `6px` | Cards, dropdowns |
| `--radius-lg` | `8px` | Panels, modals |
| `--radius-xl` | `12px` | Large elements |
| `--radius-2xl` | `16px` | Hero elements |
| `--radius-full` | `9999px` | Circles, pills |

### 5.6 Transition Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `100ms ease-out` | Micro interactions (hover) |
| `--transition-normal` | `150ms ease-out` | Standard transitions |
| `--transition-slow` | `250ms ease-out` | Panel slides, complex animations |

### 5.7 Z-Index Scale

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

### 5.8 Opacity Scale (Proposed)

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-0` | `0` | Invisible |
| `--opacity-10` | `0.1` | Subtle overlays |
| `--opacity-20` | `0.2` | Light overlays |
| `--opacity-40` | `0.4` | Disabled states |
| `--opacity-60` | `0.6` | Placeholder text |
| `--opacity-80` | `0.8` | Strong but not full |
| `--opacity-90` | `0.9` | Near-opaque |
| `--opacity-100` | `1` | Fully opaque |

### 5.9 Border Width (Proposed)

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-0` | `0` | No border |
| `--border-width-1` | `1px` | Default borders |
| `--border-width-2` | `2px` | Emphasis, focus rings |
| `--border-width-4` | `4px` | Heavy emphasis, selection |

---

## 6. Component Patterns

### 6.1 Inputs & Controls

**Numeric Input**
```css
.numeric-input {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  height: var(--input-height);
}
.numeric-input:hover {
  background: var(--color-bg-hover);
}
.numeric-input:focus {
  border-color: var(--color-accent);
  outline: none;
}
```

**Color Swatch**
```css
.color-swatch {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
```

**Dropdown**
```css
.dropdown {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
}
.dropdown-menu {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
}
```

### 6.2 Buttons

**Primary Button**
```css
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-on-accent);
  border-radius: var(--radius-sm);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
```

**Icon Button**
```css
.btn-icon {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn-icon:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}
```

### 6.3 Panels & Containers

**Panel**
```css
.panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}
```

**Floating Panel (Flyouts, Popovers)**
```css
.flyout {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-floating);
  border-radius: var(--radius-md);
}
```

---

## 7. Motion & Animation

### 7.1 Timing

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `100ms` | Micro interactions |
| `--transition-normal` | `150ms` | Standard transitions |
| `--transition-slow` | `250ms` | Panel slides |
| `--easing-default` | `ease-out` | Standard easing |

### 7.2 Guidelines

- **Hover states:** 150ms ease-out
- **Focus rings:** Instant (no delay)
- **Panel transitions:** 200-250ms ease-out
- **Avoid:** Excessive animation that slows workflow

---

## 8. Development Guidelines

### 8.1 CRITICAL: No Inline Styles

The biggest anti-pattern in this codebase is using `style.cssText` or individual `style.property` assignments instead of CSS classes. This creates **139+ instances** of unmaintainable code.

#### Why Inline Styles Are Broken

| Problem | Impact |
|---------|--------|
| **No Pseudo-States** | Can't do `:hover`, `:focus`, `:active` |
| **No Media Queries** | Can't do responsive designs |
| **No CSS Variables** | Actually, you CAN use them, but... |
| **Specificity Issues** | Inline styles override everything |
| **No Reusability** | Same styles repeated dozens of times |
| **Bloated HTML** | DOM inspector becomes unreadable |
| **Maintenance Hell** | Change one thing = find/replace everywhere |

#### The False Sense of Safety

❌ **This LOOKS okay but is still broken:**
```javascript
// You're using variables, but you still can't hover or focus!
element.style.cssText = `
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 8px 12px;
`;
```

#### The Real Solution: CSS Classes

✅ **Create reusable CSS classes:**
```css
/* In panel-components.css */
.preset-card {
    background: var(--color-bg-well);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    padding: var(--spacing-2);
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
}

.preset-card:hover {
    border-color: var(--color-border-hover);
    transform: scale(1.02);
}

.preset-card.selected {
    border-color: var(--color-accent);
}
```

✅ **Then apply in JavaScript:**
```javascript
const card = document.createElement('div');
card.className = 'preset-card';
if (isSelected) card.classList.add('selected');
```

### 8.2 CRITICAL: No Hardcoded Colors

❌ **NEVER do this:**
```javascript
element.style.backgroundColor = '#383838';
element.style.color = '#AAAAAA';
element.style.border = '1px solid #444444';
```

✅ **ALWAYS do this:**
```javascript
element.style.backgroundColor = 'var(--color-bg-tertiary)';
element.style.color = 'var(--color-text-secondary)';
element.style.border = '1px solid var(--color-border)';
```

### 8.2 Token Selection Guide

| Need | Use Token |
|------|-----------|
| Main background | `--color-bg-app` |
| Panel background | `--color-bg-secondary` |
| Input background | `--color-bg-input` |
| Hover state | `--color-bg-hover` |
| Standard border | `--color-border` |
| Focus border | `--color-accent` |
| Primary text | `--color-text-primary` |
| Label text | `--color-text-secondary` |
| Disabled text | `--color-text-disabled` |

### 8.3 Testing Themes

1. Open Settings Modal
2. Toggle "Appearance: Light" checkbox
3. Verify all UI elements respond correctly
4. Check for any remaining hardcoded colors (they won't change)

### 8.4 Adding New Tokens

When adding new tokens:
1. Add to `:root` in `variables.css` (dark mode value)
2. Add override in `body.theme-light` (light mode value)
3. Document in this spec
4. Use semantic naming (e.g., `--color-bg-card` not `--color-gray-700`)

---

## 9. Property Inspector Specifics

The Property Inspector follows the core system with high-density rules:

- **Labels:** `var(--font-size-sm)` with `var(--color-text-secondary)`
- **Values:** `var(--font-size-md)` with `var(--color-text-primary)`
- **Inputs:** `var(--color-bg-input)` background
- **Icons:** `var(--icon-size)` at `var(--color-text-secondary)`
- **Section Headers:** `var(--font-size-lg)` with `var(--font-weight-medium)`

---

## 10. Migration Checklist

When fixing legacy hardcoded colors:

- [ ] Search for hex color patterns: `#[0-9A-Fa-f]{6}` and `#[0-9A-Fa-f]{3}`
- [ ] Search for rgb/rgba patterns
- [ ] Replace with appropriate CSS variable
- [ ] Test in both dark and light modes
- [ ] Update any related inline styles

**Common Replacements:**
| Hardcoded | Replace With |
|-----------|--------------|
| `#1E1E1E` | `var(--color-bg-app)` |
| `#2C2C2C` | `var(--color-bg-secondary)` |
| `#383838` | `var(--color-bg-tertiary)` |
| `#444444` | `var(--color-border)` |
| `#AAAAAA` | `var(--color-text-secondary)` |
| `#FFFFFF` | `var(--color-text-primary)` |
| `#18A0FB` | `var(--color-accent)` |

---

## 11. Component Variants (CSS Classes)

The design system includes pre-built CSS component classes in `styles/modules/flyout-components.css`. These provide consistent, theme-aware styling for common UI patterns.

### 11.1 Flyout Components

**Flyout Container**
```css
.ui-flyout {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-floating);
}
```

**Tab Header**
```css
.flyout-tab-header         /* Container for tab buttons */
.flyout-tab-btn            /* Individual tab button */
.flyout-tab-btn.active     /* Active tab state */
```

**Tab Content**
```css
.flyout-tab-content        /* Tab panel container */
.flyout-section-header     /* Section title within tab */
.flyout-label              /* Form labels */
```

### 11.2 Media Upload Components

Use for image/video upload areas:

```html
<div class="media-upload-area">
  <div class="upload-placeholder">
    <span class="upload-icon">📷</span>
    <span class="upload-text">Drop image here</span>
  </div>
</div>
```

**States:**
- `.media-upload-area` - Default upload area with dashed border
- `.media-upload-area.has-media` - When media is loaded (no border)
- `.upload-placeholder:hover` - Highlights on hover

### 11.3 Segmented Button Groups

For mutually exclusive options (e.g., Fit/Fill/Tile):

```html
<div class="flyout-button-group">
  <button class="flyout-segmented-btn active">Fit</button>
  <button class="flyout-segmented-btn">Fill</button>
  <button class="flyout-segmented-btn">Tile</button>
</div>
```

**Classes:**
- `.flyout-button-group` - Container with proper spacing
- `.flyout-segmented-btn` - Individual toggle button
- `.flyout-segmented-btn.active` - Selected state (accent background)

### 11.4 Position Grid

3x3 grid for alignment/position selection:

```html
<div class="position-grid">
  <button class="position-grid-btn active" data-pos="top-left"></button>
  <button class="position-grid-btn" data-pos="top-center"></button>
  <!-- ... 9 total buttons -->
</div>
```

**Classes:**
- `.position-grid` - CSS Grid container (3×3)
- `.position-grid-btn` - Grid cell button
- `.position-grid-btn.active` - Selected position (accent color)

### 11.5 Slider Rows

Horizontal label + slider + value layout:

```html
<div class="flyout-slider-row">
  <span class="flyout-label">Opacity</span>
  <input type="range" class="flyout-slider">
  <span class="flyout-slider-value">100%</span>
</div>
```

### 11.6 Dropdown Menus

```css
.dropdown-menu             /* Menu container */
.dropdown-menu-item        /* Individual option */
.dropdown-menu-item:hover  /* Hover state */
.dropdown-menu-item.selected /* Currently selected */
```

### 11.7 Usage Guidelines

**When to use CSS classes vs inline styles:**

| Scenario | Approach |
|----------|----------|
| Standard UI chrome | Use CSS classes |
| Theme-aware colors | Use CSS variables |
| Dynamic/computed values | Inline with CSS variables |
| Functional colors (e.g., picker gradients) | Hardcoded is acceptable |

**Migration Pattern:**

❌ **Before (inline hardcoded):**
```javascript
container.style.cssText = `
  background: #2C2C2C;
  border: 1px solid #444;
  padding: 12px;
`;
```

✅ **After (CSS class):**
```javascript
container.className = 'flyout-tab-content';
```

### 11.8 Component File Reference

| File | Components |
|------|------------|
| `flyout-components.css` | All flyout UI: tabs, media areas, grids, sliders |
| `panel-components.css` | Manager panels: preset cards, theme rows, forms, modals |
| `property-inspector.css` | Property panel: sections, controls, triggers |
| `buttons.css` | Button variants: primary, icon, toolbar |
| `dropdown.css` | Dropdown trigger and field styles |

### 11.9 Panel Components (NEW)

The `panel-components.css` file provides classes for manager panels:

**Preset Cards (Color/Typography themes):**
```html
<div class="preset-card selected">
  <div class="preset-swatches">
    <div class="preset-swatch" style="background: #fff"></div>
    <div class="preset-swatch" style="background: #1a1a2e"></div>
  </div>
  <div class="preset-name">Corporate Blue</div>
</div>
```

**Theme Swatches:**
```html
<div class="theme-swatches">
  <div class="theme-swatches-header">
    <span class="theme-swatches-label">Theme Colors</span>
    <select class="theme-preset-select">...</select>
  </div>
  <div class="theme-swatches-grid theme-swatches-grid-8">
    <button class="theme-swatch" style="background: #fff"></button>
    ...
  </div>
</div>
```

**Filter/Search Row:**
```html
<div class="panel-filter-row">
  <input class="panel-search-input" placeholder="Search...">
  <div class="dropdown">...</div>
</div>
```

**Form Rows:**
```html
<div class="panel-form-row">
  <label class="panel-form-label">Font Size</label>
  <input class="panel-form-input" value="16px">
</div>
```

**Panel Footer:**
```html
<div class="panel-footer">
  <button class="panel-btn panel-btn-secondary">Reset</button>
  <button class="panel-btn panel-btn-primary">Apply</button>
</div>
```

### 11.10 Intentional Exceptions

Some colors should remain hardcoded for functional reasons:

- **Color picker gradients:** Rainbow hue bar, white-to-transparent, black-to-transparent
- **Contrast handles:** White handles on color pickers (must contrast against any color)
- **Canvas grid:** Fixed grid color for visibility across themes

For these cases, use fallback patterns:
```javascript
// Handle that needs to contrast against variable backgrounds
handle.style.border = '2px solid var(--color-text-inverse, #fff)';

