# Property Inspector - Theme-Linked Properties

> **Part of:** [Property Inspector Specification v2.0](./00-overview.md)  
> **Related Specs:** [Color Theme Cascade](../../slides/themes/color-theme-cascade-architecture.md), [Linked Properties System](../../slides/themes/linked-properties-system.md)  
> **Implementation:** `src/ui/properties/FillSection.js`, `src/ui/properties/SlideSection.js`, `src/ui/components/ThemeSwatches.js`

---

## 1. Overview

This document specifies how theme-linked properties (colors and typography styles) are displayed and managed in the Property Inspector. Theme-linked properties maintain a live connection to their source slots, enabling automatic updates when the theme changes.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Theme-Linked** | Property references a slot (e.g., `themeSlot: 3`) rather than a hardcoded value |
| **Hardcoded** | Property stores a direct value (e.g., `color: "#FF5500"`) |
| **Cascade** | Theme Master → Layout Master → Individual Slide inheritance chain |
| **Override** | A slide or layout setting its own theme instead of inheriting |

---

## 2. Theme-Linked Color Properties

### 2.1 Which Properties Can Be Theme-Linked

| Element Type | Property | Linkable |
|--------------|----------|----------|
| **Shape** | Fill color | ✅ Yes |
| **Shape** | Stroke color | ✅ Yes |
| **Shape** | Shadow color | ✅ Yes |
| **Text** | Text fill color | ✅ Yes |
| **Text** | Text stroke color | ✅ Yes |
| **Line** | Stroke color | ✅ Yes |
| **Slide** | Background color | ✅ Yes |
| **Image** | Overlay tint | ✅ Yes |

### 2.2 Data Model

```javascript
// Hardcoded color (NOT theme-linked)
element.fills[0] = {
    type: "solid",
    color: "#FF5500",
    opacity: 1.0
    // No themeSlot - value is fixed
};

// Theme-linked color
element.fills[0] = {
    type: "solid",
    color: "#18A0FB",       // Resolved value for display
    themeSlot: 5,           // Links to slot 5 (Midtone Primary)
    opacity: 1.0
};
```

### 2.3 Visual Indicator in Fill Row

When a fill property is theme-linked, it must be visually distinct:

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HARDCODED:                                                     │
│  [≡] [■] #FF5500    100%  [👁] [−]     <- Normal appearance    │
│                                                                 │
│  THEME-LINKED:                                                  │
│  [≡] ║[■] Slot 5 🔗  100%  [👁] [−]    <- Accent border + icon │
│      ↑     ^Slot name  ^Link icon                              │
│      2px accent border                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Indicator Styling

```css
/* Theme-linked fill row indicator */
.fill-row.theme-linked {
    border-left: 2px solid var(--color-accent);
    padding-left: 6px; /* Compensate for border */
    background: linear-gradient(90deg, 
        rgba(var(--color-accent-rgb), 0.08) 0%, 
        transparent 50%);
}

.fill-row.theme-linked .fill-value-label {
    color: var(--color-accent);
    font-weight: 500;
}

.fill-row.theme-linked .link-icon {
    color: var(--color-accent);
    opacity: 0.7;
    margin-left: 4px;
}
```

### 2.5 Link Icon (🔗)

| State | Icon | Color |
|-------|------|-------|
| Theme-linked | 🔗 (link) | Accent color |
| Hardcoded | (none) | - |

---

## 3. Theme Color Selection Flow

### 3.1 Picking from Theme Swatches

When user clicks a swatch in the Theme Colors section of the color picker:

```
User clicks Theme Swatch (Slot 5)
           ↓
FillFlyout.SolidTab.handleThemeSwatchClick({
    slotIndex: 5,
    color: '#18A0FB'  // Current resolved value
})
           ↓
Updates fill with themeSlot reference:
{
    type: 'solid',
    color: '#18A0FB',
    themeSlot: 5,     // ← KEY: Creates the link
    opacity: 1.0
}
           ↓
Fill row shows "Slot 5 🔗" instead of "#18A0FB"
```

