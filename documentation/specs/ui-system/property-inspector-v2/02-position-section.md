# Property Inspector - Position Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/PositionSection.js`

---

## 1. Overview

The Position section controls the spatial placement and orientation of selected elements on the canvas. It is the first section displayed when any element is selected.

### Section Header
- **Title:** "Position"
- **Actions:** None
- **Collapsed by Default:** No

### Components Used

| Component | Source | Usage |
|-----------|--------|-------|
| `Section` | `Section.js` | Collapsible container |
| `Button` | `Button.js` | Alignment buttons (icon-only, `size: 'xs'`, `variant: 'text'`) |
| `NumberInput` | `NumberInput.js` | X, Y, Rotation inputs (`scrubbable: true`) |

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Position                                                    ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [⫷] [⫶] [⫸]  [⊤] [⊥] [⊥]     <- Alignment Row (6 buttons)    │
│                                                                 │
│  X [  100  ]   Y [  200  ]      <- Coordinates Row             │
│                                                                 │
│  ° [ 45.0 ]   [↻] [⇔] [⇕]      <- Transform Row               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Alignment Controls

### 3.1 Button Specifications

| Button | Icon | Action | Title |
|--------|------|--------|-------|
| Align Left | `ALIGN_LEFT` | Align to left edge | "Align Left" |
| Align Center | `ALIGN_CENTER` | Align to horizontal center | "Align Horizontal Center" |
| Align Right | `ALIGN_RIGHT` | Align to right edge | "Align Right" |
| Align Top | `ALIGN_TOP` | Align to top edge | "Align Top" |
| Align Middle | `ALIGN_MIDDLE` | Align to vertical center | "Align Vertical Center" |
| Align Bottom | `ALIGN_BOTTOM` | Align to bottom edge | "Align Bottom" |

### 3.2 Alignment Behavior

#### Single Selection
- Aligns element relative to its **parent frame/slide bounds**
- Example: "Align Left" moves element so its left edge touches the slide's left edge

#### Multi-Selection
- Aligns elements relative to the **selection bounding box**
- Example: "Align Left" moves all elements so their left edges align with the leftmost element

### 3.3 Interaction Behavior

| Aspect | Specification |
|--------|---------------|
| Type | Momentary action button (no toggle state) |
| Hover | Background color change (`--color-bg-hover`) |
| Active/Click | Brief darker background flash |
| Disabled | N/A (always enabled when selection exists) |

### 3.4 Implementation

```javascript
handleAlign(action) {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    
    if (selection.length === 1) {
        // Single: Align to parent/slide bounds
        this.alignToParent(selection[0], action);
    } else {
        // Multi: Align to selection bounds
        this.alignToSelection(selection, action);
    }
}
```

---

## 4. Coordinate Controls (X, Y)

### 4.1 Input Specifications

| Input | Label | Default | Range | Units |
|-------|-------|---------|-------|-------|
| X | "X" | 0 | -∞ to +∞ | pixels |
| Y | "Y" | 0 | -∞ to +∞ | pixels |

### 4.2 Interaction Behavior

| Interaction | Behavior |
|-------------|----------|
| Direct Input | Type numeric value, press Enter to commit |
| Arrow Up | Increment by 1 |
| Arrow Down | Decrement by 1 |
| Shift + Arrow Up | Increment by 10 (Big Nudge) |
| Shift + Arrow Down | Decrement by 10 (Big Nudge) |
| Label Scrub | Drag label left/right to adjust value continuously |

### 4.3 Coordinate Reference Point

- **Default:** Top-left corner of element bounding box
- **Future:** Support for anchor point selection (9-point grid)

### 4.4 Multi-Selection Behavior

Canonical mixed-state display + edit semantics are defined in:
- [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md)

| Scenario | Display | Behavior |
|----------|---------|----------|
| Single Element | Element's X/Y | Direct edit |
| Multi-selection (Baseline) | Selection bounding box origin (top-left) | Typing sets absolute `x/y` on all selected elements (can collapse layout) |
| Multi-selection (Target) | Selection bounding box origin (top-left) | Typing moves the selection bounds to the typed value (delta move), preserving per-element offsets |

---

## 5. Rotation Control

### 5.1 Input Specification

| Input | Label | Default | Range | Units |
|-------|-------|---------|-------|-------|
| Rotation | "°" | 0 | -∞ to +∞ | degrees |

### 5.2 Value Handling

- **Display:** Shows actual rotation value (e.g., 45, 180, 370)
- **Normalization:** Optional - can normalize to 0-360 or allow full range
- **Negative Values:** Supported (e.g., -45° = 315°)

### 5.3 Transform Origin

- **Default:** Center of element bounding box
- **Behavior:** Element rotates around its center point

---

## 6. Transform Buttons

### 6.1 Button Specifications

