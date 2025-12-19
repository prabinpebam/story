# Property Inspector - Interaction Patterns

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **References Components:** `NumberInput` (scrubbing), `SliderControl`, `Dropdown`, `ColorInput`, `Flyout`  
> **CRITICAL:** Scrubbing behavior is implemented in `NumberInput.js` with pointer lock. Do not reimplement.  
> **CRITICAL:** All interactions MUST maintain PI↔Viewport sync. See [01-architecture.md](./01-architecture.md) Section 2.4.

---

## 1. Overview

This document specifies the interaction patterns, keyboard shortcuts, and UX behaviors common across all Property Inspector sections. Consistent interaction design ensures a predictable, efficient user experience.

### 1.1 Synchronization Requirement

> **⚠️ EVERY interaction that modifies element properties MUST:**
> 1. Dispatch to Store (never mutate state directly)
> 2. Use `UI_INTERACTION_START/END` for continuous interactions (scrubbing, dragging)
> 3. Set `skipHistory: true` for transient updates, `false` for final commit
> 4. Allow Viewport to update in real-time during interaction

This ensures the Property Inspector and Viewport always display consistent state.

---

## 2. Input Field Behaviors

### 2.1 Numeric Input Interactions

| Interaction | Behavior |
|-------------|----------|
| Click | Focus field, select all text |
| Direct typing | Replace value (numbers, minus, decimal) |
| Enter | Commit value, blur field |
| Escape | Revert to previous value, blur field |
| Tab | Commit value, move to next field |
| Shift+Tab | Commit value, move to previous field |

### 2.2 Arrow Key Increments

| Key Combination | Increment |
|-----------------|-----------|
| Arrow Up | +1 |
| Arrow Down | -1 |
| Shift + Arrow Up | +10 (Big Nudge) |
| Shift + Arrow Down | -10 (Big Nudge) |
| Ctrl/Cmd + Arrow Up | +0.1 (Fine) |
| Ctrl/Cmd + Arrow Down | -0.1 (Fine) |

### 2.3 Scrubbable Labels

Labels next to numeric inputs support "scrubbing":

| Interaction | Behavior |
|-------------|----------|
| Hover | Cursor changes to resize (ew-resize) |
| Drag left | Decrease value continuously |
| Drag right | Increase value continuously |
| Shift + Drag | 10× faster increment |
| Ctrl/Cmd + Drag | 0.1× slower increment |

**Implementation:**

```javascript
label.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startValue = this.value;
    
    const onMove = (e) => {
        const delta = (e.clientX - startX) * sensitivity;
        const modifier = e.shiftKey ? 10 : (e.ctrlKey ? 0.1 : 1);
        this.setValue(startValue + delta * modifier, true); // transient
    };
    
    const onUp = () => {
        this.setValue(this.value, false); // commit
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
});
```

### 2.4 Math Expressions (Future)

Support simple math in numeric inputs:

| Expression | Result |
|------------|--------|
| `100 + 50` | 150 |
| `200 - 25` | 175 |
| `50 * 2` | 100 |
| `100 / 4` | 25 |
| `50%` | Current × 0.5 |

---

## 3. Dropdown Behaviors

### 3.1 Standard Interactions

| Interaction | Behavior |
|-------------|----------|
| Click trigger | Open dropdown menu |
| Click option | Select and close |
| Click outside | Close without change |
| Escape | Close without change |

### 3.2 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Enter/Space | Open dropdown (when focused) |
| Arrow Up/Down | Navigate options |
| Enter | Select highlighted option |
| Escape | Close dropdown |
| Type character | Jump to matching option |

### 3.3 Search/Filter (Large Dropdowns)

For dropdowns with many options (e.g., Font Family):
- Search input at top of menu
- Type to filter options
- Arrow keys navigate filtered results

---

## 4. Color Swatch Behaviors

### 4.1 Click Actions

| Interaction | Behavior |
|-------------|----------|
| Single click | Open color picker flyout |
| Click when flyout open | Close flyout |

### 4.2 Color Picker Flyout

| Interaction | Behavior |
|-------------|----------|
| HSB field click/drag | Adjust saturation and brightness |
| Hue slider drag | Adjust hue |
| Opacity slider drag | Adjust alpha |
| Hex input edit | Direct hex value entry |
| Theme swatch click | Apply theme color (and link) |
| Eyedropper click | Enter color sampling mode |

### 4.3 Eyedropper Tool

| Interaction | Behavior |
|-------------|----------|
| Click anywhere | Sample color at cursor position |
| Escape | Cancel eyedropper mode |

