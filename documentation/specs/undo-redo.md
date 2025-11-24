# Undo/Redo System Specification

## 1. Overview
This document outlines the strategy for implementing a robust and scalable Undo/Redo system using a **Snapshot Pattern** with **Structural Sharing**. We will use **Immer.js** to manage immutable state transitions efficiently. This approach simplifies complex operations, ensures atomic restores, and avoids the fragility of the Command Pattern.

## 2. Architecture

### 2.1 History Manager (`src/core/HistoryManager.js`)
The `HistoryManager` maintains the timeline of state snapshots.
*   **Structure**: Stores a stack of History Entries.
    *   `undoStack`: Array of `{ state, meta }`.
    *   `redoStack`: Array of `{ state, meta }`.
*   **Adaptive Limits**:
    *   **Count Limit**: Default 50 snapshots.
    *   **Memory Limit**: (Future) Approximate memory usage (e.g., 200MB). Evict oldest if exceeded.
*   **Eviction**: Oldest snapshots are discarded. Optional hook for flushing to disk/server before eviction.

### 2.2 Store Integration (`src/core/Store.js`)
The `Store` will use `immer` for all state updates.
1.  **Immutable Transitions**: All handlers receive a `draft` state.
2.  **Snapshot Capture**:
    *   **Undoable Actions**: Push current state + metadata (selection, viewport) to `HistoryManager` *before* mutation.
    *   **Transient Actions**: Update state without pushing to history (e.g., during drag).
3.  **Restoration**: Replaces `this.state` with the snapshot and restores metadata.

## 3. Interaction Model

### 3.1 Discrete Actions
Simple actions (e.g., `ADD_SLIDE`, `CHANGE_COLOR`) trigger a snapshot immediately.

### 3.2 Hybrid / Continuous Interactions (Drag, Resize)
**Critical Requirement**: To avoid spamming history during high-frequency updates, we must implement interaction batching *before* enabling the snapshot system.
1.  **Interaction Start** (`mousedown`): Push current state to history. Mark "Interaction Active".
2.  **Interaction Update** (`mousemove`): Update state (replace current head) *without* pushing new history.
3.  **Interaction End** (`mouseup`): Finalize state.

## 4. State & Metadata

### 4.1 The Snapshot (Completeness)
The snapshot contains the core document model (`slides`, `masterSlides`, `theme`).
*   **Advantage**: Because we snapshot the entire state tree, we do **not** need to exhaustively track individual attributes. If a new property is added to a slide (e.g., `rotationZ`), it is automatically included in the snapshot without code changes.
*   **Scope**: Any data *inside* the Store's state tree is safe. Data *outside* (e.g., component local state, DOM state) is not.

### 4.2 Metadata (Selection & Viewport)
Selection and Viewport state are critical for UX but can be noisy if treated as document changes.
*   **Strategy**: Store `selection` and `viewport` (camera) in the `meta` field of the History Entry.
*   **Restore**: On Undo/Redo, restore the document state AND apply the saved selection/viewport.
*   **Configurable**: Users generally expect to return to the exact view they had.

## 5. Collaboration & External Resources

### 5.1 Collaboration (Future)
*   **Local Undo**: In a multiplayer environment, we cannot simply restore the global state (it would undo other users' work).
*   **Strategy**: Maintain a *local* undo stack of operations. When undoing, apply the inverse of the local operation transformed against the current global state (OT/CRDT).
*   **Current Scope**: Single-player snapshot restoration.

### 5.2 External Resources (Assets)
*   **Assets**: Images/Videos should be stored as references (URLs/IDs), not binary blobs, within the snapshot.
*   **Lifecycle Safety**:
    *   **Problem**: If a user deletes an image, and we delete the blob/URL, hitting "Undo" will result in a missing image.
    *   **Solution**: Implement **Reference Counting** or a "Soft Delete" policy. Assets should strictly *never* be deleted from the Asset Manager as long as they exist in the Undo/Redo stack.

## 6. Scalability & Optimization

### 6.1 Structural Sharing
Using `immer` ensures that snapshots share memory for unchanged parts of the state tree.
*   **Cost**: O(changes) rather than O(total_size).

### 6.2 Large Binary Data
*   **Rule**: Never store base64 strings or large buffers in the Redux/Immer state. Use an `AssetManager` and store IDs.

## 7. Implementation Strategy

### 7.1 Refactoring to Immutability
*   Wrap `Store` logic with `produce` from `immer`.
*   Handlers modify `draft`.

### 7.2 New Actions
*   `RESTORE_STATE`: Replaces root state.
*   `START_INTERACTION` / `END_INTERACTION`: For batching.

## 8. Plugin API
*   Plugins must register "Undoable" actions.
*   Plugins must ensure their state changes are captured within the main state tree or provide a mechanism to snapshot their external state.
