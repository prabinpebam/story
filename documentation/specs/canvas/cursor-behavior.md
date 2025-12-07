# Cursor Behavior Specification

## Overview

This specification defines comprehensive cursor behavior across all interaction states in the application. Proper cursor feedback is essential for discoverability, affordance, and professional user experience.

**Design Principle:** The cursor should always communicate:
1. **What can be done** (affordance)
2. **What is being done** (feedback)
3. **Where interaction happens** (spatial context)

---

## 1. Industry Benchmark Summary

### Analysis of Top Design Applications

| Application | Strengths | Notable Patterns |
|-------------|-----------|------------------|
| **Figma** | Custom cursors for tools, cursor chat, rotation cursor with angle indicator | Cursor hides during scrub input, custom crosshair for creation tools |
| **Sketch** | Native macOS cursors, clean minimal approach | Standard resize handles, rotation offset cursor |
| **Adobe XD** | Rich cursor variations, custom tool cursors | Preview-based cursors for asset drag |
| **Canva** | Friendly cursors, drag preview thumbnails | Simplified cursor states for broad audience |
| **PowerPoint** | Standard Windows cursors, contextual hints | Cursor with live preview during drag |
| **Keynote** | macOS native, smooth transitions | Crosshair for drawing, hand for pan |

### Key Industry Patterns

1. **Tool Selection**: Cursor changes immediately on tool selection
2. **Hover Affordance**: Cursor indicates possible action before click
3. **Active Feedback**: Different cursor during drag vs. hover
4. **Hidden Cursor**: Cursor hides during precision scrubbing (value inputs)
5. **Rotation Offset**: Rotation cursor appears offset from handle
6. **Constrained Feedback**: Visual cue when Shift constrains action

---

## 2. Cursor Categories

### 2.1 System Cursors (CSS Native)

| Cursor | CSS Value | Usage |
|--------|-----------|-------|
| Default Arrow | `default` | General UI, menus, buttons |
| Pointer | `pointer` | Clickable elements, buttons, links |
| Text | `text` | Text input fields, editable text |
| Move | `move` | Moving elements (deprecated - use `grab`) |
| Grab | `grab` | Draggable surfaces (ready state) |
| Grabbing | `grabbing` | Actively dragging |
| Crosshair | `crosshair` | Creation tools (shape, line) |
| Not Allowed | `not-allowed` | Disabled elements, invalid drop |
| Wait | `wait` | Loading states |
| Progress | `progress` | Background processing |
| None | `none` | Hidden (precision input, presentation) |

### 2.2 Resize Cursors

| Cursor | CSS Value | Usage |
|--------|-----------|-------|
| North-South | `ns-resize` | Vertical resize (N, S handles) |
| East-West | `ew-resize` | Horizontal resize (E, W handles) |
| NE-SW | `nesw-resize` | Diagonal resize (NE, SW handles) |
| NW-SE | `nwse-resize` | Diagonal resize (NW, SE handles) |
| Row Resize | `row-resize` | Row height adjustment |
| Col Resize | `col-resize` | Column width adjustment |

### 2.3 Custom Cursors (Future Enhancement)

| Cursor | Description | Priority |
|--------|-------------|----------|
| Rotate | Curved arrow indicating rotation | P1 |
| Crosshair with preview | Shape outline preview | P2 |
| Eyedropper | Color picker tool | P2 |
| Pen tool | Anchor point cursor | P3 |
| Zoom In/Out | Magnifier with +/- | P3 |

---

## 3. Cursor States by Context

### 3.1 Canvas Area

#### A. Select Tool Active (`cursor-select`)

| Condition | Cursor | Notes |
|-----------|--------|-------|
| Hovering empty canvas | `default` | Ready to marquee select |
| Hovering unselected element | `default` → `move` on mousedown | Indicates element is selectable |
| Hovering selected element (body) | `move` | Ready to drag |
| Hovering resize handle | `{direction}-resize` | nw, n, ne, e, se, s, sw, w |
| Hovering rotation handle | `grab` → custom rotate cursor | Future: custom rotation cursor |
| Dragging element | `move` or `grabbing` | Currently moving |
| Marquee selecting | `crosshair` or `default` | Drawing selection box |

#### B. Hand Tool Active (`cursor-hand`)

