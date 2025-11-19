# Technical Specification: Data Structures & State

## 1. Global State (Store)
The application state is a single JavaScript object managed by `Store.js`.

```javascript
const State = {
  meta: {
    title: "Untitled Presentation",
    author: "User",
    created: 1678886400000,
    modified: 1678886400000,
    theme: "default-dark"
  },
  editor: {
    activeSlideId: "slide-1",
    selectedElementIds: ["el-1"], // Multi-selection support
    activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    gridEnabled: true,
    snapToGrid: true
  },
  slides: {
    "slide-1": { ...SlideModel }
  },
  slideOrder: ["slide-1"] // Array of IDs to maintain order
};
```

## 2. Slide Model
Each slide is a container for elements and background settings.

```javascript
const SlideModel = {
  id: "slide-1",
  title: "Introduction",
  background: {
    type: "solid", // 'solid', 'gradient', 'image'
    value: "#ffffff"
  },
  elements: {
    "el-1": { ...ElementModel }
  },
  elementOrder: ["el-1"], // Z-index order (last is top)
  notes: "Speaker notes here..."
};
```

## 3. Element Models
All elements share a common base interface but have specific properties based on their type.

### Base Element Interface
```javascript
const BaseElement = {
  id: "el-uuid",
  type: "text", // 'text', 'rect', 'circle', 'image', 'video'
  name: "Text Layer 1",
  locked: false,
  visible: true,
  x: 100,
  y: 100,
  width: 200,
  height: 50,
  rotation: 0, // Degrees
  opacity: 1.0,
  blendMode: "normal"
};
```

### Text Element
```javascript
const TextElement = {
  ...BaseElement,
  type: "text",
  content: "Hello World",
  style: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 400,
    textAlign: "left", // 'left', 'center', 'right', 'justify'
    color: "#000000",
    lineHeight: 1.5,
    letterSpacing: 0
  }
};
```

### Shape Element (Rect/Circle)
```javascript
const ShapeElement = {
  ...BaseElement,
  type: "rect",
  style: {
    fill: "#ff4d00",
    stroke: "#000000",
    strokeWidth: 2,
    radius: 0 // Border radius for rects
  }
};
```

### Image Element
```javascript
const ImageElement = {
  ...BaseElement,
  type: "image",
  src: "blob:http://...", // or data/url
  originalWidth: 1920,
  originalHeight: 1080,
  fit: "cover" // 'cover', 'contain', 'fill'
};
```

## 4. History Stack (Undo/Redo)
The history system tracks discrete actions rather than full state snapshots to save memory.

```javascript
const HistoryAction = {
  type: "UPDATE_ELEMENT",
  timestamp: 1678886405000,
  payload: {
    elementId: "el-1",
    before: { x: 100 },
    after: { x: 150 }
  }
};
```
