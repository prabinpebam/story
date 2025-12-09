# Property Inspector - Fill Section

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Implementation:** `src/ui/properties/FillSection.js`  
> **Uses:** `Section`, `Button` (xs), `ColorInput`, `NumberInput`, `Dropdown`, `Flyout`  
> **DO NOT** create custom color pickers, inputs, or buttons. Use design system components with variants.

---

## 1. Overview

The Fill section manages the fill properties of selected elements. It supports multiple stacked fills, various fill types (solid, gradient, image, video, code), and integration with the theme color system.

### Section Header
- **Title:** "Fill" (or "Background" for slides)
- **Actions:** Add Fill (+)
- **Collapsed by Default:** No

---

## 2. Layout Structure

### 2.1 With Fills

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [≡] [■] #FF5500  100%  [👁] [−]     <- Fill Row 1 (Solid)     │
│  [≡] [▦] Gradient 100%  [👁] [−]     <- Fill Row 2 (Gradient)  │
│  [≡] [🖼] Image    100%  [👁] [−]     <- Fill Row 3 (Image)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      No fill                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 With Inherited Fill (Slides)

```
┌─────────────────────────────────────────────────────────────────┐
│  Background                                             [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [■] Solid           Inherited                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Fill Types

### 3.1 Type Matrix

| Type | Icon | Value Display | Flyout Panel |
|------|------|---------------|--------------|
| Solid | Colored square | Hex code (e.g., #FF5500) | Color Picker |
| Gradient | Gradient square | "Gradient" | Gradient Editor |
| Image | Image icon | "Image" | Image Settings |
| Video | Play icon | "Video" | Video Settings |
| Code | Code icon | "Code Fill" | Code Editor |

### 3.2 Default Fill Values

```javascript
const LastUsed = {
    solid: '#D9D9D9',
    gradient: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)',
    code: null // Uses CodeRunner.DEFAULT_CODE
};
```

---

## 4. Fill Row Structure

### 4.1 Row Elements (Left to Right)

| Element | Purpose | Interaction |
|---------|---------|-------------|
| Drag Handle | Reorder fills | Drag up/down |
| Color Swatch | Preview fill | Click → Flyout |
| Hex/Label Input | Color value or type label | Editable for solid |
| Opacity Input | Fill opacity | Numeric input (0-100%) |
| Visibility | Toggle fill visibility | Click to toggle |
| Remove | Delete fill | Click to remove |

### 4.2 Fill Row HTML Structure

```html
<div class="fill-row" data-index="0">
    <div class="fill-drag-handle">≡</div>
    <div class="fill-input-group">
        <div class="fill-swatch-trigger">
            <div class="fill-preview" style="background: #FF5500"></div>
        </div>
        <input class="fill-hex-input" type="text" value="FF5500" />
    </div>
    <input class="fill-opacity-input" type="number" value="100" />
    <button class="fill-visibility-btn">👁</button>
    <button class="fill-remove-btn">−</button>
