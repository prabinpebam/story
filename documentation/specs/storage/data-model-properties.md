# Data Model Properties - Complete Reference

This document provides an **exhaustive list** of all properties that must be serialized and deserialized when saving/loading `.str` files. Each property includes the **current implementation details** from the codebase to ensure correct serialization.

## Implementation Status

✅ **Last Updated**: November 29, 2025

The serializer/deserializer uses a "copy all properties" approach to ensure no data is lost.

---

## 1. Slide Properties

Properties on slide objects (`state.slides[slideId]`):

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `id` | string | ✅ | - | Unique ID like `"slide-1"`. Used as key in `state.slides` object. |
| `title` | string | ❌ | "" | Display title shown in SlideList. Set in InitialState as `"Introduction"`. |
| `layoutId` | string | ❌ | `"layout-title"` | Reference to master layout. Example: `"layout-title"`, `"layout-blank"`. See InitialState.js. |
| `width` | number | ✅ | 1920 | Slide width in pixels. Standard 16:9 is 1920×1080. |
| `height` | number | ✅ | 1080 | Slide height in pixels. |
| `background` | Fill[] \| Fill \| null | ❌ | `null` | **IMPORTANT**: `null` means inherit from layout/theme. Can be single object or array. See Background section below. |
| `elements` | object | ✅ | `{}` | Map of element ID → element object: `{ "text-1": {...}, "shape-2": {...} }` |
| `elementOrder` | string[] | ✅ | `[]` | Z-order array: `["text-1", "shape-2"]`. First = back, last = front. |
| `notes` | string | ❌ | `""` | Speaker notes (plain text or HTML). |
| `transition` | string | ❌ | `"magic"` | Transition type. **Values**: `'none'`, `'fade'`, `'slide'`, `'magic'`. Default in InitialState is `"magic"`. |
| `duration` | number | ❌ | - | Auto-advance duration in ms. Not commonly used. |
| `colorOverride` | object | ❌ | - | Theme color overrides for this slide. |
| `typographyOverride` | object | ❌ | - | Theme typography overrides for this slide. |

### Background Format (Critical)

**Source**: `SlideView.js:140-180`, `SlideSection.js:440`, `InitialState.js:6`

```javascript
// Three valid formats:
background: null                                    // Inherit from layout/theme
background: { type: "solid", value: "#ff0000" }    // Single fill
background: [                                       // Array of fills (multiple layers)
  { type: "solid", value: "#ff0000", opacity: 100, visible: true },
  { type: "gradient", value: "linear-gradient(90deg, #000 0%, #fff 100%)" }
]
```

**Renderer behavior** (`SlideView.js:140`):
- If `Array.isArray(bg)` → use as fills array
- If object → wrap in array: `[bg]`
- If null → use `[{ type: 'solid', value: '#ffffff' }]`

⚠️ **Serializer must preserve `null`** - do not convert to default white!

---

## 2. Element Properties (Common)

All element types share these base properties.

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `id` | string | ✅ | - | Unique ID like `"text-1"`, `"shape-abc"`. Generated with `Date.now()` in CanvasManager. |
| `type` | string | ✅ | - | **Values**: `'text'`, `'rect'`, `'circle'`, `'image'`, `'video'`, `'code'`, `'group'`. |
| `x` | number | ✅ | 0 | X position in slide coordinates (pixels from left). |
| `y` | number | ✅ | 0 | Y position in slide coordinates (pixels from top). |
| `width` | number | ✅ | 100 | Element width in pixels. |
| `height` | number | ✅ | 100 | Element height in pixels. |
| `rotation` | number | ❌ | `0` | Rotation in degrees. Applied as CSS transform. Serializer defaults to `0`. |
| `opacity` | number | ❌ | `1` | Opacity 0-1. Applied as CSS opacity. Serializer defaults to `1`. |
| `locked` | boolean | ❌ | `false` | Prevents selection/editing when true. |
| `visible` | boolean | ❌ | `true` | Element visibility. Deserializer: `element.visible !== false`. |
| `name` | string | ❌ | - | User-assigned name shown in layer tree. |
| `isPlaceholder` | boolean | ❌ | `false` | `true` for placeholder elements from master layouts. See `PlaceholderSection.js`. |
| `placeholderType` | string | ❌ | - | **Values**: `'title'`, `'subtitle'`, `'body'`, `'picture'`, `'text'`. Used with `isPlaceholder: true`. |
| `parentId` | string | ❌ | - | Parent group ID if element is inside a group. |
| `buildStep` | number | ❌ | - | Build step index for presentation animations. |

