# CodeFill Mouse Interaction - Technical Architecture

## Executive Summary

This document defines the technical architecture for enabling mouse interaction within CodeFill canvas animations. The challenge is integrating mouse events into CodeRunner-based fills while respecting the existing complex event handling system used for element selection, dragging, resizing, and presentation navigation.

---

## Critique & Risk Analysis

### Weak Points Identified

| Issue | Severity | Description |
|-------|----------|-------------|
| **Rotation not handled** | 🔴 HIGH | Element bounds calculation ignores `rotation`. A rotated shape will have incorrect hit-test for `isOver`. |
| **Nested transforms** | 🔴 HIGH | Groups/nested elements accumulate rotation, scale. Parent rotation affects child's world coords. |
| **Text editing conflict** | 🟡 MEDIUM | When `editingElementId` is set, mouse events should NOT broadcast to CodeFill (typing interference). |
| **Memory leak risk** | 🟡 MEDIUM | If `unsubscribeMouse` is not called on CodeRunner cleanup, listeners accumulate. |
| **Existing mouse handlers** | 🟡 MEDIUM | CodeRunner already has direct DOM listeners (`_handleMouseMove`, etc.) that must be removed/migrated. |
| **Presentation coordinate edge cases** | 🟡 MEDIUM | Letter-boxed slides need offset calculation; missing slide aspect ratio handling. |
| **Multi-fill layers** | 🟡 MEDIUM | Each `fill-layer` with CodeRunner needs independent bounds—not addressed. |
| **Touch events missing** | 🟠 LOW | Mobile/tablet presentation mode won't work. |
| **Velocity calculation** | 🟠 LOW | Division by zero if two updates have same timestamp. |

### Dependency Conflicts

| Dependency | Risk | Mitigation |
|------------|------|------------|
| **CanvasManager state machine** | DRAGGING/RESIZING states must suppress CodeFill `isDown` to prevent unintended clicks during drag. | Already mentioned but needs careful testing with `START_INTERACTION`/`END_INTERACTION`. |
| **InputManager.isInputActive()** | Text inputs steal focus; global mouse still broadcasts. | Check `isInputActive()` before broadcast or suppress for elements in editing state. |
| **Live resize events** | During text auto-resize, element bounds change rapidly. | Debounce or skip bounds update during `liveResizeData` active. |
| **Pointer-events CSS** | Various CSS files set `pointer-events: none` on layers. Presentation mode uses `!important`. | Document that CodeFill doesn't rely on pointer-events but on state broadcast. |

### Breaking Changes Risk

| Component | Risk Level | Notes |
|-----------|------------|-------|
| `CodeRunner.js` | MODERATE | Existing mouse handlers will be removed. User code using `canvas.mouseX` must still work (backward compat). |
| `AI prompts` | LOW | Old prompts won't document `mouse` object; AI may not use it until prompted. |
| Existing presets | NONE | Non-interactive presets will continue to work. |

---

## Current State Analysis

### DOM Layer Structure

```
#canvas-viewport
├── #canvas-container
│   └── #viewport (transformed for pan/zoom)
│       ├── #slide-background
│       │   └── .bg-layer (CodeFill canvas lives here for slide backgrounds)
│       ├── #slide-content
│       │   └── .shape-element (CodeFill canvas lives inside shapes)
│       └── #interaction-canvas (captures ALL mouse events in edit mode)
└── #laser-canvas (presentation mode laser pointer)
```

### Event Ownership by Mode

| Mode | Primary Event Handler | Purpose |
|------|----------------------|---------|
| **Edit (IDLE)** | CanvasManager | Hit testing, hover states |
| **Edit (DRAGGING)** | CanvasManager | Element movement |
| **Edit (RESIZING)** | CanvasManager | Handle manipulation |
| **Edit (SELECTING)** | CanvasManager | Marquee selection |
| **Edit (PANNING)** | CanvasManager | Canvas navigation |
| **Master Mode** | CanvasManager | Same as Edit, different data context |
| **Presentation** | PresentationManager | Slide navigation, laser pointer |

### The Problem

1. **`#interaction-canvas` captures all events**: It has `pointer-events: auto` and `z-index: 100`, sitting above all content. Mouse events never reach CodeFill canvases underneath.

