# Unified Color & Paint Picker Specification

## Overview
This document details the design and functionality of the unified **Color & Paint Picker** component. This is a reusable floating panel used throughout the application whenever a color or paint resource needs to be selected.

**Usage Contexts:**
- **Fill**: Full functionality (Solid, Gradient, Image).
- **Stroke**: Full functionality (Solid, Gradient). Image mode may be disabled depending on engine support.
- **Effects (Shadows/Glows)**: Typically restricted to **Solid Color** mode only.
- **Text Color**: Typically restricted to **Solid Color** or **Gradient**.

## Visual Style & Token Mapping
The Color Picker follows the **Professional Creative Tool** design system defined in `ui-design-system.md`.

- **Theme**: Dark Mode (Always, to match Property Inspector).
- **Background**: `--color-bg-panel` (`#2C2C2C`).
- **Width**: `240px` (Fixed).
- **Corner Radius**: `--radius-md` (`8px`).
- **Shadow**: Deep drop shadow (`0 8px 24px rgba(0,0,0,0.5)`).
- **Padding**: `--spacing-3` (`12px`).
- **Typography**:
    - Labels: `--font-size-sm` (`11px`), `--color-text-secondary`.
    - Values: `--font-size-md` (`12px`), `--color-text-primary`.

## Layout Structure

### 1. Header (Global)
- **Tabs**:
    - **Custom** (Active): Manual color selection.
    - **Libraries** (Inactive): Saved styles/variables. (for future)
    - *Style*: Text-only tabs, active state has `--color-text-primary` and maybe a bottom border.
- **Actions**:
    - **Add (+)**: Create a new style from current color.
    - **Close (X)**: Close the picker.
    - *Style*: Icon buttons, hover state `--color-bg-hover`.

### 2. Paint Mode Selector (Global)
A row of icon buttons to switch between paint modes. The available icons may vary based on the context (e.g., Shadows may only show Solid Color).

- **Icons**:
    1.  **Solid Color** (Square icon).
    2.  **Gradient** (Fade icon).  
    3.  **Image** (Image icon).
    4.  **Video Fill** (Video icon - optional/grouped).    


*Visual*: Icons are `--color-text-secondary` (`#888`) by default. Active state has `--color-bg-active` (or subtle highlight) and `--color-text-primary` (`#FFF`).

---

## Tab 1: Solid Color Fill
This UI appears when the **Solid Color** icon is active.

### 1. Main Color Area (HSB)
- **Component**: Large square area.
- **X-Axis**: Saturation (0-100%).
- **Y-Axis**: Brightness (100-0%).
- **Interaction**: Draggable circle handle (White ring, black fill/transparent).
- **Height**: Approx `200px` (or aspect ratio 1:1 minus controls).

### 2. Sliders
- **Hue Slider**: Rainbow gradient bar (0–360º). Circular handle.
- **Alpha Slider**: Gradient from Transparent (Checkered) to Current Color. Circular handle.
- *Style*: Height `8px` to `12px`, Handle `12px` circle with shadow.

### 3. Eyedropper Tool
- **Icon**: Pipette below the color square.
- **Action**: Activates screen color picking mode.

### 4. Color Format & Inputs
- **Format Dropdown**: Hex, RGB, CSS, HSL. (Default: Hex).
    - *Style*: Background `--color-bg-input` (`#383838`), Text `--color-text-primary`.
- **Hex Input**: Editable text field (e.g., `000000`).
    - *Style*: Background `--color-bg-input`, Monospace font (`JetBrains Mono`).
- **Opacity Input**: Editable percentage (e.g., `20%`).
    - *Style*: Background `--color-bg-input`.

### 5. Swatch Palette
- **Header**: Dropdown "On this page" / "Document Colors".
- **Grid**: Grid of small color squares representing recent/document colors.
- **Swatch**: Rounded square (`4px` radius), `24x24px`. Border `--color-border` (`#444444`) for light colors.

---

## Tab 2: Gradient Fill
This UI appears when any **Gradient** icon (Linear, Radial, Angular, Diamond) is active.

### 1. Gradient Type Selector
- **Dropdown**: Shows current type (e.g., "Linear"). Allows switching to Radial, Angular, Diamond.
- *Style*: Standard Dropdown (`--color-bg-input`).

### 2. Gradient Controls
- **Reverse Gradient**: Icon button (Double arrow ↔). Flips start/end stops.
- **Rotate Gradient**: Icon button (Circular arrow). Rotates gradient angle (e.g., +90°).

### 3. Gradient Preview Bar
- **Visual**: Horizontal bar showing the blended gradient.
- **Stops**: Circular handles on the bar.
    - **Selected Stop**: Blue outline (`--color-accent`).
    - **Interaction**: Drag to move, Click to select, Click bar to add.

### 4. Gradient Stops List
A list of all stops. Each row contains:
- **Position**: Input (e.g., `0%`).
- **Color Swatch**: Preview of stop color.
- **Hex Input**: Editable color value.
- **Opacity Input**: Stop opacity %.
- **Delete (-)**: Button to remove stop.
- **Add (+)**: Button to add a new stop.

*(Note: Selecting a stop also reveals the Solid Color controls (HSB, Sliders) to edit that specific stop's color).*

---

## Tab 3: Image Fill
This UI appears when the **Image** icon is active.

### 1. Fill Type Selector
- **Dropdown**: Selects how the image fits the layer.
    - Options: `Fill`, `Fit`, `Crop`, `Tile`.
    - *Style*: Standard Dropdown (`--color-bg-input`).

### 2. Transform Tools
- **Flip Horizontal**: Icon button.
- **Flip Vertical**: Icon button.

### 3. Image Preview Box
- **Visual**: Large checkerboard square.
- **Content**: Shows thumbnail of current image. Empty if none.
- **Border**: `1px solid --color-border`.

### 4. Primary Image Controls
- **Upload**: Button "Choose image..." (Opens file dialog).
    - *Style*: Secondary Button (Transparent or `--color-bg-input`).
- **AI Generation**: Button "Make an image" (Sparkle icon).
    - *Style*: Primary Button (`--color-accent`) or Special Gradient.

### 5. Edit Image Button
- **Action**: Opens advanced image editing tools (Crop, Filters). Visible when image exists.

### 6. Adjustment Sliders
Scrollable list of non-destructive image corrections (Range -100 to +100).
- **Exposure**
- **Contrast**
- **Saturation**
- **Temperature**
- **Tint**
- **Highlights**
- **Shadows**
- *Style*: Slider track `--color-bg-input`, Active track `--color-accent`, Handle white circle.

---

## Summary Table (All Tabs)

| Category | Solid | Gradient | Image |
| :--- | :--- | :--- | :--- |
| **Color Picker** | ✔️ (Main) | ✔️ (Per stop) | ❌ |
| **Hue / SV / Alpha** | ✔️ | ✔️ (Per stop) | ❌ |
| **Gradient Types** | ❌ | ✔️ (4 types) | ❌ |
| **Gradient Stops** | ❌ | ✔️ (Add/Edit) | ❌ |
| **Image Upload** | ❌ | ❌ | ✔️ |
| **Image Adjustments** | ❌ | ❌ | ✔️ |
| **Fill Type Switch** | ✔️ | ✔️ | ✔️ |
| **Libraries** | ✔️ | ✔️ | ✔️ |