</div>
```

---

## 5. Fill Flyout (Color Picker)

### 5.1 Flyout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Custom  |  Libraries                          [+] [×]         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [■] [▦] [🖼] [▶] [</>]   [💧] [👁]   <- Fill Type Selectors  │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │                                          │                  │
│  │         Color Picker Area                │                  │
│  │         (Saturation × Brightness)        │                  │
│  │                                          │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  [═════════════════════════════════]  <- Hue Slider            │
│  [═════════════════════════════════]  <- Opacity Slider        │
│                                                                 │
│  [◎]  Hex ▾  [ 000000 ]  [ 20 ] %    <- Eyedropper + Inputs   │
│                                                                 │
│  ─── Theme Colors ────────────────────                         │
│  [■][■][■][■][■][■][■][■]            <- Theme Swatches        │
│                                                                 │
│  ─── Document Colors ─────────────────                         │
│  [■][■][■][■][■][■][■][■]            <- Recent Colors         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Fill Type Selector Icons

| Type | Icon | Description |
|------|------|-------------|
| Solid | Filled square | Single color fill |
| Gradient | Gradient square | Linear/radial/angular gradient |
| Image | Image icon | Uploaded image fill |
| Video | Play triangle | Video fill (canvas) |
| Code | `</>` brackets | Procedural code fill |

### 5.3 Additional Controls

| Control | Icon | Purpose |
|---------|------|---------|
| Blend Mode | Water drop | Fill-specific blend mode |
| Visibility | Eye | Toggle this fill in picker |
| Add to Library | Plus | Save as style |
| Close | × | Close flyout |

---

## 6. Solid Color Picker

### 6.1 Color Field (HSB)

- **X-axis:** Saturation (0-100%)
- **Y-axis:** Brightness/Value (0-100%, inverted)
- **Interaction:** Click/drag to select

### 6.2 Sliders

| Slider | Purpose | Range |
|--------|---------|-------|
| Hue | Base color | 0-360° |
| Opacity | Transparency | 0-100% |

### 6.3 Numeric Inputs

| Input | Models Available |
|-------|------------------|
| Color Code | Hex, RGB, HSL, HSB, CSS |
| Opacity | Percentage |

### 6.4 Eyedropper Tool

- **Function:** Sample color from anywhere on screen
- **Platform:** Uses EyeDropper API (Chrome/Edge) or fallback

---

## 7. Gradient Editor

### 7.1 Gradient Types

| Type | Icon | Description | CSS |
|------|------|-------------|-----|
| Linear | ↘ | Straight line gradient | `linear-gradient()` |
| Radial | ◉ | Circular gradient from center | `radial-gradient()` |
| Angular | ◐ | Conic/sweep gradient | `conic-gradient()` |
| Diamond | ◇ | Diamond-shaped (custom) | Custom SVG |

### 7.2 Gradient Editor UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Gradient Type: [Linear ▼]           [↔ Reverse] [⟳ Reset]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              Gradient Preview Canvas                      │ │
│  │          (Shows gradient with shape context)              │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Stop Bar:                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [●]══════════════════════════════════════════════[●]   │   │
│  │   ▲                                                ▲    │   │
│  │   0%                                              100%  │   │
│  └─────────────────────────────────────────────────────────┘   │
│        Click anywhere on bar to add new stop                    │
│                                                                 │
│  Angle: [  90  ]°     (Linear only)                            │
│                                                                 │
│  Selected Stop:                                                 │
│  Color: [■] [ FF5500 ]   Position: [ 50 ]%   [🗑 Remove]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Gradient Stop Interactions

| Interaction | Behavior |
|-------------|----------|
| Click bar | Add new stop at position |
| Drag stop | Move stop position |
| Double-click stop | Open color picker for stop |
| Select stop | Show stop properties below |
| Delete key (stop selected) | Remove stop (min 2 required) |
| Drag stop off bar | Remove stop (min 2 required) |

### 7.4 Stop Data Structure

```javascript
const gradientStop = {
    id: 'stop-1',
    position: 0.5,    // 0-1 range
    color: '#FF5500',
    opacity: 1.0      // 0-1 range
};