2. **Viewport transforms complicate coordinates**: Pan/zoom transforms applied to `#viewport` mean raw mouse coordinates must be transformed to "world space" (slide coordinates).

3. **Event conflicts**: A click might be intended for CodeFill interactivity OR for selecting an element. These intentions conflict.

4. **Performance concerns**: Broadcasting mouse events to potentially many CodeFill instances must be efficient.

5. **AI code generation**: Generated code must use a consistent, documented API for mouse access.

---

## Proposed Architecture

### Core Design Principles

1. **Passive Mouse State Broadcasting**: Instead of forwarding actual DOM events, we broadcast transformed mouse state to all active CodeRunners.

2. **Mode-Aware Behavior**: Different interaction rules apply in Edit, Master, and Presentation modes.

3. **Opt-in Interactivity**: Not all CodeFills need mouse interaction. Presets declare their requirements.

4. **Consistent API**: CodeRunner provides a standardized `mouse` object that user code accesses.

---

## Architecture Components

### 1. MouseStateManager (New Module)

A singleton that tracks global mouse state and broadcasts to subscribers.

```javascript
// src/core/MouseStateManager.js
export class MouseStateManager {
    constructor() {
        this.subscribers = new Set();
        this.state = {
            // Screen coordinates (relative to viewport container)
            screenX: 0,
            screenY: 0,
            
            // World coordinates (slide space, accounting for pan/zoom)
            worldX: 0,
            worldY: 0,
            
            // Button state
            isDown: false,
            button: 0,  // 0=left, 1=middle, 2=right
            
            // Velocity (for smooth trails, etc.)
            velocityX: 0,
            velocityY: 0,
            
            // Click events (single-frame flags)
            clicked: false,
            released: false,
            
            // Timestamp
            timestamp: 0
        };
        
        this.lastState = { ...this.state };
        this.enabled = true;
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    update(newState) {
        // Calculate velocity
        const dt = (newState.timestamp - this.state.timestamp) / 1000 || 0.016;
        this.state.velocityX = (newState.worldX - this.state.worldX) / dt;
        this.state.velocityY = (newState.worldY - this.state.worldY) / dt;
        
        // Detect click/release edges
        this.state.clicked = newState.isDown && !this.lastState.isDown;
        this.state.released = !newState.isDown && this.lastState.isDown;
        
        // Update state
        Object.assign(this.state, newState);
        Object.assign(this.lastState, this.state);
        
        // Broadcast to subscribers
        if (this.enabled) {
            this.subscribers.forEach(cb => cb(this.state));
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export const mouseStateManager = new MouseStateManager();
```

### 2. CodeRunner Mouse API Enhancement

Extend CodeRunner to receive mouse state broadcasts and expose a clean API.

