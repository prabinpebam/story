# Property Inspector: Export Specification

## Overview
This document details the "Export" section of the Property Inspector. This section allows users to configure output settings for selected layers, supporting multiple formats, scales, and simultaneous exports.

## 1. Export Section Header
- **Title**: "Export".
- **Actions**:
    - **Add (+)**: Adds a new export preset row.
    - **Collapse/Expand**: Clicking the header toggles the section visibility (Standard behavior).

## 2. Export Preset Row
Each row represents a single output configuration. Users can add multiple rows to export the same object in different formats/scales simultaneously (e.g., 1x PNG and 2x JPG).

### UI Elements (Left to Right)

**1. Scale Selector**
- **Type**: Dropdown.
- **Default**: `1x`.
- **Options**:
    - `0.5x`, `0.75x`
    - `1x`, `1.5x`, `2x`, `3x`, `4x`
    - `512w`, `512h` (Width/Height constraints)
- **Purpose**: Defines the output resolution scaling relative to the layer's dimensions.

**2. Suffix Input (Optional/Hidden by default)**
- **Type**: Text Input.
- **Purpose**: Appends text to the filename (e.g., `@2x`, `-thumb`).
- **Behavior**: Often auto-populated based on Scale (e.g., selecting `2x` adds `@2x`).

**3. Format Selector**
- **Type**: Dropdown.
- **Default**: `PNG`.
- **Options**:
    - `PNG`: Portable Network Graphics (Supports transparency).
    - `JPG`: JPEG (Compressed, no transparency).
    - `SVG`: Scalable Vector Graphics.
    - `PDF`: Portable Document Format.
    - `WEBP`: Web Picture format.

**4. More Options (...)**
- **Type**: Icon Button (Three dots).
- **Menu Content**:
    - **Ignore overlapping layers**: Export only the selected layer content.
    - **Include bounding box**: Export with padding.
    - **Color Profile**: sRGB / P3 (if supported).

**5. Remove (-)**
- **Type**: Icon Button (Minus).
- **Action**: Deletes the specific export preset row.

## 3. Export Action
A primary button located below the preset list.

- **Label**: "Export [Layer Name]" (e.g., "Export Rectangle 19").
- **Behavior**:
    - Triggers the export process for **all** configured presets in the list.
    - Opens the system file save dialog or downloads the file(s).
    - If multiple presets exist, they may be zipped or saved individually.

## 4. Preview Section
A collapsible area showing a live preview of the export.

- **Header**: "Preview".
- **Content**:
    - **Canvas**: Checkerboard background (to show transparency).
    - **Image**: Rendered preview of the selected layer(s) with current export settings applied.
- **Behavior**:
    - Updates in real-time when layer content or export settings change.
    - Supports basic zoom/pan if the preview is large.

## Summary Table

| Feature | Type | Description |
| :--- | :--- | :--- |
| **Add Preset (+)** | Action | Adds a new export configuration row. |
| **Scale** | Dropdown | Output resolution (1x, 2x, 512w, etc.). |
| **Format** | Dropdown | File format (PNG, JPG, SVG, PDF). |
| **Suffix** | Input | Filename suffix (e.g., @2x). |
| **More Options** | Menu | Advanced settings (Ignore overlaps, etc.). |
| **Remove (-)** | Action | Deletes the preset row. |
| **Export Button** | Button | Triggers export for all presets. |
| **Preview** | Panel | Visual preview of the output. |
