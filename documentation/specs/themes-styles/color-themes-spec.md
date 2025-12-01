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
- There should be an invert theme option that flips the Luma values in theswatch slots to convert the color theme to turn the whole theme to lightmode/dark mode version.

---

# Detailed UX Specification

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
| Size | 32px × 20px | Custom |
| Grid | 2 rows × 3 cols | — |
| Individual swatch | 10px × 10px | — |
| Border radius | 2px | `--radius-xs` |
| Gap | 1px | — |
| Colors shown | background1, text1, accent1, accent2, accent3, accent4 | — |

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
│  Default Dark                        [🔄]  │ <- Invert Theme button
├────────────────────────────────────────────┤
```

**If preset is selected:**
- Name shown as read-only text
- Editing any value triggers "Save as New Theme" modal

**If custom theme is selected:**
- Name is editable inline (double-click or click pencil icon)

**Invert Button:**
- Tooltip: "Invert to Light/Dark mode"
- Flips all luma values to create opposite theme
- On preset: prompts to save as new

**Header Tokens:**
| Element | Token |
|---------|-------|
| Padding | `--spacing-3` |
| Font | `--font-size-lg`, `--font-weight-semibold` |
| Color | `--color-text-primary` |
| Invert button | `IconButton` component |

---

### 4.2 Color Swatch Editor Section

The 12 color slots displayed in a structured grid.

```
┌────────────────────────────────────────────────────────────────┐
│  Color Slots                                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Backgrounds                                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌────┐  Background 1    H: [120°]  S: [50%]  [🔒]      │   │
│  │  │░░░░│  L: 15% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Background 2    H: [120°]  S: [45%]  [🔒]      │   │
│  │  │░░░░│  L: 22% (locked)                                │   │
│  │  └────┘                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Text                                                   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌────┐  Text Primary    H: [0°]    S: [0%]   [🔒]      │   │
│  │  │░░░░│  L: 92% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Text Secondary  H: [0°]    S: [0%]   [🔒]      │   │
│  │  │░░░░│  L: 65% (locked)                                │   │
│  │  └────┘                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Accents                                                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌────┐  Accent 1        H: [210°]  S: [85%]  [🔒]      │   │
│  │  │░░░░│  L: 55% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Accent 2        H: [150°]  S: [70%]  [🔒]      │   │
│  │  │░░░░│  L: 50% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Accent 3        H: [30°]   S: [80%]  [🔒]      │   │
│  │  │░░░░│  L: 55% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Accent 4        H: [330°]  S: [75%]  [🔒]      │   │
│  │  │░░░░│  L: 50% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Accent 5        H: [270°]  S: [65%]  [🔒]      │   │
│  │  │░░░░│  L: 55% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Accent 6        H: [60°]   S: [60%]  [🔒]      │   │
│  │  │░░░░│  L: 50% (locked)                                │   │
│  │  └────┘                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Links                                                  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ┌────┐  Hyperlink       H: [210°]  S: [90%]  [🔒]      │   │
│  │  │░░░░│  L: 55% (locked)                                │   │
│  │  └────┘                                                 │   │
│  │  ┌────┐  Visited Link    H: [280°]  S: [60%]  [🔒]      │   │
│  │  │░░░░│  L: 45% (locked)                                │   │
│  │  └────┘                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Color Slot Row Structure:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌──────┐  Slot Name      H: [___°]  S: [___%]          [🔒]          │
│ │      │  L: XX% (locked)                                            │
│ └──────┘                                                             │
└──────────────────────────────────────────────────────────────────────┘
   │           │               │           │                │
   │           │               │           │                └─ Lock toggle
   │           │               │           │                   (prevents Generate)
   │           │               │           └─ Saturation input (0-100%)
   │           │               └─ Hue input (0-360°)
   │           └─ Luma shown as read-only badge
   └─ Color swatch preview
