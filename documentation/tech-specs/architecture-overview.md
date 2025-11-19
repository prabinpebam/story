# Technical Specification: Architecture Overview

## 1. Core Philosophy
The application is built using **Vanilla JavaScript (ES6+)** with no build step required for development (using native ES Modules). It relies on the DOM for the primary UI and Slide content to ensure accessibility and crisp text rendering, while using HTML5 Canvas/WebGL only for high-performance background effects.

## 2. Technology Stack
- **Language:** JavaScript (ES2022+).
- **Styling:** CSS3 with CSS Variables for theming. Atomic/Utility classes where appropriate, but primarily component-scoped styles.
- **Icons:** FontAwesome Free (via CDN).
- **Animation:** Anime.js (v3.x).
- **State Management:** Custom Pub/Sub Store (Redux-inspired but lightweight).

## 3. Directory Structure
```
src/
├── core/               # Core application logic
│   ├── Store.js        # State management
│   ├── Events.js       # Event bus
│   ├── History.js      # Undo/Redo stack
│   └── App.js          # Main entry controller
├── canvas/             # Canvas engine
│   ├── CanvasManager.js
│   ├── Interaction.js  # Mouse/Keyboard handling
│   ├── Renderer.js     # DOM/Canvas rendering logic
│   └── Gizmo.js        # Selection & Transform handles
├── slides/             # Slide logic
│   ├── SlideManager.js
│   ├── ElementFactory.js
│   └── Thumbnail.js
├── ui/                 # UI Components & Layout
│   ├── components/     # Reusable widgets (Knob, Switch)
│   ├── panels/         # Sidebar panels (Layers, Properties)
│   ├── ContextMenu.js  # Custom right-click menu
│   └── Icons.js        # FontAwesome helper
├── utils/              # Helpers
│   ├── math.js         # Geometry helpers
│   ├── uuid.js         # ID generation
│   └── dom.js          # DOM manipulation helpers
└── main.js             # Entry point
```

## 4. Design Patterns
- **Singleton:** Used for `Store`, `CanvasManager`, and `HistoryManager` to ensure a single source of truth.
- **Observer (Pub/Sub):** Components subscribe to Store events (`state-changed`) to reactively update.
- **Factory:** `ElementFactory` creates different types of slide elements (Text, Shape, Image) with default properties.
- **Strategy:** Used for Tools (SelectTool, ShapeTool, TextTool) where each tool implements a common interface (`onMouseDown`, `onDrag`, `onMouseUp`).

## 5. Initialization Flow
1.  `main.js` imports `App`.
2.  `App` initializes `Store`.
3.  `App` initializes `CanvasManager` (sets up DOM layers).
4.  `App` initializes `UIManager` (renders sidebars).
5.  `App` loads initial data (or default blank slide).
6.  Event listeners are bound.
