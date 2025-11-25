# Implementation Plan: Typography Features

This plan outlines the steps to implement the new Typography features in the Property Inspector, including the Type Settings flyout and Layout section updates.

## Status
- **Phase 0:** ✅ Complete
- **Phase 1:** ✅ Complete  
- **Phase 2:** ✅ Complete
- **Phase 3:** ✅ Complete
- **Phase 4:** ✅ Complete

## Principles
- **Small Incremental Steps:** Each phase should be testable independently.
- **Non-breaking:** Existing text editing functionality must remain operational.
- **Design System:** Use existing components (`Dropdown`, `NumberInput`, `IconButton`, `Flyout`) and create new ones only if necessary.
- **Validation:** Verify against the spec at each step.

## Phase 0: Prerequisites (Font & Style Management) ✅
**Goal:** Establish the foundational services for font loading and style resolution.

1.  **Font Manager Service:**
    -   Create `FontManager` to handle loading of Google Fonts and system fonts.
    -   Implement caching to avoid re-fetching fonts.
    -   Expose `getAvailableFonts()` and `loadFont(family)` methods.
2.  **Style Resolver:**
    -   Implement `StyleResolver.getEffectiveProperties(element, globalStyles)`.
    -   Logic: Start with global style properties (if `styleId` exists), then overlay element-specific overrides.
    -   Define "Auto" Line Height logic: If `lineHeight` is `null` or `'auto'`, return `fontSize * 1.2` (or font-metric based value).

## Phase 1: Core Typography UI & Architecture ✅
**Goal:** Update the main `TextSection` to match the new visual design, support complex Text Fills, and prepare architecture for Text Styles.

1.  **Data Model & Architecture:**
    -   Define `TextStyle` schema (id, name, properties).
    -   Update `TextElement` schema to include optional `styleId`.
    -   **Text Fill Schema:** Update `color` property to `textFill` object: `{ type: 'solid' | 'gradient' | 'image' | 'video' | 'code', value: ... }`. Handle migration of legacy string colors to `{ type: 'solid', value: color }`.
    -   Implement a `StyleResolver` utility: `getEffectiveTextProperties(element, globalStyles)`. This ensures that if we add styles later, the renderer and UI don't need major refactoring—they just ask the resolver for the final values.
2.  **Refactor `TextSection.js` Layout:**
    -   **Row 0 (New):** Text Style Selector (Dropdown) + Action Menu (Detach/Edit).
    -   **Row 1:** Font Family (Dropdown), Font Style (Dropdown), Font Size (Input).
    -   **Row 2:** **Text Fill** (Swatch + Input) - Reusing `FillFlyout` logic.
    -   **Row 3:** Line Height (Input with Icon), Letter Spacing (Input with Icon).
    -   **Row 4:** Alignment Icons (Left, Center, Right, Top, Middle, Bottom) + Type Settings Button.
3.  **Text Fill Integration:**
    -   Adapt `FillSection` logic to work for a single layer.
    -   Reuse `FillFlyout` component.
    -   Ensure the swatch opens the flyout and updates the `textFill` property.
4.  **Update Components:**
    -   **Font Family:** Ensure `Dropdown` supports the visual style (light gray box).
    -   **Font Style:** Add `fontStyle` / `fontWeight` mapping logic.
    -   **Line Height:** Update `NumberInput` or wrapper to support "Auto" value (display "Auto" when value is null/undefined or specific keyword).
    -   **Letter Spacing:** Update `NumberInput` to support `%` units.
    -   **Alignment:** Add `verticalAlign` property support (Top, Middle, Bottom).
5.  **Rendering Update:**
    -   Update the text renderer to support complex fills.
    -   **Canvas:** Use `ctx.fillStyle` with patterns/gradients.
    -   **DOM/CSS:** Use `background-image` with `background-clip: text` and `text-fill-color: transparent`.
6.  **Data Model:**
    -   Ensure `UPDATE_ELEMENT` action supports `verticalAlign` and `textFill`.

**Validation:**
-   Select a text element.
-   Verify Font Family/Style/Size changes update the text.
-   Verify Text Fill supports Solid, Gradient, Image, etc.
-   Verify Line Height "Auto" works.
-   Verify Alignment icons update the text position.
-   Verify Style Selector is present (even if empty/default).

