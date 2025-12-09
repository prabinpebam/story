# Property Inspector - Effects Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/EffectsSection.js`  
> **Uses:** `Section`, `Button` (xs), `ColorInput`, `NumberInput`, `Dropdown`, `Flyout`, `SliderControl`  
> **DO NOT** create custom sliders, color pickers, or buttons. Use design system components with variants.

---

## 1. Overview

The Effects section manages visual effects applied to selected elements, including drop shadows, inner shadows, layer blurs, and background blurs. Effects can be stacked and individually configured via flyout panels.

### Section Header
- **Title:** "Effects"
- **Actions:** Effect Styles (Grid icon), Add Effect (+)
- **Collapsed by Default:** No (when effects exist)

---

## 2. Layout Structure

### 2.1 With Effects

```
┌─────────────────────────────────────────────────────────────────┐
│  Effects                                           [⊞] [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [◫] Drop Shadow                              [👁] [−]         │
│  [⊞] Layer Blur                               [👁] [−]         │
│  [⊟] Background Blur                          [👁] [−]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Effects                                           [⊞] [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    No effects                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Effect Types

### 3.1 Available Effects

| Effect | Icon | Description |
|--------|------|-------------|
| Drop Shadow | `◫` (box with shadow) | Shadow cast below element |
| Inner Shadow | `◩` (box with inner shadow) | Shadow inside element edges |
| Layer Blur | `⊞` (blur grid) | Gaussian blur on entire layer |
| Background Blur | `⊟` (backdrop blur) | Blur content behind element |

### 3.2 Effect Constraints

| Effect | Multiple | Typical Use |
|--------|----------|-------------|
| Drop Shadow | Single per element | Depth, elevation |
| Inner Shadow | Single per element | Inset depth |
| Layer Blur | Single per element | Soft focus |
| Background Blur | Single per element | Frosted glass |

---

## 4. Effect Row Structure

### 4.1 Row Elements

| Element | Purpose | Interaction |
|---------|---------|-------------|
| Effect Icon | Visual indicator | Click → Open flyout |
| Effect Name | Type label | Click → Open flyout |
| Visibility | Toggle effect | Click to toggle |
| Remove | Delete effect | Click to remove |

### 4.2 Row States

| State | Appearance |
|-------|------------|
| Normal | Default styling |
| Active (Flyout Open) | Highlighted background |
| Invisible | Dimmed text and icon |

---

## 5. Effect Settings Flyout

### 5.1 Common Header

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Drop Shadow      ▾]            [💧] [×]                     │
│   ^ Type selector                  ^ Blend  ^ Close            │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Shadow Properties (Drop Shadow / Inner Shadow)

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Drop Shadow      ▾]            [💧] [×]                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Position                                                       │
│  X [   0   ]    Y [   4   ]                                    │
│                                                                 │
│  Blur                                                          │
│  [⊞] [   8   ]                                                 │
│                                                                 │
│  Spread                                                        │
│  [☼] [   0   ]                                                 │
│                                                                 │
│  Color                                                         │
│  [■] [ 000000 ]  [ 25 ] %                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Shadow Properties Table

| Property | Default | Range | Description |
|----------|---------|-------|-------------|
| X Offset | 0 | -∞ to +∞ | Horizontal displacement |
| Y Offset | 4 | -∞ to +∞ | Vertical displacement |
| Blur | 8 | 0 to ∞ | Blur radius (softness) |
| Spread | 0 | -∞ to +∞ | Expansion/contraction |
| Color | #000000 | Any color | Shadow color |
| Opacity | 25% | 0-100% | Shadow transparency |
| Blend Mode | Normal | Any blend | How shadow composites |

### 5.4 Blur Properties (Layer Blur / Background Blur)

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Layer Blur       ▾]            [×]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mode                                                          │
│  [ Uniform ]  [ Progressive ]                                  │
│                                                                 │
│  Blur                                                          │
│  [⊞] [  12   ]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Blur Properties Table

| Property | Default | Range | Description |
|----------|---------|-------|-------------|
| Mode | Uniform | Uniform/Progressive | Blur distribution |
| Blur | 12 | 0 to ∞ | Blur intensity |

### 5.6 Blur Modes

| Mode | Behavior |
|------|----------|
| Uniform | Equal blur across entire element |
| Progressive | Blur varies (e.g., top-to-bottom gradient) |

---

## 6. Effect Type Switching

### 6.1 Within Flyout

Users can change effect type via the dropdown:

```javascript
changeEffectType(fromType, toType) {
    // Remove old effect
    this.removeEffect(fromType);
    
    // Add new effect with defaults
    this.addEffect(toType);
}
```

### 6.2 Type Compatibility

| From | To | Behavior |
|------|-----|----------|
| Shadow | Shadow | Preserves common properties |
| Shadow | Blur | Uses blur defaults |
| Blur | Blur | Preserves blur value |
| Blur | Shadow | Uses shadow defaults |

---

## 7. Adding Effects

### 7.1 Add Button Behavior

1. Click (+) in header
2. Add default Drop Shadow (most common)
3. Open flyout for the new effect
4. User can change type via dropdown

### 7.2 Default Values

```javascript
const EFFECT_DEFAULTS = {
    dropShadow: {
        x: 0,
        y: 4,
        blur: 8,
        spread: 0,
        color: '#000000',
        opacity: 25,
        blendMode: 'normal',
        visible: true
    },
    innerShadow: {
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: '#000000',
        opacity: 25,
        blendMode: 'normal',
        visible: true
    },
    blur: {
        radius: 12,
        mode: 'uniform',
        visible: true
    },
    backgroundBlur: {
        radius: 12,
        mode: 'uniform',
        visible: true
    }
};
```

---

## 8. Effect Memory System

### 8.1 Session Memory

Last-used settings per effect type:

```javascript
// Remember last shadow settings
propertyMemory.remember('effects.dropShadow', {
    color: shadow.color,
    opacity: shadow.opacity,
    blendMode: shadow.blendMode
});
```

### 8.2 Persistent Memory

Only commonly reused settings persist:

| Setting | Persisted | Reason |
|---------|-----------|--------|
| Shadow Color | ✅ | Brand colors |
| Shadow Opacity | ✅ | Common preference |
| Blend Mode | ✅ | Common preference |
| X/Y Offset | ❌ | Context-specific |
| Blur Radius | ❌ | Context-specific |
| Spread | ❌ | Context-specific |

### 8.3 Storage Keys

```javascript
// localStorage keys
'story.memory.effects.dropShadow'
'story.memory.effects.innerShadow'
'story.memory.effects.layerBlur'
'story.memory.effects.backgroundBlur'
```

---

## 9. Effect Styles

### 9.1 Overview

Effect styles are reusable effect presets saved to the design system.

### 9.2 Style Actions (Header Icon)

- View available effect styles
- Apply style to selection
- Create new style from current effect

### 9.3 Style Structure

```javascript
effectStyle = {
    id: 'style-123',
    name: 'Elevation 1',
    effects: {
        dropShadow: { x: 0, y: 1, blur: 3, spread: 0, ... }
    }
};
```

---

## 10. Visibility Toggle

### 10.1 Behavior

| Icon State | Effect State |
|------------|--------------|
| Eye open | Effect visible/applied |
| Eye crossed | Effect hidden (preserved settings) |

### 10.2 Implementation

```javascript
toggleVisibility(effectType) {
    const state = store.getState();
    const element = this.getElement(state, this.selection[0]);
    const effect = element.style[effectType];
    
    const updatedEffect = {
        ...effect,
        visible: !effect.visible
    };
    
    store.dispatch('UPDATE_ELEMENT', {
        id: element.id,
        style: { [effectType]: updatedEffect }
    });
}
```

---

## 11. Flyout Interaction Model

### 11.1 Opening

| Trigger | Action |
|---------|--------|
| Click effect icon | Open flyout anchored to row |
| Click effect name | Open flyout anchored to row |

### 11.2 Closing

| Trigger | Action |
|---------|--------|
| Click X button | Close flyout |
| Click same row again | Close flyout |
| Click outside flyout | Close flyout |
| Click different effect | Switch to that effect's flyout |

### 11.3 Positioning

- **Anchor:** Effect row in list
- **Direction:** Left of Property Inspector
- **Offset:** Slight gap for visual separation

---

## 12. CSS Specifications

### 12.1 Effect Row

```css
.pi-effect-row {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: 4px;
}