| Condition | Cursor | Notes |
|-----------|--------|-------|
| Hovering canvas | `grab` | Ready to pan |
| Panning (mouse down) | `grabbing` | Actively panning |
| Space key held (temporary) | `grab` → `grabbing` | Temporary hand tool |

#### C. Shape Tool Active (`cursor-shape`)

| Condition | Cursor | Notes |
|-----------|--------|-------|
| Hovering canvas | `crosshair` | Ready to draw |
| Drawing shape (mouse down) | `crosshair` | Actively drawing |
| Shift held (constrain) | `crosshair` | Same cursor, constrained behavior |

#### D. Text Tool Active (`cursor-text`)

| Condition | Cursor | Notes |
|-----------|--------|-------|
| Hovering canvas | `crosshair` or `text` | Ready to create text box |
| Hovering existing text | `text` | Ready to edit |
| Drawing text box | `crosshair` | Creating bounding box |
| Editing text (contenteditable) | `text` | Standard text editing |

#### E. Image Tool Active (`cursor-image`)

| Condition | Cursor | Notes |
|-----------|--------|-------|
| Hovering canvas | `crosshair` | Ready to place image |
| With image queued | `copy` or custom preview | Shows image being placed |

### 3.2 Resize Handles (Detailed)

Element rotation affects which resize cursor to use. The cursor should indicate the visual direction of resize, not the semantic handle position.

#### Unrotated Element (0°)

| Handle | Cursor |
|--------|--------|
| NW | `nwse-resize` |
| N | `ns-resize` |
| NE | `nesw-resize` |
| E | `ew-resize` |
| SE | `nwse-resize` |
| S | `ns-resize` |
| SW | `nesw-resize` |
| W | `ew-resize` |

#### Rotated Element

Cursor should rotate with the element to maintain visual correctness:
- 0-22.5° and 157.5-180°: Use standard cursors
- 22.5-67.5°: Rotate cursor mapping by 45°
- 67.5-112.5°: Rotate cursor mapping by 90°
- 112.5-157.5°: Rotate cursor mapping by 135°

**Implementation:** Calculate effective cursor based on element rotation:
```javascript
function getResizeCursor(handle, elementRotation) {
  const baseCursors = {
    'nw': 'nwse-resize', 'n': 'ns-resize', 'ne': 'nesw-resize',
    'e': 'ew-resize', 'se': 'nwse-resize', 's': 'ns-resize',
    'sw': 'nesw-resize', 'w': 'ew-resize'
  };
  
  // Normalize rotation to 0-180 range (cursors are symmetric)
  const normalized = ((elementRotation % 180) + 180) % 180;
  
  // Determine rotation offset (0, 1, 2, or 3 for each 45° segment)
  const offset = Math.round(normalized / 45) % 4;
  
  // Cursor rotation cycle
  const cursorCycle = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];
  const handleOrder = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  
  const baseIndex = handleOrder.indexOf(handle);
  const cursorIndex = (Math.floor(baseIndex / 2) + offset) % 4;
  
  return cursorCycle[cursorIndex];
}
```

### 3.3 UI Panels

#### Property Inspector

| Element | Hover Cursor | Active Cursor |
|---------|--------------|---------------|
| Text input | `text` | `text` |
| Number input | `text` | `text` |
| Scrub label (e.g., "X", "W") | `ew-resize` | `none` (hidden) |
| Dropdown | `pointer` | `pointer` |
| Slider track | `pointer` | `ew-resize` |
| Slider thumb | `grab` | `grabbing` |
| Color swatch | `pointer` | `pointer` |
| Button | `pointer` | `pointer` |
| Checkbox | `pointer` | `pointer` |

#### Layer Tree

| Element | Hover Cursor | Active Cursor |
|---------|--------------|---------------|
| Layer row | `default` | `default` |
| Layer row (during drag reorder) | `grabbing` | `grabbing` |
| Visibility toggle | `pointer` | `pointer` |
| Lock toggle | `pointer` | `pointer` |
| Expand/collapse arrow | `pointer` | `pointer` |

#### Slide List

| Element | Hover Cursor | Active Cursor |
|---------|--------------|---------------|
| Slide thumbnail | `pointer` | `pointer` |
| Slide (during reorder) | `grabbing` | `grabbing` |
| Add slide button | `pointer` | `pointer` |

#### Panel Resize

