# Principles Alignment & Non-Functional Requirements

This document details how the Typography System adheres to the core product principles defined in `documentation/product/principles.md`.

## 1. App Integrity & Testing
- **Incremental Rollout**: The roadmap is structured in phases (Wiring -> UI -> Polish) to allow for small, verifiable PRs.
- **Testing Strategy**:
  - **Unit Tests**: `FontManager` loading logic, `StyleResolver` algorithms.
  - **Integration Tests**: Verifying that changing a Theme correctly updates a Slide's text element.
  - **E2E Tests**: Validating the Property Inspector UI flows (Apply Style -> Override -> Reset).
  - **Tooling**: Must use `vitest` for unit/integration and `playwright` for E2E.

## 2. Design & Craft (Theming)
- **Strict Separation**: The spec enforces a hard wall between **Editor UI** (Design System) and **Canvas Content** (User Theme).
- **Theme Compliance**:
  - All UI components (`Dropdown`, `NumberInput`) must use global CSS variables (`--color-bg-panel`, `--color-text-primary`).
  - **Interaction States**: Hover/Focus states in the Property Inspector must use the application's current Accent Color (`--color-accent`), ensuring the "Theming as Litmus Test" passes.
  - **Dark/Light Mode**: The UI must support both modes natively via tokens.

## 3. Undo/Redo Compatibility
- **History Integration**: All state-changing actions (`APPLY_FONT_PRESET`, `UPDATE_TEXT_STYLE`, `SET_ELEMENT_PROPERTY`) must be recorded in the `HistoryManager`.
- **Preview Handling**: "Hover to Preview" actions must explicitly **bypass** the history stack (`skipHistory: true`) to prevent polluting the undo chain.
- **Granularity**: Overrides must be atomic. Changing "Font Size" should be a single undoable step.

## 4. Serialization & Storage
- **JSON Schema**: The `textStyleId` and `manualOverrides` properties must be JSON-serializable.
- **Reference Integrity**: Styles are referenced by string ID (`'title'`), not by object. This ensures that if the Theme definition changes, the saved file automatically reflects the new look upon reload (unless overridden).
- **Asset Persistence**: Custom fonts used in a presentation must be referenced in the file metadata so they can be loaded when the file is reopened.

## 5. Realtime Collaboration
- **Atomic Updates**: When User A changes a Master Slide style, User B must see the update immediately.
- **Conflict Resolution**:
  - **Scenario**: User A changes "Title" font to Arial. User B changes a specific Title element to "Bold".
  - **Resolution**: The system respects the granularity. The element becomes "Arial Bold".
- **Cursor Presence**: When User A is editing a Style definition, User B should ideally see a lock or indicator (Future Scope).

## 6. Performance
- **Font Loading**:
  - **Lazy Loading**: Only load fonts actually used in the presentation.
  - **Display Swap**: Use `font-display: swap` to prevent invisible text during load.
- **Rendering**:
  - **Batch Updates**: Changing a Theme should trigger a single re-render pass, not N re-renders for N elements.
  - **Memoization**: The `resolveTextStyle` function should be memoized to avoid recalculating styles on every frame.