---

## 5. Flyout/Panel Behaviors

### 5.1 Opening

| Trigger | Position | Anchor |
|---------|----------|--------|
| Color swatch | Left of swatch | Swatch element |
| Settings icon | Left of inspector | Icon element |
| Effect row | Left of row | Row element |

### 5.2 Closing

| Trigger | Behavior |
|---------|----------|
| Close button (×) | Close flyout |
| Click trigger again | Toggle closed |
| Click outside | Close flyout |
| Escape key | Close flyout |
| Select element on canvas | Close flyout |

### 5.3 Multiple Flyouts

- Only one flyout open at a time
- Opening new flyout closes existing one

### 5.4 Flyout Persistence

- Flyout position remembered during session
- Content updates live as changes are made
- Form state preserved if briefly closed/reopened

---

## 6. Section Behaviors

### 6.1 Collapse/Expand

| Interaction | Behavior |
|-------------|----------|
| Click header | Toggle collapsed state |
| Click chevron | Toggle collapsed state |
| Click header action buttons | Execute action (no toggle) |

### 6.2 Collapse Animation

```css
.pi-section-content {
    overflow: hidden;
    transition: max-height 0.2s ease-out;
}

.pi-section-content.hidden {
    max-height: 0;
}
```

### 6.3 Collapse State Persistence

- Section collapse states persist within session
- Reset on new selection type
- Optional: Persist to localStorage

---

## 7. Drag and Drop

### 7.1 Fill/Stroke Reorder

| Phase | Behavior |
|-------|----------|
| Drag start | Row becomes semi-transparent, cursor = grab |
| Drag over | Target row shows drop indicator |
| Drop | Reorder fills array, update element |
| Drag end | Reset visual states |

### 7.2 Drop Indicators

```css
.fill-row.drag-over-top {
    border-top: 2px solid var(--color-accent);
}

.fill-row.drag-over-bottom {
    border-bottom: 2px solid var(--color-accent);
}
```

### 7.3 Placeholder Drag (Master Mode)

| Phase | Behavior |
|-------|----------|
| Drag start | Show ghost, notify canvas |
| Drag over canvas | Show placement preview |
| Drop on canvas | Create placeholder at position |
| Drag end | Clean up ghost and preview |

---

## 8. Transient vs Committed Updates

### 8.1 Transient Updates

Operations that are "in progress" and shouldn't create undo history:

| Interaction | Type |
|-------------|------|
| Scrubbing a value | Transient |
| Dragging color picker | Transient |
| Mid-drag position change | Transient |

### 8.2 Committed Updates

Operations that finalize a change and create undo history:

| Interaction | Type |
|-------------|------|
| Releasing scrub drag | Committed |
| Blur numeric input | Committed |
| Enter in input | Committed |
| Releasing color picker drag | Committed |

### 8.3 Implementation Pattern

```javascript
// During scrub (transient)
store.dispatch('UPDATE_ELEMENT', { id, x: value }, { skipHistory: true });

// On release (committed)
store.dispatch('UPDATE_ELEMENT', { id, x: value }, { skipHistory: false });
```

### 8.4 Preventing Render During Transient

```javascript
// In PropertyInspector.render()
if (state.ui && state.ui.isInteracting) return; // Skip render during drag
```

---

## 9. Multi-Selection Behavior

For the normative, cross-control rules (numeric inputs, dropdowns, toggles, button groups) and Figma-referenced parity editing semantics (for overlapping interactions), see:
- [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md)

### 9.1 Same Values

When all selected elements have the same value:
- Display shared value
- Edits apply to all elements

### 9.2 Mixed Values

When selected elements have different values:

| Display Option | Behavior |
|----------------|----------|
| First value | Show first element's value |
| "Mixed" text | Show "Mixed" placeholder |
| "—" symbol | Show dash for numeric inputs |
| Blank | Empty input |

### 9.3 Mixed Value Editing

