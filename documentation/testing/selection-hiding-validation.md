# Selection Hiding Implementation - Testing & Validation Report

## Overview
Implemented selection overlay hiding during **any** property changes for cleaner visual feedback. Selection hides for non-text elements during all property modifications including Property Inspector interactions, canvas dragging, and canvas resizing. Selection remains visible only for text elements.

## Changes Made

### 1. GizmoRenderer.js
**File:** `src/core/canvas/GizmoRenderer.js`

**Changes:**
- Added logic in `renderGizmos()` to conditionally hide selection based on `state.ui.isInteracting`
- Text elements (type === 'text') are excluded from hiding behavior
- Multi-selection hides only if NO text elements are selected
- Added performance optimization: element type checking only when `isInteracting` is true
- Added debug logging to track isInteracting state changes

**Code Flow:**
```javascript
// Single Selection
const isPropertyChanging = isUIInteracting || isDragging || isResizing;
const hideSelection = isPropertyChanging && !isText;
if (!hideSelection) {
    this.drawSelectionBox(absEl, zoom, !hideHandles);
}

// Multi-Selection (Optimized)
const isPropertyChanging = isUIInteracting || isDragging || isResizing;
let hideSelection = false;
if (isPropertyChanging) {
    const hasTextElement = selectedElementIds.some(id => 
        slide.elements[id]?.type === 'text'
    );
    hideSelection = !hasTextElement;
}
```

### 2. Documentation Update
**File:** `documentation/01-specs/ui-system/property-inspector-v2/01-architecture.md`

**Added:** Rule 5 - Hide Selection Overlay During Property Changes
- Documents the behavior and exception for text elements
- Provides code examples
- Explains integration with `isInteracting` flag

### 3. Manual Test Suite
**File:** `tests/manual/selection-hiding-test.html`

**Created:** Comprehensive manual testing UI with 6 test scenarios:
1. Rectangle selection hiding
2. Text selection exception
3. Multi-selection without text
4. Multi-selection with text  
5. Performance validation (no jitter)
6. State inspection tools

## Testing Instructions

### Manual Testing (Recommended)
1. Start the dev server: `npm run dev`
2. Open browser to `http://localhost:5173/`
3. Open browser DevTools console to see debug logs
4. Test each scenario:

#### Test 1: Rectangle Selection Hiding (Property Inspector)
- Select a rectangle
- Open Property Inspector
- Scrub X/Y position or any other property
- **Expected:** Selection disappears while scrubbing, reappears on release
- **Debug:** Console should log "isInteracting changed: false → true"

#### Test 2: Rectangle Selection Hiding (Canvas Drag)
- Select a rectangle
- Drag it on the canvas
- **Expected:** Selection disappears during drag, reappears on release
- **Reason:** Cleaner visual feedback during any property change

#### Test 3: Rectangle Selection Hiding (Canvas Resize)
- Select a rectangle
- Drag a resize handle
- **Expected:** Selection disappears during resize, reappears on release
- **Reason:** Cleaner visual feedback during any property change

#### Test 4: Text Selection Exception (Property Inspector)
- Select a text element
- Scrub any property (X, Y, font size, etc.)
- **Expected:** Selection REMAINS visible during scrubbing
- **Reason:** Text needs visible boundaries for typography adjustments

#### Test 5: Text Selection Exception (Canvas Drag/Resize)
- Select a text element
- Drag it or resize it on canvas
- **Expected:** Selection REMAINS visible during interaction
- **Reason:** Text needs visible boundaries for layout feedback

#### Test 6: Multi-Selection (No Text)
- Select multiple rectangles/circles
- Scrub properties or drag on canvas
- **Expected:** All selections disappear during interaction

#### Test 7: Multi-Selection (With Text)
- Select text + rectangle
- Scrub properties or drag on canvas
- **Expected:** Selection REMAINS visible (text overrides hiding)

#### Test 8: Performance Check
- Select any element
- Rapidly scrub back and forth or drag/resize quickly
- **Expected:** Smooth movement, no stutter/lag/jitter
- **Watch for:** Selection hide/show should be instant

### Debugging Tools

**Check isInteracting State:**
```javascript
// In browser console:
store.getState().ui.isInteracting
```

**Monitor State Changes:**
The GizmoRenderer now logs interaction state changes:
```
[GizmoRenderer] isInteracting changed: false → true
[GizmoRenderer] isInteracting changed: true → false
```

