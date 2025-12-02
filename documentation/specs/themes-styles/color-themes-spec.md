# Color themes
- The goal is to have interchangeable color themes. I pick any theme and the slide template works
    - How is this achieved?
        - For a color combinations to be fucntional, the contrast between the color is to be maintained.
        - Hues and saturation can be changed.
        - This means if I've a color palette, and I convert that color paletted into a B&W monochrome by using only the luma value of each swatch, the color theme will still be fucntional purely in terms of legibility.
    - A color theme has 12 swatches with fixed Luma values
        - The delta values between these Luma values are what is fixed. That means you can change the Luma value of any one swatch and offset the luma of all other swatches to keep the delta values fixed.
            - This should not lead to clipping pf the Luma values of the swatches at the end of the color theme.
        - The Luma values are not a uniform distribution of Lumas across the possible values of LUMA.
            - Luma values have 3 clusters, Highlights, mid-tones and shadows
            - This gives us the option to tweak the color theme like how we teak photos
                - Control contrast, brightness, highlights, shadows, whites, blacks, saturation
## Color theme selection and enforcement
Color theme is applied in the following heirarchy
- Master slide
    - Layout master slide
        - Individual slide
            - Individual object property

- This follows the idea of level of speceficity, the more specific color choice overrides the less specific choice
- In the fill and color picker panel
    - Only swatches from the current theme is shown. Indicate theme name also.
    - User cannot select other themese here.

## Color theme manager/editor panel
- 2 column layout
- We don't need 3 tabs "Presets, custom and AI", remove that structure
- List of presets are shown in the left column, these can't be deleted
- User can create new, duplicate etc.
- Right column shows detail of the colors in selected color thems
    - For each color the luma is locked
    - Only hue & saturation can be changed
    - UI
        - Swatch - standard number Input for changing hue & saturation, click and drag to change one.
    - Generate color theme
        - Generate button to randomly generate new hues and saturation for each swarch slot
        - Individual swatch slots can be locked to prevent the generate button from changing it
        - Drowdown select option to chose color model for "Generate"
            - Complementary, monochromatic, tetradic, split complementary, analogous etc...
    - Theme level adjustment controls (like photo editing controls)
        - Brightness, Contrast, Highlights, Shadows, Whites, Blacks, Saturation
        - These should all be slider controls
        - reset to default button.

- Preset themes can be edited but has to be saved as a new color theme
- Light/Dark mode is controlled at the **Master Slide level**, not in the Color Theme Manager
  - The same color theme works for both modes
  - Master Slide property inspector has a Light/Dark toggle
  - When toggled, the rendering pipeline interprets slot assignments differently (shadows ↔ highlights)

---

# Detailed UX Specification

## Core Concept: Luma-Locked Tonal System

**This is NOT a semantic color system.** There are no "background colors", "accent colors", or "text colors" in the theme definition. Instead:

### The 12-Slot Model
A color theme is a **tonal scale** of 12 color slots, each with:
- **Fixed Luma (L)** - The luminance value is locked and defines the slot's tonal position
- **Variable Hue (H)** - Can be freely changed
- **Variable Saturation (S)** - Can be freely changed

### Why Luma is Locked
The **delta between luma values** is what makes a theme functional:
- Slot 1 and Slot 12 always have sufficient contrast for text legibility
- Any slot pairing maintains its contrast ratio across themes
- Desaturate any theme to grayscale → it still works perfectly

### HSL for Intuitive User Control

HSL (Hue, Saturation, Luma) provides the most intuitive color model for user manipulation:
- **Hue (H):** The color wheel position (0-360°) - easy to understand as "the color"
- **Saturation (S):** Color intensity (0-100%) - from gray to vivid
- **Luma (L):** Perceived brightness (0-100%) - locked for contrast guarantees

**Technical Architecture for Color Storage:**