```

**Swatch Preview:**
| Property | Value | Token |
|----------|-------|-------|
| Size | 32px × 32px | `--swatch-size-2xl` |
| Border radius | 4px | `--radius-sm` |
| Border | 1px | `--color-border` |
| Click action | Opens full color picker flyout (H+S only) |

**Input Fields (H and S):**
Uses existing `NumberInput` component with scrubbable labels.

| Property | Hue | Saturation |
|----------|-----|------------|
| Label | "H:" | "S:" |
| Min | 0 | 0 |
| Max | 360 | 100 |
| Step | 1 | 1 |
| Units | ° | % |
| Width | 60px | 60px |
| Scrubbable | Yes | Yes |

**Luma Display (Read-only):**
| Property | Value | Token |
|----------|-------|-------|
| Format | "L: XX%" | — |
| Font | `--font-size-xs` | |
| Color | `--color-text-tertiary` |
| Style | Badge/pill |
| Background | `--color-bg-input` |
| Padding | `--spacing-1` horizontal |

**Lock Toggle:**
Uses existing `IconButton` component.

| State | Icon | Color |
|-------|------|-------|
| Unlocked | 🔓 (open lock) | `--color-text-tertiary` |
| Locked | 🔒 (closed lock) | `--color-accent` |

**Section Tokens:**
| Element | Token |
|---------|-------|
| Section gap | `--spacing-4` |
| Row gap | `--spacing-2` |
| Row padding | `--spacing-2` |
| Section header font | `--font-size-xs`, `--font-weight-semibold` |
| Section header color | `--color-text-tertiary` |
| Section header padding-bottom | `--spacing-2` |

---

### 4.3 Generate Section

```
┌────────────────────────────────────────────────────────────────┐
│  Generate                                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Color Harmony:  [ Complementary        ▾ ]                    │
│                                                                │
│  [      🎲 Generate Random Colors      ]                       │
│                                                                │
│  Note: Locked slots will not be affected                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

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

**Generate Button:**
| Property | Value | Token |
|----------|-------|-------|
| Width | 100% | — |
| Height | 32px | `--control-size-lg` |
| Background | `--color-accent` | |
| Text | `--color-text-on-accent` | |
| Border radius | 4px | `--radius-sm` |
| Hover | `--color-accent-hover` | |
| Active | `--color-accent-active` | |
| Icon | 🎲 dice | `--icon-size-sm` |

**Note Text:**
| Property | Value | Token |
|----------|-------|-------|
| Font | `--font-size-xs` | |
| Color | `--color-text-tertiary` | |
| Style | Italic | |

---

### 4.4 Theme Adjustments Section

Photo-editing style controls that affect all colors proportionally.

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

**Slider Tokens:**
| Element | Token |
|---------|-------|
| Track height | 4px |
| Track background | `--color-bg-input` |
| Track filled | `--color-accent` |
| Track radius | `--radius-full` |
| Thumb size | 12px |
| Thumb background | `--color-text-primary` |
| Thumb hover | Scale 1.2× |
| Thumb active | `--color-accent` |
| Label width | 80px |
| Label font | `--font-size-sm` |
| Label color | `--color-text-secondary` |
| Input width | 48px |
| Row gap | `--spacing-2` |
| Row height | 28px |

**Reset Button:**
Uses `IconButton` with ↺ (rotate) icon.
- Tooltip: "Reset all adjustments"
- Resets all sliders to 0

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
| Hue input | "Hue for {slot name}" |
| Saturation input | "Saturation for {slot name}" |
| Lock toggle | "Lock {slot name} from generation" |
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

New components needed:
| Component | Purpose |
|-----------|---------|
| `SliderControl` | Horizontal slider for adjustments |
| `ThemeListItem` | Theme preview card for left column |
| `ColorSlotRow` | Row for editing a single color slot |

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
.ctm__slot-label { }
.ctm__slot-inputs { }
.ctm__slot-luma { }
.ctm__slot-lock { }

/* Generate */
.ctm__generate { }
.ctm__generate-dropdown { }
.ctm__generate-button { }
.ctm__generate-note { }

/* Adjustments */
.ctm__adjustments { }
.ctm__slider-row { }
.ctm__slider-label { }
.ctm__slider-track { }
.ctm__slider-thumb { }
.ctm__slider-value { }
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
| Delete last custom theme | Disable delete button when only 1 remains |
| Network error (future cloud sync) | Toast notification with retry |
| Generate with all locked | Show toast "All slots are locked" |

---

## 15. Future Considerations

- **AI Tab:** Placeholder reserved for AI-generated themes
- **Cloud Sync:** Custom themes synced to user account
- **Export/Import:** JSON format for theme sharing
- **Undo/Redo:** Full integration with History Manager
- **Collaboration:** Real-time theme editing in shared sessions
