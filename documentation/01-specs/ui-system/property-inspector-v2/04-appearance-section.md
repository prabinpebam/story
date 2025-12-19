# Property Inspector - Appearance Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/AppearanceSection.js`  
> **Uses:** `Section`, `Button` (xs), `NumberInput` (scrubbable), `Dropdown`, `SliderControl`  
> **DO NOT** create custom sliders, inputs, or toggles. Use design system components with variants.

---

## 1. Overview

The Appearance section controls visibility, opacity, blend mode, and corner radius of selected elements. It provides fundamental styling properties that affect how elements render and composite.

### Section Header
- **Title:** "Appearance"
- **Actions:** Visibility toggle (Eye icon)
- **Collapsed by Default:** No

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Appearance                                           [👁]   ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Opacity [  100  ] %   [ Normal            ▾]  <- Opacity Row  │
│                                                                 │
│  Radius  [   0   ]                              <- Radius Row  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Visibility Toggle

### 3.1 Header Action

| State | Icon | Element Display |
|-------|------|-----------------|
| Visible | `VISIBLE` (Eye open) | Element renders normally |
| Hidden | `HIDDEN` (Eye crossed) | Element is hidden on canvas |

### 3.2 Behavior

```javascript
toggleVisibility() {
    const state = store.getState();
    const selection = state.editor.selectedElementIds;
    
    // Toggle based on first item
    const firstEl = this.getElement(state, selection[0]);
    const newHidden = !firstEl.hidden;
    
    selection.forEach(id => {
        store.dispatch('UPDATE_ELEMENT', { id, hidden: newHidden });
    });
}
```

### 3.3 Hidden Element Behavior

- Hidden elements remain selectable in the canvas
- Layer panel shows visibility indicator
- Export respects visibility (hidden elements not exported)

---

## 4. Opacity Control

### 4.1 Input Specification

| Property | Value |
|----------|-------|
| Label | "Opacity" |
| Default | 100 |
| Range | 0 - 100 |
| Units | % |
| Step | 1 |

### 4.2 Internal vs Display Value

| Context | Range | Conversion |
|---------|-------|------------|
| UI Display | 0 - 100% | Human-readable |
| Internal State | 0 - 1 | Normalized |

```javascript
// Reading: Convert from internal (0-1) to display (0-100)
const opacity = element.opacity !== undefined ? element.opacity : 1;
this.opacityInput.setValue(Math.round(opacity * 100), false);

// Writing: Convert from display (0-100) to internal (0-1)
updateProperty('opacity', val / 100, isTransient);
```

### 4.3 Interaction Behavior

| Interaction | Behavior |
|-------------|----------|
| Direct Input | Type 0-100, press Enter |
| Arrow Up | +1% |
| Arrow Down | -1% |
| Shift + Arrow | ±10% |
| Scrub | Drag label for continuous adjustment |

---

## 5. Blend Mode Control

### 5.1 Dropdown Options

| Value | Label |
|-------|-------|
| `normal` | Normal |
| `multiply` | Multiply |
| `screen` | Screen |
| `overlay` | Overlay |
| `darken` | Darken |
| `lighten` | Lighten |
| `color-dodge` | Color Dodge |
| `color-burn` | Color Burn |
| `hard-light` | Hard Light |
| `soft-light` | Soft Light |
| `difference` | Difference |
| `exclusion` | Exclusion |
| `hue` | Hue |
| `saturation` | Saturation |
| `color` | Color |
| `luminosity` | Luminosity |

### 5.2 Blend Mode Descriptions

| Mode | Effect |
|------|--------|
| Normal | No blending, standard compositing |
| Multiply | Darkens by multiplying colors |
| Screen | Lightens by inverting, multiplying, inverting |
| Overlay | Combines Multiply and Screen |
| Darken | Keeps darker pixels |
| Lighten | Keeps lighter pixels |
| Color Dodge | Brightens underlying color |
| Color Burn | Darkens underlying color |