| Layer | Format | Purpose |
|-------|--------|---------|
| **User Editing** | HSL | Intuitive controls for H and S adjustment |
| **Internal State** | H, S values + fixed L | Minimal storage, luma computed from slot position |
| **Rendered Output** | Hex (#RRGGBB) | All HSL→Hex conversion done at Color Theme Manager |
| **CSS Variables** | Hex | Direct use in styles without runtime conversion |
| **Export/Import** | JSON with H, S, and slot metadata | Portable, human-readable |

**Conversion Flow:**
```
User Input (H, S) 
    ↓
Color Theme Manager applies fixed L for slot position
    ↓
HSL→Hex conversion
    ↓
Stored as Hex in state
    ↓
CSS variables updated (--theme-slot1 through --theme-slot12)
    ↓
Available throughout app (Slide Master, Fill Panel, etc.)
```

**Export/Import JSON Format:**
```json
{
  "name": "My Custom Theme",
  "id": "custom-theme-001",
  "version": "1.0",
  "slots": [
    { "h": 210, "s": 75, "role": "secondary1" },
    { "h": 220, "s": 80, "role": "primary" },
    { "h": 45, "s": 90, "role": "accent" },
    { "h": 180, "s": 60, "role": "secondary2" },
    // ... 12 slots total
  ],
  "adjustments": {
    "brightness": 0,
    "contrast": 0,
    "saturation": 0
  }
}
```

**Integration Points:**
- **Slide Master Templates:** Reference slots by index (1-12) for theme-linked colors
- **Master Slide Light/Dark Mode:** Toggle in property inspector inverts slot mapping for the presentation
- **Fill Panel:** Shows theme swatches, user selects slot not arbitrary color
- **Color Palette Panel:** Uses theme colors as base for extended palettes
- **Property Inspector:** Theme-linked fills show slot indicator

---

### The 4-Column × 3-Row Grid System

The 12 slots are organized in a **4×4 logical grid** with a header row defining color roles:

**4 Color Roles (Columns):**
| Role | Column | Purpose | Typical Usage |
|------|--------|---------|---------------|
| **Secondary 1** | 1 | Supporting variety | Borders, dividers, subtle backgrounds |
| **Primary** | 2 | Main brand/background | Slide backgrounds, primary fills |
| **Accent** | 3 | Highlight & emphasis | CTAs, icons, links, key elements |
| **Secondary 2** | 4 | Additional variety | Alternative accents, charts, tags |

**3 Tonal Clusters (Rows):**
| Cluster | Luma Range | Slots | Purpose |
|---------|------------|-------|---------|
| **Shadows** | L: 5-25% | 1-4 | Dark tones for dark themes or contrast |
| **Midtones** | L: 35-65% | 5-8 | Balanced tones for subtle elements |
| **Highlights** | L: 70-97% | 9-12 | Light tones for light themes or text |

**Grid Structure:**
```
                    COLOR ROLES (Columns inherit hue)
              ┌────────────┬────────┬────────┬────────────┐
              │SECONDARY 1 │PRIMARY │ ACCENT │SECONDARY 2 │
              │   (Col 1)  │(Col 2) │(Col 3) │  (Col 4)   │
              └────────────┴────────┴────────┴────────────┘
                    │           │        │          │
                    ▼           ▼        ▼          ▼
SHADOWS       ┌─────────┬─────────┬─────────┬─────────┐
(L: 5-25%)    │  Slot 1 │  Slot 2 │  Slot 3 │  Slot 4 │
              │  L: 5%  │  L: 10% │  L: 18% │  L: 25% │
              └─────────┴─────────┴─────────┴─────────┘

MIDTONES      ┌─────────┬─────────┬─────────┬─────────┐
(L: 35-65%)   │  Slot 5 │  Slot 6 │  Slot 7 │  Slot 8 │
              │  L: 35% │  L: 45% │  L: 55% │  L: 65% │
              └─────────┴─────────┴─────────┴─────────┘

HIGHLIGHTS    ┌─────────┬─────────┬─────────┬─────────┐
(L: 70-97%)   │  Slot 9 │ Slot 10 │ Slot 11 │ Slot 12 │
              │  L: 70% │  L: 80% │  L: 90% │  L: 97% │
              └─────────┴─────────┴─────────┴─────────┘
```

**Column-Based Hue Inheritance:**
Each column shares the same hue, creating visual coherence:
- **Column 1 (Secondary 1):** All slots (1, 5, 9) share Hue A
- **Column 2 (Primary):** All slots (2, 6, 10) share Hue B
- **Column 3 (Accent):** All slots (3, 7, 11) share Hue C
- **Column 4 (Secondary 2):** All slots (4, 8, 12) share Hue D

**Contrast Pairing Rules:**
To ensure legibility, always pair colors from different rows:

| Dark Theme | Light Theme |
|------------|-------------|
| Background: Shadows (1-4) | Background: Highlights (9-12) |
| Text: Highlights (9-12) | Text: Shadows (1-4) |
| Accents: Midtones or Highlights | Accents: Midtones or Shadows |

**Example - Dark Theme Pairing:**
```
┌──────────────────────────────────────────────────┐
│  Background: Slot 2 (Primary, L: 10%)            │
│  ┌──────────────────────────────────────────┐    │
│  │  Heading: Slot 10 (Primary, L: 80%)      │    │
│  │  Body text: Slot 12 (Secondary 2, L: 97%)│    │
│  │  Accent button: Slot 11 (Accent, L: 90%) │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
Contrast ratio between L:10% and L:80% ≈ 8:1 ✓
```

**Example - Light Theme Pairing:**
```
┌──────────────────────────────────────────────────┐
│  Background: Slot 10 (Primary, L: 80%)           │
│  ┌──────────────────────────────────────────┐    │
│  │  Heading: Slot 2 (Primary, L: 10%)       │    │
│  │  Body text: Slot 1 (Secondary 1, L: 5%)  │    │
│  │  Accent button: Slot 3 (Accent, L: 18%)  │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
Contrast ratio between L:80% and L:10% ≈ 8:1 ✓
```

### Interchangeability Guarantee
Because luma relationships are fixed:
1. Pick ANY preset or custom theme
2. Apply to ANY template
3. Template remains legible and functional
4. Only the "feel" (hue/saturation) changes, not the structure

---

## Design System Compliance

This specification strictly adheres to the Story Design System tokens defined in `variables.css`:
- All colors use CSS variables (e.g., `--color-bg-panel`, `--color-text-primary`)
- All spacing uses spacing tokens (e.g., `--spacing-2`, `--spacing-4`)
- All typography uses font tokens (e.g., `--font-size-sm`, `--font-weight-medium`)
- All radii use radius tokens (e.g., `--radius-sm`, `--radius-md`)
- All shadows use shadow tokens (e.g., `--shadow-md`, `--shadow-floating`)
- Reuses existing components: `DraggablePanel`, `NumberInput`, `Switch`, `Dropdown`, `IconButton`, `Section`

---

## 1. Panel Layout & Dimensions

### Container: `DraggablePanel`
Extends the existing `DraggablePanel` component with custom dimensions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ●○ Color Theme Manager                                          [−] [×]    │ <- Header
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐   ┌───────────────────────────────────────┐   │
│  │                         │   │                                       │   │
│  │    LEFT COLUMN          │   │         RIGHT COLUMN                  │   │
│  │    (Theme List)         │   │         (Theme Editor)                │   │
│  │                         │   │                                       │   │
│  │    Width: 160px         │   │         Flex: 1                       │   │
│  │                         │   │                                       │   │
│  │                         │   │                                       │   │
│  │                         │   │                                       │   │
│  └─────────────────────────┘   └───────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Panel Dimensions:**
| Property | Value | Token |
|----------|-------|-------|
| Default Width | 520px | Custom |
| Default Height | 580px | Custom |
| Min Width | 480px | Custom |
| Min Height | 400px | Custom |
| Max Width | 720px | Custom |
| Max Height | 900px | Custom |
| Border Radius | 8px | `--radius-lg` |
| Shadow | floating | `--shadow-floating` |
| Background | panel | `--color-bg-panel` |

**Column Widths:**
| Column | Width | Gap |
|--------|-------|-----|
| Left (Theme List) | 160px fixed | `--spacing-3` (12px) |
| Right (Theme Editor) | flex: 1 | — |
| Divider | 1px | `--color-border-subtle` |

---

## 2. Header Bar

Inherits from `DraggablePanel` header styling.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ●○  Color Theme Manager                                      [−] [×]     │
└──────────────────────────────────────────────────────────────────────────┘
     │         │                                                    │   │
     │         └─ Title: --font-size-md, --font-weight-medium       │   │
     │                   --color-text-primary                       │   │
     │                                                              │   │
     └─ Drag indicator dots (decorative)                            │   │
                                                                    │   │
                                        Minimize ─────────────────────   │
                                        Close ───────────────────────────
```

**Header Tokens:**
| Element | Token |
|---------|-------|
| Height | `--control-size-xl` (40px) |
| Background | `--color-bg-elevated` |
| Title font | `--font-size-md`, `--font-weight-medium` |
| Title color | `--color-text-primary` |
| Button size | `--control-size-sm` (24px) |
| Button hover | `--color-bg-hover` |

---

## 3. Left Column: Theme List

### 3.1 Column Header

```
┌─────────────────────────┐
│  Themes         [+] [⋮] │ <- Column header with actions
├─────────────────────────┤
```

**Actions:**
- **[+] New Theme** - Creates new custom theme (duplicate of selected)
- **[⋮] More** - Context menu with: Import, Export

**Theme Actions (Right-click Context Menu on Custom Themes):**
| Action | Shortcut | Behavior |
|--------|----------|----------|
| Rename | `F2` | Inline edit theme name |
| Duplicate | `Ctrl/Cmd + D` | Create copy with " Copy" suffix |
| Save | `Ctrl/Cmd + S` | Save current changes (clears dirty state) |
| Delete | `Delete` | Confirm dialog, then remove theme |
| Export | — | Download as .json file |

**Theme Actions (Right-click Context Menu on Preset Themes):**
| Action | Behavior |
|--------|----------|
| Duplicate to Custom | Create editable copy in Custom section |
| Export | Download as .json file |

*Note: Presets cannot be renamed, saved, or deleted.*

**Header Tokens:**
| Element | Token |
|---------|-------|
| Padding | `--spacing-2` vertical, `--spacing-3` horizontal |
| Font | `--font-size-sm`, `--font-weight-semibold` |
| Color | `--color-text-secondary` |
| Icon buttons | `IconButton` component, `--icon-size-sm` |

### 3.2 Theme List Items

Two sections: **Presets** (read-only) and **Custom** (user-created).

```
┌─────────────────────────┐
│  ▾ Presets              │ <- Collapsible section header
├─────────────────────────┤
│  ┌───┐ Default Dark  🔒 │ <- Selected item
│  └───┘                  │
│  ┌───┐ Default Light    │
│  └───┘                  │
│  ┌───┐ Ocean            │
│  └───┘                  │
│  ┌───┐ Forest           │
│  └───┘                  │
│  ┌───┐ Sunset           │
│  └───┘                  │
├─────────────────────────┤
│  ▾ Custom               │
├─────────────────────────┤
│  ┌───┐ My Theme 1       │
│  └───┘                  │
│  ┌───┐ Brand Colors     │
│  └───┘                  │
└─────────────────────────┘
```

**Theme List Item Structure:**
```
┌─────────────────────────────────────┐
│ ┌─────┐                             │
│ │░░░░░│  Theme Name           [🔒]  │  <- 🔒 = Lock icon for presets
│ │░░░░░│                             │
│ └─────┘                             │
└─────────────────────────────────────┘
  │                │              │
  │                │              └─ Lock indicator (presets only)
  │                └─ Name: --font-size-sm, truncate with ellipsis
  └─ Mini swatch preview (6 colors in 2×3 grid)
```

**Mini Swatch Preview:**
| Property | Value | Token |
|----------|-------|-------|
| Size | 36px × 24px | Custom |
| Grid | 2 rows × 6 cols | — |
| Individual swatch | 6px × 12px | — |
| Border radius | 2px | `--radius-xs` |
| Gap | 0px (seamless gradient look) | — |
| Colors shown | All 12 slots in luma order (dark to light) | — |

The preview shows the full tonal range as a mini gradient strip:

**List Item Tokens:**
| Element | Token |
|---------|-------|
| Height | 40px | 
| Padding | `--spacing-2` |
| Gap (between swatch and name) | `--spacing-2` |
| Background (default) | transparent |
| Background (hover) | `--color-bg-hover` |
| Background (selected) | `--color-interactive-selected` |
| Border radius | `--radius-sm` |
| Name font | `--font-size-sm` |
| Name color | `--color-text-primary` |
| Lock icon color | `--color-text-tertiary` |

**Interactions:**
| Action | Behavior |
|--------|----------|
| Click | Select theme, load into editor |
| Right-click | Context menu (Duplicate, Delete*, Rename*) |
| Drag | Reorder custom themes only |

*Delete and Rename only for custom themes

---

## 4. Right Column: Theme Editor

### 4.1 Theme Name Header

```
┌────────────────────────────────────────────┐
│  Default Dark                              │
├────────────────────────────────────────────┤
```

**If preset is selected:**
- Name shown as read-only text
- Editing any value triggers "Save as New Theme" modal

**If custom theme is selected:**
- Name is editable inline (double-click or click pencil icon)

**Note:** There is no invert/flip button in the Color Theme Manager. Light/Dark mode is controlled at the Master Slide level, allowing the same theme to be used in both modes.

**Header Tokens:**
| Element | Token |
|---------|-------|
| Padding | `--spacing-3` |
| Font | `--font-size-lg`, `--font-weight-semibold` |
| Color | `--color-text-primary` |

---

### 4.2 The 12-Slot Tonal System (4×3 Grid)

**Core Concept:** A color theme is a **4-column × 3-row grid** where:
- **Columns** define color roles (Secondary 1, Primary, Accent, Secondary 2)
- **Rows** define tonal clusters (Shadows, Midtones, Highlights)
- **Luma is fixed** per slot - only H and S can be edited
- **Columns share hue** - all slots in a column have the same hue

**Why This Works:**
- If you desaturate any theme to grayscale (luma only), it remains fully functional
- Swapping themes maintains readability because contrast is preserved
- Pairing slots from different rows guarantees sufficient contrast
- Column hue consistency creates visual harmony

**The 4×3 Grid Layout:**

```
┌────────────────────────────────────────────────────────────────────────┐
│  Color Palette                                                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│           SECONDARY 1    PRIMARY      ACCENT     SECONDARY 2           │
│               ▼            ▼           ▼            ▼                  │
│                                                                        │
│  SHADOWS    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  (L: 5-25%) │   1    │ │   2    │ │   3    │ │   4    │                │
│             │  5%    │ │  10%   │ │  18%   │ │  25%   │                │
│             └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                        │
│  MIDTONES   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  (L: 35-65%)│   5    │ │   6    │ │   7    │ │   8    │                │
│             │  35%   │ │  45%   │ │  55%   │ │  65%   │                │
│             └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                        │
│  HIGHLIGHTS ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│  (L: 70-97%)│   9    │ │  10    │ │  11    │ │  12    │                │
│             │  70%   │ │  80%   │ │  90%   │ │  97%   │                │
│             └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Slot Index to Role Mapping:**

| Slot | Column | Role | Row | Luma |
|------|--------|------|-----|------|
| 1 | 1 | Secondary 1 | Shadows | 5% |
| 2 | 2 | Primary | Shadows | 10% |
| 3 | 3 | Accent | Shadows | 18% |
| 4 | 4 | Secondary 2 | Shadows | 25% |
| 5 | 1 | Secondary 1 | Midtones | 35% |
| 6 | 2 | Primary | Midtones | 45% |
| 7 | 3 | Accent | Midtones | 55% |
| 8 | 4 | Secondary 2 | Midtones | 65% |
| 9 | 1 | Secondary 1 | Highlights | 70% |
| 10 | 2 | Primary | Highlights | 80% |
| 11 | 3 | Accent | Highlights | 90% |
| 12 | 4 | Secondary 2 | Highlights | 97% |

**Column Header Row (Editable Swatches):**
Above the grid, display the 4 column header swatches. **These are the ONLY editable elements:**

```
┌───────────────────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  <- Clickable│
│  │Secondary1│ │ Primary  │ │  Accent  │ │Secondary2│     swatches │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   (L: 60%)   │
├───────────────────────────────────────────────────────────────────┤
│  [Grid of 12 read-only swatches showing colors at fixed luma]     │
└───────────────────────────────────────────────────────────────────┘
```

**Header Swatch Behavior:**
| Action | Result |
|--------|--------|
| Click | Opens Color Picker with luma locked at 60% |
| Hover | Shows pointer cursor, subtle highlight |
| Tooltip | "{Role}: Click to edit hue & saturation" |

**Header Row Tokens:**
| Element | Token |
|---------|-------|
| Header cell width | Same as swatch width |
| Swatch size | 32px × 32px |
| Role label | `--font-size-xs`, `--font-weight-semibold`, `--color-text-secondary` |
| Header background | `--color-bg-elevated` |
| Header padding | `--spacing-1` |
| Swatch border | 1px `--color-border` |
| Swatch hover border | 2px `--color-border-focus` |

**Luma Inside Grid Swatches (Read-Only):**
Each swatch in the 3×4 grid displays its luma value directly inside the color:
- White text for dark slots (L < 50%)
- Black text for light slots (L >= 50%)
- Text shadow for better legibility
- **Not clickable** - display only

**Cluster Tokens:**
| Element | Token |
|---------|-------|
| Cluster container | flex column with `--spacing-2` gap |
| Cluster label | `--font-size-xs`, uppercase, `--color-text-tertiary` |
| Slot grid | 4 columns, `--spacing-1` gap |

**Luma Distribution Table:**

| Cluster | Slot | Luma | Typical Use in Dark Theme | Typical Use in Light Theme |
|---------|------|------|---------------------------|----------------------------|
| **Shadows** | 1 | 5% | Primary background | Primary text |
| | 2 | 10% | Secondary background | Heading text |
| | 3 | 18% | Card/elevated surface | Body text |
| | 4 | 25% | Border, divider | Caption text |
| **Midtones** | 5 | 35% | Muted text | Muted accent |
| | 6 | 45% | Disabled state | Disabled state |
| | 7 | 55% | Placeholder text | Placeholder text |
| | 8 | 65% | Secondary accent | Secondary accent |
| **Highlights** | 9 | 70% | Tertiary text | Border, divider |
| | 10 | 80% | Body text | Card background |
| | 11 | 90% | Heading text | Secondary background |
| | 12 | 97% | Primary text, CTAs | Primary background |

**Column Color Editing (Header Row Only):**

Color editing is done at the **column level only**. Clicking on a column header swatch opens the Color Picker:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Editing: Primary Column                                               │
├────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐               │
│  │                                                     │               │
│  │              COLOR PICKER                           │               │
│  │         (Hue & Saturation only)                     │               │
│  │                                                     │               │
│  │    ┌───────────────────────────────┐                │               │
│  │    │                               │                │               │
│  │    │      Saturation/Hue Square    │                │               │
│  │    │                               │                │               │
│  │    │   ─────────────────────────── │ ← L: 60% line  │               │
│  │    │                               │                │               │
│  │    └───────────────────────────────┘                │               │
│  │                                                     │               │
│  │    [══════════●══════════════════]  Hue Slider      │               │
│  │                                                     │               │
│  └─────────────────────────────────────────────────────┘               │
│                                                                        │
│  Column: Primary                                                       │
│  H: [210°]    S: [75%]    L: 60% (locked) 🔒                           │
│  Preview: Slot 2 (10%), Slot 6 (45%), Slot 10 (80%)                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

**Color Picker Behavior for Column Headers:**
| Feature | Behavior |
|---------|----------|
| **Hue slider** | Full 0-360° range, updates ALL slots in column |
| **Saturation** | Full 0-100% range via picker square X-axis |
| **Luma (Lightness)** | **LOCKED at 60%** - Y-axis shows line but is disabled |
| **Visual indicator** | Horizontal line at 60% luma position |
| **Real-time preview** | All 3 slots in column update as user drags |
| **Column preview** | Shows mini swatches of all 3 luma variants |

**Why Luma is Locked at 60%:**
- 60% is a neutral midtone that shows the hue/saturation clearly
- The actual luma values for each slot are fixed (5%, 10%, 18%, etc.)
- This picker is for choosing the color, not the brightness
- Adjustments section handles global brightness/contrast changes

**Individual Swatches (Read-Only):**
The 12 swatches in the 3×4 grid are **read-only display**:
- Show the computed color at their fixed luma
- Tooltip shows: "Slot {N}: H:{h}° S:{s}% L:{l}%"
- Click does nothing (no editing)
- Visual indication of the column's hue applied at different luma levels

**Column Header Swatch:**
| Element | Token |
|---------|-------|
| Size | 32px × 32px |
| Border radius | `--radius-sm` |
| Border | 1px `--color-border` |
| Hover | 2px `--color-border-focus` |
| Cursor | pointer |
| Displayed at | L: 60% (midtone preview) |

**Color Picker Tokens:**
| Element | Token |
|---------|-------|
| Color picker | Existing `ColorPicker` component with luma lock mode |
| Luma lock line | 2px solid `--color-text-tertiary` at 60% Y position |
| Column preview swatches | 24px × 24px each, showing L: 10%, 45%, 80% |

**Column Hue Editing:**
Editing the hue in the header row updates ALL slots in that column:

```javascript
// When user changes Primary column hue from 220° to 180°
updateColumnHue(column: 2, newHue: 180, newSat: 75)
  → Slot 2 (Shadows): H = 180°, S = 75%
  → Slot 6 (Midtones): H = 180°, S = 75%
  → Slot 10 (Highlights): H = 180°, S = 75%
```

**No Individual Slot Override:**
All slots in a column share the same hue and saturation. There is no way to break column inheritance—this simplifies the mental model and ensures color harmony.

**Luma Offset Behavior:**
When adjusting Brightness (global offset):
- ALL slot luma values shift by the same delta
- Clipping prevention: if any slot would exceed 0-100%, the adjustment is limited
- Visual indicator shows when clipping would occur

**Example - Brightness +10:**
```
Before:  5%  10%  18%  25%  35%  45%  55%  65%  70%  80%  90%  97%
After:  15%  20%  28%  35%  45%  55%  65%  75%  80%  90% 100% 100%  ← Clipped!
                                                          ▲    ▲
                                                     Would be 100% and 107%
```

**Swatch Preview:**
| Property | Value | Token |
|----------|-------|-------|
| Size (grid) | 40px × 40px | `--swatch-size-2xl` |
| Size (selected detail) | 48px × 48px | Custom |
| Border radius | 4px | `--radius-sm` |
| Border (normal) | 1px | `--color-border` |
| Border (clipped) | 2px solid | `--color-danger` |
| Slot number | Centered, `--font-size-xs` |
| Click action | **None (read-only)** - displays computed color only |
| Cursor | default (not pointer) |

**Clipped Swatch Indicator:**
When an adjustment causes a slot's luma to clip (hit 0% or 100%):

```
┌──────┐          ┌──────┐
│      │  Normal  │██████│  Clipped (L: 100%)
│  5   │          │  12  │  ← Red border
└──────┘          └──────┘
                  2px --color-danger border
```

| State | Border | Tooltip |
|-------|--------|--------|
| Normal | 1px `--color-border` | — |
| Clipped (L ≤ 0%) | 2px `--color-danger` | "Clipped at black (0%)" |
| Clipped (L ≥ 100%) | 2px `--color-danger` | "Clipped at white (100%)" |

**Input Fields (H and S):**
Uses existing `NumberInput` component with scrubbable labels.

| Property | Hue | Saturation |
|----------|-----|------------|
| Label | "H:" | "S:" |
| Min | 0 | 0 |
| Max | 360 | 100 |
| Step | 1 | 1 |
| Units | ° | % |
| Width | 56px | 56px |
| Scrubbable | Yes | Yes |

**Luma Display (Read-only):**
| Property | Value | Token |
|----------|-------|-------|
| Format | "L: XX%" | — |
| Font | `--font-size-sm`, `--font-weight-medium` |
| Color | `--color-text-tertiary` |
| Background | `--color-bg-input` |
| Padding | `--spacing-1` `--spacing-2` |
| Border radius | `--radius-sm` |

**Lock Toggle:**
Uses existing `IconButton` component.

| State | Icon | Color | Tooltip |
|-------|------|-------|---------|
| Unlocked | 🔓 | `--color-text-tertiary` | "Lock to prevent Generate from changing" |
| Locked | 🔒 | `--color-accent` | "Locked - Generate will skip this slot" |

---

### 4.3 Generate Section

```
┌────────────────────────────────────────────────────────────────┐
│  Generate                                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Color Harmony:  [ Complementary        ▾ ]                    │
│                                                                │
│  ☑ Hues   ☐ Adjustments   [    ✨ Generate    ]                │
│                                                                │
│  Note: Locked slots will not be affected                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Generate Options Checkboxes:**
The generate row contains checkboxes to control what gets randomized:

| Option | Default | Effect |
|--------|---------|--------|
| **Hues** | ✓ Checked | Randomizes the 4 column hues based on color harmony |
| **Adjustments** | ☐ Unchecked | Randomizes adjustment values (brightness, contrast, etc.) |

Both can be checked for full randomization, or either one for partial generation.

**Adjustments Generation:**
When "Adjustments" is checked, the generate function creates random adjustment values that respect perceptual thresholds:

| Control | Range | Constraint |
|---------|-------|-----------|
| Brightness | -30 to +30 | Limited to prevent luma clipping |
| Contrast | -20 to +20 | — |
| Highlights | -40 to +40 | — |
| Shadows | -40 to +40 | — |
| Saturation | -30 to +30 | — |

**MIN_PERCEPTIBLE_LUMA_DELTA (JND = 2%):**
The Just Noticeable Difference for human luminance perception is ~2%. This constant is used to:
- Ensure generated adjustments don't push luma values too close together
- Prevent clipping at black (0%) or white (100%)
- Maintain perceptible contrast between adjacent slots

**Color Harmony Dropdown:**
Uses existing `Dropdown` component.

| Option | Description |
|--------|-------------|
| Complementary | Two colors opposite on wheel |
| Monochromatic | Single hue, varying saturation |
| Analogous | Adjacent colors on wheel |
| Triadic | Three evenly spaced colors |
| Split Complementary | Base + two adjacent to complement |
| Tetradic | Four colors in rectangle pattern |
| Square | Four evenly spaced colors |

**Color Generation Algorithm (4-Column System):**

The generate function creates **4 hues** based on the selected harmony and assigns them to the **4 color role columns**:

| Column | Role | Hue Assignment |
|--------|------|----------------|
| 1 | Secondary 1 | Hue A (supporting) |
| 2 | Primary | Hue B (dominant) |
| 3 | Accent | Hue C (highlight) |
| 4 | Secondary 2 | Hue D (variety) |

**Harmony → 4-Hue Generation:**

| Harmony | Secondary 1 | Primary | Accent | Secondary 2 |
|---------|-------------|---------|--------|-------------|
| Complementary | Base | Base | Base+180° | Base+180° |
| Monochromatic | Base | Base | Base | Base |
| Analogous | Base-30° | Base | Base+30° | Base+15° |
| Triadic | Base | Base+120° | Base+240° | Base |
| Split Comp. | Base | Base | Base+150° | Base+210° |
| Tetradic | Base | Base+90° | Base+180° | Base+270° |
| Square | Base | Base+90° | Base+180° | Base+270° |

**Saturation Distribution:**
Each role gets characteristic saturation:

| Role | Saturation Range | Reasoning |
|------|------------------|-----------|
| Primary | 60-80% | Balanced, professional |
| Accent | 75-95% | Vibrant, attention-grabbing |
| Secondary 1 | 40-65% | Subtle, supporting |
| Secondary 2 | 50-70% | Moderate variety |

**Generation Flow:**
```javascript
function generateTheme(harmony) {
  // 1. Pick random base hue
  const baseHue = Math.random() * 360;
  
  // 2. Calculate 4 hues based on harmony
  const hues = calculateHarmonyHues(baseHue, harmony);
  
  // 3. Assign to columns with characteristic saturations
  const columnHues = {
    secondary1: { h: hues[0], s: random(40, 65) },
    primary:    { h: hues[1], s: random(60, 80) },
    accent:     { h: hues[2], s: random(75, 95) },
    secondary2: { h: hues[3], s: random(50, 70) }
  };
  
  // 4. Apply column hues to all 12 slots (each column shares hue)
  slots[1, 5, 9].forEach(s => s.h = columnHues.secondary1.h);  // Column 1
  slots[2, 6, 10].forEach(s => s.h = columnHues.primary.h);    // Column 2
  slots[3, 7, 11].forEach(s => s.h = columnHues.accent.h);     // Column 3
  slots[4, 8, 12].forEach(s => s.h = columnHues.secondary2.h); // Column 4
  
  // 5. Skip locked slots
  lockedSlots.forEach(slot => revert(slot));
}
```

**Why 4 Columns Work:**
- **Primary (Col 2):** The dominant color for backgrounds and main elements
- **Accent (Col 3):** High-saturation highlight for CTAs and emphasis
- **Secondary 1 & 2 (Col 1 & 4):** Provide variety without competing with Primary/Accent
- Together they cover all UI needs while maintaining harmony

**Checkbox Row Tokens:**
| Element | Token |
|---------|-------|
| Container | flex row, `--spacing-3` gap |
| Checkbox | 14px × 14px, accent-color: `--color-accent` |
| Label | `--font-size-sm`, `--color-text-secondary` |
| Label (hover) | `--color-text-primary` |

**Generate Button:**
| Property | Value | Token |
|----------|-------|-------|
| Width | auto (fits content) | — |
| Height | 32px | `--control-size-lg` |
| Background | `--color-accent` | |
| Text | `--color-text-on-accent` | |
| Border radius | 4px | `--radius-sm` |
| Hover | `--color-accent-hover` | |
| Active | `--color-accent-active` | |
| Icon | ✨ sparkle | `--icon-size-sm` |

**Note Text:**
| Property | Value | Token |
|----------|-------|-------|
| Font | `--font-size-xs` | |
| Color | `--color-text-tertiary` | |
| Style | Italic | |

---

### 4.5 Theme Adjustments Section

Photo-editing style controls that affect all colors proportionally. These work like image adjustment tools - they transform the palette while **preserving the luma delta relationships** between slots.

**How Adjustments Work:**

| Control | Effect on Palette |
|---------|-------------------|
| **Brightness** | Shifts ALL luma values by same offset (preserves deltas) |
| **Contrast** | Expands/compresses luma range from midpoint (stretches deltas) |
| **Highlights** | Adjusts luma values in highlight cluster (slots 9-12) |
| **Shadows** | Adjusts luma values in shadow cluster (slots 1-4) |
| **Whites** | Shifts the maximum luma ceiling |
| **Blacks** | Shifts the minimum luma floor |
| **Saturation** | Scales all saturation values proportionally |

**Clipping Prevention:**
- When an adjustment would push any luma outside 0-100%, the control limits automatically
- Visual indicator (orange tint on track) shows when clipping would occur
- Tooltip shows "Limited to prevent clipping"

```
┌────────────────────────────────────────────────────────────────┐
│  Adjustments                                         [↺ Reset] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Brightness    ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Contrast      ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Highlights    ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Shadows       ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Whites        ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Blacks        ├────────────●────────────┤    [  0 ]           │
│                                                                │
│  Saturation    ├────────────●────────────┤    [  0 ]           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Slider Row Structure:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Label          ├─────────────●─────────────┤         [ value ]      │
└──────────────────────────────────────────────────────────────────────┘
     │                      │                               │
     │                      │                               └─ NumberInput (scrubbable)
     │                      └─ Slider track with thumb
     └─ Scrubbable label
```

**Adjustment Parameters:**
| Control | Range | Default | Unit |
|---------|-------|---------|------|
| Brightness | -100 to +100 | 0 | — |
| Contrast | -100 to +100 | 0 | — |
| Highlights | -100 to +100 | 0 | — |
| Shadows | -100 to +100 | 0 | — |
| Whites | -100 to +100 | 0 | — |
| Blacks | -100 to +100 | 0 | — |
| Saturation | -100 to +100 | 0 | — |

**SliderControl Component (Standard Component):**

This is a reusable standard component used throughout the application.

| Property | Value | Token |
|----------|-------|-------|
| Track height | 4px | — |
| Track background | `--color-bg-input` | |
| Track filled | `--color-accent` | |
| Track radius | `--radius-full` | |
| Thumb size | 12px | — |
| Thumb background | `--color-text-primary` | |
| Thumb hover | Scale 1.2× | — |
| Thumb active | `--color-accent` | |
| Label width | 80px | — |
| Label font | `--font-size-sm` | |
| Label color | `--color-text-secondary` | |
| Input width | 48px | — |
| Row gap | `--spacing-2` | |
| Row height | 28px | — |

**SliderControl Interactions:**
| Action | Behavior |
|--------|----------|
| Drag thumb | Updates value in real-time |
| Click track | Jumps thumb to click position |
| **Double-click thumb** | **Resets to center/default value** |
| Scrub label | Drag label text to adjust value |
| Arrow keys (focused) | Increment/decrement by step |

**Double-Click Reset:**
- Double-clicking the slider thumb resets it to its default value (typically 0 or center)
- Brief animation shows the thumb snapping back to center
- Works on all `SliderControl` instances throughout the app

```javascript
// SliderControl usage
<SliderControl
    label="Brightness"
    value={brightness}
    min={-100}
    max={100}
    defaultValue={0}  // Reset target for double-click
    onChange={setBrightness}
/>
```

**Reset All Button:**
Uses `IconButton` with ↺ (rotate) icon.
- Tooltip: "Reset all adjustments"
- Resets all sliders to their default values (0)

---

## 5. Scrolling Behavior

| Area | Behavior |
|------|----------|
| Left Column (Theme List) | Scrolls independently, custom scrollbar |
| Right Column (Theme Editor) | Scrolls independently, custom scrollbar |
| Panel | Fixed size, columns scroll within |

**Scrollbar Styling:**
| Property | Value | Token |
|----------|-------|-------|
| Width | 6px | — |
| Track | transparent | — |
| Thumb | `--color-text-tertiary` with 0.5 opacity | |
| Thumb hover | `--color-text-secondary` | |
| Border radius | `--radius-full` | |

---

## 6. State Management

### 6.1 Editing Preset Themes

When a preset theme is selected and user makes ANY change:

1. Show toast notification: "Editing a preset creates a copy"
2. Automatically duplicate theme with name: "{Original Name} Copy"
3. Move new theme to Custom section
4. Select the new theme
5. Apply the pending change

### 6.2 Unsaved Changes

Track dirty state for custom themes.

| Indicator | Location | Visual |
|-----------|----------|--------|
| Dot indicator | Next to theme name in list | Small `--color-accent` dot |
| Save prompt | On panel close | Modal dialog |

**Save Prompt Modal:**
```
┌───────────────────────────────────────────────┐
│  Unsaved Changes                              │
├───────────────────────────────────────────────┤
│                                               │
│  "My Theme" has unsaved changes.              │
│  Do you want to save before closing?          │
│                                               │
│           [Don't Save]  [Cancel]  [Save]      │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate theme list |
| `Enter` | Select highlighted theme |
| `Ctrl/Cmd + N` | New theme |
| `Ctrl/Cmd + D` | Duplicate selected theme |
| `Ctrl/Cmd + S` | Save current theme |
| `F2` | Rename selected custom theme |
| `Delete` | Delete selected custom theme |
| `Ctrl/Cmd + Z` | Undo last change |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Escape` | Close panel |
| `Tab` | Move focus through inputs |

---

## 8. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus visible | 2px `--color-border-focus` ring |
| Color contrast | All text meets WCAG AA (4.5:1 minimum) |
| Screen reader | ARIA labels on all controls |
| Keyboard nav | Full keyboard accessibility |
| Reduced motion | Respect `prefers-reduced-motion` |

**ARIA Labels:**
| Element | Label |
|---------|-------|
| Theme list | "Color themes list" |
| Theme item | "{name} color theme" |
| Preset lock | "Preset theme, read only" |
| Slot swatch | "Color slot {number}" |
| Hue input | "Hue for slot {number}" |
| Saturation input | "Saturation for slot {number}" |
| Luma display | "Luminance {value} percent, read only" |
| Lock toggle | "Lock slot {number} from generation" |
| Generate button | "Generate random color harmony" |
| Slider | "{adjustment name} adjustment" |

---

## 9. Responsive Behavior

**Minimum Panel Size (480px width):**
- Left column: 140px
- Divider: 1px  
- Right column: fills remaining (339px)
- Inputs stack if needed

**Maximum Panel Size (720px width):**
- Left column: 180px (slightly wider)
- Right column: fills remaining
- More breathing room in editor

---

## 10. Animation & Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Panel open/close | opacity, transform | 150ms | `--ease-out` |
| Theme selection | background-color | 100ms | `--ease-out` |
| Hover states | all | 100ms | `--ease-out` |
| Slider thumb | transform | 100ms | `--ease-out` |
| Section collapse | height | 200ms | `--ease-in-out` |
| Color preview | background-color | 50ms | `--ease-out` |

---

## 11. Component Reuse Summary

This design reuses these existing components:
| Component | Usage |
|-----------|-------|
| `DraggablePanel` | Base container with drag/resize |
| `Section` | Collapsible section headers |
| `NumberInput` | H, S inputs and adjustment values |
| `Dropdown` | Color harmony selector |
| `IconButton` | All icon actions |
| `Switch` | Lock toggles (optional, could use IconButton) |
| `TextInput` | Theme name editing |
| `ColorPicker` | Hue/saturation picker for slot editing (luma locked) |

New components needed:
| Component | Purpose |
|-----------|---------|
| `SliderControl` | **Standard component:** Horizontal slider with label, value input, and double-click reset |
| `ThemeListItem` | Theme preview card for left column |
| `ColumnHeaderSwatch` | Clickable column header swatch that opens ColorPicker with luma locked at 60% |

---

## 12. CSS Class Naming Convention

Following BEM methodology with `ctm-` (Color Theme Manager) prefix:

```css
/* Block */
.ctm { }

/* Layout */
.ctm__columns { }
.ctm__left-column { }
.ctm__right-column { }
.ctm__divider { }

/* Theme List */
.ctm__theme-list { }
.ctm__theme-item { }
.ctm__theme-item--selected { }
.ctm__theme-item--preset { }
.ctm__theme-preview { }
.ctm__theme-name { }
.ctm__theme-lock { }

/* Editor */
.ctm__editor { }
.ctm__editor-header { }
.ctm__section { }
.ctm__section-title { }

/* Color Slot */
.ctm__slot { }
.ctm__slot-swatch { }
.ctm__slot-swatch--clipped { }  /* Red border for clipped luma */
.ctm__slot-label { }
.ctm__slot-inputs { }
.ctm__slot-luma { }
.ctm__slot-lock { }

/* Generate */
.ctm__generate { }
.ctm__generate-dropdown { }
.ctm__generate-button { }
.ctm__generate-note { }

/* Image Drop Zone */
.ctm__dropzone { }
.ctm__dropzone--dragover { }
.ctm__dropzone--processing { }
.ctm__dropzone--error { }
.ctm__dropzone-icon { }
.ctm__dropzone-text { }
.ctm__dropzone-formats { }

/* Adjustments */
.ctm__adjustments { }
.ctm__slider-row { }
.ctm__slider-label { }
.ctm__slider-track { }
.ctm__slider-thumb { }
.ctm__slider-value { }

/* Footer Actions */
.ctm__footer { }
.ctm__footer-left { }
.ctm__footer-right { }
.ctm__footer-save-button { }
.ctm__footer-action-button { }
.ctm__footer-delete-button { }
```

---

## 13. Dark/Light Mode Support

All colors defined via CSS variables automatically support both modes as defined in `variables.css`. No hardcoded colors are used.

**Theme Preview Swatches:**
- Background uses checkered pattern for transparency indication
- Border provides visibility on both light/dark UI backgrounds

---

## 14. Error States

| Scenario | Handling |
|----------|----------|
| Invalid H/S value | Clamp to valid range, show brief shake animation |
| Clipped luma values | Red border on affected swatches, tooltip explains |
| Delete last custom theme | Disable delete button when only 1 remains |
| Network error (future cloud sync) | Toast notification with retry |
| Generate with all locked | Show toast "All slots are locked" |
| Invalid image format | Toast: "Unsupported format. Use JPG, PNG, or WebP" |
| Image too small | Toast: "Image too small to extract colors" |
| Delete confirmation | Modal: "Delete {name}? This cannot be undone." |

---

## 15. Clever Theme Name Generator

When creating new themes via "Generate" or "New Theme", automatically generated names use a clever naming system:

**Name Format:** `{Adjective} {Noun}`

**Examples:**
- Midnight Horizon
- Solar Cascade
- Azure Ember
- Crimson Twilight
- Velvet Aurora

**Name Pool:**
- 50 curated adjectives (Midnight, Solar, Azure, Crimson, Velvet, Golden, Cosmic, etc.)
- 50 curated nouns (Horizon, Cascade, Ember, Twilight, Aurora, Drift, Prism, etc.)
- 2,500+ unique combinations possible

**Implementation:**
```javascript
export function generateThemeName() {
    const adj = THEME_NAME_ADJECTIVES[randomIndex];
    const noun = THEME_NAME_NOUNS[randomIndex];
    return `${adj} ${noun}`;
}
```

---

## 16. Real-Time Preview

All edits immediately update the theme preview in the left column:

| Action | Real-Time Update |
|--------|------------------|
| Change slot hue | ✓ Immediate |
| Change slot saturation | ✓ Immediate |
| Color picker interaction | ✓ Immediate |
| Adjust brightness/contrast/etc. | ✓ Immediate |
| Generate new colors | ✓ Immediate |

**Implementation:**
- `updateSlotHue()`, `updateSlotSaturation()`, and `updateAdjustment()` all call `renderThemeList()`
- This re-renders the left column previews to reflect current state
- No manual refresh needed

---

## 17. System Integration

### CSS Variable Propagation

When a theme is applied, colors are exposed as CSS variables on `document.documentElement`:

```javascript
// LumaTheme.applyToDocument() or ThemeManager.applyTheme()
document.documentElement.style.setProperty('--theme-slot1', '#0d0a14');
document.documentElement.style.setProperty('--theme-slot2', '#14101e');
// ... through --theme-slot12
```

**Usage in CSS:**
```css
.element-with-theme-color {
    background-color: var(--theme-slot2);
    border-color: var(--theme-slot7);
}
```

---

### Light/Dark Mode (Master Slide Property)

Light/Dark mode is controlled at the **Master Slide level**, not in the Color Theme Manager. This allows the same color theme to be used for both light and dark presentations.

**Master Slide Property Inspector:**
```
┌────────────────────────────────────────────────────────────────┐
│  Slide Properties                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Color Theme:  [ Solar Cascade          ▾ ]                    │
│                                                                │
│  Mode:   [☀️ Light]  [🌙 Dark]                                 │
│              ○          ●                                      │
│                                                                │
│  ...other slide properties...                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**How Mode Affects Slot Resolution:**

The same `themeSlot` reference is interpreted differently based on mode:

| Element Purpose | Light Mode Slot | Dark Mode Slot | Why |
|-----------------|-----------------|----------------|-----|
| Primary background | Slot 12 (L:97%) | Slot 1 (L:5%) | Light uses highlights, dark uses shadows |
| Primary text | Slot 1 (L:5%) | Slot 12 (L:97%) | High contrast against background |
| Secondary background | Slot 11 (L:90%) | Slot 2 (L:10%) | Slightly less bright/dark |
| Secondary text | Slot 3 (L:18%) | Slot 10 (L:80%) | Secondary contrast |

**Slot Mapping Formula:**
```javascript
function resolveSlotForMode(slotIndex, mode) {
    if (mode === 'light') {
        // Invert: slot N becomes slot (13 - N)
        return 13 - slotIndex;
    }
    return slotIndex; // Dark mode uses slots as-is
}

// Example: Slot 2 in a template
// Dark mode: resolves to Slot 2 (L:10%, dark background)
// Light mode: resolves to Slot 11 (L:90%, light background)
```

**Storage:**
```javascript
// Master slide stores mode preference
masterSlide: {
    colorThemeId: 'solar-cascade',
    colorMode: 'dark' | 'light',  // Default: 'dark'
    // ...other properties
}
```

**Benefits:**
- No need to create separate light/dark versions of themes
- Same color harmony works in both modes
- Theme designer focuses on one palette
- User controls appearance at presentation level

**CSS Variable Application:**
When mode changes, the CSS variables are re-mapped:

```javascript
// When colorMode === 'light', apply inverted mapping
if (colorMode === 'light') {
    document.documentElement.style.setProperty('--theme-slot1', theme.colors[11]);  // Slot 12 → var 1
    document.documentElement.style.setProperty('--theme-slot2', theme.colors[10]);  // Slot 11 → var 2
    // ... etc
} else {
    // Dark mode: direct mapping
    document.documentElement.style.setProperty('--theme-slot1', theme.colors[0]);
    // ...
}
```

---

### Slide Master Template Integration

Slide Master presets store theme-linked colors using `themeSlot` references:

**Template Storage Format:**
```javascript
{
    fill: {
        type: 'solid',
        themeSlot: 2,          // References Primary column, Shadows row
        value: null            // Resolved at runtime
    }
}
```

**Application Flow:**
```
1. User selects preset → handleApplySlideMasterPreset()
2. Template applied with themeSlot references preserved
3. CSS variables updated from current LumaTheme
4. StyleResolver.resolveThemeSlot() converts slot → hex
5. Property Inspector refreshed via state-changed event
6. Canvas re-renders with resolved colors
```

---

### StyleResolver Integration

`StyleResolver.js` provides runtime resolution of theme-linked fills:

```javascript
// Resolve a single theme slot to hex
const hex = StyleResolver.resolveThemeSlot(2);  // Returns e.g., "#14101e"

// Resolve a fill object that may be theme-linked
const fill = { type: 'solid', themeSlot: 7, value: null };
const resolved = StyleResolver.resolveTextFill(fill);
// Returns: { type: 'solid', themeSlot: 7, value: '#8a7db3' }
```

**Key Methods:**
| Method | Purpose |
|--------|---------|
| `resolveThemeSlot(index, fallback)` | Get hex for slot index (1-12) |
| `resolveTextFill(fill)` | Resolve fill with themeSlot to include hex value |
| `getEffectiveTextProperties()` | Returns text props with resolved fills |

---

### Property Inspector Updates

When theme-linked elements are selected, Property Inspector sections must:

1. **FillSection:** Show resolved color in swatch, indicate theme-linked status
2. **TextSection:** Display resolved text fill color with slot indicator
3. **SlideSection:** After applying preset, emit `state-changed` for refresh

**Theme-Linked Fill Detection:**
```javascript
if (fill.themeSlot !== undefined) {
    // Show theme indicator badge or tooltip
    // Resolve actual color via StyleResolver
    const resolvedHex = StyleResolver.resolveThemeSlot(fill.themeSlot);
}
```

---

### Fill Panel Integration

The Fill Panel uses theme slots for the primary color selection:

**Theme Swatches Section:**
- Displays all 12 slots organized by tonal row
- Clicking a swatch sets fill to `{ type: 'solid', themeSlot: N }`
- Not an arbitrary hex—maintains theme linkage

**Slot Selection Behavior:**
```javascript
selectThemeSlot(slotIndex) {
    this.setFill({
        type: 'solid',
        themeSlot: slotIndex,
        value: null  // Resolved at render time
    });
}
```

---

### Rendering Pipeline Integration

The Canvas rendering pipeline resolves theme slots at draw time:

```javascript
// In CanvasRenderer or element draw methods
if (element.fill?.themeSlot) {
    const resolvedColor = getComputedStyle(document.documentElement)
        .getPropertyValue(`--theme-slot${element.fill.themeSlot}`).trim();
    ctx.fillStyle = resolvedColor;
}
```

**Benefits:**
- Theme changes propagate instantly to all themed elements
- No need to update individual element fill values
- Supports live theme preview during editing

---

### State Management

The active LumaTheme is stored in the global store:

```javascript
// Store structure
store.state.lumaTheme = {
    id: 'theme-001',
    name: 'Solar Cascade',
    slots: [...],  // 12 slots with H, S, role
    colors: [...], // 12 resolved hex values
    adjustments: { brightness: 0, contrast: 0, saturation: 0 }
};
```

**Events:**
| Event | Purpose |
|-------|---------|
| `theme-changed` | Fired when active theme changes |
| `theme-updated` | Fired when current theme is edited |
| `state-changed` | Generic event for canvas refresh |

---

### Export/Import Integration

**Export Format:**
```javascript
{
    "storyColorTheme": "1.0",
    "theme": {
        "id": "...",
        "name": "Theme Name",
        "slots": [
            { "h": 210, "s": 75, "role": "secondary1" },
            // ... 12 slots
        ],
        "adjustments": { "brightness": 0, "contrast": 0, "saturation": 0 }
    }
}
```

**Import Validation:**
- Check `storyColorTheme` version header
- Validate 12 slots present with valid H (0-360), S (0-100)
- Verify role assignments match expected columns
- Regenerate colors[] from HSL + fixed luma values

---

## 18. Future Considerations

- **AI Tab:** Placeholder reserved for AI-generated themes
- **Cloud Sync:** Custom themes synced to user account
- **Export/Import:** JSON format for theme sharing (see Section 17)
- **Undo/Redo:** Full integration with History Manager
- **Collaboration:** Real-time theme editing in shared sessions