const gradient = {
    type: 'linear',         // linear|radial|angular|diamond
    angle: 90,              // degrees (linear only)
    stops: [stop1, stop2],  // minimum 2 stops
    // For radial:
    centerX: 0.5,           // 0-1 range
    centerY: 0.5,           // 0-1 range
    radius: 1.0             // 0-1 range
};
```

### 7.5 Gradient Controls

| Control | Type | Range | Default |
|---------|------|-------|---------|
| Type | Dropdown | linear/radial/angular/diamond | linear |
| Angle | NumberInput | 0-359° | 90° |
| Reverse | Button | Toggle | - |
| Reset | Button | Action | - |

### 7.6 Keyboard Shortcuts (Gradient Editor)

| Key | Action |
|-----|--------|
| Delete | Remove selected stop |
| ← | Move stop -1% |
| → | Move stop +1% |
| Shift+← | Move stop -10% |
| Shift+→ | Move stop +10% |
| Tab | Select next stop |
| Shift+Tab | Select previous stop |

### 7.7 State Machine: Gradient Editor

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────┐     click bar    ┌──────────────┐             │
│  │ Default │ ───────────────▶ │ Adding Stop  │             │
│  └────┬────┘                  └──────┬───────┘             │
│       │                              │                      │
│       │ click stop                   │ mouse up             │
│       ▼                              ▼                      │
│  ┌─────────────┐             ┌─────────────┐               │
│  │ Stop        │             │ Stop Added  │               │
│  │ Selected    │◀────────────│ & Selected  │               │
│  └─────────────┘             └─────────────┘               │
│       │                                                     │
│       │ drag                                                │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │ Dragging    │───────────▶ (mouse up) ───▶ Default       │
│  │ Stop        │                                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Image Fill

### 8.1 Image Fill UI

```
┌─────────────────────────────────────────────────────────────────┐
│  Image Fill                                               [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                  Image Preview                            │ │
│  │                  (with crop overlay)                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Source: [ landscape.jpg         ] [📁 Browse] [🔗 URL]        │
│                                                                 │
│  Fit Mode:                                                      │
│  ┌────────┬────────┬────────┬────────┐                         │
│  │  Fill  │  Fit   │  Crop  │  Tile  │                         │
│  └────────┴────────┴────────┴────────┘                         │
│                                                                 │
│  Position: (for Crop mode)                                      │
│  ┌─────┬─────┬─────┐                                           │
│  │ ◐  │  ▲  │ ◑  │  Top-Left | Top | Top-Right                │
│  ├─────┼─────┼─────┤                                           │
│  │ ◀  │  ●  │ ▶  │  Left | Center | Right                     │
│  ├─────┼─────┼─────┤                                           │
│  │ ◒  │  ▼  │ ◓  │  Bottom-Left | Bottom | Bottom-Right       │
│  └─────┴─────┴─────┘                                           │
│                                                                 │
│  Scale: [ 100 ]%       Rotation: [ 0 ]°                        │
│                                                                 │
│  Opacity: [ 100 ]%                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Fit Mode Details

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Fill** | Scale to cover, crop overflow | Background images |
| **Fit** | Scale to fit entirely, may letterbox | Preserve entire image |
| **Crop** | User-positioned, manual crop | Precise placement |
| **Tile** | Repeat pattern at original size | Patterns, textures |

### 8.3 Image Fill Properties

| Property | Type | Range | Default |
|----------|------|-------|---------|
| source | String | URL/DataURL | required |
| fitMode | Enum | fill/fit/crop/tile | fill |
| position | Object | {x: 0-1, y: 0-1} | {x: 0.5, y: 0.5} |
| scale | Number | 1-500% | 100% |
| rotation | Number | 0-359° | 0° |
| opacity | Number | 0-100% | 100% |

### 8.4 Image Data Structure

```javascript
const imageFill = {
    type: 'image',
    source: 'data:image/png;base64,...',  // or URL
    sourceOriginal: 'landscape.jpg',       // display name
    fitMode: 'fill',                       // fill|fit|crop|tile
    position: { x: 0.5, y: 0.5 },          // center point
    scale: 1.0,                            // multiplier
    rotation: 0,                           // degrees
    opacity: 1.0                           // 0-1
};
```

### 8.5 Image Upload Flow

```
User clicks Browse
       │
       ▼
┌──────────────────┐
│ File Picker      │
│ (PNG, JPG, SVG)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Validate File    │
│ Max: 10MB        │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Valid     Invalid
    │         │
    ▼         ▼
 Encode    Show Error
 Base64    Message
    │
    ▼
 Apply Fill
```

### 8.6 Image Loading States

| State | UI Display |
|-------|------------|
| Loading | Spinner in preview area |
| Loaded | Image preview visible |
| Error | Error icon with "Failed to load" |
| Invalid | Error icon with file type message |

---

## 9. Video Fill

### 9.1 Video Fill Properties

| Property | Type | Range | Default |
|----------|------|-------|---------|
| source | String | URL/Blob | required |
| fitMode | Enum | fill/fit/crop | fill |
| loop | Boolean | true/false | true |
| muted | Boolean | true/false | true |
| startTime | Number | 0-duration | 0 |
| opacity | Number | 0-100% | 100% |

### 9.2 Video Controls

```
┌─────────────────────────────────────────────────────────────────┐
│  Video Fill                                               [×]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │            ▶                                              │ │
│  │           Video Preview                                   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [ ▶ Play ] [ ⏸ Pause ]                                        │
│  [═══════════●═════════════════════]  Timeline                 │
│                                                                 │
│  ☑ Loop    ☑ Muted                                              │
│                                                                 │
│  Fit Mode: [ Fill ▼ ]                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Code Fill

### 9.1 Overview

Code fills render procedural content using JavaScript and Canvas 2D API.

### 9.2 UI Elements

| Element | Purpose |
|---------|---------|
| Preview Canvas | Live render preview |
| Prompt Input | AI generation description |
| Refine Toggle | Two-step AI refinement |
| Generate Button | Create new code |
| Update Button | Modify existing code |
| Code Editor | Manual code editing |

### 9.3 AI Integration

```javascript
// Prompt → Refined Prompt → Code Generation
async generateCode(prompt, refine = true) {
    let finalPrompt = prompt;
    
    if (refine) {
        finalPrompt = await aiService.refinePrompt(prompt);
    }
    
    const code = await aiService.generateCanvasCode(finalPrompt);
    return code;
}
```

---

## 10. Theme Color Linking

### 10.1 Theme Slots

Fills can be linked to theme color slots for automatic theme switching:

```javascript
COLOR_SLOTS = {
    0: { name: 'Primary', role: 'accent' },
    1: { name: 'Secondary', role: 'accent' },
    2: { name: 'Shadow 1', role: 'shadow' },
    // ... more slots
};
```

### 10.2 Linked Fill Display

```
┌─────────────────────────────────────────────────────────────────┐
│  [■] Primary           100%  [👁] [−]   <- Linked to Slot 0    │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Linking/Unlinking

- **Link:** Select from theme swatches in flyout
- **Unlink:** Edit hex value directly or choose non-theme color

---

## 11. Multiple Fills

### 11.1 Stack Order

- **Visual:** Top fill in list = top layer (rendered last)
- **Compositing:** Fills blend according to their blend modes

### 11.2 Drag Reorder

```javascript
// Drag start
dragHandle.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    row.classList.add('dragging');
});

// Drop
row.addEventListener('drop', (e) => {
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    this.reorderFills(element, fromIndex, toIndex);
});
```

### 11.3 Reorder Implementation

```javascript
reorderFills(element, fromIndex, toIndex) {
    const fills = [...element.style.fills];
    const [removed] = fills.splice(fromIndex, 1);
    fills.splice(toIndex, 0, removed);
    
    store.dispatch('UPDATE_ELEMENT', {
        id: element.id,
        style: { ...element.style, fills }
    });
}
```

---

## 12. Fill Memory System

### 12.1 Session Memory

Last-used values persist within session:

```javascript
// Remember last solid color
propertyMemory.remember('fill.object.solid.color', color);

// Recall for new fill
const lastColor = propertyMemory.recall('fill.object.solid.color', '#D9D9D9');
```

### 12.2 Persistent Memory

Saved to localStorage:

| Key | Data |
|-----|------|
| `story.memory.fill.object.solid` | Last solid color |
| `story.memory.fill.object.gradient` | Last gradient config |

---

## 13. Edge Cases

### 13.1 No Fill State

- Display empty state message
- Allow adding first fill via (+) button

### 13.2 Inherited Fill (Slides)

- Show inherited fill as read-only
- Override by adding new fill

### 13.3 Text Elements

- Fill section hidden (text has fill in Typography section)
- Typography allows single fill only

### 13.4 Invalid Hex Input

```javascript
if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
    this.updateFill(element, index, { color: val });
} else {
    // Revert to previous value
    e.target.value = previousValue;
}
```

---

## 14. Accessibility (ARIA)

### 14.1 Section ARIA

```html
<div class="pi-section" role="group" aria-labelledby="fill-section-title">
    <button 
        id="fill-section-title"
        class="pi-section-header"
        aria-expanded="true"
        aria-controls="fill-section-content"
    >
        Fill
    </button>
    <div 
        id="fill-section-content" 
        role="region"
        aria-label="Fill properties"
    >
        <!-- Fill rows -->
    </div>
</div>
```

### 14.2 Fill Row ARIA

```html
<div 
    class="fill-row" 
    role="listitem"
    aria-label="Fill 1, Solid color, #FF5500, 100% opacity"
>
    <button 
        class="fill-drag-handle"
        aria-label="Drag to reorder"
        aria-grabbed="false"
    >≡</button>
    
    <button 
        class="fill-swatch-trigger"
        aria-label="Edit fill color, currently #FF5500"
        aria-haspopup="dialog"
        aria-expanded="false"
    >
        <span class="fill-preview" role="img" aria-label="Color preview"></span>
    </button>
    
    <input 
        type="text" 
        class="fill-hex-input"
        aria-label="Hex color code"
        value="FF5500"
    />
    
    <input 
        type="number"
        class="fill-opacity-input"
        aria-label="Fill opacity percentage"
        value="100"
        min="0"
        max="100"
    />
    
    <button 
        class="fill-visibility-btn"
        aria-label="Toggle fill visibility"
        aria-pressed="true"
    >👁</button>
    
    <button 
        class="fill-remove-btn"
        aria-label="Remove fill"
    >−</button>
</div>
```

### 14.3 Color Picker ARIA

```html
<div 
    class="color-picker-flyout"
    role="dialog"
    aria-label="Color picker"
    aria-modal="true"
>
    <div 
        class="color-field"
        role="slider"
        aria-label="Saturation and brightness picker"
        aria-valuemin="0"
        aria-valuemax="100"
        tabindex="0"
    ></div>
    
    <input 
        type="range"
        class="hue-slider"
        aria-label="Hue"
        min="0"
        max="360"
    />
    
    <button 
        class="eyedropper-btn"
        aria-label="Pick color from screen"
    >◎</button>
</div>
```

### 14.4 Screen Reader Announcements

| Event | Announcement |
|-------|--------------|
| Fill added | "Fill added. 2 fills total." |
| Fill removed | "Fill removed. 1 fill remaining." |
| Fill reordered | "Fill moved to position 2." |
| Color changed | "Fill color changed to #FF5500." |
| Visibility toggled | "Fill hidden." / "Fill visible." |
| Flyout opened | "Color picker opened." |
| Flyout closed | "Color picker closed." |

---

## 15. Industry Benchmark Comparison

| Feature | Story | Figma | Sketch | Adobe XD |
|---------|-------|-------|--------|----------|
| Multiple Fills | ✅ | ✅ | ✅ | ✅ |
| Solid Color | ✅ | ✅ | ✅ | ✅ |
| Gradients | ✅ | ✅ | ✅ | ✅ |
| Image Fill | ✅ | ✅ | ✅ | ✅ |
| Video Fill | ✅ | ❌ | ❌ | ❌ |
| Code Fill | ✅ | ❌ | ❌ | ❌ |
| Color Variables | ✅ Theme Slots | ✅ Variables | ✅ | ✅ |
| Fill Reorder | ✅ Drag | ✅ Drag | ✅ Drag | ✅ Drag |

---

## 16. Future Enhancements

### 16.1 Planned
- [ ] **Pattern fills:** Repeating vector patterns
- [ ] **Mesh gradients:** Complex multi-point gradients
- [ ] **Noise/texture fills:** Procedural noise patterns

### 16.2 Considered
- [ ] **Fill presets:** Quick access to common fills
- [ ] **Color harmonies:** Auto-generate complementary colors

---

## See Also

- [04-appearance-section.md](./04-appearance-section.md) - Opacity, blend modes
- [10-slide-section.md](./10-slide-section.md) - Background fills for slides
- [11-interactions.md](./11-interactions.md) - Color picker interactions
- [14-glossary.md](./14-glossary.md) - Term definitions

---

## Next Section: [06 - Stroke Section](./06-stroke-section.md)