### 5.3 Implementation

```javascript
this.blendModeSelect = new Dropdown({
    options: [...], // All blend mode options
    value: 'normal',
    size: 'fill',
    onChange: (val) => this.updateProperty('blendMode', val)
});
```

---

## 6. Corner Radius Control

### 6.1 Element Type Support

Corner radius is **only applicable** to certain element types. The control must be hidden or disabled for unsupported types.

| Element Type | Radius Support | Reason |
|--------------|----------------|--------|
| Rectangle | ✅ Enabled | Has geometric corners |
| Image | ✅ Enabled | Can clip with rounded corners |
| Frame | ✅ Enabled | Container with corners |
| Ellipse | ❌ Disabled/Hidden | Already curved, no corners |
| Circle | ❌ Disabled/Hidden | Already curved, no corners |
| Text | ❌ Disabled/Hidden | Text box has no visible border |
| Line | ❌ Disabled/Hidden | No corners |
| Group | ❌ Disabled/Hidden | Virtual container, no border |
| Path/Vector | ⚠️ Conditional | Only if closed shape with corners |

### 6.2 Uniform vs Per-Corner Mode

The radius control should support both **uniform** (all corners same) and **independent** (per-corner) modes:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  UNIFORM MODE (default):                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Radius  [   8   ]  [🔗]    <- Single input + link icon │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PER-CORNER MODE (when unlinked):                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Radius  [🔗̸]                 <- Unlinked indicator     │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  TL [  8  ]          TR [  8  ]                   │  │   │
│  │  │                                                    │  │   │
│  │  │  BL [  4  ]          BR [  4  ]                   │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Input Specification

**Uniform Mode:**

| Property | Value |
|----------|-------|
| Label | "Radius" |
| Default | 0 |
| Range | 0 - min(width/2, height/2) |
| Units | pixels |
| Step | 1 |

**Per-Corner Mode:**

| Input | Label | Position |
|-------|-------|----------|
| Top-Left | "TL" | Upper-left |
| Top-Right | "TR" | Upper-right |
| Bottom-Left | "BL" | Lower-left |
| Bottom-Right | "BR" | Lower-right |

### 6.4 Link/Unlink Toggle

| State | Icon | Behavior |
|-------|------|----------|
| Linked (default) | 🔗 Chain | All corners update together |
| Unlinked | 🔗̸ Broken chain | Each corner independent |

**Toggle Behavior:**

```javascript
onLinkToggle() {
    if (this.isLinked) {
        // Switching to unlinked: preserve current values
        this.isLinked = false;
        this.showPerCornerInputs();
    } else {
        // Switching to linked: average or use max
        const avg = (tl + tr + bl + br) / 4;
        this.isLinked = true;
        this.setAllCorners(avg);
        this.showUniformInput();
    }
}
```

### 6.5 Implementation

**Current (Uniform Only):**

```javascript
// Only show radius for rect/image/frame
const supportsRadius = ['rect', 'rectangle', 'image', 'frame'].includes(element.type);

if (supportsRadius) {
    this.radiusRow.classList.remove('hidden');
    const radius = element.borderRadius || 0;
    this.radiusInput.setValue(radius, false);
} else {
    this.radiusRow.classList.add('hidden');
}
```

**Enhanced (Per-Corner Support):**

```javascript
// Check if per-corner values exist
const hasPerCorner = element.borderRadiusTL !== undefined ||
                     element.borderRadiusTR !== undefined ||
                     element.borderRadiusBL !== undefined ||
                     element.borderRadiusBR !== undefined;

if (hasPerCorner) {
    this.isLinked = false;
    this.showPerCornerInputs();
    this.tlInput.setValue(element.borderRadiusTL || 0);
    this.trInput.setValue(element.borderRadiusTR || 0);
    this.blInput.setValue(element.borderRadiusBL || 0);
    this.brInput.setValue(element.borderRadiusBR || 0);
} else {
    this.isLinked = true;
    this.showUniformInput();
    this.radiusInput.setValue(element.borderRadius || 0);
}
```