.pi-effect-row:hover {
    background: var(--color-bg-hover);
}

.pi-effect-row.active {
    background: var(--color-accent-subtle);
}

.pi-effect-row.invisible {
    opacity: 0.5;
}
```

### 12.2 Effect Indicator

```css
.pi-effect-indicator {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    color: var(--color-text-secondary);
}
```

### 12.3 Flyout Panel

```css
.pi-flyout-content {
    padding: 12px;
    min-width: 240px;
}

.pi-flyout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
```

---

## 13. Edge Cases

### 13.1 No Effects State

- Show "No effects" empty state
- Auto-collapse section (optional, currently shown)

### 13.2 Background Blur Requirements

- **Requirement:** Element must have transparency
- **Behavior:** Only blurs content behind element bounds

### 13.3 Performance Considerations

- Layer blur can be expensive
- Background blur especially expensive
- Consider warning for large elements

### 13.4 Effect on Groups

- Effects apply to entire group
- Individual children may have separate effects

---

## 14. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Drop Shadow | ✅ | ✅ | ✅ | ✅ |
| Inner Shadow | ✅ | ✅ | ✅ | ✅ |
| Layer Blur | ✅ | ✅ | ✅ | ✅ |
| Background Blur | ✅ | ✅ | ✅ | ✅ |
| Multiple Shadows | ❌ | ✅ | ✅ | ❌ |
| Effect Styles | 🔮 | ✅ | ✅ | ❌ |
| Noise/Texture | ❌ | ✅ | ❌ | ❌ |

---

## 15. Accessibility (ARIA)

### 15.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Effect Styles | `button` | `aria-label="Effect Styles"`, `aria-haspopup="menu"` | Opens styles menu |
| Add Effect (+) | `button` | `aria-label="Add Effect"`, `aria-haspopup="menu"` | Opens effect type menu |
| Effect List | `list` | `aria-label="Effects"` | Container for effect rows |
| Effect Row | `listitem` | `aria-label="Drop Shadow"`, `aria-expanded` | Describes effect type |
| Visibility Toggle | `button` | `aria-label="Hide effect"` / `"Show effect"`, `aria-pressed` | Toggle state |
| Remove Button | `button` | `aria-label="Remove effect"` | Destructive action |
| Effect Flyout | `dialog` | `aria-label="Drop Shadow Settings"`, `aria-modal="false"` | Non-modal |
| Type Dropdown | `combobox` | `aria-label="Effect type"`, `aria-expanded`, `aria-haspopup="listbox"` | Changes effect type |
| Color Swatch | `button` | `aria-label="Shadow color: #000000"`, `aria-haspopup="dialog"` | Dynamic label |
| X Offset Input | `spinbutton` | `aria-label="X offset"`, `aria-valuenow` | Pixels |
| Y Offset Input | `spinbutton` | `aria-label="Y offset"`, `aria-valuenow` | Pixels |
| Blur Input | `spinbutton` | `aria-label="Blur radius"`, `aria-valuenow`, `aria-valuemin="0"` | Pixels |
| Spread Input | `spinbutton` | `aria-label="Spread"`, `aria-valuenow` | Pixels |
| Opacity Input | `spinbutton` | `aria-label="Shadow opacity"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` | Percentage |
| Blend Mode | `combobox` | `aria-label="Blend mode"`, `aria-haspopup="listbox"` | Mode selection |
| Close Flyout | `button` | `aria-label="Close settings"` | Closes dialog |

### 15.2 Section Container

```html
<section 
  aria-labelledby="effects-section-heading"
  class="pi-section"
