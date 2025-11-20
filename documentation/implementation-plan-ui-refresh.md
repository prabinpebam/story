# UI Refresh Implementation Plan

## Phase 1: Design System Foundation
- [ ] **Update CSS Variables**: Replace existing variables in `styles/main.css` with the new Design Tokens defined in `ui-design-system.md`.
- [ ] **Global Reset**: Ensure typography and box-sizing are consistent.

## Phase 2: Layout & Sidebars
- [ ] **Sidebar Structure**: Update `.sidebar` styles to match the new width and background.
- [ ] **Headers**: Style `.sidebar-header` and `.section-title` to be compact (32px height, small bold text).
- [ ] **Panels**: Update `.panel-section` padding and spacing.

## Phase 3: Components
- [ ] **Inputs**: Style `input[type="text"]`, `input[type="number"]`, and `select` to look like "ghost" inputs (transparent border until hover/focus).
- [ ] **Layer Tree**:
    - Update `.layer-item` height and padding.
    - Update selection state styling.
    - Ensure icons are correctly sized.
- [ ] **Property Inspector**:
    - Update row layout (flex/grid).
    - Style labels and controls.
    - Ensure density is high (small margins).

## Phase 4: Floating Elements
- [ ] **Toolbar**: Ensure it uses the new tokens (already mostly done, just need to swap variables).
- [ ] **Panels**: Update floating panel styles (shadows, borders).

## Phase 5: Dark Mode Verification
- [ ] Check all tokens in dark mode media query.
