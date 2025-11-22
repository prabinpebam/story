# Implementation Plan: Undo/Redo System

## Phase 1: Core Infrastructure & Slide Operations
- [ ] **Review `HistoryManager.js`**
    - Ensure `push` clears the `redoStack`.
    - Verify stack limit logic.
- [ ] **Update `Store.js` - Slide Actions**
    - Implement `RESTORE_SLIDE` action handler.
    - Add Undo/Redo logic to `ADD_SLIDE`.
    - Add Undo/Redo logic to `DELETE_SLIDE`.
    - Add Undo/Redo logic to `DUPLICATE_SLIDE`.
    - Add Undo/Redo logic to `REORDER_SLIDES`.

## Phase 2: Basic Element Operations
- [ ] **Update `Store.js` - Element Actions**
    - Implement `RESTORE_ELEMENTS` action handler.
    - Add Undo/Redo logic to `REMOVE_ELEMENT`.
    - Add Undo/Redo logic to `PASTE_ELEMENTS`.
    - Add Undo/Redo logic to `REORDER_ELEMENTS`.
    - Add Undo/Redo logic to `TOGGLE_ELEMENT_LOCK` and `TOGGLE_ELEMENT_VISIBILITY`.

## Phase 3: Element Property Updates
- [ ] **Update `Store.js` - `UPDATE_ELEMENT`**
    - Locate `UPDATE_ELEMENT` handler (or equivalent).
    - Implement "diff" logic: Capture old values of properties being changed.
    - Construct inverse `UPDATE_ELEMENT` payload.
    - Push to history.
- [ ] **Update `Store.js` - `ALIGN_ELEMENTS`**
    - Capture positions of all selected elements.
    - Construct inverse `BATCH_UPDATE_ELEMENTS` payload.
    - Push to history.
- [ ] **Implement `BATCH_UPDATE_ELEMENTS`**
    - Create handler to update multiple elements atomically.

## Phase 4: Testing & Refinement
- [ ] **Test Slide Operations**: Add/Delete/Undo/Redo.
- [ ] **Test Element Operations**: Move/Resize/Color Change/Undo/Redo.
- [ ] **Test Group Operations**: Delete Group/Undo (ensure children return).
- [ ] **Verify Selection**: Ensure selection is reasonable after Undo (optional enhancement).