### 6.6 Data Model

**Uniform Radius:**
```javascript
element.borderRadius = 8;  // Single value for all corners
```

**Per-Corner Radius:**
```javascript
element.borderRadius = null;  // Or undefined
element.borderRadiusTL = 8;   // Top-left
element.borderRadiusTR = 8;   // Top-right
element.borderRadiusBL = 4;   // Bottom-left
element.borderRadiusBR = 4;   // Bottom-right
```

**CSS Output:**
```css
/* Uniform */
border-radius: 8px;

/* Per-corner */
border-radius: 8px 8px 4px 4px;  /* TL TR BR BL */
```

### 6.7 Maximum Radius Calculation

Corner radius should not exceed half the smallest dimension:

```javascript
getMaxRadius(element) {
    const maxFromWidth = element.width / 2;
    const maxFromHeight = element.height / 2;
    return Math.min(maxFromWidth, maxFromHeight);
}

// Clamp value on input
onRadiusChange(value) {
    const max = this.getMaxRadius(this.element);
    const clamped = Math.min(value, max);
    this.updateProperty('borderRadius', clamped);
}
```

### 6.8 Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| Tab | Move to next corner input | Per-corner mode |
| Shift+Tab | Move to previous corner input | Per-corner mode |
| Arrow Up | Increment by 1 | Any radius input |
| Arrow Down | Decrement by 1 | Any radius input |
| Shift+Arrow | Increment/Decrement by 10 | Any radius input |

---

## 7. CSS Specifications

### 7.1 Opacity Row

```css
.pi-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

/* Fixed width for opacity input to accommodate "100%" */
.pi-input-fixed-width {
    width: 64px;
    flex-shrink: 0;
}

/* Blend mode dropdown takes remaining space */
.pi-row .dropdown {
    flex: 1;
}
```

### 7.2 Radius Row (Uniform)

```css
.pi-radius-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.pi-radius-row .number-input {
    flex: 1;
}

.pi-radius-row .link-toggle {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
}
```

### 7.3 Radius Row (Per-Corner)

```css
.pi-radius-per-corner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 8px;
    background: var(--color-bg-input);
    border-radius: 4px;
    margin-top: 4px;
}

.pi-radius-per-corner .number-input {
    width: 100%;
}
```

---

## 8. Multi-Selection Behavior

Canonical mixed-state display + edit semantics are defined in:
- [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md)

This section uses the **Baseline vs Target** model from 17:
- **Baseline:** current Story behavior that must remain consistent and non-surprising
- **Target:** Figma-referenced parity for overlapping interactions

### 8.1 Opacity

| Scenario | Display | Behavior |
|----------|---------|----------|
| Same Opacity | Shared value | Edit all together |
| Different | "—" (mixed) | Type sets absolute; arrows/scrub apply relative delta; commit is single undo |

### 8.2 Blend Mode

| Scenario | Display | Behavior |
|----------|---------|----------|
| Same Mode | Shared mode | Edit all together |
| Different (Baseline) | First or "Multiple" | Sets all to same mode |
| Different (Target) | "Mixed" | Sets all to same mode; dropdown menu shows no stale selection highlight |

### 8.3 Visibility

| Scenario | Icon State | Toggle Behavior |
|----------|------------|-----------------|
| All Visible | Eye open | Hides all |
| All Hidden | Eye crossed | Shows all |
| Mixed (Baseline) | Partial icon or first-state icon | Applies a consistent toggle behavior (must not silently affect only one element) |
| Mixed (Target) | Indeterminate | Click sets all visible (see 17 §5.4) |

### 8.4 Corner Radius

