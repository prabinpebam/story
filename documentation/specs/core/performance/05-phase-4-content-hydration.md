# Phase 4: Content Hydration (The Data)

## Objective
The final phase where the heavy lifting happens. The actual user data (Slides, Layers, Assets) is fetched, parsed, and rendered onto the Canvas.

## Implementation Specs

### 1. Prioritized Fetching
- **Critical Request**: Fetch the *current* slide's data first.
- **Secondary Request**: Fetch the metadata for the slide list (thumbnails).
- **Background Request**: Fetch adjacent slides (previous/next) for pre-caching.

### 2. Canvas Initialization
- The Canvas is the most expensive component to initialize (WebGL/Canvas API context).
- **Strategy**:
    1. Render the DOM-based UI overlays first (selection handles, rulers).
    2. Initialize the rendering engine in the background.
    3. Once the engine is ready, draw the slide content.
- **Visual Feedback**:
    - While the engine initializes, show a "Canvas Loading" spinner or a low-res placeholder if available.

### 3. Asset Loading (Images/Fonts)
- **Lazy Loading**: Do not load images for off-screen slides.
- **Progressive Images**: If an image is large, display a blurred low-res version (if stored) or a placeholder color derived from the image average color.
- **Font Loading**: Ensure fonts are loaded before rendering text to avoid layout shifts or "flash of unstyled text" (FOUT) on the canvas. Use `document.fonts.ready`.

### 4. Interaction Readiness (TTI)
- The app is visually "complete" before it is interactive.
- **Event Queue**: If the user clicks a button before the JS handlers are fully attached, queue the event and replay it once the main thread is idle.
- **Indicator**: If the app is still hydrating heavy data, keep a small, non-intrusive progress indicator visible (e.g., a thin line at the top of the viewport).

## Success Metrics
- **Time to Interactive (TTI)**: < 1.5s on average devices.
- **First Contentful Paint (FCP)**: < 0.8s (achieved in Phase 2/3).

### 5. Error States
- **Slide Load Failure**:
    - If the specific slide data fails to fetch, do *not* crash the entire app.
    - Display a "Slide Error" placeholder within the Canvas area with a "Retry" button.
    - Keep the UI shell (Sidebar, Toolbar) functional so the user can navigate to a different slide.
- **Asset Failure**:
    - If an image fails to load, display a broken image icon or the placeholder color. Do not leave a blank space.
