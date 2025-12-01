# Button Standardization Report

## Executive Summary

The application currently has **54 instances** of button creation (`document.createElement('button')`) across **30+ files**, using **25+ different CSS class naming patterns**. This fragmentation leads to:
- Inconsistent visual appearance
- Duplicated CSS code
- Maintenance overhead
- Poor developer experience

**Recommendation:** Create a single unified `Button` component with size and variant options.

---

## Current Button Inventory

### 1. Component-Based Buttons (Existing)

| Component | Location | CSS Class | Usage |
|-----------|----------|-----------|-------|
| `IconButton` | `src/ui/components/IconButton.js` | `.pi-icon-btn` | Icon-only buttons in Property Inspector |

### 2. Button CSS Class Patterns Found

#### Primary/Action Buttons
| Class Pattern | Location | Visual Style |
|---------------|----------|--------------|
| `.btn-primary` | `modal.css`, `SettingsModal.js` | Accent bg, on-accent text |
| `.cfp-btn-primary` | `code-fill-panel.css` | Accent bg, on-accent text |
| `.panel-btn-primary` | `panel-components.css` | Accent bg, on-accent text |
| `.share-modal-btn-primary` | `sharing.css` | Primary color bg |
| `.share-modal-button-primary` | `ShareModal.js` | Primary button |
| `.tsm-btn-primary` | `TypographyStyleManager.js` | Primary style |

#### Secondary Buttons
| Class Pattern | Location | Visual Style |
|---------------|----------|--------------|
| `.btn-secondary` | `ExportSection.js` | Secondary action |
| `.cfp-btn-secondary` | `code-fill-panel.css` | Tertiary bg, border |
| `.panel-btn-secondary` | `panel-components.css` | Tertiary bg |
| `.share-modal-btn-secondary` | `sharing.css` | Surface hover bg |
| `.tsm-btn-secondary` | `TypographyStyleManager.js` | Secondary style |

#### Icon Buttons
| Class Pattern | Location | Visual Style |
|---------------|----------|--------------|
| `.pi-icon-btn` | `IconButton.js` | Property inspector icon button |
| `.icon-btn` | `SlideList.js`, `LegacyTextSection.js` | Generic icon button |
| `.draggable-panel-btn` | `DraggablePanel.js` | Panel header buttons |
| `.cfp-control-btn` | `CodeFillPanel.js` | Control button in panels |

#### Text/Reset Buttons
| Class Pattern | Location | Visual Style |
|---------------|----------|--------------|
| `.reset-btn` | `TextSection.js`, `TypeSettingsFlyout.js` | Reset action |
| `.ctm__adjustments-reset` | `ColorThemeManager.js` | `btn btn--text btn--sm` |
| `.close-btn` | `modal.css` | Modal close button |

#### Context-Specific Buttons
| Class Pattern | Location | Purpose |
|---------------|----------|---------|
| `.sign-in-btn` | `SignInModal.js` | Auth provider buttons |
| `.share-link-btn` | `ShareLinkPanel.js` | Share link actions |
| `.share-link-create-btn` | `ShareLinkPanel.js` | Create link button |
| `.media-remove-btn` | `ImageTab.js`, `VideoTab.js` | Remove media |
| `.scale-mode-btn` | `ImageTab.js`, `VideoTab.js` | Scale mode toggle |
| `.position-grid-btn` | `ImageTab.js` | Position grid selector |
| `.fill-type-btn` | `TypeSettingsFlyout.js` | Text transform toggle |
| `.layout-trigger-btn` | `SlideSection.js` | Layout picker trigger |
| `.code-btn-update` | `CodeTab.js` | Update code action |
| `.code-btn-generate` | `CodeTab.js` | Generate code action |
| `.code-save-btn` | `CodeTab.js` | Save preset |
| `.code-modal-btn-cancel` | `CodeTab.js` | Modal cancel |
| `.code-modal-btn-save` | `CodeTab.js` | Modal save |

---

## Files Creating Buttons

### UI Components (should use Button component)
1. `src/ui/SlideList.js` - Add slide button
2. `src/ui/SettingsModal.js` - Save, color picker buttons
3. `src/ui/properties/ExportSection.js` - Export button
4. `src/ui/properties/SlideSection.js` - Layout, edit, reset buttons
5. `src/ui/properties/TextSection.js` - Reset button
6. `src/ui/properties/legacy/LegacyTextSection.js` - AI, formatting buttons
7. `src/ui/panels/TypographyStyleManager.js` - Apply, reset buttons
8. `src/ui/panels/CodeFillPanel.js` - Play, reset, AI, save preset buttons
9. `src/ui/panels/color-theme/ColorThemeManager.js` - Theme items, slots, reset, generate

