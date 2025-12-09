# Property Inspector - Stroke Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/StrokeSection.js`  
> **Uses:** `Section`, `Button` (xs), `ColorInput`, `NumberInput`, `Dropdown`, `Flyout`, `SegmentedControl`  
> **DO NOT** create custom color pickers, inputs, or buttons. Use design system components with variants.

---

## 1. Overview

The Stroke section manages border properties of selected elements. It supports multiple stacked strokes, solid and gradient colors, and advanced stroke settings like dashes, joins, and per-side application.

### Section Header
- **Title:** "Stroke"
- **Actions:** Add Stroke (+), Presets (Grid icon)
- **Collapsed by Default:** No

---

## 2. Layout Structure

### 2.1 With Strokes

```
┌─────────────────────────────────────────────────────────────────┐
│  Stroke                                            [+] [⊞]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [≡] [■] #000000  100%  [ 2 ]  Inside ▾  [⊡] [⚙] [👁] [−]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Stroke                                            [+] [⊞]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      No stroke                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Stroke Row Structure

### 3.1 Row Elements (Left to Right)

| Element | Purpose | Interaction |
|---------|---------|-------------|
| Drag Handle | Reorder strokes | Drag up/down |
| Color Swatch | Preview stroke color | Click → Color Picker |
| Hex Input | Color value | Editable text |
| Opacity Input | Stroke opacity | Numeric (0-100%) |
| Width Input | Stroke thickness | Numeric (px) |
| Position | Inside/Center/Outside | Dropdown |
| Sides | Which sides have stroke | Icon menu |
| Settings | Advanced settings | Opens flyout |
| Visibility | Toggle stroke | Click to toggle |
| Remove | Delete stroke | Click to remove |

### 3.2 Stroke Properties

| Property | Type | Default | Range |
|----------|------|---------|-------|
| color | Hex string | #000000 | Any color |
| opacity | Percentage | 100 | 0-100 |
| width | Number | 1 | 0-∞ |
| position | Enum | 'center' | inside, center, outside |
| visible | Boolean | true | - |

---

## 4. Stroke Position

### 4.1 Position Options

| Position | Behavior |
|----------|----------|
| Inside | Stroke drawn inside element bounds |
| Center | Stroke centered on edge (half inside, half outside) |
| Outside | Stroke drawn outside element bounds |

### 4.2 Visual Comparison

```
Inside:         Center:         Outside:
┌────────┐      ┌────────┐      ┌────────┐
│ ████████│     │████████│      ████████
│ █      █│     █        █      █ ┌────┐ █
│ █      █│     █        █      █ │    │ █
│ █      █│     █        █      █ │    │ █
│ ████████│     │████████│      █ └────┘ █
└────────┘      └────────┘      ████████
                                └────────┘
```

### 4.3 Position Impact on Bounds

| Position | Element Bounds | Total Visual Size |
|----------|----------------|-------------------|
| Inside | Unchanged | Same as bounds |
| Center | Unchanged | Bounds + (width/2) each side |
| Outside | Unchanged | Bounds + width each side |

---

## 5. Stroke Sides Selector

### 5.1 Menu Options

| Option | Icon | Result |
|--------|------|--------|
| All | □ | All 4 sides |
| Top | ─ (top) | Top edge only |
| Right | │ (right) | Right edge only |
| Bottom | ─ (bottom) | Bottom edge only |
| Left | │ (left) | Left edge only |
| Custom | ⊡ | Opens multi-select |

### 5.2 Custom Sides Dialog

```
┌─────────────────────────────────────────┐
│  Select Sides                           │
├─────────────────────────────────────────┤
│                                         │
│       [✓] Top                          │
│                                         │
│  [✓] Left  ┌────────┐  [✓] Right      │
│            │        │                   │
│            └────────┘                   │
│                                         │
│       [ ] Bottom                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Stroke Settings Flyout

### 6.1 Flyout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Stroke settings                                          [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ Basic ]  [ Dynamic ]  [ Brush ]      <- Mode Tabs           │
│                                                                 │
│  Style:   [ Solid        ▾]             <- Line style          │
│                                                                 │
│  Width Profile:                                                 │
│  [═══════════════════════════]  [↻] [⇔]  <- Profile preview    │
│                                                                 │
│  Joins:   [⊢] [○] [◇]                   <- Miter/Round/Bevel   │
│                                                                 │
│  Miter Angle:  [ 28.96 ] °              <- (Miter only)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Mode Tabs