| Scenario | Behavior |
|----------|----------|
| Edit mixed field | Set all to new absolute value |
| Increment mixed field | Adjust all by delta (relative) |
| Toggle mixed state | Apply to all (use first element's current state to determine action) |

---

## 10. Keyboard Shortcuts

### 10.1 Complete Keyboard Reference

#### Navigation Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| Tab | Move to next focusable element | Global |
| Shift+Tab | Move to previous focusable element | Global |
| Enter | Activate button, commit input | Focused element |
| Space | Activate button, toggle checkbox | Focused button/checkbox |
| Escape | Close flyout, revert input, deselect | Any |

#### Value Adjustment Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| ↑ | Increment by 1 | Numeric input |
| ↓ | Decrement by 1 | Numeric input |
| Shift+↑ | Increment by 10 | Numeric input |
| Shift+↓ | Decrement by 10 | Numeric input |
| Ctrl/Cmd+↑ | Increment by 0.1 | Numeric input |
| Ctrl/Cmd+↓ | Decrement by 0.1 | Numeric input |
| Home | Set to minimum value | Numeric input (slider) |
| End | Set to maximum value | Numeric input (slider) |

#### Dropdown/Menu Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| ↑ | Previous option | Open dropdown |
| ↓ | Next option | Open dropdown |
| Enter | Select option | Open dropdown |
| Escape | Close dropdown | Open dropdown |
| Home | First option | Open dropdown |
| End | Last option | Open dropdown |
| A-Z | Jump to matching option | Open dropdown |

#### Color Picker Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| I | Activate eyedropper | Color picker open |
| Escape | Cancel eyedropper | Eyedropper active |
| ← | Decrease hue by 1 | Hue slider focused |
| → | Increase hue by 1 | Hue slider focused |
| Shift+← | Decrease hue by 10 | Hue slider focused |
| Shift+→ | Increase hue by 10 | Hue slider focused |

#### Section Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| Enter/Space | Toggle collapse | Section header focused |

### 10.2 Global Canvas Shortcuts (Related)

| Shortcut | Action |
|----------|--------|
| ← | Move selected element left 1px |
| → | Move selected element right 1px |
| ↑ | Move selected element up 1px |
| ↓ | Move selected element down 1px |
| Shift+Arrow | Move selected element 10px |
| Ctrl/Cmd+D | Duplicate selection |
| Delete/Backspace | Delete selection |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z | Redo |
| Ctrl/Cmd+A | Select all |
| Ctrl/Cmd+G | Group selection |
| Ctrl/Cmd+Shift+G | Ungroup selection |

---

## 11. Focus Management

### 11.1 Complete Focus Order

```
Property Inspector Focus Flow:
═══════════════════════════════════════════════════════════════

HEADER
  └── Back Button (if present) → Menu Button

POSITION SECTION
  └── Section Toggle → Align Left → Align Center H → Align Right
      → Align Top → Align Center V → Align Bottom
      → X Input → Y Input → Rotation Input
      → Flip Horizontal → Flip Vertical

LAYOUT SECTION
  └── Section Toggle → [Layout Mode Buttons if text]
      → Width Input → Constrain Toggle → Height Input

APPEARANCE SECTION
  └── Section Toggle → Opacity Input → Blend Mode Dropdown
      → Corner Radius Input

TEXT SECTION (if visible)
  └── Section Toggle → Style Dropdown → Font Family
      → Font Weight → Font Size → Color Swatch
      → Line Height → Letter Spacing
      → H-Align Left → H-Align Center → H-Align Right → H-Align Justify
      → V-Align Top → V-Align Center → V-Align Bottom
      → Type Settings Button

FILL SECTION
  └── Section Toggle → Add Fill Button
      For each fill row:
        → Drag Handle → Color Swatch → Hex Input → Opacity Input
        → Visibility Toggle → Delete Button

STROKE SECTION
  └── Section Toggle → Add Stroke Button
      For each stroke row:
        → Drag Handle → Color Swatch → Hex Input → Opacity Input
        → Width Input → Position Dropdown → Settings Button
        → Visibility Toggle → Delete Button

EFFECTS SECTION
  └── Section Toggle → Add Effect Button
      For each effect row:
        → Effect Icon → Effect Label → Settings Button
        → Visibility Toggle → Delete Button

EXPORT SECTION
  └── Section Toggle → Add Preset Button → Export Button
      For each preset row:
        → Scale Input → Suffix Input → Format Dropdown
        → Delete Button
```

### 11.2 Focus Trapping

Flyouts trap focus within themselves:

```javascript
class Flyout {
    trapFocus() {
        const focusables = this.element.querySelectorAll(
            'button, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        this.firstFocusable = focusables[0];
        this.lastFocusable = focusables[focusables.length - 1];
        
        this.element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey && document.activeElement === this.firstFocusable) {
                e.preventDefault();
                this.lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === this.lastFocusable) {
                e.preventDefault();
                this.firstFocusable.focus();
            }
        });
    }
}
```

### 11.3 Focus Restoration

```javascript
class Flyout {
    open(trigger) {
        this.previousFocus = trigger;
        this.element.classList.add('open');
        this.firstFocusable.focus();
    }
    
    close() {
        this.element.classList.remove('open');
        if (this.previousFocus) {
            this.previousFocus.focus();
        }
    }
}
```

### 11.4 Skip Links (Future Enhancement)

For long Property Inspector panels:

```html
<a href="#position-section" class="skip-link">Skip to Position</a>
<a href="#fill-section" class="skip-link">Skip to Fill</a>
```

---

## 12. Hover States

### 12.1 Standard Hover

```css
/* Buttons */
.icon-button:hover {
    background: var(--color-bg-hover);
}

/* Inputs */
.number-input:hover {
    border-color: var(--color-border-hover);
}

/* Rows */
.fill-row:hover {
    background: var(--color-bg-subtle-hover);
}
```

### 12.2 Active States

```css
/* Active button */
.icon-button.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
}

/* Focus state */
.number-input:focus {
    border-color: var(--color-accent);
    outline: none;
}
```

---

## 13. Screen Reader Experience

### 13.1 Announcements

| Event | Announcement |
|-------|--------------|
| Section collapse | "Position section collapsed" |
| Section expand | "Position section expanded" |
| Value change | "Width changed to 300 pixels" |
| Fill added | "Fill added, 2 fills total" |
| Fill deleted | "Fill deleted, 1 fill remaining" |
| Flyout open | "Color picker opened" |
| Flyout close | "Color picker closed" |

### 13.2 Live Region Implementation

```html
<div id="pi-announcer" 
     aria-live="polite" 
     aria-atomic="true" 
     class="sr-only">
</div>
```

```javascript
function announce(message) {
    const announcer = document.getElementById('pi-announcer');
    announcer.textContent = '';
    // Force reflow for screen reader to re-announce
    requestAnimationFrame(() => {
        announcer.textContent = message;
    });
}
```

### 13.3 Element Descriptions

```html
<!-- Scrubbable label hint -->
<label id="x-label" aria-describedby="scrub-hint">X</label>
<span id="scrub-hint" class="sr-only">
    Drag left or right to adjust value
</span>

<!-- Input with unit -->
<input type="text" 
       aria-label="Width" 
       aria-describedby="width-unit" />
<span id="width-unit" class="sr-only">pixels</span>
```

---

## 14. Touch and Gesture Support

### 14.1 Touch Interactions

| Gesture | Action |
|---------|--------|
| Tap | Activate button, focus input |
| Long press | Show tooltip/context menu |
| Swipe on row | (Future) Quick actions |
| Pinch | Not supported in PI |

### 14.2 Touch-Friendly Targets

All interactive elements must have minimum 44×44px touch target:

```css
.icon-button {
    min-width: 44px;
    min-height: 44px;
    /* Visual size can be smaller */
}
```

### 14.3 Trackpad Gestures

| Gesture | Action |
|---------|--------|
| Two-finger scroll | Scroll panel |
| Two-finger pinch | Not supported in PI |

---

## 15. Loading States

### 15.1 Font Loading

While fonts load:
- Show shimmer/skeleton in dropdown
- Disable font family selector
- Show loading indicator

### 15.2 Image/Asset Loading

While assets load:
- Show placeholder in preview
- Progress indicator for large files

---

## 16. Error States

### 16.1 Invalid Input

```css
.number-input.invalid {
    border-color: var(--color-error);
}

.number-input.invalid + .error-message {
    display: block;
    color: var(--color-error);
    font-size: 11px;
}
```

### 16.2 Validation Behavior

| Error | Behavior |
|-------|----------|
| Invalid hex color | Show error, revert on blur |
| Out of range number | Clamp to valid range |
| Required field empty | Show warning, use default |

---

## 17. Accessibility

### 17.1 ARIA Attributes

```html
<div class="pi-section" role="group" aria-label="Position">
    <button 
        class="pi-section-header" 
        aria-expanded="true" 
        aria-controls="position-content"
    >
        Position
    </button>
    <div id="position-content" role="region">
        <!-- Content -->
    </div>
</div>
```

### 17.2 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
    .pi-section-content {
        transition: none;
    }
    
    .flyout {
        animation: none;
    }
}
```

### 17.3 High Contrast Mode

```css
@media (forced-colors: active) {
    .icon-button:focus {
        outline: 2px solid CanvasText;
    }
    
    .number-input:focus {
        outline: 2px solid Highlight;
    }
}
```

---

## Next Section: [13 - Gaps and Roadmap](./13-gaps-and-roadmap.md)
