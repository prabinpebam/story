# Phase 2: Theme Hydration (The Context)

## Objective
Apply the user's chosen theme (Dark, Light, or Custom) *before* any UI is rendered to the screen. This prevents the "Flash of Incorrect Theme" (e.g., a dark mode user seeing a white flash).

## Implementation Specs

### 1. Storage Strategy
- **Local Storage**: Theme preference (`theme-id`, `accent-color`) is stored in `localStorage`.
- **Fallback**: If no preference is found, default to `prefers-color-scheme` media query.

### 2. The Blocking Script
- A small, synchronous script tag must be placed in the `<head>` of `index.html`.
- **Execution Flow**:
    1.  Read `localStorage` for theme settings.
    2.  Resolve the theme values (background colors, text colors, accent colors).
    3.  Apply these values as CSS Custom Properties (Variables) to the `:root` or `<body>` element.
- **Why Synchronous?**: We explicitly want to block the first paint until these variables are set. The delay is negligible (< 5ms) but ensures the first pixel painted is the correct color.

### 3. CSS Variables Scope
The following critical variables must be set during this phase:
- `--color-bg-app`: The main application background.
- `--color-bg-panel`: The background for sidebars/panels.
- `--color-accent`: The primary interaction color.
- `--color-text-primary`: Main text color.

### 4. Design System Compliance
- Adhere to the **Theming as Litmus Test** principle.
- Ensure that the "boot screen" (Phase 1 logo background) uses `--color-bg-app` so it seamlessly blends into the app shell.

### 5. Risks & Mitigation
- **Risk**: `localStorage` access is slow or blocked.
- **Mitigation**: Wrap in `try/catch`. Fallback gracefully to the CSS-defined default (Dark Mode) without crashing.
