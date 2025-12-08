# CodeFill Mouse Interaction - Implementation Plan

## Overview

This plan outlines the phased implementation of mouse interaction support for CodeFill canvas animations, enabling user code to respond to mouse movement, clicks, and drag gestures across all application modes.

---

## Critical Issues to Address

| Issue | Priority | Phase |
|-------|----------|-------|
| Rotation not handled in bounds calculation | 🔴 HIGH | Phase 3.1 |
| Nested group transforms not accumulated | 🔴 HIGH | Phase 3.1 |
| Text editing interference | 🔴 HIGH | Phase 1.2 |
| Existing DOM listeners are dead code | 🟡 MEDIUM | Phase 2.3 |
| Memory leak if unsubscribe not called | 🟡 MEDIUM | Phase 2.2 |
| Velocity division by zero | 🟡 MEDIUM | Phase 1.1 |
| Multi-fill layers need bounds | 🟡 MEDIUM | Phase 3.3 |

---

## Phase 1: Core Infrastructure

### 1.1 Create MouseStateManager

**File**: `src/core/MouseStateManager.js`

**Tasks**:
- [ ] Create singleton class with subscriber pattern
- [ ] Define mouse state structure (screenX, screenY, worldX, worldY, isDown, button, velocity, clicked, released)
- [ ] Implement `subscribe(callback)` and `unsubscribe()`
- [ ] Implement `update(newState)` with velocity calculation
- [ ] **FIX: Guard against division by zero in velocity calc**
- [ ] Implement `setEnabled(boolean)` for mode switching
- [ ] Export singleton instance

**Key Implementation Details**:
```javascript
// State structure
{
    screenX, screenY,     // Relative to viewport container
    worldX, worldY,       // Slide coordinates (accounting for pan/zoom)
    isDown, button,       // Button state
    velocityX, velocityY, // Pixels per second
    clicked, released,    // Edge detection (single-frame flags)
    suppressed,           // True during DRAGGING/RESIZING
    timestamp             // For velocity calculation
}

// Velocity safety
const dt = (newState.timestamp - this.state.timestamp) / 1000;
if (dt > 0.001) { // Guard against zero
    this.state.velocityX = (newState.worldX - this.state.worldX) / dt;
    // ...
}
```

**Estimated Time**: 1.5 hours

---

### 1.2 Integrate with CanvasManager

**File**: `src/core/CanvasManager.js`

**Tasks**:
- [ ] Import `mouseStateManager`
- [ ] In `handleMouseMove()`: Calculate world coordinates and call `mouseStateManager.update()`
- [ ] **FIX: Check `state.editor.editingElementId` - suppress if text editing**
- [ ] **FIX: Check `InputManager.isInputActive()` - suppress if any input focused**
- [ ] In `handleMouseDown()`: Update state with `isDown: true`
- [ ] In `handleMouseUp()`: Update state with `isDown: false`
- [ ] Suppress CodeFill mouse during DRAGGING/RESIZING states (set `isDown: false` in broadcast)

**Coordinate Transformation**:
```javascript
const { zoom, pan } = state.editor;
const worldX = (mouseX - pan.x) / zoom;
const worldY = (mouseY - pan.y) / zoom;
```

**Estimated Time**: 1.5 hours (increased for safety checks)

---

### 1.3 Integrate with PresentationManager

**File**: `src/core/PresentationManager.js`

**Tasks**:
- [ ] Import `mouseStateManager`
- [ ] Add `mousemove` listener for presentation mode
- [ ] Calculate world coordinates accounting for slide scaling/centering
- [ ] Add `mousedown` and `mouseup` listeners
- [ ] Ensure no conflict with laser pointer (laser uses separate canvas)

**Presentation Coordinate Calculation**:
```javascript
// Slide is centered and scaled to fit viewport
const scale = Math.min(viewportWidth / slideWidth, viewportHeight / slideHeight);
const offsetX = (viewportWidth - slideWidth * scale) / 2;
const offsetY = (viewportHeight - slideHeight * scale) / 2;

const worldX = (mouseX - offsetX) / scale;
const worldY = (mouseY - offsetY) / scale;
```

**Estimated Time**: 1 hour

---

## Phase 2: CodeRunner Enhancement

