# Phase 1: Immediate Boot (The Anchor)

## Objective
Render the application logo in the center of the viewport as quickly as possible. This serves as the visual anchor for the user.

## Implementation Specs

### 1. Critical Rendering Path
- **Inline SVG**: The logo must be an inline SVG within the initial `index.html`.
    - *Why*: Eliminates the network request latency for an image file.
    - *Why*: Ensures crisp rendering on all DPIs immediately.
- **Minimal CSS**: Styles for centering the logo must be critical and inlined in the `<head>`.
    - Avoid waiting for the main `bundle.css` to load.

### 2. Visual Design
- **Position**: Absolute center of the viewport.
- **Animation**: Subtle pulse or "breathing" animation to indicate activity.
    - *Constraint*: Animation must use GPU-accelerated properties (opacity, transform) to avoid main-thread blocking during JS parsing.
- **Background**: Transparent or matching the `<body>` background color (see Phase 2).

### 3. Technical Constraints
- **No JavaScript Dependency**: The logo must appear before `main.js` is parsed or executed.
- **Asset Size**: The inlined SVG and CSS should add less than 5KB to the initial HTML payload.

### 4. Transition
- The logo should not abruptly disappear. It should fade out or morph into the App Chrome header once Phase 3 begins.

### 5. Error Handling (Resilience)
- **Timeout Fallback**: If the main JavaScript bundle fails to load or execute within 10 seconds:
    - Replace the pulsing logo with a friendly error message ("We couldn't load the app. Please check your connection.").
    - Provide a "Retry" button that reloads the page.
- **Implementation**: A small inline `<script>` block (separate from the main bundle) should start a timer that is cleared by the main app upon successful hydration.