| Tab | Status | Description |
|-----|--------|-------------|
| Basic | ✅ Implemented | Standard stroke properties |
| Dynamic | 🔮 Future | Pressure/speed-based width |
| Brush | 🔮 Future | Stylized brush strokes |

### 6.3 Line Style Options

| Style | Pattern |
|-------|---------|
| Solid | ───────────────── |
| Dashed | ─ ─ ─ ─ ─ ─ ─ ─ |
| Dotted | · · · · · · · · · |
| Mixed | ─ · ─ · ─ · ─ · |

### 6.4 Dash Pattern (When Dashed/Mixed)

| Property | Description |
|----------|-------------|
| Dash | Length of dash segment |
| Gap | Length of gap between dashes |
| Offset | Starting offset |

### 6.5 Join Types

| Join | Icon | Use Case |
|------|------|----------|
| Miter | ⊢ | Sharp corners |
| Round | ○ | Smooth rounded corners |
| Bevel | ◇ | Cut-off flat corners |

### 6.6 Miter Limit

- **Purpose:** Controls when miter joins convert to bevel
- **Value:** Angle threshold in degrees
- **Default:** 28.96°
- **Behavior:** Sharp angles below threshold become bevel

---

## 7. Gradient Strokes

### 7.1 Gradient Type Selection

Same as fill gradients:
- Linear
- Radial
- Angular
- Diamond

### 7.2 Gradient Stroke Display

```
┌─────────────────────────────────────────────────────────────────┐
│  [≡] [▦] Gradient  100%  [ 2 ]  Center ▾  [⊡] [⚙] [👁] [−]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Multiple Strokes

### 8.1 Stack Order

- **Visual:** Bottom stroke in list renders first (background)
- **Layering:** Top strokes overlay bottom strokes

### 8.2 Use Cases

| Scenario | Example |
|----------|---------|
| Border effect | Thin inside + thick outside |
| Glow effect | Wide blurred + narrow solid |
| Decorative | Multiple colors at different widths |

---

## 9. Stroke Memory System

### 9.1 Last Used Values

```javascript
const LastUsed = {
    solid: '#000000',
    gradient: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)'
};
```

### 9.2 Session Persistence

- Stroke color and width remembered per session
- Applied when adding new strokes

---

## 10. Implementation Details

### 10.1 Stroke Data Structure

```javascript
stroke = {
    type: 'solid',           // solid, gradient
    color: '#000000',        // For solid
    value: 'linear-...',     // For gradient
    opacity: 100,            // 0-100
    width: 1,                // pixels
    position: 'center',      // inside, center, outside
    sides: 'all',            // all, top, right, bottom, left, custom
    customSides: {           // When sides === 'custom'
        top: true,
        right: true,
        bottom: false,
        left: true
    },
    style: 'solid',          // solid, dashed, dotted
    dashPattern: {           // When style !== 'solid'
        dash: 4,
        gap: 2,
        offset: 0
    },
    join: 'miter',           // miter, round, bevel
    miterAngle: 28.96,       // degrees
    visible: true
}
```

### 10.2 Legacy Migration

```javascript
// Convert legacy borderWidth/borderColor to strokes array
if (style.borderWidth > 0 && !style.strokes) {
    strokes = [{
        color: style.borderColor || '#000000',
        width: style.borderWidth,
        opacity: 100,
        position: style.strokeAlign || 'center',
        visible: true
    }];
}
```

---

## 11. CSS Specifications

### 11.1 Stroke Row

```css
.stroke-row {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 0;
}

.stroke-drag-handle {
    cursor: grab;
    opacity: 0.5;
}

.stroke-drag-handle:hover {
    opacity: 1;
}

.stroke-row.dragging {
    opacity: 0.5;
}

.stroke-row.drag-over-top {
    border-top: 2px solid var(--color-accent);
}

.stroke-row.drag-over-bottom {
    border-bottom: 2px solid var(--color-accent);
}
```

### 11.2 Stroke Swatch

```css
.stroke-swatch-trigger {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
}

.stroke-preview {
    width: 100%;
    height: 100%;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}
