# Property Inspector: Fill Specification

## Overview
This document details the "Fill" section of the Property Inspector. This section manages the fill properties of selected layers, including solid colors, gradients, images, and code fills.

### 1. The Color Picker Flyout (Left Panel)
This is the "Custom" color editing window that appears when you click on a color swatch in the right-hand panel.

**Top Navigation & View Modes**
* **Tabs (Custom / Libraries):** Allows switching between the manual color picker ("Custom") and pre-defined color styles saved in your design system ("Libraries").
* **Add to Library (+):** Saves the current color as a reusable Style.
* **Close (X):** Closes the flyout.

**Fill Type Selectors (The Row of Icons)**
* **Solid (Selected):** Applies a single, flat color.
* **Gradient:** Changes the fill to a gradient (linear, radial, angular, or diamond).
* **Image:** Allows you to upload an image to use as a fill texture.
* **Video:** Allows you to upload a video file as a fill.
* **Code:** Generates a fill using AI or custom code.
* **Blend Mode (Water Drop):** Changes how this specific fill layer blends with the layers beneath it (e.g., Multiply, Screen).
* **Visibility (Eye Slash):** Toggles the visibility of the color you are currently editing without closing the window.

**Color Selection Tools**
* **HSB Color Field (The large square):** This area allows you to pick the **Saturation** (horizontal axis) and **Brightness/Value** (vertical axis) of the color. The white circle indicates the currently selected shade (Black).
* **Hue Slider (Rainbow Bar):** Selects the base pigment (Hue) of the color.
* **Opacity Slider (Checkerboard Bar):** Controls the alpha transparency. The knob is positioned to the left, indicating low opacity.
* **Eyedropper Tool:** Allows you to sample a color from anywhere else on your screen.

**Numerical Inputs**
* **Color Model Dropdown:** Currently set to **Hex**, but can be changed to RGB, HSL, HSB, or CSS.
* **Hex Code:** Displays the current color value (`000000` for Black).
* **Opacity Percentage:** Displays the transparency value (`20%`).

**Document Colors (Bottom Section)**
* **"On this page" Dropdown:** A collapsible section showing color palettes.
* **Color Swatches:** A grid of colors that are already being used elsewhere in the current document. This helps maintain consistency by allowing you to quickly reuse existing colors.

---

### 2. The Fill Section (Right Sidebar)
This section manages the stack of fills applied to the selected object. Note that Figma allows **multiple fills** on a single object.

* **Section Header:**
    * **"Fill" Title:** Identifies the section.
    * **Style Icon (Four Dots):** Opens the library to apply a saved Color Style.
    * **Plus (+):** Adds a new fill layer on top of the existing ones.
* **The Fill Stack (List of 3 Layers):**
    * **Layer 1 (Top):** Black (`000000`) at `20%` opacity.
    * **Layer 2 (Middle):** Black (`000000`) at `20%` opacity.
    * **Layer 3 (Bottom):** Light Grey (`D9D9D9`) at `100%` opacity.
    * *Note:* This stacking order matters; the top layers (being semi-transparent) will tint the solid grey layer at the bottom.
* **Layer Controls:**
    * **Color Swatch:** Clicking the small square opens the Color Picker flyout (the window on the left).
    * **Hex Code:** Shows the color value.
    * **Opacity %:** Shows transparency.
    * **Visibility (Eye Icon):** Toggles that specific fill layer on/off.
    * **Remove (Minus Icon):** Deletes that specific fill layer.