>
  <h3 id="effects-section-heading" class="pi-section-header">
    Effects
    <button aria-label="Effect Styles" aria-haspopup="menu">⊞</button>
    <button aria-label="Add Effect" aria-haspopup="menu">+</button>
  </h3>
  
  <div role="list" aria-label="Effects">
    <!-- Effect rows -->
  </div>
</section>
```

### 15.3 Effect Row Accessibility

```html
<div 
  role="listitem" 
  aria-label="Drop Shadow"
  aria-expanded="false"  <!-- true when flyout open -->
  tabindex="0"
>
  <span class="effect-icon" aria-hidden="true">◫</span>
  <span>Drop Shadow</span>
  <button aria-label="Hide effect" aria-pressed="false">👁</button>
  <button aria-label="Remove effect">−</button>
</div>
```

### 15.4 Flyout Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between controls in flyout |
| Escape | Close flyout, return focus to row |
| Enter/Space | Activate buttons/toggles |
| Arrow Up/Down | Adjust numeric values |

### 15.5 Screen Reader Announcements

- **Effect added:** "Drop Shadow added. 2 effects total"
- **Effect removed:** "Drop Shadow removed. 1 effect remaining"
- **Flyout opened:** "Drop Shadow settings. X offset: 0, Y offset: 4, Blur: 8"
- **Visibility toggle:** "Drop Shadow hidden" / "Drop Shadow visible"
- **Value change:** "Blur radius: 12 pixels"

### 15.6 Empty State

```html
<div role="status" aria-live="polite">
  No effects applied. Click Add to create an effect.
