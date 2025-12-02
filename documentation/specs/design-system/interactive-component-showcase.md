# Interactive Component Showcase

> [!TIP]
> All components on this page are **live and interactive**! Click, drag, type, and interact with them to see how they work. Actions will show toast notifications.

This showcase demonstrates the Story Design System components with real, working implementations. Each component uses the same code that powers the main application.

---

## Buttons

Buttons are the primary interactive elements for triggering actions. Story provides four variants and four sizes to cover all use cases.

### Button Variants

```
:::demo button-variants:::
```

### Button Sizes

```
:::demo button-sizes:::
```

### Buttons with Icons

Icons can be placed on either side of the label to provide visual context.

```
:::demo button-with-icons:::
```

### Icon-Only Buttons

Compact buttons for toolbars and dense UI areas. Always include a tooltip via the `title` attribute.

```
:::demo button-icon-only:::
```

### Button States

Buttons support multiple states including disabled, loading, and active (selected).

```
:::demo button-states:::
```

---

## Form Controls

### Number Input

Number inputs support keyboard arrow keys, direct typing, and **label scrubbing** - click and drag on the label to adjust values smoothly. Hold Shift for 10x speed, Alt for 0.1x precision.

```
:::demo number-input-basic:::
```

### Text Input

Standard text inputs for string values. Press Enter to confirm, Escape to revert.

```
:::demo text-input-basic:::
```

### Dropdown Select

Click to open a dropdown menu. Supports keyboard navigation and scrolling for long lists.

```
:::demo dropdown-basic:::
```

---

## Toggle Controls

### Switch

Binary toggles for on/off settings. Click anywhere on the switch to toggle.

```
:::demo switch-basic:::
```

### Segmented Control

Radio-style selection between mutually exclusive options. Supports both text and icon labels.

```
:::demo segmented-control-basic:::
```

---

## Slider Controls

### Slider with Input

Sliders combine visual feedback with precise input. Drag the thumb, click the track, or scrub the label for quick adjustments.

```
:::demo slider-control-basic:::
```

---

## Complete Examples

### Property Panel Mock

This demonstrates how components work together in a realistic property inspector panel:

```
:::demo property-panel-mock:::
```

---

## Usage in Documentation

To embed an interactive component demo in any documentation page, use this syntax in a code block:

```markdown
\`\`\`
:::demo button-variants:::
\`\`\`
```

### Available Demo IDs

| Demo ID | Description |
|---------|-------------|
| `button-variants` | Four button variants |
| `button-sizes` | Four button sizes |
| `button-with-icons` | Buttons with left/right icons |
| `button-icon-only` | Icon-only toolbar buttons |
| `button-states` | Disabled, loading, active states |
| `number-input-basic` | Scrubbable number inputs |
| `text-input-basic` | Text input fields |
| `dropdown-basic` | Dropdown select menus |
| `switch-basic` | Toggle switches |
| `segmented-control-basic` | Segmented radio buttons |
| `slider-control-basic` | Slider with input |
| `property-panel-mock` | Complete property panel |

---

## Implementation Notes

### How It Works

1. The documentation system scans rendered content for `:::demo {id}:::` markers
2. When found, it replaces the code block with a live component instance
3. Components are imported from the same source files used in the application
4. All styling comes from the design system CSS variables

### Component Architecture

All components follow this pattern:

```javascript
import { Button } from './Button.js';

const btn = new Button({
    label: 'Click Me',
    variant: 'primary',
    size: 'md',
    onClick: () => console.log('Clicked!')
});

container.appendChild(btn.element);
```

### State Management Methods

Most components expose these standard methods:

- `setValue(value)` - Update the component's value
- `getValue()` - Retrieve the current value
- `setDisabled(boolean)` - Enable/disable the component
- `destroy()` - Clean up and remove from DOM