---

## 3. Text Element Properties

Additional properties for `type: 'text'`:

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `content` | string | ✅ | `"<h2>Text</h2>"` | **HTML content**. Examples from InitialState: `"<h1>Click to add title</h1>"`, `"<p>Click to add text</p>"`. CanvasManager creates with `"<h2>Text</h2>"`. |
| `textFill` | Fill | ❌ | `{ type: 'solid', value: '#000000' }` | Text color as Fill object. **Uses `value` not `color`**. See `TextSection.js:266`, `CanvasManager.js:1161`. |
| `fontSize` | number | ❌ | - | Font size in px. Can be at element level OR in `style.fontSize`. |
| `fontFamily` | string | ❌ | `"Inter"` | Font family. InitialState uses `"var(--theme-font-heading)"` or `"Inter"`. |
| `fontWeight` | string/number | ❌ | `"400"` | Font weight: `"400"`, `"700"`, etc. InitialState uses string format. |
| `fontStyle` | string | ❌ | `"normal"` | `'normal'` or `'italic'`. |
| `textAlign` | string | ❌ | `"left"` | **Values**: `'left'`, `'center'`, `'right'`, `'justify'`. |
| `verticalAlign` | string | ❌ | `"top"` | **Values**: `'top'`, `'middle'`, `'bottom'`. In InitialState style objects. |
| `lineHeight` | number/string | ❌ | `1.5` | Line height multiplier or percentage. InitialState uses numbers: `1.1`, `1.3`, `1.5`. |
| `letterSpacing` | number/string | ❌ | `"0%"` | InitialState uses percentage strings: `"-1%"`, `"0%"`, `"2%"`. |
| `style` | object | ❌ | - | Legacy style object containing above properties. See next section. |

### Text Style Object

**Source**: `InitialState.js` placeholder elements, `StyleResolver.js`

```javascript
style: {
  fontSize: 72,
  fontFamily: "var(--theme-font-heading, Inter)",
  fontWeight: "700",
  fontStyle: "normal",
  textAlign: "center",
  verticalAlign: "middle",
  color: "var(--theme-text-primary, #333333)",  // Legacy - prefer textFill
  backgroundColor: "rgba(0,0,0,0.03)",           // Text box background
  resizing: "fixed"                              // 'fixed', 'fixedWidth', 'autoSize'
}
```

---

## 4. Shape Element Properties

Additional properties for `type: 'rect'`, `'circle'`:

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `borderRadius` | number | ❌ | `0` | Corner radius in px. **Read as**: `el.borderRadius \|\| el.style?.radius \|\| 0`. See `VisualElement.js:79`, `ShapeElement.js:669`. |
| `style` | object | ❌ | - | Style object with fills, strokes, effects. See below. |

### Shape Style Object

**Source**: `ShapeElement.js`, `FillSection.js`, `StrokeSection.js`

```javascript
style: {
  // Modern multi-fill system (preferred)
  fills: [
    { type: 'solid', value: '#ff0000', opacity: 100, visible: true, blendMode: 'normal' },
    { type: 'gradient', value: 'linear-gradient(...)', opacity: 80 }
  ],
  strokes: [
    { type: 'solid', color: '#000000', width: 2, position: 'center', visible: true }
  ],
  
  // Legacy single-fill properties (still supported)
  backgroundColor: '#D9D9D9',        // Solid fill color
  fillType: 'solid',                 // 'solid', 'gradient', 'image', 'code'
  fillValue: 'linear-gradient(...)', // For gradient/image fills
  fillScaleMode: 'cover',            // For image fills
  
  // Code fill
  code: 'ctx.fillRect(0,0,w,h);',    // Canvas drawing code
  
  // Corner radius (alias)
  radius: 8,                          // Same as borderRadius
  
  // Effects
  dropShadow: { x: 0, y: 4, blur: 4, spread: 0, color: '#00000080' },
  blur: { radius: 4, type: 'uniform' },
  backgroundBlur: { radius: 8 }
}
```

