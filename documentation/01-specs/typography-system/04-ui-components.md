# UI Component Specifications

## UX Principle: "Edit with the styles you have"

To prevent "font soup" (inconsistent typography across slides), the UI should encourage staying within the active theme.

### 1. The "Theme First" Approach
- **Primary Action**: When a user wants to change the look of text, the primary control should be the **Style Selector** (Title, Body, Caption).
- **Secondary Action**: Changing raw properties (Font Family, Size) is treated as an **Override**.
- **Visual Hierarchy**: The Style Selector should be prominent. The raw font controls should be secondary or grouped under "Customization".

### 2. Override Feedback
- **Explicit Opt-Out**: If a user manually changes the Font Family to something not in the theme, the UI must clearly indicate that this element is now **Detached** or **Overridden**.
- **Reset Path**: A clear "Reset to Theme" button must be available to re-link the element.

## Design System Compliance

All UI components must strictly adhere to the Story Design System (`documentation/01-specs/ui-system/design-system-overview.md`).

### Component Usage
- **Dropdowns**: Use `src/ui/components/Dropdown.js`.
- **Inputs**: Use `src/ui/components/NumberInput.js` for font sizes (supports scrubbing).
- **Toggles**: Use `src/ui/components/SegmentedControl.js` for alignment (Left/Center/Right).
- **Panels**: Use standard panel classes (`.panel`, `.panel__header`) and tokens (`--color-bg-panel`).

### Token Usage
- **Spacing**: Use `--spacing-2` (8px) for gaps between controls.
- **Typography**: Use `--font-size-sm` (11px) for property labels.
- **Colors**: Use `--color-text-secondary` for labels, `--color-text-primary` for values.

---

## 1. Typography Style Manager
**File**: `src/ui/panels/TypographyStyleManager.js`

A floating, draggable panel designed for high-level theme management.

### Functional Requirements
- **Tabs**:
  1. **Presets**: Grid view of available `FontPresets`.
     - **Preview**: Hovering a preset temporarily applies it to the canvas (without saving to history).
     - **Selection**: Clicking applies the preset to the active Master Slide.
  2. **Custom**: UI for fine-tuning the current theme.
     - **Font Pairing**: Dropdowns for global "Heading" and "Body" font families.
     - **Style Editors**: Collapsible sections for each semantic role (`Title`, `Body`, etc.).
     - **Editable Properties**: Font Size, Weight, Line Height, Letter Spacing.
  3. **AI**: Interface for generative pairing (Future).

### Implementation Details
- **State Access**: Reads `activeMasterId` to determine target context.
- **Actions**:
  - `APPLY_FONT_PRESET`: Sets the `typographyStyleId` on the master.
  - `UPDATE_TEXT_STYLE`: Updates specific properties of a semantic role (Custom tab).
  - `UPDATE_THEME_FONT`: Updates the global font family definitions.

---

## 2. Property Inspector: Text Section
**File**: `src/ui/properties/TextSection.js`

The context-sensitive controls that appear when a text element is selected.

### Detailed UX Specification
For comprehensive task flows, override behaviors, and visual states, refer to **[Typography UX Workflows](./08-ux-workflows.md)**.

### Functional Requirements
- **Style Selector**: Dropdown showing the current semantic role (e.g., "Title", "Body").
  - **Action**: Changing this updates `element.textStyleId` and **clears** all manual overrides (resets to new style).
- **Style Status Indicators**:
  - **Linked**: When a property matches the theme, show a "Linked" icon or state (subtle).
  - **Overridden**: If a property (e.g., Size) is manually changed, highlight the label or show a "Reset" icon next to it.
  - **Master Inherited**: If a property is inherited from the Master Slide (not the Theme), indicate this distinction (e.g., "Inherited from Master").
- **Font Controls**:
  - **Family**: Dropdown populated by `FontManager`.
  - **Size**: Number input with stepper.
  - **Weight**: Dropdown (Regular, Bold, etc.).
- **Global Actions**:
  - **"Reset to Style"**: A prominent button to clear all manual overrides on the selected element and re-sync with the Theme/Master.
  - **"Update Style"** (Advanced): "Update 'Title' to match selection" – pushes the current overrides back to the Theme or Master (context dependent).