### FillFlyout Components
1. `src/ui/components/FillFlyout/ImageTab.js` - Remove, scale mode, position buttons
2. `src/ui/components/FillFlyout/VideoTab.js` - Remove, scale mode buttons
3. `src/ui/components/FillFlyout/SolidTab.js` - Color swatches (button elements)
4. `src/ui/components/FillFlyout/CodeTab.js` - Update, generate, save, modal buttons

### Sharing Components
1. `src/ui/sharing/ShareModal.js` - Close, invite buttons
2. `src/ui/sharing/ShareLinkPanel.js` - Create view/edit, copy, revoke buttons
3. `src/ui/sharing/InviteInput.js` - Remove tag button
4. `src/ui/sharing/CollaboratorList.js` - Remove collaborator button

### Auth Components
1. `src/ui/auth/SignInModal.js` - Provider buttons
2. `src/ui/auth/ProfileButton.js` - Profile button

### Other Components
1. `src/ui/components/DraggablePanel.js` - Panel header buttons
2. `src/ui/components/AppMenu/AppMenu.js` - Menu trigger
3. `src/ui/components/TypeSettingsFlyout.js` - Text transform, reset buttons
4. `src/ui/components/ThemeSwatches.js` - Swatch buttons
5. `src/ui/panels/components/FillLayerBar.js` - Add layer button

---

## CSS Files with Button Styles

| File | Button Classes Defined |
|------|----------------------|
| `components.css` | Base `button`, `.action-btn`, `#play-btn` |
| `modal.css` | `.btn-primary`, `.close-btn` |
| `panel-components.css` | `.panel-btn`, `.panel-btn-primary`, `.panel-btn-secondary` |
| `code-fill-panel.css` | `.cfp-btn`, `.cfp-btn-primary`, `.cfp-btn-secondary` |
| `color-theme-manager.css` | `.btn`, `.btn--text`, `.btn--accent`, `.btn--sm` |
| `sharing.css` | `.share-modal-btn`, `.share-modal-btn-primary`, `.share-modal-btn-secondary` |
| `flyout-components.css` | `.media-remove-btn`, `.scale-mode-btn`, `.code-btn-*` |
| `property-inspector.css` | `.pi-icon-btn`, `.layout-trigger-btn` |
| `auth.css` | `.sign-in-btn`, `.profile-button` |

---

## Proposed Unified Button Component

### Design Tokens Needed

```css
/* Button Size Tokens */
--btn-height-xs: 24px;    /* Icon-only, compact */
--btn-height-sm: 28px;    /* Small text buttons */
--btn-height-md: 32px;    /* Default */
--btn-height-lg: 40px;    /* Large/prominent */

--btn-padding-xs: var(--spacing-1) var(--spacing-1-5);
--btn-padding-sm: var(--spacing-1-5) var(--spacing-2);
--btn-padding-md: var(--spacing-2) var(--spacing-3);
--btn-padding-lg: var(--spacing-2-5) var(--spacing-4);
```

### Proposed `Button` Component API

```javascript
// src/ui/components/Button.js

export class Button {
    constructor(options = {}) {
        this.options = {
            label: '',              // Text label
            icon: '',               // SVG icon (optional, for icon-only or icon+text)
            iconPosition: 'left',   // 'left' | 'right'
            variant: 'secondary',   // 'primary' | 'secondary' | 'text' | 'danger'
            size: 'md',             // 'xs' | 'sm' | 'md' | 'lg'
            disabled: false,
            loading: false,
            fullWidth: false,
            title: '',              // Tooltip
            onClick: () => {},
            ...options
        };
        
        this.element = this.render();
    }
}
```

### Variant Mapping

| Variant | Use Case | Current Classes It Replaces |
|---------|----------|----------------------------|
| `primary` | Primary CTA | `.btn-primary`, `.cfp-btn-primary`, `.panel-btn-primary`, `.share-modal-btn-primary` |
| `secondary` | Secondary actions | `.btn-secondary`, `.cfp-btn-secondary`, `.panel-btn-secondary` |
| `text` | Inline/subtle actions | `.reset-btn`, `.btn--text`, close buttons |
| `danger` | Destructive actions | `.share-link-btn-revoke`, remove buttons |

