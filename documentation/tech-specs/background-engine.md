# Technical Specification: Background Engine

## 1. Overview
The Background Engine is responsible for rendering the backdrop of each slide. It supports multiple modes ranging from simple static colors to complex, programmable WebGL animations.

## 2. Background Types

### 2.1 Solid & Gradient (CSS-based)
Rendered using standard CSS `background` properties on the `#slide-background` DOM element.
- **Solid:** `background-color: #ff0000`
- **Linear:** `linear-gradient(45deg, #f00, #00f)`
- **Radial:** `radial-gradient(circle, #f00, #00f)`
- **Conic:** `conic-gradient(...)`

### 2.2 Image
Rendered as a CSS `background-image` or an `<img>` tag with `object-fit: cover`.
- **Features:**
    - **Filters:** CSS filters (blur, grayscale, contrast).
    - **Overlay:** A semi-transparent color layer on top for text readability.

### 2.3 Mesh Gradient (Canvas/WebGL)
A fluid, animated gradient effect.
- **Implementation:** Uses a custom WebGL shader or a high-performance 2D Canvas loop.
- **Parameters:**
    - **Colors:** Array of 4-6 colors.
    - **Speed:** Animation speed.
    - **Noise:** Turbulence factor.
- **Control:** Users adjust these parameters via Knobs in the UI.

### 2.4 Code-Based (Interactive Canvas)
The "Hacker Mode" feature. Allows users (or AI) to write raw JavaScript to draw to a canvas.

#### Architecture
- **Container:** A `<canvas>` element inside `#slide-background`.
- **Execution:** The code is wrapped in a function:
  ```javascript
  function render(ctx, width, height, time, mouse) {
      // User code goes here
      // e.g., ctx.fillStyle = 'red'; ctx.fillRect(0,0,100,100);
  }
  ```
- **Loop:** The `CanvasManager` calls this function every frame (`requestAnimationFrame`).

#### Safety & Performance
- **Time Budget:** If the user code takes >16ms to execute, the loop is paused, and a warning is shown.
- **Context:** Only the 2D context is exposed (initially). WebGL context support can be added later.

## 3. Data Model
```javascript
const Background = {
  type: "mesh", // 'solid', 'gradient', 'image', 'mesh', 'code'
  
  // Common
  color: "#ffffff",
  
  // Gradient
  gradientType: "linear",
  stops: [
    { offset: 0, color: "#ff0000" },
    { offset: 1, color: "#0000ff" }
  ],
  angle: 45,
  
  // Image
  src: "url...",
  filters: { blur: 0, brightness: 100 },
  
  // Mesh
  meshColors: ["#f00", "#0f0", "#00f"],
  meshSpeed: 0.5,
  
  // Code
  code: "ctx.fillStyle = '...';"
};
```

## 4. UI Controls
The Property Inspector adapts to the selected background type.
- **Solid:** Color Picker.
- **Gradient:** Gradient Editor (Stop points, Angle knob).
- **Mesh:** Color palette list + Speed Knob.
- **Code:** "Edit Code" button opens the Monaco Editor modal.
