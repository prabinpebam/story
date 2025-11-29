# Data Model Properties - Complete Reference

This document provides an **exhaustive list** of all properties that must be serialized and deserialized when saving/loading `.str` files. This serves as the authoritative reference for ensuring complete data preservation.

## Implementation Status

✅ **Last Updated**: November 29, 2025

The serializer/deserializer now uses a "copy all properties" approach to ensure no data is lost. This document reflects the current working implementation.

## Purpose

When saving a presentation, ALL properties listed here must be preserved. The serializer should use a "preserve all" approach rather than explicitly listing each property, to ensure new properties are automatically saved.

---

## 1. Slide Properties

Properties on slide objects (`state.slides[slideId]`):

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `id` | string | ✅ | - | Unique slide identifier |
| `title` | string | ❌ | "" | Display title for slide list |
| `layoutId` | string | ❌ | null | Reference to master layout |
| `width` | number | ✅ | 1920 | Slide width in pixels |
| `height` | number | ✅ | 1080 | Slide height in pixels |
| `background` | Fill[] \| Fill \| null | ❌ | null | Background fill(s) - see Background section |
| `elements` | object | ✅ | {} | Map of element ID → element object |
| `elementOrder` | string[] | ✅ | [] | Array of element IDs (z-index order) |
| `notes` | string | ❌ | "" | Speaker notes |
| `transition` | string | ❌ | "none" | Transition type: 'none', 'fade', 'slide', 'magic' |
| `duration` | number | ❌ | - | Auto-advance duration in ms |
| `order` | number | ❌ | - | Sort order (legacy) |
| `name` | string | ❌ | - | Internal name (legacy) |
| `masterSlideId` | string | ❌ | - | Reference to master slide (legacy) |
| `colorOverride` | object | ❌ | - | Theme color overrides |
| `typographyOverride` | object | ❌ | - | Theme typography overrides |

### Background Format

The `background` property has **three valid formats**:

1. **`null`** - Inherit from parent layout/theme
2. **Single Fill Object** - `{ type: "solid", value: "#ff0000" }`
3. **Array of Fills** - `[{ type: "solid", value: "#ff0000", opacity: 100 }]`

The serializer **preserves null** to maintain inheritance. DO NOT convert null to a default value.

---

## 2. Element Properties (Common)

All element types share these base properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique element identifier |
| `type` | string | ✅ | Element type: 'text', 'rect', 'circle', 'image', 'video', 'code', 'group' |
| `x` | number | ✅ | X position in pixels |
| `y` | number | ✅ | Y position in pixels |
| `width` | number | ✅ | Width in pixels |
| `height` | number | ✅ | Height in pixels |
| `rotation` | number | ❌ | Rotation in degrees (default: 0) |
| `opacity` | number | ❌ | Opacity 0-1 (default: 1) |
| `locked` | boolean | ❌ | Lock element from selection |
| `visible` | boolean | ❌ | Visibility (default: true) |
| `name` | string | ❌ | User-assigned name |
| `blendMode` | string | ❌ | CSS blend mode: 'normal', 'multiply', etc. |
| `isPlaceholder` | boolean | ❌ | Is this a placeholder from master |
| `placeholderType` | string | ❌ | 'title', 'subtitle', 'body', 'picture', etc. |
| `parentId` | string | ❌ | Parent group ID |
| `children` | string[] | ❌ | Child element IDs (for groups) |
| `effects` | Effect[] | ❌ | Visual effects (shadow, blur, etc.) |
| `animation` | Animation | ❌ | Animation settings |
| `buildStep` | number | ❌ | Presentation build step index |

---

## 3. Text Element Properties

Additional properties for `type: 'text'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | string | ✅ | HTML content (e.g., `<h1>Title</h1>`) |
| `fontSize` | number | ❌ | Font size in px |
| `fontFamily` | string | ❌ | Font family name |
| `fontWeight` | string/number | ❌ | Font weight: '400', '700', etc. |
| `fontStyle` | string | ❌ | 'normal', 'italic' |
| `textAlign` | string | ❌ | 'left', 'center', 'right', 'justify' |
| `verticalAlign` | string | ❌ | 'top', 'middle', 'bottom' |
| `lineHeight` | number/string | ❌ | Line height: 1.5, 'auto', '150%' |
| `letterSpacing` | number/string | ❌ | Letter spacing: 0, '2%', '-1px' |
| `textTransform` | string | ❌ | 'none', 'uppercase', 'lowercase', 'capitalize', 'small-caps' |
| `textDecoration` | string | ❌ | 'none', 'underline', 'strikethrough' |
| `paragraphSpacing` | number | ❌ | Space between paragraphs in px |
| `paragraphIndent` | number | ❌ | First line indent in px |
| `textFill` | Fill | ❌ | Text color fill (see Fill Object) |
| `listStyle` | string | ❌ | 'none', 'bullet', 'numbered' |
| `opentypeFeatures` | object | ❌ | OpenType feature settings |
| `variableAxes` | object | ❌ | Variable font axis values |
| `truncate` | boolean | ❌ | Enable text truncation |
| `maxLines` | number | ❌ | Max lines when truncating |
| `verticalTrim` | string | ❌ | 'none', 'capHeight' |
| `style` | object | ❌ | Legacy style object (see Text Style Object) |

### Text Style Object (Legacy)

The `style` property may contain:

| Property | Type | Description |
|----------|------|-------------|
| `fontSize` | number | Font size in px |
| `fontFamily` | string | Font family |
| `fontWeight` | string | Font weight |
| `fontStyle` | string | Font style |
| `color` | string | Text color (hex) |
| `backgroundColor` | string | Background color |
| `textAlign` | string | Text alignment |
| `verticalAlign` | string | Vertical alignment |
| `resizing` | string | 'fixed', 'fixedWidth', 'autoSize' |

---

## 4. Shape Element Properties

Additional properties for `type: 'rect'`, `'circle'`, `'shape'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `shapeType` | string | ❌ | 'rectangle', 'ellipse', 'polygon', etc. |
| `borderRadius` | number | ❌ | Corner radius in px |
| `fill` | Fill | ❌ | Shape fill (legacy, use style.fills) |
| `stroke` | Stroke | ❌ | Shape stroke (legacy, use style.strokes) |
| `cornerRadius` | number | ❌ | Alias for borderRadius |
| `style` | object | ❌ | Style object (see Shape Style Object) |

