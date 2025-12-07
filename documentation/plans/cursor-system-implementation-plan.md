# Cursor System Implementation Plan

## Overview

This plan outlines the implementation steps to upgrade the cursor system according to the [Cursor Behavior Specification](../specs/canvas/cursor-behavior.md).

**Goal:** Create a unified, predictable cursor system that provides clear visual feedback for all interactions.

---

## Phase 1: Infrastructure (Priority: High)

### Task 1.1: Create CursorManager Service

**File:** `src/core/CursorManager.js`

```javascript
/**
 * CursorManager - Centralized cursor state management
 * 
 * Features:
 * - Tool-based default cursors
 * - Stacked temporary cursors for interactions
 * - Cursor hiding for precision input
 * - Rotation-aware resize cursors
 */
class CursorManager {
    constructor() {
        this.stack = [];
        this.currentTool = 'select';
        this.canvasElement = null;
    }
    
    init(canvasSelector = '#interaction-canvas') {
        this.canvasElement = document.querySelector(canvasSelector);
    }
    
    setTool(tool) { /* ... */ }
    push(cursor, reason) { /* ... */ }
    pop(reason) { /* ... */ }
    hide(reason) { /* ... */ }
    getResizeCursor(handle, rotation) { /* ... */ }
}

export const cursorManager = new CursorManager();
```

**Estimated Time:** 2-3 hours

### Task 1.2: Add Cursor CSS Custom Properties

**File:** `styles/modules/variables.css`

Add cursor tokens:
```css
:root {
    /* Cursor tokens */
    --cursor-default: default;
    --cursor-pointer: pointer;
    --cursor-grab: grab;
    --cursor-grabbing: grabbing;
    --cursor-crosshair: crosshair;
    --cursor-text: text;
    --cursor-move: move;
    --cursor-not-allowed: not-allowed;
    --cursor-none: none;
    
    /* Resize cursors */
    --cursor-resize-ns: ns-resize;
    --cursor-resize-ew: ew-resize;
    --cursor-resize-nwse: nwse-resize;
    --cursor-resize-nesw: nesw-resize;
}
```

**Estimated Time:** 30 minutes

### Task 1.3: Update Canvas CSS

**File:** `styles/modules/canvas.css`

Replace hardcoded cursors with tokens:
```css
body.cursor-select #interaction-canvas { cursor: var(--cursor-default); }
body.cursor-hand #interaction-canvas { cursor: var(--cursor-grab); }
body.cursor-hand.is-panning #interaction-canvas { cursor: var(--cursor-grabbing); }
body.cursor-shape #interaction-canvas { cursor: var(--cursor-crosshair); }
body.cursor-text #interaction-canvas { cursor: var(--cursor-crosshair); }
body.cursor-image #interaction-canvas { cursor: var(--cursor-crosshair); }

/* Interaction states */
body.is-dragging { cursor: var(--cursor-move) !important; }
body.cursor-hidden, body.cursor-hidden * { cursor: none !important; }
```

**Estimated Time:** 1 hour

---

## Phase 2: Canvas Interaction Cursors (Priority: High)

### Task 2.1: Integrate CursorManager with Toolbar

**File:** `src/ui/Toolbar.js`

Update `updateCursor()` to use CursorManager:
```javascript
import { cursorManager } from '../core/CursorManager.js';

updateCursor(activeTool) {
    // Remove old class-based approach (keep for fallback)
    document.body.classList.remove('cursor-select', 'cursor-hand', 'cursor-shape', 'cursor-text', 'cursor-image');
    document.body.classList.add(`cursor-${activeTool}`);
    
    // New approach
    cursorManager.setTool(activeTool);
}
```

**Estimated Time:** 1 hour

### Task 2.2: Add Resize Handle Cursor Logic

**File:** `src/core/CanvasManager.js`