```javascript
// Enhanced CodeRunner mouse handling
class CodeRunner {
    constructor(canvas) {
        // ... existing code ...
        
        // Enhanced mouse state
        this.mouse = {
            // Position relative to THIS canvas (0 to width/height)
            x: 0,
            y: 0,
            
            // Normalized position (0 to 1)
            nx: 0.5,
            ny: 0.5,
            
            // Previous frame position (for trails)
            px: 0,
            py: 0,
            
            // Button state
            isDown: false,
            wasDown: false,
            
            // Single-frame events
            pressed: false,   // True only on frame of click
            released: false,  // True only on frame of release
            
            // Velocity (pixels per second)
            vx: 0,
            vy: 0,
            
            // Distance from center (0 to 1, useful for radial effects)
            distFromCenter: 0,
            
            // Angle from center (radians)
            angleFromCenter: 0,
            
            // Is mouse over this element?
            isOver: false
        };
        
        // Subscribe to global mouse state
        this.unsubscribeMouse = null;
        this.elementBounds = null;
    }
    
    /**
     * Set the bounds of the element containing this canvas
     * Used to calculate if mouse is over this element
     */
    setElementBounds(bounds) {
        this.elementBounds = bounds; // { x, y, width, height } in world space
    }
    
    /**
     * Called by MouseStateManager subscriber
     */
    updateMouseState(globalState) {
        if (!this.isPlaying || !this.elementBounds) return;
        
        const bounds = this.elementBounds;
        
        // Check if mouse is over this element
        this.mouse.isOver = (
            globalState.worldX >= bounds.x &&
            globalState.worldX <= bounds.x + bounds.width &&
            globalState.worldY >= bounds.y &&
            globalState.worldY <= bounds.y + bounds.height
        );
        
        // Store previous position
        this.mouse.px = this.mouse.x;
        this.mouse.py = this.mouse.y;
        this.mouse.wasDown = this.mouse.isDown;
        
        // Calculate local position (relative to element)
        const localX = globalState.worldX - bounds.x;
        const localY = globalState.worldY - bounds.y;
        
        // Scale to canvas resolution
        const scaleX = this.canvas.width / bounds.width;
        const scaleY = this.canvas.height / bounds.height;
        
        this.mouse.x = localX * scaleX;
        this.mouse.y = localY * scaleY;
        
        // Normalized (0-1)
        this.mouse.nx = localX / bounds.width;
        this.mouse.ny = localY / bounds.height;
        
        // Velocity (scaled to canvas space)
        this.mouse.vx = globalState.velocityX * scaleX;
        this.mouse.vy = globalState.velocityY * scaleY;
        
        // Button state
        this.mouse.isDown = globalState.isDown && this.mouse.isOver;
        this.mouse.pressed = globalState.clicked && this.mouse.isOver;
        this.mouse.released = globalState.released;
        
        // Distance and angle from center
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const dx = this.mouse.x - cx;
        const dy = this.mouse.y - cy;
        this.mouse.distFromCenter = Math.sqrt(dx*dx + dy*dy) / Math.max(cx, cy);
        this.mouse.angleFromCenter = Math.atan2(dy, dx);
        
        // Update legacy canvas properties for compatibility
        this.canvas.mouseX = this.mouse.x;
        this.canvas.mouseY = this.mouse.y;
        this.canvas.isMouseDown = this.mouse.isDown;
    }
}
```

### 3. CanvasManager Integration

Modify CanvasManager to broadcast mouse state to MouseStateManager.

```javascript
// In CanvasManager.handleMouseMove
handleMouseMove(e) {
    const state = store.getState();
    if (state.editor.mode === 'presentation') return;

    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world coordinates
    const { zoom, pan } = state.editor;
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;
    
    // Broadcast to MouseStateManager for CodeFill canvases
    mouseStateManager.update({
        screenX: mouseX,
        screenY: mouseY,
        worldX,
        worldY,
        isDown: this.interactionState === 'DRAGGING' ? false : e.buttons === 1,
        button: e.button,
        timestamp: performance.now()
    });
    
    // ... existing interaction handling ...
}
```

### 4. Mode-Specific Behavior

#### Edit Mode
- Mouse state is broadcast, but `isDown` is set to `false` during DRAGGING/RESIZING states to prevent unintended CodeFill interactions while manipulating elements.
- When user clicks on a CodeFill element and NO tool action occurs, the click is passed through.

#### Master Mode
- Same as Edit mode, operating on master slide data.

#### Presentation Mode
- Full mouse passthrough to CodeFill elements (highest priority for interactivity).
- PresentationManager must also broadcast mouse state for code fills.

```javascript
// In PresentationManager
bindEvents() {
    // ... existing code ...
    
    document.addEventListener('mousemove', (e) => {
        const state = store.getState();
        if (state.editor.mode !== 'presentation') return;
        
        // In presentation mode, slide fills entire viewport
        // Calculate world coordinates based on current slide scaling
        const viewport = this.slideContainer.getBoundingClientRect();
        const slideWidth = state.presentation.slideWidth || 1920;
        const slideHeight = state.presentation.slideHeight || 1080;
        
        const scale = Math.min(
            viewport.width / slideWidth,
            viewport.height / slideHeight
        );
        
        const offsetX = (viewport.width - slideWidth * scale) / 2;
        const offsetY = (viewport.height - slideHeight * scale) / 2;
        
        const worldX = (e.clientX - viewport.left - offsetX) / scale;
        const worldY = (e.clientY - viewport.top - offsetY) / scale;
        
        mouseStateManager.update({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX,
            worldY,
            isDown: e.buttons === 1,
            button: e.button,
            timestamp: performance.now()
        });
    });
}
```

