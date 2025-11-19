# Story
This should be a modern presentation maker.

# Features
- All the major slide management and presentation fucntionalities
- Master slides
- Transitions
     - Fade
     - morph/smart animate
     - others
- Advanced formatting options for text and paragraph
- Text styles
- Font selection, system fonts and web fonts
- Icon's library from free-to-use icons from places like fontawesome and the noun project. 
- Layout management, snapping, arrange align.
- Layer management
- Image cropping, adjustments, filters
- Rich background for slide
    - Images
    - dynamically generated mesh gradient with controolable parameters
    - regular gradients like liners, radial, conical etc.
    - Interactive code based background using html canvas optimization.
- Clear edit and presentation mode
- Scalable UI modal that consistently presents various objects to be edited and their control presented in an intuitive manner.
- AI assisted creation
    - Setup
        - Add api link and key and other option
        - Prompting that helps in refining slide content, design and background.
        - Prompting that explicitly allows advance code based customization of the slide background. Exclusive code preview and editing mode for slide background. Allow use of libraries.

# Tech spec
- Plain html css js
- Use libraries if required
- use https://animejs.com/documentation/ for animation
- No typescript
- Make it scalable
- Keep individual files modular and preferrably less than 500 lines.

# UI
- Use Teenage engineering aesthetics
- Develop exhaustive color palette
- Support light and dark mode
- Have an exhaustive good set of component library.
- Use motion design and animation where required.
- Minimal, subtle is the theme of the Design aesthetics.
---

# Expanded Product Specification: Story Presentation Maker

## 1. Product Vision
"Story" aims to redefine the presentation creation experience by combining the precision of professional design tools with the ease of use of modern web applications. It bridges the gap between static slides and interactive, dynamic storytelling.

## 2. Target Audience
- **Designers:** Who need granular control over typography, layout, and motion.
- **Developers/Tech-Savvy Users:** Who appreciate code-based backgrounds and high-performance rendering.
- **Business Professionals:** Who need to create stunning decks quickly using master slides and smart layouts.

## 3. Core Features & Functional Requirements

### 3.1 Slide Management & Architecture
**[Detailed Spec: Data Structures](./tech-specs/data-structures.md)**
- **Slide Deck:** Linear sequence of slides with drag-and-drop reordering.
- **Thumbnails:** Real-time DOM-based previews.
- **Master Slides (Templates):** Inheritance model for layouts. **[Detailed Spec: Master Slides](./tech-specs/master-slide-system.md)**
- **Layer Management:** Z-index control, Grouping, Locking.

### 3.2 Canvas & Object Manipulation
**[Detailed Spec: Interaction Model](./tech-specs/interaction-model.md)**
- **Infinite/Finite Canvas:** Focused viewport with scratchpad.
- **Navigation:** Pan (Space+Drag), Zoom (Ctrl+Scroll), Fit to View.
- **Adding Elements:** Drag-to-create, Drag-from-toolbar.
- **Snapping & Alignment:** Smart guides.
- **Transformations:** Resize, Rotate, Skew with Gizmo.
- **Context Menu:** Custom right-click actions.

### 3.3 Typography & Media
**[Detailed Spec: Text Engine](./tech-specs/text-engine.md)**
- **Text Engine:** Advanced formatting (Kerning, Leading), Global Styles.
- **Visual Assets:** Image processing (Crop, Filters), Icon Library.

### 3.4 Transitions & Animation System
- **Standard Transitions:** Fade, Slide, Push.
- **"Magic" Morph:** Smart interpolation between slides.
- **Element Animations:** Entrance/Exit effects using Anime.js.
- **Play Mode:** Fullscreen, distraction-free runner.

### 3.5 Rich Background System
**[Detailed Spec: Background Engine](./tech-specs/background-engine.md)**
- **Static:** Gradients (Linear, Radial, Conic).
- **Mesh Gradients:** WebGL-powered fluid gradients.
- **Interactive/Code:** HTML5 Canvas/Shader support with "Hacker Mode".

### 3.6 AI Assisted Creation
**[Detailed Spec: AI Integration](./tech-specs/ai-integration.md)**
- **Setup:** API Key management.
- **Content Copilot:** Text refinement and layout suggestions.
- **Code Generator:** Prompt-to-Code for backgrounds.

## 4. User Interface (UI) Design
**[Detailed Spec: Component System](./tech-specs/component-system.md)**
- **Aesthetics:** Teenage Engineering inspired (Industrial, Tactile).
- **Theme:** Light/Dark mode, High contrast.
- **Components:** Knobs, Switches, Mechanical feel.

### 4.1 Properties Panel Behavior (Figma-like)
The properties panel must mimic the interaction model of Figma while retaining the TE visual identity.

**Interaction Principles:**
- **Scrubbable Inputs:** Hovering over a property label (e.g., "W", "H", "Opacity") changes the cursor to a resize arrow. Dragging left/right adjusts the value.
- **Math Evaluation:** Numeric inputs must accept mathematical expressions (e.g., `100 + 20`, `1920 / 2`, `50 * 1.5`).
- **Keyboard Navigation:**
    - `Tab`: Move to next property.
    - `Shift + Tab`: Move to previous.
    - `Enter`: Confirm and blur.
    - `Up/Down Arrow`: Increment/Decrement by 1.
    - `Shift + Up/Down`: Increment/Decrement by 10.
- **Multi-Selection State:**
    - If selected objects share a property value, show the value.
    - If values differ, show "Mixed" or a visual indicator.
    - Editing a "Mixed" property updates all selected objects to the new value (or applies a relative delta if dragging).

**Panel Structure:**
1.  **Alignment & Distribution:** Top row icons (Align Left, Center, Right, Top, Middle, Bottom, Distribute).
2.  **Transform:** Compact grid for X, Y, W, H, Rotation (°), Corner Radius.
3.  **Layer:** Blend Mode (dropdown) and Opacity (%).
4.  **Text (Contextual):** Font Family, Weight, Size, Line Height (px/%), Letter Spacing, Paragraph Spacing, Auto-width/Auto-height toggles.
5.  **Fill:** Stackable color/gradient/image fills. Toggle visibility per fill.
6.  **Stroke:** Color, Width, Position (Inside/Center/Outside), Dashed lines.
7.  **Effects:** Drop Shadow, Inner Shadow, Layer Blur, Background Blur.
8.  **Export:** (Future scope)

## 5. Technical Architecture & Stack
**[Detailed Spec: Architecture Overview](./tech-specs/architecture-overview.md)**

### 5.1 Core Technologies
- **Stack:** Plain HTML5, CSS3, and Vanilla JavaScript (ES6+).
- **Constraint:** No TypeScript.
- **Rendering:** Hybrid approach:
    - **DOM Layer (`SlideRenderer.js`):** For high-fidelity text rendering and accessibility.
    - **Canvas Layer (`CanvasManager.js`):** For interaction gizmos, selection overlays, and complex background rendering.

### 5.2 Libraries & Dependencies
- **Animation Engine:** [Anime.js](https://animejs.com/documentation/) (Mandatory).
    - Used for slide transitions, object animations, and UI motion.
- **External Libraries:** Permitted for specific complex needs (e.g., 3D rendering, rich text), but core logic should remain dependency-light.

### 5.3 Code Quality & Scalability
- **Modularity:** Native ES Modules (`import`/`export`) to enforce separation of concerns.
- **File Size Limit:** Strict adherence to keeping files under 500 lines to ensure readability and maintainability.
- **State Management:** Custom, lightweight state store (Pub/Sub or Observer pattern) implemented in Vanilla JS.
- **File Format:** JSON-based document structure for easy parsing.