## Phase 2: Type Settings Flyout - Basics Tab ✅
**Goal:** Implement the "Type Settings" flyout with the "Basics" tab.

1.  **Create `TypeSettingsFlyout.js`:**
    -   Scaffold the class extending or using `Flyout`.
    -   Implement Tab navigation structure (Basics, Details, Variable).
2.  **Implement Basics Tab:**
    -   **Alignment:** Add Justify icon.
    -   **Decoration:** Add Underline/Strikethrough toggles.
    -   **Case:** Add Small Caps, Uppercase, Lowercase, Title Case icons.
    -   **Vertical Trim:** Add Cap Height dropdown.
    -   **Paragraph:** Add Spacing and Indentation inputs.
    -   **Lists:** Add Bullet and Numbered list toggles + Spacing input.
    -   **Truncation:** Add Toggle and Max Lines input.
3.  **Integration:**
    -   Connect the "Type Settings" button in `TextSection` to open this flyout.
    -   Ensure all inputs dispatch `UPDATE_ELEMENT` with correct properties.

**Validation:**
-   Open Type Settings flyout.
-   Test all Basics tab controls.
-   Verify changes persist and reflect on the selected text element.

## Phase 3: Type Settings Flyout - Details & Variable Tabs ✅
**Goal:** Implement the advanced typography settings.

1.  **Implement Details Tab:**
    -   **Numerals:** Add controls for Figure Style, Position, Fractions.
    -   **OpenType:** Add toggles for Ligatures, Stylistic Sets, Contextual Alternates.
2.  **Implement Variable Tab:**
    -   Add placeholder or basic slider controls for Variable Font axes (if supported by the font engine).
3.  **Data Model:**
    -   Ensure `textTransform`, `textDecoration`, `listStyle`, `opentypeFeatures` are stored in the element model.

**Validation:**
-   Verify Details tab controls are interactive.
-   (Note: Visual validation depends on rendering engine support for OpenType features).

## Phase 4: Layout Section Updates ✅
**Goal:** Add text-specific resizing controls to the Layout section.

1.  **Update `LayoutSection.js`:**
    -   Detect if the selected element is a Text element.
    -   If Text, inject a new row or modify the existing layout to show:
        -   **Auto Width** Icon.
        -   **Auto Height** Icon.
        -   **Fixed Size** Icon.
2.  **Logic:**
    -   **Auto Width:** Sets `width: 'auto'`, `height: 'auto'` (or calculated).
    -   **Auto Height:** Sets `width: fixed`, `height: 'auto'`.
    -   **Fixed:** Sets `width: fixed`, `height: fixed`.

**Validation:**
-   Select text element.
-   Toggle between Auto Width, Auto Height, and Fixed.
-   Verify the bounding box behavior on the canvas.

## Risks & Dependencies
-   **Style System Complexity:** Implementing a full style system (inheritance, overrides, detaching) is complex.
    -   *Mitigation:* Start with a simple "apply style" model (copy values) or a flat reference model before moving to complex inheritance.
-   **Rendering Support:** The HTML/Canvas renderer must support advanced CSS properties (e.g., `font-feature-settings` for OpenType, `text-transform`, `list-style`). If the renderer is purely Canvas-based without HTML overlay, implementing lists and rich text features is complex.
    -   *Mitigation:* Assume HTML-based rendering for text (`contenteditable` div) as per spec.
-   **Font Loading:** Variable fonts and specific font families need to be loaded in the environment.
-   **Component Reusability:** `NumberInput` might need enhancements for "Auto" and mixed units.

## Related Documents

- **Typography Style Manager Implementation Plan:** See `typography-style-manager-implementation-plan.md` for the theme-level font pairing system (theme fonts, text styles, font presets). This plan handles individual text element styling, while the Typography Style Manager handles global/theme-level typography definitions.
- **Slide Master Implementation Plan:** See `slide-master-implementation-plan.md` for how typography integrates with the master slide system.

## Next Steps
-   ✅ All phases complete! Typography features are now implemented.
-   Future enhancements: See `typography-style-manager-implementation-plan.md` for theme-level typography management.
