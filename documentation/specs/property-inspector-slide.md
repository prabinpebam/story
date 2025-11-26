# Property Inspector: Slide Properties

## Overview
This document details the slide properties displayed in the Property Inspector when **no elements are selected** on the canvas, or when the Slide/Master itself is explicitly selected.

The entire Property Inspector pane shows slide properties. There is **no outer "Slide" section** - instead, each logical grouping (Layout, Theme, Background) is its own `pi-section`.

## Section Structure

When in **Slide Mode** (Edit Mode):
1. **Layout Section** (`pi-section`) - Contains layout picker and dimensions
2. **Theme Section** (`pi-section`) - Contains Colors and Typography rows
3. **Background Section** (`pi-section`) - Contains fill type and controls

When in **Master Mode**:
1. **Name Row** (standalone, no section) - Editable master/layout name
2. **Dimensions Section** (`pi-section`) - Contains W/H inputs only
3. **Theme Section** (`pi-section`) - Colors and Typography
4. **Background Section** (`pi-section`) - Fill controls

---

## 1. Layout Section (Slide Mode Only)
A `pi-section` with title "Layout".

### Layout Picker
- **Control**: Button that opens a visual flyout with layout thumbnails.
- **Content**: Grid of available layouts from the current theme showing mini-previews.
- **Behavior**: Clicking a layout switches the slide's layout, inheriting background/elements from the new layout.

### Dimensions
- **Layout**: Two columns (W, H).
- **Controls**:
    - **Width (W)**: Numeric Input.
    - **Height (H)**: Numeric Input.
- **Behavior**: Resizes the canvas.

---

## 2. Name (Master Mode Only)
- **Display**: Standalone row at the top (not in a section).
- **Control**: Text Input.
- **Behavior**: Renames the current Master or Layout.

---

## 3. Theme Section
A `pi-section` with title "Theme". Contains two clickable rows.

### Colors Row
- **Icon**: Palette icon.
- **Label**: "Colors".
- **Display**: 
    - Color swatches showing the current theme colors (accent colors from the active theme).
    - Uses standard 16x16px swatch size consistent with the rest of the application.
- **Inheritance Indicator**: 
    - Shows "Inherited" badge if using the master/layout theme.
    - Shows "Override" badge if the slide has custom colors.
- **Reset Button**: 
    - Visible only when colors are overridden.
    - One-click reset to inherited colors.
- **Click Action**: Opens the Color Theme Manager panel.

### Typography Row
- **Icon**: Font icon.
- **Label**: "Typography" (not "Font").
- **Display**: 
    - Current text style preview (e.g., font names like "Inter / Inter").
    - Shows heading and body font.
- **Inheritance Indicator**: 
    - Shows "Inherited" badge if using the master/layout theme.
    - Shows "Override" badge if the slide has custom typography.
- **Reset Button**: 
    - Visible only when typography is overridden.
    - One-click reset to inherited typography.
- **Click Action**: Opens the Typography Style Manager panel.

---

## 4. Background Section
A `pi-section` with title "Background". Uses the standard FillSection component.

- **Type Selector**: Dropdown with options: `Inherited`, `Solid`, `Gradient`, `Image`, `Video`, `Code`.
- *Note*: "Inherited" is default for Slides/Layouts. "Theme" masters cannot inherit.

### Background Controls (Per Type)
- **Inherited**: No controls. Shows "Using background from [Parent Name]".
- **Solid**: Color Swatch + Hex Input.
- **Gradient**: Gradient Editor (Same as Fill).
- **Image**: Image Picker + Scale Mode (Same as Fill).
- **Video**: Video Picker + Playback controls.
- **Code**: AI Generator + Code Editor (Same as Fill).

---

## Summary Table

| Section | Context | Content |
| :--- | :--- | :--- |
| **Layout** | Slide Mode | Layout picker button + Dimensions (W, H) |
| **Dimensions** | Master Mode | W, H inputs only (no layout picker) |
| **Name** | Master Mode | Text input (standalone row, not a section) |
| **Theme** | All | Colors row + Typography row |
| **Background** | All | FillSection with type dropdown |

---

## Design Notes

1. **Section-based Structure**: Each logical group (Layout, Theme, Background) is its own `pi-section` with collapsible header. No outer "Slide" section wrapper.

2. **Mode-aware Layout Section**: 
   - In Slide mode: Title is "Layout", shows layout picker + dimensions.
   - In Master mode: Title is "Dimensions", shows only W/H inputs.

3. **Consistent Swatch Size**: Color swatches use 16x16px throughout the application.

4. **Inheritance Visual**: 
   - Inherited values show a subtle badge with muted styling.
   - Override values show an accent-colored badge plus a reset (×) button.

5. **Panel Integration**: Clicking Colors or Typography rows opens their respective manager panels.
