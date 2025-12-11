# Implementation Roadmap

This roadmap outlines the steps to bring the Typography system from its current partial state to full specification compliance.

## Phase 1: The "Wiring" (Immediate Priority)
**Goal**: Connect the working `TypographyStyleManager` UI to the rendering engine.
**Validation**: Unit tests for `resolveTextStyle`.

- [ ] **State**: Ensure `APPLY_FONT_PRESET` reducer correctly updates the Master Slide's `typographyStyleId`.
- [ ] **Renderer**: Update `TextRenderer` to resolve styles:
  ```js
  const style = theme.typography.styles[element.textStyleId] || defaultStyle;
  const fontSize = element.fontSize || style.fontSize;
  // ... apply to canvas
  ```
- [ ] **Migration**: Ensure all existing text elements have a valid `textStyleId` (default to 'body').

## Phase 2: Property Inspector Integration
**Goal**: Users can see which style is applied and manage overrides.
**Validation**: E2E tests for Override/Reset flows.

- [ ] **UI**: Connect the "Text Style" dropdown in `TextSection.js` to `element.textStyleId`.
- [ ] **Logic**: When changing a style (e.g., Body -> Title), reset manual overrides (font size, weight) to the new style's defaults.
- [ ] **Feedback**: Show an "Overridden" indicator (e.g., an asterisk or reset button) next to properties that differ from the preset.

## Phase 3: Customization & Persistence
**Goal**: Users can create their own themes.

- [ ] **UI**: Implement the "Custom" tab form in `TypographyStyleManager`.
- [ ] **Storage**: Save custom presets to `userPreferences` or local storage.
- [ ] **Export**: Ensure custom typography settings are included in the project export JSON.

## Phase 4: Advanced Polish
- [ ] **Smart Fallbacks**: Better handling of fonts that fail to load.
- [ ] **Variable Fonts**: Support for `font-variation-settings`.
- [ ] **AI Pairing**: "Shuffle" button to generate random compatible pairings.