---

## User Code API Specification

### Available Variables in User Code

| Variable | Type | Description |
|----------|------|-------------|
| `ctx` | CanvasRenderingContext2D | The 2D drawing context |
| `canvas` | HTMLCanvasElement | The canvas element |
| `canvas.width` | number | Canvas width in pixels |
| `canvas.height` | number | Canvas height in pixels |
| `mouse` | object | Mouse state object (see below) |
| `t` | number | Time in seconds since start |

### Mouse Object Properties

```javascript
mouse = {
    // Position (in canvas pixel coordinates)
    x: 0,           // 0 to canvas.width
    y: 0,           // 0 to canvas.height
    
    // Normalized position (0 to 1)
    nx: 0.5,        // 0 = left edge, 1 = right edge
    ny: 0.5,        // 0 = top edge, 1 = bottom edge
    
    // Previous frame position (for trails, velocity)
    px: 0,
    py: 0,
    
    // Button state
    isDown: false,  // Currently pressed
    pressed: false, // Just pressed this frame
    released: false,// Just released this frame
    
    // Velocity (pixels per second)
    vx: 0,
    vy: 0,
    
    // Relative to center
    distFromCenter: 0,     // 0 at center, 1 at edge
    angleFromCenter: 0,    // Angle in radians
    
    // Is mouse over this element?
    isOver: false
}
```

### Example User Code

```javascript
return {
    particles: [],
    
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, w, h);
        
        // Spawn particles on click
        if (mouse.pressed) {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: mouse.x,
                    y: mouse.y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1
                });
            }
        }
        
        // Attract particles to mouse when held
        if (mouse.isDown) {
            this.particles.forEach(p => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                p.vx += dx / dist * 0.5;
                p.vy += dy / dist * 0.5;
            });
        }
        
        // Update and draw particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            
            if (p.life > 0) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5 * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 100, 50, ${p.life})`;
                ctx.fill();
                return true;
            }
            return false;
        });
        
        // Cursor glow effect when hovering
        if (mouse.isOver) {
            ctx.save();
            ctx.filter = 'blur(20px)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
            ctx.restore();
        }
    }
};
```

---

## AI Prompt Updates

### Updated CODE_FILL_PROMPT

```javascript
export const CODE_FILL_PROMPT = `
You are an expert Generative Art coder.
Generate a JavaScript object that defines a canvas animation.

## Available Variables (globally available in scope):
- ctx: CanvasRenderingContext2D - The 2D drawing context
- canvas: HTMLCanvasElement - The canvas element (access .width and .height)
- mouse: Object - Mouse state with the following properties:
  - mouse.x, mouse.y: Position in canvas pixels (0 to width/height)
  - mouse.nx, mouse.ny: Normalized position (0 to 1)
  - mouse.px, mouse.py: Previous frame position
  - mouse.isDown: Boolean, true if mouse button is held
  - mouse.pressed: Boolean, true only on the frame of click
  - mouse.released: Boolean, true only on the frame of release
  - mouse.vx, mouse.vy: Velocity in pixels per second
  - mouse.isOver: Boolean, true if mouse is over this element

## Required Format:
return {
    // Optional: initialization (called once)
    init: function() {
        this.myState = [];
    },
    
    // Required: called every frame
    draw: function(t) {
        // t is time in seconds (float)
        const w = canvas.width;
        const h = canvas.height;
        
        // Your drawing code using ctx...
        // Access mouse state via the 'mouse' object
    }
};

## Requirements:
- The animation should match this description: "{description}"
- Use the mouse object for any interactive behavior
- Do not use external libraries
- Be creative, visual, and performant
- Return ONLY valid JavaScript code. No markdown, no explanations.

## Mouse Interaction Examples:
- Particles that follow the cursor: use mouse.x, mouse.y
- Effects on click: check mouse.pressed
- Drag interactions: check mouse.isDown with mouse.x, mouse.y
- Trail effects: use mouse.px, mouse.py for previous position
- Hover effects: check mouse.isOver
`;
```

---

## Element Bounds Synchronization

ShapeElement and SlideView must update CodeRunner with current element bounds.

### ⚠️ CRITICAL: Rotation-Aware Bounds

Simple AABB bounds are **incorrect** for rotated elements. Mouse hit-testing must account for element rotation.

```javascript
// WRONG: Simple AABB (ignores rotation)
const bounds = { x: el.x, y: el.y, width: el.width, height: el.height };

