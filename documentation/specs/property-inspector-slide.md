# Property Inspector: Slide Properties

## Overview
This document details the slide properties displayed in the Property Inspector when **no elements are selected** on the canvas, or when the Slide/Master itself is explicitly selected.

The entire Property Inspector in this state shows slide properties - there is no separate "Slide Section" header as the whole panel is dedicated to slide properties.

## 1. Layout (Slide Mode Only)
- **Condition**: Visible in Edit Mode (Slide editing).
- **Label**: "Layout".
- **Control**: Visual layout picker with thumbnails.
- **Content**: Grid of available layouts from the current theme showing mini-previews.
- **Behavior**: Clicking a layout switches the slide's layout, inheriting background/elements from the new layout.

## 2. Name (Master Mode Only)
- **Label**: "Name".
- **Control**: Text Input.
- **Behavior**: Renames the current Master or Layout.

## 3. Dimensions
- **Layout**: Two columns (W, H).
- **Controls**:
    - **Width (W)**: Numeric Input.
    - **Height (H)**: Numeric Input.
- **Behavior**: Resizes the canvas.

## 4. Theme Settings
A section for managing color and typography themes at the slide level.

### Colors Row
- **Label**: "Colors".
- **Display**: 
    - Color swatches showing the current theme colors (accent colors from the active theme).
    - Uses standard swatch size consistent with the rest of the application.
- **Inheritance Indicator**: 
    - Shows "Inherited" badge if using the master/layout theme.
    - Shows "Override" badge if the slide has custom colors.
- **Reset Button**: 
    - Visible only when colors are overridden.
    - One-click reset to inherited colors.
- **Click Action**: Opens the Color Theme Manager flyout panel.

### Typography Row
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
- **Click Action**: Opens the Typography Style Manager flyout panel.

## 5. Background
- **Label**: "Background".
- **Type Selector**: Dropdown.
    - **Options**: `Inherited`, `Solid`, `Gradient`, `Image`, `Video`, `Code`.
    - *Note*: "Inherited" is default for Slides/Layouts. "Theme" masters cannot inherit.

### Background Controls (Per Type)
- **Inherited**: No controls. Shows "Using background from [Parent Name]".
- **Solid**: Color Swatch + Hex Input.
- **Gradient**: Gradient Editor (Same as Fill).
- **Image**: Image Picker + Scale Mode (Same as Fill).
- **Video**: Video Picker + Playback controls.
- **Code**: AI Generator + Code Editor (Same as Fill).

## Summary Table

| Feature | Context | Control | Description |
| :--- | :--- | :--- | :--- |
| **Layout** | Slide | Visual Picker | Change assigned layout with thumbnails. |
| **Name** | Master | Input | Rename master/layout. |
| **Dimensions** | All | Inputs | Canvas W/H. |
| **Colors** | All | Swatches + Click | View/edit theme colors. Shows inheritance. |
| **Typography** | All | Preview + Click | View/edit text styles. Shows inheritance. |
| **Background** | All | Dropdown | Inherited/Solid/Gradient/etc. |

## Design Notes

1. **No Section Header**: The Property Inspector title changes to "Slide" or "Master / Layout" based on mode, but there's no redundant section header inside.

2. **Consistent Swatch Size**: Color swatches throughout the application use the same 16x16px size for consistency.

3. **Inheritance Visual**: 
   - Inherited values show a subtle badge or lighter text color.
   - Override values appear with normal styling plus a reset button.

4. **Reset to Inherited**: The reset button (×) appears inline and resets the specific property to inherit from the parent.

5. **Flyout Integration**: Clicking the Colors or Typography rows opens their respective manager panels for full editing capabilities.