Add cursor updates on handle hover:
```javascript
// In handleMouseMove or similar
if (handleHit) {
    const rotation = selectedElement?.rotation || 0;
    const cursor = cursorManager.getResizeCursor(handleHit.handle, rotation);
    cursorManager.push(cursor, 'resize-handle-hover');
} else {
    cursorManager.pop('resize-handle-hover');
}
```

**Estimated Time:** 2-3 hours

### Task 2.3: Add Rotation Handle Cursor

**Files:** 
- `src/core/canvas/HitTesting.js`
- `src/core/CanvasManager.js`

When hovering rotation handle:
```javascript
if (hit.action === 'rotate') {
    cursorManager.push('grab', 'rotation-handle-hover');
    // Future: custom rotation cursor
}
```

**Estimated Time:** 1-2 hours

### Task 2.4: Hand Tool Panning States

**File:** `src/core/CanvasManager.js`

Add panning state cursor:
```javascript
// On Space keydown (temporary hand tool)
if (e.code === 'Space' && !isInputFocused) {
    document.body.classList.add('is-space-panning');
    cursorManager.push('grab', 'space-pan');
}

// On Space keyup
document.body.classList.remove('is-space-panning');
cursorManager.pop('space-pan');

// On mousedown while hand tool
cursorManager.push('grabbing', 'panning');

// On mouseup
cursorManager.pop('panning');
```

**Estimated Time:** 1-2 hours

### Task 2.5: Marquee Selection Cursor

**File:** `src/core/CanvasManager.js`

During marquee selection:
```javascript
// When starting marquee
cursorManager.push('crosshair', 'marquee');

// When ending marquee
cursorManager.pop('marquee');
```

**Estimated Time:** 30 minutes

---

## Phase 3: UI Component Cursors (Priority: Medium)

### Task 3.1: Standardize Panel Resize Handles

**File:** `styles/modules/panel-components.css`

Already implemented, verify consistency:
```css
.resize-n, .resize-s { cursor: var(--cursor-resize-ns); }
.resize-e, .resize-w { cursor: var(--cursor-resize-ew); }
.resize-nw, .resize-se { cursor: var(--cursor-resize-nwse); }
.resize-ne, .resize-sw { cursor: var(--cursor-resize-nesw); }
```

**Estimated Time:** 30 minutes

### Task 3.2: Update DraggablePanel Cursors

**File:** `src/ui/components/DraggablePanel.js`

Ensure consistent grab/grabbing:
```javascript
// Header hover
this.headerElement.style.cursor = 'grab';

// During drag
handleDragStart(e) {
    this.headerElement.style.cursor = 'grabbing';
    cursorManager.push('grabbing', 'panel-drag');
}

handleDragEnd() {
    this.headerElement.style.cursor = 'grab';
    cursorManager.pop('panel-drag');
}
```

**Estimated Time:** 1 hour

### Task 3.3: Add Cursor for Slide/Layer Reordering

**Files:**
- `src/ui/SlideList.js`
- `src/ui/LayerTree.js`

During drag reorder:
```javascript
onDragStart() {
    cursorManager.push('grabbing', 'list-reorder');
    document.body.classList.add('is-reordering');
}

onDragEnd() {
    cursorManager.pop('list-reorder');
    document.body.classList.remove('is-reordering');
}
```

**Estimated Time:** 1-2 hours

### Task 3.4: Verify Scrub Input Cursor Hiding

**File:** `src/ui/components/ScrubbableControl.js`

Already implemented - verify it works with CursorManager:
```javascript
handleDragStart(e) {
    document.body.style.cursor = 'ew-resize';
    // After small movement, hide cursor
    cursorManager.hide('scrub-drag');
}

handleDragEnd() {
    document.body.style.cursor = 'default';
    cursorManager.pop('scrub-drag');
}
```

**Estimated Time:** 30 minutes

---

## Phase 4: Flyout and Modal Cursors (Priority: Low)

### Task 4.1: Color Picker Flyout

**File:** `src/ui/components/FillFlyout/*.js`

Ensure pointer cursors on swatches and buttons:
```css
.swatch { cursor: pointer; }
.flyout-btn { cursor: pointer; }
```

