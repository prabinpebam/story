# Implementation Plan: Presentation Mode

This plan details the steps to build a robust, high-performance Presentation Mode for "Story", matching the [Presentation Mode Spec](../specs/presentation-mode.md).

## Phase 1: Core Engine & Rendering
**Goal:** Successfully enter fullscreen, scale the slide, and exit.

- [x] **Step 1.1: Presentation State**
    - Update `Store` to include `presentationState`: `{ isActive: boolean, currentSlideIndex: number, isPaused: boolean }`.
    - Create actions: `START_PRESENTATION`, `END_PRESENTATION`, `NEXT_SLIDE`, `PREV_SLIDE`.

- [x] **Step 1.2: Fullscreen & Scaling Logic**
    - Create `PresentationManager.js` (or refactor existing).
    - Implement `enterFullscreen()` using the Fullscreen API.
    - Implement `calculateScale()`: Determine the scale factor to fit the slide (1920x1080 default) into the current viewport while maintaining aspect ratio.
    - Apply CSS transform `scale()` to the slide container. Center it using flexbox or absolute positioning.

- [x] **Step 1.3: DOM Isolation**
    - Ensure the presentation view is isolated from the Editor UI (Sidebars, Toolbars).
    - Add a CSS class `mode-presentation` to the root `#app` or `body` to hide editor elements and show the presentation container.

## Phase 2: Navigation & Input
**Goal:** Navigate between slides using keyboard and mouse.

- [x] **Step 2.1: Input Controller**
    - Create `InputController` class to listen for global events (`keydown`, `mousedown`, `touchstart`).
    - Implement key mapping:
        - Next: Right, Down, Space, Enter.
        - Prev: Left, Up, Backspace.
        - Exit: Esc.
    - Prevent default browser behaviors (e.g., scrolling) during presentation.

- [x] **Step 2.2: Slide Switching Logic**
    - Connect Input Controller to `Store` actions.
    - Implement `goToSlide(index)`:
        - Update state.
        - Trigger render of the new slide.
        - Handle boundary conditions (First/Last slide).

- [x] **Step 2.3: Black/White Screen**
    - Implement `B` (Black) and `W` (White) shortcuts.
    - Create a high z-index overlay div that toggles visibility.

- [x] **Step 2.4: Slide Navigator (Grid View)**
    - [x] Implement `G` shortcut (Store action dispatched).
    - [ ] Create a Grid Overlay component that renders thumbnails of all slides.
    - [ ] Implement click-to-jump logic.
    - [ ] Add zoom-in/out transitions using CSS transforms.

## Phase 3: Animation Integration
**Goal:** Play transitions and element animations during navigation.

- [x] **Step 3.1: Sequencer Logic**
    - Update `goToSlide` to handle transitions.
    - **Logic:**
        1. `Input Next` -> Check for Element Builds.
        2. If Builds exist -> Play Next Build.
        3. If no Builds -> Play Slide Transition (Exit Current -> Enter Next).

- [x] **Step 3.2: Integration with AnimationManager**
    - Ensure `AnimationManager.playTransition(oldSlide, newSlide, type)` is awaited before updating the active slide index fully (or handle parallel rendering).
    - **Preloading Strategy:**
        - Clone the DOM of the next slide into a hidden container (`.slide-container.next`).
        - Use `requestIdleCallback` to perform this cloning to avoid blocking the main thread.

## Phase 4: Interactive Tools
**Goal:** Add Laser Pointer and HUD.

- [x] **Step 4.1: Laser Pointer**
    - Create a canvas overlay `#pointer-layer` on top of the slide.
    - Track mouse movement.
    - Draw a glowing red circle with a trailing effect (using `requestAnimationFrame`).
    - Toggle with `L` key.

- [x] **Step 4.2: Heads-Up Display (HUD)**
    - [x] Create a subtle control bar at the bottom of the screen.
    - [x] Show on mouse move, hide after 3s of inactivity.
    - [x] Buttons: Prev, Next, Grid View, Exit, Laser Toggle.

## Phase 5: Polish & Optimization
**Goal:** Ensure 60fps performance and smooth UX.

- [ ] **Step 5.1: Cursor Management**
    - Hide cursor via CSS (`cursor: none`) after 3s of inactivity.
    - Show cursor immediately on mouse move.

- [ ] **Step 5.2: Kiosk / Autoplay Mode**
    - Add `autoplay` setting to Store.
    - Implement a timer loop that calls `nextSlide()` automatically.
    - Reset timer on user interaction.

## Phase 6: Presenter View (Dual Screen)
**Goal:** Enable a synchronized second screen experience.

- [ ] **Step 6.1: Multi-Window Sync**
    - Implement `BroadcastChannel` in `PresentationManager`.
    - Channel name: `story_presentation_sync`.
    - Messages: `{ type: 'STATE_UPDATE', payload: { slideIndex, buildIndex, timer } }`.

- [ ] **Step 6.2: Presenter UI**
    - Create a separate HTML entry point or route (e.g., `?mode=presenter`).
    - Build the layout: Current Slide (Large), Next Slide (Small), Notes, Timer.
    - Ensure controls in Presenter View send messages to the Audience View.