### 3.2 Using Custom Color Picker

When user picks a color via HSB picker, hex input, or eyedropper:

```
User adjusts HSB picker or enters hex
           ↓
FillFlyout.SolidTab.handleColorChange({
    color: '#FF5500'
})
           ↓
Updates fill WITHOUT themeSlot:
{
    type: 'solid',
    color: '#FF5500',
    // No themeSlot - hardcoded
    opacity: 1.0
}
           ↓
Fill row shows "#FF5500" (normal display)
Link is broken if it existed
```

### 3.3 Breaking a Theme Link

When a user manually edits a theme-linked fill:

1. **Any HSB adjustment** → Removes `themeSlot`
2. **Manual hex input** → Removes `themeSlot`
3. **Eyedropper pick** → Removes `themeSlot`
4. **Opacity change** → **Does NOT break link** (themeSlot preserved)

---

## 4. Theme Swatches in Color Picker

### 4.1 Theme Swatches Component

```
┌─────────────────────────────────────────────────────────────────┐
│  Theme Colors                       [Default Theme ▼]           │
│                                     ^Quick theme name           │
├─────────────────────────────────────────────────────────────────┤
│  Shadows   [■1][■2][■3][■4]        <- Slots 1-4 (dark)         │
│  Midtones  [■5][■6][■7][■8]        <- Slots 5-8 (mid)          │
│  Highlights[■9][■10][■11][■12]     <- Slots 9-12 (light)       │
├─────────────────────────────────────────────────────────────────┤
│  Source: Inherited from Master      <- Cascade indicator       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Swatch Hover Tooltip

On hover, show slot details:

```
┌─────────────────────────┐
│  Slot 5 - Midtone       │
│  Primary                │
│  #18A0FB                │
│  Click to apply linked  │
└─────────────────────────┘
```

### 4.3 Selected Swatch Indication

When a fill uses a theme slot, that swatch shows selection ring:

```
┌────┐    ┌────┐    ┌════┐    ┌────┐
│ 1  │    │ 2  │    ║ 3  ║    │ 4  │
│    │    │    │    ║    ║    │    │
└────┘    └────┘    └════┘    └────┘
                    ↑ Selected (2px accent border)
```

---

## 5. Theme Override UI in Slide Section

### 5.1 Current Theme Display

When no element selected, the Slide Section shows theme info:

```
┌─────────────────────────────────────────────────────────────────┐
│  Colors                                                      ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Theme: [Default Theme          ▼]     <- Override dropdown    │
│                                                                 │
│  [■][■][■][■][■][■]  [■][■][■][■][■][■]   <- 12 swatches      │
│                                                                 │
│  Source: Inherited from Master         <- Cascade source       │
│  [Edit Theme ✏️]  [Reset to Inherited ↺]                       │
│                                                                 │
│  Mode:   [☀️ Light]  [🌙 Dark]                                  │
│              ●          ○                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Theme Override Dropdown

Clicking the theme dropdown shows available themes for override:

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Theme                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ◉ Inherit from Layout                  <- Default option      │
│  ─────────────────────────────────                              │
│  ○ Default Theme         [■■■■■■]       <- Preview swatches    │
│  ○ Ocean Sunset          [■■■■■■]                              │
│  ○ Forest Green          [■■■■■■]                              │
│  ○ Midnight Blue         [■■■■■■]                              │
│  ─────────────────────────────────                              │
│  [+ Create Custom...]                    <- Opens CTM          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Cascade Behavior by Mode

| Mode | Dropdown Shows | Cascade Source |
|------|----------------|----------------|
| **Slide Mode** | "Inherit from Layout" + all themes | Layout → Master |
| **Layout Mode** | "Inherit from Master" + all themes | Master |
| **Master Mode** | All themes (no inherit option) | None |

### 5.4 Override Badge States

| State | Badge | Actions Available |
|-------|-------|-------------------|
| Inherited | "Inherited" (muted) | Edit, Override |
| Overridden | "Override" (accent) | Edit, Reset |
| Master | (none) | Edit |