**Estimated Time:** 30 minutes

### Task 4.2: Modal Dialogs

Standardize cursor on modal interactions:
- Draggable header: `grab` → `grabbing`
- Close button: `pointer`
- Overlay: `default`

**Estimated Time:** 30 minutes

---

## Phase 5: Presentation Mode (Priority: Medium)

### Task 5.1: Auto-Hide Cursor After Idle

**File:** `src/core/PresentationManager.js`

```javascript
const CURSOR_HIDE_DELAY = 3000; // 3 seconds
let cursorTimeout = null;

function showCursor() {
    document.body.classList.remove('cursor-hidden');
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(hideCursor, CURSOR_HIDE_DELAY);
}

function hideCursor() {
    document.body.classList.add('cursor-hidden');
}

// Attach to mouse movement in presentation mode
document.addEventListener('mousemove', () => {
    if (isPresentationMode) showCursor();
});
```

**Estimated Time:** 1-2 hours

---

## Phase 6: Custom Cursors (Priority: Low, Future)

### Task 6.1: Create Custom Cursor SVGs

**Directory:** `assets/cursors/`

Design and create:
- `rotate.svg` - Curved arrow for rotation
- `eyedropper.svg` - Color picker pipette

**Estimated Time:** 2-3 hours (design work)

### Task 6.2: Implement Custom Cursor Loading

**File:** `src/core/CursorManager.js`

```javascript
const customCursors = {
    rotate: 'url(/assets/cursors/rotate.svg) 12 12, grab',
    eyedropper: 'url(/assets/cursors/eyedropper.svg) 1 15, crosshair'
};

setCustomCursor(name) {
    if (customCursors[name]) {
        this.push(customCursors[name], `custom-${name}`);
    }
}
```

**Estimated Time:** 1-2 hours

---

## Testing Plan

### Unit Tests

**File:** `tests/unit/core/CursorManager.test.js`

```javascript
describe('CursorManager', () => {
    it('should initialize with default tool', () => {});
    it('should change cursor on tool switch', () => {});
    it('should stack temporary cursors', () => {});
    it('should restore previous cursor on pop', () => {});
    it('should hide cursor', () => {});
    it('should calculate rotation-aware resize cursor', () => {});
});
```

### Manual Test Checklist

- [ ] Select tool shows default cursor on canvas
- [ ] Hand tool shows grab cursor, grabbing when panning
- [ ] Shape tools show crosshair cursor
- [ ] Resize handles show correct directional cursors
- [ ] Rotated elements show correct resize cursors
- [ ] Space+drag shows hand cursor temporarily
- [ ] Scrub inputs hide cursor during drag
- [ ] Panels show grab/grabbing on header drag
- [ ] Presentation mode hides cursor after 3s idle

---

## Timeline Summary

| Phase | Priority | Estimated Time |
|-------|----------|----------------|
| Phase 1: Infrastructure | High | 4-5 hours |
| Phase 2: Canvas Cursors | High | 6-8 hours |
| Phase 3: UI Components | Medium | 3-4 hours |
| Phase 4: Flyouts/Modals | Low | 1 hour |
| Phase 5: Presentation | Medium | 1-2 hours |
| Phase 6: Custom Cursors | Low/Future | 3-5 hours |

**Total Estimated Time:** 18-25 hours

---

## Dependencies

- No external dependencies required
- All changes use native CSS cursor values
- Custom SVG cursors are optional enhancement

---

## Success Criteria

1. All cursors follow specification
2. No hardcoded cursor values in JS
3. CursorManager handles all cursor state
4. Rotation-aware resize cursors work correctly
5. All existing functionality preserved
6. Tests pass

---

## Related Documents

- [Cursor Behavior Specification](../specs/canvas/cursor-behavior.md)
- [Canvas Interaction Spec](../specs/canvas/canvas-interaction.md)
- [UI Design System](../specs/app-ui-design-system/ui-design-system.md)