</div>
```

---

## 16. Test Scenarios & Acceptance Criteria

> **Reference:** [TEST-AUTOMATION-PLAN.md](./TEST-AUTOMATION-PLAN.md) §4.6

### 16.1 Display Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-01 | No effects shows empty state | Element without effects shows "No effects" | P1 |
| EFX-02 | Effects list shows all effects | Element with 2 effects shows 2 rows | P0 |
| EFX-03 | Effect icon matches type | Drop shadow shows shadow icon | P1 |
| EFX-04 | Visibility state shown | Hidden effect has crossed-out eye | P1 |

### 16.2 Add Effect Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-10 | Click add button | Click "+" → effect type menu appears | P0 |
| EFX-11 | Add drop shadow | Select "Drop Shadow" → shadow row appears | P0 |
| EFX-12 | Add layer blur | Select "Layer Blur" → blur row appears | P1 |
| EFX-13 | Add background blur | Select "Background Blur" → row appears | P1 |
| EFX-14 | Default values applied | New drop shadow has X:0, Y:4, Blur:8 defaults | P1 |

### 16.3 Shadow Settings Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-20 | Open shadow flyout | Click shadow row → settings flyout opens | P0 |
| EFX-21 | Change X offset | Enter "10" in X → shadow moves 10px right | P0 |
| EFX-22 | Change Y offset | Enter "8" in Y → shadow moves 8px down | P0 |
| EFX-23 | Change blur radius | Enter "16" in blur → shadow becomes softer | P0 |
| EFX-24 | Change spread | Enter "4" in spread → shadow expands | P1 |
| EFX-25 | Change shadow color | Pick red → shadow becomes red | P0 |
| EFX-26 | Change shadow opacity | Set 50% → shadow becomes semi-transparent | P1 |
| EFX-27 | Negative offset | Enter "-10" in X → shadow moves left | P1 |

### 16.4 Blur Settings Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-30 | Open blur flyout | Click blur row → settings flyout opens | P1 |
| EFX-31 | Change blur radius | Enter "20" → element becomes blurry | P1 |
| EFX-32 | Zero blur | Enter "0" → element is sharp | P1 |
| EFX-33 | Background blur effect | Background blur blurs content behind | P2 |

### 16.5 Effect Management Tests

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-40 | Delete effect | Click "−" → effect removed from list | P0 |
| EFX-41 | Toggle visibility | Click eye → effect hidden (still in list) | P0 |
| EFX-42 | Reorder effects | Drag effect row → order changes | P2 |
| EFX-43 | Close flyout on outside click | Click outside flyout → flyout closes | P1 |
| EFX-44 | Close flyout with Escape | Press Escape in flyout → closes | P1 |

### 16.6 Sync Tests (PI ↔ Viewport)

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-50 | Shadow change updates canvas | Change blur in PI → shadow updates on canvas | P0 |
| EFX-51 | Add effect shows on canvas | Add drop shadow → element shows shadow | P0 |
| EFX-52 | Delete effect updates canvas | Delete shadow → element has no shadow | P0 |
| EFX-53 | Multi-select effect edit | 3 elements → add shadow → all get shadow | P1 |
| EFX-54 | Undo restores effects | Undo shadow add → shadow removed | P1 |

### 16.7 Edge Cases

| ID | Scenario | Expected Behavior | Priority |
|----|----------|-------------------|----------|
| EFX-60 | Large blur values | Enter "100" blur → renders without crash | P2 |
| EFX-61 | Zero opacity shadow | Shadow at 0% → invisible but still in list | P2 |
| EFX-62 | Duplicate effect type | Add 2 drop shadows → both render (if allowed) | P2 |
| EFX-63 | Effect on group | Select group → effects apply to group bounds | P1 |

---

## 17. Future Enhancements

### 17.1 Planned
- [ ] **Multiple shadows:** Stack multiple drop shadows
- [ ] **Effect styles library:** Save and apply effect presets

### 17.2 Considered
- [ ] **Noise effect:** Grain/texture overlay
- [ ] **Color overlay:** Solid color tint
- [ ] **Motion blur:** Directional blur effect
- [ ] **Glow effect:** Outer glow variant

---

## Next Section: [08 - Typography Section](./08-typography-section.md)