### 2.1 Enhanced Mouse State Object

**File**: `src/core/effects/CodeRunner.js`

**Tasks**:
- [ ] Expand `this.mouse` with full state properties:
  - `x, y` (canvas pixels)
  - `nx, ny` (normalized 0-1)
  - `px, py` (previous frame)
  - `isDown, pressed, released`
  - `vx, vy` (velocity)
  - `distFromCenter, angleFromCenter`
  - `isOver`
- [ ] Add `this.elementBounds = null`
- [ ] Add `setElementBounds(bounds)` method
- [ ] Add `updateMouseState(globalState)` method
- [ ] Remove old direct DOM event listeners (now handled globally)

**Estimated Time**: 1.5 hours

---

### 2.2 Subscriber Integration

**File**: `src/core/effects/CodeRunner.js`

**Tasks**:
- [ ] Add `this.unsubscribeMouse = null` property
- [ ] Add `this.isDestroyed = false` guard flag
- [ ] In `play()`: Subscribe to `mouseStateManager`, store unsubscribe function
- [ ] In `stop()`: **CRITICAL: Call `unsubscribeMouse()` to prevent memory leak**
- [ ] Add `destroy()` method for full cleanup
- [ ] In subscriber callback: Transform global state to local canvas coordinates
- [ ] **FIX: Use rotation-aware hit test for `isOver`**
- [ ] Calculate local position, velocity, distance from center

**Transformation Logic (with rotation)**:
```javascript
/**
 * Rotation-aware point-in-bounds check
 */
isPointInRotatedBounds(worldX, worldY, bounds) {
    if (!bounds.rotation) {
        // Fast path: simple AABB
        return worldX >= bounds.x && worldX <= bounds.x + bounds.width &&
               worldY >= bounds.y && worldY <= bounds.y + bounds.height;
    }
    
    // Rotate point around element center (inverse rotation)
    const rad = -bounds.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = worldX - bounds.cx;
    const dy = worldY - bounds.cy;
    const localX = dx * cos - dy * sin + bounds.cx;
    const localY = dx * sin + dy * cos + bounds.cy;
    
    return localX >= bounds.x && localX <= bounds.x + bounds.width &&
           localY >= bounds.y && localY <= bounds.y + bounds.height;
}

updateMouseState(globalState) {
    if (!this.isPlaying || !this.elementBounds) return;
    
    const bounds = this.elementBounds;
    
    // Use rotation-aware hit test
    this.mouse.isOver = this.isPointInRotatedBounds(
        globalState.worldX, globalState.worldY, bounds
    );
    
    // ... rest of update
}
```

**Estimated Time**: 1.5 hours (increased for rotation handling)

---

### 2.3 Remove Dead DOM Listeners & Add Mouse to Scope

**File**: `src/core/effects/CodeRunner.js`

**Tasks**:
- [ ] **CLEANUP: Remove `_handleMouseMove`, `_handleMouseDown`, `_handleMouseUp` methods**
- [ ] **CLEANUP: Remove `addEventListener` calls in constructor and `play()`**
- [ ] Keep legacy `canvas.mouseX`, `canvas.mouseY`, `canvas.isMouseDown` updated for backward compat
- [ ] In `run()`: Pass `mouse` object to user code scope
- [ ] Update the `new Function()` call to include `mouse` parameter
- [ ] Ensure `mouse` is accessible alongside `ctx`, `canvas`

**Updated Function Scope**:
```javascript
// Before:
func = new Function('ctx', 'canvas', 'width', 'height', 'time', code);

// After:
func = new Function('ctx', 'canvas', 'width', 'height', 'time', 'mouse', code);
result = func(this.ctx, this.canvas, this.canvas.width, this.canvas.height, 0, this.mouse);
```

**Estimated Time**: 30 minutes

---

## Phase 3: Renderer Integration

### 3.1 ShapeElement Bounds Synchronization (WITH ROTATION)

**File**: `src/core/renderer/elements/ShapeElement.js`