**Renderer priority** (`ShapeElement.js:93-248`):
1. `style.fillType === 'code'` → Use CodeRunner
2. `style.fills` array exists → Render multi-layer fills
3. Fallback to legacy `backgroundColor` / `fillValue`

---

## 5. Image Element Properties

Additional properties for `type: 'image'`:

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `assetId` | string | ❌ | - | Reference to asset in MediaAssetManager. Format: UUID. **Preferred over `src`**. |
| `src` | string | ❌ | - | Direct URL or data URL. Used when `assetId` not present. |
| `borderRadius` | number | ❌ | `0` | Corner radius. Read as `el.borderRadius \|\| el.style?.radius \|\| 0`. See `ImageElement.js:31`. |
| `crop` | object | ❌ | - | Crop settings (see below). |
| `style` | object | ❌ | - | Additional styling. |

### Crop Object

```javascript
crop: {
  x: 0.1,      // Crop X offset (0-1, percentage)
  y: 0.2,      // Crop Y offset (0-1)
  width: 0.8,  // Crop width (0-1)
  height: 0.6  // Crop height (0-1)
}
```

---

## 6. Video Element Properties

Additional properties for `type: 'video'`:

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `assetId` | string | ❌ | - | Reference to asset. Same system as images. |
| `src` | string | ❌ | - | Direct video URL. |
| `autoPlay` | boolean | ❌ | `false` | Auto-play when slide shown. |
| `loop` | boolean | ❌ | `false` | Loop playback. |
| `muted` | boolean | ❌ | `false` | Mute audio. |
| `startTime` | number | ❌ | `0` | Start time in seconds. |
| `endTime` | number | ❌ | - | End time in seconds. |
| `poster` | string | ❌ | - | Poster image URL. |

---

## 7. Fill Object

**Source**: `FillSection.js`, `SlideView.js`, `ShapeElement.js`

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `type` | string | ✅ | - | **Values**: `'solid'`, `'gradient'`, `'image'`, `'video'`, `'code'`. |
| `value` | string | ✅ | - | Color hex, gradient CSS, or asset URL. **⚠️ Use `value`, not `color`!** |
| `opacity` | number | ❌ | `100` | Fill opacity 0-100. Applied as `opacity / 100`. |
| `visible` | boolean | ❌ | `true` | Fill visibility. `fill.visible === false` hides layer. |
| `blendMode` | string | ❌ | `'normal'` | CSS blend mode. Applied as `mixBlendMode`. |

### Fill Type-Specific Properties

```javascript
// Solid fill
{ type: 'solid', value: '#ff5500', opacity: 100, visible: true }

// Gradient fill (CSS string)
{ type: 'gradient', value: 'linear-gradient(90deg, #000 0%, #fff 100%)' }

// Gradient fill (structured object)
{ 
  type: 'gradient', 
  value: {
    type: 'linear',  // 'linear', 'radial', 'diamond', 'angular'
    angle: 90,
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 100 }
    ]
  }
}

// Image fill
{ 
  type: 'image', 
  assetId: 'asset-uuid-123',  // Preferred
  value: 'url-or-blob',       // Fallback
  scaleMode: 'cover'          // 'cover', 'contain', 'fill', 'tile'
}

// Video fill
{ 
  type: 'video', 
  assetId: 'asset-uuid-456',
  autoPlay: true,
  loop: true,
  muted: true
}

// Code fill
{ 
  type: 'code', 
  code: 'ctx.fillStyle = "red"; ctx.fillRect(0, 0, w, h);',
  presetId: 'mesh-gradient',  // Optional preset reference
  animate: true,
  fps: 60
}
```