### Size Mapping

| Size | Height | Use Case | Current Patterns |
|------|--------|----------|-----------------|
| `xs` | 24px | Icon-only buttons in tight spaces | `.pi-icon-btn`, `.draggable-panel-btn` |
| `sm` | 28px | Compact buttons in panels | `.cfp-btn-sm`, inline buttons |
| `md` | 32px | Default size | Most buttons |
| `lg` | 40px | Prominent CTAs, modal actions | `.sign-in-btn`, modal save buttons |

---

## Migration Plan

### Phase 1: Create Core Component
1. Create `Button.js` component
2. Create `button.css` with all variants/sizes
3. Add design tokens to `variables.css`

### Phase 2: Migrate High-Impact Areas
1. `SettingsModal.js` - Save buttons
2. `ShareModal.js` - Invite button
3. `CodeFillPanel.js` - AI buttons
4. `TypographyStyleManager.js` - Apply/reset buttons

### Phase 3: Migrate Panel Components
1. `DraggablePanel.js` - Header buttons
2. `ColorThemeManager.js` - Action buttons
3. All FillFlyout tabs

### Phase 4: Migrate Remaining
1. Auth components
2. Property inspector sections
3. Context-specific buttons

### Phase 5: Cleanup
1. Remove orphaned CSS classes
2. Remove duplicated styles
3. Update `IconButton` to extend `Button` or deprecate

---

## Immediate Actions Required

1. **Create** `src/ui/components/Button.js`
2. **Create** `styles/modules/button.css`
3. **Update** `variables.css` with button tokens
4. **Deprecate** `IconButton.js` (merge into Button with `icon` + size `xs`)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Button creation sites | 54 |
| Unique CSS class patterns | 25+ |
| CSS files with button styles | 9 |
| Files needing migration | 25+ |

**Estimated effort:** 2-3 days for full migration

---

# Implementation Plan: Unified Button Component

## Goals

1. **Single source of truth** - One `Button` component for all button needs
2. **Non-breaking migration** - Old classes continue to work during transition
3. **Size variants only** - Simplify to 4 sizes: `xs`, `sm`, `md`, `lg`
4. **Consistent API** - Same props/options everywhere

---

## Phase 1: Foundation (Non-Breaking)

### Step 1.1: Create Button Component

**File:** `src/ui/components/Button.js`

```javascript
/**
 * Button.js
 * 
 * Unified button component with size variants.
 * Replaces: IconButton, and all ad-hoc button creation patterns.
 * 
 * Usage:
 *   const btn = new Button({
 *       label: 'Save',
 *       icon: Icons.SAVE,
 *       variant: 'primary',
 *       size: 'md',
 *       onClick: () => handleSave()
 *   });
 *   container.appendChild(btn.element);
 */

export class Button {
    constructor(options = {}) {
        this.options = {
            // Content
            label: '',                  // Text label (optional if icon-only)
            icon: '',                   // SVG string (optional)
            iconPosition: 'left',       // 'left' | 'right'
            
            // Appearance
            variant: 'secondary',       // 'primary' | 'secondary' | 'text' | 'danger'
            size: 'md',                 // 'xs' | 'sm' | 'md' | 'lg'
            fullWidth: false,           // 100% width
            
            // State
            disabled: false,
            loading: false,
            active: false,              // Toggle state
            
            // Accessibility
            title: '',                  // Tooltip
            ariaLabel: '',              // Screen reader label
            
            // Behavior
            type: 'button',             // 'button' | 'submit' | 'reset'
            onClick: null,
            
            ...options
        };
        
        this.element = this.render();
    }
    
    render() {
        const btn = document.createElement('button');
        btn.type = this.options.type;
        
        // Build class list
        const classes = ['btn'];
        classes.push(`btn--${this.options.variant}`);
        classes.push(`btn--${this.options.size}`);
        
        if (this.options.fullWidth) classes.push('btn--full');
        if (this.options.disabled) classes.push('btn--disabled');
        if (this.options.loading) classes.push('btn--loading');
        if (this.options.active) classes.push('btn--active');
        if (this.options.icon && !this.options.label) classes.push('btn--icon-only');
        
        btn.className = classes.join(' ');
        
        // Accessibility
        if (this.options.title) btn.title = this.options.title;
        if (this.options.ariaLabel) btn.setAttribute('aria-label', this.options.ariaLabel);
        if (this.options.disabled) btn.disabled = true;
        
        // Content
        this.renderContent(btn);
        
        // Event
        if (this.options.onClick) {
            btn.addEventListener('click', (e) => {
                if (!this.options.disabled && !this.options.loading) {
                    this.options.onClick(e);
                }
            });
        }
        
        return btn;
    }
    
    renderContent(btn) {
        btn.innerHTML = '';
        
        // Loading spinner
        if (this.options.loading) {
            const spinner = document.createElement('span');
            spinner.className = 'btn__spinner';
            btn.appendChild(spinner);
        }
        
        // Icon (left)
        if (this.options.icon && this.options.iconPosition === 'left') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.innerHTML = this.options.icon;
            btn.appendChild(iconEl);
        }
        
        // Label
        if (this.options.label) {
            const labelEl = document.createElement('span');
            labelEl.className = 'btn__label';
            labelEl.textContent = this.options.label;
            btn.appendChild(labelEl);
        }
        
        // Icon (right)
        if (this.options.icon && this.options.iconPosition === 'right') {
            const iconEl = document.createElement('span');
            iconEl.className = 'btn__icon';
            iconEl.innerHTML = this.options.icon;
            btn.appendChild(iconEl);
        }
    }
    
    // State management methods
    setDisabled(disabled) {
        this.options.disabled = disabled;
        this.element.disabled = disabled;
        this.element.classList.toggle('btn--disabled', disabled);
    }
    
    setLoading(loading) {
        this.options.loading = loading;
        this.element.classList.toggle('btn--loading', loading);
        this.renderContent(this.element);
    }
    
    setActive(active) {
        this.options.active = active;
        this.element.classList.toggle('btn--active', active);
    }
    
    setLabel(label) {
        this.options.label = label;
        this.renderContent(this.element);
    }
    
    setIcon(icon) {
        this.options.icon = icon;
        this.renderContent(this.element);
    }
    
    // Cleanup
    destroy() {
        this.element.remove();
    }
}
```

