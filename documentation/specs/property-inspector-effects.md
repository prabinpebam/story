# Property Inspector: Effects Specification

## Overview
This document details the "Effects" section of the Property Inspector. This section manages visual effects applied to selected layers, such as Drop Shadows, Inner Shadows, Layer Blurs, and Background Blurs. It supports stacking multiple effects and configuring them via a detailed floating modal.

## 1. The Effects Stack (Right Panel)
This is the main control panel where effects are managed and stacked.

### Section Header
- **Title**: "Effects".
- **Actions**:
    - **Style Icon (Four Dots)**: Opens the "Effects Styles" library to choose a pre-saved style.
    - **Plus (+) Icon**: Adds a new effect layer to the stack (Default: Drop Shadow).

### Effect Layers (The List)
Each effect is a row in the list. Effects are rendered in order.

**Row Layout:**
1.  **Selection Indicator**:
    - The row currently being edited is highlighted (e.g., blue background or border), indicating it corresponds to the open Settings Modal.
2.  **Effect Icon**:
    - Visual indicator of the effect type (e.g., Square with shadow for Drop Shadow, Grid for Blur).
    - Clicking the icon or the name opens/toggles the [Detailed Settings Modal](#2-the-detailed-settings-modal-left-floating-window).
3.  **Effect Name**:
    - Text displaying the type (e.g., "Drop shadow", "Layer blur").
    - Clicking the name opens/toggles the [Detailed Settings Modal](#2-the-detailed-settings-modal-left-floating-window).
4.  **Layer Controls (Right Aligned)**:
    - **Visibility Toggle (Eye Icon)**: Hides/Shows the effect without deleting it.
    - **Remove Button (Minus Icon)**: Deletes the specific effect from the object.

## 2. The Detailed Settings Modal (Left Floating Window)
A floating window that appears to the left of the Property Inspector when an effect row is clicked. It allows editing specific properties of the selected effect.

### Header
- **Effect Type Dropdown** (Top-Left):
    - Allows changing the effect type.
    - Options: `Drop Shadow`, `Inner Shadow`, `Layer Blur`, `Background Blur`.
- **Blend Mode** (Top-Right):
    - Icon: Water Drop.
    - Options: `Normal`, `Multiply`, `Overlay`, `Screen`, etc.
- **Close Button (X)**: Closes the modal.

### Properties (Shadows)
For `Drop Shadow` and `Inner Shadow`.

1.  **Position (X & Y)**:
    - **X**: Horizontal offset (e.g., `0`).
    - **Y**: Vertical offset (e.g., `4`).
2.  **Blur**:
    - Controls "softness" or radius. Higher = more diffuse.
3.  **Spread**:
    - Controls expansion/contraction of shadow size. Positive = larger, Negative = smaller.
4.  **Color & Opacity**:
    - **Color Swatch**: Small square preview.
    - **Hex Code**: Input (e.g., `000000`).
    - **Opacity**: Percentage input (e.g., `25%`).

### Properties (Blurs)
For `Layer Blur` and `Background Blur`.

1.  **Blur Radius**:
    - Single input controlling the intensity of the blur.

## 3. Interaction Model
- **Opening**: Clicking the Effect Icon or Name in the stack opens the modal anchored to the left of the row.
- **Closing**: Clicking the Close (X) button, clicking the row again, or clicking outside the modal/inspector.
- **Live Updates**: Changes in the modal are reflected immediately on the canvas.