// CORRECT: Include rotation for proper hit-testing
const bounds = {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation || 0,  // Degrees
    // Center point for rotation
    cx: el.x + el.width / 2,
    cy: el.y + el.height / 2
};
```

### Rotation-Aware Hit Testing in CodeRunner

```javascript
/**
 * Check if a world-space point is inside a potentially rotated element
 */
isPointInRotatedBounds(worldX, worldY, bounds) {
    if (!bounds.rotation) {
        // Fast path: no rotation, simple AABB check
        return (
            worldX >= bounds.x &&
            worldX <= bounds.x + bounds.width &&
            worldY >= bounds.y &&
            worldY <= bounds.y + bounds.height
        );
    }
    
    // Rotate the point around the element center (inverse rotation)
    const rad = -bounds.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Translate point to origin (element center)
    const dx = worldX - bounds.cx;
    const dy = worldY - bounds.cy;
    
    // Apply inverse rotation
    const localX = dx * cos - dy * sin + bounds.cx;
    const localY = dx * sin + dy * cos + bounds.cy;
    
    // Now check against unrotated AABB
    return (
        localX >= bounds.x &&
        localX <= bounds.x + bounds.width &&
        localY >= bounds.y &&
        localY <= bounds.y + bounds.height
    );
}

updateMouseState(globalState) {
    if (!this.isPlaying || !this.elementBounds) return;
    
    const bounds = this.elementBounds;
    
    // Use rotation-aware hit test
    this.mouse.isOver = this.isPointInRotatedBounds(
        globalState.worldX, 
        globalState.worldY, 
        bounds
    );
    
    // ... rest of update logic
}
```

### Nested Groups: Accumulated Transforms

Elements inside groups inherit parent transforms. The bounds calculation must walk the parent chain:

```javascript
// In ShapeElement.applyFills()
function getWorldBounds(el, slide) {
    let accX = el.x;
    let accY = el.y;
    let accRotation = el.rotation || 0;
    
    // Walk up parent chain
    let parentId = el.parentId;
    while (parentId) {
        const parent = slide.elements[parentId];
        if (!parent) break;
        
        // Parent rotation affects child position
        if (parent.rotation) {
            const rad = parent.rotation * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            // Rotate child position around parent center
            const pcx = parent.width / 2;
            const pcy = parent.height / 2;
            const dx = accX - pcx;
            const dy = accY - pcy;
            
            accX = dx * cos - dy * sin + pcx + parent.x;
            accY = dx * sin + dy * cos + pcy + parent.y;
            accRotation += parent.rotation;
        } else {
            accX += parent.x;
            accY += parent.y;
        }
        
        parentId = parent.parentId;
    }
    
    return {
        x: accX,
        y: accY,
        width: el.width,
        height: el.height,
        rotation: accRotation,
        cx: accX + el.width / 2,
        cy: accY + el.height / 2
    };
}

