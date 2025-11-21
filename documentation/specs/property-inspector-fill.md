# Property Inspector: Fill Specification

## Overview
This document details the "Fill" section of the Property Inspector. This section manages the fill properties of selected layers, including solid colors, gradients, and images. It supports stacking multiple fills and advanced configuration via the Fill Flyout (Color Picker).

## 1. Fill Section (Main Panel)
The main panel interface supports stacking multiple fill layers on a single object.

### Header
- **Title**: "Fill".
- **Actions**:
    - **Add (+)**: Adds a new fill layer to the top of the stack.
    - **Style (Grid)**: Opens the Style/Library picker.

### Fill List Item (Per Fill)
Each fill is a row in the list. Fills are rendered from bottom to top (last in list = bottom).

**Row Layout:**
1.  **Color Swatch**:
    - **Visual**: Small square preview (`16x16px` or `20x20px`).
    - **Action**: Opens the [Fill Flyout](#2-fill-flyout-color-picker).
2.  **Value Input**: Hex code (e.g., `000000`) or Variable name.
3.  **Opacity Input**: Percentage (0-100%).
4.  **Visibility (Eye)**: Toggles fill visibility.
5.  **Remove (-)**: Deletes the fill layer.

## 2. Fill Flyout (Color Picker)
A detailed configuration panel that appears when clicking a fill swatch. It handles all fill types: Solid, Gradient, and Image.

### Global Header
- **Tabs**:
    - **Custom** (Active): Manual selection.
    - **Libraries**: Saved styles.
- **Actions**:
    - **Add (+)**: Create new style.
    - **Close (X)**: Dismiss flyout.

### Global Fill Type Selector
A row of icons to switch modes:
1.  **Solid Color**
2.  **Linear Gradient**
3.  **Radial Gradient**
4.  **Angular Gradient**
5.  **Diamond Gradient**
6.  **Image**
7.  **Video** (Optional)
8.  **Code** (Generative Canvas)

---

### Tab 1: Solid Color Fill
Active when "Solid Color" icon is selected.

**1. Main Color Area (HSB)**
- Large square for Saturation (X) and Brightness (Y).
- Draggable circular handle.

**2. Sliders**
- **Hue**: Rainbow gradient bar.
- **Alpha**: Transparency gradient bar.

**3. Eyedropper**
- Icon button to sample screen color.

**4. Inputs**
- **Format**: Dropdown (Hex, RGB, HSL, CSS).
- **Value**: Editable text (e.g., `FF0000`).
- **Opacity**: Percentage input.

**5. Swatch Palette**
- Grid of document/local colors.

---

### Tab 2: Gradient Fill
Active when any Gradient icon is selected.

**1. Gradient Type Selector**
- Dropdown to switch between Linear, Radial, Angular, Diamond.

**2. Gradient Controls**
- **Reverse**: Flips start/end stops.
- **Rotate**: Rotates gradient 90°.

**3. Gradient Preview Bar**
- Visual bar showing the gradient.
- **Stops**: Draggable handles. Click to select/edit color. Click bar to add.

**4. Stops List**
- List of all stops with Position %, Color Swatch, Hex, Opacity, and Delete/Add buttons.

---

### Tab 3: Image Fill
Active when "Image" icon is selected.

**1. Fill Mode**
- Dropdown: `Fill`, `Fit`, `Crop`, `Tile`.

**2. Transform**
- Flip Horizontal / Vertical buttons.

**3. Preview**
- Large thumbnail of the image.

**4. Source Actions**
- **Upload**: "Choose image..." button.
- **AI Generation**: "Make an image" button.

**5. Edit**
- "Edit image" button (opens advanced crop/filter tools).

**6. Adjustments**
- Sliders for Exposure, Contrast, Saturation, Temperature, Tint, Highlights, Shadows.

---

### Tab 4: Code Fill (Generative)
Active when "Code" icon is selected. This mode allows users to write JavaScript (Canvas API) to generate dynamic textures or animations.

**1. AI Generator**
- **Prompt Input**: Textarea for natural language description (e.g., "Retro synthwave grid").
- **Generate Button**: Triggers AI generation of the code.

**2. Code Editor**
- **Editor Area**: Monospace text area for raw JavaScript code.
- **Syntax**: Expects a returned object with a `draw(t)` function.
- **Context**: Provides `ctx` (CanvasContext), `w` (width), `h` (height), `t` (time).

**3. Preview/Controls**
- **Run/Stop**: Toggle animation.
- **Error Log**: Display area for compilation/runtime errors.

## Summary Table

| Feature | Type | Description |
| :--- | :--- | :--- |
| **Multiple Fills** | Stack | Supports stacking multiple fill layers. |
| **Solid Fill** | Mode | HSB picker, Hex/RGB inputs. |
| **Gradient Fill** | Mode | Linear, Radial, Angular, Diamond. Stop editing. |
| **Image Fill** | Mode | Upload, AI Gen, Adjustments (Contrast, etc.). |
| **Code Fill** | Mode | JavaScript (Canvas API) for dynamic content. |
| **Opacity** | Input | Layer opacity. |
| **Visibility** | Toggle | Show/Hide fill. |