**Tasks**:
- [ ] Create `getWorldBounds(el, slide)` helper function
- [ ] **CRITICAL: Include `rotation` in bounds object**
- [ ] **CRITICAL: Include `cx`, `cy` (center point) for rotation pivot**
- [ ] **CRITICAL: Accumulate parent rotation when walking hierarchy**
- [ ] Handle parent rotation affecting child position (transform around parent center)
- [ ] Call `codeRunner.setElementBounds(bounds)` after creation/update
- [ ] Update bounds on element move/resize

**Bounds Calculation with Parent Transform AND Rotation**:
```javascript
function getWorldBounds(el, slide) {
    let accX = el.x;
    let accY = el.y;
    let accRotation = el.rotation || 0;
    
    // Walk up parent hierarchy
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
```

**Estimated Time**: 2 hours (increased for rotation complexity)

---

### 3.2 SlideView Background Bounds

**File**: `src/core/renderer/SlideView.js`

**Tasks**:
- [ ] In `applyBackground()`: Set bounds for background CodeRunner
- [ ] Bounds: `{ x: 0, y: 0, width: slideWidth, height: slideHeight, rotation: 0, cx: w/2, cy: h/2 }`
- [ ] Update on slide resize

**Estimated Time**: 30 minutes

---

### 3.3 Multi-Fill Layer Bounds

**File**: `src/core/renderer/elements/ShapeElement.js`

**Tasks**:
- [ ] For elements with multiple fills (`.fill-layer`), each CodeRunner needs same bounds as parent element
- [ ] Ensure each layer's CodeRunner receives bounds update
- [ ] Reuse `getWorldBounds()` helper

**Estimated Time**: 30 minutes

---

## Phase 4: AI Prompt Updates

### 4.1 Update CODE_FILL_PROMPT

**File**: `src/core/ai/prompts/templates.js`

**Tasks**:
- [ ] Document all `mouse` object properties in prompt
- [ ] Provide usage examples for common patterns:
  - Following cursor
  - Click to spawn
  - Drag interactions
  - Hover effects
- [ ] Emphasize that `mouse` is a global object like `ctx` and `canvas`

**Estimated Time**: 30 minutes

---

### 4.2 Update CODE_FILL_UPDATE_PROMPT

**File**: `src/core/ai/prompts/templates.js`

**Tasks**:
- [ ] Add mouse API reference
- [ ] Ensure updated code maintains mouse compatibility

**Estimated Time**: 15 minutes

---

## Phase 5: Preset Updates

### 5.1 Add Interactive Presets

**File**: `src/core/constants/CodeFillPresets.js`

**Tasks**:
- [ ] Add `Mouse Trail` preset
- [ ] Add `Click Ripple` preset
- [ ] Add `Mouse Attractor` preset (particles attracted to cursor)
- [ ] Add `Hover Glow` preset
- [ ] Add `interactive: true` flag to preset metadata

**Estimated Time**: 1.5 hours

---

### 5.2 Update Preset Card UI

**File**: `src/ui/components/FillFlyout/PresetCard.js`

**Tasks**:
- [ ] Add visual indicator for interactive presets (e.g., mouse icon badge)
- [ ] Optional: Show "Interactive" label in tooltip

**Estimated Time**: 30 minutes

---

## Phase 6: Testing & Edge Cases

### 6.1 Edit Mode Testing

**Tasks**:
- [ ] Test mouse interaction does NOT interfere with element selection
- [ ] Test interaction works when element is already selected
- [ ] Test with grouped elements
- [ ] Test with zoom/pan transforms
- [ ] Test with rotated elements

**Estimated Time**: 1 hour

---

### 6.2 Master Mode Testing

**Tasks**:
- [ ] Verify same behavior as Edit mode
- [ ] Test on master slide backgrounds
- [ ] Test on placeholder elements

**Estimated Time**: 30 minutes

---

### 6.3 Presentation Mode Testing

**Tasks**:
- [ ] Verify full mouse passthrough (no editor interference)
- [ ] Test with various slide aspect ratios
- [ ] Test with browser fullscreen
- [ ] Test laser pointer doesn't conflict

**Estimated Time**: 1 hour

---

### 6.4 Performance Testing

**Tasks**:
- [ ] Test with 10+ CodeFill elements on single slide
- [ ] Profile mouse state broadcast performance
- [ ] Implement throttling if needed
- [ ] Verify no memory leaks in subscribe/unsubscribe

**Estimated Time**: 1 hour

