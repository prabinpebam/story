# Feature Spec: Presentation Mode (Play)

## 1. Overview
Presentation Mode transforms the editor into a full-screen, distraction-free viewer. It executes transitions, animations, and handles navigation logic.

## 2. Activation
- **Trigger:** "PLAY" button in the top toolbar or `F5` / `Ctrl+Enter`.
- **Action:**
    1.  Request Browser Fullscreen (`element.requestFullscreen()`).
    2.  Hide UI panels (Sidebars, Toolbar).
    3.  Center and Scale the Slide to fit the screen (`object-fit: contain` logic).
    4.  Switch input handling to "Navigation Mode".

## 3. Navigation & Controls

### 3.1 Input Mapping
- **Next Slide / Step:**
    - `Right Arrow`, `Down Arrow`, `Spacebar`, `Enter`, `Page Down`.
    - Left Mouse Click.
- **Previous Slide / Step:**
    - `Left Arrow`, `Up Arrow`, `Backspace`, `Page Up`.
- **Exit:**
    - `Esc` key.

### 3.2 Laser Pointer
- **Toggle:** Press `L` key.
- **Visual:** A red glowing dot follows the mouse cursor.
- **Tech:** A high z-index `div` or canvas overlay that tracks `mousemove`.

## 4. Rendering & Scaling
- **Aspect Ratio:** The slide maintains its aspect ratio (e.g., 16:9).
- **Letterboxing:** Black bars appear if the screen aspect ratio differs from the slide.
- **Scaling:**
    - `scale = Math.min(windowWidth / slideWidth, windowHeight / slideHeight)`
    - The slide container is transformed: `transform: translate(-50%, -50%) scale(scale)`.

## 5. Animation Execution
- **Transitions:**
    - When navigating `Next`, trigger the `Exit` transition of current slide and `Enter` transition of next slide.
    - **Magic Morph:** If active, calculate the interpolation and animate.
- **Builds (Element Animations):**
    - If the current slide has pending animations (e.g., "On Click"), the `Next` action triggers the animation instead of changing the slide.

## 6. Technical Implementation
- **Mode State:** Store has `mode: 'edit' | 'present'`.
- **Router:** A `PresentationController` class intercepts keyboard/mouse events when in `present` mode.
- **DOM:** We reuse the main rendering canvas but change its CSS context (remove editor wrappers, apply fullscreen styles).
