# Technical Specification: Component System & UI

## 1. Design Language ("Teenage Engineering" Aesthetic)
The UI follows a strict industrial design language:
- **Colors:** High contrast. Orange (`#FF4D00`) for active states, Blue (`#0055FF`) for selection, Grays for structure.
- **Typography:** `Inter` for UI text, `JetBrains Mono` for values/code.
- **Controls:** Physical-feeling controls (Knobs, Mechanical Switches) instead of standard browser inputs.

## 2. Icon System (FontAwesome)
We use **FontAwesome Free** for all UI icons.
- **Integration:** Loaded via CDN in `index.html`.
- **Usage:** Helper class or utility function to render icons.

```html
<!-- index.html -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### Icon Helper
```javascript
// src/ui/Icons.js
export const Icons = {
  SELECT: '<i class="fa-solid fa-arrow-pointer"></i>',
  TEXT: '<i class="fa-solid fa-font"></i>',
  SHAPE: '<i class="fa-solid fa-shapes"></i>',
  IMAGE: '<i class="fa-regular fa-image"></i>',
  PLAY: '<i class="fa-solid fa-play"></i>',
  PAUSE: '<i class="fa-solid fa-pause"></i>',
  SETTINGS: '<i class="fa-solid fa-sliders"></i>',
  TRASH: '<i class="fa-solid fa-trash"></i>'
};
```

## 3. Custom UI Components
These components are built as standard ES Modules that return DOM elements.

### Knob (Rotary Control)
Used for continuous values (Rotation, Opacity, Scale).
- **Interaction:** Click and drag up/down to change value.
- **Visuals:** SVG-based ring or CSS radial gradient.
- **Events:** Emits `change` event with new value.

### Switch (Toggle)
Used for boolean states (Locked, Visible, Grid Snap).
- **Visuals:** Rectangular "mechanical" switch that slides.
- **Feedback:** Click sound (optional) and immediate color change.

### Segmented Control
Used for mutually exclusive options (Text Align, Fit Mode).
- **Visuals:** Group of buttons where only one is active.

## 4. Property Inspector
The Property Inspector is context-aware. It listens to the `selection-changed` event.
- **No Selection:** Shows Slide properties (Background, Dimensions).
- **Text Selected:** Shows Font, Size, Color, Align.
- **Shape Selected:** Shows Fill, Stroke, Radius.
- **Multiple Selected:** Shows common properties (Align, Distribute).

## 5. Layer Tree
A sortable list of elements on the current slide.
- **Drag & Drop:** Reorder elements (updates `z-index`).
- **Visibility/Lock:** Quick toggles using FontAwesome icons.
- **Selection:** Clicking a layer selects it on the canvas.
