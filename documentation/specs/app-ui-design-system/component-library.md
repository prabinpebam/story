# Component Library Reference

> **Complete documentation of all interactive UI components in the Story Design System**

## Table of Contents

1. [Overview](#1-overview)
2. [Button Components](#2-button-components)
3. [Input Components](#3-input-components)
4. [Selection Controls](#4-selection-controls)
5. [Container Components](#5-container-components)
6. [Feedback Components](#6-feedback-components)
7. [Specialized Components](#7-specialized-components)
8. [Usage Guidelines](#8-usage-guidelines)

---

## 1. Overview

### 1.1 Component Architecture

All Story components follow a consistent pattern:

```javascript
// Standard component structure
export class Component {
    constructor(options = {}) {
        this.options = { ...defaults, ...options };
        this.element = this.create();
    }
    
    create() { /* Build DOM */ }
    setValue() { /* Update value */ }
    getValue() { /* Return value */ }
    setDisabled() { /* Toggle disabled */ }
    destroy() { /* Cleanup */ }
}
```

### 1.2 Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root DOM element |
| `options` | `Object` | Configuration options |
| `value` | `any` | Current component value |

### 1.3 Common Methods

| Method | Description |
|--------|-------------|
| `setValue(value, triggerCallback?)` | Update component value |
| `getValue()` | Get current value |
| `setDisabled(disabled)` | Enable/disable component |
| `destroy()` | Remove and cleanup |

---

## 2. Button Components

### 2.1 Button

A unified button component with multiple variants and sizes.

**Import:**
```javascript
import { Button } from './src/ui/components/Button.js';
```

**Usage:**
```javascript
const button = new Button({
    label: 'Save',
    icon: '<svg>...</svg>',
    iconPosition: 'left',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
    loading: false,
    active: false,
    title: 'Save document',
    ariaLabel: 'Save document',
    type: 'button',
    className: '',
    onClick: (e) => handleClick(e)
});

container.appendChild(button.element);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `''` | Button text |
| `icon` | `string` | `''` | SVG icon string |
| `iconPosition` | `'left'` \| `'right'` | `'left'` | Icon placement |
| `variant` | `string` | `'secondary'` | Style variant |
| `size` | `string` | `'md'` | Size variant |
| `fullWidth` | `boolean` | `false` | Stretch to 100% width |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Show loading spinner |
| `active` | `boolean` | `false` | Toggle/selected state |
| `title` | `string` | `''` | Tooltip text |
| `ariaLabel` | `string` | `''` | Accessibility label |
| `type` | `string` | `'button'` | Button type attribute |
| `onClick` | `function` | `null` | Click handler |

**Size Variants:**

| Size | Height | Usage |
|------|--------|-------|
| `xs` | 24px | Icon buttons, compact spaces |
| `sm` | 28px | Compact buttons in panels |
| `md` | 32px | Default size |
| `lg` | 40px | Prominent CTAs, modals |

**Style Variants:**

| Variant | Description | CSS Class |
|---------|-------------|-----------|
| `primary` | Accent background, white text | `.btn--primary` |
| `secondary` | Subtle background, border | `.btn--secondary` |
| `text` | Transparent background | `.btn--text` |
| `danger` | Red on hover | `.btn--danger` |

**Methods:**

```javascript
button.setDisabled(true);      // Disable button
button.setLoading(true);       // Show loading state
button.setActive(true);        // Toggle selected state
button.setLabel('Saving...');  // Update label
button.setIcon('<svg>...');    // Update icon
button.setVariant('primary');  // Change variant
button.focus();                // Focus button
button.blur();                 // Blur button
button.destroy();              // Remove button
```

**CSS Classes:**

```css
.btn                    /* Base button */
.btn--primary           /* Primary variant */
.btn--secondary         /* Secondary variant */
.btn--text              /* Text variant */
.btn--danger            /* Danger variant */
.btn--xs                /* Extra small */
.btn--sm                /* Small */
.btn--md                /* Medium */
.btn--lg                /* Large */
.btn--full              /* Full width */
.btn--disabled          /* Disabled state */
.btn--loading           /* Loading state */
.btn--active            /* Active/selected */
.btn--icon-only         /* Icon-only button */
.btn__icon              /* Icon element */
.btn__label             /* Label element */
.btn__spinner           /* Loading spinner */
```

---

### 2.2 IconButton (Legacy)

> **Note:** Use `Button` with `icon` and no `label` instead.

Legacy icon button pattern, mapped to new Button system:

```javascript
// Legacy pattern
const iconBtn = document.createElement('button');
iconBtn.className = 'pi-icon-btn';

// Modern equivalent
const iconBtn = new Button({
    icon: Icons.SETTINGS,
    variant: 'text',
    size: 'xs',
    title: 'Settings'
});
```

---

## 3. Input Components

### 3.1 NumberInput

Numeric input with scrubbable label, arrow key support, and pointer lock scrubbing.

**Import:**
```javascript
import { NumberInput } from './src/ui/components/NumberInput.js';
```

**Usage:**
```javascript
const input = new NumberInput({
    label: 'X',
    value: 100,
    min: 0,
    max: 1920,
    step: 1,
    precision: 0,
    units: 'px',
    scrubbable: true,
    onChange: (value, isTransient) => {
        // isTransient = true during scrubbing
        updatePosition(value);
    }
});

container.appendChild(input.element);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `''` | Input label (scrubbable) |
| `value` | `number` | `0` | Initial value |
| `min` | `number` | `-Infinity` | Minimum value |
| `max` | `number` | `Infinity` | Maximum value |
| `step` | `number` | `1` | Increment step |
| `precision` | `number` | `2` | Decimal places |
| `units` | `string` | `''` | Unit suffix (px, %, deg) |
| `scrubbable` | `boolean` | `false` | Enable scrubbing |
| `onChange` | `function` | `()=>{}` | Value change callback |

**Interaction Features:**

| Feature | Behavior |
|---------|----------|
| **Label Scrubbing** | Drag label to adjust value |
| **Pointer Lock** | Infinite scrubbing during drag |
| **Arrow Keys** | Up/Down to increment |
| **Shift+Arrow** | 10x step increment |
| **Alt+Drag** | 0.1x precision mode |
| **Enter** | Confirm and blur |
| **Escape** | Revert and blur |
| **Focus** | Select all text |

**Methods:**

```javascript
input.setValue(150);           // Set value
input.setValue(150, false);    // Set without callback
input.setDisabled(true);       // Disable input
```

**CSS Classes:**

```css
.pi-input-group            /* Container */
.pi-label                  /* Label element */
.pi-input                  /* Input element */
```

---

### 3.2 TextInput

Simple text input with optional label.

**Import:**
```javascript
import { TextInput } from './src/ui/components/TextInput.js';
```

**Usage:**
```javascript
const input = new TextInput({
    label: 'Name',
    value: '',
    placeholder: 'Enter name...',
    onChange: (value) => setName(value)
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `''` | Input label |
| `value` | `string` | `''` | Initial value |
| `placeholder` | `string` | `''` | Placeholder text |
| `onChange` | `function` | `()=>{}` | Change callback |

---

### 3.3 ColorInput

Color swatch with picker flyout integration.

**Import:**
```javascript
import { ColorInput } from './src/ui/components/ColorInput.js';
```

**Usage:**
```javascript
const colorInput = new ColorInput({
    value: '#FF5500',
    showOpacity: true,
    opacity: 100,
    onChange: (color, opacity) => setFill(color, opacity)
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | `'#000000'` | Hex color value |
| `showOpacity` | `boolean` | `true` | Show opacity input |
| `opacity` | `number` | `100` | Opacity percentage |
| `onChange` | `function` | `()=>{}` | Color change callback |

---

### 3.4 MathInput

Input that accepts mathematical expressions.

**Import:**
```javascript
import { MathInput } from './src/ui/components/MathInput.js';
```

**Usage:**
```javascript
const mathInput = new MathInput({
    label: 'Width',
    value: 100,
    onChange: (value) => setWidth(value)
});

// User can type: "100 + 50" → evaluates to 150
// User can type: "200 / 2" → evaluates to 100
```

---

## 4. Selection Controls

### 4.1 Dropdown

Dropdown selection with customizable options.

**Import:**
```javascript
import { Dropdown } from './src/ui/components/Dropdown.js';
```

**Usage:**
```javascript
const dropdown = new Dropdown({
    options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
        { divider: true },
        { label: 'Custom Size...', value: 'custom', action: true }
    ],
    value: 'md',
    placeholder: 'Select size...',
    size: 'md',        // Width variant
    height: null,      // Height variant
    onChange: (value) => setSize(value)
});

container.appendChild(dropdown.element);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options` | `array` | `[]` | Array of option objects |
| `value` | `any` | `null` | Selected value |
| `placeholder` | `string` | `''` | Placeholder when empty |
| `size` | `string` | `null` | Width: xs, sm, md, lg, xl, fill, auto |
| `height` | `string` | `null` | Height: sm, lg (default: md) |
| `onChange` | `function` | `()=>{}` | Selection callback |

**Option Object Shape:**

```javascript
// Regular option
{ label: 'Option Text', value: 'optionValue' }

// Action option (doesn't set value)
{ label: 'Add New...', value: 'add', action: true }

// Divider
{ divider: true }
```

**Methods:**

```javascript
dropdown.setValue('lg');             // Set selection
dropdown.setOptions([...newOptions]); // Update options
dropdown.open();                     // Open menu
dropdown.close();                    // Close menu
dropdown.toggle();                   // Toggle menu
```

**CSS Classes:**

```css
.dropdown-container        /* Main container */
.dropdown-trigger          /* Trigger button */
.dropdown-arrow            /* Arrow indicator */
.dropdown-menu             /* Floating menu */
.dropdown-item             /* Menu item */
.dropdown-item.selected    /* Selected item */
.dropdown-item.action      /* Action item */
.dropdown-divider          /* Divider line */
```

---

### 4.2 SegmentedControl

Mutually exclusive button group.

**Import:**
```javascript
import { SegmentedControl } from './src/ui/components/SegmentedControl.js';
```

**Usage:**
```javascript
// With labels
const alignControl = new SegmentedControl({
    options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
    ],
    value: 'left',
    onChange: (value) => setAlignment(value)
});

// With icons
const alignControl = new SegmentedControl({
    options: [
        { label: 'Left', icon: '<svg>...</svg>', value: 'left' },
        { label: 'Center', icon: '<svg>...</svg>', value: 'center' },
        { label: 'Right', icon: '<svg>...</svg>', value: 'right' }
    ],
    value: 'left',
    onChange: (value) => setAlignment(value)
});

// Legacy positional arguments (deprecated)
const control = new SegmentedControl(options, value, onChange);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options` | `array` | `[]` | Array of option objects |
| `value` | `any` | `undefined` | Selected value |
| `onChange` | `function` | `undefined` | Selection callback |

**Option Object Shape:**

```javascript
{
    label: 'Display Text',  // Text or tooltip if icon
    value: 'optionValue',   // Value to return
    icon: '<svg>...</svg>'  // Optional icon (hides label)
}
```

---

### 4.3 Switch

Toggle switch for boolean values.

**Import:**
```javascript
import { Switch } from './src/ui/components/Switch.js';
```

**Usage:**
```javascript
const toggle = new Switch('Enable Feature', false, (value) => {
    setFeatureEnabled(value);
});

container.appendChild(toggle.element);
```

**Constructor Arguments:**

| Argument | Type | Description |
|----------|------|-------------|
| `label` | `string` | Label text |
| `initialValue` | `boolean` | Initial on/off state |
| `onChange` | `function` | Toggle callback |

**Visual States:**

| State | Track Color | Thumb Position |
|-------|-------------|----------------|
| Off | `--color-border` | Left |
| On | `--color-accent` | Right |

---

### 4.4 SliderControl

Range slider with label scrubbing and numeric input.

**Import:**
```javascript
import { SliderControl } from './src/ui/components/SliderControl.js';
```

**Usage:**
```javascript
const slider = new SliderControl({
    label: 'Opacity',
    value: 100,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    labelWidth: 80,
    inputWidth: 48,
    disabled: false,
    onChange: (value) => setOpacity(value)
});

container.appendChild(slider.element);
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `'Value'` | Slider label |
| `value` | `number` | `0` | Initial value |
| `min` | `number` | `-100` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `unit` | `string` | `''` | Unit suffix |
| `labelWidth` | `number` | `80` | Label width (px) |
| `inputWidth` | `number` | `48` | Input width (px) |
| `disabled` | `boolean` | `false` | Disabled state |
| `onChange` | `function` | `()=>{}` | Value callback |

**Interaction Features:**

| Feature | Behavior |
|---------|----------|
| **Track Click** | Jump to position |
| **Thumb Drag** | Adjust value |
| **Label Scrubbing** | Drag label to adjust |
| **Keyboard** | Arrow keys, Home/End |
| **Shift+Drag** | 10x step |

**Bidirectional Mode:**

When `min < 0` and `max > 0`, the slider fills from center:

```
Negative                         Positive
←───────│●──────────────────────────────→
        0        50         100
```

**Methods:**

```javascript
slider.setValue(50);           // Set value
slider.getValue();             // Get current value
slider.setDisabled(true);      // Disable slider
slider.reset();                // Reset to 0
slider.destroy();              // Cleanup
```

**CSS Classes:**

```css
.slider-control               /* Container */
.slider-control--disabled     /* Disabled state */
.slider-control__label        /* Label element */
.slider-control__track-container
.slider-control__track        /* Track element */
.slider-control__fill         /* Fill element */
.slider-control__thumb        /* Thumb element */
.slider-control__thumb--active
.slider-control__input        /* Number input */
```

---

### 4.5 Knob (Rotary Control)

Circular knob control for rotational values.

**Import:**
```javascript
import { Knob } from './src/ui/components/Knob.js';
```

**Usage:**
```javascript
const rotationKnob = new Knob({
    value: 0,
    min: -180,
    max: 180,
    onChange: (value) => setRotation(value)
});
```

---

## 5. Container Components

### 5.1 Flyout

Floating panel that appears near a trigger element.

**Import:**
```javascript
import { Flyout } from './src/ui/components/Flyout.js';
```

**Usage:**
```javascript
const content = document.createElement('div');
content.innerHTML = '<p>Flyout content here</p>';

const flyout = new Flyout({
    trigger: buttonElement,
    content: content,
    position: 'left',
    onClose: () => console.log('Flyout closed')
});

// Open/close
flyout.open();
flyout.close();
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trigger` | `HTMLElement` | `null` | Element to position near |
| `content` | `HTMLElement` | `null` | Flyout content |
| `position` | `string` | `'left'` | Position: left, right, bottom |
| `onClose` | `function` | `()=>{}` | Close callback |

**Positioning Logic:**

1. Attempts to position on preferred side
2. Flips to opposite side if insufficient space
3. Clamps to viewport edges

**CSS Styling:**

```css
.ui-flyout {
    position: fixed;
    z-index: 1000;
    background: var(--color-bg-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-floating);
    padding: var(--spacing-2);
    min-width: 200px;
}
```

---

### 5.2 Section

Collapsible section with header.

**Import:**
```javascript
import { Section } from './src/ui/components/Section.js';
```

**Usage:**
```javascript
const section = new Section({
    title: 'Advanced Options',
    collapsed: false,
    onToggle: (isCollapsed) => savePreference(isCollapsed)
});

section.addContent(myContent);
container.appendChild(section.element);
```

---

### 5.3 DraggablePanel

Panel that can be dragged to reposition.

**Import:**
```javascript
import { DraggablePanel } from './src/ui/components/DraggablePanel.js';
```

**Usage:**
```javascript
const panel = new DraggablePanel({
    title: 'Inspector',
    width: 280,
    height: 400,
    x: 100,
    y: 100
});

panel.setContent(inspectorContent);
document.body.appendChild(panel.element);
```

---

## 6. Feedback Components

### 6.1 AlertModal

Confirmation/alert dialog.

**Import:**
```javascript
import { AlertModal } from './src/ui/components/AlertModal.js';
```

**Usage:**
```javascript
const alert = new AlertModal({
    title: 'Delete Item?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => deleteItem(),
    onCancel: () => console.log('Cancelled')
});

alert.show();
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `''` | Dialog title |
| `message` | `string` | `''` | Dialog message |
| `confirmText` | `string` | `'OK'` | Confirm button text |
| `cancelText` | `string` | `'Cancel'` | Cancel button text |
| `variant` | `string` | `'default'` | Style: default, danger |
| `onConfirm` | `function` | `()=>{}` | Confirm callback |
| `onCancel` | `function` | `()=>{}` | Cancel callback |

---

### 6.2 EmptyState

Placeholder for empty content areas.

**Import:**
```javascript
import { EmptyState } from './src/ui/components/EmptyState.js';
```

**Usage:**
```javascript
const empty = new EmptyState({
    icon: '<svg>...</svg>',
    title: 'No Items',
    description: 'Create your first item to get started.',
    actionLabel: 'Create Item',
    onAction: () => createItem()
});

container.appendChild(empty.element);
```

---

## 7. Specialized Components

### 7.1 ThemeSwatches

Color theme swatch grid for color pickers.

**Import:**
```javascript
import { ThemeSwatches } from './src/ui/components/ThemeSwatches.js';
```

**Usage:**
```javascript
const swatches = new ThemeSwatches({
    colors: themeColors,
    selectedSlot: 'accent1',
    onSelect: (slot, color) => applyThemeColor(slot, color)
});
```

---

### 7.2 Context Menu

Right-click context menu system.

**Location:** `src/ui/components/ContextMenu/`

**Usage:**
```javascript
import { ContextMenuManager } from './src/ui/components/ContextMenu/ContextMenuManager.js';

const menu = ContextMenuManager.show({
    x: event.clientX,
    y: event.clientY,
    items: [
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => cut() },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => copy() },
        { label: 'Paste', shortcut: 'Ctrl+V', action: () => paste() },
        { type: 'separator' },
        { label: 'Delete', action: () => deleteSelection() }
    ]
});
```

**Menu Item Types:**

```javascript
// Regular item
{ label: 'Action', action: () => {} }

// With shortcut
{ label: 'Action', shortcut: 'Ctrl+A', action: () => {} }

// With icon
{ label: 'Action', icon: '<svg>...</svg>', action: () => {} }

// Disabled
{ label: 'Action', disabled: true }

// Separator
{ type: 'separator' }

// Submenu
{ label: 'More', submenu: [...items] }

// Checkbox
{ label: 'Toggle', checked: true, action: () => {} }
```

---

### 7.3 FillFlyout

Specialized flyout for fill properties (solid, gradient, image, video, code).

**Location:** `src/ui/components/FillFlyout/`

---

### 7.4 StrokeFlyout

Specialized flyout for stroke properties.

**Location:** `src/ui/components/StrokeFlyout/`

---

### 7.5 TypeSettingsFlyout

Typography settings panel.

**Import:**
```javascript
import { TypeSettingsFlyout } from './src/ui/components/TypeSettingsFlyout.js';
```

---

### 7.6 AppMenu

Application menu bar component.

**Location:** `src/ui/components/AppMenu/`

---

## 8. Usage Guidelines

### 8.1 Component Selection Guide

| Need | Component | Example |
|------|-----------|---------|
| User action | `Button` | Save, Cancel, Submit |
| Numeric value | `NumberInput` | Position, size, opacity |
| Text value | `TextInput` | Name, URL, search |
| Color selection | `ColorInput` | Fill, stroke color |
| Single selection | `Dropdown` | Font family, blend mode |
| Toggle options | `SegmentedControl` | Alignment, fit mode |
| On/Off toggle | `Switch` | Enable/disable feature |
| Range value | `SliderControl` | Volume, opacity, blur |
| Confirmation | `AlertModal` | Delete, discard changes |
| Empty content | `EmptyState` | No items, no results |
| Floating UI | `Flyout` | Color picker, settings |

### 8.2 Accessibility Checklist

- [ ] All buttons have accessible labels (`title` or `ariaLabel`)
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Focus states are visible
- [ ] Disabled states are announced
- [ ] Loading states use `aria-busy`

### 8.3 Performance Tips

1. **Lazy initialization**: Create components only when needed
2. **Event cleanup**: Call `destroy()` when removing components
3. **Batch updates**: Group value changes to minimize repaints
4. **Debounce callbacks**: For high-frequency updates (scrubbing)

### 8.4 Styling Guidelines

1. **Never use inline styles** for anything that could be a CSS class
2. **Always use design tokens** via `var(--token-name)`
3. **Use BEM naming** for new CSS classes
4. **Test in both themes** (light and dark mode)

```css
/* Good: Uses tokens */
.my-component {
    background: var(--color-bg-panel);
    padding: var(--spacing-3);
}

/* Bad: Hardcoded values */
.my-component {
    background: #2D2D2D;
    padding: 12px;
}
```

---

## Appendix: Component Quick Reference

### Import Statements

```javascript
// Core UI Components
import { Button } from './src/ui/components/Button.js';
import { Dropdown } from './src/ui/components/Dropdown.js';
import { NumberInput } from './src/ui/components/NumberInput.js';
import { TextInput } from './src/ui/components/TextInput.js';
import { ColorInput } from './src/ui/components/ColorInput.js';
import { Switch } from './src/ui/components/Switch.js';
import { SegmentedControl } from './src/ui/components/SegmentedControl.js';
import { SliderControl } from './src/ui/components/SliderControl.js';
import { Knob } from './src/ui/components/Knob.js';
import { MathInput } from './src/ui/components/MathInput.js';

// Container Components
import { Flyout } from './src/ui/components/Flyout.js';
import { Section } from './src/ui/components/Section.js';
import { DraggablePanel } from './src/ui/components/DraggablePanel.js';

// Feedback Components
import { AlertModal } from './src/ui/components/AlertModal.js';
import { EmptyState } from './src/ui/components/EmptyState.js';

// Specialized Components
import { ThemeSwatches } from './src/ui/components/ThemeSwatches.js';
import { TypeSettingsFlyout } from './src/ui/components/TypeSettingsFlyout.js';
import { FillTypeSelector } from './src/ui/components/FillTypeSelector.js';
```

### CSS Class Reference

```css
/* Buttons */
.btn, .btn--primary, .btn--secondary, .btn--text, .btn--danger
.btn--xs, .btn--sm, .btn--md, .btn--lg
.btn--disabled, .btn--loading, .btn--active, .btn--icon-only

/* Inputs */
.pi-input-group, .pi-label, .pi-input

/* Dropdowns */
.dropdown-container, .dropdown-trigger, .dropdown-menu, .dropdown-item

/* Sliders */
.slider-control, .slider-control__track, .slider-control__thumb

/* Flyouts */
.ui-flyout, .flyout-tab-header, .flyout-tab-btn, .flyout-tab-content

/* Panels */
.panel-header, .panel-content, .panel-footer
```

---

*Last Updated: December 2024*
*Version: 1.0*
