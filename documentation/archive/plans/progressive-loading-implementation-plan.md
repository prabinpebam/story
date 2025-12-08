# Progressive Loading Implementation Plan

**Status**: Draft
**Spec**: [Progressive Loading Strategy](../specs/progressive-loading/01-strategy-overview.md)

## Overview
This plan details the steps to implement the Progressive Loading Strategy, ensuring a perceived performance improvement by prioritizing the rendering of critical visual elements.

---

## Phase 1: Immediate Boot (The Anchor)
**Goal**: Render the application logo instantly (< 100ms).

### 1.1. Prepare Assets
- [ ] Extract the SVG content from `assets/story.svg`.
- [ ] Optimize the SVG for inline usage (remove unnecessary metadata).

### 1.2. Update `index.html`
- [ ] Add critical CSS to `<head>` for centering the boot logo.
    -   Use a `<style>` tag.
    -   Define `.boot-screen` class with `position: fixed`, `inset: 0`, `z-index: 9999`.
    -   Define keyframes for the "breathing" animation.
- [ ] Insert the inline SVG logo into `<body>` within a `<div id="boot-screen" class="boot-screen">`.
- [ ] Ensure the boot screen has a background color matching `--color-bg-app` (initially hardcoded to dark mode default `#1E1E1E` to match `variables.css`).

### 1.3. Implement Error Handling (Resilience)
- [ ] Add a standalone `<script>` tag in `<body>` (after the boot screen div).
- [ ] Implement a timeout (e.g., 10s) that checks if the app has loaded.
- [ ] If timeout triggers, replace the logo with a "Retry" button and error message.
- [ ] Expose a global function `window.clearBootTimeout()` that the main app calls upon success.

---

## Phase 2: Theme Hydration (The Context)
**Goal**: Apply user's theme preference before first paint.

### 2.1. Create Hydration Script
- [ ] Create `src/boot/theme-hydration.js`.
- [ ] Logic:
    1.  Check `localStorage.getItem('theme-preference')`.
    2.  If not found, check `window.matchMedia('(prefers-color-scheme: dark)')`.
    3.  Determine the correct background colors (`--color-bg-app`, `--color-bg-panel`, etc.).
    4.  Set these properties on `document.documentElement.style`.

### 2.2. Inject into `index.html`
- [ ] Add the script to `<head>` of `index.html`.
- [ ] **Crucial**: It must be blocking (no `async` or `defer`) to prevent FOUC.
- [ ] Ensure it runs *before* any CSS files are loaded if possible, or at least before the body renders.

### 2.3. Verify Design System Alignment
- [ ] Ensure the variable names match `styles/modules/variables.css` exactly.
- [ ] Test with both Light and Dark mode preferences.

---

## Phase 3: App Shell & Shimmers (The Structure)
**Goal**: Render the static UI shell immediately.

### 3.1. Create Shimmer Component
- [ ] Create `src/ui/components/Shimmer.js` (Web Component or standard class).
- [ ] Implement CSS for the shimmer effect (animated gradient).
- [ ] Support variants: `rect`, `text`, `circle`.

### 3.2. Update App Structure
- [ ] In `index.html`, ensure the `#app` container and sidebars (`#sidebar-left`, `#sidebar-right`) are visible by default (or visible immediately after theme hydration).
- [ ] Add "Skeleton" HTML content inside the sidebars.
    -   **Left Sidebar**: Add placeholder list items for slides/layers.
    -   **Right Sidebar**: Add placeholder property rows.
- [ ] Use the `Shimmer` class/styles for these placeholders.

### 3.3. Transition Logic
- [ ] In `src/main.js`, when UI components (SlideList, PropertyInspector) initialize:
    1.  Find the skeleton container.
    2.  Render the real component.
    3.  Fade out the skeleton and remove it.

---

## Phase 4: Content Hydration (The Substance)
**Goal**: Prioritize active slide rendering.

### 4.1. Refactor `App.initAsync`
- [ ] Split initialization into prioritized chunks.
- [ ] **Chunk 1 (Critical)**:
    -   Initialize `Store`.
    -   Initialize `Toolbar`, `Sidebar` shells.
    -   Clear the "Boot Screen" (Phase 1).
- [ ] **Chunk 2 (Canvas)**:
    -   Initialize `CanvasManager`.
    -   Render the *active* slide.
- [ ] **Chunk 3 (Background)**:
    -   Initialize `IconLibrary`, `SettingsModal`, etc.
    -   Pre-fetch adjacent slides.

### 4.2. Canvas Loading State
- [ ] Add a loading indicator specifically for the canvas area (`#interaction-canvas`).
- [ ] Show this indicator while `CanvasManager` is initializing.
- [ ] Hide it once the first frame is drawn.

### 4.3. Asset Loading
- [ ] Implement lazy loading for images on off-screen slides.
- [ ] Ensure fonts are ready (`document.fonts.ready`) before rendering text on canvas.

---

## Validation & Testing

### Manual Verification
- [ ] **Throttle Network**: Use DevTools to simulate "Slow 3G".
- [ ] **Verify Sequence**: Logo -> Theme -> Shell -> Content.
- [ ] **Theme Check**: Switch to Light Mode, reload, ensure no dark flash.
- [ ] **Error Check**: Block `main.js` request, verify error screen appears after 10s.

### Automated Testing
- [ ] Update E2E tests to wait for specific hydration markers (e.g., `data-hydrated="true"`).
- [ ] Add a test case for the "Retry" flow.
