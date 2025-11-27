# Feature Spec: Presentation Mode (Play)

## 1. Overview
Presentation Mode transforms the editor into a high-performance, distraction-free environment for delivering content. It must rival top-tier tools (Keynote, PowerPoint, Pitch) in fluidity, responsiveness, and presenter tools.

**Related Specifications:**
- [Presentation Mode Caching](./presentation-mode-caching.md) - Pre-caching, memory management, performance
- [Animation & Transitions](./animation-transitions.md) - Transition types and animation system
- [Progressive Loading](../storage/progressive-loading.md) - Asset loading strategies
- [Rendering Architecture](../rendering/rendering-architecture.md) - Renderer design for presentation

## 2. Modes of Operation

### 2.1 Viewer Mode (Standard)
- **Description:** The default single-screen experience.
- **Behavior:** Content fills the screen, UI is hidden, focus is on the slide.

### 2.2 Presenter View (Dual Screen)
- **Description:** A specialized view for the presenter when a second display is connected.
- **Mechanism:** Opens a separate window/tab that stays in sync with the main presentation window using `BroadcastChannel` API.
- **Audience Display:** Shows the current slide full-screen (clean feed).
- **Presenter Display:**
    - **Current Slide:** Large preview.
    - **Next Slide:** Smaller preview of what's coming.
    - **Speaker Notes:** Scrollable text area.
    - **Timer:** Elapsed time and current time.
    - **Progress:** Slide X of Y.

### 2.3 Kiosk / Autoplay Mode
- **Description:** Unattended playback loop.
- **Settings:**
    - **Interval:** Time per slide (e.g., 5s).
    - **Loop:** Restart after last slide.
    - **Interactive:** Allow user interruption, then resume auto-timer after inactivity.

## 3. Activation & Deactivation
- **Trigger:**
    - "Play" button in Toolbar.
    - Shortcut: `F5` (Start from beginning), `Shift + F5` or `Ctrl + Enter` (Start from current).
- **Exit:**
    - `Esc` key.
    - Context menu "End Show".
    - Reaching the end (optional configuration: Loop, Exit, or Black screen).

## 4. Navigation & Input

### 4.1 Keyboard Shortcuts
| Action | Keys |
| :--- | :--- |
| **Next Slide / Build** | `Right Arrow`, `Down Arrow`, `Space`, `Enter`, `Page Down`, `N` |
| **Previous Slide / Build** | `Left Arrow`, `Up Arrow`, `Backspace`, `Page Up`, `P` |
| **First Slide** | `Home` |
| **Last Slide** | `End` |
| **Jump to Slide** | `Number` + `Enter` (e.g., "5" + "Enter") |
| **Grid View (Navigator)** | `G` or `-` (Zoom out) |
| **Black Screen** | `B` or `.` (Toggle) |
| **White Screen** | `W` or `,` (Toggle) |
| **Laser Pointer** | `L` (Toggle) |
| **Hide Cursor** | `H` (Toggle immediate), Auto-hide after 3s inactivity |

### 4.2 Mouse Interaction
- **Left Click:** Next Slide / Build (unless clicking an interactive element).
- **Right Click:** Context Menu (Next, Previous, Jump to..., End Show).
- **Scroll Wheel:**
    - Default: Ignored (to prevent accidental jumps).
    - Configurable: Next/Prev slide.

### 4.3 Touch Gestures (Mobile/Tablet)
- **Swipe Left:** Next Slide.
- **Swipe Right:** Previous Slide.
- **Long Press:** Laser Pointer active.
- **Pinch In:** Enter Grid View.
- **Pinch Out:** Exit Grid View / Zoom.

## 5. Edit Mode vs. Presentation Mode State

When switching between Edit Mode and Presentation Mode, the application must strictly manage the state of UI elements and interaction layers to ensure a clean presentation and a restored editing environment upon exit.

### 5.1 Disabled in Presentation Mode
The following "Edit Mode" behaviors must be **disabled** or **hidden** when Presentation Mode is active:

1.  **Canvas Rendering Loop (Interaction Layer):**
    - **Selection Marquee:** No drag-to-select box.
    - **Selection Overlays:** No blue bounding boxes or outlines around elements.
    - **Transform Handles:** No resize/rotate handles.
    - **Hover Highlights:** No outlines when moving the mouse over elements.
    - **Guides:** No alignment or measurement guides.
    - **Grid:** The layout grid must be hidden.
    - **Gizmos:** Any on-canvas tools (crop handles, gradient handles) must be hidden.

2.  **Interaction Events:**
    - **Selection:** Clicking elements should not select them.
    - **Manipulation:** Dragging elements should not move them.
    - **Context Menus:** The standard editor context menu should be replaced by the presentation context menu (or disabled).
    - **Double Click:** Should not enter text editing mode.