| Element | Cursor |
|---------|--------|
| Panel edge (N/S) | `ns-resize` |
| Panel edge (E/W) | `ew-resize` |
| Panel corner | `nwse-resize` or `nesw-resize` |
| Panel header (drag) | `grab` → `grabbing` |

### 3.4 Flyouts and Modals

| Element | Cursor |
|---------|--------|
| Flyout background | `default` |
| Close button | `pointer` |
| Input fields | `text` |
| Buttons | `pointer` |
| Draggable modal header | `grab` → `grabbing` |

---

## 4. Cursor Visibility States

### 4.1 When to Hide the Cursor

The cursor should be hidden (`cursor: none`) in these scenarios:

| Scenario | Reason | Current Status |
|----------|--------|----------------|
| Scrub input dragging | Prevents visual interference with value changes | ✅ Implemented |
| Presentation mode (after idle) | Immersive viewing experience | ✅ Planned (3s timeout) |
| Color picker (eyedropper) | Precision color sampling | ❌ Not implemented |
| Precise drawing (optional) | Some apps hide during pen strokes | ❌ Not implemented |

### 4.2 When to Show Custom Cursors

Custom cursor images should be used for:
1. **Rotation handle**: Curved arrow indicating rotation direction
2. **Eyedropper tool**: Pipette icon for color picking
3. **Zoom tool**: Magnifier with +/- indicator
4. **Comment tool**: Speech bubble cursor (for collaboration)
5. **Hand tool**: Open hand (grab) and closed hand (grabbing)

---

## 5. Implementation Architecture

### 5.1 Current Implementation

The current system uses body class names to control canvas cursors:

```javascript
// Toolbar.js
updateCursor(activeTool) {
    document.body.classList.remove('cursor-select', 'cursor-hand', 'cursor-shape', 'cursor-text', 'cursor-image');
    document.body.classList.add(`cursor-${activeTool}`);
}
```

```css
/* canvas.css */
body.cursor-select #interaction-canvas { cursor: default; }
body.cursor-hand #interaction-canvas { cursor: grab; }
```

### 5.2 Proposed Architecture

Introduce a `CursorManager` service for centralized cursor control:

```javascript
class CursorManager {
  constructor() {
    this.stack = []; // Cursor state stack for nested contexts
    this.currentTool = 'select';
    this.isInteracting = false;
  }
  
  // Set cursor based on tool
  setTool(tool) {
    this.currentTool = tool;
    this.updateCursor();
  }
  
  // Push temporary cursor (for interactions)
  push(cursor, reason) {
    this.stack.push({ cursor, reason });
    this.applyTopCursor();
  }
  
  // Pop temporary cursor
  pop(reason) {
    const index = this.stack.findLastIndex(s => s.reason === reason);
    if (index !== -1) {
      this.stack.splice(index, 1);
    }
    this.applyTopCursor();
  }
  
  // Hide cursor
  hide(reason) {
    this.push('none', reason);
  }
  
  // Apply the topmost cursor from stack, or tool default
  applyTopCursor() {
    const cursor = this.stack.length > 0 
      ? this.stack[this.stack.length - 1].cursor 
      : this.getToolCursor();
    
    document.body.style.cursor = cursor;
    document.getElementById('interaction-canvas').style.cursor = cursor;
  }
  
  getToolCursor() {
    const toolCursors = {
      select: 'default',
      hand: 'grab',
      shape: 'crosshair',
      text: 'crosshair',
      image: 'crosshair'
    };
    return toolCursors[this.currentTool] || 'default';
  }
}

export const cursorManager = new CursorManager();
```

### 5.3 Integration Points

| Module | Cursor Responsibility |
|--------|----------------------|
| `Toolbar.js` | Tool selection cursors |
| `CanvasManager.js` | Resize/rotation handle cursors |
| `GizmoRenderer.js` | Handle hover detection |
| `ScrubbableControl.js` | Hide during scrub |
| `DraggablePanel.js` | Panel drag cursors |
| `SlideList.js` | Reorder drag cursor |
| `LayerTree.js` | Reorder drag cursor |

---

## 6. CSS Token System

### 6.1 Cursor Custom Properties

