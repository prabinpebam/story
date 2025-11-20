# Implementation Plan: Story Presentation Maker

This document outlines the step-by-step implementation plan for "Story", a modern presentation maker with Teenage Engineering aesthetics and advanced features.

## Phase 1: Foundation & Infrastructure
**Goal:** Establish the project structure, core state management, and basic UI shell.

### 1.1 Project Setup
- [x] Initialize project structure (Vanilla JS, ES Modules).
- [x] Set up `index.html` and main entry point `src/main.js`.
- [x] Configure CSS variables for the Color System (Teenage Engineering palette) and Typography.
- [x] Create utility functions for DOM manipulation and event handling.

### 1.2 State Management System
- [x] Implement a lightweight Pub/Sub (Observer) pattern module.
- [x] Define the initial State Store structure (current slide, selection, deck data).
- [x] Create actions/reducers for basic state updates (e.g., `SET_CURRENT_SLIDE`, `UPDATE_SELECTION`).

### 1.3 UI Shell (The "Teenage Engineering" Look)
- [x] Build the main layout grid: Left Sidebar, Center Canvas, Right Sidebar.
- [x] Implement the Theme Switcher (Light/Dark mode) using CSS variables.
- [x] Create base UI components:
    - [x] `Knob` (Rotary control).
    - [x] `ToggleSwitch` (Mechanical feel).
    - [x] `SegmentedControl`.
    - [x] `IconButton` with hover states.

## Phase 2: The Canvas Engine
**Goal:** specific rendering of objects and basic manipulation.

### 2.1 Canvas Architecture
- [x] Implement the Hybrid Rendering system:
    - [x] HTML layer for Text and UI overlays.
    - [x] Canvas/WebGL layer for backgrounds and complex rendering.
- [x] Implement `CanvasManager` to handle coordinate systems (screen to canvas space).

### 2.2 Object Model & Rendering
- [x] Define JSON schema for Slide Objects (Text, Image, Shape).
- [x] Create factory functions for creating objects.
- [x] Implement the Rendering Loop (using `requestAnimationFrame` if needed for animations, or DOM updates for static content).

### 2.3 Interaction System
- [x] Implement `SelectionManager`: Click to select, Shift+Click for multi-select.
- [x] Build the `TransformGizmo` (Bounding box):
    - [x] Drag to move.
    - [x] Resize handles (with aspect ratio lock).
    - [x] Rotate handle (with snap).
- [x] Implement Snapping & Alignment guides.
- [x] **Implement Creation Tools:**
    - [x] Draw Rectangle (Drag to create).
    - [x] Text Tool (Drag to create).
    - [x] Image Tool (Drag to create).

### 2.4 Advanced Object Manipulation (Figma-like)
- [x] **Selection Model Refinement:**
    - [x] Marquee Selection (Drag to select multiple).
    - [x] Deep Select (Cmd/Ctrl + Click for nested groups).
    - [x] Select All (Cmd/Ctrl + A).
- [x] **Transformation Logic:**
    - [x] Center Resize (Alt/Option + Drag).
    - [x] Constrained Movement (Shift + Drag).
    - [x] Nudge (Arrow keys) & Big Nudge (Shift + Arrow keys).
    - [x] Duplicate on Drag (Alt + Drag).
    - [x] Layer Ordering Shortcuts ([, ], Ctrl+[, Ctrl+]).
    - [x] Grouping Shortcuts (Ctrl+G, Ctrl+Shift+G).
    - [x] Opacity Shortcuts (Number keys).
    - [x] **Fix:** Multi-object resizing (scale relative to selection).
    - [x] **Fix:** Group bounding box auto-update on child change.
- [x] **Smart Guides & Snapping:**
    - [x] Dynamic alignment guides (edges/centers).
    - [x] Spacing guides (equal distance).
    - [x] Distance Measurement (Alt + Hover).
- [x] **Direct Manipulation:**
    - [x] Double-click behaviors (Text edit, Group enter).
    - [x] Hover effects for interactive objects.

## Phase 3: Slide Management
**Goal:** Manage multiple slides and navigation.

### 3.1 Slide Deck Architecture
- [x] Update State Store to handle an array of Slides.
- [x] Implement `SlideManager`: Add, Duplicate, Delete, Reorder slides.

### 3.2 Sidebar Navigation
- [x] Build the Slide Thumbnail view in the Left Sidebar.
- [x] Implement drag-and-drop reordering of thumbnails.
- [x] Sync selection between Thumbnail view and Main Canvas.

