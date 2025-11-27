# Feature Spec: Animation & Transitions

## 1. Overview
Animations bring the presentation to life. We use **Anime.js** as the core engine. The system supports slide-to-slide transitions and individual element animations.

## 2. Slide Transitions

### 2.1 Standard Transitions
Applied to the incoming slide while the outgoing slide exits.
- **Types:**
    - **None:** Instant cut.
    - **Fade:** Opacity 0 -> 1.
    - **Push:** Incoming slide pushes outgoing slide (Left, Right, Up, Down).
    - **Slide:** Incoming slide moves over the outgoing slide.
- **Parameters:** Duration (ms), Easing (Linear, Ease-In-Out).

### 2.2 "Magic" Morph (Smart Animate)
This is the flagship transition feature.
- **Concept:** Seamlessly interpolates the state of objects between two slides.
- **Matching Logic:**
    - Objects on Slide A and Slide B must share the same `id`.
    - If a user duplicates a slide, IDs are preserved, enabling automatic morphing.
- **Interpolatable Properties:**
    - Position (X, Y)
    - Scale / Size (Width, Height)
    - Rotation
    - Opacity
    - Color (Fill, Text Color)
    - Border Radius
- **Implementation:**
    1.  Snapshot state of Slide A.
    2.  Snapshot state of Slide B.
    3.  Create a temporary transition layer.
    4.  Use `anime.js` to tween values from State A to State B.

## 3. Element Animations (Builds)
Animations triggered within a slide (e.g., on click or after previous).

### 3.1 Types
- **Entrance:** Fade In, Fly In, Zoom In, Wipe.
- **Emphasis:** Pulse, Shake, Spin, Color Change.
- **Exit:** Fade Out, Fly Out, Zoom Out.

### 3.2 The Timeline (Mini)
- A simplified timeline view in the bottom panel (visible only in Animation Mode).
- **Ordering:** Drag and drop to reorder animation sequence.
- **Triggers:**
    - `On Click`: Waits for user input.
    - `With Previous`: Runs simultaneously.
    - `After Previous`: Runs automatically after the last animation finishes.
- **Preview:** "Play" button to preview the sequence on the canvas.
