# UI Design System & Component Library
**Theme:** Professional Creative Tool (High Density, Focused, Tactile)

## 1. Design Philosophy
The interface is designed for professional workflows, balancing the density of a complex editor (like Figma) with tactile, clear interactions.
- **Content First:** The UI recedes to let the user's work take center stage.
- **High Density:** Controls are compact to maximize screen real estate for the canvas.
- **Clear Hierarchy:** Use contrast and spacing (not decoration) to group related controls.
- **Tactile Feedback:** Hover states, focus rings, and active states provide immediate, clear feedback.

## 2. Color Palette & Tokens
The system relies on CSS variables defined in `styles/main.css`.

### 2.1 Primary Accents
- **Accent Blue:** `--color-accent` (`#18A0FB`) - Used for selection, focus rings, and active toggles.
- **Brand/Action:** `--color-accent-hover` (`#0D86D7`) - Darker shade for interactions.
- **Selection Surface:** `--color-selection` (`rgba(24, 160, 251, 0.1)`) - Light blue wash for selected items.

### 2.2 Neutrals (Dark Mode Default)
The app defaults to a dark theme for the editor interface.
- **App Background:** `--color-bg-app` (`#1E1E1E`) - The main window background.
- **Panel Background:** `--color-bg-panel` (`#2C2C2C`) - Sidebars and floating panels.
- **Input Background:** `--color-bg-input` (`#383838`) - Text fields and dropdowns.
- **Input Hover:** `--color-bg-hover` (`#444444`) - Interactive elements on hover.
- **Border:** `--color-border` (`#444444`) - Subtle dividers and container borders.

### 2.3 Text Colors
- **Primary:** `--color-text-primary` (`#FFFFFF`) - Values, Input text, Headers.
- **Secondary:** `--color-text-secondary` (`#B3B3B3`) - Labels, Icons, Placeholder text.
- **Disabled:** `--color-text-disabled` (`#666666`) - Inactive controls.

## 3. Typography
- **UI Font:** `Inter` (Weights: 400, 500, 600).
- **Mono Font:** `JetBrains Mono` (Weights: 400). Used for numeric values and code.

**Type Scale:**
- **Label (XS):** `10px` / `11px` (`--font-size-xs`, `--font-size-sm`) - Property labels.
- **Body (S):** `12px` (`--font-size-md`) - Standard UI text, Input values.
- **Header (M):** `13px` / `14px` (`--font-size-lg`) - Section headers.

## 4. Component Library

### 4.1 Inputs & Controls
**Numeric Input**
- **Visual:** Filled container (`--color-bg-input`), Rounded corners (`2px`).
- **Interaction:**
    - **Hover:** Background lightens (`--color-bg-hover`).
    - **Focus:** Blue border (`1px solid --color-accent`).
    - **Scrub:** Dragging the label adjusts the value.

**Dropdowns**
- **Visual:** Same styling as Inputs. Chevron icon on the right.
- **Menu:** Floating panel with `--color-bg-panel`, shadow, and border.

**Toggles (Switch)**
- **Visual:** Pill shape.
- **State:**
    - **Off:** Gray outline or dark fill.
    - **On:** Solid Blue fill (`--color-accent`).

**Color Swatch**
- **Visual:** Rounded square (`2px` radius).
- **Interaction:** Click opens the Color Picker.
- **Border:** `1px solid --color-border` (to separate from bg).

### 4.2 Buttons
**Icon Button**
- **Visual:** Transparent background, `16px` icon.
- **Interaction:**
    - **Hover:** Square or rounded background (`--color-bg-hover`).
    - **Active:** Darker background or Blue tint.

**Primary Button**
- **Visual:** Solid Blue fill (`--color-accent`), White text.
- **Radius:** `4px`.

## 5. Layout & Spacing
- **Grid:** 4px baseline grid.
- **Density:** High.
    - **Row Height:** `32px`.
    - **Input Height:** `28px`.
    - **Gap:** `8px` between columns.
    - **Padding:** `12px` horizontal for panels.

## 6. Motion
- **Duration:** Fast (`150ms`).
- **Easing:** Ease-out.
- **Usage:** Hover states, focus rings, and simple panel slides. Avoid excessive animation that slows down workflow.

## 7. Property Inspector Specifics
The Property Inspector utilizes the core system but enforces specific high-density rules:
- **Labels:** Always `11px` (`--color-text-secondary`).
- **Values:** Always `12px` (`--color-text-primary`).
- **Inputs:** Background `#383838` (Surface 2).
- **Icons:** `16px`, color `#E0E0E0`.

