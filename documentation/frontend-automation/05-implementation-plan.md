# 05. Implementation Plan

This document outlines the phased roadmap for achieving complete frontend test coverage.

## Strategy: Automation-Driven Debugging
For all remaining phases, we will follow the **[Automation-Driven Debugging Strategy](./06-automation-driven-debugging.md)**. We assume features may be broken; tests will serve as the discovery mechanism for bugs, followed by immediate fixes in the source code.

## Phase 1: Foundation & Critical Paths (✅ Completed)
- [x] Setup Playwright infrastructure.
- [x] Create Page Object Models (Editor, Presentation, Canvas).
- [x] Implement State Seeding utilities.
- [x] Automate Smoke Tests (App load, basic UI).
- [x] Automate Critical Paths (Slide add, Tool switching, Presentation mode).

## Phase 2: Core Interactions (✅ Completed)
- [x] Canvas Element Creation (Rect, Text).
- [x] Master Mode switching.
- [x] Basic Element Manipulation (Select, Move, Delete).
- [x] Stability Validation (0% flakiness achieved).

## Phase 3: Text & Properties (Next Priority)
**Goal:** Validate and Fix core editing workflows.
- [ ] **Text Editing:**
    - [ ] T01-T08: Core Editing (Type, Commit, Cancel).
    - [ ] T09-T13: Selection & Navigation.
    - [ ] T14-T22: Typography Properties (Font, Size, Align).
- [ ] **Property Inspector:**
    - [ ] P01-P03: Transforms (X, Y, W, H).
    - [ ] P08-P09: Opacity & Blend Modes.

## Phase 4: Fills & Effects (High Complexity)
**Goal:** Validate and Fix the Fill/Effect engines.
- [ ] **Fills:**
    - [ ] FL01-FL08: Solid Fills (Color Picker, Opacity).
    - [ ] FL09-FL20: Gradient Fills (Stops, Handles).
    - [ ] FL26-FL31: Code Fills (Panel, Execution).
- [ ] **Effects:**
    - [ ] ST01-ST07: Strokes.
    - [ ] FX01-FX07: Shadows.

## Phase 5: Advanced Canvas & Slides
**Goal:** Cover complex interactions.
- [ ] **Canvas:**
    - [ ] Resize elements (handles).
    - [ ] Rotate elements.
    - [ ] Group/Ungroup.
    - [ ] Marquee selection.
- [ ] **Slides:**
    - [ ] Reorder slides (Drag & Drop).
    - [ ] Duplicate slides.
    - [ ] Change backgrounds.

## Phase 6: App Shell & Files
**Goal:** Cover application-level features.
- [ ] **Files:** Save, Load, Export.
- [ ] **Settings:** Modal interactions.
- [ ] **Shortcuts:** Verify global keyboard shortcuts.

## Phase 7: Visual Regression (Future)
- [ ] Setup visual comparison baseline.
- [ ] Create "Golden Master" slides for regression testing.