// Usage
if (el.style?.fillType === 'code') {
    const bounds = getWorldBounds(el, slide);
    div._codeRunner.setElementBounds(bounds);
}
```

---

## Performance Considerations

### 1. Throttled Updates
Only broadcast mouse state when it changes meaningfully:
```javascript
// Skip update if movement is less than 1 pixel
if (Math.abs(newX - lastX) < 1 && Math.abs(newY - lastY) < 1) {
    return;
}
```

### 2. Spatial Indexing
For slides with many CodeFill elements, use spatial indexing to only update those near the mouse:
```javascript
// Only update CodeRunners whose bounds are within 100px of mouse
mouseStateManager.updateNear(worldX, worldY, radius=100);
```

### 3. Frame Budget
CodeRunner mouse updates happen at animation frame rate. Each CodeRunner already has its own rAF loop, so mouse updates piggyback on that.

---

## Conflict Resolution & Safety

### Text Editing Conflict

When user is editing text (`editingElementId` is set), CodeFill mouse must be suppressed to prevent interference:

```javascript
// In CanvasManager.handleMouseMove()
handleMouseMove(e) {
    const state = store.getState();
    if (state.editor.mode === 'presentation') return;
    
    // CRITICAL: Suppress during text editing
    if (state.editor.editingElementId) {
        // Don't broadcast to CodeFill while typing
        return;
    }
    
    // ... rest of mouse handling
}
```

### Interaction State Suppression

During DRAGGING/RESIZING, suppress `isDown` to prevent accidental CodeFill interactions:

```javascript
// In CanvasManager - when broadcasting
mouseStateManager.update({
    // ...coordinates...
    
    // Suppress button during canvas operations
    isDown: (this.interactionState === 'IDLE') ? (e.buttons === 1) : false,
    
    // Also track if we're in a suppressed state
    suppressed: this.interactionState !== 'IDLE'
});
```

### InputManager Integration

Check if any input is active before broadcasting:

```javascript
import { InputManager } from './InputManager.js';

// In CanvasManager.handleMouseMove()
if (InputManager.isInputActive()) {
    // User is typing in a form field, suppress CodeFill mouse
    mouseStateManager.setEnabled(false);
} else {
    mouseStateManager.setEnabled(true);
}
```

### Memory Leak Prevention

Ensure proper cleanup in CodeRunner:

```javascript
class CodeRunner {
    constructor(canvas) {
        // ...
        this.unsubscribeMouse = null;
        this.isDestroyed = false;
    }
    
    play() {
        if (this.isDestroyed) return;  // Guard against zombie instances
        
        // Subscribe to mouse state
        if (!this.unsubscribeMouse) {
            this.unsubscribeMouse = mouseStateManager.subscribe(
                (state) => this.updateMouseState(state)
            );
        }
        // ...
    }
    
    stop() {
        // CRITICAL: Unsubscribe from mouse state
        if (this.unsubscribeMouse) {
            this.unsubscribeMouse();
            this.unsubscribeMouse = null;
        }
        // ...
    }
    
    destroy() {
        this.stop();
        this.isDestroyed = true;
        this.elementBounds = null;
        
        // Remove legacy DOM listeners (backward compat)
        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this.canvas.removeEventListener('mousedown', this._handleMouseDown);
        this.canvas.removeEventListener('mouseup', this._handleMouseUp);
    }
}
```

### Velocity Calculation Safety

Prevent division by zero:

```javascript
update(newState) {
    const dt = (newState.timestamp - this.state.timestamp) / 1000;
    
    // Guard against division by zero or very small dt
    if (dt > 0.001) {
        this.state.velocityX = (newState.worldX - this.state.worldX) / dt;
        this.state.velocityY = (newState.worldY - this.state.worldY) / dt;
    }
    // Else: keep previous velocity
    
    // ...
}
```

### Live Resize Handling

During text auto-resize, element bounds change rapidly. Debounce bounds updates:

```javascript
// In ShapeElement
setCodeRunnerBounds(runner, bounds) {
    // Debounce during rapid resize
    if (this._boundsUpdateTimeout) {
        clearTimeout(this._boundsUpdateTimeout);
    }
    
    this._boundsUpdateTimeout = setTimeout(() => {
        runner.setElementBounds(bounds);
    }, 16); // ~60fps
}
```

---

## Multi-Fill Layer Handling

Elements with multiple fills (`el.style.fills` array) each have their own CodeRunner. All layers share the same world-space bounds:

```javascript
// In ShapeElement.applyFills() for multi-fill case
if (fill.type === 'code') {
    // ... create canvas and runner ...
    
    // All layers share element bounds
    const bounds = getWorldBounds(el, slide);
    layer._codeRunner.setElementBounds(bounds);
}
```

---

## Security Considerations

1. **No DOM Access**: User code cannot access the `mouse` event object directly, preventing access to the window or other DOM elements.

2. **Sandboxed Execution**: The existing `new Function()` sandbox is maintained.

3. **No External References**: The mouse object is a plain data object with no methods that could be exploited.

---

## Backward Compatibility

### Existing CodeRunner Mouse Handlers

The current `CodeRunner.js` has direct DOM event listeners:

```javascript
// CURRENT (to be removed/deprecated)
this.canvas.addEventListener('mousemove', this._handleMouseMove);
this.canvas.addEventListener('mousedown', this._handleMouseDown);
this.canvas.addEventListener('mouseup', this._handleMouseUp);
```

**Problem**: These events NEVER fire because `#interaction-canvas` (z-index 100) intercepts all mouse events.