### Step 1.2: Create Button CSS

**File:** `styles/modules/button.css`

```css
/**
 * Button Component Styles
 * 
 * Unified button system with 4 variants and 4 sizes.
 * BEM naming: .btn, .btn--variant, .btn--size, .btn__element
 */

/* ===========================================
   Base Button
   =========================================== */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-1-5);
    
    font-family: var(--font-ui);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    white-space: nowrap;
    
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    
    transition: 
        background-color var(--duration-fast) var(--ease-out),
        border-color var(--duration-fast) var(--ease-out),
        color var(--duration-fast) var(--ease-out),
        opacity var(--duration-fast) var(--ease-out);
}

.btn:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
}

/* ===========================================
   Size Variants
   =========================================== */

/* XS: 24px - Icon buttons, compact spaces */
.btn--xs {
    height: 24px;
    min-width: 24px;
    padding: 0 var(--spacing-1-5);
    font-size: var(--font-size-xs);
    border-radius: var(--radius-xs);
}

.btn--xs.btn--icon-only {
    width: 24px;
    padding: 0;
}

.btn--xs .btn__icon {
    width: 14px;
    height: 14px;
}

/* SM: 28px - Compact buttons in panels */
.btn--sm {
    height: 28px;
    min-width: 28px;
    padding: 0 var(--spacing-2);
    font-size: var(--font-size-sm);
}

.btn--sm.btn--icon-only {
    width: 28px;
    padding: 0;
}

.btn--sm .btn__icon {
    width: 14px;
    height: 14px;
}

/* MD: 32px - Default size */
.btn--md {
    height: 32px;
    min-width: 32px;
    padding: 0 var(--spacing-3);
    font-size: var(--font-size-sm);
}

.btn--md.btn--icon-only {
    width: 32px;
    padding: 0;
}

.btn--md .btn__icon {
    width: 16px;
    height: 16px;
}

/* LG: 40px - Prominent CTAs, modals */
.btn--lg {
    height: 40px;
    min-width: 40px;
    padding: 0 var(--spacing-4);
    font-size: var(--font-size-md);
    border-radius: var(--radius-md);
}

.btn--lg.btn--icon-only {
    width: 40px;
    padding: 0;
}

.btn--lg .btn__icon {
    width: 18px;
    height: 18px;
}

/* ===========================================
   Style Variants
   =========================================== */

/* Primary: Main CTA */
.btn--primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-text-on-accent);
}

.btn--primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
}

.btn--primary:active:not(:disabled) {
    background: var(--color-accent-active);
}

/* Secondary: Default style */
.btn--secondary {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border);
    color: var(--color-text-primary);
}

.btn--secondary:hover:not(:disabled) {
    background: var(--color-bg-hover);
    border-color: var(--color-border-hover);
}

.btn--secondary:active:not(:disabled) {
    background: var(--color-bg-active);
}

/* Text: Minimal/inline buttons */
.btn--text {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-secondary);
}

.btn--text:hover:not(:disabled) {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
}

.btn--text:active:not(:disabled) {
    background: var(--color-bg-active);
}

/* Danger: Destructive actions */
.btn--danger {
    background: transparent;
    border-color: var(--color-border);
    color: var(--color-error);
}

.btn--danger:hover:not(:disabled) {
    background: var(--color-error);
    border-color: var(--color-error);
    color: var(--color-text-on-accent);
}

/* ===========================================
   States
   =========================================== */

/* Disabled */
.btn:disabled,
.btn--disabled {
    opacity: var(--opacity-disabled, 0.5);
    cursor: not-allowed;
    pointer-events: none;
}

/* Active/Selected toggle state */
.btn--active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-text-on-accent);
}

/* Loading */
.btn--loading {
    position: relative;
    pointer-events: none;
}

.btn--loading .btn__label,
.btn--loading .btn__icon {
    opacity: 0;
}

.btn__spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
    to { transform: rotate(360deg); }
}

/* ===========================================
   Modifiers
   =========================================== */

/* Full width */
.btn--full {
    width: 100%;
}

/* Icon only - square aspect */
.btn--icon-only {
    padding: 0;
}

/* ===========================================
   Child Elements
   =========================================== */

.btn__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.btn__icon svg {
    width: 100%;
    height: 100%;
}

.btn__label {
    flex-shrink: 0;
}

/* ===========================================
   Legacy Compatibility Layer
   (Remove after full migration)
   =========================================== */

/* Map old classes to new system */
.btn-primary { @extend .btn, .btn--primary, .btn--md; }
.btn-secondary { @extend .btn, .btn--secondary, .btn--md; }
.cfp-btn { @extend .btn; }
.cfp-btn-primary { @extend .btn--primary; }
.cfp-btn-secondary { @extend .btn--secondary; }
.cfp-btn-sm { @extend .btn--sm; }
.panel-btn { @extend .btn; }
.panel-btn-primary { @extend .btn--primary; }
.panel-btn-secondary { @extend .btn--secondary; }
.pi-icon-btn { @extend .btn, .btn--text, .btn--xs, .btn--icon-only; }
.icon-btn { @extend .btn, .btn--text, .btn--xs, .btn--icon-only; }

/* Note: @extend is SCSS syntax. For plain CSS, duplicate the styles or use CSS custom properties */
```

