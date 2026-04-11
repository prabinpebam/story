# Z-Index Strategy Specification

> **Status:** Draft  
> **Last Updated:** 2024-01-15  
> **Author:** Story Design System Team

## Overview

This specification defines an exhaustive, principled approach to z-index management across the Story application. It establishes a clear layering hierarchy, provides semantic tokens, and outlines rules for resolving stacking context conflicts.

---

## Table of Contents

1. [Current State Audit](#current-state-audit)
2. [Layer Categories](#layer-categories)
3. [Token Scale](#token-scale)
4. [Component-Specific Guidelines](#component-specific-guidelines)
5. [Stacking Context Rules](#stacking-context-rules)
6. [Migration Plan](#migration-plan)
7. [Anti-Patterns](#anti-patterns)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Current State Audit

### Summary of Issues

| Issue | Count | Impact |
|-------|-------|--------|
| Hardcoded z-index values | 45+ | Inconsistent layering |
| Values > 10000 | 8 | Escalation pattern |
| Missing token usage | 30+ | No semantic meaning |
| Stacking context conflicts | 5 | UI bugs |

### Complete Z-Index Inventory

#### CSS Files - Hardcoded Values

| File | Value(s) | Purpose | Status |
|------|----------|---------|--------|
| `canvas.css` | 1000 | Canvas overlay | ⚠️ Migrate |
| `cloud-file-browser.css` | 10000 | Cloud browser modal | ⚠️ Migrate |
| `floating-ui.css` | 1900, 2000 | Floating UI elements | ⚠️ Migrate |
| `flyout-components.css` | 1, 10, 10000, 10002 | Internal layers, color picker | ⚠️ Migrate |
| `linked-properties.css` | 1, 10 | Internal element layering | ✅ OK (local) |
| `master-mode.css` | 9999 | Master mode overlay | ⚠️ Migrate |
| `media-fills.css` | 10 | Internal layering | ✅ OK (local) |
| `panel-components.css` | 1, 10, 1000, 10000 | Panel internal layers | ⚠️ Migrate |
| `presentation.css` | 9999, 10000, 10001, 10002 | Presentation mode layers | ⚠️ Migrate |
| `sharing.css` | 10, 1000 | Sharing modal | ⚠️ Migrate |
| `docs.css` | 50, 100, 1000 | Documentation site | ✅ Separate |
| `component-demo.css` | 9999, 10000 | Demo toast, dropdown | ✅ Separate |

#### CSS Files - Using Tokens

| File | Token(s) | Status |
|------|----------|--------|
| `auth.css` | `--z-modal-backdrop`, `--z-dropdown` | ✅ Good |
| `context-menu.css` | `--z-popover` | ✅ Good |
| `file-service.css` | `--z-toast` | ✅ Good |
| `file-indicator.css` | `--z-floating`, `--z-modal` | ✅ Good |
| `alert-modal.css` | `--z-modal-backdrop` | ✅ Good |
| `app-menu.css` | `--z-dropdown` | ✅ Good |
| `flyout-components.css` | `--z-tooltip`, `--z-popover` | ✅ Good |
| `modal.css` | `--z-modal-backdrop` | ✅ Good |
| `layout.css` | `--z-fixed` | ✅ Good |

#### JavaScript Files - Hardcoded Values

| File | Value(s) | Purpose | Status |
|------|----------|---------|--------|
| `CanvasManager.js` | 100 | Canvas element | ⚠️ Review |
| `CursorManager.js` | 10000 | Collaboration cursors | ⚠️ Migrate |
| `AnimationManager.js` | 1, 2, 100 | Animation layer ordering | ✅ OK (local) |
| `PanelManager.js` | 1000+ | Dynamic panel stacking | ⚠️ Review |
| `DraggablePanel.js` | 1000+ | Panel focus management | ⚠️ Review |
| `Flyout.js` | 1000 | Base flyout z-index | ⚠️ Migrate |
| `ColorPickerFlyout.js` | 10001 | Above FillFlyout | ⚠️ Migrate |
| `FileIndicatorMenu.js` | `var(--z-dropdown, 1000)` | ✅ Good |
| `FillSection.js` | `var(--z-popover)` | ✅ Good |
| `StrokeSection.js` | `var(--z-popover)` | ✅ Good |
| `TextSection.js` | `var(--z-popover)` | ✅ Good |
| `LegacyTextSection.js` | 1000 | Legacy popover | ⚠️ Migrate |
| `ShapeElement.js` | dynamic | Fill/stroke layers | ✅ OK (local) |
| `SlideView.js` | 0, 100+ | Background, fill layers | ✅ OK (local) |
| `VisualElement.js` | `el.zIndex || 'auto'` | Element z-index | ✅ OK |
| `GradientTab.js` | 1, 10 | Gradient stop handles | ✅ OK (local) |

---

## Layer Categories

### Conceptual Layer Model

The application uses a **7-tier layering model** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 7: System Overlays (z: 9000-10000)                    │
│  ├── Presentation mode                                       │
│  ├── Collaboration cursors                                   │
│  └── Master mode overlay                                     │
├─────────────────────────────────────────────────────────────┤
│  TIER 6: Notifications (z: 1700-1800)                       │
│  └── Toast notifications                                     │
├─────────────────────────────────────────────────────────────┤
│  TIER 5: Tooltips (z: 1600)                                 │
│  └── Tooltip popups                                          │
├─────────────────────────────────────────────────────────────┤
│  TIER 4: Popovers & Context Menus (z: 1500)                 │
│  ├── Context menus                                           │
│  ├── Color picker popover                                    │
│  └── Rich popovers                                           │
├─────────────────────────────────────────────────────────────┤
│  TIER 3: Modals (z: 1300-1400)                              │
│  ├── Modal backdrop (1300)                                   │
│  └── Modal dialogs (1400)                                    │
├─────────────────────────────────────────────────────────────┤
│  TIER 2: Floating UI (z: 1000-1200)                         │
│  ├── Dropdowns & menus (1000)                                │
│  ├── Sticky headers (1100)                                   │
│  ├── Panels & flyouts (1000-1200)                            │
│  └── Fixed elements (1200)                                   │
├─────────────────────────────────────────────────────────────┤
│  TIER 1: Base Content (z: 0-999)                            │
│  ├── Canvas (100)                                            │
│  ├── Slide elements (auto)                                   │
│  └── Background (0)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Layer Categories Explained

| Tier | Category | Z-Range | Description |
|------|----------|---------|-------------|
| 1 | Base Content | 0-999 | Primary application content, canvas, slides |
| 2 | Floating UI | 1000-1200 | Panels, dropdowns, menus, sticky/fixed elements |
| 3 | Modals | 1300-1400 | Modal dialogs and their backdrops |
| 4 | Popovers | 1500 | Context menus, color pickers, rich popovers |
| 5 | Tooltips | 1600 | Informational tooltips |
| 6 | Notifications | 1700-1800 | Toast notifications, alerts |
| 7 | System | 9000-10000 | Presentation mode, collaboration, master mode |

---

## Token Scale

### Current Token Definitions

These tokens are defined in `styles/modules/variables.css`:

```css
/* Z-Index Scale */
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1100;
--z-fixed: 1200;
--z-modal-backdrop: 1300;
--z-modal: 1400;
--z-popover: 1500;
--z-tooltip: 1600;
--z-toast: 1700;
```

### Proposed Extended Token Scale

Add these tokens to complete the system:

```css
/* =========================================================================
   Z-INDEX SCALE (Extended)
   ========================================================================= */

/* Tier 1: Base Content (0-999) */
--z-base: 0;                    /* Default, background */
--z-canvas: 100;                /* Canvas layer */
--z-canvas-overlay: 200;        /* Canvas selection, handles */
--z-local-elevated: 10;         /* Local elevation within component */

/* Tier 2: Floating UI (1000-1200) */
--z-dropdown: 1000;             /* Dropdown menus */
--z-panel: 1000;                /* Base panel layer */
--z-panel-active: 1050;         /* Active/focused panel */
--z-sticky: 1100;               /* Sticky headers */
--z-fixed: 1200;                /* Fixed position elements */

/* Tier 3: Modals (1300-1400) */
--z-modal-backdrop: 1300;       /* Modal overlay/backdrop */
--z-modal: 1400;                /* Modal dialogs */
--z-modal-nested: 1450;         /* Nested modal (rare) */

/* Tier 4: Popovers (1500-1550) */
--z-popover: 1500;              /* Context menus, popovers */
--z-popover-nested: 1550;       /* Nested popover (color picker in flyout) */

/* Tier 5: Tooltips (1600) */
--z-tooltip: 1600;              /* Tooltips */

/* Tier 6: Notifications (1700-1800) */
--z-toast: 1700;                /* Toast notifications */
--z-notification: 1750;         /* System notifications */
--z-alert: 1800;                /* Critical alerts */

/* Tier 7: System Overlays (9000-10000) */
--z-system-overlay: 9000;       /* System-level overlays */
--z-presentation: 9500;         /* Presentation mode base */
--z-presentation-ui: 9600;      /* Presentation mode UI controls */
--z-collaboration: 9800;        /* Collaboration cursors */
--z-master-mode: 9900;          /* Master mode overlay */
--z-fullscreen: 10000;          /* Fullscreen/maximum overlay */
```

### Token Usage Guide

| Use Case | Token | Value |
|----------|-------|-------|
| Background layers | `--z-base` | 0 |
| Canvas | `--z-canvas` | 100 |
| Selection handles | `--z-canvas-overlay` | 200 |
| Dropdown menu | `--z-dropdown` | 1000 |
| Floating panel | `--z-panel` | 1000 |
| Active panel | `--z-panel-active` | 1050 |
| Sticky toolbar | `--z-sticky` | 1100 |
| Fixed sidebar | `--z-fixed` | 1200 |
| Modal backdrop | `--z-modal-backdrop` | 1300 |
| Modal dialog | `--z-modal` | 1400 |
| Context menu | `--z-popover` | 1500 |
| Color picker in flyout | `--z-popover-nested` | 1550 |
| Tooltip | `--z-tooltip` | 1600 |
| Toast message | `--z-toast` | 1700 |
| Presentation mode | `--z-presentation` | 9500 |
| Collaboration cursors | `--z-collaboration` | 9800 |

---

## Component-Specific Guidelines

### Panel System (PanelManager, DraggablePanel)

**Current Behavior:** Panels start at z-index 1000 and increment on focus.

**Recommended Approach:**
```javascript
// PanelManager.js
class PanelManager {
    constructor() {
        // Use CSS variable as base, allow dynamic stacking
        this.baseZIndex = 1000; // --z-panel
        this.maxStackOffset = 50; // Max panels before reset
        this.currentOffset = 0;
    }
    
    bringToFront(panel) {
        this.currentOffset = (this.currentOffset + 1) % this.maxStackOffset;
        panel.element.style.zIndex = this.baseZIndex + this.currentOffset;
    }
}
```

**Principle:** Panels should stay within Tier 2 (1000-1200) and never exceed modal layer.

### Flyouts & Color Pickers

**Current Issue:** ColorPickerFlyout uses hardcoded `10001` to appear above FillFlyout.

**Recommended Approach:**
```css
/* Base flyout */
.fill-flyout {
    z-index: var(--z-dropdown);
}

/* Nested color picker */
.color-picker-flyout {
    z-index: var(--z-popover-nested);
}
```

### Presentation Mode

**Current Values:** 9999, 10000, 10001, 10002

**Recommended Approach:**
```css
/* Presentation mode layers */
.presentation-container {
    z-index: var(--z-presentation);
}

.presentation-controls {
    z-index: var(--z-presentation-ui);
}

.presentation-exit-button {
    z-index: var(--z-presentation-ui);
}
```

### Collaboration Cursors

**Current Value:** 10000 (inline in CursorManager.js)

**Recommended Approach:**
```javascript
// CursorManager.js
const cursorStyle = `
    position: absolute;
    z-index: var(--z-collaboration);
    pointer-events: none;
`;
```

### Context Menus

**Current Token:** `--z-popover` (1500)

**Note:** Context menus should appear above modals when triggered within a modal.

```css
/* Normal context menu */
.context-menu {
    z-index: var(--z-popover);
}

/* Context menu in modal */
.modal .context-menu {
    z-index: calc(var(--z-modal) + 100); /* 1500 */
}
```

### Tooltips

**Principle:** Tooltips should ALWAYS be visible, even over modals.

```css
.tooltip {
    z-index: var(--z-tooltip);
}
```

---

## Stacking Context Rules

### Rule 1: Use Tokens, Not Numbers

```css
/* ❌ Bad */
.panel { z-index: 1000; }

/* ✅ Good */
.panel { z-index: var(--z-panel); }
```

### Rule 2: Local Stacking Uses Low Values

For elements that only need to stack relative to siblings:

```css
/* ❌ Bad - Global escalation */
.gradient-handle { z-index: 1000; }
.gradient-handle.selected { z-index: 1001; }

/* ✅ Good - Local stacking */
.gradient-handle { z-index: 1; }
.gradient-handle.selected { z-index: 10; }
```

### Rule 3: Establish Stacking Contexts Intentionally

A new stacking context is created by:
- `position: absolute/relative/fixed` + `z-index`
- `transform`, `filter`, `opacity < 1`
- `isolation: isolate`

```css
/* ✅ Intentional stacking context */
.panel {
    position: relative;
    isolation: isolate; /* Creates new context */
}

.panel__overlay {
    z-index: 1; /* Only stacks within .panel */
}
```

### Rule 4: Never Exceed Tier Boundaries

Components should stay within their assigned tier:

| Component Type | Max Z-Index |
|----------------|-------------|
| Content | 999 |
| Panels/Dropdowns | 1299 |
| Modals | 1499 |
| Popovers | 1599 |
| Tooltips | 1699 |
| Notifications | 1899 |
| System | 10000 |

### Rule 5: Document Exceptions

If a component must exceed its tier, document why:

```css
/* EXCEPTION: Color picker must appear above modal when editing fill
   in modal context. Using popover-nested tier (1550) instead of
   standard popover (1500) to layer correctly. */
.color-picker-flyout {
    z-index: var(--z-popover-nested);
}
```

---

## Migration Plan

### Phase 1: Add New Tokens (Week 1)

1. Add extended tokens to `variables.css`
2. Add tokens to design tokens documentation
3. No breaking changes

### Phase 2: Migrate CSS Files (Week 2-3)

| File | Changes |
|------|---------|
| `canvas.css` | Replace `1000` → `var(--z-dropdown)` |
| `cloud-file-browser.css` | Replace `10000` → `var(--z-modal)` |
| `floating-ui.css` | Replace `1900` → `var(--z-toast)`, `2000` → `var(--z-toast)` |
| `flyout-components.css` | Replace `10000` → `var(--z-popover)`, `10002` → `var(--z-popover-nested)` |
| `master-mode.css` | Replace `9999` → `var(--z-master-mode)` |
| `panel-components.css` | Replace `1000` → `var(--z-panel)`, `10000` → `var(--z-modal)` |
| `presentation.css` | Replace with `--z-presentation*` tokens |
| `sharing.css` | Replace `1000` → `var(--z-modal)` |

### Phase 3: Migrate JavaScript Files (Week 3-4)

1. Update `CursorManager.js` to use CSS variable
2. Update `ColorPickerFlyout.js` to use token
3. Update `Flyout.js` to use token
4. Update `LegacyTextSection.js` to use token
5. Review `PanelManager.js` base z-index approach

### Phase 4: Testing & Validation (Week 4-5)

1. Visual regression testing
2. Test modal + context menu combinations
3. Test presentation mode layering
4. Test collaboration cursor visibility
5. Cross-browser testing

---

## Anti-Patterns

### ❌ Z-Index Escalation

```css
/* Problem: Each new component tries to be "on top" */
.dropdown { z-index: 1000; }
.modal { z-index: 2000; }
.tooltip { z-index: 3000; }
.new-thing { z-index: 99999; } /* Escalation! */
```

### ❌ Magic Numbers

```css
/* Problem: No semantic meaning */
.panel { z-index: 10001; }
```

### ❌ Inline Z-Index in JavaScript

```javascript
// Problem: Not using design tokens
element.style.zIndex = '10000';
```

### ❌ !important Z-Index

```css
/* Problem: Breaks cascade, hard to override */
.overlay { z-index: 9999 !important; }
```

### ❌ Z-Index Without Position

```css
/* Problem: z-index has no effect without positioning */
.element {
    z-index: 100; /* Does nothing! */
}
```

---

## Troubleshooting Guide

### Issue: Element not appearing above another

**Diagnosis Checklist:**
1. Does the element have `position: relative/absolute/fixed`?
2. Is there a parent creating a stacking context?
3. Is the z-index value appropriate for the tier?

**Solution:**
```css
/* Ensure positioning */
.element {
    position: relative;
    z-index: var(--z-appropriate-tier);
}
```

### Issue: Modal content appearing behind backdrop

**Cause:** Modal content and backdrop in different stacking contexts.

**Solution:**
```css
.modal-container {
    position: fixed;
    z-index: var(--z-modal-backdrop);
}

.modal-dialog {
    position: relative;
    z-index: 1; /* Local stacking within container */
}
```

### Issue: Dropdown cut off by overflow

**Cause:** Parent has `overflow: hidden` creating clip.

**Solution:** Use portal pattern to render dropdown at body level.

```javascript
// Render dropdown at body level
document.body.appendChild(dropdownElement);
dropdownElement.style.zIndex = 'var(--z-dropdown)';
```

### Issue: Tooltip not visible over modal

**Check:** Is tooltip z-index (1600) higher than modal (1400)?

**If still hidden:** Check if modal creates a new stacking context that traps the tooltip.

**Solution:** Render tooltip at body level with proper z-index.

---

## Appendix: Quick Reference Card

```
┌──────────────────────────────────────────────────────────────┐
│                     Z-INDEX QUICK REFERENCE                  │
├──────────────────────────────────────────────────────────────┤
│  Token                    │  Value  │  Use For               │
├───────────────────────────┼─────────┼────────────────────────┤
│  --z-base                 │    0    │  Background            │
│  --z-canvas               │   100   │  Canvas layer          │
│  --z-dropdown             │  1000   │  Menus, dropdowns      │
│  --z-panel                │  1000   │  Floating panels       │
│  --z-sticky               │  1100   │  Sticky headers        │
│  --z-fixed                │  1200   │  Fixed elements        │
│  --z-modal-backdrop       │  1300   │  Modal overlay         │
│  --z-modal                │  1400   │  Modal dialogs         │
│  --z-popover              │  1500   │  Context menus         │
│  --z-popover-nested       │  1550   │  Nested popovers       │
│  --z-tooltip              │  1600   │  Tooltips              │
│  --z-toast                │  1700   │  Notifications         │
│  --z-presentation         │  9500   │  Presentation mode     │
│  --z-collaboration        │  9800   │  Collab cursors        │
│  --z-fullscreen           │ 10000   │  Max overlay           │
└──────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [Design Tokens Reference](./design-tokens-reference.md)
- [Design System Overview](./design-system-overview.md)
- [Component Library](./component-library.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial specification |
