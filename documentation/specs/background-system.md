# Feature Spec: Rich Background System

## 1. Overview
Backgrounds in "Story" are not just static images. They are dynamic, generative, and programmable.

## 2. Background Types

### 2.1 Static & Gradient
- **Solid Color:** Simple hex picker.
- **Linear/Radial Gradient:**
    - Multiple color stops.
    - Angle control.
- **Conic Gradient:** For modern, sharp looks.

### 2.2 Mesh Gradients (WebGL)
- **Visuals:** Fluid, moving blobs of color that blend organically.
- **Controls:**
    - **Points:** User can add 4-6 control points on the canvas.
    - **Colors:** Assign a color to each point.
    - **Movement:** "Speed" and "Turbulence" sliders to animate the points automatically.
- **Tech:** Implemented using a custom WebGL shader (GLSL) rendered to a canvas behind the slide content.

### 2.3 Code-Based Backgrounds (The "Hacker" Mode)
- **Concept:** Allow users to write raw HTML5 Canvas or Shader code to generate the background.
- **Editor:**
    - Embedded code editor (Monaco or CodeMirror).
    - Syntax highlighting for JavaScript/GLSL.
- **API:**
    - The code receives a `ctx` (2D context) or `gl` (WebGL context) and `time` variable.
    - `width` and `height` are provided.
- **Libraries:**
    - Built-in support for `p5.js` or `Three.js` syntax if selected.
- **Safety:** Code runs in a sandboxed environment (iframe or strict scope) to prevent crashing the main app.

## 3. Background UI
- **Preview:** Real-time rendering of the background changes.
- **Presets:** A library of pre-made Mesh and Code backgrounds for non-coders to use.