| Button | Icon | Action | Title |
|--------|------|--------|-------|
| Rotate -90° | `ROTATE_CCW` | Subtract 90° from rotation | "Rotate -90°" |
| Flip Horizontal | `FLIP_H` | Mirror across Y-axis (scaleX = -1) | "Flip Horizontal" |
| Flip Vertical | `FLIP_V` | Mirror across X-axis (scaleY = -1) | "Flip Vertical" |

### 6.2 Flip Behavior

```javascript
handleFlip(direction) {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    
    selection.forEach(id => {
        const el = this.getElement(state, id);
        const prop = direction === 'horizontal' ? 'scaleX' : 'scaleY';
        const current = el[prop] || 1;
        store.dispatch('UPDATE_ELEMENT', { id, [prop]: current * -1 });
    });
}
```

### 6.3 Toggle State

- **Flip Buttons:** Show active/highlighted state when element has negative scale
- **Rotate Button:** Momentary action (no toggle state)

---

## 7. CSS Specifications

### 7.1 Alignment Row

```css
.pi-align-row {
    display: flex;
    gap: 4px;
    margin-bottom: var(--pi-spacing-row);
}

.pi-align-row .icon-button {
    flex: 1;
    min-width: 32px;
}
```

### 7.2 Coordinates Row

```css
.pi-row {
    display: flex;
    gap: 8px;
    margin-bottom: var(--pi-spacing-row);
}

.pi-row .number-input {
    flex: 1;
}
```

### 7.3 Transform Row

```css
.pi-flip-group {
    display: flex;
    gap: 4px;
}
```

---

## 8. Data Flow

### 8.1 Reading Values

```javascript
update(selection) {
    const state = store.getState();
    const element = this.getElement(state, selection[0]);
    
    if (element) {
        this.xInput.setValue(element.x, false);     // Don't trigger onChange
        this.yInput.setValue(element.y, false);
        this.rotationInput.setValue(element.rotation || 0, false);
    }
}
```

### 8.2 Writing Values

```javascript
updateProperty(prop, value, isTransient = false) {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    
    selection.forEach(id => {
        store.dispatch('UPDATE_ELEMENT', { 
            id, 
            [prop]: value 
        }, { 
            skipHistory: isTransient 
        });
    });
}
```

---

## 9. Edge Cases

### 9.1 Negative Coordinates
- **Behavior:** Fully supported
- **Display:** Shows negative values (e.g., -100)

### 9.2 Decimal Values
- **Behavior:** Supported to 2 decimal places
- **Rounding:** Round to nearest pixel for display, preserve precision in state

### 9.3 Group Selection
- **Coordinates:** Show bounding box top-left (not individual element positions)
- **Rotation:** Show first element's rotation or "Mixed"

### 9.4 Locked Elements
- **Future:** Disable inputs when element is locked
- **Current:** No lock functionality implemented

---

## 10. Accessibility (ARIA)

### 10.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Align Left | `button` | `aria-label="Align Left"` | Describes action |
| Align Center | `button` | `aria-label="Align Horizontal Center"` | Full description |
| Align Right | `button` | `aria-label="Align Right"` | Describes action |
| Align Top | `button` | `aria-label="Align Top"` | Describes action |
| Align Middle | `button` | `aria-label="Align Vertical Center"` | Full description |
| Align Bottom | `button` | `aria-label="Align Bottom"` | Describes action |
| X Input | `spinbutton` | `aria-label="X position"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | Spinbutton role for numeric |
| Y Input | `spinbutton` | `aria-label="Y position"`, `aria-valuenow` | Spinbutton role for numeric |
| Rotation Input | `spinbutton` | `aria-label="Rotation in degrees"`, `aria-valuenow` | Units in label |
| Rotate -90° | `button` | `aria-label="Rotate counter-clockwise 90 degrees"` | Full description |
| Flip Horizontal | `button` | `aria-label="Flip Horizontal"`, `aria-pressed` | Toggle state |
| Flip Vertical | `button` | `aria-label="Flip Vertical"`, `aria-pressed` | Toggle state |

### 10.2 Section Container

```html
<section 
  aria-labelledby="position-section-heading"
  class="pi-section"
>
  <h3 id="position-section-heading" class="pi-section-header">Position</h3>
  <!-- Controls -->
