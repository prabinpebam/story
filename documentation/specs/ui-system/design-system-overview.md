# Story Design System Overview

> **A comprehensive guide to the Story application's design system, framework architecture, and implementation details.**

## Table of Contents

1. [Introduction](#1-introduction)
2. [Design Philosophy](#2-design-philosophy)
3. [Architecture Overview](#3-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Design Token System](#5-design-token-system)
6. [Component Architecture](#6-component-architecture)
7. [Theming System](#7-theming-system)
8. [Accessibility](#8-accessibility)
9. [Getting Started](#9-getting-started)
10. [Related Documentation](#10-related-documentation)

---

## 1. Introduction

### 1.1 What is the Story Design System?

The Story Design System is a comprehensive framework that provides:

- **Design Tokens**: Standardized variables for colors, typography, spacing, and more
- **Component Library**: Reusable UI components built with vanilla JavaScript
- **Interaction Patterns**: Consistent behavior patterns across all UI elements
- **Theming Infrastructure**: Multi-theme support with light/dark mode variants
- **Development Guidelines**: Standards for maintaining consistency

### 1.2 Design System Goals

| Goal | Description |
|------|-------------|
| **Consistency** | Unified visual language across all UI surfaces |
| **Efficiency** | Rapid development through reusable components |
| **Maintainability** | Centralized tokens enable global updates |
| **Accessibility** | WCAG-compliant patterns built-in |
| **Themability** | Support for multiple themes and modes |

### 1.3 Target Audience

This documentation is intended for:
- **Developers** implementing new features
- **Designers** creating new UI patterns
- **Contributors** understanding the codebase
- **QA Engineers** validating UI consistency

---

## 2. Design Philosophy

### 2.1 Core Principles

#### Content First
The UI recedes to let the user's work take center stage. We minimize chrome and maximize canvas space.

#### High Density
Controls are compact to maximize screen real estate, following professional creative tool conventions (similar to Figma, Sketch).

#### Clear Hierarchy
We use contrast and spacing—not decoration—to group related controls and establish visual hierarchy.

#### Tactile Feedback
Every interaction provides immediate, clear feedback through hover states, focus rings, and active states.

#### Token-First Development
All visual properties MUST use CSS custom properties. Never hardcode values in components.

### 2.2 The 7-Step Scale Philosophy

All design tokens follow a **7-step scale** (XXS, XS, S, M, L, XL, XXL) or numeric variants. This ensures:

- **Predictability**: Developers always know what sizes are available
- **Consistency**: Values are proportionally related across the scale
- **Simplicity**: No arbitrary values or "magic numbers"

```
Scale: 2xs → xs → sm → md → lg → xl → 2xl
       ─────────────────────────────────────►
       smallest                       largest
```

### 2.3 Visual Consistency Principle

> **Rule**: If two components solve the same user problem or provide the same type of interaction, they should be visually indistinguishable.

**Example**: Dropdown menus and context menus both allow users to pick from a list. Therefore, they use identical:
- Background colors
- Border treatments
- Hover states
- Typography
- Item heights

### 2.4 The "Before You Add" Checklist

Before creating a new token or value, ask:

- [ ] Does this fit within the existing scale?
- [ ] Can I use an existing token instead?
- [ ] Does this variation serve a clear functional purpose?
- [ ] Will this value be reused in at least 3 places?
- [ ] Does this maintain visual hierarchy with existing values?

**If you answer "no" to any of these, use an existing token.**

---

## 3. Architecture Overview

### 3.1 System Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│    Features, views, and application-specific logic                       │
├─────────────────────────────────────────────────────────────────────────┤
│                           COMPONENT LAYER                                │
│    Reusable UI components (Button, Dropdown, Slider, etc.)              │
├─────────────────────────────────────────────────────────────────────────┤
│                           TOKEN LAYER                                    │
│    Design tokens defined in CSS custom properties                        │
├─────────────────────────────────────────────────────────────────────────┤
│                           FOUNDATION LAYER                               │
│    Base styles, resets, typography, and layout primitives               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 File Structure

```
story/
├── styles/
│   └── modules/
│       ├── variables.css       # Design tokens (source of truth)
│       ├── base.css           # Reset and foundation styles
│       ├── layout.css         # Layout primitives
│       ├── button.css         # Button component styles
│       ├── dropdown.css       # Dropdown styles
│       ├── flyout-components.css
│       ├── panel-components.css
│       ├── property-inspector.css
│       └── [component].css    # Component-specific styles
│
├── src/ui/
│   └── components/
│       ├── Button.js          # Button component
│       ├── Dropdown.js        # Dropdown component
│       ├── NumberInput.js     # Numeric input with scrubbing
│       ├── SliderControl.js   # Slider with label
│       ├── SegmentedControl.js
│       ├── Switch.js
│       ├── Flyout.js
│       └── [Component].js     # Additional components
│
└── documentation/
    └── specs/
        └── design-system/     # Design system documentation
```

### 3.3 Token → Style → Component Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Design Tokens  │────►│   CSS Styles    │────►│   Components    │
│  (variables.css)│     │  (*.css files)  │     │   (*.js files)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         │                      │                       │
    Single source         Reference tokens         Use CSS classes
    of truth for          via var(--token)         and semantic
    all values                                     class names
```

---

## 4. Technology Stack

### 4.1 Frontend Framework

Story uses a **vanilla JavaScript** approach with ES6 modules:

| Technology | Purpose |
|------------|---------|
| **Vanilla JS (ES6+)** | Component logic and state management |
| **CSS Custom Properties** | Design tokens and theming |
| **CSS Modules** | Scoped styling per component |
| **HTML5 Canvas** | Main rendering surface |
| **Vite** | Development server and bundling |

### 4.2 Why Vanilla JavaScript?

1. **No framework lock-in**: Components are portable
2. **Performance**: Direct DOM manipulation without virtual DOM overhead
3. **Simplicity**: Easy to understand and maintain
4. **Control**: Full control over rendering and lifecycle

### 4.3 Component Pattern

Components follow a consistent class-based pattern:

```javascript
export class ComponentName {
    constructor(options = {}) {
        this.options = {
            // Default options with spread override
            ...defaultOptions,
            ...options
        };
        
        this.element = this.create();
    }
    
    create() {
        // Create and return DOM element
        const element = document.createElement('div');
        element.className = 'component-name';
        // ... build component structure
        return element;
    }
    
    // Public methods for state management
    setValue(value) { /* ... */ }
    getValue() { /* ... */ }
    setDisabled(disabled) { /* ... */ }
    destroy() { /* ... */ }
}
```

### 4.4 CSS Architecture

We use a combination of:

1. **BEM Naming**: Block__Element--Modifier convention
2. **Utility Classes**: For common patterns
3. **Component Classes**: Scoped to specific components

```css
/* BEM Example */
.btn { }                    /* Block */
.btn__icon { }              /* Element */
.btn--primary { }           /* Modifier */
.btn--lg { }                /* Size modifier */
.btn--disabled { }          /* State modifier */
```

---

## 5. Design Token System

### 5.1 Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Colors | `--color-` | `--color-bg-app`, `--color-accent` |
| Typography | `--font-` | `--font-size-md`, `--font-weight-bold` |
| Spacing | `--spacing-` | `--spacing-2`, `--spacing-4` |
| Radius | `--radius-` | `--radius-sm`, `--radius-lg` |
| Shadows | `--shadow-` | `--shadow-sm`, `--shadow-floating` |
| Z-Index | `--z-` | `--z-modal`, `--z-tooltip` |
| Transitions | `--transition-` | `--transition-fast` |
| Control Sizes | `--control-size-` | `--control-size-md` |

### 5.2 Color Token Hierarchy

```
Background Colors (darkest to lightest layering):
├── --color-bg-app          # Main application background
├── --color-bg-canvas       # Canvas/viewport background
├── --color-bg-panel        # Sidebars, floating panels
├── --color-bg-elevated     # Modals, popovers
├── --color-bg-input        # Input fields, wells
├── --color-bg-hover        # Hover states (accent-based)
└── --color-bg-active       # Active/pressed states

Text Colors (hierarchy):
├── --color-text-primary    # Main text, headings
├── --color-text-secondary  # Labels, captions
├── --color-text-tertiary   # Hints, placeholders
├── --color-text-disabled   # Disabled states
└── --color-text-on-accent  # Text on accent backgrounds

Border Colors:
├── --color-border          # Default borders
├── --color-border-subtle   # Subtle separators
├── --color-border-strong   # Emphasized borders
├── --color-border-hover    # Hover state borders
└── --color-border-focus    # Focus rings

Accent Colors:
├── --color-accent          # Primary accent (Figma Blue)
├── --color-accent-hover    # Hover variant
├── --color-accent-active   # Active variant
├── --color-accent-subtle   # 20% opacity (hover bg)
└── --color-accent-muted    # 35% opacity (active bg)
```

### 5.3 Spacing Scale

Based on a **4px grid**:

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-0` | 0 | Reset |
| `--spacing-0-5` | 2px | Half step |
| `--spacing-1` | 4px | Tight gaps |
| `--spacing-1-5` | 6px | 1.5 step |
| `--spacing-2` | 8px | Standard gaps |
| `--spacing-3` | 12px | Section padding |
| `--spacing-4` | 16px | Component padding |
| `--spacing-5` | 20px | Large gaps |
| `--spacing-6` | 24px | Panel padding |
| `--spacing-8` | 32px | Section margins |
| `--spacing-10` | 40px | Hero spacing |
| `--spacing-12` | 48px | Maximum spacing |

### 5.4 Typography Scale

```css
/* Font Families */
--font-ui: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--font-size-2xs: 9px;    /* Micro labels */
--font-size-xs: 10px;    /* Small labels, badges */
--font-size-sm: 11px;    /* Property labels */
--font-size-md: 12px;    /* Body text, inputs */
--font-size-lg: 13px;    /* Section headers */
--font-size-xl: 14px;    /* Panel titles */
--font-size-2xl: 16px;   /* Modal headers */
--font-size-3xl: 20px;   /* Large headers */
--font-size-4xl: 24px;   /* Display text */

/* Font Weights */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 5.5 Control Size Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--control-size-xs` | 20px | Micro controls |
| `--control-size-sm` | 24px | Compact controls |
| `--control-size-md` | 28px | Default controls |
| `--control-size-lg` | 32px | Comfortable controls |
| `--control-size-xl` | 40px | Large controls, toolbar |
| `--control-size-2xl` | 48px | Extra large, primary actions |

### 5.6 The "No Magic Numbers" Rule

**CRITICAL**: All numeric values in CSS must use design tokens.

```css
/* ❌ WRONG - Magic numbers */
.component {
    padding: 6px 10px;
    font-size: 13px;
    border-radius: 5px;
}

/* ✅ CORRECT - Design tokens */
.component {
    padding: var(--spacing-1-5) var(--spacing-2-5);
    font-size: var(--font-size-lg);
    border-radius: var(--radius-sm);
}
```

---

## 6. Component Architecture

### 6.1 Component Categories

| Category | Components | Purpose |
|----------|------------|---------|
| **Buttons** | Button, IconButton | User actions |
| **Inputs** | NumberInput, TextInput, ColorInput | Data entry |
| **Controls** | Dropdown, SegmentedControl, Switch, Slider | Selection/adjustment |
| **Containers** | Flyout, Panel, Modal, Section | Layout and grouping |
| **Feedback** | AlertModal, EmptyState | User communication |

### 6.2 Component API Pattern

All components follow a consistent API:

```javascript
// Construction with options object
const button = new Button({
    label: 'Save',
    variant: 'primary',
    size: 'md',
    onClick: () => handleSave()
});

// Access DOM element
container.appendChild(button.element);

// State management methods
button.setDisabled(true);
button.setLoading(true);
button.setLabel('Saving...');

// Cleanup
button.destroy();
```

### 6.3 Size Variants

Most components support size variants:

| Size | Height | Usage |
|------|--------|-------|
| `xs` | 24px | Icon buttons, compact spaces |
| `sm` | 28px | Compact buttons in panels |
| `md` | 32px | Default size |
| `lg` | 40px | Prominent CTAs, modals |

### 6.4 Style Variants

Buttons and similar components support style variants:

| Variant | Description | Usage |
|---------|-------------|-------|
| `primary` | Accent background | Main CTAs |
| `secondary` | Subtle background + border | Default style |
| `text` | Transparent | Minimal/inline |
| `danger` | Red on hover | Destructive actions |

### 6.5 Component State Management

Components manage internal state and expose methods for external control:

```javascript
// Internal state
this.value = initialValue;
this.isOpen = false;
this.isDisabled = false;

// External state control
setValue(newValue, triggerCallback = true) {
    this.value = clamp(newValue, min, max);
    this.updateVisuals();
    if (triggerCallback) this.options.onChange(this.value);
}
```

---

## 7. Theming System

### 7.1 Multi-Theme Architecture

```
Theme = {
    name: "Story Default" | "Purple" | "Teal" | "Orange" | "Pink",
    mode: "light" | "dark",
    tokens: {
        colors: { accent, backgrounds, text, borders },
        // Typography, spacing, etc. remain consistent
    }
}
```

### 7.2 Theme Class Structure

```css
/* Theme is set on <html> via class */
:root { /* Default dark theme tokens */ }
:root.theme-purple { /* Purple accent overrides */ }
:root.theme-teal { /* Teal accent overrides */ }
:root.theme-orange { /* Orange accent overrides */ }
:root.theme-pink { /* Pink accent overrides */ }

/* Mode is set on <body> via class */
body.theme-light { /* Light mode color overrides */ }
```

### 7.3 Available Theme Variants

| Theme | Accent Color | Description |
|-------|--------------|-------------|
| Default | `#18A0FB` (Blue) | Primary brand color |
| Purple | `#7C3AED` | Creative/playful |
| Teal | `#14B8A6` | Fresh/modern |
| Orange | `#F97316` | Energetic/warm |
| Pink | `#EC4899` | Bold/expressive |

### 7.4 Theme Switching

```javascript
// Switch accent theme
document.documentElement.className = 'theme-purple';

// Toggle light/dark mode
document.body.classList.toggle('theme-light');
```

### 7.5 Theme Validation Test

> **The Ultimate Litmus Test**: If switching themes breaks any component, that component has hardcoded values that need to be fixed.

| If This Breaks... | It Means... |
|-------------------|-------------|
| Colors don't change | Hardcoded hex values exist |
| Layout breaks | Hardcoded pixel values |
| Fonts don't change | Hardcoded font-family |
| Hover states stay blue | Accent color not tokenized |

---

## 8. Accessibility

### 8.1 Focus Management

All interactive elements support keyboard navigation:

```css
/* Focus ring for keyboard navigation */
.btn:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
}

/* Remove focus outline for mouse users */
.btn:focus {
    outline: none;
}
```

### 8.2 ARIA Attributes

Components include appropriate ARIA attributes:

```javascript
// Button with loading state
button.setAttribute('aria-busy', 'true');

// Icon-only buttons need labels
button.setAttribute('aria-label', 'Save document');

// Expandable elements
trigger.setAttribute('aria-expanded', isOpen);
```

### 8.3 Color Contrast

- All text meets WCAG AA contrast requirements
- Interactive elements have sufficient contrast
- Focus indicators are clearly visible
- Themes are designed with accessibility in mind

### 8.4 Keyboard Interactions

| Component | Keyboard Support |
|-----------|-----------------|
| Button | Enter/Space to activate |
| Dropdown | Arrow keys to navigate, Enter to select, Escape to close |
| NumberInput | Arrow Up/Down to increment, Shift for larger steps |
| Slider | Arrow keys, Home/End for min/max |
| Switch | Space to toggle |

---

## 9. Getting Started

### 9.1 Using Design Tokens

```css
/* In your CSS file */
.my-component {
    background: var(--color-bg-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-3);
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
}

.my-component:hover {
    background: var(--color-bg-hover);
}
```

### 9.2 Using Components

```javascript
import { Button } from './src/ui/components/Button.js';
import { Dropdown } from './src/ui/components/Dropdown.js';
import { NumberInput } from './src/ui/components/NumberInput.js';

// Create a button
const saveBtn = new Button({
    label: 'Save',
    variant: 'primary',
    size: 'md',
    onClick: () => saveDocument()
});

// Create a dropdown
const fontDropdown = new Dropdown({
    options: [
        { label: 'Arial', value: 'arial' },
        { label: 'Helvetica', value: 'helvetica' },
        { label: 'Inter', value: 'inter' }
    ],
    value: 'inter',
    onChange: (value) => setFont(value)
});

// Create a number input
const sizeInput = new NumberInput({
    label: 'Size',
    value: 16,
    min: 8,
    max: 144,
    step: 1,
    units: 'px',
    scrubbable: true,
    onChange: (value) => setFontSize(value)
});

// Add to DOM
container.appendChild(saveBtn.element);
container.appendChild(fontDropdown.element);
container.appendChild(sizeInput.element);
```

### 9.3 Creating New Components

Follow the established pattern:

```javascript
/**
 * MyComponent.js
 * Description of what this component does.
 * 
 * DESIGN SYSTEM COMPLIANCE:
 * - Uses only CSS custom properties (design tokens)
 * - Supports dark and light themes automatically
 * - All interactions use accent color
 */
export class MyComponent {
    constructor(options = {}) {
        this.options = {
            // Define all options with defaults
            value: '',
            disabled: false,
            onChange: () => {},
            ...options
        };
        
        this.element = this.create();
    }
    
    create() {
        const container = document.createElement('div');
        container.className = 'my-component';
        // Build component structure...
        return container;
    }
    
    // Public API
    setValue(value) { /* ... */ }
    getValue() { return this.value; }
    setDisabled(disabled) { /* ... */ }
    destroy() { this.element.remove(); }
}
```

---

## 10. Related Documentation

### Design System Documentation

- [UI Design System](./ui-design-system.md) - Detailed token reference
- [Interaction Patterns](./interaction-patterns.md) - User-facing interaction behavior
- [Theme Architecture](./theme-architecture.md) - App theme management
- [Typography System](../typography-system/00-index.md) - Typography architecture and workflows
- [Theme Architecture](./theme-architecture.md) - Technical theming details
- [Linked Properties System](../slides/themes/linked-properties-system.md) - Property linking

### Component Documentation

- [Component Library](./component-library.md) - Full component reference
- [Design Tokens Reference](./design-tokens-reference.md) - Complete token list
- [Interaction Patterns](./interaction-patterns.md) - UX patterns

### Implementation Guides

- [Story Delivery Roadmap](../../product/delivery-roadmap.md)
- [Product Requirement Status](../../product/requirement-status.md)

---

## Appendix: Quick Reference

### Token Cheat Sheet

```css
/* Backgrounds */
--color-bg-app           /* Main app background */
--color-bg-panel         /* Panel backgrounds */
--color-bg-elevated      /* Modals, popovers */
--color-bg-input         /* Input fields */
--color-bg-hover         /* Hover states */

/* Text */
--color-text-primary     /* Main text */
--color-text-secondary   /* Labels */
--color-text-on-accent   /* Text on accent */

/* Accent */
--color-accent           /* Primary accent */
--color-accent-subtle    /* Hover background */
--color-accent-muted     /* Active background */

/* Borders */
--color-border           /* Default borders */
--color-border-focus     /* Focus rings */

/* Sizes */
--spacing-2              /* 8px - standard gap */
--spacing-4              /* 16px - component padding */
--radius-sm              /* 4px - inputs, buttons */
--radius-md              /* 6px - cards, dropdowns */
--control-size-md        /* 28px - default control */

/* Typography */
--font-size-sm           /* 11px - labels */
--font-size-md           /* 12px - body text */
--font-weight-medium     /* 500 - emphasis */
```

### Component Import Reference

```javascript
// Core Components
import { Button } from './src/ui/components/Button.js';
import { Dropdown } from './src/ui/components/Dropdown.js';
import { NumberInput } from './src/ui/components/NumberInput.js';
import { TextInput } from './src/ui/components/TextInput.js';
import { ColorInput } from './src/ui/components/ColorInput.js';
import { Switch } from './src/ui/components/Switch.js';
import { SegmentedControl } from './src/ui/components/SegmentedControl.js';
import { SliderControl } from './src/ui/components/SliderControl.js';
import { Flyout } from './src/ui/components/Flyout.js';
import { AlertModal } from './src/ui/components/AlertModal.js';
import { EmptyState } from './src/ui/components/EmptyState.js';
```

---

*Last Updated: December 2024*
*Version: 1.0*