---

### 6.5 Conflict Testing (NEW)

**Tasks**:
- [ ] Test CodeFill suppression during text editing
- [ ] Test CodeFill suppression during element drag
- [ ] Test CodeFill suppression during element resize
- [ ] Test CodeFill suppression when input field is focused
- [ ] Test rotated element hover boundaries
- [ ] Test nested group coordinate transformation
- [ ] Test CodeRunner cleanup on element delete

**Estimated Time**: 1.5 hours

---

## Implementation Order

```
Week 1:
├── Phase 1.1: MouseStateManager (1.5h)
├── Phase 1.2: CanvasManager integration (1.5h) [increased]
├── Phase 1.3: PresentationManager integration (1h)
└── Phase 2.1: CodeRunner mouse state (1.5h)

Week 1-2:
├── Phase 2.2: CodeRunner subscriber with rotation (1.5h) [increased]
├── Phase 2.3: Cleanup dead listeners + user code scope (0.5h)
├── Phase 3.1: ShapeElement bounds with rotation (2h) [increased]
├── Phase 3.2: SlideView bounds (0.5h)
└── Phase 3.3: Multi-fill bounds (0.5h)

Week 2:
├── Phase 4.1: Update CODE_FILL_PROMPT (0.5h)
├── Phase 4.2: Update CODE_FILL_UPDATE_PROMPT (0.25h)
├── Phase 5.1: Interactive presets (1.5h)
├── Phase 5.2: Preset card UI (0.5h)
└── Phase 6: Testing (5h) [increased]
```

---

## Total Estimated Time

| Phase | Time |
|-------|------|
| Phase 1: Core Infrastructure | 4 hours |
| Phase 2: CodeRunner Enhancement | 3.5 hours |
| Phase 3: Renderer Integration | 3 hours |
| Phase 4: AI Prompt Updates | 0.75 hours |
| Phase 5: Preset Updates | 2 hours |
| Phase 6: Testing | 5 hours |
| **Total** | **~18 hours** |

---

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `src/core/MouseStateManager.js` | Global mouse state broadcaster |
| `documentation/tech-specs/codefill-mouse-interaction.md` | Tech spec |
| `documentation/plans/codefill-mouse-interaction-plan.md` | This plan |

### Modified Files
| File | Changes |
|------|---------|
| `src/core/effects/CodeRunner.js` | Enhanced mouse API, subscriber, remove dead listeners |
| `src/core/CanvasManager.js` | Broadcast mouse state, suppress during editing |
| `src/core/PresentationManager.js` | Broadcast mouse state |
| `src/core/renderer/elements/ShapeElement.js` | Set element bounds with rotation |
| `src/core/renderer/SlideView.js` | Set background bounds |
| `src/core/ai/prompts/templates.js` | Document mouse API |
| `src/core/constants/CodeFillPresets.js` | Add interactive presets |
| `src/ui/components/FillFlyout/PresetCard.js` | Interactive indicator |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance degradation with many CodeFills | Medium | High | Implement spatial indexing, throttle updates |
| Conflict with existing mouse handlers | Medium | High | Careful state management, mode-aware behavior |
| AI generates code using old mouse API | Low | Medium | Clear prompts, backward compatibility |
| Bounds calculation incorrect for nested groups | Medium | Medium | Comprehensive testing, recursive traversal |
| **Rotated element hit-test incorrect** | High | High | **Rotation-aware bounds + inverse transform** |
| **Memory leaks from unsubscribe** | Medium | High | **Guard flags, destroy() method** |
| **Text editing interference** | Medium | High | **Check editingElementId before broadcast** |

---

## Success Criteria

1. ✅ Mouse movement is tracked correctly in all modes
2. ✅ Click events are detected and exposed to user code
3. ✅ Mouse interaction does not interfere with element selection in Edit mode
4. ✅ Presentation mode has full mouse interactivity
5. ✅ AI-generated code can use mouse API correctly
6. ✅ At least 3 interactive presets available
7. ✅ No performance regression with multiple CodeFill elements
8. ✅ **Rotated elements have correct hover boundaries**
9. ✅ **No memory leaks after repeated play/stop cycles**
10. ✅ **Text editing is not interfered with by CodeFill mouse**