**Solution**: Remove these listeners and rely entirely on `MouseStateManager` broadcasts.

### Legacy Canvas Properties

Existing user code may reference:
- `canvas.mouseX`
- `canvas.mouseY`
- `canvas.isMouseDown`

These must continue to work. In `updateMouseState()`:

```javascript
updateMouseState(globalState) {
    // ... update this.mouse ...
    
    // BACKWARD COMPATIBILITY: Keep legacy canvas properties updated
    this.canvas.mouseX = this.mouse.x;
    this.canvas.mouseY = this.mouse.y;
    this.canvas.isMouseDown = this.mouse.isDown;
}
```

### New vs Old API

| Old API | New API | Notes |
|---------|---------|-------|
| `canvas.mouseX` | `mouse.x` | Both work |
| `canvas.mouseY` | `mouse.y` | Both work |
| `canvas.isMouseDown` | `mouse.isDown` | Both work |
| (none) | `mouse.nx`, `mouse.ny` | Normalized 0-1 |
| (none) | `mouse.pressed` | Click edge detection |
| (none) | `mouse.released` | Release edge detection |
| (none) | `mouse.vx`, `mouse.vy` | Velocity |
| (none) | `mouse.isOver` | Hover detection |

---

## Migration Path

### Phase 1: Core Infrastructure
1. Create `MouseStateManager.js`
2. Integrate with `CanvasManager.handleMouseMove`
3. Integrate with `PresentationManager`

### Phase 2: CodeRunner Enhancement
1. Add enhanced `mouse` object to CodeRunner
2. Add `setElementBounds()` method
3. Add `updateMouseState()` subscriber method
4. **Keep legacy canvas properties for backward compat**
5. **Remove dead DOM event listeners**

### Phase 3: Renderer Integration
1. Update `ShapeElement.applyFills()` to set bounds (with rotation)
2. Update `SlideView.applyBackground()` to set bounds
3. Handle grouped elements and nested transforms
4. Handle multi-fill layers

### Phase 4: AI Prompt Updates
1. Update `CODE_FILL_PROMPT` with mouse API documentation
2. Update `CODE_FILL_UPDATE_PROMPT` similarly
3. Add mouse-interactive preset examples