Figma-referenced parity expectation (for overlapping behaviors) is defined in [17-multi-selection-and-mixed-state.md](./17-multi-selection-and-mixed-state.md) (structured properties + mixed state).

| Scenario | Baseline (Current Story, non-breaking) | Target (Figma-referenced parity) |
|----------|----------------------------------------|----------------------------------|
| All selected elements support radius | Control enabled; may display first/active element value; edits set the same radius on all selected elements | Mixed-aware (uniform vs per-corner vs unset); edits apply to all selected elements with correct mixed indicators |
| Some support radius | Control enabled; edits apply only to supporting types (no-op for others) | Same as Baseline, but with explicit “not applicable” handling per 17 (no silent partial edits) |
| None support radius | Control hidden/disabled | Control hidden/disabled |
| Mixed uniform vs per-corner across selection | May show first/active state | Shows “Mixed”; choosing uniform sets all uniform; per-corner edits set all per-corner |

---

## 9. Edge Cases

### 9.1 Opacity Boundaries

```javascript
// Clamp opacity to valid range
const clamped = Math.max(0, Math.min(100, value));
```

### 9.2 Radius vs. Size

If corner radius exceeds half the smallest dimension:
- **Behavior:** Clamp to max valid radius
- **Visual:** Creates pill/capsule shape at maximum

### 9.3 Radius on Resize

When element is resized:
- **If radius > max:** Auto-clamp to new max
- **Alternative:** Preserve value, CSS handles overflow

### 9.4 Blend Mode on Groups

- **Behavior:** Applied to entire group composition
- **Note:** Individual children may have their own blend modes

---

## 10. Accessibility (ARIA)

### 10.1 Section ARIA

```html
<div class="pi-section" role="group" aria-labelledby="appearance-section-title">
    <button 
        id="appearance-section-title"
        class="pi-section-header"
        aria-expanded="true"
        aria-controls="appearance-content"
    >
        Appearance
    </button>
    <div id="appearance-content" role="region">
        <!-- Controls -->
    </div>
</div>
```

### 10.2 Control ARIA

```html
<!-- Opacity -->
<input 
    type="number"
    aria-label="Opacity percentage"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow="100"
/>

<!-- Blend Mode -->
<select aria-label="Blend mode">
    <option value="normal">Normal</option>
    <!-- ... -->
</select>

<!-- Radius Link Toggle -->
<button 
    aria-label="Link corner radii"
    aria-pressed="true"
    title="Toggle independent corner radii"
>🔗</button>

<!-- Radius Input (Uniform) -->
<input 
    type="number"
    aria-label="Corner radius"
    aria-valuemin="0"
/>

<!-- Radius Inputs (Per-Corner) -->
<input type="number" aria-label="Top-left corner radius" />
<input type="number" aria-label="Top-right corner radius" />
<input type="number" aria-label="Bottom-left corner radius" />
<input type="number" aria-label="Bottom-right corner radius" />
```

### 10.3 Screen Reader Announcements

| Event | Announcement |
|-------|--------------|
| Radius linked | "Corner radii linked" |
| Radius unlinked | "Corner radii unlinked, individual controls available" |
| Radius disabled | "Corner radius not available for this element type" |

---

## 11. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Opacity Slider | ✅ Input | ✅ Slider + Input | ✅ Slider | ✅ Slider |
| Blend Mode | ✅ Dropdown | ✅ Dropdown | ✅ Dropdown | ✅ Dropdown |
| Visibility Toggle | ✅ Header | ✅ Layer Panel | ✅ Layer Panel | ✅ Layer Panel |
| Uniform Radius | ✅ | ✅ | ✅ | ✅ |
| Per-Corner Radius | 🔜 Planned | ✅ | ✅ | ✅ |
| Link/Unlink Toggle | 🔜 Planned | ✅ | ✅ | ✅ |
| Smoothing | ❌ | ✅ | ✅ | ❌ |

