# Phase 3: App Shell & Shimmers (The Structure)

## Objective
Render the static "Chrome" of the application (Toolbar, Sidebar, Property Pane) immediately after the JavaScript bundle loads, but before the dynamic content is ready. Use "Shimmers" (skeleton screens) to indicate loading states.

## Implementation Specs

### 1. Layout Stability (CLS)
- The App Shell must establish the final grid layout of the application immediately.
- **Grid Areas**:
    - Top: Toolbar (Fixed height)
    - Left: Layers/Slides Panel (Fixed width or user-resizable preference)
    - Right: Property Inspector (Fixed width)
    - Center: Canvas (Flexible)
- **Goal**: Cumulative Layout Shift (CLS) should be **0** from this point forward.

### 2. Shimmer Components
- **Design**:
    - Use a subtle, animated gradient background (linear-gradient moving left to right).
    - Color: Derived from `--color-bg-panel` with a slightly lighter/darker overlay (based on theme).
    - **Crucial**: Shimmers must respect the current theme (Dark/Light). Do not use a generic gray shimmer if it clashes with the theme.
- **Placement**:
    - **Slides Panel**: Rectangular shimmers representing slide thumbnails.
    - **Layers Panel**: Thin rectangular lines representing layer tree items.
    - **Property Pane**:
        - Section headers (text lines).
        - Input fields (boxes).
        - Control groups.

### 3. Component Architecture
- Create a reusable `<Shimmer />` component in the Design System.
- **Variants**: `text`, `rectangular`, `circular`, `thumbnail`.
- **Props**: `width`, `height`, `style` (to match the layout of the component it replaces).

### 4. Transition
- When data arrives, the Shimmer should fade out (`opacity: 0`) while the real content fades in (`opacity: 1`).
- Avoid "popping" content in. A 200ms transition makes it feel polished.

### 5. Accessibility (A11y)
- **ARIA Attributes**:
    - The container holding shimmers must have `aria-busy="true"`.
    - Use `role="status"` or `aria-live="polite"` to announce when loading finishes.
- **Reduced Motion**:
    - If `prefers-reduced-motion: reduce` is active, disable the shimmer animation (the moving gradient) and use a static solid color instead.

### 6. Bundle Splitting Strategy
- **Core vs. Canvas**: Split the application bundle into at least two chunks:
    1.  `app-shell.js`: Contains the React/Vue framework, UI components (Toolbar, Sidebar), and routing logic. Loads first.
    2.  `canvas-engine.js`: Contains the heavy rendering logic (Konva/Fabric/Custom WebGL). Loads in parallel but initializes second.
- **Benefit**: The UI becomes visible and interactive (e.g., menu clicks) even if the heavy canvas engine is still parsing.