## Performance Considerations

### Optimization Applied
**Problem:** Original implementation checked element types on every render frame (60fps)
```javascript
// BAD: Runs every frame
const hasTextElement = selectedElementIds.some(...)
const hideSelection = isPropertyChanging && !hasTextElement;
```

**Solution:** Only check types when actually changing properties
```javascript
// GOOD: Conditional check
const isPropertyChanging = isUIInteracting || isDragging || isResizing;
let hideSelection = false;
if (isPropertyChanging) {
    const hasTextElement = selectedElementIds.some(...);
    hideSelection = !hasTextElement;
}
```

**Impact:** 
- Eliminates unnecessary `.some()` iterations when idle
- Reduces CPU load during idle viewport rendering
- Prevents jitter during rapid property changes or canvas interactions
- Selection hiding works consistently across all property change types

## Known Issues & Troubleshooting

### Issue: Selection Not Hiding
**Symptoms:** Selection remains visible during scrubbing
**Possible Causes:**
1. `UI_INTERACTION_START` not dispatched correctly
2. `state.ui.isInteracting` not updating
3. Property input not using ScrubbableControl

**Debug Steps:**
1. Check console for "isInteracting changed" logs
2. Run `store.getState().ui.isInteracting` during scrub
3. Verify property input extends ScrubbableControl or dispatches actions

**Fix:**
Ensure property inputs dispatch correctly:
```javascript
// On mousedown:
store.dispatch('UI_INTERACTION_START');

// On mouseup:
store.dispatch('UI_INTERACTION_END');
```

### Issue: Performance/Jitter
**Symptoms:** Object movement is stuttery or "sticky"
**Possible Causes:**
1. Excessive re-renders in render loop
2. Blocking operations during interaction
3. Too many state checks per frame

**Debug Steps:**
1. Open Performance tab in DevTools
2. Record while scrubbing
3. Look for long frames (>16ms)
4. Check for repeated expensive operations

**Current Status:**
- Element type checking optimized (conditional)
- Render loop unchanged (requestAnimationFrame still runs)
- Selection drawing skipped when `hideSelection=true`

## Integration Points

### Existing Infrastructure Used
- **UI State Flag:** `state.ui.isInteracting`
- **Actions:** `UI_INTERACTION_START`, `UI_INTERACTION_END`
- **Components:** ScrubbableControl, NumberInput, Knob, SliderControl
- **Render Loop:** GizmoRenderer.render() (60fps via requestAnimationFrame)

### Files Involved
- `src/core/canvas/GizmoRenderer.js` - Selection rendering logic
- `src/core/store/handlers/UIHandlers.js` - isInteracting state management
- `src/ui/components/ScrubbableControl.js` - Dispatches interaction actions
- `src/ui/components/NumberInput.js` - Uses interaction actions
- `src/ui/components/Knob.js` - Uses interaction actions
- `src/ui/components/SliderControl.js` - Uses interaction actions

## Next Steps

### If Tests Pass
1. Remove debug console.log statements from GizmoRenderer
2. Mark feature as complete in IMPLEMENTATION-PLAN.md
3. Close related issues/tickets

### If Tests Fail
1. Review console logs for state changes
2. Check if UI_INTERACTION actions are being dispatched
3. Verify element type detection is correct
4. Profile performance with DevTools
5. Apply fixes and retest

## Acceptance Criteria

- [ ] Rectangle selection hides during property changes
- [ ] Text selection remains visible during property changes
- [ ] Multi-selection without text hides correctly
- [ ] Multi-selection with text remains visible
- [ ] No performance degradation (smooth 60fps)
- [ ] No jitter or sticky behavior during scrubbing
- [ ] Selection reappears immediately after interaction ends
- [ ] Console shows isInteracting state transitions
- [ ] Works with all property types (position, size, color, etc.)

## Code Review Checklist

- [ ] Logic correctly distinguishes text vs non-text elements
- [ ] Performance optimization (conditional type checking) in place
- [ ] No memory leaks (no event listener accumulation)
- [ ] Documentation updated with behavior specification
- [ ] Debug logging can be easily removed/disabled
- [ ] Edge cases handled (missing state.ui, undefined element types)
- [ ] Consistent with existing isInteracting guard patterns
