# Property Inspector: Layout & Appearance Specification

## Overview
This document details the "Layout" and "Appearance" sections of the Property Inspector. These sections control the dimensions, constraints, visibility, and fundamental styling properties of selected layers.

## 1. Layout Section
This section controls the geometric dimensions of the selected object.

### UI Elements

**1. Dimensions Group (W & H)**
- **Width (W) Input**:
    - **Label**: "W" (Prefix).
    - **Value**: Numeric (e.g., `1164`).
    - **Units**: Pixels.
    - **Behavior**:
        - Editable numeric field.
        - Scrubbable label (drag left/right).
        - Keyboard support (Arrow keys, Shift+Arrow).
        - Accepts decimals.
- **Height (H) Input**:
    - **Label**: "H" (Prefix).
    - **Value**: Numeric (e.g., `1108`).
    - **Units**: Pixels.
    - **Behavior**: Same as Width.

**2. Constrain Proportions (Scale Lock)**
- **Icon**: Two squares connected by a diagonal line (Link/Chain icon), located to the right of the dimensions row.
- **Type**: Toggle Button.
- **Purpose**: Locks the aspect ratio between Width and Height.
- **Behavior**:
    - **Enabled**: Changing W automatically adjusts H to maintain the ratio (and vice versa).
    - **Disabled**: W and H change independently.
    - **State**: Visual indication when active (e.g., darker background or accent color).

### Text-Specific Layout Parameters
When a text object is selected, the Layout section includes additional resizing controls.

| UI Element | Functionality | UI Design |
| :--- | :--- | :--- |
| **Auto Size** | **Auto Size:** Both width and height automatically adjust to fit the text content. The anchor point for resizing is determined by the text alignment settings (see Alignment-Based Anchoring below). | An **icon** showing arrows pointing outward in both horizontal and vertical directions, indicating growth in all directions. |
| **Fixed Width** | **Fixed Width:** The width is fixed; height automatically adjusts to fit wrapped content. Horizontal anchor is determined by text-align setting. | An **icon** showing a horizontal constraint bar with vertical arrows, indicating fixed width but flexible height. |
| **Fixed Size** | **Fixed Size:** Both width and height are fixed as specified by W and H values. Text may overflow the bounds. | An **icon** showing a fully constrained box with fixed dimensions. |

#### Alignment-Based Anchoring
When a text element resizes automatically (in Auto Size or Fixed Width mode), the **anchor point** that remains fixed is determined by the text alignment:

- **Horizontal Anchor**: Set by Text Align (Left → left edge fixed, Center → center fixed, Right → right edge fixed)
- **Vertical Anchor**: Set by Vertical Align (Top → top edge fixed, Middle → center fixed, Bottom → bottom edge fixed)

This creates a 9-point anchor grid. For example, center-aligned text with top vertical alignment will resize symmetrically left/right while the top edge stays fixed.

See **Text Editing Interaction Specification § 6.2** for detailed behavior.

## 2. Appearance Section
This section manages opacity, corner radius, and high-level visibility/blending settings.

### Section Header
- **Title**: "Appearance".
- **Header Actions** (Right-aligned):
    1.  **Visibility Icon (Eye)**:
        - **Action**: Toggles layer visibility (Show/Hide).
        - **State**: Eye open (Visible) vs. Eye crossed out (Hidden).
    2.  **Fill/Style Icon (Droplet)**:
        - **Action**: Opens the Fill/Style panel or Blend Mode settings.

### UI Elements

**1. Opacity Control**
- **Layout**: Row with Icon and Input.
- **Icon**: Checkerboard pattern (Left of input).
    - **Action**: Clicking may open Blend Mode menu or Opacity slider.
- **Input**:
    - **Value**: Percentage (e.g., `100%`).
    - **Range**: 0% to 100%.
    - **Behavior**: Scrubbable, editable, keyboard support.

**2. Corner Radius Control**
- **Layout**: Row with Input and Toggle Icon.
- **Input**:
    - **Value**: Numeric (e.g., `0`).
    - **Purpose**: Sets the corner radius for the shape.
    - **Behavior**: Applies uniform radius to all corners unless expanded.
- **Per-Corner Radius Toggle**:
    - **Icon**: Four small squares / corners (Right of input).
    - **Action**: Toggles between "Uniform" mode and "Individual" mode.
    - **Individual Mode**: Expands to show 4 separate inputs (Top-Left, Top-Right, Bottom-Right, Bottom-Left).

## Summary Table

| Feature | Type | Description |
| :--- | :--- | :--- |
| **W Input** | Numeric Input | Controls width of layer. |
| **H Input** | Numeric Input | Controls height of layer. |
| **Constrain Proportions** | Toggle Button | Locks width–height aspect ratio. |
| **Visibility Toggle** | Action Button | Show/hide entire layer (Eye icon). |
| **Fill/Style Icon** | Action Button | Opens fill or appearance editor (Droplet). |
| **Opacity Input** | % Input | Layer opacity (0–100%). |
| **Opacity Icon** | Action Button | Opens opacity/blend settings. |
| **Corner Radius** | Numeric Input | Uniform corner roundness. |
| **Corner Radius Toggle** | Toggle Button | Enable per-corner radius values. |
