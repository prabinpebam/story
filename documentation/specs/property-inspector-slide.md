# Property Inspector: Slide & Master Specification

## Overview
This document details the "Slide" and "Master" properties section of the Property Inspector. This view is active when **no elements are selected** on the canvas, or when the Slide/Master itself is explicitly selected.

It manages high-level properties like dimensions, background, layout association, and theme settings.

## 1. Header
- **Title**: 
    - "Slide" (in Edit Mode).
    - "Master / Layout" (in Master Mode).
- **Actions**: None standard.

## 2. General Settings

### Name (Master Mode Only)
- **Label**: "Name".
- **Control**: Text Input.
- **Behavior**: Renames the current Master or Layout.

### Layout Picker (Slide Mode Only)
- **Label**: "Layout".
- **Control**: Dropdown.
- **Content**: List of available layouts from the current theme.
- **Behavior**: Switches the slide's layout, inheriting background/elements from the new layout.

### Hide Background Graphics
- **Condition**: Visible for Slides and Layouts (not Theme Masters).
- **Label**: "Hide Theme Graphics" (Master Mode) / "Hide Background Graphics" (Slide Mode).
- **Control**: Toggle Switch.
- **Behavior**: Hides elements inherited from the parent (Layout or Theme).

## 3. Dimensions
- **Layout**: Two columns (W, H).
- **Controls**:
    - **Width (W)**: Numeric Input.
    - **Height (H)**: Numeric Input.
- **Behavior**: Resizes the canvas.

## 4. Background
- **Label**: "Background".
- **Type Selector**: Dropdown.
    - **Options**: `Inherited`, `Solid`, `Gradient`, `Image`, `Code`.
    - *Note*: "Inherited" is default for Slides/Layouts. "Theme" masters cannot inherit.

### Background Controls (Per Type)
- **Inherited**: No controls. Shows "Using background from [Parent Name]".
- **Solid**: Color Swatch + Hex Input.
- **Gradient**: Gradient Editor (Same as Fill).
- **Image**: Image Picker + Scale Mode (Same as Fill).
- **Code**: AI Generator + Code Editor (Same as Fill).

## 5. Theme Settings (Theme Master Only)
Only visible when editing the root "Theme" master.

### Colors
- **Label**: "Colors".
- **List**:
    - **Accent**: Color Input.
    - **Text Primary**: Color Input.
    - **Text Secondary**: Color Input.

### Fonts
- **Label**: "Fonts".
- **List**:
    - **Heading**: Font Family Dropdown.
    - **Body**: Font Family Dropdown.

## Summary Table

| Feature | Context | Control | Description |
| :--- | :--- | :--- | :--- |
| **Name** | Master | Input | Rename master/layout. |
| **Layout** | Slide | Dropdown | Change assigned layout. |
| **Hide Graphics** | Slide/Layout | Toggle | Hide parent elements. |
| **Dimensions** | All | Inputs | Canvas W/H. |
| **Background** | All | Dropdown | Inherited/Solid/etc. |
| **Theme Colors** | Theme | Inputs | Global color palette. |
| **Theme Fonts** | Theme | Dropdowns | Global font settings. |