---

## 6. Typography Style Linking

### 6.1 Text Style Reference

```javascript
// No style applied (all hardcoded)
textElement = {
    type: "text",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.4
    // All values explicit
};

// Style applied (linked)
textElement = {
    type: "text",
    styleId: "title",  // ← Links to Typography Style
    // Properties derived from style definition
};

// Style with overrides
textElement = {
    type: "text",
    styleId: "title",
    overrides: {
        fontSize: 32  // Local override
    }
};
```

### 6.2 Style Indicator in Typography Section

```
┌─────────────────────────────────────────────────────────────────┐
│  Typography                                                  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Style:  [Title              ▼] 🔗    <- Linked indicator      │
│          ^Dropdown              ^Icon                          │
│                                                                 │
│  ═════════════════════════════════════                         │
│  ^Accent underline when style linked                           │
│                                                                 │
│  Font:   [Inter          ▼] [Bold    ▼] [44] pt                │
│  Fill:   [■] Slot 1 🔗                                         │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Style Override Indication

When properties are locally overridden:

```
┌─────────────────────────────────────────────────────────────────┐
│  Style:  [Title*             ▼]   [Reset Overrides]            │
│          ^Asterisk shows override                              │
│                                                                 │
│  Font:   [Inter          ▼] [Bold    ▼] [48] pt ●             │
│                                          ^Override dot         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Override Dot Styling

```css
.property-row.has-override::after {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    margin-left: 4px;
}
```

---

## 7. Copy/Paste Behavior

### 7.1 Copying Elements with Theme-Linked Properties

When copying an element with `themeSlot` references:

```javascript
// Original element on Slide A (Ocean Theme)
element.fills[0] = {
    type: "solid",
    color: "#18A0FB",  // Ocean's Slot 5 color
    themeSlot: 5,
    opacity: 1.0
};

// Copied to clipboard preserves themeSlot
clipboard = {
    fills: [{
        type: "solid",
        themeSlot: 5,  // ← Preserved
        opacity: 1.0
        // Note: color omitted - will resolve on paste
    }]
};
```

### 7.2 Pasting to Different Theme Context

```javascript
// Pasting to Slide B (Forest Theme)
// Forest's Slot 5 = #2D8A4E (green midtone)

pastedElement.fills[0] = {
    type: "solid",
    color: "#2D8A4E",  // ← Resolved from new context
    themeSlot: 5,       // ← Still linked to slot 5
    opacity: 1.0
};
```

### 7.3 Cross-Theme Paste UX

User sees the element "adapt" to its new theme context:

| Before Paste | After Paste | Result |
|--------------|-------------|--------|
| Blue button (Ocean, Slot 5) | → Forest theme | Green button (same slot) |
| Red accent (Sunset, Slot 3) | → Midnight theme | Purple accent (same slot) |

---

## 8. Multi-Selection with Theme-Linked Properties

### 8.1 Same Theme Slot

When all selected elements use the same theme slot:

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ║[■] Slot 5 🔗    100%   [👁] [−]                             │
│  ^All use same slot - normal display                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Mixed Theme Slots

When selected elements use different theme slots:

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ║[■] Mixed Slots 🔗  —%   [👁] [−]                            │
│  ^Shows "Mixed Slots"  ^Dash for opacity                       │
│                                                                 │
│  ⓘ Selection uses slots: 3, 5, 7                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Mixed Linked vs Hardcoded

When some elements are theme-linked and some hardcoded:

```
┌─────────────────────────────────────────────────────────────────┐
│  Fill                                                   [+]  ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [■] Mixed     —%   [👁] [−]                                   │
│  ^No accent border (not all linked)                            │
│                                                                 │
│  ⓘ 3 linked, 2 custom colors                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Theme Swatches Component Specification

### 9.1 Props

```typescript
interface ThemeSwatchesProps {
    // Display options
    showThemeName?: boolean;        // Show theme name header (default: true)
    showSource?: boolean;           // Show inheritance source (default: true)
    columns?: 6 | 12;               // Swatches per row (default: 6)
    