### Phase 5: Testing & Validation
1. Test in Edit mode (no conflict with selection)
2. Test in Master mode
3. Test in Presentation mode
4. Test with zoom/pan transforms
5. Test with grouped elements
6. Test with rotated elements
7. Test during text editing (should be suppressed)
8. Performance testing with many CodeFill elements

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/core/MouseStateManager.js` | NEW | Global mouse state broadcaster |
| `src/core/effects/CodeRunner.js` | MODIFY | Enhanced mouse API |
| `src/core/CanvasManager.js` | MODIFY | Broadcast mouse state |
| `src/core/PresentationManager.js` | MODIFY | Broadcast mouse state |
| `src/core/renderer/elements/ShapeElement.js` | MODIFY | Set element bounds |
| `src/core/renderer/SlideView.js` | MODIFY | Set element bounds |
| `src/core/ai/prompts/templates.js` | MODIFY | Update AI prompts |
| `src/core/constants/CodeFillPresets.js` | MODIFY | Add interactive presets |

---

## Appendix: Interactive Preset Examples

### Mouse Trail Preset
```javascript
{
    id: 'mouse-trail',
    name: 'Mouse Trail',
    description: 'Glowing trail that follows your cursor',
    category: 'built-in',
    interactive: true,
    code: `return {
    points: [],
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, w, h);
        
        if (mouse.isOver) {
            this.points.push({ x: mouse.x, y: mouse.y, age: 0 });
        }
        
        this.points = this.points.filter(p => {
            p.age += 0.02;
            if (p.age < 1) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 20 * (1 - p.age), 0, Math.PI * 2);
                ctx.fillStyle = \`hsla(\${t * 50 % 360}, 100%, 60%, \${1 - p.age})\`;
                ctx.fill();
                return true;
            }
            return false;
        });
    }
};`
}
```

### Click Ripple Preset
```javascript
{
    id: 'click-ripple',
    name: 'Click Ripple',
    description: 'Ripples expand from click position',
    category: 'built-in',
    interactive: true,
    code: `return {
    ripples: [],
    draw: function(t) {
        const w = canvas.width;
        const h = canvas.height;
        
        // Gradient background
        const grd = ctx.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, '#1a1a2e');
        grd.addColorStop(1, '#16213e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        
        if (mouse.pressed) {
            this.ripples.push({ x: mouse.x, y: mouse.y, r: 0, alpha: 1 });
        }
        
        this.ripples = this.ripples.filter(rip => {
            rip.r += 5;
            rip.alpha -= 0.02;
            
            if (rip.alpha > 0) {
                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
                ctx.strokeStyle = \`rgba(100, 200, 255, \${rip.alpha})\`;
                ctx.lineWidth = 3;
                ctx.stroke();
                return true;
            }
            return false;
        });
    }
};`
}
```

---

## Open Questions

1. **Touch Support**: Should we also handle touch events for tablet/mobile presentation mode?
   - Recommendation: Yes, in a future iteration. Map touch to mouse events.
   - Implementation: Add touch listeners to PresentationManager, convert `touches[0]` to mouse coords.

2. **Multi-touch**: Support for pinch/multi-finger gestures?
   - Recommendation: Out of scope for initial implementation.

3. **Right-click**: Should right-click be exposed to CodeFill?
   - Recommendation: No, reserve for context menus.

4. **Element Selection Conflict**: What if user wants to select an element that has interactive CodeFill?
   - Recommendation: In Edit mode, the first click always selects. Interaction only works when the element is already selected, or in Presentation mode.
   - **Alternative considered**: Hold a modifier key (Alt) for CodeFill interaction - rejected as too complex.

5. **Scale/Skew Transforms**: Should we support parent scale/skew transforms?
   - Recommendation: Out of scope. Only position and rotation are commonly used.
   - Risk: If implemented later, bounds calculation becomes significantly more complex.

6. **Bounds Update Frequency**: When should bounds be recalculated?
   - Current approach: On every `applyFills()` call.
   - Risk: May be called frequently during animations. Consider caching and dirty-flagging.

---

## Test Cases

### Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| MouseStateManager subscribe/unsubscribe | No memory leaks |
| Velocity calculation with 0 dt | No NaN/Infinity |
| isPointInRotatedBounds at 0° | Same as AABB |
| isPointInRotatedBounds at 45° | Correct diamond shape |
| Nested group bounds accumulation | Parent + child offsets correct |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Click on CodeFill in Edit mode (not selected) | Element selected, no CodeFill interaction |
| Click on CodeFill in Edit mode (selected) | CodeFill receives click |
| Mouse over CodeFill during DRAGGING | `isDown` is false |
| Mouse over CodeFill during text editing | No broadcast |
| Presentation mode mouse tracking | Full passthrough |
| CodeRunner stop/destroy | Subscriber removed |

### Visual Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Mouse Trail preset | Trail follows cursor smoothly |
| Click Ripple preset | Ripples spawn on click |
| Rotated element with interactive CodeFill | Correct hover boundary |
| Grouped element with interactive CodeFill | Correct world coords |
| Zoomed canvas (200%) | Correct world-to-canvas mapping |

---

## Decision Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Broadcast pattern over event forwarding | Simpler, no DOM manipulation, works across all modes | - |
| Suppress during DRAGGING/RESIZING | Prevents unintended CodeFill clicks during element manipulation | - |
| Include rotation in bounds | Correct hit-testing for rotated elements is essential for UX | - |
| Keep legacy canvas.mouseX/Y | Backward compatibility for existing code | - |
| Suppress during text editing | Typing interference is unacceptable UX | - |

