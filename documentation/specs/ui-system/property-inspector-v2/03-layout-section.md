# Property Inspector - Layout Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/LayoutSection.js`  
> **Uses:** `Section`, `NumberInput` (scrubbable), `SegmentedControl`  
> **DO NOT** create custom input or toggle components. Use design system components with variants.

---

## 1. Overview

The Layout section controls the geometric dimensions of selected elements. For text elements, it additionally provides layout mode controls (Auto Size, Fixed Width, Fixed Size).

### Section Header
- **Title:** "Layout"
- **Actions:** None
- **Collapsed by Default:** No

---

## 2. Layout Structure

### 2.1 Standard Layout (Non-Text)

```
┌─────────────────────────────────────────────────────────────────┐
│  Layout                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  W [  300  ]   H [  150  ]   [🔗]   <- Dimensions Row          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Text Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Layout                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [↔↕] [↔] [□]                       <- Layout Mode Row (Text)  │
│                                                                 │
│  W [  300  ]   H [  150  ]   [🔗]   <- Dimensions Row          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Text Layout Modes

### 3.1 Mode Specifications

| Mode | Icon | Behavior | W Input | H Input |
|------|------|----------|---------|---------|
| Auto Size | `TEXT_AUTO_SIZE` | Both dimensions auto-fit content | Disabled | Disabled |
| Fixed Width | `TEXT_FIXED_WIDTH` | Width fixed, height auto-fits | Enabled | Disabled |
| Fixed Size | `TEXT_FIXED_SIZE` | Both dimensions fixed (may overflow) | Enabled | Enabled |

### 3.2 Mode Buttons

```
┌───────────────────────────────────────┐
│  [↔↕]  [↔─]  [□□]                    │
│   ●     ○     ○     Auto | Fixed W | Fixed │
└───────────────────────────────────────┘
```

### 3.3 Auto Size Behavior

When in Auto Size mode:
- Width expands/contracts as text content changes
- Height expands/contracts as lines wrap or are added
- **Anchor Point:** Determined by text alignment settings

### 3.4 Alignment-Based Anchoring

The resize anchor is determined by text alignment:

| Horizontal Align | Anchor |
|------------------|--------|
| Left | Left edge stays fixed, grows right |
| Center | Center stays fixed, grows both sides |
| Right | Right edge stays fixed, grows left |

| Vertical Align | Anchor |
|----------------|--------|
| Top | Top edge stays fixed, grows down |
| Middle | Center stays fixed, grows both |
| Bottom | Bottom edge stays fixed, grows up |

**Example:** Center-aligned, top-anchored text resizes symmetrically left/right while maintaining its top edge position.

### 3.5 Implementation

```javascript
updateLayoutMode(value) {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    
    selection.forEach(id => {
        const el = this.getElement(state, id);
        if (el && el.type === 'text') {
            store.dispatch('UPDATE_ELEMENT', { 
                id, 
                resizing: value  // 'autoSize' | 'fixedWidth' | 'fixed'
            });
        }
    });
    
    // Update input enabled states
    this.updateInputStates(value);
}