3.  **UI Chrome:**
    - **Toolbar:** Hidden.
    - **Slide List:** Hidden.
    - **Property Inspector:** Hidden.
    - **Rulers:** Hidden.

### 5.2 Re-enabled upon Exit
When exiting Presentation Mode, the application must restore the previous state:

1.  **Canvas Rendering:**
    - The render loop must restart immediately.
    - Selection overlays for previously selected elements must reappear.
    - Hover effects must resume.
    - The interaction canvas must be cleared of any presentation artifacts (like laser pointer trails) and repainted with editor gizmos.

2.  **Interaction:**
    - Pointer events on the interaction canvas must be re-enabled (`pointer-events: auto`).
    - Cursor should revert to the appropriate tool state (e.g., default arrow or hand).

3.  **UI Chrome:**
    - All panels (Toolbar, Slide List, Property Inspector) must reappear.

## 6. Rendering & Scaling Engine

### 6.1 Aspect Ratio Handling
- **Fit to Screen:** The slide is scaled to fit within the viewport while maintaining its aspect ratio.
- **Letterboxing:** Black (or custom color) bars fill the remaining space.
- **Scaling Logic:**
    - Use CSS `transform: scale()` on a container to ensure high performance (GPU acceleration).
    - Text and vectors remain sharp (avoid rasterizing if possible, or use high-DPI canvas).

### 6.2 Media Playback
- **Video/Audio:**
    - **Auto-play:** Media set to "Start Automatically" plays immediately upon slide entry.
    - **On Click:** Media set to "Start on Click" waits for trigger.
    - **Looping:** Support for background loops.

## 7. Animation Sequencer
The engine must distinguish between **Slide Transitions** and **Element Builds**.

1.  **State A (Current Slide):** Static.
2.  **Input (Next):**
    - *Check:* Are there pending "Build In" animations?
    - *Yes:* Play next Build.
    - *No:* Trigger Slide Transition to Next Slide.
3.  **Transition:**
    - Execute Exit Transition (Current Slide).
    - Execute Entrance Transition (Next Slide).
    - **Magic Morph:** If active, interpolate matching elements between slides.

## 8. Interactive Tools

### 8.1 Laser Pointer
- **Visual:** A glowing red (or custom color) trail that follows the cursor.
- **Physics:** Slight delay/smoothing to mimic a real laser pointer.

### 8.2 On-Screen Controls (HUD)
- **Visibility:** Appears on mouse move in the bottom-left or bottom-center. Fades out after inactivity.
- **Buttons:**
    - Previous / Next.
    - Slide Navigator (Grid view).
    - Pen / Laser toggle.
    - Fullscreen toggle.
    - Menu (three dots).

### 8.3 Slide Navigator (Grid View)
- **Trigger:** `G` key or HUD button.
- **Visual:** A zoomed-out grid of all slides.
- **Interaction:**
    - Click a slide to jump to it immediately.
    - Arrow keys to navigate selection.
    - `Esc` to cancel and return to current slide.
- **Animation:** Zoom out from current slide to grid; Zoom in to selected slide.

## 9. Technical Architecture

### 9.1 PresentationController
A singleton class responsible for:
- **State Machine:** `IDLE` -> `ANIMATING` -> `PAUSED`.
- **Input Handling:** Global event listeners (keydown, resize, touch).
- **Focus Management:** Trapping focus within the presentation container.
- **Multi-Window Sync:** Uses `BroadcastChannel` to communicate state (current slide, timer) between Audience and Presenter windows.

### 9.2 DOM Structure
```html
<div id="presentation-layer" class="fullscreen">
    <div id="scaler">
        <!-- Current Slide -->
        <div class="slide-container active">...</div>
        <!-- Next Slide (Preloaded) -->
        <div class="slide-container next">...</div>
    </div>
    <div id="grid-overlay" class="hidden">...</div>
    <canvas id="pointer-layer"></canvas>
    <div id="hud-controls">...</div>
</div>
```

### 9.3 Performance Optimization

> **See [Presentation Mode Caching](./presentation-mode-caching.md) for complete caching architecture.**

**Core Principles:**
- **Preloading:** The next and previous slides should be rendered in the DOM (hidden) to ensure instant transitions.
- **Layer Promotion:** Use `will-change: transform` on the scaler and animating elements.
- **Sliding Window Cache:** Maintain 2-4 slides in GPU-ready HOT cache at all times.
- **Predictive Loading:** Pre-cache linked slides, section headers, and likely navigation targets.
- **Memory Management:** Evict distant slides to stay within ~800MB memory budget.

**Key Performance Targets:**
| Operation | Target | Maximum |
|-----------|--------|---------|
| Next/Previous slide | 0ms | 16ms |
| Jump to any slide | <50ms | 100ms |
| Transition animation | 60fps | No drops |
| Exit to editor | <200ms | 300ms |
