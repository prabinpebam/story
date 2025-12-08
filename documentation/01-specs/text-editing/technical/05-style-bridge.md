# StyleBridge - Style System Integration

## 1. Purpose

Bridge between text editing and the existing style system. Manages style presets, syncs with StyleResolver, and tracks inline style overrides. Ensures Property Inspector shows correct values during editing.

## 2. Problem Being Solved

Text elements can have styles from multiple sources:
1. Theme defaults
2. Style presets (Heading 1, Body, etc.)
3. Element-level overrides
4. Inline formatting within content

Need a unified way to:
- Resolve effective style for display
- Apply preset changes
- Track what's overridden vs inherited
- Sync with Property Inspector

## 3. Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Preset Management | Apply presets, list available presets |
| Style Resolution | Get effective style from inheritance chain |
| Inline Tracking | Track which properties are overridden |
| PI Sync | Push style updates to Property Inspector |
| DOM Sync | Apply styles to contentEditable element |

## 4. Style Cascade

Resolution order (later wins):
1. **Theme** → Base typography settings
2. **Preset** → styleId reference (Heading 1, Body, etc.)
3. **Element** → Properties set on the element itself
4. **Inline** → HTML formatting within content (`<b>`, `<span style>`)

## 5. Style Presets

Presets defined per theme. Each preset specifies:
- fontFamily
- fontSize
- fontWeight
- lineHeight
- letterSpacing
- color (optional - can inherit from theme)

**Categories**:
- Headings (Heading 1, 2, 3)
- Body (Body, Body Large)
- UI (Caption, Label)

## 6. Preset Application Flow

When user selects a preset:
1. Update element's `styleId` to preset ID
2. Clear any inline overrides that match preset values
3. Keep inline overrides that differ from preset
4. Update DOM to reflect new styles
5. Notify Property Inspector

## 7. Inline Override Tracking

**What's an override?**
Any property explicitly set on element that differs from what would be inherited.

**Why track?**
- Enable "Reset to Preset" functionality
- Show override indicators in Property Inspector
- Preserve intentional customizations on preset change

**Storage**: Element has `inlineStyles` object with only overridden properties.

## 8. Property Inspector Sync

### Outbound (to Property Inspector)
When selection changes or editing starts:
- Compute effective style at selection
- Detect mixed state for multi-character selection
- Emit sync event with styles and override flags

### Inbound (from Property Inspector)
When user changes value in PI:
1. Determine if change is preset switch or property override
2. If preset: call applyPreset
3. If property: track as inline override
4. Restore text selection before applying (via SelectionManager)

## 9. DOM Style Application

Apply resolved styles to contentEditable element:
- fontFamily → CSS font-family
- fontSize → CSS font-size (with unit)
- fontWeight → CSS font-weight
- lineHeight → CSS line-height
- letterSpacing → CSS letter-spacing (em units)
- color → CSS color

## 10. Theme Change Handling

When theme changes:
1. All elements with styleId need style recalculation
2. Presets reference theme values, so they auto-update
3. DOM elements need re-rendering

## 11. Reset to Preset

User action to clear all inline overrides:
1. Clear element's `inlineStyles`
2. Keep `styleId` (preset reference)
3. Styles revert to preset defaults
4. Re-render DOM

## 12. Integration Points

| Component | Integration |
|-----------|-------------|
| StyleResolver | Query for computed styles |
| Store | Read/write element styleId and inlineStyles |
| TextEditManager | Notify of style changes |
| Property Inspector | Bidirectional sync |
| Theme system | React to theme changes |

## 13. Events

| Event | When |
|-------|------|
| `style-changed` | After any style modification |
| `preset-applied` | After preset change |
| `overrides-cleared` | After reset to preset |

## 14. Design System Integration

Per project principles, all styling must use global design tokens:

### Required CSS Variables

| Property | CSS Variable | Example |
|----------|--------------|--------|
| Text color | `--color-text-primary` | Body text |
| Heading color | `--color-text-heading` | Titles |
| Placeholder color | `--color-text-tertiary` | Prompt text |
| Selection bg | `--color-selection` | Text selection |
| Focus ring | `--color-focus-ring` | Edit mode indicator |
| Font family | `--font-family-sans` | Default text |
| Heading font | `--font-family-heading` | Titles |

### Typography Scale Tokens

| Preset | Token |
|--------|-------|
| Heading 1 | `--font-size-heading-1`, `--line-height-heading-1` |
| Heading 2 | `--font-size-heading-2`, `--line-height-heading-2` |
| Body | `--font-size-body`, `--line-height-body` |
| Caption | `--font-size-caption`, `--line-height-caption` |

### Dark/Light Mode

All color values must come from CSS variables that respond to `[data-theme="dark"]` or `[data-theme="light"]` on the root element. Never hardcode colors.

### Forbidden Patterns

- ❌ `element.style.color = '#333'`
- ❌ `style="font-size: 24px"`
- ✅ `element.classList.add('text-heading-1')`
- ✅ `var(--color-text-primary)`

## 15. Open Questions

1. Should selecting text and changing font create inline override or element override?
2. How to handle partial preset matches (some properties match, others don't)?
3. Should there be preset inheritance (Body Large extends Body)?
4. How to represent "mixed" state in Property Inspector when selection spans styles?