### Shape Style Object

| Property | Type | Description |
|----------|------|-------------|
| `backgroundColor` | string | Fill color (solid) |
| `fillType` | string | 'solid', 'gradient', 'image', 'code' |
| `fills` | Fill[] | Array of fill layers |
| `strokes` | Stroke[] | Array of stroke layers |
| `borderWidth` | number | Stroke width (legacy) |
| `borderColor` | string | Stroke color (legacy) |
| `radius` | number | Corner radius (alias) |

---

## 5. Image Element Properties

Additional properties for `type: 'image'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `src` | string | ❌ | Image URL or data URL |
| `assetId` | string | ❌ | Reference to asset in assets/ |
| `assetPath` | string | ❌ | Path within .str archive |
| `crop` | Crop | ❌ | Crop settings |
| `filters` | Filter[] | ❌ | Image filters |
| `borderRadius` | number | ❌ | Corner radius |
| `style` | object | ❌ | Style object |

### Crop Object

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | Crop X offset (0-1) |
| `y` | number | Crop Y offset (0-1) |
| `width` | number | Crop width (0-1) |
| `height` | number | Crop height (0-1) |

---

## 6. Video Element Properties

Additional properties for `type: 'video'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `src` | string | ❌ | Video URL |
| `assetId` | string | ❌ | Reference to asset |
| `assetPath` | string | ❌ | Path within archive |
| `autoPlay` | boolean | ❌ | Auto-play on slide |
| `loop` | boolean | ❌ | Loop playback |
| `muted` | boolean | ❌ | Mute audio |
| `startTime` | number | ❌ | Start time in seconds |
| `endTime` | number | ❌ | End time in seconds |
| `poster` | string | ❌ | Poster image URL |

---

## 7. Code Element Properties