updateInputStates(resizingMode) {
    if (resizingMode === 'autoSize') {
        this.wInput.setDisabled(true);
        this.hInput.setDisabled(true);
    } else if (resizingMode === 'fixedWidth') {
        this.wInput.setDisabled(false);
        this.hInput.setDisabled(true);
    } else {
        this.wInput.setDisabled(false);
        this.hInput.setDisabled(false);
    }
}
```

---

## 4. Dimension Controls (W, H)

### 4.1 Input Specifications

| Input | Label | Default | Range | Units |
|-------|-------|---------|-------|-------|
| Width | "W" | 100 | 1 to ∞ | pixels |
| Height | "H" | 100 | 1 to ∞ | pixels |

### 4.2 Interaction Behavior

| Interaction | Behavior |
|-------------|----------|
| Direct Input | Type numeric value, press Enter to commit |
| Arrow Up | Increment by 1 |
| Arrow Down | Decrement by 1 |
| Shift + Arrow Up | Increment by 10 |
| Shift + Arrow Down | Decrement by 10 |
| Label Scrub | Drag label left/right to adjust value continuously |

### 4.3 Minimum Size Constraints

- **Minimum Width:** 1px
- **Minimum Height:** 1px
- **Maximum:** No upper limit

---

## 5. Constrain Proportions

### 5.1 Toggle Button

| State | Icon | Behavior |
|-------|------|----------|
| Unconstrained | `LINK_BROKEN` | W and H change independently |
| Constrained | `LINK` | Changing W/H adjusts the other to maintain aspect ratio |

### 5.2 Aspect Ratio Calculation

```javascript
toggleConstrain() {
    store.dispatch('TOGGLE_CONSTRAIN_PROPORTIONS');
    
    // Capture current aspect ratio when enabling
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    if (selection && selection.length > 0) {
        const el = this.getElement(state, selection[0]);
        if (el) {
            this.aspectRatio = el.width / el.height;
        }
    }
}

updateDimension(prop, value, isTransient = false) {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    const constrain = state.editor.constrainProportions;
    
    selection.forEach(id => {
        const updates = { [prop]: value };
        
        if (constrain && this.aspectRatio) {
            if (prop === 'width') {
                updates.height = value / this.aspectRatio;
                this.hInput.setValue(updates.height, false);
            } else {
                updates.width = value * this.aspectRatio;
                this.wInput.setValue(updates.width, false);
            }
        }
        
        store.dispatch('UPDATE_ELEMENT', { id, ...updates }, { 
            skipHistory: isTransient 
        });
    });
}
```

### 5.3 State Persistence

The constrain toggle state is stored in `state.editor.constrainProportions`:
- **Scope:** Global across all selections
- **Persistence:** Session only (resets on reload)

---

## 6. CSS Specifications

### 6.1 Layout Mode Row

```css
.pi-layout-mode-row {
    display: none;  /* Hidden by default */
    gap: 4px;
    margin-bottom: var(--pi-spacing-row);
}

.pi-layout-mode-row.visible {
    display: flex;
}

.pi-layout-mode-row .icon-button {
    flex: 1;
}

.pi-layout-mode-row .icon-button.active {
    background: var(--color-accent);
    color: var(--color-text-on-accent);
}
```

### 6.2 Dimensions Row

```css
.pi-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pi-row .number-input {
    flex: 1;
}