**Solid fill color access** (`ShapeElement.js:198`):
```javascript
layer.style.backgroundColor = fill.color;  // Renderer reads .color for solid
```

⚠️ **Note**: While the renderer reads `fill.color` for solid fills, the data model should use `fill.value`. The renderer handles both.

---

## 8. Stroke Object

**Source**: `StrokeSection.js`, `ShapeElement.js:600-750`

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `type` | string | ❌ | `'solid'` | **Values**: `'solid'`, `'gradient'`. |
| `color` | string | ❌ | `'#000000'` | Stroke color (for solid strokes). |
| `value` | string | ❌ | - | Gradient value (for gradient strokes). |
| `width` | number | ❌ | `1` | Stroke width in px. |
| `position` | string | ❌ | `'center'` | **Values**: `'center'`, `'inside'`, `'outside'`. |
| `style` | string | ❌ | `'solid'` | **Values**: `'solid'`, `'dashed'`, `'dotted'`, `'custom'`. |
| `dashArray` | string | ❌ | - | Custom dash pattern: `'4,4'`, `'8,4,2,4'`. |
| `dashCap` | string | ❌ | `'butt'` | **Values**: `'butt'`, `'round'`, `'square'`. |
| `join` | string | ❌ | `'miter'` | **Values**: `'miter'`, `'round'`, `'bevel'`. |
| `opacity` | number | ❌ | `100` | Stroke opacity 0-100. |
| `visible` | boolean | ❌ | `true` | Stroke visibility. |
| `blendMode` | string | ❌ | `'normal'` | CSS blend mode. |

```javascript
strokes: [
  {
    type: 'solid',
    color: '#000000',
    width: 2,
    position: 'center',
    style: 'solid',
    opacity: 100,
    visible: true,
    blendMode: 'normal'
  }
]
```

---

## 9. Effects (in style object)

**Source**: `EffectsSection.js:458-520`, `ShapeElement.js:770-850`

Effects are stored in `element.style` as individual properties, not an `effects` array:

```javascript
style: {
  dropShadow: {
    x: 0,           // X offset in px
    y: 4,           // Y offset in px
    blur: 4,        // Blur radius in px
    spread: 0,      // Spread radius in px
    color: '#00000080'  // Shadow color with alpha
  },
  blur: {
    radius: 4,      // Blur radius in px
    type: 'uniform' // 'uniform' or 'background'
  },
  backgroundBlur: {
    radius: 8       // Backdrop blur radius
  }
}
```

**Adding effects** (`EffectsSection.js:458`):
1. First `addEffect()` adds `dropShadow`
2. If `dropShadow` exists, adds `blur`

---

## 10. Animation Object

**Source**: Serializer copies as-is. Used for presentation build animations.

```javascript
animation: {
  type: 'fadeIn',        // 'fadeIn', 'slideIn', 'scale', 'wipe', etc.
  direction: 'left',     // 'left', 'right', 'up', 'down'
  duration: 500,         // Duration in ms
  delay: 0,              // Delay in ms
  easing: 'ease-out',    // CSS easing function
  buildOrder: 1          // Order in build sequence
}
```

---

## 11. Master/Layout Properties

**Source**: `InitialState.js`, `Store.js`

| Property | Type | Required | Default | Implementation Notes |
|----------|------|----------|---------|---------------------|
| `id` | string | ✅ | - | Example: `"theme-default"`, `"layout-title"`. |
| `type` | string | ✅ | - | **Values**: `'theme'` or `'layout'`. |
| `name` | string | ✅ | - | Display name: `"Default Theme"`, `"Title Slide"`. |
| `parentId` | string | ❌ | - | Layouts reference parent theme: `"theme-default"`. |
| `background` | Fill | ❌ | `null` | Background fill. Layouts usually have `null` to inherit. |
| `elements` | object | ✅ | `{}` | Placeholder elements. Same format as slide elements. |
| `elementOrder` | string[] | ✅ | `[]` | Z-order of placeholder elements. |
| `themeSettings` | object | ❌ | - | Only for `type: 'theme'`. See below. |

