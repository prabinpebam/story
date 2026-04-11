# Property Inspector - Visual Design Specifications

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)
> **Reference:** See `documentation/specs/ui-system/design-tokens-reference.md` for all token values.
> **Reference:** See `documentation/specs/ui-system/component-library.md` for component APIs.

---

## Design Token Compliance

**CRITICAL:** All values in this document MUST use design tokens from `styles/modules/variables.css`. Never use hardcoded pixel or color values in implementation.

---

## 1. Layout Dimensions

### 1.1 Overall Panel

```
┌─────────────────────────────────────┐
│ Property Inspector                  │
├─────────────────────────────────────┤
│                                     │
│  Panel Width: var(--sidebar-width)  │
│  Content Padding: var(--spacing-3)  │
│  Section Gap: var(--spacing-2)      │
│                                     │
└─────────────────────────────────────┘
```

| Property | Token | Value |
|----------|-------|-------|
| Panel Width | `--sidebar-width` | 240px |
| Panel Min Height | — | 100% viewport |
| Content Padding | `--spacing-3` | 12px |
| Section Gap | `--spacing-2` | 8px |
| Background | `--color-bg-panel` | #2D2D2D |
| Border Left | `--color-border-subtle` | #353535 |

### 1.2 Header Area

```
┌─────────────────────────────────────┐
│ [←] Shape                     [···] │
│     var(--font-size-xl) medium      │
├─────────────────────────────────────┤
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--header-height` | 40px |
| Padding | `--spacing-2` `--spacing-3` | 8px 12px |
| Font Size | `--font-size-xl` | 14px |
| Font Weight | `--font-weight-medium` | 500 |
| Back Button Size | `--control-size-sm` | 24px |
| Menu Button Size | `--control-size-sm` | 24px |

---

## 2. Section Component

> **Component:** Use `Section` from `src/ui/components/Section.js`

### 2.1 Section Header

```
┌─────────────────────────────────────┐
│ ▶ Section Title            [+] [-] │
│   var(--font-size-lg)  500          │
├─────────────────────────────────────┤
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--control-size-lg` | 32px |
| Padding | `--spacing-0` `--spacing-3` | 0 12px |
| Font Size | `--font-size-lg` | 13px |
| Font Weight | `--font-weight-medium` | 500 |
| Text Color | `--color-text-secondary` | #A0A0A0 |
| Text Transform | — | uppercase |
| Letter Spacing | `--letter-spacing-wider` | 0.05em |
| Chevron Size | `--icon-size-xs` | 12px |

### 2.2 Section Content

| Property | Token | Value |
|----------|-------|-------|
| Padding | `--spacing-2` `--spacing-3` `--spacing-3` | 8px 12px 12px |
| Background | — | transparent |
| Gap Between Items | `--spacing-2` | 8px |

### 2.3 Section States

**Collapsed:**
- Content height: 0
- Chevron rotation: -90deg

**Expanded:**
- Content height: auto
- Chevron rotation: 0deg
- Transition: `--transition-normal` (150ms ease-out)

**Hover:**
- Header background: `--color-interactive-hover`

---

## 3. Input Components

> **Components:** Use centralized components from `src/ui/components/`

### 3.1 NumberInput

> **Component:** `NumberInput` with `scrubbable: true`

```
┌─────────────────────┐
│ 100    [▲]         │
│        [▼]          │
└─────────────────────┘
```

| Property | Token | Value |
|----------|-------|-------|
| Width | `--input-width-sm` | 60px (default) |
| Height | `--input-height-md` | 28px |
| Background | `--color-bg-input` | #383838 |
| Border | `--color-border` | #404040 |
| Border Radius | `--radius-sm` | 4px |
| Font Size | `--font-size-md` | 12px |
| Text Color | `--color-text-primary` | #E8E8E8 |
| Padding | `--spacing-0` `--spacing-2` | 0 8px |

**States:**

| State | Border | Background |
|-------|--------|------------|
| Default | `--color-border` | `--color-bg-input` |
| Hover | `--color-border-hover` | `--color-bg-input` |
| Focus | `--color-border-focus` | `--color-bg-input` |
| Disabled | `--color-border-subtle` | `--color-surface-tertiary` |
| Error | `--color-danger` | `--color-bg-input` |

### 3.2 ColorInput

> **Component:** `ColorInput` from component library

```
┌───────────────────────┐
│ [█] #FF5733    100%  │
│ swatch-md            │
└───────────────────────┘
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--input-height-md` | 28px |
| Color Swatch Size | `--swatch-size-md` | 16px |
| Swatch Border Radius | `--radius-sm` | 4px |
| Swatch Border | `--color-border-subtle` | dynamic |
| Hex Input Width | `--input-width-md` | 80px |
| Opacity Input Width | `--input-width-xs` | 40px |