.pi-row .icon-button {
    flex-shrink: 0;
}
```

---

## 7. Multi-Selection Behavior

Canonical mixed-state display + edit semantics are defined in:
- [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md)

### 7.1 Same Dimensions
- Display shared W/H values
- Changes apply to all selected elements

### 7.2 Different Dimensions
- **Baseline:** Display first element's values; changes set all elements to the same absolute value
- **Target:** Display `—` (mixed) when values differ; typing sets absolute values; arrows/scrub apply relative delta

### 7.3 Constrain Proportions
- **Baseline:** Uses first element’s aspect ratio as the constrain reference.
- **Target:** Each element maintains its own aspect ratio.

---

## 8. Edge Cases

### 8.1 Zero/Negative Dimensions
- **Behavior:** Clamp to minimum of 1px
- **Validation:** Reject values ≤ 0

### 8.2 Very Large Dimensions
- **Behavior:** Allow any positive value
- **Performance:** May degrade with extremely large elements

### 8.3 Grouped Elements
- **Width/Height:** Show bounding box dimensions
- **Resize:** Scale all children proportionally (if group maintains aspect)

### 8.4 Image Elements
- **Natural Size:** Consider adding "Reset to Original Size" action
- **Aspect Ratio:** Often locked by default

---

## 9. Slide/Master Context

When no element is selected, the Layout section appears differently in the Slide section:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layout                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [     Layout Picker Button     ]   <- Opens layout flyout     │
│                                                                 │
│  W [  1920  ]   H [  1080  ]        <- Slide/canvas dimensions │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** Slide dimensions affect the canvas size, not an individual element.

---

## 10. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| W/H Inputs | ✅ | ✅ | ✅ | ✅ |
| Constrain Proportions | ✅ | ✅ | ✅ | ✅ |
| Text Resize Modes | ✅ 3 modes | ✅ 3 modes | ✅ 3 modes | ✅ 3 modes |
| Per-Corner Radius | ❌ (Appearance) | ✅ | ✅ | ✅ |
| Frame Clip Content | ❌ | ✅ | ❌ | ❌ |
| Auto Layout | ❌ | ✅ | ✅ | ✅ |

---

## 11. Future Enhancements

### 11.1 Planned
- [ ] **Reset to original size:** For images and scaled elements
- [ ] **Percentage dimensions:** Relative to parent

### 11.2 Considered
- [ ] **Auto Layout support:** Flexbox-like container layout
- [ ] **Constraints (Pin edges):** Responsive behavior on parent resize
- [ ] **Math expressions:** e.g., "W * 2" or "100 + 50"

---

## 12. Accessibility (ARIA)

### 12.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Auto Size Button | `radio` | `aria-label="Auto Size"`, `aria-checked`, `role="radiogroup"` (parent) | Part of exclusive group |
| Fixed Width Button | `radio` | `aria-label="Fixed Width"`, `aria-checked` | Part of exclusive group |
| Fixed Size Button | `radio` | `aria-label="Fixed Size"`, `aria-checked` | Part of exclusive group |
| Width Input | `spinbutton` | `aria-label="Width"`, `aria-valuenow`, `aria-valuemin="1"`, `aria-disabled` | Min 1px |
| Height Input | `spinbutton` | `aria-label="Height"`, `aria-valuenow`, `aria-valuemin="1"`, `aria-disabled` | Min 1px |
| Constrain Toggle | `button` | `aria-label="Constrain Proportions"`, `aria-pressed` | Toggle state |

### 12.2 Section Container

```html
<section 
  aria-labelledby="layout-section-heading"
  class="pi-section"
>
  <h3 id="layout-section-heading" class="pi-section-header">Layout</h3>
  
  <!-- Text Layout Mode (radio group) -->
  <div role="radiogroup" aria-label="Text Layout Mode">
    <button role="radio" aria-checked="true" aria-label="Auto Size">...</button>
    <button role="radio" aria-checked="false" aria-label="Fixed Width">...</button>
    <button role="radio" aria-checked="false" aria-label="Fixed Size">...</button>
  </div>
  
  <!-- Dimension Inputs -->
</section>
```

### 12.3 Disabled State Handling

When inputs are disabled (e.g., Height in Fixed Width mode):
- Add `aria-disabled="true"` attribute
- Visual indication (dimmed appearance, `opacity: 0.5`)
- Keyboard navigation skips disabled inputs (`tabindex="-1"`)
- Screen reader announces: "Height, disabled"

### 12.4 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between controls in order |
| Arrow Left/Right | Switch between layout mode buttons |
| Arrow Up/Down | Adjust numeric inputs by 1 |
| Shift + Arrow | Adjust numeric inputs by 10 |
| Space/Enter | Toggle constrain proportions |

### 12.5 Screen Reader Announcements

- **Mode change:** "Auto Size selected" / "Fixed Width selected" / "Fixed Size selected"
- **Dimension change:** "Width: 300 pixels" (via aria-valuenow update)
- **Constrain toggle:** "Constrain Proportions on" / "Constrain Proportions off"
- **Disabled state:** "Height input, disabled" when in Auto Size mode

---

## Next Section: [04 - Appearance Section](./04-appearance-section.md)
