# 22 — Themes (Color Theme System)

> Taskflows for the 12-slot luma-locked palette, HueSaturationPopover, adjustments, harmony generation, light/dark mode, and theme cascade.

## Theme Manager Panel

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-01 | Open theme manager | Click theme edit control in PI Slide section | `ColorThemeManager` DraggablePanel (520×580): two-column (theme list + editor) | — |
| THM-02 | Select theme from list | Click theme in left panel | Theme loaded into editor; 4-column header swatches shown | — |
| THM-03 | Create new theme | Click New Theme button | New custom theme created with quirky generated name | — |
| THM-04 | Delete custom theme | Delete custom theme from list | Theme removed; presets (built-in) cannot be deleted | — |
| THM-05 | Apply theme to master | Click Apply or double-click | Theme assigned to current master | `APPLY_LUMA_THEME` |

## 12-Slot Luma-Locked Editing

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-06 | Edit column header (open popover) | Click column header swatch | `HueSaturationPopover` donut wheel opens | — |
| THM-07 | Set column hue | Drag on donut circumference | Hue (0–360°) for entire column (all 3 slots share H) | `UPDATE_LUMA_THEME_SLOT` per slot |
| THM-08 | Set column saturation | Drag radially on donut | Saturation (inner=0%, outer=100%) for entire column | `UPDATE_LUMA_THEME_SLOT` per slot |
| THM-09 | Edit hue via input | Type hue value (0–360°) in popover | Hue set to exact value for column | `UPDATE_LUMA_THEME_SLOT` |
| THM-10 | Edit saturation via input | Type saturation value (0–100%) in popover | Saturation set to exact value | `UPDATE_LUMA_THEME_SLOT` |
| THM-11 | Close popover | Click outside popover | Popover dismissed | — |
| THM-12 | Edit individual slot | Click individual slot swatch (not column header) | Direct slot editing (H + S only; luma is fixed per slot position) | `UPDATE_LUMA_THEME_SLOT` |

### Luma Constraints

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-13 | Shadows row L values | Slots 1–4 render | Fixed: L=5%, 10%, 18%, 25% | — |
| THM-14 | Midtones row L values | Slots 5–8 render | Fixed: L=35%, 45%, 55%, 65% | — |
| THM-15 | Highlights row L values | Slots 9–12 render | Fixed: L=70%, 80%, 90%, 97% | — |
| THM-16 | Minimum luma delta | Adjacent slots | Weber's Law JND: `MIN_LUMA_DELTA = 2` between slots | — |

## Adjustment Sliders

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-17 | Adjust brightness | Drag/scrub brightness slider (-100 to +100) | All 12 slots adjusted uniformly | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-18 | Adjust contrast | Drag/scrub contrast slider (-100 to +100) | Shadows pushed darker, highlights lighter | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-19 | Adjust highlights | Drag/scrub highlights slider (-100 to +100) | Slots 9–12 (highlights row) adjusted | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-20 | Adjust shadows | Drag/scrub shadows slider (-100 to +100) | Slots 1–4 (shadows row) adjusted | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-21 | Adjust whites | Drag/scrub whites slider (-100 to +100) | Upper highlight range expanded/compressed | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-22 | Adjust blacks | Drag/scrub blacks slider (-100 to +100) | Lower shadow range expanded/compressed | `UPDATE_LUMA_THEME_ADJUSTMENTS` |
| THM-23 | Adjust saturation | Drag/scrub saturation slider (-100 to +100) | Global saturation modifier on all 12 slots | `UPDATE_LUMA_THEME_ADJUSTMENTS` |

## Harmony Generation

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-24 | Generate complementary | Select Complementary harmony → Generate | Base hue + 180°: 2 column hues mapped across 4 columns | `APPLY_LUMA_THEME` |
| THM-25 | Generate monochromatic | Select Monochromatic → Generate | Single hue, varying saturation across columns | `APPLY_LUMA_THEME` |
| THM-26 | Generate analogous | Select Analogous → Generate | Base ± 30° offsets across 4 columns | `APPLY_LUMA_THEME` |
| THM-27 | Generate triadic | Select Triadic → Generate | Base + 120° + 240° mapped across columns | `APPLY_LUMA_THEME` |
| THM-28 | Generate split-complementary | Select Split-complementary → Generate | Base + 150° + 210° across columns | `APPLY_LUMA_THEME` |
| THM-29 | Generate tetradic | Select Tetradic → Generate | Base + 90° + 180° + 270° across columns | `APPLY_LUMA_THEME` |
| THM-30 | Generate square | Select Square → Generate | Same as tetradic (base + 90° offsets) | `APPLY_LUMA_THEME` |
| THM-31 | Lock columns during generation | Toggle lock on specific columns | Locked columns preserved during harmony generation | — |
| THM-32 | Randomize generation | Include randomization in generate | Random base hue and saturation variation | — |

## Light/Dark Mode

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-33 | Set light mode | Select Light mode | `colorModeId: 'light'` on theme master; normal slot ordering | `SET_COLOR_MODE` |
| THM-34 | Set dark mode | Select Dark mode | `colorModeId: 'dark'`; slots mapped to mirrored positions (`11-N`), swapping shadows↔highlights | `SET_COLOR_MODE` |

## Theme Cascade & Usage

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-35 | Theme cascades to slides | Master theme changed | All slides using this master (via layouts) see updated colors | — |
| THM-36 | Slide-level theme override | Set theme override on slide | `styleAssignments.colorTheme` overrides master for this slide only | `UPDATE_SLIDE_STYLE_ASSIGNMENTS` |
| THM-37 | Theme fills auto-update | Theme slot color changed | All elements with `fill.themeSlot` matching that index update automatically | — |
| THM-38 | Extract from image | Click "Extract from Image" | Color palette extracted from uploaded image | — |
| THM-39 | Import theme JSON | Click "Import JSON" | Theme loaded from exported JSON | — |

## Built-In Presets

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| THM-40 | Browse 10 presets | View preset list in theme manager | Neutral, Electric Dreams, Sunset Boulevard, Tropical Paradise, Berry Bliss, Emerald & Gold, Cosmic Nebula, Citrus Burst, Ocean Sunset, Rose Garden | — |
| THM-41 | Preset is read-only | Try to edit built-in preset | Presets marked as locked; cannot delete | — |
