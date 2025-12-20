# Linked Properties System Specification

## Overview

The **Linked Properties System** is the mechanism by which element properties (colors, typography styles) maintain a live connection to their source slots in the design system. When a property is applied via a theme color slot or typography style, that property remains **bound** to the source—enabling automatic updates when the theme or style changes.

This document specifies:
1. How properties are linked to theme/style slots
2. How linked properties are visually indicated in the Property Inspector
3. The behavior when themes or styles change
4. Override and detachment mechanics
5. User experience patterns and interactions

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Color Theme Linking](#2-color-theme-linking)
3. [Typography Style Linking](#3-typography-style-linking)
4. [Visual Indicators in Property Inspector](#4-visual-indicators-in-property-inspector)
5. [Theme & Style Change Propagation](#5-theme--style-change-propagation)
6. [Override & Detachment Mechanics](#6-override--detachment-mechanics)
7. [User Flows](#7-user-flows)
8. [Data Model](#8-data-model)
9. [Industry Benchmarks](#9-industry-benchmarks)
10. [Implementation Notes](#10-implementation-notes)
11. [Accessibility](#11-accessibility)
12. [Related Documents](#12-related-documents)

---

## 1. Core Concepts

### 1.1 What is a Linked Property?

A **linked property** is any element property that references a slot in the design system rather than storing a hardcoded value. The property derives its actual value from the referenced slot.

```
┌─────────────────────────────────────────────────────────────────┐
│                     HARDCODED VS LINKED                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HARDCODED (Static)           LINKED (Dynamic)                   │
│  ─────────────────            ─────────────────                  │
│  fill: "#18A0FB"              fill: { slot: "accent1" }          │
│                                      ↓                           │
│  Value is fixed.              Value resolves to theme.accent1   │
│  Theme changes have           Theme changes → value updates     │
│  no effect on this.           automatically.                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Binding Sources

Properties can be linked to two types of sources:

| Source Type | Description | Examples |
|-------------|-------------|----------|
| **Color Theme Slot** | One of 12 semantic color slots | `background1`, `text1`, `accent1`, `hyperlink` |
| **Typography Style** | A named text style definition | `title`, `subtitle`, `bodyLevel1`, `caption` |

### 1.3 The Mental Model

Users should think of linked properties as **pointers** or **aliases**:

> "This rectangle's fill is set to Accent 1. I don't know (or care) what color Accent 1 is right now—it could be blue, orange, or purple. What matters is that it's always my primary accent color."

This abstraction enables:
- Global design changes from a single control point
- Consistent theming across all slides
- Easy experimentation with different color palettes
- Professional design system workflows

---

## 2. Color Theme Linking

### 2.1 Linkable Color Properties

The following element properties can be linked to color theme slots:

| Element Type | Property | Linkable |
|--------------|----------|----------|
| **Shape** | Fill color | ✅ Yes |
| **Shape** | Stroke color | ✅ Yes |
| **Shape** | Shadow color | ✅ Yes |
| **Text** | Text fill color | ✅ Yes |
| **Text** | Text stroke color | ✅ Yes |
| **Text** | Text shadow color | ✅ Yes |
| **Line** | Stroke color | ✅ Yes |
| **Slide** | Background color | ✅ Yes |
| **Group** | — | N/A (no direct color) |
| **Image** | Overlay tint | ✅ Yes |

### 2.2 Color Slot Reference

Each color property stores either a hardcoded value or a slot reference:

```javascript
// Hardcoded color
element.fill = {
  type: "solid",
  color: "#FF5500",
  opacity: 1.0
};

// Linked color (slot reference)
element.fill = {
  type: "solid",
  themeSlot: "accent1",  // ← Link to theme slot
  opacity: 1.0
  // color is derived at render time from theme.colors.accent1
};
```

### 2.3 Available Theme Slots

| Slot ID | Display Name | Semantic Purpose |
|---------|--------------|------------------|
| `background1` | Background 1 | Primary background |
| `background2` | Background 2 | Secondary background |
| `text1` | Text Primary | Headlines, body text |
| `text2` | Text Secondary | Subtitles, captions |
| `accent1` | Accent 1 | Primary highlights |
| `accent2` | Accent 2 | Secondary highlights |
| `accent3` | Accent 3 | Tertiary accent |
| `accent4` | Accent 4 | Quaternary accent |
| `accent5` | Accent 5 | Quinary accent |
| `accent6` | Accent 6 | Senary accent |
| `hyperlink` | Hyperlink | Clickable links |
| `followedHyperlink` | Followed Link | Visited links |

### 2.4 Linking Flow in Color Picker

When a user picks a color from the **Theme Swatches** section:

```
┌─────────────────────────────────────────┐
│  Theme Colors  [Modern Dark ▼]           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │ B1 │ │ B2 │ │ T1 │ │ T2 │ │ A1 │ ... │  ← Clicking any of these
│  └────┘ └────┘ └────┘ └────┘ └────┘     │    creates a LINKED property
├─────────────────────────────────────────┤
│  Custom Color                            │
│  [  Color Picker Controls  ]             │  ← Using picker creates
│                                          │    HARDCODED property
└─────────────────────────────────────────┘
```

**Result of clicking a theme swatch:**
```javascript
// Before (no fill)
element.fill = null;

// After clicking "Accent 1" swatch
element.fill = {
  type: "solid",
  themeSlot: "accent1",  // LINKED
  opacity: 1.0
};
```

**Result of using custom picker:**
```javascript
// After using HSB picker or entering hex
element.fill = {
  type: "solid",
  color: "#3366CC",  // HARDCODED
  opacity: 1.0
};
```

---

## 3. Typography Style Linking

### 3.1 Linkable Typography Properties

When a Typography Style is applied, the following properties become linked:

| Property | Linked From Style | Can Be Overridden |
|----------|-------------------|-------------------|
| Font Family | `style.fontFamily` → `theme.fonts[heading|body]` | ✅ Yes |
| Font Weight | `style.fontWeight` | ✅ Yes |
| Font Size | `style.fontSize` | ✅ Yes |
| Line Height | `style.lineHeight` | ✅ Yes |
| Letter Spacing | `style.letterSpacing` | ✅ Yes |
| Text Transform | `style.textTransform` | ✅ Yes |
| Text Color | `style.color` → theme slot | ✅ Yes |

### 3.2 Style Reference

Text elements store a style reference:

```javascript
// No style applied (all properties hardcoded)
textElement = {
  type: "text",
  content: "Hello World",
  style: null,  // No linked style
  fontFamily: "Arial",
  fontSize: 24,
  fontWeight: "400",
  // ... all other props are explicit values
};

// Style applied (linked)
textElement = {
  type: "text",
  content: "Hello World",
  styleId: "title",  // ← Link to Typography Style
  overrides: {}      // ← Local overrides (if any)
  // All other props are derived from the style
};
```

### 3.3 Partial Style Linking (Overrides)

Unlike color linking (which is all-or-nothing per property), typography allows **partial linking**:

```javascript
// Style applied with local override
textElement = {
  type: "text",
  content: "Special Title",
  styleId: "title",
  overrides: {
    fontSize: 56  // This property is overridden
    // All other props still come from "title" style
  }
};
```

### 3.4 Available Typography Styles

| Style ID | Display Name | Typical Usage |
|----------|--------------|---------------|
| `title` | Title | Slide titles |
| `subtitle` | Subtitle | Slide subtitles |
| `bodyLevel1` | Body Level 1 | Top-level bullets |
| `bodyLevel2` | Body Level 2 | Sub-bullets |
| `bodyLevel3` | Body Level 3 | Sub-sub-bullets |
| `bodyLevel4` | Body Level 4 | Deep nesting |
| `bodyLevel5` | Body Level 5 | Deepest nesting |
| `caption` | Caption | Footnotes, image captions |
| `[custom]` | User-defined | Custom styles |

---

## 4. Visual Indicators in Property Inspector

### 4.1 Design Philosophy

Linked properties must be **immediately recognizable** in the Property Inspector. Users should:
1. Know at a glance whether a property is linked or hardcoded
2. Understand which slot/style the property is linked to
3. Have easy access to detach or change the link

### 4.2 Indicator Design Language

The linked property indicator uses the application's **accent color** to create a distinctive visual:

```
┌────────────────────────────────────────────────────────────────────┐
│  LINKED PROPERTY INDICATOR DESIGN                                   │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Regular (Hardcoded) Property:                                       │
│  ┌────────────────────────────────────────┐                         │
│  │  Fill     [■] #3366CC           [-]    │  ← No special styling   │
│  └────────────────────────────────────────┘                         │
│                                                                      │
│  Linked Property (to Theme Slot):                                   │
│  ┌────────────────────────────────────────┐                         │
│  │  Fill     [■] Accent 1 🔗       [-]    │  ← Shows slot name      │
│  └────────────────────────────────────────┘    + link icon          │
│       ↑                                                              │
│       │  Accent color left border (2px)                             │
│       │  + Subtle glow effect                                        │
│       └──────────────────────────────────                            │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Linked Color Property Indicator

#### Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│  FILL                                              [+]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ║                                                            ││
│  │ ║  [■]  Accent 1                        100%    [👁] [-]    ││
│  │ ║       ────────                                             ││
│  │ ║       #18A0FB                                              ││
│  │ ║                                                            ││
│  └─║────────────────────────────────────────────────────────────┘│
│    ↑                                                              │
│    2px accent-color left border                                   │
│    + box-shadow: 0 0 8px rgba(accent, 0.3)                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Components

| Element | Description | Styling |
|---------|-------------|---------|
| **Left Border** | Accent color vertical line | `border-left: 2px solid var(--accent)` |
| **Glow** | Subtle ambient glow | `box-shadow: 0 0 8px rgba(accent, 0.25)` |
| **Slot Name** | "Accent 1" instead of hex | Bold, accent color text |
| **Resolved Value** | Actual hex shown below slot name | Muted, smaller text |
| **Link Icon** | 🔗 or chain-link icon | Optional, next to slot name |

### 4.4 Linked Typography Style Indicator

#### Visual Design (Full Style Applied)

```
┌─────────────────────────────────────────────────────────────────┐
│  TEXT STYLE                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ║                                                            ││
│  │ ║  Title                                      [Edit] [⋮]    ││
│  │ ║  ─────                                                     ││
│  │ ║  Inter Bold · 44pt · #FFFFFF                               ││
│  │ ║                                                            ││
│  └─║────────────────────────────────────────────────────────────┘│
│    ↑                                                              │
│    Linked indicator (accent border + glow)                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Visual Design (Style with Overrides)

```
┌─────────────────────────────────────────────────────────────────┐
│  TEXT STYLE                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ║                                                            ││
│  │ ║  Title *                                   [Reset] [⋮]    ││
│  │ ║  ───────                                                   ││
│  │ ║  Inter Bold · 56pt* · #FFFFFF                              ││
│  │ ║              ─────                                          ││
│  │ ║              ↑ Overridden value (styled differently)       ││
│  └─║────────────────────────────────────────────────────────────┘│
│    ↑                                                              │
│    Still linked (partial), indicator remains                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Override Indicator

| State | Visual Cue |
|-------|------------|
| **Fully Linked** | Style name only, no asterisk |
| **Has Overrides** | Style name + asterisk: "Title *" |
| **Overridden Property** | Property value with underline/highlight and asterisk |

### 4.5 Individual Property Override Indicators

When editing typography properties directly while a style is applied:

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPOGRAPHY                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Font Family:    [Inter            ▼]           ← From style    │
│  Font Weight:    [Bold             ▼]           ← From style    │
│  Font Size:      [56    ]* [Reset ↺]            ← OVERRIDDEN    │
│                   ↑                                              │
│                   Orange/accent dot or different background      │
│                                                                  │
│  Line Height:    [Auto             ▼]           ← From style    │
│  Letter Spacing: [0%               ]            ← From style    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Property-Level Override Visual

| Element | Linked (from style) | Overridden (local) |
|---------|--------------------|--------------------|
| **Background** | Default | Subtle warning tint |
| **Value Label** | Normal | Asterisk suffix |
| **Reset Button** | Hidden | Visible (↺ icon) |
| **Indicator Dot** | None | Small accent dot |

### 4.6 Tooltip Information

Hovering over any linked indicator shows detailed information:

```
┌────────────────────────────────────────────────────┐
│  🔗 Linked to Theme Color                          │
│  ─────────────────────────────                     │
│  Slot: Accent 1                                    │
│  Current Value: #18A0FB                            │
│                                                    │
│  This color will update automatically when         │
│  the theme changes.                                │
│                                                    │
│  [Detach] to use current color as fixed value.    │
└────────────────────────────────────────────────────┘
```

### 4.7 Color Swatch in Property Inspector

Theme-linked color swatches have a distinct appearance:

```
┌──────────────────────────────────────────────────────────────────┐
│  SWATCH COMPARISON                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Hardcoded Color:             Linked Color:                       │
│  ┌──────────────┐             ┌──────────────┐                   │
│  │              │             │   ┌──────┐   │                   │
│  │   #3366CC    │             │   │ A1   │   │  ← Small label    │
│  │              │             │   └──────┘   │    in corner       │
│  │              │             │              │                    │
│  └──────────────┘             └──────────────┘                   │
│                                       ↑                           │
│                               Accent border ring                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Theme & Style Change Propagation

### 5.1 Color Theme Change Propagation

When the user applies a new color theme or modifies a theme slot:

```
┌──────────────────────────────────────────────────────────────────┐
│                      PROPAGATION FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User changes theme.colors.accent1 from #18A0FB to #FF6B00    │
│                              │                                    │
│                              ▼                                    │
│  2. Store emits 'theme:colorChanged' event with:                 │
│     { slot: 'accent1', oldValue: '#18A0FB', newValue: '#FF6B00' }│
│                              │                                    │
│                              ▼                                    │
│  3. Renderer scans all elements for themeSlot: 'accent1'         │
│     (This is optimized via slot → element ID index)              │
│                              │                                    │
│                              ▼                                    │
│  4. Each matching element is re-rendered with new color          │
│                              │                                    │
│                              ▼                                    │
│  5. Canvas updates in real-time (< 16ms for 60fps)               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Typography Style Change Propagation

When the user modifies a typography style:

```
┌──────────────────────────────────────────────────────────────────┐
│                      PROPAGATION FLOW                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User changes styles.title.fontSize from 44 to 48             │
│                              │                                    │
│                              ▼                                    │
│  2. Store emits 'typography:styleChanged' event with:            │
│     { styleId: 'title', property: 'fontSize', value: 48 }        │
│                              │                                    │
│                              ▼                                    │
│  3. TextRenderer scans all text elements for styleId: 'title'    │
│     that don't have fontSize in their overrides                  │
│                              │                                    │
│                              ▼                                    │
│  4. Each matching text element recalculates layout and renders   │
│                              │                                    │
│                              ▼                                    │
│  5. Text reflows, bounding boxes update, canvas refreshes        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 Performance Optimization

| Optimization | Description |
|--------------|-------------|
| **Slot Index** | Maintain `Map<slotId, Set<elementId>>` for O(1) lookup |
| **Dirty Flagging** | Only re-render elements whose linked slot changed |
| **Batch Updates** | Coalesce multiple slot changes into single render pass |
| **Lazy Resolution** | Resolve theme values at render time, not storage time |

---

## 6. Override & Detachment Mechanics

### 6.1 Color Detachment

**Action:** User clicks "Detach" or picks a custom color for a linked property.

**Before:**
```javascript
element.fill = {
  type: "solid",
  themeSlot: "accent1",
  opacity: 1.0
};
```

**After:**
```javascript
element.fill = {
  type: "solid",
  color: "#18A0FB",  // Current resolved value, now hardcoded
  opacity: 1.0
};
```

**User Experience:**
1. Linked indicator disappears
2. Property row returns to default styling
3. Future theme changes do not affect this property

### 6.2 Typography Style Detachment

**Full Detachment:**
Removes the style entirely, converting all derived values to hardcoded properties.

**Before:**
```javascript
textElement = {
  styleId: "title",
  overrides: {}
};
```

**After:**
```javascript
textElement = {
  styleId: null,
  fontFamily: "Inter",
  fontSize: 44,
  fontWeight: "700",
  lineHeight: 1.2,
  letterSpacing: -0.02,
  textTransform: "none",
  color: "#FFFFFF"
};
```

### 6.3 Partial Override (Typography Only)

User can override individual properties while keeping the style link:

**Before:**
```javascript
textElement = {
  styleId: "title",
  overrides: {}
};
```

**After changing font size to 56:**
```javascript
textElement = {
  styleId: "title",  // Still linked!
  overrides: {
    fontSize: 56     // Only this property is overridden
  }
};
```

### 6.4 Reset to Style

When a text element has overrides, a "Reset" action is available:

**Before:**
```javascript
textElement = {
  styleId: "title",
  overrides: {
    fontSize: 56,
    fontWeight: "900"
  }
};
```

**After Reset:**
```javascript
textElement = {
  styleId: "title",
  overrides: {}  // All overrides cleared
};
```

### 6.5 Detachment Confirmation

For potentially destructive actions, show confirmation:

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️ Detach from Theme Color?                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This will convert "Accent 1" to a fixed color value.         │
│  The fill will no longer update when the theme changes.        │
│                                                                 │
│  Current value: #18A0FB                                         │
│                                                                 │
│             [Cancel]                    [Detach]                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. User Flows

### 7.1 Applying a Theme Color

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW: Apply Theme Color to Rectangle Fill                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects rectangle                                       │
│  2. In Property Inspector, clicks Fill color swatch             │
│  3. Color Picker flyout opens                                   │
│  4. User clicks "Accent 1" in Theme Swatches section            │
│  5. Flyout closes                                                │
│  6. Fill row now shows:                                          │
│     - Accent color border/glow (linked indicator)               │
│     - "Accent 1" label instead of hex                           │
│     - Resolved hex shown below in muted text                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Changing a Theme Color Globally

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW: Change Accent 1 Color for Entire Presentation       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User opens Color Theme Manager (Ctrl+Shift+C / Cmd+Shift+C) │
│  2. Switches to Custom tab                                       │
│  3. Clicks "Edit" next to Accent 1                              │
│  4. Changes color from blue (#18A0FB) to orange (#FF6B00)       │
│  5. All elements linked to Accent 1 update in real-time:        │
│     - All slides visible in thumbnail strip                     │
│     - Current slide on canvas                                    │
│  6. User clicks "Apply" to confirm                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Applying a Text Style

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW: Apply "Title" Style to Text Element                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects text element                                    │
│  2. In Property Inspector Typography section, clicks Style      │
│     dropdown (shows "No Style")                                  │
│  3. User selects "Title"                                         │
│  4. Text immediately updates:                                    │
│     - Font changes to theme heading font                         │
│     - Size changes to 44pt                                       │
│     - Weight changes to Bold                                     │
│     - Color changes to Text Primary (if defined in style)       │
│  5. Style section shows:                                         │
│     - Accent color border/glow (linked indicator)               │
│     - "Title" with resolved font info below                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Overriding a Style Property

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW: Override Font Size While Keeping Style              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects text with "Title" style applied                │
│  2. In Typography section, changes Font Size from 44 to 56      │
│  3. Font Size field shows:                                       │
│     - Override indicator (dot, asterisk, or background tint)   │
│     - [Reset] button appears next to field                      │
│  4. Style display updates to "Title *" (asterisk = has override)│
│  5. Element still receives other style changes (font, weight)   │
│     but font size is locally controlled                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Detaching from Theme Color

```
┌─────────────────────────────────────────────────────────────────┐
│  USER FLOW: Detach Fill from Theme Color                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects element with linked fill (Accent 1)            │
│  2. User clicks Fill color swatch to open picker                │
│  3. User modifies color using HSB slider (not theme swatches)   │
│     OR clicks "Detach" button in the property row               │
│  4. Confirmation dialog appears (optional, can be disabled)     │
│  5. Property converts to hardcoded hex value                    │
│  6. Linked indicator disappears from property row               │
│  7. Future theme changes will not affect this fill              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Model

### 8.1 Color Property Schema

```javascript
/**
 * Color property supporting both hardcoded and linked values
 */
ColorProperty = {
  type: "solid" | "gradient" | "image" | "video" | "code",
  
  // For solid colors:
  // EITHER hardcoded color OR theme slot (mutually exclusive)
  color: "#RRGGBB" | null,       // Hardcoded color value
  themeSlot: SlotId | null,      // Link to theme slot
  
  opacity: 0.0 - 1.0,
  blendMode: "normal" | "multiply" | "screen" | ...
};

// Where SlotId is:
type SlotId = 
  | "background1" | "background2"
  | "text1" | "text2"
  | "accent1" | "accent2" | "accent3" | "accent4" | "accent5" | "accent6"
  | "hyperlink" | "followedHyperlink";
```

### 8.2 Text Element Schema with Style Linking

```javascript
/**
 * Text element with optional style linking
 */
TextElement = {
  type: "text",
  id: "element-uuid",
  content: "Hello World",
  
  // Style linking
  styleId: StyleId | null,       // Link to typography style
  overrides: {                   // Local overrides (empty if none)
    fontSize?: number,
    fontWeight?: string,
    lineHeight?: number | "auto",
    letterSpacing?: number,
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize",
    color?: ColorProperty        // Can itself be linked to theme slot
  },
  
  // Fallback properties (used when styleId is null)
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  // ... other typography properties
};
```

### 8.3 Theme Slot Index

For efficient propagation, maintain an index:

```javascript
/**
 * Index mapping theme slots to element IDs using them
 * Rebuilt on document load, updated on property changes
 */
ThemeSlotIndex = {
  slots: Map<SlotId, Set<ElementId>>,
  
  methods: {
    // Register an element's use of a slot
    register(slotId: SlotId, elementId: ElementId): void,
    
    // Unregister when element changes or is deleted
    unregister(slotId: SlotId, elementId: ElementId): void,
    
    // Get all elements using a slot (for propagation)
    getElementsUsingSlot(slotId: SlotId): Set<ElementId>
  }
};
```

### 8.4 Typography Style Index

Similar index for typography styles:

```javascript
/**
 * Index mapping style IDs to text element IDs using them
 */
StyleIndex = {
  styles: Map<StyleId, Set<ElementId>>,
  
  methods: {
    register(styleId: StyleId, elementId: ElementId): void,
    unregister(styleId: StyleId, elementId: ElementId): void,
    getElementsUsingStyle(styleId: StyleId): Set<ElementId>
  }
};
```

---

## 9. Industry Benchmarks

### 9.1 Figma

**Color Styles:**
- Properties linked to a Color Style show a **4-dot grid icon** (⁘) in the property row
- Clicking the icon opens a popover with the style name and actions
- Styles can be "unlinked" to convert to local value
- Changes to Color Styles propagate instantly to all instances

**Text Styles:**
- Text with a style shows the **style name** in the property inspector
- Overrides are indicated with an **asterisk** next to the style name
- A "Reset" option reverts all overrides
- Individual properties can be reset independently

**Key UX Patterns:**
- Subtle but clear visual distinction for linked vs. local
- Easy one-click access to detach/unlink
- Override indicators at both component and property level

### 9.2 Sketch

**Shared Styles:**
- Similar 4-dot icon for linked properties
- "Create Style" and "Update Style" actions readily available
- Override indicators with reset functionality

**Key UX Patterns:**
- Minimal visual noise for linked properties
- Clear actions for style management

### 9.3 Adobe XD

**Colors from Document Colors:**
- Less explicit linking mechanism
- Uses swatches panel as source of truth
- Changes to swatches update uses across document

**Character Styles:**
- Named styles with clear override indicators
- "Clear Overrides" action when modifications exist

### 9.4 Notion

**Color Theming:**
- Simple dropdown for accent color
- All linked elements update when accent changes
- No explicit "linked" indicator (implicit in the system)

### 9.5 PowerPoint (Microsoft Office)

**Theme Colors:**
- Colors picked from "Theme Colors" section remain linked
- Changing theme updates all linked colors
- Clear visual separation between "Theme Colors" and "Standard Colors"

**Key UX Patterns:**
- Theme colors displayed prominently in color picker
- Visual organization makes linking feel natural

### 9.6 Key Takeaways for Our Design

| App | Strength | Adopt |
|-----|----------|-------|
| **Figma** | Clear 4-dot icon, asterisk for overrides | Override indicator pattern |
| **Sketch** | Minimal visual noise | Subtle linked indicator |
| **Adobe XD** | Integrated with design system | Character style flows |
| **PowerPoint** | Theme colors prominently displayed | Theme swatch section design |
| **Notion** | Implicit linking feels natural | Make linking the default path |

---

## 10. Implementation Notes

### 10.1 Rendering Pipeline

```javascript
/**
 * Resolve a color property to an actual color value
 */
function resolveColor(colorProp, theme) {
  if (colorProp.themeSlot) {
    // Linked color - resolve from theme
    return theme.colors[colorProp.themeSlot];
  }
  // Hardcoded color
  return colorProp.color;
}

/**
 * Resolve text styles for a text element
 */
function resolveTextStyles(element, typographyStyles, theme) {
  if (!element.styleId) {
    // No style linked - return element's own properties
    return element;
  }
  
  const baseStyle = typographyStyles.styles[element.styleId];
  const resolved = { ...baseStyle };
  
  // Apply local overrides
  Object.assign(resolved, element.overrides);
  
  // Resolve font family from theme fonts
  if (resolved.fontFamily === "heading") {
    resolved.fontFamily = theme.fonts.heading.family;
  } else if (resolved.fontFamily === "body") {
    resolved.fontFamily = theme.fonts.body.family;
  }
  
  // Resolve color if it's a theme reference
  if (typeof resolved.color === "string" && isThemeSlot(resolved.color)) {
    resolved.color = theme.colors[resolved.color];
  }
  
  return resolved;
}
```

### 10.2 Property Inspector Integration

```javascript
/**
 * Check if a property is linked
 */
function isLinkedProperty(element, propertyPath) {
  const value = getPropertyValue(element, propertyPath);
  
  // Color property linked to theme slot
  if (value?.themeSlot) return true;
  
  // Text element with style applied
  if (propertyPath.startsWith("typography.") && element.styleId) {
    // Check if this specific property is overridden
    const propName = propertyPath.replace("typography.", "");
    return !element.overrides?.[propName];
  }
  
  return false;
}

/**
 * Get the link source for a property
 */
function getLinkSource(element, propertyPath) {
  const value = getPropertyValue(element, propertyPath);
  
  if (value?.themeSlot) {
    return {
      type: "themeColor",
      slotId: value.themeSlot,
      displayName: getSlotDisplayName(value.themeSlot)
    };
  }
  
  if (element.styleId && isTypographyProperty(propertyPath)) {
    return {
      type: "typographyStyle",
      styleId: element.styleId,
      displayName: getStyleDisplayName(element.styleId)
    };
  }
  
  return null;
}
```

### 10.3 CSS for Linked Indicator

```css
/* Linked property row */
.property-row.linked {
  border-left: 2px solid var(--color-accent);
  padding-left: calc(var(--spacing-sm) - 2px);
  background: linear-gradient(
    90deg,
    rgba(var(--color-accent-rgb), 0.08) 0%,
    transparent 100%
  );
  box-shadow: 
    inset 2px 0 8px rgba(var(--color-accent-rgb), 0.15),
    0 0 0 1px rgba(var(--color-accent-rgb), 0.1);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Linked slot name */
.property-row.linked .slot-name {
  font-weight: 600;
  color: var(--color-accent);
}

/* Resolved value (shown below slot name) */
.property-row.linked .resolved-value {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* Override indicator dot */
.property-input.overridden::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
}

/* Reset button (appears on override) */
.property-reset-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.property-input.overridden:hover + .property-reset-btn,
.property-reset-btn:focus {
  opacity: 1;
}
```

---

## 11. Accessibility

### 11.1 Screen Reader Announcements

| Event | Announcement |
|-------|--------------|
| Color linked | "Fill color set to Accent 1, linked to theme" |
| Color detached | "Fill color detached from theme, now using fixed value" |
| Style applied | "Text style set to Title" |
| Property overridden | "Font size overridden, no longer following Title style" |
| Reset to style | "Font size reset to Title style value" |
| Theme changed | "Theme Accent 1 changed to [color name]" |

### 11.2 Focus Management

- Linked indicators are focusable via keyboard
- Tab order: Swatch → Value → Link Indicator → Actions
- Enter on link indicator opens detach/info popover
- Escape closes popovers

### 11.3 Color Contrast

- Linked indicator border uses full accent color
- Glow effect is decorative (doesn't convey information alone)
- Slot name text meets WCAG AA contrast requirements
- Override indicators have sufficient contrast

---

## 12. Related Documents

- [Color Theme Manager Specification](./color-theme-manager.md)
- [Typography Style Manager Specification](./typography-style-manager.md)
- [Presentation Design UX Guide](./presentation-design-ux-guide.md)
- [Property Inspector: Fill](../property-inspector/property-inspector-fill.md)
- [Property Inspector: Typography](../property-inspector/property-inspector-typography.md)
- [App UI Design System](../app-ui-design-system/ui-design-system.md)
- [Master Slide System](../slides/slide-master-system.md)

---

## Appendix A: Terminology

| Term | Definition |
|------|------------|
| **Linked Property** | A property that derives its value from a design system slot |
| **Hardcoded Property** | A property with a fixed, explicit value |
| **Theme Slot** | A named position in the color theme (e.g., `accent1`) |
| **Typography Style** | A named text formatting preset (e.g., `title`) |
| **Override** | A local modification to an otherwise linked property |
| **Detachment** | Converting a linked property to a hardcoded value |
| **Propagation** | Updating all linked properties when the source changes |

---

## Appendix B: Quick Reference

### Indicator Summary

| Property State | Visual Indicator |
|----------------|------------------|
| Hardcoded | Default styling |
| Linked to theme color | Accent border + glow, slot name |
| Linked to typography style | Accent border + glow, style name |
| Style with overrides | Style name + asterisk |
| Overridden property | Dot indicator + reset button |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Color Theme Manager | `Ctrl+Shift+C` / `Cmd+Shift+C` |
| Open Typography Style Manager | `Ctrl+Shift+T` / `Cmd+Shift+T` |
| Detach selected property | `Ctrl+D` (when focused on linked property) |
| Reset override | `Ctrl+R` (when focused on overridden property) |

---

*Last Updated: January 2025*
*Version: 1.0*
*Status: Draft*