Additional properties for `type: 'code'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `code` | string | ✅ | Source code |
| `language` | string | ❌ | Language identifier |
| `theme` | string | ❌ | Syntax theme |
| `showLineNumbers` | boolean | ❌ | Show line numbers |
| `highlightLines` | number[] | ❌ | Highlighted line numbers |

---

## 8. Group Element Properties

Additional properties for `type: 'group'`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `children` | string[] | ✅ | Array of child element IDs |
| `clipsContent` | boolean | ❌ | Clip overflow |

---

## 9. Fill Object

Fill layers for backgrounds, shapes, and text. **IMPORTANT**: Use `value` property, not `color`.

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | **Required**: 'solid', 'gradient', 'image', 'code' |
| `value` | string | Color hex, gradient CSS, or image URL |
| `opacity` | number | Fill opacity 0-100 (default: 100) |
| `visible` | boolean | Fill visibility (default: true) |
| `blendMode` | string | Blend mode (default: 'normal') |

### ⚠️ Property Name Note

- Use **`value`** for all fill types (solid color, gradient string, image URL)
- **`color`** is a legacy alias that the deserializer converts to `value`
- Never use `color` in new code

### Solid Fill Example

```json
{
  "type": "solid",
  "value": "#ff5500",
  "opacity": 100,
  "visible": true
}
```

### Gradient Value Format

For `type: 'gradient'`, value is CSS gradient string:
```
linear-gradient(90deg, #000000 0%, #ffffff 100%)
radial-gradient(circle at center, #000000 0%, #ffffff 100%)
```

Or a structured gradient object:
```json
{
  "type": "gradient",
  "value": {
    "type": "linear",
    "angle": 90,
    "stops": [
      { "color": "#000000", "position": 0 },
      { "color": "#ffffff", "position": 100 }
    ]
  }
}
```

### Code Fill Properties

For `type: 'code'` (CodeFill):

| Property | Type | Description |
|----------|------|-------------|
| `code` | string | JavaScript/Canvas code |
| `presetId` | string | Reference to preset |
| `presetParams` | object | Preset parameters |
| `animate` | boolean | Enable animation |
| `fps` | number | Animation frame rate |

---

## 10. Stroke Object

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | 'solid', 'gradient' |
| `color` | string | Stroke color |
| `value` | string | Gradient value (if type=gradient) |
| `width` | number | Stroke width in px |
| `position` | string | 'center', 'inside', 'outside' |
| `style` | string | 'solid', 'dashed', 'dotted', 'custom' |
| `dashArray` | string | Custom dash pattern: '4,4' |
| `dashCap` | string | 'butt', 'round', 'square' |
| `join` | string | 'miter', 'round', 'bevel' |
| `miterLimit` | number | Miter limit |
| `opacity` | number | Stroke opacity 0-100 |
| `visible` | boolean | Stroke visibility |
| `blendMode` | string | Blend mode |

---

## 11. Effect Object

Visual effects applied to elements:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | 'dropShadow', 'innerShadow', 'blur', 'backgroundBlur' |
| `visible` | boolean | Effect visibility |
| `color` | string | Shadow color (for shadows) |
| `x` | number | X offset (for shadows) |
| `y` | number | Y offset (for shadows) |
| `blur` | number | Blur radius |
| `spread` | number | Spread radius |
| `opacity` | number | Effect opacity 0-100 |
| `blendMode` | string | Blend mode |

---

## 12. Animation Object

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | 'fadeIn', 'slideIn', 'scale', etc. |
| `direction` | string | 'left', 'right', 'up', 'down' |
| `duration` | number | Duration in ms |
| `delay` | number | Delay in ms |
| `easing` | string | Easing function |
| `buildOrder` | number | Build step order |

---

## 13. Master/Layout Properties

Properties on master objects (`state.masters[masterId]`):

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Master identifier |
| `type` | string | ✅ | 'theme' or 'layout' |
| `name` | string | ✅ | Display name |
| `parentId` | string | ❌ | Parent master ID (layouts inherit from themes) |
| `background` | Fill[] | ❌ | Background fill |
| `elements` | object | ✅ | Placeholder elements |
| `elementOrder` | string[] | ✅ | Element order |
| `themeSettings` | object | ❌ | Theme colors, fonts, text styles |

### Theme Settings Object

| Property | Type | Description |
|----------|------|-------------|
| `colors` | object | Color palette (accent1-6, text1-2, etc.) |
| `fonts` | object | { heading, body } |
| `textStyles` | object | Named text styles |

---

## 14. Metadata Properties

Properties in `state.meta`:

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Presentation title |
| `author` | string | Author name |
| `description` | string | Description |
| `created` | number/string | Creation timestamp |
| `modified` | number/string | Last modified timestamp |
| `theme` | string | Theme identifier |
| `tags` | string[] | Search tags |
| `language` | string | Language code |
| `version` | number | Document version |
| `aspectRatio` | string | '16:9', '4:3', etc. |

---

## 15. Serialization Strategy

### Recommended Approach: Copy All Properties

Instead of explicitly listing each property, the serializer should:

1. **Shallow copy all properties** from the source object
2. **Transform nested objects** (elements, fills) recursively
3. **Skip transient/computed properties** explicitly

```javascript
serializeElement(element) {
    // Copy ALL properties
    const serialized = { ...element };
    
    // Transform nested structures
    if (serialized.style) {
        serialized.style = { ...serialized.style };
    }
    
    // Remove transient properties (not persisted)
    delete serialized._domElement;
    delete serialized._cached;
    
    return serialized;
}
```

### Transient Properties (DO NOT SAVE)

These properties are runtime-only and should be excluded:

- `_domElement` - DOM reference
- `_cached*` - Cached computed values
- `_live*` - Live editing values
- `_observer` - ResizeObserver references
- `_codeRunner` - CodeRunner instances

---

## 16. Validation Checklist

When modifying serialization code, verify:

- [x] Slide `background` is saved (including array format and null)
- [x] Slide `background` uses `value` not `color` for solid fills
- [x] Shape `borderRadius` is saved
- [x] Shape `style.backgroundColor` is saved
- [x] Shape `style.fills` array is saved
- [x] Shape `style.strokes` array is saved
- [x] Text `content` is saved (not `text`)
- [x] Text `textFill` is saved
- [x] Text typography props at element level are saved
- [x] Element `effects` array is saved
- [x] Element `animation` is saved
- [x] Element `blendMode` is saved
- [x] Element `isPlaceholder` and `placeholderType` are saved
- [x] Slide `elementOrder` is saved and restored
- [x] Image/Video `src` is saved
- [x] All master/layout properties are saved
- [x] `null` background is preserved (not converted to default)

---

## Document History

| Date | Change |
|------|--------|
| 2025-11-29 | Fixed background serialization to preserve null and use `value` property |
| 2025-11-29 | Updated validation checklist with implementation status |
| 2025-11-29 | Initial comprehensive property documentation |
| 2025-11-29 | Initial comprehensive property list |