```css
:root {
  /* Base cursors */
  --cursor-default: default;
  --cursor-pointer: pointer;
  --cursor-text: text;
  --cursor-grab: grab;
  --cursor-grabbing: grabbing;
  --cursor-crosshair: crosshair;
  --cursor-move: move;
  --cursor-not-allowed: not-allowed;
  --cursor-none: none;
  
  /* Resize cursors */
  --cursor-resize-n: ns-resize;
  --cursor-resize-s: ns-resize;
  --cursor-resize-e: ew-resize;
  --cursor-resize-w: ew-resize;
  --cursor-resize-nw: nwse-resize;
  --cursor-resize-se: nwse-resize;
  --cursor-resize-ne: nesw-resize;
  --cursor-resize-sw: nesw-resize;
  
  /* Custom cursors (future) */
  --cursor-rotate: url('/assets/cursors/rotate.svg') 12 12, grab;
  --cursor-eyedropper: url('/assets/cursors/eyedropper.svg') 1 15, crosshair;
  --cursor-zoom-in: zoom-in;
  --cursor-zoom-out: zoom-out;
}
```

### 6.2 Body State Classes

```css
/* Tool-based canvas cursors */
body.cursor-select #interaction-canvas { cursor: var(--cursor-default); }
body.cursor-hand #interaction-canvas { cursor: var(--cursor-grab); }
body.cursor-hand.is-panning #interaction-canvas { cursor: var(--cursor-grabbing); }
body.cursor-shape #interaction-canvas { cursor: var(--cursor-crosshair); }
body.cursor-text #interaction-canvas { cursor: var(--cursor-crosshair); }
body.cursor-image #interaction-canvas { cursor: var(--cursor-crosshair); }

/* Interaction overrides */
body.is-dragging #interaction-canvas { cursor: var(--cursor-move); }
body.is-resizing #interaction-canvas { cursor: inherit; } /* Handle determines cursor */
body.is-rotating #interaction-canvas { cursor: var(--cursor-rotate); }

/* Global hidden cursor */
body.cursor-hidden,
body.cursor-hidden * { cursor: none !important; }
```

---

## 7. Accessibility Considerations

### 7.1 Requirements

1. **Sufficient Size**: Custom cursors must be at least 24x24px
2. **Contrast**: Cursor must be visible on all backgrounds
3. **No Flicker**: Cursor changes must be smooth (no flashing)
4. **Consistency**: Same action = same cursor everywhere

### 7.2 Reduced Motion

For users with `prefers-reduced-motion`:
- Disable animated cursors
- Use static cursor variants
- No cursor transition animations

```css
@media (prefers-reduced-motion: reduce) {
  * { cursor-animation: none; }
}
```

---

## 8. Testing Checklist

### Manual Testing

- [ ] Each tool displays correct cursor on hover
- [ ] Resize handles show directional cursors
- [ ] Rotated elements show correct resize cursors
- [ ] Cursor changes immediately on tool switch
- [ ] Cursor hides during scrub input
- [ ] Grab/grabbing transition on panels
- [ ] Cursor resets after modal close
- [ ] Cursor visible on all UI backgrounds

### Automated Testing

```javascript
describe('CursorManager', () => {
  it('should set tool cursor correctly');
  it('should stack temporary cursors');
  it('should restore cursor after pop');
  it('should hide cursor when requested');
  it('should calculate rotated resize cursors');
});
```

---

## 9. Migration Plan

### Phase 1: Audit & Document (Current)
- ✅ Document all current cursor usage
- ✅ Identify gaps and inconsistencies
- ✅ Create specification document

### Phase 2: Infrastructure
- [ ] Create `CursorManager` service
- [ ] Add CSS custom properties for cursors
- [ ] Update body state class system

### Phase 3: Canvas Cursors
- [ ] Implement rotation-aware resize cursors
- [ ] Add hand tool cursor states
- [ ] Add temporary cursor for Space+drag

### Phase 4: UI Cursors
- [ ] Standardize panel resize cursors
- [ ] Add scrub input cursor hiding
- [ ] Standardize drag-and-drop cursors

### Phase 5: Custom Cursors
- [ ] Design custom rotation cursor
- [ ] Design custom eyedropper cursor
- [ ] Implement SVG cursor loading

---

## 10. Related Documents

- [Canvas Interaction Spec](./canvas-interaction.md)
- [UI Design System](../app-ui-design-system/ui-design-system.md)
- [Toolbar Redesign](../toolbar/toolbar-redesign.md)
- [Presentation Mode Plan](../../plans/presentation-mode-implementation-plan.md)
