# 18 — Color Picker

> Taskflows for SolidTab (shared picker), HSB interaction, theme swatches, eyedropper, and link/unlink behavior.

## HSB Color Area

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-01 | Click to set color | Click on 2D HSB field | Saturation (x%) and brightness (100-y%) set immediately | Per-context dispatch |
| CLR-02 | Drag to scrub color | Mousedown+drag on HSB field | S and B update continuously; handle follows mouse | Per-context dispatch |
| CLR-03 | Area tint updates | Hue slider changes | HSB area background tint updates to current hue | — |
| CLR-04 | Handle position | Color changes from any source | Handle positioned at correct S (x) and B (y) coordinates | — |

## Hue Slider

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-05 | Click to set hue | Click on horizontal rainbow bar | Hue (0–360°) set at click position | Per-context dispatch |
| CLR-06 | Drag to scrub hue | Mousedown+drag on hue bar | Hue updates continuously; HSB area tint follows | Per-context dispatch |

## Alpha Slider

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-07 | Click to set alpha | Click on alpha bar (checkerboard → color) | Alpha (0–100%) set at click position | Per-context dispatch |
| CLR-08 | Drag to scrub alpha | Mousedown+drag on alpha bar | Alpha updates continuously | Per-context dispatch |
| CLR-09 | Alpha bar color updates | Color changes from any source | Alpha bar gradient updates to show current color at full opacity | — |

## Eyedropper

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-10 | Pick screen color | Click eyedropper → click anywhere | EyeDropper API captures pixel color; h/s/b set from result | Per-context dispatch |
| CLR-11 | Eyedropper unlinks theme | Pick color via eyedropper | `themeSlot` cleared (no longer linked to theme) | Per-context dispatch |
| CLR-12 | Eyedropper cancel | Press Escape during eyedropper | No color change; picker returns to previous state | — |

## Hex Input

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-13 | Edit hex value | Type #RGB or #RRGGBB | Parsed to h/s/b; applied on change event | Per-context dispatch |
| CLR-14 | Invalid hex ignored | Type invalid hex string | Input reverts to last valid value | — |
| CLR-15 | Hex unlinks theme | Edit hex input manually | `themeSlot` cleared | Per-context dispatch |
| CLR-16 | Hex shows slot label | Fill linked to theme | Hex input replaced by theme slot label text | — |

## Opacity Input

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-17 | Set opacity | Edit NumberInput (0–100%) | Alpha value updated | Per-context dispatch |
| CLR-18 | Scrub opacity | Scrub opacity NumberInput | Alpha scrubbed with standard NumberInput mechanics | Per-context dispatch |

## Theme Swatches (12-Slot Luma-Locked)

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-19 | Click theme swatch | Click one of 12 theme color buttons | Link fill to theme slot: `fill.themeSlot = slotIndex`; color set from slot | Per-context linked dispatch |
| CLR-20 | Selected slot highlight | Linked fill with matching slot | Active swatch highlighted with selection indicator | — |
| CLR-21 | Theme name display | Theme section renders | Theme name label + source indicator (inherited from Master/Layout or slide) | — |
| CLR-22 | Cascade-aware resolution | Read theme swatches | Uses `StyleResolver.getThemeInfoForSlide()` for effective theme | — |
| CLR-23 | Auto-update on theme change | Theme colors changed elsewhere | Swatch colors update via `state-changed` listener | — |

### Luma-Locked Tonal System

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-24 | Shadow cluster (slots 1–4) | View theme swatches | Fixed luma: L=5%, 10%, 18%, 25% | — |
| CLR-25 | Midtone cluster (slots 5–8) | View theme swatches | Fixed luma: L=35%, 45%, 55%, 65% | — |
| CLR-26 | Highlight cluster (slots 9–12) | View theme swatches | Fixed luma: L=70%, 80%, 90%, 97% | — |

## Default Palette

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-27 | Click default color | Click one of 16 default palette buttons (8-column grid) | Color applied; `themeSlot` cleared (unlinked) | Per-context dispatch |

## Link/Unlink Behavior

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-28 | Link via theme swatch | Click theme swatch | `isLinkedToTheme = true`, `linkedSlot` set; link indicator shown | — |
| CLR-29 | Unlink via HSB drag | Drag in HSB area | `isLinkedToTheme = false`, `themeSlot` cleared | — |
| CLR-30 | Unlink via hex edit | Type in hex input | Same unlink | — |
| CLR-31 | Unlink via eyedropper | Pick color with eyedropper | Same unlink | — |
| CLR-32 | Unlink via default palette | Click default color | Same unlink | — |
| CLR-33 | Link indicator update | Link state changes | `updateLinkIndicator()` called; visual indicator reflects current state | — |

## Usage Contexts

| ID | Taskflow | Trigger | Expected Behavior | Store Dispatch |
|----|----------|---------|-------------------|----------------|
| CLR-34 | Fill color picker | Open from FillSection swatch | SolidTab used for fill colors | `UPDATE_ELEMENT({style:{fills}})` |
| CLR-35 | Stroke color picker | Open from StrokeSettingsFlyout | SolidTab used for stroke colors | `UPDATE_ELEMENT({style:{strokes}})` |
| CLR-36 | Text fill color picker | Open from TextSection swatch | SolidTab used for text colors | `UPDATE_ELEMENT({textFill})` |
| CLR-37 | Gradient stop picker | Open from gradient stop handle | ColorPickerFlyout (SolidTab wrapper) for per-stop color | Per-gradient dispatch |
| CLR-38 | Layout guide color | Open from SlideSection guide color swatch | SolidTab for guide overlay color | `updateLayoutGuideAppearance({color})` |
| CLR-39 | Effect color picker | Open from shadow effect color control | Inline color input for effect color | `UPDATE_ELEMENT({style:{effects}})` |
