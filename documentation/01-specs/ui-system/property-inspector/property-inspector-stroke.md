# Property Inspector: Stroke Specification

## Overview
This document details the "Stroke" section of the Property Inspector. This section manages the border properties of selected layers, including color, weight, position, and advanced rendering options like dashes, joins, and per-side application.

## 1. Stroke Section (Main Panel)
The main panel interface supports stacking multiple strokes on a single object.

### Header
- **Title**: "Stroke".
- **Actions**:
    - **Add (+)**: Adds a new stroke layer to the top of the stack.
    - **Menu (Grid Icon)**: Opens library or presets menu.

### Stroke List Item (Per Stroke)
Each stroke is a row in the list. Strokes are rendered from bottom to top (last in list = bottom).

**Row Layout:**
1.  **Color Swatch**:
    - **Visual**: Small square preview.
    - **Action**: Opens the [Color Picker](../fills/color-picker-ui.md).
2.  **Value Input**: Hex code or Variable name.
3.  **Opacity Input**: Percentage (0-100%).
4.  **Visibility (Eye)**: Toggles stroke visibility.
5.  **Remove (-)**: Deletes the stroke layer.

**Properties Row (Below Color):**
1.  **Weight**: Numeric input (e.g., `1`). Controls thickness.
2.  **Position**: Dropdown (Inside, Center, Outside).
3.  **Sides Selector**: Icon button (Square outline). Opens the [Stroke Sides Menu](#3-stroke-sides-selector-menu).
4.  **Settings (Sliders)**: Icon button (Blue highlighted when active). Opens the [Stroke Settings Flyout](#2-stroke-settings-flyout).

## 2. Stroke Settings Flyout
A detailed configuration panel for advanced stroke properties.

### Header
- **Title**: "Stroke settings".
- **Close (X)**: Dismisses the flyout.

### Mode Tabs
- **Basic** (Active): Standard stroke properties.
- **Dynamic**: Pressure/speed-based width modulation (Future).
- **Brush**: Stylized brush strokes (Future).

### Basic Mode Controls
1.  **Style Selector**:
    - **Dropdown**: Solid, Dashed, Dotted, Mixed.
    - **Behavior**: Selecting Dashed/Dotted reveals Gap/Dash inputs.
2.  **Width Profile**:
    - **Preview**: Visual representation of the stroke width profile.
    - **Actions**: Reset profile, Flip profile horizontally.
3.  **Join Settings**:
    - **Segmented Control**:
        - **Miter Join**: Sharp corner.
        - **Round Join**: Rounded corner.
        - **Bevel Join**: Cut-off corner.
4.  **Miter Angle**:
    - **Input**: Numeric degrees (e.g., `28.96°`).
    - **Condition**: Enabled only when "Miter Join" is active.
    - **Purpose**: Sets the threshold angle before a miter becomes a bevel.

## 3. Stroke Sides Selector Menu
A dropdown menu triggered by the Sides Selector icon in the main panel.

### Options
- **All** (Default): Stroke applied to all 4 sides. Icon: Full square.
- **Top**: Stroke on top edge only.
- **Bottom**: Stroke on bottom edge only.
- **Left**: Stroke on left edge only.
- **Right**: Stroke on right edge only.
- **Custom**: Active if a non-standard combination is selected (e.g., Top + Left). Opens a custom side picker dialog.

### Behavior
- **Selection**: Clicking an option applies it immediately and closes the menu.
- **Visual State**: Selected option has a checkmark and blue highlight.

## Summary Table

| Feature | Type | Description |
| :--- | :--- | :--- |
| **Multiple Strokes** | Stack | Supports stacking multiple stroke layers. |
| **Weight** | Input | Stroke thickness in pixels. |
| **Position** | Dropdown | Inside, Center, Outside. |
| **Sides** | Menu | All, Top, Bottom, Left, Right, Custom. |
| **Style** | Dropdown | Solid, Dashed, Dotted. |
| **Joins** | Toggle | Miter, Round, Bevel. |
| **Miter Angle** | Input | Threshold for sharp corners. |
| **Width Profile** | Editor | Custom width modulation (Basic/Dynamic). |