### Step 1.3: Add Design Tokens

**Add to:** `styles/modules/variables.css`

```css
/* Button Size Tokens */
--btn-height-xs: 24px;
--btn-height-sm: 28px;
--btn-height-md: 32px;
--btn-height-lg: 40px;
```

### Step 1.4: Create Compatibility Wrapper for IconButton

**Update:** `src/ui/components/IconButton.js`

```javascript
/**
 * IconButton.js
 * 
 * @deprecated Use Button component with icon and size='xs' instead.
 * This wrapper maintains backward compatibility during migration.
 * 
 * Migration example:
 *   // Old:
 *   new IconButton({ icon: Icons.CLOSE, onClick: handleClose });
 *   
 *   // New:
 *   new Button({ icon: Icons.CLOSE, size: 'xs', variant: 'text', onClick: handleClose });
 */

import { Button } from './Button.js';

export class IconButton extends Button {
    constructor(options = {}) {
        // Map old IconButton API to new Button API
        super({
            icon: options.icon || '',
            title: options.title || '',
            onClick: options.onClick || (() => {}),
            active: options.isActive || false,
            variant: 'text',
            size: 'xs',
            ariaLabel: options.title || ''
        });
        
        // Maintain legacy class for existing CSS
        this.element.classList.add('pi-icon-btn');
        
        console.warn('IconButton is deprecated. Use Button with size="xs" instead.');
    }
    
    // Legacy method compatibility
    setActive(isActive) {
        super.setActive(isActive);
        // Legacy class toggle
        this.element.classList.toggle('active', isActive);
    }
}
```

---

## Phase 2: Gradual Migration (File by File)

### Migration Order (by impact/visibility)

