# Master Slide Drag & Drop Manual Validation

## Overview
This document provides a comprehensive manual testing checklist for the Master slide drag and drop functionality implementation.

## Prerequisites
1. Start the dev server: `npm run dev`
2. Open the application in browser: `http://localhost:5173` (or appropriate port)
3. Switch to Master mode using the Story menu → Slide → Edit Master

## Test Cases

### 1. Visual Indicator - Top Half Hover
**Objective**: Verify drop indicator appears above master when hovering over top half

**Steps**:
1. Navigate to Master mode
2. Start dragging the first master thumbnail
3. Move cursor to hover over the top 50% of the second master thumbnail
4. Observe the drop indicator

**Expected Results**:
- ✓ Blue/accent colored line appears ABOVE the second master (top edge)
- ✓ Line is 3px high, spans full width of thumbnail
- ✓ Z-index is 1000 (appears over other elements)
- ✓ `drop-before` class is applied to the target element

### 2. Visual Indicator - Bottom Half Hover
**Objective**: Verify drop indicator appears below master when hovering over bottom half

**Steps**:
1. Navigate to Master mode
2. Start dragging the first master thumbnail
3. Move cursor to hover over the bottom 50% of the second master thumbnail
4. Observe the drop indicator

**Expected Results**:
- ✓ Blue/accent colored line appears BELOW the second master (bottom edge)
- ✓ Line is 3px high, spans full width of thumbnail
- ✓ Z-index is 1000 (appears over other elements)
- ✓ `drop-after` class is applied to the target element

### 3. Indicator Position Switching
**Objective**: Verify indicator updates dynamically when crossing midpoint

**Steps**:
1. Navigate to Master mode
2. Start dragging the first master thumbnail
3. Hover over top half of second master (observe "before" indicator)
4. Without releasing mouse, slowly move to bottom half
5. Cross the horizontal midpoint line

**Expected Results**:
- ✓ Indicator smoothly switches from top (before) to bottom (after)
- ✓ No flickering or visual glitches
- ✓ Class changes from `drop-before` to `drop-after`

### 4. Indicator Clearing
**Objective**: Verify indicator disappears when leaving target

**Steps**:
1. Navigate to Master mode
2. Start dragging first master
3. Hover over second master (observe indicator)
4. Move cursor completely away from second master to an empty area

**Expected Results**:
- ✓ Indicator disappears completely
- ✓ No orphaned indicators remain
- ✓ Both `drop-before` and `drop-after` classes are removed

### 5. No Self-Indicator
**Objective**: Verify no indicator appears on the master being dragged

**Steps**:
1. Navigate to Master mode
2. Click and start dragging first master
3. Observe the first master itself during drag

**Expected Results**:
- ✓ NO indicator appears on the dragged master itself
- ✓ Dragged master has `dragging` class with opacity: 0.4
- ✓ Custom drag preview shows (80px × 60px)

### 6. Successful Reordering - Insert Before
**Objective**: Verify master can be moved before another master

**Steps**:
1. Navigate to Master mode
2. Note the initial order of masters (e.g., A, B, C, D)
3. Drag master A
4. Hover over TOP half of master C
5. Release mouse button

**Expected Results**:
- ✓ Order changes to: B, A, C, D
- ✓ Master A is now positioned before C
- ✓ `masterDisplayOrder` array is updated in state
- ✓ UI immediately reflects new order
- ✓ REORDER_MASTERS action is dispatched

### 7. Successful Reordering - Insert After
**Objective**: Verify master can be moved after another master

**Steps**:
1. Navigate to Master mode
2. Note the initial order of masters (e.g., A, B, C, D)
3. Drag master A
4. Hover over BOTTOM half of master C
5. Release mouse button

**Expected Results**:
- ✓ Order changes to: B, C, A, D
- ✓ Master A is now positioned after C
- ✓ `masterDisplayOrder` array is updated in state
- ✓ UI immediately reflects new order
- ✓ REORDER_MASTERS action is dispatched

### 8. Reorder Persistence
**Objective**: Verify reordered masters persist after page reload

**Steps**:
1. Navigate to Master mode
2. Perform a reorder operation (drag first to last position)
3. Note the new order
4. Reload the page (F5 or Ctrl+R)
5. Switch back to Master mode
6. Observe the master order

**Expected Results**:
- ✓ Order is maintained after reload
- ✓ `masterDisplayOrder` is saved to localStorage/state
- ✓ Masters render in reordered sequence
- ✓ No reversion to original order

### 9. Multiple Reorders
**Objective**: Verify multiple sequential reorder operations work correctly

**Steps**:
1. Navigate to Master mode
2. Drag master A to position after B → Order: B, A, C, D
3. Drag master D to position before B → Order: D, B, A, C
4. Drag master C to position after D → Order: D, C, B, A

**Expected Results**:
- ✓ Each reorder operation works independently
- ✓ Final order is D, C, B, A
- ✓ No state corruption
- ✓ `masterDisplayOrder` accurately reflects all changes

### 10. Edge Case - Same Position Drop
**Objective**: Verify no change when dropping master in its current position

**Steps**:
1. Navigate to Master mode
2. Drag master B
3. Drop it in its exact current position (between A and C)

**Expected Results**:
- ✓ No state change occurs
- ✓ Order remains: A, B, C, D
- ✓ No unnecessary re-renders
- ✓ No console errors

### 11. Drag Cancel with Escape
**Objective**: Verify drag can be cancelled

**Steps**:
1. Navigate to Master mode
2. Start dragging a master
3. Press ESC key while dragging

**Expected Results**:
- ✓ Drag operation is cancelled
- ✓ Master returns to original position
- ✓ All indicators are cleared
- ✓ No state changes occur

### 12. Visual Feedback During Drag
**Objective**: Verify proper visual feedback throughout drag operation

**Steps**:
1. Navigate to Master mode
2. Click and hold on a master thumbnail
3. Move cursor while holding

**Expected Results**:
- ✓ Original thumbnail has reduced opacity (0.4)
- ✓ Custom drag preview follows cursor (80px × 60px)
- ✓ Cursor shows appropriate drag cursor
- ✓ Drop indicators appear on valid targets

## Browser Testing Matrix

Test in the following browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Implementation Verification Checklist

### Code Files Modified:
- [x] `src/ui/SlideList.js` - Added master drag handlers
- [x] `src/core/Store.js` - Added REORDER_MASTERS case
- [x] `src/core/store/handlers/MasterHandlers.js` - Added handleReorderMasters
- [x] `styles/modules/components.css` - Existing drop indicator styles apply

### Key Implementation Details:
- [x] Drag events: dragstart, dragend, dragover, dragleave, drop
- [x] Custom drag preview: 80px × 60px canvas rendering
- [x] `masterDisplayOrder` array for sequencing
- [x] Insert before/after logic using splice
- [x] Proper event stopPropagation
- [x] Bounds checking for clientX/clientY

## Notes
- Master thumbnails use `data-master-id` attribute for identification
- Drop indicators reuse existing `.drop-before` and `.drop-after` CSS classes
- Implementation mirrors normal slide drag-drop behavior
- State management uses Immer for immutable updates

## Issue Reporting
If any test fails, please document:
1. Test case number and name
2. Steps performed
3. Expected vs actual result
4. Browser and version
5. Console errors (if any)
6. Screenshots/screen recording

## Sign-off
- [ ] All test cases passed
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance is acceptable
- [ ] Code reviewed

**Tester**: ________________  
**Date**: ________________  
**Build/Commit**: ________________