</section>
```

### 10.3 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Tab | Move between controls in order |
| Enter/Space | Activate buttons |
| Arrow Up/Down | Adjust numeric inputs by 1 |
| Shift + Arrow | Adjust numeric inputs by 10 |
| Home | Set to minimum (if defined) |
| End | Set to maximum (if defined) |

### 10.4 Screen Reader Announcements

- **Value changes:** Announce new value after adjustment (via `aria-live="polite"` on value display)
- **Action results:** Announce alignment action completion
- **Multi-select context:** Announce "Multiple elements selected" when applicable

---

## 11. Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| Arrow Keys | Move element by 1px | Element selected on canvas |
| Shift + Arrow | Move element by 10px | Element selected on canvas |
| R | Activate rotation mode | Canvas focused |
| H | Flip horizontal | Element selected |
| V | Flip vertical | Element selected |

**Note:** These shortcuts are canvas-level, not PI-level.

---

## 12. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Alignment Buttons | ✅ 6 | ✅ 6 + Distribute | ✅ 6 | ✅ 6 |
| Coordinate Inputs | ✅ X, Y | ✅ X, Y + Reference Point | ✅ X, Y | ✅ X, Y |
| Rotation Input | ✅ | ✅ | ✅ | ✅ |
| Flip Buttons | ✅ 2 | ✅ 2 | ✅ 2 | ✅ 2 |
| Distribute Controls | ❌ | ✅ | ✅ | ✅ |
| Anchor Point Selector | ❌ | ✅ | ✅ | ❌ |
| Constraints | ❌ | ✅ | ✅ | ✅ |

---

## 13. Test Scenarios & Acceptance Criteria

> **Reference:** [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) §4.1

### 13.1 Display Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-01 | X input shows element.x value | When element at x=150 is selected, X input displays "150" | P0 |
| POS-02 | Y input shows element.y value | When element at y=200 is selected, Y input displays "200" | P0 |
| POS-03 | Rotation shows element.rotation | When element rotated 45°, rotation input displays "45" | P0 |
| POS-04 | Multi-select same values shows value | Two elements at x=100, X input shows "100" | P0 |
| POS-05 | Multi-select mixed values shows "–" | Elements at x=100 and x=200, X input shows "–" | P0 |

### 13.2 Input Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-10 | Typing X value updates element | Enter "250" in X input → element moves to x=250 | P0 |
| POS-11 | Typing Y value updates element | Enter "150" in Y input → element moves to y=150 | P0 |
| POS-12 | Scrubbing X updates element live | Drag on X label → element moves horizontally in real-time | P0 |
| POS-13 | Tab moves to next input | Tab from X → focus moves to Y | P1 |
| POS-14 | Enter commits and blurs | Press Enter in input → value commits, input loses focus | P1 |
| POS-15 | Escape cancels edit | Press Escape while editing → reverts to original value | P1 |
| POS-16 | Arrow keys adjust by 1 | Press Up in X input → value increases by 1 | P1 |
| POS-17 | Shift+Arrow adjusts by 10 | Press Shift+Up in X input → value increases by 10 | P1 |

### 13.3 Alignment Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-20 | Align Left (single) | Element's left edge aligns to slide's left edge | P1 |
| POS-21 | Align Center (single) | Element centered horizontally in slide | P1 |
| POS-22 | Align Left (multi) | All elements' left edges align to leftmost element | P1 |
| POS-23 | Align Middle (multi) | All elements centered vertically to selection bounds | P1 |

### 13.4 Transform Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-30 | Rotation input accepts 0-360 | Values outside range clamp or wrap | P1 |
| POS-31 | Flip Horizontal mirrors element | Element flipped around vertical axis | P1 |
| POS-32 | Flip Vertical mirrors element | Element flipped around horizontal axis | P1 |

### 13.5 Sync Tests (PI ↔ Viewport)

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-40 | Canvas drag updates PI | Drag element on canvas → X/Y inputs update immediately | P0 |
| POS-41 | Canvas resize updates PI | Resize element on canvas → W/H inputs update | P0 |
| POS-42 | Canvas rotate updates PI | Rotate element on canvas → Rotation input updates | P0 |
| POS-43 | PI change triggers canvas update | Change X in PI → element moves on canvas | P0 |
| POS-44 | Undo restores both PI and canvas | Undo after PI change → both PI and canvas revert | P1 |

### 13.6 Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| POS-50 | Negative position values | Negative X/Y accepted and applied correctly | P1 |
| POS-51 | Decimal values | X=100.5 accepted and displayed with precision | P1 |
| POS-52 | Invalid input (letters) | Non-numeric input rejected, reverts to previous value | P1 |
| POS-53 | Empty input on blur | Empty field reverts to previous valid value | P1 |

---

## 14. Future Enhancements

### 14.1 Planned
- [ ] **Distribute controls:** Even horizontal/vertical spacing
- [ ] **Anchor point selector:** 9-point grid for transform origin
- [ ] **Constraints system:** Pin edges/center to parent

### 14.2 Considered
- [ ] **Smart alignment guides:** Real-time snapping feedback
- [ ] **Relative positioning:** % values relative to parent
- [ ] **Math expressions:** e.g., "100 + 50" in input fields

---

## Next Section: [03 - Layout Section](./03-layout-section.md)