| Priority | File | Buttons to Migrate | Complexity |
|----------|------|-------------------|------------|
| 1 | `SettingsModal.js` | Save button | Low |
| 2 | `ShareModal.js` | Close, Invite buttons | Low |
| 3 | `CodeFillPanel.js` | Play, Reset, AI, Save buttons | Medium |
| 4 | `TypographyStyleManager.js` | Apply, Reset buttons | Low |
| 5 | `DraggablePanel.js` | Header buttons (min, close) | Low |
| 6 | `ColorThemeManager.js` | Generate, Reset buttons | Medium |
| 7 | `SlideSection.js` | Layout, Edit, Reset buttons | Medium |
| 8 | `FillFlyout/*Tab.js` | Remove, mode buttons | Medium |
| 9 | `ShareLinkPanel.js` | Create, Copy, Revoke buttons | Low |
| 10 | `SignInModal.js` | Provider buttons | Medium |
| 11 | Remaining files | Various | Low-Medium |

### Migration Template

For each file:

```javascript
// Before:
const saveBtn = document.createElement('button');
saveBtn.className = 'btn-primary';
saveBtn.innerText = 'Save';
saveBtn.onclick = () => this.save();
container.appendChild(saveBtn);

// After:
import { Button } from '../components/Button.js';

const saveBtn = new Button({
    label: 'Save',
    variant: 'primary',
    size: 'md',
    onClick: () => this.save()
});
container.appendChild(saveBtn.element);
```

### Non-Breaking Strategy

1. **Keep old CSS classes** in `button.css` as aliases during migration
2. **IconButton wrapper** maintains 100% backward compatibility
3. **Migrate one file at a time** - test after each migration
4. **No big bang** - old and new can coexist

---

## Phase 3: Cleanup

### After All Files Migrated

1. **Remove legacy CSS classes** from `button.css`
2. **Remove duplicate styles** from:
   - `modal.css` (`.btn-primary`)
   - `code-fill-panel.css` (`.cfp-btn*`)
   - `panel-components.css` (`.panel-btn*`)
   - `sharing.css` (`.share-modal-btn*`)
   - `property-inspector.css` (`.pi-icon-btn`)
   - `flyout-components.css` (button styles)
   
3. **Delete IconButton.js** or convert to simple re-export:
   ```javascript
   export { Button as IconButton } from './Button.js';
   ```

4. **Update documentation** and component library

---

## Testing Checklist

### Visual Testing
- [ ] All 4 sizes render correctly (xs, sm, md, lg)
- [ ] All 4 variants have correct colors (primary, secondary, text, danger)
- [ ] Icon-only buttons are square
- [ ] Icon + label buttons have correct spacing
- [ ] Hover states work
- [ ] Active/selected state works
- [ ] Disabled state works
- [ ] Loading spinner appears and button is non-interactive
- [ ] Full-width option works
- [ ] Focus ring is visible for keyboard navigation

### Functional Testing
- [ ] onClick fires correctly
- [ ] Disabled buttons don't fire onClick
- [ ] Loading buttons don't fire onClick
- [ ] setDisabled() works
- [ ] setLoading() works  
- [ ] setActive() works
- [ ] setLabel() updates text
- [ ] setIcon() updates icon

### Regression Testing (per migrated file)
- [ ] SettingsModal save works
- [ ] ShareModal invite works
- [ ] CodeFillPanel controls work
- [ ] Panel minimize/close work
- [ ] All fill flyout actions work
- [ ] Auth flow works

---

## Rollback Plan

If issues are discovered:

1. **Revert file** - Each migration is isolated to one file
2. **IconButton wrapper** ensures existing code keeps working
3. **CSS aliases** mean old class names still work
4. **No database/state changes** - purely UI refactor

---

## Success Criteria

| Metric | Before | After |
|--------|--------|-------|
| Button class patterns | 25+ | 1 (`.btn`) |
| CSS files with button styles | 9 | 1 (`button.css`) |
| Lines of button CSS | ~500 | ~200 |
| Button components | 2 (`IconButton` + inline) | 1 (`Button`) |
| Consistent sizing | ❌ | ✅ |
| Consistent spacing | ❌ | ✅ |

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 1 day | `Button.js`, `button.css`, `IconButton` wrapper |
| Phase 2: Migration | 2-3 days | All files using `Button` component |
| Phase 3: Cleanup | 0.5 day | Remove legacy CSS, update docs |

**Total: 3.5-4.5 days**
