# UI Design System & Component Library
**Theme:** Teenage Engineering Inspired (Industrial, Tactile, Functional)

## 1. Design Philosophy
The interface should feel like a physical instrument. It prioritizes muscle memory, precision, and clarity over decorative flair.
- **Tactile:** Controls should invite interaction. Buttons feel "clicky", knobs feel "weighted".
- **Industrial:** Use of raw materials metaphors (matte plastic, brushed metal looks via flat colors), visible structural lines, and technical typography.
- **High Contrast:** Critical information stands out immediately. Active states are unambiguous.
- **Flat but Deep:** Use borders and subtle shadows to create depth without skeuomorphism.

## 2. Color Palette

### 2.1 Primary Accents
Used for active states, selection, and primary actions.
- **TE Orange:** `#FF4D00` (Main Brand/Action color)
- **Electric Blue:** `#0055FF` (Selection, Focus rings)
- **Signal Green:** `#00FF41` (Success, Active Indicators)

### 2.2 Neutrals (Light Mode)
- **Surface 0 (App Bg):** `#F2F2F2` (Warm light gray)
- **Surface 1 (Panels):** `#E6E6E6`
- **Surface 2 (Inputs/Wells):** `#D9D9D9`
- **Border:** `#B3B3B3`
- **Text Primary:** `#1A1A1A`
- **Text Secondary:** `#666666`

### 2.3 Neutrals (Dark Mode)
- **Surface 0 (App Bg):** `#1A1A1A`
- **Surface 1 (Panels):** `#262626`
- **Surface 2 (Inputs/Wells):** `#0D0D0D`
- **Border:** `#404040`
- **Text Primary:** `#F2F2F2`
- **Text Secondary:** `#999999`

## 3. Typography
- **UI Font:** `Inter` (Weights: 400, 500, 600). Clean, legible, neutral.
- **Data/Code Font:** `JetBrains Mono` (Weights: 400, 500). Used for all numerical values, inputs, and code editors.
- **Scale:**
    - Label: 10px (Uppercase, tracking: 0.5px)
    - Body: 12px
    - Value: 13px (Mono)
    - Header: 14px (Medium)

## 4. Component Library

### 4.1 Inputs & Controls
**The "Knob" (Rotary Control)**
- **Usage:** For continuous values (Rotation, Opacity, Volume).
- **Interaction:** Click and drag up/down to change value. Double click to reset.
- **Visual:** A circular SVG with a tick mark indicating position.
- **Feedback:** A ring fills up as the value increases.

**The "Mechanical Switch" (Toggle)**
- **Usage:** Boolean states (On/Off, Show/Hide).
- **Visual:** Rectangular block that slides physically.
- **State:**
    - OFF: Gray background, circle left.
    - ON: Accent color background, circle right.

**Segmented Control (Radio Group)**
- **Usage:** Mutually exclusive options (Alignment: Left/Center/Right).
- **Visual:** A single container with dividers. The selected segment has a solid fill (Inverted text color).

**Numeric Input**
- **Visual:** Transparent background, bottom border only (or subtle well).
- **Font:** Monospace.
- **Interaction:** Draggable label (scrubbing) to change value.

### 4.2 Buttons
**Primary Action**
- Solid Fill (TE Orange).
- Uppercase Label.
- Sharp corners (0px or 2px border radius).

**Tool Button**
- Icon only or Icon + Label.
- State:
    - Default: Transparent.
    - Hover: Light gray background.
    - Active: Inverted (Black bg, White text).

### 4.3 Feedback & Indicators
**LED Indicator**
- Small (4px) circle.
- Colors: Green (Active/Good), Red (Error/Recording), Yellow (Warning).
- Animation: Subtle pulse when active.

**Toast/Notification**
- Minimal strip at the bottom/top.
- Monospace text.
- No close button (auto-dismiss).

## 5. Layout & Spacing
- **Grid:** 4px baseline grid. All spacing/sizing should be multiples of 4 (4, 8, 12, 16, 24).
- **Borders:** 1px solid borders are used to define regions. No drop shadows for layout separation, only borders.
- **Density:** High density. This is a pro tool.

## 6. Motion Design
- **Duration:** Fast (150ms - 250ms).
- **Easing:** `cubic-bezier(0.2, 0.0, 0.2, 1)` (Snappy, mechanical).
- **Micro-interactions:**
    - Hovering a button instantly snaps to hover state (0ms).
    - Toggling a switch slides with a spring effect.
    - Opening a panel slides it in from the edge.