```

---

## 12. Edge Cases

### 12.1 Zero Width Stroke

- **Behavior:** Treated as no stroke (hidden)
- **Display:** May show in list with warning

### 12.2 Very Wide Strokes

- **Inside Position:** Capped at element size / 2
- **Center/Outside:** No cap, may extend significantly

### 12.3 Complex Shapes

- **Miter issues:** Very sharp angles may need bevel
- **Per-side strokes:** Only applicable to rectangles

---

## 13. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Multiple Strokes | ✅ | ✅ | ✅ | ❌ |
| Stroke Position | ✅ 3 options | ✅ 3 options | ✅ 3 options | ✅ 3 options |
| Per-Side Strokes | ✅ | ✅ | ❌ | ❌ |
| Dash Patterns | ✅ | ✅ | ✅ | ✅ |
| Join Types | ✅ | ✅ | ✅ | ✅ |
| Gradient Strokes | ✅ | ✅ | ✅ | ❌ |
| Width Profile | 🔮 | ❌ | ❌ | ❌ |

---

## 14. Accessibility (ARIA)

### 14.1 ARIA Attributes by Control

| Control | Role | ARIA Attributes | Notes |
|---------|------|-----------------|-------|
| Add Stroke (+) | `button` | `aria-label="Add Stroke"` | Action button |
| Presets Button | `button` | `aria-label="Stroke Presets"`, `aria-haspopup="menu"` | Opens preset menu |
| Stroke List | `list` | `aria-label="Strokes"` | Container for stroke rows |
| Stroke Row | `listitem` | `aria-label="Stroke 1"` | Numbered for context |
| Drag Handle | `button` | `aria-label="Drag to reorder"`, `aria-roledescription="draggable"` | Indicates draggable |
| Color Swatch | `button` | `aria-label="Stroke color: #000000"`, `aria-haspopup="dialog"` | Dynamic color label |
| Hex Input | `textbox` | `aria-label="Stroke color hex value"` | Text input |
| Opacity Input | `spinbutton` | `aria-label="Stroke opacity"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` | Percentage |
| Width Input | `spinbutton` | `aria-label="Stroke width"`, `aria-valuenow`, `aria-valuemin="0"` | Pixels |
| Position Dropdown | `combobox` | `aria-label="Stroke position"`, `aria-expanded`, `aria-haspopup="listbox"` | Inside/Center/Outside |
| Sides Button | `button` | `aria-label="Stroke sides"`, `aria-haspopup="menu"` | Opens sides menu |
| Settings Button | `button` | `aria-label="Stroke settings"`, `aria-haspopup="dialog"` | Opens settings flyout |
| Visibility Toggle | `button` | `aria-label="Hide stroke"` / `"Show stroke"`, `aria-pressed` | Toggle state |
| Remove Button | `button` | `aria-label="Remove stroke"` | Destructive action |

### 14.2 Section Container

```html
<section 
  aria-labelledby="stroke-section-heading"
  class="pi-section"
>
  <h3 id="stroke-section-heading" class="pi-section-header">
    Stroke
    <button aria-label="Add Stroke">+</button>
    <button aria-label="Stroke Presets" aria-haspopup="menu">⊞</button>
  </h3>
  
  <div role="list" aria-label="Strokes">
    <!-- Stroke rows -->
  </div>
</section>
```

### 14.3 Drag and Drop Accessibility

For stroke reordering:

```html
<div 
  role="listitem" 
  aria-label="Stroke 1: #000000, 2px, Center"
  tabindex="0"
>
  <button 
    aria-label="Move stroke. Use arrow keys to reorder."
    aria-roledescription="drag handle"
  >≡</button>
</div>
```

| Key | Action |
|-----|--------|
| Space | Grab/release stroke for reorder |
| Arrow Up | Move stroke up in list |
| Arrow Down | Move stroke down in list |
| Escape | Cancel reorder operation |

### 14.4 Screen Reader Announcements

- **Stroke added:** "Stroke added. 2 strokes total"
- **Stroke removed:** "Stroke removed. 1 stroke remaining"
- **Reorder:** "Stroke 1 moved to position 2"
- **Visibility toggle:** "Stroke hidden" / "Stroke visible"
- **Position change:** "Stroke position: Inside"

### 14.5 Empty State

```html
<div role="status" aria-live="polite">
  No stroke applied. Click Add to create a stroke.
</div>
```

---

## 15. Future Enhancements

### 15.1 Planned
- [ ] **Width profile editor:** Variable width along path
- [ ] **Pressure sensitivity:** Tablet input support

### 15.2 Considered
- [ ] **Arrow heads:** Start/end markers
- [ ] **Brush strokes:** Artistic stroke styles
- [ ] **Stroke along path:** Text/shape paths

---

## Next Section: [07 - Effects Section](./07-effects-section.md)
