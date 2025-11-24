# Undo/Redo Implementation Plan

## Strategy: Hybrid Migration
We will migrate from the current **Mutable/Command** pattern to an **Immutable/Snapshot** pattern using `immer`. To avoid a "Big Bang" refactor that breaks the entire app, we will support a hybrid state in `Store.js` where some actions use Immer and others use direct mutation until the migration is complete.

## Phase 1: Infrastructure Setup
**Goal**: Install dependencies and prepare the Store for hybrid operation.

- [x] **1.1 Install Immer**
    - Since we are not using a bundler, download `immer.umd.js` to `src/vendor/` or use a CDN import map.
- [x] **1.2 Update Store.js for Hybrid Dispatch**
    - Import `produce` from `immer`.
    - Refactor `dispatch` to support a "New Way" (Immer) and "Old Way" (Mutation).
    - *Note*: We will not enable Undo/Redo yet, just state updates.
- [x] **1.3 Create SnapshotHistoryManager**
    - Create `src/core/HistoryManagerV2.js`.
    - Implement `push(state, meta)`, `undo()`, `redo()`.
    - Implement `maxSize` (e.g., 50).

## Phase 2: Handler Migration (Iterative)
**Goal**: Refactor handlers to be "Pure Producers" (taking `draft` state) instead of "Store Mutators".

*Dependencies*: Phase 1 complete.
*Risk*: Logic errors during translation.
*Verification*: Test each feature set immediately after migration.

- [x] **2.1 Migrate SlideHandlers** (`ADD_SLIDE`, `DELETE_SLIDE`, etc.)
    - Refactor functions in `SlideHandlers.js` to accept `(draft, payload)`.
    - Update `Store.js` cases to use `this.state = produce(this.state, draft => Handler(draft, payload))`.
- [x] **2.2 Migrate MasterHandlers** (`UPDATE_MASTER`, etc.)
    - Refactor `MasterHandlers.js`.
    - Update `Store.js`.
- [x] **2.3 Migrate ElementHandlers** (`ADD_ELEMENT`, `UPDATE_ELEMENT`, etc.)
    - Refactor `ElementHandlers.js`.
    - *Critical*: Ensure complex logic like `remapContent` is correctly adapted to Immer drafts.
- [x] **2.4 Migrate Editor/UI Handlers**
    - Refactor `EditorHandlers.js`, `UIHandlers.js`, `PresentationHandlers.js`.
    - Update `Store.js`.

## Phase 3: Enable Snapshot Undo/Redo
**Goal**: Switch the Undo/Redo mechanism from the old Command pattern to the new Snapshot pattern.

*Dependencies*: All handlers must be migrated to Immer (Phase 2 complete).

- [x] **3.1 Implement Transient Updates (Interaction Batching)**
    - *Critical*: Must be done before enabling history to prevent "drag spam".
    - Implement `START_INTERACTION` (snapshots state).
    - Ensure `UPDATE_ELEMENT` does *not* snapshot if an interaction is active.
    - Implement `END_INTERACTION` (finalizes state).
- [x] **3.2 Integrate HistoryManagerV2**
    - Replace `HistoryManager.js` with `HistoryManagerV2.js`.
- [x] **3.3 Implement Snapshot Capture**
    - In `Store.js`, define `UNDOABLE_ACTIONS` set.
    - Before calling `produce` for an undoable action, push `current state` + `meta` (selection) to History.
- [x] **3.4 Implement RESTORE_STATE**
    - Create a handler that simply returns the payload (the snapshot) as the new state.
    - Handle `meta` restoration (Selection, Viewport).
- [x] **3.5 Wire Undo/Redo Actions**
    - Update `UNDO` case: Pop from History -> Dispatch `RESTORE_STATE`.
    - Update `REDO` case: Pop from Redo Stack -> Dispatch `RESTORE_STATE`.

## Phase 4: Optimization & Cleanup
**Goal**: Clean up legacy code and optimize asset handling.

- [x] **4.1 Asset Lifecycle Safety**
    - Ensure `AssetManager` does not delete assets that might be referenced in the history stack.
    - *Note*: Assets are stored as Base64 strings in the state, so no external file management is needed.
- [x] **4.2 Cleanup**
    - Remove any legacy Command Pattern code from handlers.
    - Remove unused imports.
    - Replaced `HistoryManager.js` with `HistoryManagerV2.js` (renamed to `HistoryManager.js`).

## Risks & Dependencies
*   **Risk**: `this` context in handlers.
    *   *Mitigation*: Ensure new handlers are pure functions and do not rely on `this.emit` or `this.app`. Side effects should be handled in `Store.js` after the state update.
*   **Risk**: Object Identity.
    *   *Mitigation*: Immer creates new references. Ensure UI components (React-like or Vanilla) correctly detect changes. Our `SlideRenderer` currently re-renders aggressively, so this should be fine, but `useEffect` style logic in UI might need checking.
*   **Dependency**: `immer` library.