### 3.3 Layer Management
- [x] Build the Layer Tree view in the Left Sidebar.
- [x] Implement Z-index manipulation (Bring to Front/Send to Back).
- [x] Implement Lock/Unlock and Hide/Show visibility toggles.

## Phase 4: Content Editing & Properties
**Goal:** Allow deep customization of slide content with a Figma-like interaction model.

### 4.1 Property Inspector Infrastructure
- [x] Build the Context-Aware Right Sidebar.
- [x] **Implement Advanced Input Components:**
    - [x] `ScrubbableInput`: Label acts as a slider (drag to change value).
    - [x] `MathInput`: Input field that evaluates expressions (e.g., "100+50") on blur/enter.
    - [x] `MultiValueInput`: Handles "Mixed" state for multi-selection.
- [x] **Refactor Property Inspector:**
    - [x] Create modular sections (Transform, Text, Fill, Stroke, Effects).
    - [x] Implement collapsible section headers.

### 4.2 Transform & Layout Controls
- [x] **Alignment Tools:** Implement Align Left/Center/Right/Top/Middle/Bottom logic for single and multiple objects.
- [x] **Distribution Tools:** Distribute horizontal/vertical spacing.
- [x] **Transform Section:**
    - [x] X, Y, Width, Height (with aspect ratio lock toggle).
    - [x] Rotation (0-360°).
    - [x] Corner Radius (independent corners UI).

### 4.3 Typography Engine
- [x] Implement Text Object editing (Double-click to edit).
- [x] **Advanced Text Properties:**
    - [x] Font Family (Google Fonts integration).
    - [x] Font Weight (Dynamic dropdown based on family).
    - [x] Font Size, Line Height (px/%), Letter Spacing.
    - [x] Paragraph Spacing, Text Align, Vertical Align.
    - [x] Resizing constraints: Auto Width, Auto Height, Fixed Size.

### 4.4 Styling (Fill, Stroke, Effects)
- [x] **Fill System:**
    - [x] Solid Color (Hex/RGBA).
    - [x] Linear/Radial Gradients.
    - [x] Image Fill (Scale modes: Fill, Fit, Crop, Tile).
- [x] **Stroke System:**
    - [x] Color, Width.
    - [x] Position (Inside, Center, Outside).
    - [x] Dash array / Caps / Joins.
- [x] **Effects System:**
    - [x] Drop Shadow (X, Y, Blur, Spread, Color).
    - [x] Layer Blur.

### 4.5 Media & Assets
- [x] Implement Image Upload & Drag-and-drop.
- [x] Add Image Processing controls: Opacity, Border Radius.
- [ ] Add Image Processing controls: Crop (masking).
- [x] Integrate Icon Library search (mock API or direct integration).

## Phase 5: Animation & Transitions
**Goal:** Bring the presentation to life using Anime.js.

### 5.1 Integration
- [x] Import and configure `anime.js`.
- [x] Create an `AnimationManager` module.

### 5.2 Transitions
- [x] Implement standard slide transitions (Fade, Slide, Push).
- [x] Implement "Magic Morph" (Smart Animate):
    - [x] Algorithm to match object IDs between slides.
    - [x] Interpolate properties using `anime.js`.

### 5.3 Element Animations
- [x] Add UI controls to assign Entrance/Exit animations to specific objects.
- [x] Preview animations in the canvas.

## Phase 6: Advanced Backgrounds & AI
**Goal:** Implement the unique selling points of "Story".

### 6.1 Rich Backgrounds
- [x] Implement Gradient Editor (Linear, Radial, Conic).
- [x] **Mesh Gradient:** Implement WebGL shader for fluid gradients with control points.
- [x] **Code Background:**
    - [x] Create the Code Editor interface (Monaco or simple textarea with highlighting).
    - [x] Implement the sandbox for rendering user-defined Canvas/JS code.

### 6.2 AI Copilot Integration
- [x] Build the Settings panel for API Key management.
- [x] Implement the AI Client module (fetch wrapper).
- [x] **Features:**
    - [x] Text Refinement (Shorten/Expand).
    - [x] "Generate Background" prompt interface (Text-to-Code).

## Phase 7: Polish & Presentation Mode
**Goal:** Finalize the user experience.

### 7.1 Presentation Mode
- [x] Implement Fullscreen toggle.
- [x] Build the Presentation Runner (keyboard navigation, hidden UI).
- [x] Add Laser Pointer tool.

### 7.2 Optimization & Testing
- [ ] Audit file sizes and modularity (<500 lines per file).
- [ ] Performance profiling (ensure 60fps animations).
- [ ] Cross-browser testing.