    // Selection
    selectedSlot?: number | null;   // Currently selected slot (0-11)
    
    // Callbacks
    onColorSelect?: (color: string) => void;          // For hardcoded picks
    onLinkedColorSelect?: (slotIndex: number, color: string) => void;  // For linked picks
    
    // Context
    slideId?: string;               // For cascade resolution
}
```

### 9.2 Theme Name Resolution

```javascript
// ThemeSwatches determines theme name via cascade
getThemeDisplayInfo() {
    const themeInfo = StyleResolver.getThemeInfoForCurrentContext();
    
    return {
        name: themeInfo.name,                    // "Ocean Sunset"
        source: themeInfo.source,                // "master" | "layout" | "slide"
        sourceLabel: this.getSourceLabel(themeInfo.source)  // "Inherited from Master"
    };
}
```

### 9.3 Source Label Mapping

| Source | Label |
|--------|-------|
| `master` | "Inherited from Master" |
| `layout` | "Inherited from Layout" |
| `slide` | "Slide-specific" |

---

## 10. Store Actions for Theme Operations

### 10.1 Slide Theme Override

```javascript
// Set slide-level theme override
store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
    slideId: 'slide-1',
    styleAssignments: {
        colorTheme: 'preset_ocean_sunset'  // Theme ID
    }
});

// Clear override (inherit from parent)
store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
    slideId: 'slide-1',
    styleAssignments: {
        colorTheme: null  // null = inherit
    }
});
```

### 10.2 Layout Theme Override

```javascript
// Set layout-level theme override
store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
    masterId: 'layout-title',
    styleAssignments: {
        colorTheme: 'preset_forest_green'
    }
});
```

### 10.3 Master Theme Settings

```javascript
// Set master theme (no inheritance - this IS the source)
store.dispatch('UPDATE_THEME_SETTINGS', {
    masterId: 'theme-default',
    themeSettings: {
        lumaTheme: { /* full theme object */ }
    }
});
```

---

## 11. Accessibility

### 11.1 ARIA Attributes for Theme-Linked Properties

```html
<!-- Theme-linked fill row -->
<div 
    class="fill-row theme-linked"
    role="group"
    aria-label="Fill 1: Linked to theme slot 5"
>
    <button class="fill-swatch" aria-label="Edit fill color, currently linked to Midtone Primary">
        <span class="visually-hidden">Theme slot 5: #18A0FB</span>
    </button>
    <span class="fill-value" aria-live="polite">Slot 5</span>
    <span class="link-icon" aria-hidden="true">🔗</span>
</div>

<!-- Theme swatches -->
<div 
    class="theme-swatches" 
    role="listbox" 
    aria-label="Theme colors: Ocean Sunset"
>
    <button 
        role="option"
        aria-selected="true"
        aria-label="Slot 5: Midtone Primary, #18A0FB. Click to apply theme-linked color."
    >
        <span class="swatch" style="background: #18A0FB"></span>
    </button>
</div>
```

### 11.2 Screen Reader Announcements

| Action | Announcement |
|--------|--------------|
| Click theme swatch | "Applied theme color slot 5, Midtone Primary" |
| Use custom color | "Applied custom color #FF5500, theme link removed" |
| Override slide theme | "Theme overridden to Ocean Sunset" |
| Reset to inherited | "Theme reset to inherited from Master" |

---

## 12. Related Documents

- [Color Theme Cascade Architecture](../../slides/themes/color-theme-cascade-architecture.md) - How themes cascade through the system
- [Color Themes Spec](../../slides/themes/color-themes-spec.md) - Full color theme system specification
- [Linked Properties System](../../slides/themes/linked-properties-system.md) - Detailed linking mechanics
- [Typography Style Manager](../../slides/themes/typography-style-manager.md) - Typography system specification
- [Presentation Design UX Guide](../../slides/themes/presentation-design-ux-guide.md) - User mental model