### 3.3 Dropdown

> **Component:** `Dropdown` from component library

```
┌─────────────────────────────┐
│ Selected Value         [▼] │
│                             │
└─────────────────────────────┘
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--input-height-md` | 28px |
| Background | `--color-bg-input` | #383838 |
| Border | `--color-border` | #404040 |
| Border Radius | `--radius-sm` | 4px |
| Padding | `--spacing-0` `--spacing-2` | 0 8px |
| Chevron Size | `--icon-size-xs` | 12px |

**Dropdown Menu:**

| Property | Token | Value |
|----------|-------|-------|
| Background | `--color-bg-elevated` | #333333 |
| Border | `--color-border-strong` | #505050 |
| Border Radius | `--radius-md` | 6px |
| Box Shadow | `--shadow-md` | 0 4px 8px |
| Max Height | — | 240px |
| Item Height | `--input-height-md` | 28px |
| Item Hover | `--color-accent-subtle` | accent 15% |

---

## 4. Button Components

> **Component:** Use unified `Button` component for ALL buttons

### 4.1 Icon Button (Button with icon only)

```javascript
// Use Button component, NOT IconButton
new Button({
    icon: Icons.PLUS,
    size: 'xs',          // 24px
    variant: 'text',
    title: 'Add'
});
```

| Property | Token | Value |
|----------|-------|-------|
| Size | `--control-size-sm` | 24px |
| Icon Size | `--icon-size-md` | 16px |
| Background | — | transparent |
| Border Radius | `--radius-sm` | 4px |
| Icon Color | `--color-text-secondary` | #A0A0A0 |

**States:**

| State | Background | Icon Color |
|-------|------------|------------|
| Default | transparent | `--color-text-secondary` |
| Hover | `--color-accent-subtle` | `--color-text-primary` |
| Active | `--color-accent-muted` | `--color-text-primary` |
| Disabled | transparent | `--color-text-disabled` |
| Selected | `--color-accent` | `--color-text-on-accent` |

### 4.2 Action Button

```javascript
new Button({
    label: '+ Add Fill',
    variant: 'secondary',
    size: 'sm'
});
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--control-size-sm` | 28px |
| Padding | `--spacing-0` `--spacing-3` | 0 12px |
| Background | `--color-surface-secondary` | #363636 |
| Border | `--color-border` | #404040 |
| Border Radius | `--radius-sm` | 4px |
| Font Size | `--font-size-md` | 12px |
| Text Color | `--color-text-secondary` | #A0A0A0 |

---

## 5. Segmented Control

> **Component:** `SegmentedControl` from component library

```
┌───────┬───────┬───────┐
│ Opt 1 │ Opt 2 │ Opt 3 │
└───────┴───────┴───────┘
```

| Property | Token | Value |
|----------|-------|-------|
| Height | `--input-height-md` | 28px |
| Background | `--color-bg-input` | #383838 |
| Border | `--color-border` | #404040 |
| Border Radius | `--radius-sm` | 4px |
| Segment Padding | `--spacing-0` `--spacing-3` | 0 12px |
| Font Size | `--font-size-sm` | 11px |

**Segment States:**

| State | Background | Text Color |
|-------|------------|------------|
| Default | transparent | `--color-text-secondary` |
| Hover | `--color-interactive-hover` | `--color-text-primary` |
| Selected | `--color-accent` | `--color-text-on-accent` |

---

## 6. Row Layouts

### 6.1 Single Row (Label + Input)

```
┌─────────────────────────────────────┐
│ X                        [  100  ] │
│ 70px label               auto input │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 28px |
| Label Width | 70px |
| Gap | 8px |
| Input | flex: 1 |

### 6.2 Two-Column Row

```
┌─────────────────────────────────────┐
│ W [  100  ]    H [  80   ]         │
│    column1       column2            │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 28px |
| Column Gap | 12px |
| Label Width | auto |
| Input Width | flex: 1 |

### 6.3 Fill/Stroke Row

```
┌─────────────────────────────────────┐
│ [⋮⋮] [█] #FF5733 100%    [👁] [🗑] │
│ drag  color    value      actions   │
└─────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Height | 32px |
| Drag Handle Width | 16px |
| Color Swatch | 24x24px |
| Actions Width | 56px |
| Gap | 8px |

---

## 7. Flyout Panel

### 7.1 Flyout Container

```
┌─────────────────────────────────────┐
│ ▲ Flyout Title            [×]      │
├─────────────────────────────────────┤
│                                     │
│  Content Area                       │
│  280px width                        │
│                                     │
└─────────────────────────────────────┘
       ▼ Arrow pointing to source