### Theme Settings Object

```javascript
themeSettings: {
  colors: {
    background1: "#FFFFFF",
    background2: "#F5F5F5",
    text1: "#333333",
    text2: "#666666",
    accent1: "#18A0FB",
    accent2: "#7B61FF",
    // ... accent3-6
    hyperlink: "#0066CC",
    followedHyperlink: "#954F72"
  },
  fonts: {
    heading: "Inter",
    body: "Inter"
  },
  textStyles: {
    "title": {
      id: "title",
      name: "Title",
      fontFamily: "var(--theme-font-heading)",
      fontSize: 72,
      fontWeight: "700",
      lineHeight: 1.1,
      letterSpacing: "-1%",
      textFill: { type: "solid", value: "var(--theme-text-primary)" }
    },
    // ... subtitle, heading1, heading2, body, bodySmall, caption, label
  }
}
```

---

## 12. Metadata Properties

**Source**: `InitialState.js:419-427`

```javascript
meta: {
  title: "Untitled Presentation",
  author: "User",
  created: Date.now(),      // Unix timestamp (number)
  modified: Date.now(),     // Unix timestamp (number)
  theme: "default-dark"     // Theme identifier
}
```

---

## 13. Transient Properties (DO NOT SAVE)

These runtime properties must be excluded from serialization:

| Property | Location | Purpose |
|----------|----------|---------|
| `_domElement` | Elements | DOM reference |
| `_cached*` | Various | Cached computed values |
| `_live*` | Various | Live editing values |
| `_observer` | Elements | ResizeObserver references |
| `_codeRunner` | Shapes | CodeRunner instances |

---

## 14. Serialization Strategy

### Current Implementation

```javascript
// PresentationSerializer.js
serializeSlide(slide) {
    const serialized = { ...slide };  // Copy ALL properties
    serialized.elements = elements.map(el => this.serializeElement(el));
    serialized.background = this.serializeBackground(slide.background);
    delete serialized._cached;
    delete serialized._domElement;
    return serialized;
}

serializeElement(element) {
    const serialized = { ...element };  // Copy ALL properties
    serialized.rotation = serialized.rotation ?? 0;
    serialized.opacity = serialized.opacity ?? 1;
    // Deep copy nested objects...
    delete serialized._domElement;
    return serialized;
}

serializeBackground(background) {
    if (background === null || background === undefined) {
        return null;  // Preserve null for inheritance!
    }
    if (Array.isArray(background)) {
        return background.map(fill => this.serializeFill(fill));
    }
    return this.serializeFill(background);
}
```

---

## 15. Validation Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Slide `background` preserves `null` | ✅ | Returns null, not default white |
| Slide `background` uses `value` property | ✅ | Not `color` |
| Slide `background` handles arrays | ✅ | Maps through fills |
| Shape `borderRadius` saved | ✅ | Copied via spread |
| Shape `style.fills` array saved | ✅ | Deep copied |
| Shape `style.strokes` array saved | ✅ | Deep copied |
| Shape effects saved (`dropShadow`, `blur`) | ✅ | In style object |
| Text `content` saved (not `text`) | ✅ | Copied via spread |
| Text `textFill` saved | ✅ | Deep copied |
| Element `isPlaceholder` saved | ✅ | Copied via spread |
| Element `placeholderType` saved | ✅ | Copied via spread |
| Slide `elementOrder` saved | ✅ | Copied via spread |
| Slide `transition` saved | ✅ | Copied via spread |
| Asset `assetId` saved | ✅ | Copied via spread |
| Masters/layouts saved | ✅ | Separate serialization |

---

## Document History

| Date | Change |
|------|--------|
| 2025-11-29 | Added implementation notes column with source code references |
| 2025-11-29 | Fixed background serialization to preserve null and use `value` property |
| 2025-11-29 | Initial comprehensive property documentation |