---

## 12. Test Scenarios & Acceptance Criteria

> **Reference:** [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) §4.2

### 12.1 Display Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-01 | Opacity shows element value | Element at 80% opacity shows "80" in input | P0 |
| APP-02 | Blend mode shows current mode | Element with "multiply" shows "Multiply" in dropdown | P0 |
| APP-03 | Visibility icon reflects state | Hidden element shows crossed-out eye icon | P0 |
| APP-04 | Corner radius shows value | Element with 10px radius shows "10" in input | P1 |
| APP-05 | Per-corner shows individual values | Unlinked corners show 4 separate inputs | P2 |

### 12.2 Opacity Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-10 | Type opacity value | Enter "50" → element becomes 50% transparent | P0 |
| APP-11 | Scrub opacity | Drag on opacity label → opacity changes live | P0 |
| APP-12 | Opacity clamps to 0-100 | Enter "150" → clamps to "100" | P1 |
| APP-13 | Opacity accepts decimals | Enter "55.5" → element becomes 55.5% opaque | P2 |

### 12.3 Blend Mode Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-20 | Open blend mode dropdown | Click dropdown → shows all blend modes | P0 |
| APP-21 | Select multiply | Select "Multiply" → element uses multiply blending | P0 |
| APP-22 | Preview on hover | Hover blend mode → element shows preview | P2 |
| APP-23 | All modes available | Dropdown contains: Normal, Multiply, Screen, Overlay, etc. | P1 |

### 12.4 Visibility Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-30 | Toggle visibility off | Click eye icon → element hidden on canvas | P0 |
| APP-31 | Toggle visibility on | Click crossed eye → element visible again | P0 |
| APP-32 | Hidden state persists | Refresh page → hidden element stays hidden | P1 |

### 12.5 Corner Radius Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-40 | Set uniform radius | Enter "10" → all corners become 10px | P1 |
| APP-41 | Radius clamps to max | Enter "500" on 100x100 element → clamps to 50 | P1 |
| APP-42 | Toggle per-corner mode | Click unlink → shows 4 individual inputs | P2 |
| APP-43 | Set individual corners | In per-corner mode, set TL=5, TR=10 → corners differ | P2 |
| APP-44 | Radius disabled for circles | Select circle → radius controls disabled | P1 |

### 12.6 Sync Tests (PI ↔ Viewport)

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-50 | Opacity change updates canvas | Change opacity in PI → canvas reflects change | P0 |
| APP-51 | Multi-select opacity | 3 elements at 50% → PI shows "50" | P0 |
| APP-52 | Mixed opacity shows dash | 2 elements at 50% and 80% → PI shows "–" | P0 |
| APP-53 | Undo restores appearance | Undo opacity change → PI and canvas revert | P1 |

### 12.7 Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| APP-60 | Group appearance | Select group → shows group's opacity, not children | P1 |
| APP-61 | Zero opacity | Set 0% → element invisible but selectable | P2 |
| APP-62 | Invalid input | Enter "abc" in opacity → reverts to previous value | P1 |

---

## 13. Future Enhancements

### 13.1 Planned
- [ ] **Per-corner radius:** Individual control for each corner
- [ ] **Link/unlink toggle:** Switch between uniform and per-corner
- [ ] **Corner radius presets:** Quick access to common values (0, 4, 8, 16, etc.)

### 13.2 Considered
- [ ] **Opacity slider:** Visual slider in addition to numeric input
- [ ] **Smoothing control:** iOS-style corner smoothing (squircle)
- [ ] **Fill opacity vs Layer opacity:** Separate controls

---

## See Also

- [03-layout-section.md](./03-layout-section.md) - Dimensions that affect max radius
- [12-interactions.md](./12-interactions.md) - Input interaction patterns
- [15-glossary.md](./15-glossary.md) - Term definitions

---

## Next Section: [05 - Fill Section](./05-fill-section.md)