```

| Property | Value | Token |
|----------|-------|-------|
| Width | 280px | - |
| Max Height | 400px | - |
| Background | #333333 | `--color-bg-elevated` |
| Border | 1px solid #4a4a4a | `--color-border-subtle` |
| Border Radius | 8px | `--radius-lg` |
| Box Shadow | 0 8px 24px rgba(0,0,0,0.4) | `--shadow-flyout` |
| Arrow Size | 8px | - |
| Padding | 12px | `--spacing-md` |

### 7.2 Flyout Header

| Property | Value | Token |
|----------|-------|-------|
| Height | 36px | - |
| Font Size | 13px | `--font-size-md` |
| Font Weight | 500 | `--font-weight-medium` |
| Border Bottom | 1px solid #4a4a4a | `--color-border-subtle` |
| Padding | 0 12px | - |

---

## 8. Color Specifications

### 8.1 Background Colors

| Name | Value | Usage |
|------|-------|-------|
| `--color-bg-primary` | #1a1a1a | Panel background |
| `--color-bg-secondary` | #232323 | Section background |
| `--color-bg-input` | #2c2c2c | Input fields |
| `--color-bg-elevated` | #333333 | Flyouts, dropdowns |
| `--color-bg-hover` | #3a3a3a | Hover states |

### 8.2 Text Colors

| Name | Value | Usage |
|------|-------|-------|
| `--color-text-primary` | #ffffff | Primary text |
| `--color-text-secondary` | #b3b3b3 | Labels, secondary |
| `--color-text-muted` | #666666 | Placeholders, disabled |
| `--color-text-link` | #4dabf7 | Links, accents |

### 8.3 Border Colors

| Name | Value | Usage |
|------|-------|-------|
| `--color-border-subtle` | #3a3a3a | Default borders |
| `--color-border-strong` | #4a4a4a | Emphasized borders |
| `--color-border-focus` | #4dabf7 | Focus rings |
| `--color-border-error` | #ff6b6b | Error states |

### 8.4 Accent Colors

| Name | Value | Usage |
|------|-------|-------|
| `--color-accent-primary` | #4dabf7 | Primary actions, selection |
| `--color-accent-success` | #51cf66 | Success states |
| `--color-accent-warning` | #fcc419 | Warning states |
| `--color-accent-error` | #ff6b6b | Error states |

---

## 9. Typography

### 9.1 Font Stack

```css
--font-family-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-family-mono: "SF Mono", "Fira Code", "Consolas", monospace;
```

### 9.2 Font Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-xs` | 10px | Tiny labels |
| `--font-size-sm` | 12px | Input text, labels |
| `--font-size-md` | 14px | Headers, important text |
| `--font-size-lg` | 16px | Panel title |

### 9.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Labels, headers |
| `--font-weight-semibold` | 600 | Emphasis |

---

## 10. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xxs` | 2px | Micro spacing |
| `--spacing-xs` | 4px | Tight spacing |
| `--spacing-sm` | 8px | Standard gaps |
| `--spacing-md` | 12px | Content padding |
| `--spacing-lg` | 16px | Section spacing |
| `--spacing-xl` | 24px | Large spacing |

---

## 11. Animation Specifications

### 11.1 Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Hover | 150ms | ease-out |
| Section collapse | 200ms | ease-out |
| Flyout appear | 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Focus ring | 100ms | ease-out |
| Color swatch | 150ms | ease-out |

### 11.2 Transitions

```css
/* Standard transition */
--transition-default: 150ms ease-out;

/* Section collapse */
--transition-collapse: 200ms ease-out;

/* Flyout */
--transition-flyout: 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 12. Responsive Behavior

### 12.1 Panel Resize

| Viewport Width | Panel Behavior |
|----------------|----------------|
| > 1400px | Fixed 260px, visible |
| 1200-1400px | Fixed 260px, collapsible |
| < 1200px | Overlay mode, hidden by default |

### 12.2 Breakpoint Adaptations

| Breakpoint | Changes |
|------------|---------|
| Small (<1200px) | Panel becomes overlay |
| Medium (1200-1600px) | Standard layout |
| Large (>1600px) | Optional wider panel (280px) |

---

## 13. Dark Mode (Current Only)

The Property Inspector currently only supports dark mode. Light mode specifications are reserved for future implementation.

### 13.1 Dark Mode Token Values

All color values in this document represent dark mode. Light mode would invert the lightness scale while maintaining the same accent colors.

---

## Document End

Visual specifications align with the overall Story design system. All tokens should be defined in CSS custom properties and imported from the central design token file.
